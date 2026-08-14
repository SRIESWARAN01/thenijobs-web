'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Plus, Search, Eye, Users2, MoreVertical,
  Pause, Play, Trash2, Zap, Clock, Loader2, X, AlertTriangle,
  Share2, Copy, Archive, Edit3, BarChart3, Banknote, FileText, Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument, createDocument } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import JobShareModal from '@/components/employer/JobShareModal';

type JobStatus = 'active' | 'pending' | 'rejected' | 'paused' | 'draft' | 'closed' | 'expired';
type TabFilter = 'all' | JobStatus;

interface JobDoc {
  id: string; title: string; jobType: string; location?: string; district?: string;
  salaryMin?: number; salaryMax?: number; salary?: string;
  applicationsCount?: number; viewCount?: number;
  status?: JobStatus; isActive?: boolean; isFeatured?: boolean;
  isPremium?: boolean; isUrgent?: boolean; rejectionReason?: string;
  createdAt?: any; deadline?: any;
}

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' },
];

const STATUS_STYLES: Record<JobStatus, { bg: string; text: string; label: string }> = {
  active:   { bg: '#ECFDF5', text: '#059669', label: 'Active' },
  pending:  { bg: '#FFFBEB', text: '#D97706', label: 'Awaiting Approval' },
  rejected: { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected' },
  paused:   { bg: '#F5F3FF', text: '#7C3AED', label: 'Paused' },
  draft:    { bg: '#F9FAFB', text: '#6B7280', label: 'Draft' },
  closed:   { bg: '#FEF2F2', text: '#DC2626', label: 'Closed' },
  expired:  { bg: '#F9FAFB', text: '#9CA3AF', label: 'Expired' },
};

function resolveStatus(j: JobDoc): JobStatus {
  if (j.status === 'pending')  return 'pending';
  if (j.status === 'rejected') return 'rejected';
  if (j.status === 'active' || (j.isActive === true && !j.status)) return 'active';
  if (j.status === 'paused')   return 'paused';
  if (j.status === 'closed')   return 'closed';
  if (j.status === 'expired')  return 'expired';
  if (j.isActive === false)    return 'pending';
  return 'draft';
}

export default function EmployerJobsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];
  const companyId = company?.id;

  const { data: jobs, loading: jobsLoading } = useCollection<JobDoc>('jobs', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  const [tab, setTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [shareJob, setShareJob] = useState<JobDoc | null>(null);

  const filtered = jobs.filter(j => {
    const s = resolveStatus(j);
    if (tab !== 'all' && s !== tab) return false;
    if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleToggleStatus = async (id: string, currentStatus: JobStatus) => {
    setActionLoading(id);
    const next: JobStatus = currentStatus === 'active' ? 'paused' : 'active';
    try { await updateDocument('jobs', id, { status: next, isActive: next === 'active' }); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };
  const handleCloseJob = async (id: string) => {
    setActionLoading(id); setOpenMenuId(null);
    try { await updateDocument('jobs', id, { status: 'closed', isActive: false }); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this job posting permanently?')) return;
    setActionLoading(id); setOpenMenuId(null);
    try { await deleteDocument('jobs', id); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const handleDuplicate = async (job: JobDoc) => {
    setActionLoading(job.id); setOpenMenuId(null);
    try {
      const { id: _id, createdAt: _ca, viewCount: _vc, applicationsCount: _ac, status: _s, isActive: _ia, ...rest } = job as any;
      await createDocument('jobs', {
        ...rest, title: `${job.title} (Copy)`,
        status: 'draft', isActive: false, viewCount: 0, applicationsCount: 0,
        companyId, postedBy: user?.uid, createdAt: new Date(), updatedAt: new Date(),
      });
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const handleArchive = async (id: string) => {
    setActionLoading(id); setOpenMenuId(null);
    try { await updateDocument('jobs', id, { status: 'closed', isActive: false, archived: true }); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const activeCount = jobs.filter(j => resolveStatus(j) === 'active').length;
  const pendingCount = jobs.filter(j => resolveStatus(j) === 'pending').length;
  const rejectedCount = jobs.filter(j => resolveStatus(j) === 'rejected').length;
  const totalApps = jobs.reduce((s, j) => s + (j.applicationsCount || 0), 0);
  const loading = companyLoading || jobsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <Briefcase size={28} className="text-blue-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">No Company Profile</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-5">Register your company profile first to post and manage jobs.</p>
        <Link href="/employer/company-profile"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-900" style={{ background: '#2563EB' }}>
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Job Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and monitor all your job postings</p>
        </div>
        <Link href="/employer/post-job"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:opacity-90"
          style={{ background: '#2563EB' }}>
          <Plus size={16} /> Post New Job
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading jobs...</p>
        </div>
      ) : (
        <>
          {/* KPI stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Active Jobs', count: activeCount, icon: Briefcase, bg: '#EFF6FF', color: '#2563EB' },
              { label: 'Awaiting Approval', count: pendingCount, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
              { label: 'Rejected', count: rejectedCount, icon: AlertTriangle, bg: '#FEF2F2', color: '#DC2626' },
              { label: 'Total Applications', count: totalApps, icon: Users2, bg: '#F5F3FF', color: '#7C3AED' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                      <Icon size={18} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{s.count}</p>
                      <p className="text-[11px] text-gray-500">{s.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs + search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 p-1 rounded-xl bg-gray-100 overflow-x-auto no-scrollbar">
              {TABS.map(t => {
                const count = t.value === 'all' ? jobs.length : jobs.filter(j => resolveStatus(j) === t.value).length;
                return (
                  <button key={t.value} onClick={() => setTab(t.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      tab === t.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                    }`}>
                    {t.label} <span className="opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>
            <div className="relative sm:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search jobs..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
            </div>
          </div>

          {/* Job list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                <Briefcase size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-500 font-medium">No jobs found</p>
                <p className="text-xs text-slate-500 mt-1">Try switching tabs or <Link href="/employer/post-job" className="text-blue-600 font-semibold">post a new job</Link></p>
              </div>
            ) : filtered.map(job => {
              const jobStatus = resolveStatus(job);
              const st = STATUS_STYLES[jobStatus];
              const salary = job.salaryMin && job.salaryMax
                ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} – ₹${Number(job.salaryMax).toLocaleString('en-IN')}/mo`
                : job.salary || '—';

              return (
                <div key={job.id} className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${
                  jobStatus === 'pending' ? 'border-amber-200' :
                  jobStatus === 'rejected' ? 'border-red-200' : 'border-gray-100'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Link href={`/employer/jobs/${job.id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                          {job.title}
                        </Link>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                          {job.jobType || 'Full Time'}
                        </span>
                        {job.isUrgent && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: '#FFFBEB', color: '#D97706' }}>URGENT</span>}
                        {job.isPremium && <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: '#F5F3FF', color: '#7C3AED' }}>PREMIUM</span>}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: st.bg, color: st.text }}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {job.district || 'Theni'} · {salary} ·{' '}
                        Posted {job.createdAt ? new Date(job.createdAt?.toMillis?.() || job.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                      {jobStatus === 'rejected' && job.rejectionReason && (
                        <div className="mt-2 flex items-start gap-1.5 px-3 py-2 rounded-xl border text-xs" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                          <span className="font-semibold text-red-600">Reason:</span>
                          <span className="text-red-600">{job.rejectionReason}</span>
                        </div>
                      )}
                      {jobStatus === 'pending' && (
                        <div className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border" style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#D97706' }}>
                          ⏳ Submitted for review — will go live once admin approves.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                          <Users2 size={13} className="text-blue-500" /> {job.applicationsCount || 0}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Applications</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                          <Eye size={13} className="text-purple-500" /> {job.viewCount || 0}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Views</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {actionLoading === job.id ? (
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        ) : (
                          <>
                            {(jobStatus === 'active' || jobStatus === 'paused') && (
                              <button onClick={() => handleToggleStatus(job.id, jobStatus)}
                                className={`p-2 rounded-lg transition-all ${
                                  jobStatus === 'active'
                                    ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'
                                }`}
                                title={jobStatus === 'active' ? 'Pause' : 'Resume'}>
                                {jobStatus === 'active' ? <Pause size={14} /> : <Play size={14} />}
                              </button>
                            )}
                            {!job.isPremium && jobStatus === 'active' && (
                              <button className="p-2 rounded-lg bg-purple-50 text-purple-500 hover:bg-purple-100 transition-all" title="Upgrade to Premium">
                                <Zap size={14} />
                              </button>
                            )}
                            {/* Share button */}
                            {jobStatus === 'active' && (
                              <button onClick={() => setShareJob(job)}
                                className="p-2 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition-all" title="Share">
                                <Share2 size={14} />
                              </button>
                            )}

                            <div className="relative">
                              <button onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                                className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 transition-all">
                                <MoreVertical size={14} />
                              </button>
                              {openMenuId === job.id && (
                                <div className="absolute right-0 top-10 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                                  <Link href={`/employer/jobs/${job.id}`}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Eye size={13} /> View Details
                                  </Link>
                                  <Link href={`/employer/jobs/${job.id}`}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Edit3 size={13} /> Edit Job
                                  </Link>
                                  <button onClick={() => setShareJob(job)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Share2 size={13} /> Share Job
                                  </button>
                                  <Link href={`/employer/jobs/${job.id}?tab=performance`}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <BarChart3 size={13} /> Analytics
                                  </Link>
                                  <div className="border-t border-gray-50 my-1" />
                                  <button onClick={() => handleDuplicate(job)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Copy size={13} /> Duplicate
                                  </button>
                                  {jobStatus !== 'closed' && (
                                    <button onClick={() => handleCloseJob(job.id)}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                      <X size={13} /> Close Job
                                    </button>
                                  )}
                                  <button onClick={() => handleArchive(job.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Archive size={13} /> Archive
                                  </button>
                                  <div className="border-t border-gray-50 my-1" />
                                  <button onClick={() => handleDelete(job.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Share Modal */}
      {shareJob && (
        <JobShareModal
          isOpen={!!shareJob}
          onClose={() => setShareJob(null)}
          job={{
            id: shareJob.id,
            title: shareJob.title,
            companyName: company?.name || '',
            district: shareJob.district,
            salaryMin: shareJob.salaryMin,
            salaryMax: shareJob.salaryMax,
            salary: shareJob.salary,
            status: resolveStatus(shareJob),
            jobType: shareJob.jobType,
          }}
        />
      )}
    </div>
  );
}
