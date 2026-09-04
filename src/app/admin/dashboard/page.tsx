'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, AlertTriangle, Bell, Briefcase, Building2, CheckCircle,
  ChevronRight, FileText, Loader2, TrendingUp, Users,
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
  { id: 'totalUsers', label: 'Total users', icon: Users, bg: '#EFF6FF', color: '#2563EB', href: '/admin/users' },
  { id: 'totalCompanies', label: 'Companies', icon: Building2, bg: '#ECFDF5', color: '#059669', href: '/admin/businesses' },
  { id: 'totalJobs', label: 'Total jobs', icon: Briefcase, bg: '#F5F3FF', color: '#7C3AED', href: '/admin/jobs' },
  { id: 'activeJobs', label: 'Active jobs', icon: TrendingUp, bg: '#F0F9FF', color: '#0284C7', href: '/admin/jobs' },
  { id: 'totalApplications', label: 'Applications', icon: FileText, bg: '#FFFBEB', color: '#D97706', href: '/admin/jobs' },
  { id: 'pendingCompanies', label: 'Pending approvals', icon: AlertTriangle, bg: '#FEF2F2', color: '#DC2626', href: '/admin/businesses' },
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
