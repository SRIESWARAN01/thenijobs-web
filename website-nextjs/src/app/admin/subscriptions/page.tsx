'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Bell,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  Loader2,
  Search,
  TrendingUp,
  XCircle,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  UserCheck
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useCollection } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import {
  YEARLY_PLAN_BY_SLUG,
  YEARLY_SUBSCRIPTION_PLANS,
  getDaysUntilExpiry,
  getEffectiveSubscriptionStatus,
  getRenewalEndDate,
  normalizePlanSlug,
  toDate,
  type SubscriptionStatus,
  type VisibleSubscriptionPlanSlug,
} from '@/lib/subscriptions';
import { isActiveJobSlot } from '@/lib/jobPolicy';

interface SubscriptionDoc {
  id: string;
  userId: string;
  companyId?: string;
  audience?: 'employer' | 'seeker' | 'business' | 'service';
  userName?: string;
  requesterName?: string;
  displayName?: string;
  businessName?: string;
  companyName?: string;
  email?: string;
  requesterEmail?: string;
  mobile?: string;
  phone?: string;
  requesterPhone?: string;
  plan?: string;
  planName?: string;
  amount?: number;
  status?: SubscriptionStatus | 'trial';
  startDate?: unknown;
  endDate?: unknown;
  paymentDate?: unknown;
  autoRenew?: boolean;
  paymentMethod?: string;
}

interface PaymentRequestDoc {
  id: string;
  userId: string;
  companyId?: string;
  audience: 'employer' | 'seeker';
  plan: string;
  planName?: string;
  amount: number;
  period?: string;
  status: 'pending' | 'approved' | 'rejected';
  businessName?: string;
  companyName?: string;
  requesterName?: string;
  requesterEmail?: string;
  requesterPhone?: string;
  requestedAt?: unknown;
  createdAt?: unknown;
}

interface PaymentDoc {
  id: string;
  userName?: string;
  businessName?: string;
  companyName?: string;
  amount: number;
  plan?: string;
  paymentMethod?: string;
  status: string;
  createdAt?: unknown;
}

const PLAN_CONFIG: Record<VisibleSubscriptionPlanSlug, { label: string; bg: string; text: string }> = {
  free: { label: 'Free Plan', bg: 'bg-slate-500/15', text: 'text-slate-300' },
  basic: { label: 'Standard Plan', bg: 'bg-cyan-500/15', text: 'text-cyan-300' },
  premium: { label: 'Premium Plan', bg: 'bg-amber-500/15', text: 'text-amber-300' },
  enterprise: { label: 'Enterprise Plan', bg: 'bg-purple-500/15', text: 'text-purple-300' },
};

const PLAN_OPTIONS = [
  { value: 'all', label: 'All Plans' },
  { value: 'free', label: 'Free Plan Users' },
  { value: 'basic', label: 'Standard Plan Users' },
  { value: 'premium', label: 'Premium Plan Users' },
  { value: 'enterprise', label: 'Enterprise Plan Users' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending_renewal', label: 'Pending Renewal' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  pending_renewal: { label: 'Pending Renewal', bg: 'bg-amber-500/15', text: 'text-amber-300', dot: 'bg-amber-300' },
  expired: { label: 'Expired', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400' },
};

const INITIAL_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
];

function formatDate(value?: unknown, fallback = 'Not set') {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getInitials(name?: string) {
  return name ? name.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) : 'US';
}

function getInitialColor(name?: string) {
  const code = (name || '').charCodeAt(0) || 0;
  return INITIAL_COLORS[code % INITIAL_COLORS.length];
}

async function findExistingSubscription(request: PaymentRequestDoc) {
  const constraints = request.companyId
    ? [where('companyId', '==', request.companyId), where('plan', '==', normalizePlanSlug(request.plan))]
    : [where('userId', '==', request.userId), where('plan', '==', normalizePlanSlug(request.plan))];

  const snapshot = await getDocs(query(collection(db, 'subscriptions'), ...constraints, limit(1)));
  if (snapshot.empty) return null;
  const subscription = snapshot.docs[0];
  return { id: subscription.id, ...subscription.data() } as SubscriptionDoc;
}

export default function SubscriptionsPage() {
  const { data: subscriptions, loading: subsLoading } = useCollection<SubscriptionDoc>('subscriptions');
  const { data: payments, loading: paymentsLoading } = useCollection<PaymentDoc>('payments', [
    orderBy('createdAt', 'desc'),
    limit(10),
  ]);
  const { data: paymentRequests, loading: requestsLoading } = useCollection<PaymentRequestDoc>('paymentRequests', [
    orderBy('requestedAt', 'desc'),
    limit(30),
  ]);
  const { data: changeLogs, loading: logsLoading } = useCollection<any>('subscriptionChangeLogs', [
    orderBy('changedAt', 'desc'),
    limit(20)
  ]);
  const { data: jobs } = useCollection<any>('jobs');
  const { data: applications } = useCollection<any>('applications');

  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Subscription Override Module states
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedSubForOverride, setSelectedSubForOverride] = useState<SubscriptionDoc | null>(null);
  const [overrideNewPlan, setOverrideNewPlan] = useState<VisibleSubscriptionPlanSlug>('free');
  const [overrideDuration, setOverrideDuration] = useState<'1m_trial' | '3m_trial' | '1y' | 'custom'>('3m_trial');
  const [overrideCustomDate, setOverrideCustomDate] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideAdminName, setOverrideAdminName] = useState('System Admin');
  const [overrideAutoRefresh, setOverrideAutoRefresh] = useState(true);
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  // Sync logged in admin name
  useEffect(() => {
    if (currentUser?.displayName) {
      setOverrideAdminName(currentUser.displayName);
    } else if (currentUser?.email) {
      setOverrideAdminName(currentUser.email);
    }
  }, [currentUser]);

  const rows = useMemo(() => subscriptions.map((sub) => {
    const plan = normalizePlanSlug(sub.plan || sub.planName);
    const status = getEffectiveSubscriptionStatus(sub as any);
    const userName = sub.userName || sub.requesterName || sub.displayName || 'User';
    const companyName = sub.companyName || sub.businessName || (sub.audience === 'seeker' ? 'Job Seeker' : 'Company');
    const email = sub.email || sub.requesterEmail || '';
    const mobile = sub.mobile || sub.phone || sub.requesterPhone || '';
    const daysUntilExpiry = getDaysUntilExpiry(sub.endDate);
    const relatedJobs = jobs.filter((job) => (
      (sub.companyId && job.companyId === sub.companyId) ||
      (!sub.companyId && job.postedBy === sub.userId)
    ));
    const relatedCompanyIds = new Set(relatedJobs.map((job) => job.companyId).filter(Boolean));
    const activeJobs = relatedJobs.filter((job) => isActiveJobSlot(job)).length;
    const totalApplications = applications.filter((app) => (
      (sub.companyId && app.companyId === sub.companyId) ||
      relatedCompanyIds.has(app.companyId)
    )).length;

    return {
      ...sub,
      plan,
      status,
      userName,
      companyName,
      email,
      mobile,
      daysUntilExpiry,
      activeJobs,
      totalApplications,
    };
  }), [applications, jobs, subscriptions]);

  const pendingRequests = paymentRequests.filter((request) => request.status === 'pending');

  const handleApproveRequest = async (request: PaymentRequestDoc) => {
    setActionLoading(`approve-${request.id}`);
    setActionMessage(null);

    try {
      const planSlug = normalizePlanSlug(request.plan);
      const plan = YEARLY_PLAN_BY_SLUG[planSlug];
      const existing = await findExistingSubscription(request);
      const now = new Date();
      const endDate = getRenewalEndDate(existing?.endDate, now);
      const subscriptionId = existing?.id || `${request.companyId || request.userId}_${planSlug}`;
      const requesterName = request.requesterName || request.businessName || request.companyName || (request.audience === 'seeker' ? 'Candidate' : 'Business');
      const companyName = request.businessName || request.companyName || (request.audience === 'seeker' ? 'Job Seeker' : requesterName);
      const amount = Number(request.amount) || plan.price;
      const batch = writeBatch(db);

      batch.set(doc(db, 'subscriptions', subscriptionId), {
        userId: request.userId,
        ...(request.companyId ? { companyId: request.companyId } : {}),
        audience: request.audience,
        userName: requesterName,
        companyName,
        businessName: companyName,
        email: request.requesterEmail || '',
        mobile: request.requesterPhone || '',
        plan: planSlug,
        planName: plan.name,
        amount,
        period: 'year',
        status: 'active',
        startDate: existing?.startDate ? existing.startDate : Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endDate),
        paymentDate: serverTimestamp(),
        autoRenew: false,
        paymentMethod: 'manual_approval',
        paymentRequestId: request.id,
        expiryReminderDaysSent: [],
        updatedAt: serverTimestamp(),
        ...(existing ? {} : { createdAt: serverTimestamp() }),
      }, { merge: true });

      batch.set(doc(collection(db, 'payments')), {
        userId: request.userId,
        ...(request.companyId ? { companyId: request.companyId } : {}),
        audience: request.audience,
        userName: requesterName,
        businessName: companyName,
        companyName,
        plan: plan.name,
        planSlug,
        period: 'year',
        paymentMethod: 'manual_approval',
        amount,
        status: 'approved',
        paymentRequestId: request.id,
        createdAt: serverTimestamp(),
      });

      batch.update(doc(db, 'paymentRequests', request.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (request.audience === 'employer' && request.companyId) {
        batch.update(doc(db, 'companies', request.companyId), {
          isPremium: planSlug === 'premium',
          subscriptionPlan: planSlug,
          subscriptionStatus: 'active',
          subscriptionStartsAt: Timestamp.fromDate(now),
          subscriptionEndsAt: Timestamp.fromDate(endDate),
          updatedAt: serverTimestamp(),
        });
      }

      if (request.audience === 'seeker') {
        batch.set(doc(db, 'seekerProfiles', request.userId), {
          isPremium: planSlug === 'premium',
          premiumPlan: planSlug,
          premiumUntil: Timestamp.fromDate(endDate),
          subscriptionPlan: planSlug,
          subscriptionStatus: 'active',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      await batch.commit();
      setActionMessage(`${plan.name} approved. Expiry set to ${formatDate(Timestamp.fromDate(endDate))}.`);
    } catch (err) {
      console.error('Payment request approval error:', err);
      setActionMessage('Unable to approve request. Check the console for details.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (request: PaymentRequestDoc) => {
    setActionLoading(`reject-${request.id}`);
    setActionMessage(null);

    try {
      await updateDoc(doc(db, 'paymentRequests', request.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActionMessage(`${request.planName || request.plan} request rejected.`);
    } catch (err) {
      console.error('Payment request rejection error:', err);
      setActionMessage('Unable to reject request. Check the console for details.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOverrideSubmit = async () => {
    if (!selectedSubForOverride) return;
    setOverrideSubmitting(true);
    try {
      const sub = selectedSubForOverride;
      const now = new Date();
      let endDate = new Date(now);

      if (overrideDuration === '1m_trial') {
        endDate.setMonth(now.getMonth() + 1);
      } else if (overrideDuration === '3m_trial') {
        endDate.setMonth(now.getMonth() + 3);
      } else if (overrideDuration === '1y') {
        endDate.setFullYear(now.getFullYear() + 1);
      } else if (overrideCustomDate) {
        endDate = new Date(overrideCustomDate);
      }

      const batch = writeBatch(db);
      const planName = {
        free: 'Free Plan',
        basic: 'Basic Plan',
        premium: 'Premium Plan',
        enterprise: 'Enterprise Plan',
      }[overrideNewPlan];

      // 1. Update/Set Subscription document
      batch.set(doc(db, 'subscriptions', sub.id), {
        userId: sub.userId,
        ...(sub.companyId ? { companyId: sub.companyId } : {}),
        audience: sub.audience || 'business',
        userName: sub.userName,
        companyName: sub.companyName,
        businessName: sub.companyName,
        email: sub.email || '',
        mobile: sub.mobile || '',
        plan: overrideNewPlan,
        planName: planName,
        amount: 0, // Override/Trial has 0 amount
        period: 'year',
        status: 'active',
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endDate),
        paymentDate: serverTimestamp(),
        autoRenew: false,
        paymentMethod: 'admin_override',
        expiryReminderDaysSent: [],
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 2. If employer/business, update company profile document
      if (sub.audience !== 'seeker' && sub.companyId) {
        batch.update(doc(db, 'companies', sub.companyId), {
          isPremium: overrideNewPlan === 'premium',
          subscriptionPlan: overrideNewPlan,
          subscriptionStatus: 'active',
          subscriptionStartsAt: Timestamp.fromDate(now),
          subscriptionEndsAt: Timestamp.fromDate(endDate),
          updatedAt: serverTimestamp(),
        });
      }

      // 3. If seeker, update seeker profile document
      if (sub.audience === 'seeker') {
        batch.set(doc(db, 'seekerProfiles', sub.userId), {
          isPremium: overrideNewPlan === 'premium',
          premiumPlan: overrideNewPlan,
          premiumUntil: Timestamp.fromDate(endDate),
          subscriptionPlan: overrideNewPlan,
          subscriptionStatus: 'active',
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      // 4. Save Audit Change Log
      const logRef = doc(collection(db, 'subscriptionChangeLogs'));
      batch.set(logRef, {
        userId: sub.userId,
        companyId: sub.companyId || '',
        userName: sub.userName,
        companyName: sub.companyName,
        previousPlan: sub.plan || 'free',
        newPlan: overrideNewPlan,
        durationLabel: overrideDuration === '1m_trial' ? '1 Month Trial' : overrideDuration === '3m_trial' ? '3 Month Trial' : overrideDuration === '1y' ? '1 Year Activation' : 'Custom Expiry',
        adminName: overrideAdminName || 'System Admin',
        reason: overrideReason || 'Manual Admin Override',
        changedAt: serverTimestamp(),
      });

      await batch.commit();
      setActionMessage(`Plan successfully overridden for ${sub.userName}.`);
      setOverrideModalOpen(false);

      if (overrideAutoRefresh) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Error overriding subscription:', err);
      alert('Failed to override subscription. Check console for details.');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const handlePreview = async (companyId: string) => {
    try {
      const snap = await getDocs(query(collection(db, 'companies'), where('id', '==', companyId), limit(1)));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        const slug = data.slug || companyId;
        window.open(`/company/${slug}`, '_blank');
      } else {
        window.open(`/company/${companyId}`, '_blank');
      }
    } catch (err) {
      window.open(`/company/${companyId}`, '_blank');
    }
  };

  const filteredRows = rows.filter((sub) => {
    const haystack = `${sub.userName} ${sub.companyName} ${sub.email} ${sub.mobile}`.toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || sub.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const activeRows = rows.filter((sub) => sub.status === 'active' || sub.status === 'pending_renewal');
  const yearlyRevenue = activeRows.reduce((sum, sub) => sum + (Number(sub.amount) || 0), 0);
  const pendingRenewalCount = rows.filter((sub) => sub.status === 'pending_renewal').length;
  const expiredCount = rows.filter((sub) => sub.status === 'expired').length;
  const cancelledCount = rows.filter((sub) => sub.status === 'cancelled').length;

  const due30 = rows.filter((sub) => typeof sub.daysUntilExpiry === 'number' && sub.daysUntilExpiry >= 0 && sub.daysUntilExpiry <= 30).length;
  const due7 = rows.filter((sub) => typeof sub.daysUntilExpiry === 'number' && sub.daysUntilExpiry >= 0 && sub.daysUntilExpiry <= 7).length;
  const due1 = rows.filter((sub) => typeof sub.daysUntilExpiry === 'number' && sub.daysUntilExpiry >= 0 && sub.daysUntilExpiry <= 1).length;

  const stats = [
    { label: 'Yearly Active Revenue', value: `₹${yearlyRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'emerald', trend: 'Live' },
    { label: 'Active Benefits', value: activeRows.length, icon: CreditCard, color: 'cyan', trend: 'Live' },
    { label: 'Pending Renewal', value: pendingRenewalCount, icon: Clock, color: 'amber', trend: '30d' },
    { label: 'Expired / Cancelled', value: expiredCount + cancelledCount, icon: XCircle, color: 'rose', trend: 'Auto' },
  ];

  const statColorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-300' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-400' },
  };

  const totalCount = rows.length || 1;
  const planDistribution = YEARLY_SUBSCRIPTION_PLANS.map((plan) => {
    const count = rows.filter((sub) => sub.plan === plan.slug).length;
    const colors = {
      free: ['bg-slate-500', 'text-slate-300'],
      basic: ['bg-cyan-500', 'text-cyan-300'],
      premium: ['bg-amber-500', 'text-amber-300'],
      enterprise: ['bg-purple-500', 'text-purple-300'],
    }[plan.slug];

    return {
      plan: plan.name,
      count,
      pct: Math.round((count / totalCount) * 100),
      color: colors[0],
      textColor: colors[1],
    };
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Subscription Management</h1>
          <p className="mt-1 text-sm text-gray-400">Track yearly plans, override packages, payments, and renewals</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-gray-300 transition-all hover:bg-white/[0.08] hover:border-white/[0.15]">
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => {
          const colors = statColorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 transition-all hover:border-white/[0.15]">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
                  <Icon size={18} className={colors.text} />
                </div>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-gray-400">
                  {stat.trend}
                </span>
              </div>
              <p className="mt-3 text-xl font-bold text-white font-outfit">{stat.value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card rounded-2xl p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Plan Distribution</h2>
          <div className="mb-4 flex h-4 w-full overflow-hidden rounded-full bg-white/[0.06]">
            {planDistribution.map((item) => (
              <div key={item.plan} className={`h-full ${item.color}`} style={{ width: `${item.pct || 5}%` }} title={`${item.plan}: ${item.count}`} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {planDistribution.map((item) => (
              <div key={item.plan} className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${item.color}`} />
                <span className="text-xs text-gray-400">{item.plan}</span>
                <span className={`text-xs font-bold ${item.textColor}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Expiry Analytics</h2>
            <CalendarClock size={17} className="text-amber-300" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['30 days', due30],
              ['7 days', due7],
              ['1 day', due1],
            ].map(([label, count]) => (
              <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="mt-1 text-[10px] text-gray-500">Due in {label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/15 bg-amber-500/10 p-3">
            <Bell size={14} className="mt-0.5 shrink-0 text-amber-300" />
            <p className="text-xs leading-relaxed text-amber-100/80">
              Automated reminders are scheduled for 30 days, 7 days, and 1 day before expiry.
            </p>
          </div>
        </div>
      </div>

      {/* PENDING PAYMENT REQUESTS */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="flex flex-col gap-2 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Pending Payment Requests</h2>
            <p className="mt-0.5 text-xs text-gray-500">Approve yearly upgrades and renewals</p>
          </div>
          <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
            {pendingRequests.length} Pending
          </span>
        </div>

        {actionMessage && (
          <div className="mx-5 mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
            {actionMessage}
          </div>
        )}

        {requestsLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 size={24} className="animate-spin text-violet-400" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">No pending payment requests.</div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {pendingRequests.map((request) => {
              const requesterName = request.requesterName || request.businessName || request.companyName || (request.audience === 'seeker' ? 'Candidate' : 'Business');
              const approving = actionLoading === `approve-${request.id}`;
              const rejecting = actionLoading === `reject-${request.id}`;
              const disabled = actionLoading !== null;

              return (
                <div key={request.id} className="flex flex-col gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                      <Clock size={17} className="text-amber-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-white">{requesterName}</p>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase text-gray-400">
                          {request.audience}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {request.planName || request.plan} · Yearly · {formatDate(request.requestedAt || request.createdAt, 'Recent')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 lg:justify-end">
                    <div className="text-left lg:text-right">
                      <p className="text-sm font-bold text-white">₹{Number(request.amount || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-gray-500">Manual approval</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApproveRequest(request)}
                        disabled={disabled}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {approving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(request)}
                        disabled={disabled}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {rejecting ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by user, company, email, or mobile..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="search-input w-full py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={planFilter}
            onChange={setPlanFilter}
            options={PLAN_OPTIONS}
            placeholder="All Plans"
            className="w-48"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="All Status"
            className="w-48"
          />
        </div>
      </div>

      {/* SUBSCRIBERS LIST TABLE */}
      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">Subscribers</h2>
        </div>
        <div className="overflow-x-auto">
          {subsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="mb-4 animate-spin text-violet-400" />
              <p className="text-sm text-gray-400">Loading subscribers...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">User Name</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Company Name</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Contact</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Selected Plan</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Usage</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Expiry Date</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredRows.map((sub) => {
                  const planCfg = PLAN_CONFIG[sub.plan];
                  const statusCfg = STATUS_CONFIG[sub.status];
                  const initials = getInitials(sub.userName);
                  const initialBg = getInitialColor(sub.userName);

                  return (
                    <tr key={sub.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${initialBg}`}>
                            <span className="text-xs font-bold text-white">{initials}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{sub.userName}</p>
                            <p className="text-[10px] text-gray-500">{sub.audience || 'user'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-300">{sub.companyName}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-300">{sub.email || 'No email'}</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">{sub.mobile || 'No mobile'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${planCfg.bg} ${planCfg.text}`}>
                          {planCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-300">Active jobs: {sub.activeJobs}</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">Applications: {sub.totalApplications}</p>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{formatDate(sub.paymentDate || sub.startDate)}</td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-gray-400">{formatDate(sub.endDate)}</p>
                        {typeof sub.daysUntilExpiry === 'number' && sub.daysUntilExpiry >= 0 && (
                          <p className="mt-0.5 text-[10px] text-gray-600">{sub.daysUntilExpiry} days left</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubForOverride(sub);
                              setOverrideNewPlan(sub.plan as any);
                              setOverrideReason('');
                              setOverrideModalOpen(true);
                            }}
                            className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-400 hover:bg-purple-500/20 transition-all cursor-pointer"
                          >
                            Override
                          </button>
                          {sub.companyId && (
                            <button
                              type="button"
                              onClick={() => handlePreview(sub.companyId!)}
                              className="rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] px-2 py-1 text-xs font-medium text-slate-300 transition-all flex items-center gap-0.5"
                              title="Preview business website"
                            >
                              <ExternalLink size={10} /> Preview
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!subsLoading && filteredRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
              <CreditCard size={28} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400">No subscriptions found</p>
            <p className="mt-1 text-xs text-gray-600">Try adjusting your filters</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* RECENT PAYMENTS */}
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Recent Payments</h2>
          </div>
          {paymentsLoading ? (
            <div className="flex justify-center p-5">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">No payments recorded yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{payment.userName || payment.businessName || payment.companyName || 'User'}</p>
                    <p className="text-[10px] text-gray-500">{payment.plan || 'Plan'} · {payment.paymentMethod || 'Manual'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-emerald-400">₹{Number(payment.amount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-gray-500">{formatDate(payment.createdAt, 'Recent')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AUDIT LOGS: SUBSCRIPTION OVERRIDE CHANGE LOGS */}
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Subscription Change Logs (Audit)</h2>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-slate-400">Security Logging</span>
          </div>
          {logsLoading ? (
            <div className="flex justify-center p-5">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          ) : changeLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">No override logs recorded yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.04] max-h-[380px] overflow-y-auto">
              {changeLogs.map((log: any) => (
                <div key={log.id} className="p-4 transition-colors hover:bg-white/[0.02] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1">
                      <UserCheck size={11} className="text-purple-400" /> {log.adminName}
                    </span>
                    <span className="text-slate-500 text-[10px]">{formatDate(log.changedAt)}</span>
                  </div>
                  <div className="text-[11px] text-slate-350">
                    Modified <span className="text-white font-bold">{log.userName || log.companyName || 'Business User'}</span> plan: 
                    <span className="text-slate-500 line-through mx-1">{log.previousPlan}</span> ➔ 
                    <span className="text-purple-400 font-bold ml-1">{log.newPlan}</span> ({log.durationLabel})
                  </div>
                  {log.reason && (
                    <p className="text-[10px] text-slate-500 bg-white/[0.01] border border-white/[0.04] rounded-lg p-1.5 mt-1">
                      Note: {log.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OVERRIDE MODAL DIALOG */}
      {overrideModalOpen && selectedSubForOverride && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-4 font-outfit text-white relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <Sparkles size={16} className="text-purple-400" /> Subscription Plan Override
              </h3>
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Info */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs space-y-1">
              <div>Name: <span className="font-bold text-white">{selectedSubForOverride.userName}</span></div>
              <div>Company: <span className="font-bold text-white">{selectedSubForOverride.companyName || 'None'}</span></div>
              <div>Current Plan: <span className="font-bold text-purple-400 uppercase">{selectedSubForOverride.plan}</span></div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              {/* Target Plan */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['free', 'basic', 'premium'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOverrideNewPlan(p)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors uppercase ${
                        overrideNewPlan === p
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'border-white/5 text-slate-450 bg-white/[0.01]'
                      }`}
                    >
                      {p === 'basic' ? 'Standard' : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry Duration / Trial */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Trial / Expiry Period</label>
                <select
                  value={overrideDuration}
                  onChange={(e: any) => setOverrideDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white outline-none"
                >
                  <option value="1m_trial">1 Month Trial (Trial Activation)</option>
                  <option value="3m_trial">3 Month Trial (Trial Activation)</option>
                  <option value="1y">1 Year Activation</option>
                  <option value="custom">Custom Expiry Date</option>
                </select>
              </div>

              {/* Custom Date Input */}
              {overrideDuration === 'custom' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Custom Expiry Date</label>
                  <input
                    type="date"
                    value={overrideCustomDate}
                    onChange={(e) => setOverrideCustomDate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white outline-none"
                  />
                </div>
              )}

              {/* Reason / Notes */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Reason / Notes (Audit log)</label>
                <textarea
                  placeholder="e.g. Free trial token activation for testing..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-white/10 p-3 text-xs rounded-xl text-white outline-none resize-none"
                />
              </div>

              {/* Admin Name */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Authorizing Admin Name</label>
                <input
                  type="text"
                  value={overrideAdminName}
                  onChange={(e) => setOverrideAdminName(e.target.value)}
                  placeholder="Admin Name"
                  className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white outline-none"
                />
              </div>

              {/* Auto Refresh Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-refresh"
                  checked={overrideAutoRefresh}
                  onChange={(e) => setOverrideAutoRefresh(e.target.checked)}
                  className="rounded border-white/10 bg-slate-950 text-purple-600 focus:ring-0 w-3.5 h-3.5"
                />
                <label htmlFor="auto-refresh" className="text-xs text-slate-400 cursor-pointer">
                  Auto-refresh page on update completion
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="flex-1 py-2.5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverrideSubmit}
                disabled={overrideSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {overrideSubmitting && <Loader2 size={13} className="animate-spin" />}
                Confirm Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
