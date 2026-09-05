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
import {
  ActionMenu, Button, DataTable, Pill, ViewToggle, useViewMode,
  type ActionItem, type Column,
} from '@/components/dashboard';
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
  const [view, setView] = useViewMode('employer-jobs', 'table');
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

  const jobColumns: Column<JobDoc>[] = [
    {
      key: 'title',
      header: 'Job',
      card: 'title',
      sortValue: job => job.title ?? '',
      render: job => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/employer/jobs/${job.id}`}
              className="truncate font-semibold text-slate-900 transition-colors hover:text-blue-600"
            >
              {job.title}
            </Link>
            {job.isUrgent && <Pill tone="danger">Urgent</Pill>}
            {job.jobOrdinal && (
              <span className="shrink-0 rounded-full border border-blue-100 bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-bold text-[#1E40AF]">
                {job.jobOrdinal}
              </span>
            )}
          </div>
          <span className="block truncate text-xs text-slate-500">
            {(job.jobType || 'full_time').replace(/_/g, ' ')} · {job.district || job.location || 'Theni'}
          </span>
        </div>
      ),
    },
    {
      key: 'salary',
      header: 'Salary',
      hideBelow: 'xl',
      sortValue: job => Number(job.salaryMin) || 0,
      render: job => job.salaryMin && job.salaryMax
        ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} – ₹${Number(job.salaryMax).toLocaleString('en-IN')}/${job.salaryType || 'mo'}`
        : job.salary || 'Negotiable',
    },
    {
      key: 'applicationsCount',
      header: 'Applicants',
      align: 'center',
      sortValue: job => job.applicationsCount ?? 0,
      render: job => (
        <Link href="/employer/candidates" className="inline-flex items-center gap-1 font-semibold tabular-nums text-slate-900 hover:text-blue-600">
          <Users2 size={13} className="text-blue-600" aria-hidden /> {job.applicationsCount || 0}
        </Link>
      ),
    },
    {
      key: 'viewCount',
      header: 'Views',
      align: 'center',
      hideBelow: 'lg',
      sortValue: job => job.viewCount ?? 0,
      render: job => (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Eye size={13} className="text-violet-600" aria-hidden /> {job.viewCount || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: job => resolveStatus(job),
      render: job => {
        const st = STATUS_STYLES[resolveStatus(job)];
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: st.bg, color: st.text }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.dot }} />
            {st.label}
          </span>
        );
      },
    },
  ];

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
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search job titles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-base sm:text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <ViewToggle value={view} onChange={setView} />
          </div>

          <DataTable
            label="Your job postings"
            view={view}
            gridColumns={2}
            columns={jobColumns}
            rows={filtered}
            getRowId={job => job.id}
            emptyIcon={Briefcase}
            emptyTitle="No jobs found in this section"
            emptyDescription="Switch tabs, or post a new vacancy to get started."
            emptyAction={
              <Link href="/employer/post-job">
                <Button variant="primary">Post a new job</Button>
              </Link>
            }
            rowActions={job => {
              if (actionLoading === job.id) {
                return <Loader2 size={16} className="animate-spin text-blue-600" aria-label="Saving" />;
              }
              const jobStatus = resolveStatus(job);
              const items: ActionItem[] = [
                { label: 'View analytics', icon: Eye, href: `/employer/jobs/${job.id}` },
              ];
              if (jobStatus === 'active' || jobStatus === 'paused') {
                items.push({
                  label: jobStatus === 'active' ? 'Pause posting' : 'Resume posting',
                  icon: jobStatus === 'active' ? Pause : Play,
                  onClick: () => handleToggleStatus(job.id, jobStatus),
                });
              }
              if (jobStatus === 'active') {
                items.push({ label: 'Share job', icon: Share2, onClick: () => setShareJob(job) });
              }
              items.push({ label: 'Duplicate job', icon: Copy, separatorBefore: true, onClick: () => handleDuplicate(job) });
              if (jobStatus !== 'closed') {
                items.push({ label: 'Close posting', icon: Archive, onClick: () => handleCloseJob(job.id) });
              }
              items.push({ label: 'Delete posting', icon: Trash2, tone: 'danger', separatorBefore: true, onClick: () => handleDelete(job.id) });
              return <ActionMenu label={`Actions for ${job.title}`} items={items} />;
            }}
          />
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
