'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, AlertTriangle, Bell, Briefcase, Building2, CheckCircle,
  ChevronRight, FileText, Loader2, TrendingUp, Users, CreditCard,
  Clock, ShieldCheck, DollarSign, XCircle, ShoppingBag, Globe, Zap,
  ArrowUpRight, BadgeCheck
} from 'lucide-react';
import { usePlatformStats } from '@/hooks/useRealtimeStats';
import { useCollection } from '@/hooks/useFirestore';
import { approveCompany, rejectCompany, approveJob, rejectJob, getActivityLogs } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import { where, orderBy, limit } from 'firebase/firestore';
import {
  Button, Card, CardHeader, EmptyState, PageHeader, PageShell, Pill, Skeleton, StatGrid,
} from '@/components/dashboard';

function useAnimatedCount(target: number) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const inc = target / (1200 / 16);
    const t = setInterval(() => {
      start += inc;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return count;
}

interface StatConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  bg: string;
  color: string;
  href: string;
}

const STAT_CONFIG: StatConfig[] = [
  { id: 'totalBusinessOwners', label: 'Business Owners', icon: Users, bg: '#EFF6FF', color: '#2563EB', href: '/admin/business-approvals' },
  { id: 'pendingBusinessApprovals', label: 'Pending Approvals', icon: AlertTriangle, bg: '#FEF2F2', color: '#DC2626', href: '/admin/business-approvals' },
  { id: 'activePaidSubscriptions', label: 'Paid Subscriptions', icon: CreditCard, bg: '#ECFDF5', color: '#059669', href: '/admin/subscriptions' },
  { id: 'activeTrials', label: 'Active 15-Day Trials', icon: Clock, bg: '#FFFBEB', color: '#D97706', href: '/admin/business-approvals' },
  { id: 'totalJobs', label: 'Total Jobs', icon: Briefcase, bg: '#F5F3FF', color: '#7C3AED', href: '/admin/jobs' },
  { id: 'totalApplications', label: 'Job Applications', icon: FileText, bg: '#F0FDF4', color: '#16A34A', href: '/admin/applications' },
];

function StatTile({ label, value, icon: Icon, bg, color, href }: StatConfig & { value: number }) {
  const count = useAnimatedCount(value || 0);
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: bg }}>
          <Icon size={17} style={{ color }} aria-hidden />
        </span>
        <ChevronRight size={14} className="mt-1 text-slate-300 transition-colors group-hover:text-slate-500" aria-hidden />
      </div>
      <p className="mt-2.5 text-xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-2xl">
        {count.toLocaleString('en-IN')}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{label}</p>
    </Link>
  );
}

interface CompanyDoc { id: string; name?: string; district?: string; category?: string }
interface JobDoc { id: string; title?: string; companyName?: string; district?: string }
interface UserDoc { id: string; displayName?: string; email?: string; role?: string }
interface ActivityLog { id?: string; description?: string; action?: string; createdAt?: { toMillis?: () => number } | number | string }

/** One row in a moderation queue: avatar letter, two lines, approve/reject. */
function QueueRow({
  letter, letterBg, letterColor, title, subtitle, busy, onApprove, onReject, approveLabel, rejectLabel,
}: {
  letter: string; letterBg: string; letterColor: string; title: string; subtitle: string;
  busy: boolean; onApprove: () => void; onReject: () => void; approveLabel: string; rejectLabel: string;
}) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:gap-3 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{ background: letterBg, color: letterColor }}
        >
          {letter}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900">{title}</span>
          <span className="block truncate text-xs text-slate-500">{subtitle}</span>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {busy ? (
          <Loader2 size={15} className="animate-spin text-blue-600" aria-label="Saving" />
        ) : (
          <>
            <Button
              size="sm"
              onClick={onApprove}
              className="flex-1 border-0 bg-emerald-600 text-white hover:bg-emerald-700 sm:flex-none"
              aria-label={approveLabel}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={onReject}
              className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 sm:flex-none"
              aria-label={rejectLabel}
            >
              Reject
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = usePlatformStats();

  const { data: pendingCompanies, loading: bizLoading } = useCollection<CompanyDoc>('companies', [
    where('verificationStatus', '==', 'pending'),
    orderBy('createdAt', 'desc'), limit(5)
  ]);
  const { data: pendingJobs, loading: jobsLoading } = useCollection<JobDoc>('jobs', [
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'), limit(5)
  ]);
  const { data: recentUsers } = useCollection<UserDoc>('users', [
    orderBy('createdAt', 'desc'), limit(5)
  ]);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getActivityLogs(8).then(setActivityLogs).catch(console.error);
  }, []);

  const handleApproveCompany = async (id: string) => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try { await approveCompany(id, user?.uid || ''); }
    catch (err) { console.error(err); }
    finally { setActionLoading(p => ({ ...p, [id]: false })); }
  };

  const handleRejectCompany = async (id: string) => {
    const reason = window.prompt('Enter rejection reason for the employer:');
    if (!reason) return;
    setActionLoading(p => ({ ...p, [id]: true }));
    try { await rejectCompany(id, user?.uid || '', reason); }
    catch (err) { console.error(err); }
    finally { setActionLoading(p => ({ ...p, [id]: false })); }
  };

  const handleApproveJob = async (id: string) => {
    setActionLoading(p => ({ ...p, [id]: true }));
    try { await approveJob(id, user?.uid || ''); }
    catch (err) { console.error(err); }
    finally { setActionLoading(p => ({ ...p, [id]: false })); }
  };

  const handleRejectJob = async (id: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(p => ({ ...p, [id]: true }));
    try { await rejectJob(id, user?.uid || '', reason); }
    catch (err) { console.error(err); }
    finally { setActionLoading(p => ({ ...p, [id]: false })); }
  };

  const statsRecord = (stats ?? {}) as unknown as Record<string, number>;
  const pendingTotal = pendingCompanies.length + pendingJobs.length;

  return (
    <PageShell>
      <PageHeader
        title="Admin dashboard"
        description="Platform overview and moderation queue."
        actions={
          <>
            <Link
              href="/admin/notifications"
              aria-label="Notifications"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Bell size={16} />
            </Link>
            <Link href="/">
              <Button variant="secondary" size="md">View site</Button>
            </Link>
          </>
        }
      />

      {pendingTotal > 0 && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border p-3.5"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
        >
          <AlertTriangle size={16} style={{ color: '#D97706' }} className="shrink-0" aria-hidden />
          <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
            {pendingTotal} item{pendingTotal !== 1 ? 's' : ''} awaiting approval{' '}
            <span className="font-normal">— review the queues below</span>
          </p>
        </div>
      )}

      <StatGrid columns={6}>
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="mt-2.5 h-7 w-2/3" />
                <Skeleton className="mt-1.5 h-3 w-1/2" />
              </div>
            ))
          : STAT_CONFIG.map(s => (
              <StatTile key={s.id} {...s} value={statsRecord[s.id] ?? 0} />
            ))}
      </StatGrid>

      {/* 15-Metric Full Operations & Moderation Matrix */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Domain 1: Business Owners & Approvals */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Governance</span>
              <BadgeCheck size={16} className="text-blue-600" />
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">1. Total Business Owners</span>
                <span className="font-bold text-slate-900">{stats.totalBusinessOwners}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">2. Pending Approvals</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  stats.pendingBusinessApprovals > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {stats.pendingBusinessApprovals}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">3. Approved Business Owners</span>
                <span className="font-bold text-emerald-700">{stats.approvedBusinessOwners}</span>
              </div>
            </div>
          </div>
          <Link
            href="/admin/business-approvals"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-between"
          >
            <span>Review Approvals Queue</span>
            <ArrowUpRight size={13} />
          </Link>
        </Card>

        {/* Domain 2: Subscriptions & Trials */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Subscriptions &amp; Trials</span>
              <CreditCard size={16} className="text-emerald-600" />
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">4. Active 15-Day Trials</span>
                <span className="font-bold text-indigo-600">{stats.activeTrials}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">5. Expired Free Trials</span>
                <span className="font-bold text-rose-600">{stats.expiredTrials}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">6. Active Paid Plans</span>
                <span className="font-bold text-emerald-700">{stats.activePaidSubscriptions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">7. Pending Payments</span>
                <span className="font-bold text-amber-600">{stats.pendingPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">8. Verified Payments</span>
                <span className="font-bold text-slate-900">{stats.verifiedPayments}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span className="text-slate-600 font-bold">15. Total Revenue</span>
                <span className="font-extrabold text-emerald-700">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          <Link
            href="/admin/subscriptions"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-between"
          >
            <span>View Subscriptions &amp; Revenue</span>
            <ArrowUpRight size={13} />
          </Link>
        </Card>

        {/* Domain 3: Jobs & Candidates Pipeline */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Jobs &amp; Talent Pipeline</span>
              <Briefcase size={16} className="text-violet-600" />
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">9. Total Job Postings</span>
                <span className="font-bold text-slate-900">{stats.totalJobs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">10. Pending Job Reviews</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  stats.pendingJobs > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {stats.pendingJobs}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">11. Total Applications</span>
                <span className="font-bold text-blue-600">{stats.totalApplications}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">12. Inbound Leads</span>
                <span className="font-bold text-slate-900">{stats.totalLeads}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <Link href="/admin/jobs" className="text-violet-600 hover:text-violet-700">Jobs Queue →</Link>
            <Link href="/admin/applications" className="text-blue-600 hover:text-blue-700">Applications →</Link>
          </div>
        </Card>

        {/* Domain 4: Marketplace & Local Services */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Marketplace &amp; Services</span>
              <Globe size={16} className="text-teal-600" />
            </div>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">13. Pending Products</span>
                <span className="font-bold text-amber-700">{stats.pendingBusinesses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">14. Pending Services</span>
                <span className="font-bold text-amber-700">{stats.pendingServices}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Verified Companies</span>
                <span className="font-bold text-slate-900">{stats.totalBusinesses}</span>
              </div>
            </div>
          </div>
          <Link
            href="/admin/services"
            className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center justify-between"
          >
            <span>Manage Products &amp; Services</span>
            <ArrowUpRight size={13} />
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        {/* Pending companies */}
        <Card className="overflow-hidden">
          <CardHeader
            title="Pending companies"
            description="Awaiting verification"
            action={<Link href="/admin/businesses" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</Link>}
          />
          {bizLoading ? (
            <div className="flex justify-center p-8"><Loader2 size={20} className="animate-spin text-blue-600" /></div>
          ) : pendingCompanies.length === 0 ? (
            <EmptyState variant="inline" icon={CheckCircle} title="All companies reviewed" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingCompanies.map(company => (
                <QueueRow
                  key={company.id}
                  letter={company.name?.[0]?.toUpperCase() || 'C'}
                  letterBg="#EFF6FF"
                  letterColor="#2563EB"
                  title={company.name || 'Unnamed company'}
                  subtitle={`${company.district || 'Theni'}${company.category ? ` · ${company.category}` : ''}`}
                  busy={Boolean(actionLoading[company.id])}
                  onApprove={() => handleApproveCompany(company.id)}
                  onReject={() => handleRejectCompany(company.id)}
                  approveLabel={`Approve ${company.name ?? 'company'}`}
                  rejectLabel={`Reject ${company.name ?? 'company'}`}
                />
              ))}
            </ul>
          )}
        </Card>

        {/* Pending jobs */}
        <Card className="overflow-hidden">
          <CardHeader
            title="Pending jobs"
            description="Awaiting approval"
            action={<Link href="/admin/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</Link>}
          />
          {jobsLoading ? (
            <div className="flex justify-center p-8"><Loader2 size={20} className="animate-spin text-blue-600" /></div>
          ) : pendingJobs.length === 0 ? (
            <EmptyState variant="inline" icon={CheckCircle} title="All jobs reviewed" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingJobs.map(job => (
                <QueueRow
                  key={job.id}
                  letter={job.title?.[0]?.toUpperCase() || 'J'}
                  letterBg="#FFFBEB"
                  letterColor="#D97706"
                  title={job.title || 'Untitled job'}
                  subtitle={`${job.companyName || 'Unknown company'} · ${job.district || 'Theni'}`}
                  busy={Boolean(actionLoading[job.id])}
                  onApprove={() => handleApproveJob(job.id)}
                  onReject={() => handleRejectJob(job.id)}
                  approveLabel={`Approve ${job.title ?? 'job'}`}
                  rejectLabel={`Reject ${job.title ?? 'job'}`}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        {/* Recent users */}
        <Card className="overflow-hidden">
          <CardHeader
            title="Recent users"
            action={<Link href="/admin/users" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</Link>}
          />
          {recentUsers.length === 0 ? (
            <EmptyState variant="inline" icon={Users} title="No users yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentUsers.slice(0, 5).map(u => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:px-5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#2563EB]"
                    style={{ background: '#EFF6FF' }}
                  >
                    {(u.displayName || u.email || 'U')[0].toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {u.displayName || u.email?.split('@')[0] || 'Unknown'}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{u.email}</span>
                  </span>
                  <Pill tone={u.role === 'admin' ? 'violet' : u.role === 'employer' ? 'info' : 'neutral'}>
                    {u.role || 'seeker'}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Activity log */}
        <Card className="overflow-hidden">
          <CardHeader title="Activity log" action={<Activity size={16} className="text-slate-400" aria-hidden />} />
          {activityLogs.length === 0 ? (
            <EmptyState variant="inline" icon={Activity} title="No recent activity" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {activityLogs.slice(0, 6).map((log, i) => {
                const raw = log.createdAt;
                const ms =
                  typeof raw === 'object' && raw !== null
                    ? raw.toMillis?.() ?? null
                    : raw ?? null;
                return (
                  <li key={log.id ?? i} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:px-5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs leading-relaxed font-medium text-slate-700">
                        {log.description || log.action}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        {ms ? new Date(ms).toLocaleString() : 'Recently'}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
