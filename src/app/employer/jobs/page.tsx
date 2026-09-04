'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Plus, Search, Eye, Users2, MoreVertical,
  Pause, Play, Trash2, Zap, Clock, Loader2, X, AlertTriangle,
  Share2, Copy, Archive, Edit3, BarChart3, Banknote, FileText, Calendar,
  ExternalLink, ArrowRight, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument, createDocument } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import JobShareModal from '@/components/employer/JobShareModal';
import { useToast } from '@/contexts/ToastContext';

type JobStatus = 'active' | 'pending' | 'rejected' | 'paused' | 'draft' | 'closed' | 'expired';
type TabFilter = 'all' | JobStatus;

interface JobDoc {
  id: string;
  title: string;
  jobType: string;
  location?: string;
  district?: string;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string;
  salaryType?: string;
  applicationsCount?: number;
  viewCount?: number;
  status?: JobStatus;
  approvalStatus?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  isUrgent?: boolean;
  jobOrdinal?: string;
  rejectionReason?: string;
  createdAt?: any;
  deadline?: any;
}

const TABS: { label: string; value: TabFilter }[] = [
  { label: 'All Postings', value: 'all' },
  { label: 'Active & Live', value: 'active' },
  { label: 'Pending Review', value: 'pending' },
  { label: 'Needs Revision', value: 'rejected' },
  { label: 'Paused', value: 'paused' },
  { label: 'Closed', value: 'closed' },
];

const STATUS_STYLES: Record<JobStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:   { bg: '#ECFDF5', text: '#059669', dot: '#059669', label: 'Active & Live' },
  pending:  { bg: '#FFFBEB', text: '#D97706', dot: '#D97706', label: 'Pending Admin Review' },
  rejected: { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626', label: 'Requires Revision' },
  paused:   { bg: '#F5F3FF', text: '#7C3AED', dot: '#7C3AED', label: 'Paused' },
  draft:    { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF', label: 'Draft' },
  closed:   { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626', label: 'Closed' },
  expired:  { bg: '#F9FAFB', text: '#9CA3AF', dot: '#9CA3AF', label: 'Expired' },
};

function resolveStatus(j: JobDoc): JobStatus {
  if (j.status === 'rejected' || j.approvalStatus === 'rejected') return 'rejected';
  if (j.status === 'pending' || j.approvalStatus === 'pending' || j.isActive === false) return 'pending';
  if (j.status === 'active' || (j.isActive === true && !j.status)) return 'active';
  if (j.status === 'paused') return 'paused';
  if (j.status === 'closed') return 'closed';
  if (j.status === 'expired') return 'expired';
  return 'draft';
}

export default function EmployerJobsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

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
    // RULES-1 (D-JOBSTATE): a poster may pause; resuming sends the job back for admin review.
    const next: JobStatus = currentStatus === 'active' ? 'paused' : 'pending';
    try {
      await updateDocument('jobs', id, { status: next, isActive: false });
      toast.success(next === 'pending' ? 'Sent for re-approval — it goes live after admin review.' : 'Job paused.');
    } catch (e: any) {
      console.error(e);
      toast.error('Status update failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseJob = async (id: string) => {
    setActionLoading(id);
    setOpenMenuId(null);
    try {
      await updateDocument('jobs', id, { status: 'closed', isActive: false });
      toast.info('Job closed.');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to close job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this job posting permanently?')) return;
    setActionLoading(id);
    setOpenMenuId(null);
    try {
      await deleteDocument('jobs', id);
      toast.info('Job deleted.');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to delete job');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (job: JobDoc) => {
    setActionLoading(job.id);
    setOpenMenuId(null);
    try {
      const { id: _id, createdAt: _ca, viewCount: _vc, applicationsCount: _ac, status: _s, isActive: _ia, ...rest } = job as any;
      await createDocument('jobs', {
        ...rest,
        title: `${job.title} (Copy)`,
        status: 'draft',
        isActive: false,
        viewCount: 0,
        applicationsCount: 0,
        companyId,
        postedBy: user?.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      toast.success('Job duplicated as draft!');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to duplicate job');
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = jobs.filter(j => resolveStatus(j) === 'active').length;
  const pendingCount = jobs.filter(j => resolveStatus(j) === 'pending').length;
  const rejectedCount = jobs.filter(j => resolveStatus(j) === 'rejected').length;
  const totalApps = jobs.reduce((s, j) => s + (j.applicationsCount || 0), 0);
  const loading = companyLoading || jobsLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-4 font-outfit">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-200 shadow-xs">
          <Briefcase size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Company Profile</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
          Register your company profile first to post and manage job openings on THENIJOBS.
        </p>
        <Link
          href="/employer/company-profile"
          className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
        >
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit text-gray-900 pb-20 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Job Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage, track applications, and monitor your job postings</p>
        </div>
        <Link
          href="/employer/post-job"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus size={16} /> Post New Job
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading job listings...</p>
        </div>
      ) : (
        <>
          {/* KPI stats grid matching Dashboard standard */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { label: 'Active & Live', count: activeCount, icon: Briefcase, bg: '#EFF6FF', color: '#2563EB' },
              { label: 'Pending Review', count: pendingCount, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
              { label: 'Needs Revision', count: rejectedCount, icon: AlertTriangle, bg: '#FEF2F2', color: '#DC2626' },
              { label: 'Total Applications', count: totalApps, icon: Users2, bg: '#F5F3FF', color: '#7C3AED' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: s.bg }}>
                      <Icon size={20} style={{ color: s.color }} />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">{s.count}</p>
                      <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filter Bar & Tabs (Touch Scrollable) */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-1.5">
              {TABS.map(t => {
                const count = t.value === 'all' ? jobs.length : jobs.filter(j => resolveStatus(j) === t.value).length;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTab(t.value)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      tab === t.value ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t.label} <span className="opacity-60 text-[11px]">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="relative sm:w-72">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search job titles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Responsive Job Cards List (Zero Horizontal Overflow) */}
          <div className="space-y-3.5">
            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs space-y-3">
                <Briefcase size={36} className="mx-auto text-gray-300" />
                <p className="text-sm font-bold text-gray-700">No jobs found in this section</p>
                <p className="text-xs text-gray-500">
                  Switch tabs or{' '}
                  <Link href="/employer/post-job" className="text-blue-600 font-bold hover:underline">
                    post a new job vacancy
                  </Link>
                </p>
              </div>
            ) : (
              filtered.map(job => {
                const jobStatus = resolveStatus(job);
                const st = STATUS_STYLES[jobStatus];
                const salary = job.salaryMin && job.salaryMax
                  ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} – ₹${Number(job.salaryMax).toLocaleString('en-IN')}/${job.salaryType || 'mo'}`
                  : job.salary || 'Salary Negotiable';

                return (
                  <div
                    key={job.id}
                    className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs hover:shadow-md transition-all ${
                      jobStatus === 'pending' ? 'border-amber-300 bg-amber-50/20' :
                      jobStatus === 'rejected' ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Info & Badges */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/employer/jobs/${job.id}`}
                            className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors leading-snug"
                          >
                            {job.title}
                          </Link>

                          {job.jobOrdinal && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {job.jobOrdinal}
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-gray-100 text-gray-700">
                            {job.jobType?.replace('_', ' ') || 'Full Time'}
                          </span>

                          {job.isUrgent && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-700">
                              ⚡ URGENT
                            </span>
                          )}

                          {job.isFeatured && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800">
                              ⭐ FEATURED
                            </span>
                          )}

                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0"
                            style={{ background: st.bg, color: st.text }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                            {st.label}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 font-medium">
                          {job.district || 'Theni'} {job.location ? `· ${job.location}` : ''} · <span className="text-emerald-700 font-bold">{salary}</span> ·{' '}
                          Posted {job.createdAt ? new Date(job.createdAt?.toMillis?.() || job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                        </p>

                        {jobStatus === 'rejected' && job.rejectionReason && (
                          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                            <span className="font-bold block">Revision Required:</span>
                            <p className="text-red-800 leading-relaxed">{job.rejectionReason}</p>
                            <Link
                              href="/employer/post-job"
                              className="inline-block mt-1 font-bold text-red-700 hover:underline"
                            >
                              Edit details and resubmit →
                            </Link>
                          </div>
                        )}

                        {jobStatus === 'pending' && (
                          <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                            <Clock size={14} className="text-amber-600 shrink-0" />
                            <span>Submitted for Admin review — will automatically go live once approved.</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Metrics & Actions */}
                      <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-0 border-gray-100">
                        {/* Applications & Views counter */}
                        <div className="flex items-center gap-3">
                          <Link
                            href="/employer/candidates"
                            className="text-center p-2 rounded-2xl hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1 text-sm font-black text-gray-900">
                              <Users2 size={14} className="text-blue-600" /> {job.applicationsCount || 0}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">Applicants</p>
                          </Link>

                          <div className="text-center p-2 rounded-2xl">
                            <div className="flex items-center justify-center gap-1 text-sm font-black text-gray-900">
                              <Eye size={14} className="text-purple-600" /> {job.viewCount || 0}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">Views</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {actionLoading === job.id ? (
                            <Loader2 size={16} className="animate-spin text-blue-600 mx-2" />
                          ) : (
                            <>
                              {(jobStatus === 'active' || jobStatus === 'paused') && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(job.id, jobStatus)}
                                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                                    jobStatus === 'active'
                                      ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                  title={jobStatus === 'active' ? 'Pause Posting' : 'Resume Posting'}
                                >
                                  {jobStatus === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                </button>
                              )}

                              {jobStatus === 'active' && (
                                <button
                                  type="button"
                                  onClick={() => setShareJob(job)}
                                  className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all cursor-pointer"
                                  title="Share Job"
                                >
                                  <Share2 size={14} />
                                </button>
                              )}

                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                                  className="p-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all cursor-pointer"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {openMenuId === job.id && (
                                  <div className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 overflow-hidden py-1 animate-fade-in font-medium">
                                    <Link
                                      href={`/employer/jobs/${job.id}`}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                      <Eye size={13} /> View Analytics
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicate(job)}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                      <Copy size={13} /> Duplicate Job
                                    </button>
                                    {jobStatus !== 'closed' && (
                                      <button
                                        type="button"
                                        onClick={() => handleCloseJob(job.id)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                      >
                                        <Archive size={13} /> Close Posting
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(job.id)}
                                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 size={13} /> Delete Posting
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
              })
            )}
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
            companyName: company?.name || 'Company',
            district: shareJob.district,
            location: shareJob.location,
            salaryMin: shareJob.salaryMin,
            salaryMax: shareJob.salaryMax,
            salary: shareJob.salary,
            status: shareJob.status,
            jobType: shareJob.jobType,
          }}
        />
      )}
    </div>
  );
}
