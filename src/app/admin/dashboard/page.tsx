'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Building2, Briefcase, FileText, TrendingUp,
  CheckCircle, AlertTriangle,
  ChevronRight, Loader2, Activity, Bell
} from 'lucide-react';
import { usePlatformStats } from '@/hooks/useRealtimeStats';
import { useCollection } from '@/hooks/useFirestore';
import { approveCompany, rejectCompany, approveJob, rejectJob, getActivityLogs } from '@/lib/firebase/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import { where, orderBy, limit } from 'firebase/firestore';

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

const STAT_CONFIG = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, bg: '#EFF6FF', color: '#2563EB', href: '/admin/users' },
  { key: 'totalCompanies', label: 'Companies', icon: Building2, bg: '#ECFDF5', color: '#059669', href: '/admin/businesses' },
  { key: 'totalJobs', label: 'Total Jobs', icon: Briefcase, bg: '#F5F3FF', color: '#7C3AED', href: '/admin/jobs' },
  { key: 'activeJobs', label: 'Active Jobs', icon: TrendingUp, bg: '#F0F9FF', color: '#0284C7', href: '/admin/jobs' },
  { key: 'totalApplications', label: 'Applications', icon: FileText, bg: '#FFFBEB', color: '#D97706', href: '/admin/jobs' },
  { key: 'pendingCompanies', label: 'Pending Approvals', icon: AlertTriangle, bg: '#FEF2F2', color: '#DC2626', href: '/admin/businesses' },
];

function StatCard({ label, value, icon: Icon, bg, color, href }: any) {
  const count = useAnimatedCount(value || 0);
  return (
    <Link href={href} className="block group">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
            <Icon size={20} style={{ color }} />
          </div>
          <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
        </div>
        <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          {count.toLocaleString('en-IN')}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">{label}</p>
      </div>
    </Link>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = usePlatformStats();

  const { data: pendingCompanies, loading: bizLoading } = useCollection<any>('companies', [
    where('verificationStatus', '==', 'pending'),
    orderBy('createdAt', 'desc'), limit(5)
  ]);
  const { data: pendingJobs, loading: jobsLoading } = useCollection<any>('jobs', [
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'), limit(5)
  ]);
  const { data: recentUsers } = useCollection<any>('users', [
    orderBy('createdAt', 'desc'), limit(5)
  ]);

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
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

  const STATS_WITH_VALUES = STAT_CONFIG.map(s => ({
    ...s,
    value: (stats as any)?.[s.key] ?? 0
  }));

  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform overview &amp; moderation queue</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/notifications"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">
            <Bell size={16} />
          </Link>
          <Link href="/" className="text-xs text-blue-600 font-semibold border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-all">
            View Site
          </Link>
        </div>
      </div>

      {/* Pending Alerts */}
      {(pendingCompanies.length > 0 || pendingJobs.length > 0) && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl border"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <AlertTriangle size={16} style={{ color: '#D97706' }} className="flex-shrink-0" />
          <p className="text-sm font-semibold" style={{ color: '#92400E' }}>
            {pendingCompanies.length + pendingJobs.length} item{pendingCompanies.length + pendingJobs.length !== 1 ? 's' : ''} awaiting approval —{' '}
            <span className="font-normal">Review the sections below</span>
          </p>
        </div>
      )}

      {/* KPI Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
              <div className="w-11 h-11 bg-gray-100 rounded-xl mb-4" />
              <div className="h-6 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3.5 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATS_WITH_VALUES.map(({ key, label, value, icon, bg, color, href }) => (
            <StatCard key={key} label={label} value={value} icon={icon} bg={bg} color={color} href={href} />
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Pending Companies */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FEF2F2' }}>
                <Building2 size={15} style={{ color: '#DC2626' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Pending Companies</h2>
                <p className="text-[10px] text-gray-400">Awaiting verification</p>
              </div>
            </div>
            <Link href="/admin/businesses" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {bizLoading ? (
              <div className="p-8 flex justify-center"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
            ) : pendingCompanies.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-xs text-slate-600 font-medium">All companies reviewed!</p>
              </div>
            ) : pendingCompanies.map(company => (
              <div key={company.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0"
                  style={{ background: '#EFF6FF' }}>
                  {company.name?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{company.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{company.district || 'Theni'} · {company.category}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {actionLoading[company.id] ? (
                    <Loader2 size={14} className="animate-spin text-blue-500" />
                  ) : (
                    <>
                      <button onClick={() => handleApproveCompany(company.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-900 transition-all hover:opacity-90"
                        style={{ background: '#10B981' }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => handleRejectCompany(company.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                        ✗ Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Jobs */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                <Briefcase size={15} style={{ color: '#D97706' }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Pending Jobs</h2>
                <p className="text-[10px] text-gray-400">Awaiting approval</p>
              </div>
            </div>
            <Link href="/admin/jobs" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {jobsLoading ? (
              <div className="p-8 flex justify-center"><Loader2 size={20} className="animate-spin text-blue-500" /></div>
            ) : pendingJobs.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-xs text-slate-600 font-medium">All jobs reviewed!</p>
              </div>
            ) : pendingJobs.map(job => (
              <div key={job.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-600 font-bold text-sm flex-shrink-0"
                  style={{ background: '#FFFBEB' }}>
                  {job.title?.[0]?.toUpperCase() || 'J'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">{job.companyName} · {job.district || 'Theni'}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {actionLoading[job.id] ? (
                    <Loader2 size={14} className="animate-spin text-blue-500" />
                  ) : (
                    <>
                      <button onClick={() => handleApproveJob(job.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-900 transition-all hover:opacity-90"
                        style={{ background: '#10B981' }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => handleRejectJob(job.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                        ✗ Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Recent Users */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                <Users size={15} style={{ color: '#2563EB' }} />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Users</h2>
            </div>
            <Link href="/admin/users" className="text-xs text-blue-600 font-semibold hover:text-blue-700">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.slice(0, 5).map(u => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0"
                  style={{ background: '#EFF6FF' }}>
                  {(u.displayName || u.email || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.displayName || u.email?.split('@')[0]}</p>
                  <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                  u.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                  u.role === 'employer' ? 'bg-blue-50 text-blue-600' :
                  'bg-gray-50 text-gray-600'
                }`}>{u.role || 'seeker'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5' }}>
              <Activity size={15} style={{ color: '#059669' }} />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Activity Log</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {activityLogs.length === 0 ? (
              <div className="p-10 text-center">
                <Activity size={24} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">No recent activity</p>
              </div>
            ) : activityLogs.slice(0, 6).map((log, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#10B981' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 leading-relaxed">{log.description || log.action}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {log.createdAt ? new Date(log.createdAt?.toMillis?.() || log.createdAt).toLocaleString() : 'Recently'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
