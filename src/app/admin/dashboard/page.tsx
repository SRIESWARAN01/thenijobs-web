'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Building2, Briefcase, FileText, TrendingUp,
  CreditCard, Eye, Clock, CheckCircle, XCircle,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity,
  UserPlus, Building, BriefcaseBusiness, Star,
  ChevronRight, BadgeCheck, ShieldAlert, Globe, Loader2,
  ShoppingBag, Package, Crown, Phone,
} from 'lucide-react';
import { usePlatformStats } from '@/hooks/useRealtimeStats';
import { useCollection } from '@/hooks/useFirestore';
import {
  approveCompany,
  rejectCompany,
  approveJob,
  rejectJob,
  getActivityLogs,
} from '@/lib/firebase/firestoreService';
import { getShopStats } from '@/lib/firebase/shopService';
import { useAuth } from '@/hooks/useAuth';
import { where, orderBy, limit, getDocs, collection, query, writeBatch, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  YEARLY_PLAN_BY_SLUG,
  getRenewalEndDate,
  normalizePlanSlug,
} from '@/lib/subscriptions';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// Color map for stat cards
const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', glow: 'shadow-violet-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/20' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', glow: 'shadow-rose-500/20' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-500/20' },
};

// Animated counter hook
function useAnimatedCount(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function StatCard({ label, value, icon: Icon, color, prefix = '', href }: {
  label: string; value: number; icon: any; color: string; prefix?: string; href: string;
}) {
  const count = useAnimatedCount(value);
  const colors = colorMap[color];

  const formatValue = (val: number) => {
    if (prefix === '₹') return `₹${val.toLocaleString('en-IN')}`;
    return val.toLocaleString('en-IN');
  };

  return (
    <Link href={href} className="block group">
      <div className={`glass-card rounded-2xl p-5 hover:border-white/15 transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-lg ${colors.glow}`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon size={20} className={colors.text} />
          </div>
        </div>
        <p className="text-2xl font-bold text-white font-outfit">{formatValue(count)}</p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = usePlatformStats();
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [shopStats, setShopStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0 });
  const [activeBiTab, setActiveBiTab] = useState('overview'); // overview, rankings, revenue, leads, audit

  // Query companies for rankings & tier counts (capped at 500 most recent)
  const { data: allCompanies, loading: allCompaniesLoading } = useCollection<any>('companies', [
    orderBy('createdAt', 'desc'),
    limit(500),
  ]);

  // Query payments for revenue dashboard (capped at 500 most recent)
  const { data: allPayments, loading: paymentsLoading } = useCollection<any>('payments', [
    orderBy('createdAt', 'desc'),
    limit(500),
  ]);

  // Query all leads for lead analytics (capped at 500 most recent)
  const { data: allLeads, loading: leadsLoading } = useCollection<any>('leads', [
    orderBy('createdAt', 'desc'),
    limit(500),
  ]);

  // Pending companies for approval
  const { data: pendingCompanies, loading: companiesLoading } = useCollection<any>(
    'companies',
    [where('verificationStatus', '==', 'pending')],
  );

  // Pending jobs for approval
  const { data: pendingJobs, loading: jobsLoading } = useCollection<any>(
    'jobs',
    [where('isActive', '==', false)],
  );

  // Pending payment requests for subscription approval
  const { data: pendingRequests, loading: requestsLoading } = useCollection<any>(
    'paymentRequests',
    [where('status', '==', 'pending')],
  );

  // Pending applications for platform-wide over-7-days alert
  const { data: allPendingApplications } = useCollection<any>(
    'jobApplications',
    [where('status', 'in', ['applied', 'pending_review', 'resume_viewed', 'under_review'])],
  );

  const adminPendingOver7DaysCount = useMemo(() => {
    if (!allPendingApplications) return 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return allPendingApplications.filter((app: any) => {
      const appDate = (app.appliedDate || app.createdAt)?.seconds 
        ? new Date((app.appliedDate || app.createdAt).seconds * 1000) 
        : (app.appliedDate || app.createdAt)?.toDate 
          ? (app.appliedDate || app.createdAt).toDate() 
          : new Date(app.appliedDate || app.createdAt || Date.now());
      return appDate < sevenDaysAgo;
    }).length;
  }, [allPendingApplications]);

  // Fetch recent activity logs
  useEffect(() => {
    async function loadActivities() {
      try {
        const logs = await getActivityLogs(30); // fetch more logs for BI logs tab
        setActivities(logs);
      } catch (err) {
        console.error('Error loading activities:', err);
      } finally {
        setActivitiesLoading(false);
      }
    }
    loadActivities();
  }, []);

  // Fetch shop stats
  useEffect(() => {
    async function loadShopStats() {
      try {
        const s = await getShopStats();
        setShopStats({
          totalOrders: s.totalOrders,
          totalRevenue: s.totalRevenue,
          pendingOrders: s.pendingOrders,
        });
      } catch (err) {
        console.error('Error loading shop stats:', err);
      }
    }
    loadShopStats();
  }, []);

  // Combine pending items for display
  const pendingApprovals = [
    ...pendingCompanies.map((c: any) => ({
      id: c.id,
      name: c.name || 'Unnamed Business',
      type: 'business' as const,
      category: c.category || 'General',
      district: c.district || 'Unknown',
      date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently',
    })),
    ...pendingJobs.slice(0, 5).map((j: any) => ({
      id: j.id,
      name: j.title || 'Unnamed Job',
      type: 'job' as const,
      company: j.companyName || 'Unknown',
      district: j.district || 'Unknown',
      date: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : 'Recently',
    })),
    ...pendingRequests.map((r: any) => ({
      id: r.id,
      name: `${r.requesterName || 'User'} (${r.planName || r.plan})`,
      type: 'subscription' as const,
      company: `₹${r.amount} · ${r.audience === 'seeker' ? 'Seeker' : 'Employer'}`,
      district: r.companyName || 'Personal Request',
      date: r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : 'Recently',
      raw: r,
    })),
  ].slice(0, 8);

  async function findExistingSubscription(request: any) {
    const constraints = request.companyId
      ? [where('companyId', '==', request.companyId), where('plan', '==', normalizePlanSlug(request.plan))]
      : [where('userId', '==', request.userId), where('plan', '==', normalizePlanSlug(request.plan))];

    const snapshot = await getDocs(query(collection(db, 'subscriptions'), ...constraints, limit(1)));
    if (snapshot.empty) return null;
    const subscription = snapshot.docs[0];
    return { id: subscription.id, ...subscription.data() } as any;
  }

  // Action handlers
  const handleApprove = async (id: string, type: 'business' | 'job' | 'subscription', raw?: any) => {
    setActionLoading(id);
    try {
      if (type === 'business') {
        await approveCompany(id, user?.uid || 'admin');
      } else if (type === 'job') {
        await approveJob(id, user?.uid || 'admin');
      } else if (type === 'subscription' && raw) {
        const request = raw;
        const planSlug = normalizePlanSlug(request.plan);
        const plan = YEARLY_PLAN_BY_SLUG[planSlug];
        const existing: any = await findExistingSubscription(request);
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
            isPremium: planSlug === 'premium' || planSlug === 'enterprise',
            subscriptionPlan: planSlug,
            subscriptionStatus: 'active',
            subscriptionStartsAt: Timestamp.fromDate(now),
            subscriptionEndsAt: Timestamp.fromDate(endDate),
            updatedAt: serverTimestamp(),
          });
        }

        if (request.audience === 'seeker') {
          batch.set(doc(db, 'seekerProfiles', request.userId), {
            isPremium: planSlug === 'premium' || planSlug === 'enterprise',
            premiumPlan: planSlug,
            premiumUntil: Timestamp.fromDate(endDate),
            subscriptionPlan: planSlug,
            subscriptionStatus: 'active',
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }

        await batch.commit();
        alert(`Subscription for ${requesterName} approved successfully!`);
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string, type: 'business' | 'job' | 'subscription') => {
    setActionLoading(id);
    try {
      if (type === 'business') {
        await rejectCompany(id, user?.uid || 'admin');
      } else if (type === 'job') {
        await rejectJob(id, user?.uid || 'admin');
      } else if (type === 'subscription') {
        const batch = writeBatch(db);
        batch.update(doc(db, 'paymentRequests', id), {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        alert('Subscription request rejected.');
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  // Map activity action to icon
  const getActivityIcon = (action: string) => {
    if (action.includes('registered') || action.includes('user')) return UserPlus;
    if (action.includes('approved') || action.includes('Business')) return BadgeCheck;
    if (action.includes('posted') || action.includes('Job')) return BriefcaseBusiness;
    if (action.includes('flagged') || action.includes('review')) return ShieldAlert;
    if (action.includes('upgrade') || action.includes('subscription')) return Star;
    if (action.includes('lead')) return TrendingUp;
    return Activity;
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    let date: Date;
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    }
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  // BI Calculations: Subscriptions distribution
  const subStats = useMemo(() => {
    let free = 0, standard = 0, premium = 0, enterprise = 0;
    allCompanies.forEach(c => {
      const plan = c.subscriptionPlan || 'free';
      if (plan === 'basic') standard++;
      else if (plan === 'premium') premium++;
      else if (plan === 'enterprise') enterprise++;
      else free++;
    });
    return { free, standard, premium, enterprise };
  }, [allCompanies]);

  // BI Calculations: Rankings
  const rankings = useMemo(() => {
    const list = [...allCompanies];
    const topPerforming = [...list].sort((a, b) => {
      const valA = (a.visitCount || 0) + (a.whatsappClickCount || 0) * 3 + (a.callClickCount || 0) * 3;
      const valB = (b.visitCount || 0) + (b.whatsappClickCount || 0) * 3 + (b.callClickCount || 0) * 3;
      return valB - valA;
    }).slice(0, 5);

    const mostViewed = [...list].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0)).slice(0, 5);
    const mostContacted = [...list].sort((a, b) => {
      const valA = (a.whatsappClickCount || 0) + (a.callClickCount || 0);
      const valB = (b.whatsappClickCount || 0) + (b.callClickCount || 0);
      return valB - valA;
    }).slice(0, 5);

    const mostReviewed = [...list].sort((a, b) => (b.reviewSubmitCount || 0) - (a.reviewSubmitCount || 0)).slice(0, 5);
    const highestConversion = [...list].filter(c => (c.visitCount || 0) > 0).sort((a, b) => {
      const rateA = (a.contactSubmitCount || 0) / a.visitCount;
      const rateB = (b.contactSubmitCount || 0) / b.visitCount;
      return rateB - rateA;
    }).slice(0, 5);

    return { topPerforming, mostViewed, mostContacted, mostReviewed, highestConversion };
  }, [allCompanies]);

  // BI Calculations: Revenue Breakdowns
  const revenueStats = useMemo(() => {
    let totalRevenue = 0;
    let standardPlanRev = 0;
    let premiumPlanRev = 0;
    let enterprisePlanRev = 0;
    const businessRevMap: Record<string, number> = {};

    allPayments.forEach(p => {
      const amt = Number(p.amount) || 0;
      totalRevenue += amt;
      const planSlug = normalizePlanSlug(p.plan || p.planSlug || 'free');
      if (planSlug === 'basic') standardPlanRev += amt;
      else if (planSlug === 'premium') premiumPlanRev += amt;
      else if (planSlug === 'enterprise') enterprisePlanRev += amt;

      const bizName = p.businessName || p.companyName || 'Personal / Seeker';
      businessRevMap[bizName] = (businessRevMap[bizName] || 0) + amt;
    });

    const topBusinessesByRevenue = Object.entries(businessRevMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalRevenue,
      standardPlanRev,
      premiumPlanRev,
      enterprisePlanRev,
      topBusinessesByRevenue,
      pendingRequestsAmount: pendingRequests.reduce((acc, r) => acc + (Number(r.amount) || 0), 0),
    };
  }, [allPayments, pendingRequests]);

  // BI Calculations: Leads Analysis
  const leadsStats = useMemo(() => {
    const total = allLeads.length;
    let whatsappLeads = 0;
    let callLeads = 0;
    let formLeads = 0;
    
    // Check fields on leads and group them
    allLeads.forEach(l => {
      if (l.source === 'whatsapp' || l.type === 'whatsapp') whatsappLeads++;
      else if (l.source === 'call' || l.type === 'call') callLeads++;
      else formLeads++;
    });

    return { total, whatsappLeads, callLeads, formLeads };
  }, [allLeads]);

  const statsConfig = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'violet', prefix: '', href: '/admin/users' },
    { label: 'Active Users', value: stats.activeUsers, icon: Activity, color: 'purple', prefix: '', href: '/admin/users' },
    { label: 'Paid Users', value: stats.paidUsers, icon: Crown, color: 'amber', prefix: '', href: '/admin/businesses' },
    { label: 'Total Revenue', value: revenueStats.totalRevenue, icon: CreditCard, color: 'rose', prefix: '₹', href: '#' },
    { label: 'Total Applications', value: stats.totalApplications, icon: FileText, color: 'cyan', prefix: '', href: '/admin/jobs' },
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'emerald', prefix: '', href: '/admin/jobs' },
    { label: 'Companies Registered', value: stats.totalCompanies, icon: Building2, color: 'cyan', prefix: '', href: '/admin/businesses' },
  ];

  return (
    <div className="space-y-6 font-outfit text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">BI Control Center</h1>
          <p className="text-sm text-gray-400 mt-1">Platform analytics, user tracking, revenue auditing and rankings</p>
        </div>
      </div>

      {adminPendingOver7DaysCount > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 animate-pulse">
          <AlertTriangle size={20} className="text-amber-400" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-amber-300">Pending Applications Alert</p>
            <p className="text-gray-300 mt-0.5 font-medium">
              There are <span className="text-amber-400 font-bold">{adminPendingOver7DaysCount}</span> applications pending review for more than 7 days.
            </p>
          </div>
          <Link href="/admin/jobs" className="text-[10px] uppercase font-bold text-amber-400 whitespace-nowrap bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-colors">
            Manage Jobs
          </Link>
        </div>
      )}

      {/* BI Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-white/[0.06] no-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'rankings', label: 'Business Rankings' },
          { id: 'revenue', label: 'Revenue & Billing' },
          { id: 'leads', label: 'Lead Intelligence' },
          { id: 'audit', label: 'Audit Activities' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveBiTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeBiTab === tab.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25 border border-violet-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeBiTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {statsConfig.map((card, i) => (
              <StatCard key={i} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Pending Approvals Queue */}
            <div className="xl:col-span-2 glass-card rounded-2xl overflow-hidden border border-white/[0.06]">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" /> Pending Approval Pipeline
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-black">
                  {pendingApprovals.length}
                </span>
              </div>
              {companiesLoading || jobsLoading ? (
                <div className="p-5 space-y-3">
                  <Loader2 size={24} className="text-violet-400 animate-spin mx-auto" />
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
                  <p className="text-xs text-gray-400">All caught up! No items pending admin approvals.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {pendingApprovals.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/[0.04]`}>
                        {item.type === 'business' ? <Building2 size={16} className="text-cyan-400" /> : item.type === 'job' ? <Briefcase size={16} className="text-emerald-400" /> : <CreditCard size={16} className="text-violet-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {item.type === 'business' ? (item as any).category : (item as any).company} · {item.district} · {item.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {actionLoading === item.id ? (
                          <Loader2 size={14} className="text-violet-400 animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(item.id, item.type, (item as any).raw)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleReject(item.id, item.type)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Reject"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Platform summary stats */}
            <div className="glass-card rounded-2xl p-5 border border-white/[0.06] space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-violet-400" /> Platform Summary
              </h2>
              <div className="space-y-3.5">
                {[
                  { label: 'Registered Businesses', value: stats.totalBusinesses, color: 'text-cyan-400' },
                  { label: 'Active Jobs', value: stats.activeJobs, color: 'text-emerald-400' },
                  { label: 'Pending payment approvals', value: pendingRequests.length, color: 'text-amber-400' },
                  { label: 'Total Job Applications', value: stats.totalApplications, color: 'text-purple-400' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <span className={`text-sm font-bold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RANKINGS TAB */}
      {activeBiTab === 'rankings' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Performing Businesses */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] space-y-4 bg-gradient-to-br from-violet-500/5 to-transparent">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crown size={15} className="text-yellow-400" /> Top Performing Businesses (Activity Rank)
            </h3>
            <div className="space-y-3">
              {rankings.topPerforming.map((biz, idx) => (
                <div key={biz.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xs font-black text-gray-500 w-5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{biz.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{biz.category} · {biz.district}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">{(biz.visitCount || 0) + (biz.whatsappClickCount || 0) * 3 + (biz.callClickCount || 0) * 3} points</div>
                    <div className="text-[9px] text-gray-600">Views: {biz.visitCount || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Highest Lead Conversion Rate */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-400" /> Highest Lead Conversion Businesses
            </h3>
            <div className="space-y-3">
              {rankings.highestConversion.map((biz, idx) => {
                const rate = ((biz.contactSubmitCount || 0) / biz.visitCount * 100).toFixed(1);
                return (
                  <div key={biz.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-xs font-black text-gray-500 w-5">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">{biz.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Views: {biz.visitCount} · Enquiries: {biz.contactSubmitCount || 0}</div>
                    </div>
                    <span className="text-xs font-bold text-violet-400">{rate}% conv.</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Most Viewed Businesses */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye size={15} className="text-cyan-400" /> Most Viewed Businesses
            </h3>
            <div className="space-y-3">
              {rankings.mostViewed.map((biz, idx) => (
                <div key={biz.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xs font-black text-gray-500 w-5">#{idx + 1}</span>
                  <span className="text-xs font-bold text-white flex-1 truncate">{biz.name}</span>
                  <span className="text-xs font-bold text-gray-400">{biz.visitCount || 0} views</span>
                </div>
              ))}
            </div>
          </div>

          {/* Most Contacted (Call + WhatsApp) */}
          <div className="glass-card rounded-2xl p-6 border border-white/[0.06] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Phone size={15} className="text-green-400" /> Most Contacted Businesses
            </h3>
            <div className="space-y-3">
              {rankings.mostContacted.map((biz, idx) => (
                <div key={biz.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <span className="text-xs font-black text-gray-500 w-5">#{idx + 1}</span>
                  <span className="text-xs font-bold text-white flex-1 truncate">{biz.name}</span>
                  <span className="text-xs font-bold text-green-400">
                    {(biz.whatsappClickCount || 0) + (biz.callClickCount || 0)} clicks
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. REVENUE TAB */}
      {activeBiTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue metrics row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Earnings', value: `₹${revenueStats.totalRevenue.toLocaleString()}`, color: 'text-emerald-400' },
              { label: 'Standard Plan Revenue', value: `₹${revenueStats.standardPlanRev.toLocaleString()}`, color: 'text-cyan-400' },
              { label: 'Premium Plan Revenue', value: `₹${revenueStats.premiumPlanRev.toLocaleString()}`, color: 'text-violet-400' },
              { label: 'Pending Approval Payments', value: `₹${revenueStats.pendingRequestsAmount.toLocaleString()}`, color: 'text-amber-400' },
            ].map(item => (
              <div key={item.label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-xs text-gray-400 font-bold">{item.label}</div>
                <div className={`mt-3 text-2xl font-black ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Subscription Tiers Distribution */}
            <div className="glass-card rounded-2xl p-6 border border-white/[0.06] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users size={15} className="text-violet-400" /> Subscription Plan Tier Distribution
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Free Plan Users', count: subStats.free, percent: ((subStats.free / Math.max(1, allCompanies.length)) * 100).toFixed(0), color: 'bg-gray-500' },
                  { label: 'Standard (Blue Tick) Users', count: subStats.standard, percent: ((subStats.standard / Math.max(1, allCompanies.length)) * 100).toFixed(0), color: 'bg-blue-500' },
                  { label: 'Premium (Yellow Tick) Users', count: subStats.premium, percent: ((subStats.premium / Math.max(1, allCompanies.length)) * 100).toFixed(0), color: 'bg-yellow-500' },
                  { label: 'Enterprise/Pro Users', count: subStats.enterprise, percent: ((subStats.enterprise / Math.max(1, allCompanies.length)) * 100).toFixed(0), color: 'bg-purple-500' },
                ].map(tier => (
                  <div key={tier.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-white">
                      <span>{tier.label}</span>
                      <span>{tier.count} users ({tier.percent}%)</span>
                    </div>
                    <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden">
                      <div className={`${tier.color} h-full`} style={{ width: `${tier.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Revenue Contributing Businesses */}
            <div className="glass-card rounded-2xl p-6 border border-white/[0.06] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard size={15} className="text-emerald-400" /> Top Billing Contributions
              </h3>
              <div className="space-y-3">
                {revenueStats.topBusinessesByRevenue.length > 0 ? (
                  revenueStats.topBusinessesByRevenue.map((biz, idx) => (
                    <div key={biz.name} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold">#{idx + 1}</span>
                        <span className="font-bold text-white truncate max-w-[180px]">{biz.name}</span>
                      </div>
                      <span className="font-black text-emerald-400">₹{biz.value.toLocaleString('en-IN')}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 py-8 text-center">No billing contributions tracked.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEADS TAB */}
      {activeBiTab === 'leads' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Leads Generated', value: leadsStats.total, tone: 'text-violet-400' },
              { label: 'WhatsApp Clicks', value: leadsStats.whatsappLeads, tone: 'text-green-400' },
              { label: 'Phone Call Clicks', value: leadsStats.callLeads, tone: 'text-cyan-400' },
              { label: 'RFQ Contact Submissions', value: leadsStats.formLeads, tone: 'text-amber-400' },
            ].map(item => (
              <div key={item.label} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-xs text-gray-400 font-medium block">{item.label}</span>
                <span className={`text-2xl font-black block mt-2.5 ${item.tone}`}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Lead Details Breakdown Table */}
          <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white">Direct Enquiry Leads Logs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-gray-500 uppercase font-black tracking-wider bg-white/[0.01]">
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Interested In</th>
                    <th className="p-4">Lead Source</th>
                    <th className="p-4">Received Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allLeads.length > 0 ? (
                    allLeads.slice(0, 10).map((l: any) => (
                      <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-bold text-white">{l.customerName || 'Anonymous'}</td>
                        <td className="p-4 text-gray-300">{l.customerPhone || 'N/A'}</td>
                        <td className="p-4 text-emerald-400 font-semibold">{l.service || l.productName || 'General Inquiry'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                            l.source === 'whatsapp' || l.type === 'whatsapp' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : l.source === 'call' || l.type === 'call' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          }`}>
                            {l.source || l.type || 'Form'}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500">
                          {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">No leads logs stored in platform.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. AUDIT TAB */}
      {activeBiTab === 'audit' && (
        <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-violet-400 animate-pulse" /> Platform Security & Audit Activity Logs
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-500 uppercase font-black tracking-wider bg-white/[0.01]">
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Resource</th>
                  <th className="p-4">Trigger Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {activitiesLoading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      <Loader2 size={20} className="text-violet-400 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : activities.length > 0 ? (
                  activities.map((act) => {
                    const Icon = getActivityIcon(act.action || '');
                    return (
                      <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 flex items-center gap-2 font-semibold text-gray-200">
                          <Icon size={12} className="text-gray-500" />
                          {act.action}
                        </td>
                        <td className="p-4 font-bold text-white">{act.target}</td>
                        <td className="p-4 text-gray-500">{formatTime(act.timestamp)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">No activity logs recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
