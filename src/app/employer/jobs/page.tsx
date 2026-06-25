'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, Plus, Search, Eye, Users2, MoreVertical,
  Pause, Play, Edit, Trash2, Zap, Clock, Star, Loader2, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { Timestamp, where, orderBy } from 'firebase/firestore';
import { getDaysUntilJobExpiry, getEffectiveJobStatus, getJobExpiryDate, isActiveJobSlot } from '@/lib/jobPolicy';

type JobStatus = 'pending' | 'pending_renewal' | 'active' | 'paused' | 'draft' | 'closed' | 'expired' | 'rejected' | 'reported';
type TabFilter = 'all' | JobStatus;

interface JobDoc {
  id: string;
  title: string;
  jobType: string;
  location?: string;
  district?: string;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string; // fallback
  applicationsCount?: number;
  viewCount?: number;
  status?: JobStatus;
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  isUrgent?: boolean;
  createdAt?: any;
  postedAt?: any;
  activatedAt?: any;
  expiresAt?: any;
  deadline?: any;
}

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paused', value: 'paused' },
  { label: 'Draft', value: 'draft' },
  { label: 'Closed', value: 'closed' },
  { label: 'Expired', value: 'expired' },
];

const statusConfig: Record<JobStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Pending Review' },
  pending_renewal: { bg: 'bg-amber-500/10', text: 'text-amber-300', label: 'Renewal Review' },
  active: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Active' },
  paused: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Paused' },
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: 'Draft' },
  closed: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Closed' },
  expired: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Expired' },
  rejected: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Rejected' },
  reported: { bg: 'bg-rose-500/10', text: 'text-rose-300', label: 'Flagged' },
};

const INITIAL_COLORS = [
  'from-violet-500 to-indigo-500',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-purple-500 to-violet-500',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-emerald-500',
];

export default function EmployerJobsPage() {
  const { user } = useAuth();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch jobs
  const { data: jobs, loading: jobsLoading } = useCollection<JobDoc>('jobs', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  const [tab, setTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = jobs.filter((j) => {
    const jobStatus = getEffectiveJobStatus(j);

    if (tab !== 'all' && jobStatus !== tab) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleToggleStatus = async (id: string, currentStatus?: JobStatus) => {
    setActionLoading(id);
    try {
      const nextStatus: JobStatus = currentStatus === 'active' || !currentStatus ? 'paused' : 'active';
      const isActive = nextStatus === 'active';
      await updateDocument('jobs', id, { status: nextStatus, isActive });
    } catch (err) {
      console.error('Toggle status error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseJob = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('jobs', id, { status: 'closed', isActive: false });
    } catch (err) {
      console.error('Close job error:', err);
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleRenewJob = async (id: string) => {
    setActionLoading(id);
    try {
      const now = new Date();
      await updateDocument('jobs', id, {
        status: 'pending_renewal',
        isActive: false,
        postedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(getJobExpiryDate(now)),
        renewalRequestedAt: Timestamp.fromDate(now),
        expiryReminderDaysSent: [],
      });
      alert('Renewal submitted for admin approval.');
    } catch (err) {
      console.error('Renew job error:', err);
      alert('Unable to submit renewal.');
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting permanently?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('jobs', id);
    } catch (err) {
      console.error('Delete job error:', err);
    } finally {
      setActionLoading(null);
      setOpenMenuId(null);
    }
  };

  const handleUpgradePremium = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('jobs', id, { isPremium: true });
    } catch (err) {
      console.error('Premium upgrade error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic statistics
  const activeCount = jobs.filter((j) => isActiveJobSlot(j)).length;
  const pausedCount = jobs.filter((j) => j.status === 'paused').length;
  const closedCount = jobs.filter((j) => j.status === 'closed').length;
  const expiredCount = jobs.filter((j) => getEffectiveJobStatus(j) === 'expired').length;
  const totalAppsCount = jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0);

  const stats = [
    { label: 'Active Jobs', count: activeCount, icon: Briefcase, color: 'cyan' },
    { label: 'Paused', count: pausedCount, icon: Pause, color: 'amber' },
    { label: 'Closed', count: closedCount, icon: X, color: 'rose' },
    { label: 'Expired', count: expiredCount, icon: Clock, color: 'amber' },
    { label: 'Total Applications', count: totalAppsCount, icon: Users2, color: 'violet' },
  ];

  const colorMap: Record<string, { bg: string; text: string }> = {
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
  };

  const loading = companyLoading || jobsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <Briefcase size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to post and manage jobs.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Job Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage and monitor all your job listings</p>
        </div>
        <Link
          href="/employer/post-job"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Post New Job
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading jobs...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const colors = colorMap[stat.color];
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/15 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                      <Icon size={18} className={colors.text} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{stat.count}</p>
                      <p className="text-[11px] text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tab Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] flex-1">
              {TABS.map((t) => {
                const count = t.value === 'all' ? jobs.length : jobs.filter((j) => {
                  const jobStatus = getEffectiveJobStatus(j);
                  return jobStatus === t.value;
                }).length;

                return (
                  <button
                    key={t.value}
                    onClick={() => setTab(t.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      tab === t.value
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {t.label} <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
              />
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Briefcase size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No jobs found matching your selection.</p>
              </div>
            ) : (
              filtered.map((job) => {
                const jobStatus = getEffectiveJobStatus(job);
                const status = statusConfig[jobStatus] || statusConfig.draft;
                const salaryText = job.salaryMin && job.salaryMax ? `₹${job.salaryMin.toLocaleString('en-IN')} - ₹${job.salaryMax.toLocaleString('en-IN')}/mo` : job.salary || 'Salary N/A';
                const daysUntilExpiry = getDaysUntilJobExpiry(job);
                const expiryText = daysUntilExpiry === null
                  ? 'Expiry not set'
                  : daysUntilExpiry < 0
                    ? 'Expired'
                    : `${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'} left`;

                return (
                  <div
                    key={job.id}
                    className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-semibold text-white">{job.title}</h3>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 uppercase">
                            {job.jobType || 'Full Time'}
                          </span>
                          {job.isUrgent && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-400 flex items-center gap-0.5">
                              URGENT
                            </span>
                          )}
                          {job.isPremium && (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-violet-500/10 text-violet-400">
                              PREMIUM
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {job.district || 'Theni'} · {job.location || 'Local'} · {salaryText} · Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'} · {expiryText}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 lg:gap-8">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm font-bold text-white">
                            <Users2 size={14} className="text-cyan-400" />
                            {job.applicationsCount || 0}
                          </div>
                          <p className="text-[10px] text-gray-500">Applications</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm font-bold text-white">
                            <Eye size={14} className="text-violet-400" />
                            {job.viewCount || 0}
                          </div>
                          <p className="text-[10px] text-gray-500">Views</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {actionLoading === job.id ? (
                          <Loader2 size={16} className="text-cyan-400 animate-spin" />
                        ) : (
                          <>
                            {(jobStatus === 'active' || jobStatus === 'paused') && (
                              <button
                                onClick={() => handleToggleStatus(job.id, jobStatus)}
                                className={`p-2 rounded-lg transition-all ${
                                  jobStatus === 'active'
                                    ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                }`}
                                title={jobStatus === 'active' ? 'Pause Posting' : 'Resume Posting'}
                              >
                                {jobStatus === 'active' ? <Pause size={14} /> : <Play size={14} />}
                              </button>
                            )}
                            {!job.isPremium && jobStatus === 'active' && (
                              <button
                                onClick={() => handleUpgradePremium(job.id)}
                                className="p-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all"
                                title="Premium Upgrade"
                              >
                                <Zap size={14} />
                              </button>
                            )}
                            {jobStatus === 'expired' && (
                              <button
                                onClick={() => handleRenewJob(job.id)}
                                className="px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all text-xs font-semibold"
                                title="Renew Job"
                              >
                                Renew
                              </button>
                            )}
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                                className="p-2 rounded-lg bg-white/[0.04] text-gray-400 hover:bg-white/[0.08] transition-all"
                              >
                                <MoreVertical size={14} />
                              </button>
                              {openMenuId === job.id && (
                                <div className="absolute right-0 top-10 w-40 bg-[#141428] border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden">
                                  {jobStatus !== 'closed' && (
                                    <button
                                      onClick={() => handleCloseJob(job.id)}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.04] transition-colors"
                                    >
                                      <X size={14} /> Close Job
                                    </button>
                                  )}
                                  {jobStatus === 'expired' && (
                                    <button
                                      onClick={() => handleRenewJob(job.id)}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                                    >
                                      <Clock size={14} /> Renew Job
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteJob(job.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
