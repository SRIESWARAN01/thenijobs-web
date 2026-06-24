'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Building2, Briefcase, FileText, TrendingUp,
  CreditCard, Eye, Clock, CheckCircle, XCircle,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Activity,
  UserPlus, Building, BriefcaseBusiness, Star,
  ChevronRight, BadgeCheck, ShieldAlert, Globe, Loader2,
  ShoppingBag, Package,
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
    'applications',
    [where('status', 'in', ['applied', 'pending_review', 'resume_viewed', 'under_review'])],
  );

  const adminPendingOver7DaysCount = useMemo(() => {
    if (!allPendingApplications) return 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return allPendingApplications.filter((app: any) => {
      const appDate = app.createdAt?.seconds 
        ? new Date(app.createdAt.seconds * 1000) 
        : app.createdAt?.toDate 
          ? app.createdAt.toDate() 
          : new Date(app.createdAt);
      return appDate < sevenDaysAgo;
    }).length;
  }, [allPendingApplications]);

  // Fetch recent activity logs
  useEffect(() => {
    async function loadActivities() {
      try {
        const logs = await getActivityLogs(10);
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
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const statsConfig = [
    { label: 'Total Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'emerald', prefix: '', href: '/admin/jobs' },
    { label: 'Total Companies', value: stats.totalCompanies, icon: Building2, color: 'cyan', prefix: '', href: '/admin/businesses' },
    { label: 'Total Employers', value: stats.totalEmployers, icon: Users, color: 'violet', prefix: '', href: '/admin/users' },
    { label: 'Total Job Seekers', value: stats.totalJobSeekers, icon: UserPlus, color: 'purple', prefix: '', href: '/admin/users' },
    { label: 'Total Applications', value: stats.totalApplications, icon: FileText, color: 'amber', prefix: '', href: '/admin/jobs' },
    { label: 'Walk-In Registrations', value: stats.totalWalkInRegistrations, icon: Activity, color: 'rose', prefix: '', href: '/admin/jobs' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Admin Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Platform overview and management</p>
        </div>
      </div>

      {adminPendingOver7DaysCount > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 animate-pulse-glow">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 animate-pulse">
            <AlertTriangle size={20} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">Pending Applications Alert (Admin)</p>
            <p className="text-xs text-gray-300 mt-0.5 font-medium">
              There are <span className="text-amber-400 font-bold">{adminPendingOver7DaysCount}</span> applications pending across the platform for more than 7 days.
            </p>
          </div>
          <Link href="/admin/jobs" className="text-xs text-amber-400 font-bold hover:text-amber-300 whitespace-nowrap bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-colors">
            Manage Jobs →
          </Link>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsConfig.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="xl:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock size={16} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Pending Approvals</h2>
                  <p className="text-[10px] text-gray-500">Requires your action</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold">
                {pendingApprovals.length}
              </span>
            </div>
            {companiesLoading || jobsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-2/3 bg-white/[0.06] rounded shimmer" />
                      <div className="h-3 w-1/3 bg-white/[0.06] rounded shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-gray-400">All caught up! No pending approvals.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'business' ? 'bg-cyan-500/10' : item.type === 'job' ? 'bg-emerald-500/10' : 'bg-violet-500/10'}`}>
                      {item.type === 'business' ? <Building size={18} className="text-cyan-400" /> : item.type === 'job' ? <BriefcaseBusiness size={18} className="text-emerald-400" /> : <CreditCard size={18} className="text-violet-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-500">
                        {item.type === 'business' ? (item as any).category : (item as any).company} · {item.district} · {item.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {actionLoading === item.id ? (
                        <Loader2 size={16} className="text-violet-400 animate-spin" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(item.id, item.type, (item as any).raw)}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(item.id, item.type)}
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                          <Link
                            href={item.type === 'business' ? `/admin/businesses?focus=${item.id}` : item.type === 'job' ? `/admin/jobs?focus=${item.id}` : `/admin/subscriptions`}
                            className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <Link href="/admin/businesses" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
                View all approvals <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-1">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Activity size={16} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                  <p className="text-[10px] text-gray-500">Platform events</p>
                </div>
              </div>
            </div>
            {activitiesLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] shimmer" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-white/[0.06] rounded shimmer" />
                      <div className="h-3 w-1/2 bg-white/[0.06] rounded shimmer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center">
                <Activity size={28} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No activity yet. Actions will appear here as they happen.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {activities.map((activity: any) => {
                  const Icon = getActivityIcon(activity.action || '');
                  return (
                    <div key={activity.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon size={14} className="text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400">{activity.action}</p>
                        <p className="text-sm font-medium text-white truncate">{activity.target}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{formatTime(activity.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <Link href="/admin/security" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
                View all activity <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform volume chart */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-white">Platform Volume Overview</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Users, businesses, jobs, applications and leads</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white font-outfit">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-gray-500">Total active revenue</p>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-1 px-4">
              {/* Simple bar chart visualization from stats */}
              {[
                { label: 'Users', value: stats.totalUsers, max: Math.max(stats.totalUsers, stats.totalBusinesses, stats.activeJobs, stats.totalApplications, stats.totalLeads, 1), color: 'from-violet-500 to-violet-600' },
                { label: 'Business', value: stats.totalBusinesses, max: Math.max(stats.totalUsers, stats.totalBusinesses, stats.activeJobs, stats.totalApplications, stats.totalLeads, 1), color: 'from-cyan-500 to-cyan-600' },
                { label: 'Jobs', value: stats.activeJobs, max: Math.max(stats.totalUsers, stats.totalBusinesses, stats.activeJobs, stats.totalApplications, stats.totalLeads, 1), color: 'from-emerald-500 to-emerald-600' },
                { label: 'Apps', value: stats.totalApplications, max: Math.max(stats.totalUsers, stats.totalBusinesses, stats.activeJobs, stats.totalApplications, stats.totalLeads, 1), color: 'from-amber-500 to-amber-600' },
                { label: 'Leads', value: stats.totalLeads, max: Math.max(stats.totalUsers, stats.totalBusinesses, stats.activeJobs, stats.totalApplications, stats.totalLeads, 1), color: 'from-rose-500 to-rose-600' },
              ].map((bar) => {
                const pct = bar.max > 0 ? Math.max((bar.value / bar.max) * 100, 5) : 5;
                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-semibold">{bar.value}</span>
                    <div
                      className={`w-full rounded-t-lg bg-gradient-to-t ${bar.color} transition-all duration-1000`}
                      style={{ height: `${pct}%`, minHeight: '8px' }}
                    />
                    <span className="text-[9px] text-gray-500">{bar.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Platform Health */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Platform Summary</h2>
            <div className="space-y-4">
              {[
                { label: 'Verified Businesses', value: stats.totalBusinesses.toString(), color: 'cyan' },
                { label: 'Pending Businesses', value: stats.pendingBusinesses.toString(), color: stats.pendingBusinesses > 0 ? 'amber' : 'emerald' },
                { label: 'Active Jobs', value: stats.activeJobs.toString(), color: 'emerald' },
                { label: 'Pending Jobs', value: stats.pendingJobs.toString(), color: stats.pendingJobs > 0 ? 'amber' : 'emerald' },
                { label: 'Unverified Users', value: stats.pendingUsers.toString(), color: stats.pendingUsers > 0 ? 'rose' : 'emerald' },
              ].map((metric) => (
                <div key={metric.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{metric.label}</span>
                  <span className={`text-sm font-bold ${colorMap[metric.color]?.text || 'text-white'}`}>{metric.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.pendingBusinesses > 0 || stats.pendingJobs > 0 ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                {stats.pendingBusinesses + stats.pendingJobs} Items Need Review
              </p>
              <p className="text-xs text-amber-400/60 mt-0.5">
                {stats.pendingBusinesses} businesses and {stats.pendingJobs} jobs pending approval
              </p>
            </div>
            <Link href="/admin/businesses" className="text-xs text-amber-400 font-semibold hover:text-amber-300 whitespace-nowrap">
              Review →
            </Link>
          </div>
        ) : null}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
            <Globe size={20} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-300">Platform Connected to Firebase</p>
            <p className="text-xs text-emerald-400/60 mt-0.5">All data is live and auto-updating in real-time</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold whitespace-nowrap">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> Live
          </span>
        </div>
      </div>
    </div>
  );
}
