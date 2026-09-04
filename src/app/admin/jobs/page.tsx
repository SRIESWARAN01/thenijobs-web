'use client';

import { useState } from 'react';
import {
  Briefcase, Search, CheckCircle, XCircle,
  Star, Trash2, AlertTriangle, Clock, MapPin, Download, Loader2, Zap, Calendar,
  Phone, MessageCircle, Eye, Building2, Banknote, Users, ShieldCheck, X, RefreshCw
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import {
  ActionMenu, DataTable, ViewToggle, useViewMode,
  type ActionItem, type Column,
} from '@/components/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { approveJob, rejectJob, deleteDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

interface JobDoc {
  id: string;
  title: string;
  companyName?: string;
  company?: string;
  companyId?: string;
  companyLogoUrl?: string;
  phone?: string;
  whatsapp?: string;
  jobType: string;
  category?: string;
  district?: string;
  location?: string;
  applicationsCount?: number;
  viewCount?: number;
  status?: string;
  approvalStatus?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  isUrgent?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string;
  salaryType?: string;
  openings?: number | string;
  experience?: string;
  education?: string;
  skills?: string[];
  benefits?: string[];
  description?: string;
  jobOrdinal?: string;
  createdAt?: any;
  rejectionReason?: string;
  reportReason?: string;
}

const JOB_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  full_time:  { bg: '#EFF6FF', text: '#2563EB', label: 'Full Time' },
  part_time:  { bg: '#FFFBEB', text: '#D97706', label: 'Part Time' },
  internship: { bg: '#F5F3FF', text: '#7C3AED', label: 'Internship' },
  remote:     { bg: '#ECFDF5', text: '#059669', label: 'Remote' },
  fresher:    { bg: '#ECFDF5', text: '#059669', label: 'Fresher' },
  contract:   { bg: '#F3E8FF', text: '#7E22CE', label: 'Contract' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active:   { bg: '#ECFDF5', text: '#059669', dot: '#059669', label: 'Active / Live' },
  pending:  { bg: '#FFFBEB', text: '#D97706', dot: '#D97706', label: 'Pending Review' },
  expired:  { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF', label: 'Expired' },
  reported: { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626', label: 'Reported' },
  rejected: { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626', label: 'Requires Revision' },
};

const QUICK_REJECTION_REASONS = [
  'Incomplete job description or ambiguous job duties.',
  'Salary range is below standard minimum wage or unspecified.',
  'Unverified employer contact details. Please provide official phone/address.',
  'Duplicate job posting. A similar vacancy is already active.',
  'Post contains promotional or advertising content unrelated to job duties.',
];

const TABS = ['All', 'Pending', 'Active', 'Overdue Apps', 'Rejected', 'Featured'] as const;
const JOB_TYPES = ['All Types', 'Full Time', 'Part Time', 'Internship', 'Remote', 'Fresher', 'Contract'];
const CATEGORIES = ['All Categories', 'IT & Software', 'Marketing', 'Sales', 'Healthcare', 'Education', 'Engineering', 'Retail', 'Agriculture', 'Construction', 'General'];
const DISTRICTS = ['All Districts', 'Theni', 'Madurai', 'Dindigul', 'Chennai', 'Coimbatore', 'Trichy', 'Salem'];

export default function AdminJobsPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { data: jobs, loading } = useCollection<JobDoc>('jobs');
  const { data: companies } = useCollection<any>('companies');
  const { data: applications = [] } = useCollection<any>('applications');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [view, setView] = useViewMode('admin-jobs', 'table');

  // Rejection modal
  const [rejectingJob, setRejectingJob] = useState<JobDoc | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Details modal
  const [inspectingJob, setInspectingJob] = useState<JobDoc | null>(null);

  const isActive = (job: JobDoc) =>
    job.isActive === true && job.status === 'active' && job.approvalStatus !== 'pending' && job.approvalStatus !== 'rejected';
  
  const getStatus = (job: JobDoc) => {
    if (job.status === 'rejected' || job.approvalStatus === 'rejected') return 'rejected';
    if (job.status === 'pending' || job.approvalStatus === 'pending' || job.isActive === false) return 'pending';
    if (job.status === 'active' || job.isActive === true) return 'active';
    return job.status || 'pending';
  };

  const getCompanyContact = (job: JobDoc) => {
    const comp = companies?.find(c => c.id === job.companyId || c.name === job.companyName);
    const phone = job.phone || comp?.phone || '9360519460';
    const whatsapp = job.whatsapp || comp?.whatsapp || comp?.phone || '9360519460';
    return {
      phone: phone.replace(/[^0-9+]/g, ''),
      whatsapp: whatsapp.replace(/[^0-9]/g, ''),
    };
  };

  const filtered = jobs.filter(job => {
    const company = job.companyName || job.company || '';
    const matchSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || company.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStatus(job);
    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') matchTab = !!job.isFeatured;
    else if (activeTab === 'Active') matchTab = status === 'active';
    else if (activeTab === 'Pending') matchTab = status === 'pending';
    else if (activeTab === 'Rejected') matchTab = status === 'rejected';

    const typeLabel = JOB_TYPE_STYLES[job.jobType]?.label || job.jobType;
    const matchType = typeFilter === 'All Types' || typeLabel === typeFilter;
    const matchCat = categoryFilter === 'All Categories' || (job.category || '') === categoryFilter;
    const matchDist = districtFilter === 'All Districts' || (job.district || '') === districtFilter;
    return matchSearch && matchTab && matchType && matchCat && matchDist;
  });

  const doApprove = async (job: JobDoc) => {
    setActionLoading(job.id);
    try {
      await approveJob(job.id, currentUser?.uid || 'admin');
      toast.success('Job Approved & Activated! 🚀', `"${job.title}" is now live on THENIJOBS.`);

      const { whatsapp } = getCompanyContact(job);
      if (whatsapp) {
        const msg = `🎉 *CONGRATULATIONS FROM THENIJOBS!*\n\nYour job opening *"${job.title}"* for *${job.companyName || 'your company'}* has been approved and is now LIVE on THENIJOBS.\n\nCandidates can now view and apply directly. Manage applications on https://thenijobs.com/employer/jobs`;
        window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Approval failed', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (job: JobDoc) => {
    setRejectingJob(job);
    setRejectionReason(QUICK_REJECTION_REASONS[0]);
  };

  const handleConfirmReject = async (sendOnWhatsApp = false) => {
    if (!rejectingJob) return;
    if (!rejectionReason.trim()) {
      toast.warning('Please enter a rejection reason.');
      return;
    }

    setActionLoading(rejectingJob.id);
    try {
      await rejectJob(rejectingJob.id, currentUser?.uid || 'admin', rejectionReason.trim());
      toast.info('Job Posting Rejected', `Reason saved for ${rejectingJob.title}`);

      if (sendOnWhatsApp) {
        const { whatsapp } = getCompanyContact(rejectingJob);
        if (whatsapp) {
          const msg = `⚠️ *THENIJOBS Job Review Update*\n\nRegarding your job listing *"${rejectingJob.title}"*:\n\n*Status:* Requires Revision\n*Reason:* ${rejectionReason.trim()}\n\nPlease edit your job details and resubmit on https://thenijobs.com/employer/jobs`;
          window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }

      setRejectingJob(null);
      setRejectionReason('');
    } catch (e: any) {
      console.error(e);
      toast.error('Rejection failed', e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const doToggleFeatured = async (id: string, cur?: boolean) => {
    setActionLoading(id);
    try {
      await updateDocument('jobs', id, { isFeatured: !cur });
      toast.success(cur ? 'Removed from Featured' : 'Marked as Featured');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const doDelete = async (id: string) => {
    if (!window.confirm('Delete this job posting permanently?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('jobs', id);
      toast.info('Job listing removed.');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const totalCount = jobs.length;
  const activeCount = jobs.filter(isActive).length;
  const pendingCount = jobs.filter(j => getStatus(j) === 'pending').length;
  const rejectedCount = jobs.filter(j => getStatus(j) === 'rejected').length;
  const featuredCount = jobs.filter(j => j.isFeatured).length;

  const overdueApplications = applications.filter((a: any) => {
    const isPending = a.status === 'applied' || a.status === 'under_review' || !a.status;
    if (!isPending) return false;
    const createdMillis = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : Date.now());
    return (Date.now() - createdMillis) > 7 * 86400000;
  });

  const jobColumns: Column<JobDoc>[] = [
    {
      key: 'title',
      header: 'Job',
      card: 'title',
      sortValue: job => job.title ?? '',
      render: job => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-slate-900">{job.title}</span>
            {job.jobOrdinal && (
              <span className="shrink-0 rounded-full border border-blue-100 bg-[#EFF6FF] px-1.5 py-0.5 text-[10px] font-bold text-[#1E40AF]">
                {job.jobOrdinal}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Building2 size={11} className="shrink-0 text-blue-600" aria-hidden />
            <span className="truncate">{job.companyName || job.company || 'Company'}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'jobType',
      header: 'Type',
      sortValue: job => job.jobType ?? '',
      render: job => {
        const t = JOB_TYPE_STYLES[job.jobType];
        return (
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: t?.bg ?? '#F1F5F9', color: t?.text ?? '#475569' }}
          >
            {t?.label ?? job.jobType ?? '—'}
          </span>
        );
      },
    },
    {
      key: 'district',
      header: 'Location',
      hideBelow: 'lg',
      sortValue: job => job.district || job.location || '',
      render: job => job.district || job.location || 'Theni',
    },
    {
      key: 'salary',
      header: 'Salary',
      hideBelow: 'xl',
      sortValue: job => Number(job.salaryMin) || 0,
      render: job => job.salaryMin && job.salaryMax
        ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} – ₹${Number(job.salaryMax).toLocaleString('en-IN')}/${job.salaryType || 'mo'}`
        : job.salary || 'On request',
    },
    {
      key: 'applicationsCount',
      header: 'Applied',
      align: 'center',
      sortValue: job => job.applicationsCount ?? 0,
      render: job => <span className="font-semibold tabular-nums">{job.applicationsCount || 0}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: job => getStatus(job),
      render: job => {
        const st = STATUS_STYLES[getStatus(job)] || STATUS_STYLES.pending;
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
    <div className="p-4 sm:p-6 space-y-6 font-outfit text-gray-900 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Job Approvals &amp; Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review employer postings, verify salary, follow-up overdue applications (7+ days), and activate listings
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {[
          { label: 'Total Postings', value: totalCount, icon: Briefcase, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Pending Review', value: pendingCount, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Active & Live', value: activeCount, icon: Zap, bg: '#ECFDF5', color: '#059669' },
          { label: 'Overdue Apps', value: overdueApplications.length, icon: AlertTriangle, bg: '#FEF3C7', color: '#B45309' },
          { label: 'Requires Revision', value: rejectedCount, icon: XCircle, bg: '#FEF2F2', color: '#DC2626' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs" style={{ background: s.bg }}>
                  <Icon size={20} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 font-bold">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl bg-gray-100/80 overflow-x-auto no-scrollbar w-fit max-w-full">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] text-white font-extrabold bg-amber-600">
                {pendingCount}
              </span>
            )}
            {tab === 'Overdue Apps' && overdueApplications.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] text-white font-extrabold bg-rose-600">
                {overdueApplications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by job title, company name, or district..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: typeFilter, onChange: setTypeFilter, options: JOB_TYPES },
            { value: categoryFilter, onChange: setCategoryFilter, options: CATEGORIES },
            { value: districtFilter, onChange: setDistrictFilter, options: DISTRICTS },
          ].map((s, i) => (
            <select
              key={i}
              value={s.value}
              onChange={e => s.onChange(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer bg-white"
            >
              {s.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {/* Overdue Applications Tab View */}
      {activeTab === 'Overdue Apps' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">7-Day Employer Response SLA System</p>
              <p className="mt-0.5">
                These candidate applications have had no response from employers for over 7 days. As an Admin, you can follow up with the employer via direct Phone call or WhatsApp message to prompt their review.
              </p>
            </div>
          </div>

          {overdueApplications.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs">
              <CheckCircle size={36} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-bold text-gray-800">All Applications on Track!</p>
              <p className="text-xs text-gray-500 mt-0.5">No overdue applications (&gt; 7 days) at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {overdueApplications.map((app: any) => {
                const createdMillis = app.createdAt?.toMillis ? app.createdAt.toMillis() : (app.createdAt ? new Date(app.createdAt).getTime() : Date.now());
                const daysAgo = Math.floor((Date.now() - createdMillis) / 86400000);
                const comp = companies?.find((c: any) => c.id === app.companyId || c.name === app.companyName);
                const empPhone = (app.companyPhone || comp?.phone || '9360519460').replace(/[^0-9+]/g, '');
                const empWhatsApp = (app.companyWhatsapp || comp?.whatsapp || comp?.phone || '9360519460').replace(/[^0-9]/g, '');

                const waMessage = `⚠️ *THENIJOBS Admin Reminder*\n\nHello *${app.companyName || 'Employer'}*,\n\nCandidate *${app.seekerName}* applied for *"${app.jobTitle}"* *${daysAgo} days ago* on THENIJOBS.\n\nAccording to THENIJOBS guidelines, applications should receive a response within 7 days. Please login and review candidate status:\nhttps://thenijobs.com/employer/candidates`;

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-3xl p-5 border border-amber-300 ring-2 ring-amber-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Clock size={11} className="text-amber-700" /> Overdue: {daysAgo} Days Pending
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          {new Date(createdMillis).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-gray-900 leading-snug">{app.seekerName}</h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 font-medium">
                          <Briefcase size={12} className="text-blue-600 shrink-0" /> {app.jobTitle}
                        </p>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 font-medium">
                          <Building2 size={12} className="text-gray-500 shrink-0" /> {app.companyName || 'Employer'}
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 text-gray-600">
                        <p><span className="text-slate-500">Candidate Phone:</span> <strong>{app.seekerPhone || 'Provided in app'}</strong></p>
                        <p><span className="text-slate-500">Status:</span> <strong className="text-blue-700 uppercase">{app.status || 'applied'}</strong></p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                      <a
                        href={`tel:${empPhone}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200"
                      >
                        <Phone size={13} /> Call Employer
                      </a>
                      <a
                        href={`https://wa.me/${empWhatsApp}?text=${encodeURIComponent(waMessage)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
                        style={{ background: '#25D366' }}
                      >
                        <MessageCircle size={13} /> WhatsApp Follow-up
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="text-blue-600 animate-spin" />
          <p className="text-xs text-gray-500 font-semibold">Loading job postings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center shadow-xs">
          <Briefcase size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">No jobs match this filter</p>
          <p className="text-xs text-slate-500 mt-0.5">Try selecting a different tab or clearing search filters.</p>
        </div>
      ) : (
        <DataTable
          label="Job moderation queue"
          view={view}
          gridColumns={3}
          columns={jobColumns}
          rows={filtered}
          getRowId={job => job.id}
          rowActions={job => {
            if (actionLoading === job.id) {
              return <Loader2 size={16} className="animate-spin text-blue-600" aria-label="Saving" />;
            }
            const jobStatus = getStatus(job);
            const { phone, whatsapp } = getCompanyContact(job);
            const items: ActionItem[] = [
              { label: 'View full details', icon: Eye, onClick: () => setInspectingJob(job) },
            ];
            if (phone) items.push({ label: 'Call employer', icon: Phone, href: `tel:${phone}` });
            if (whatsapp) {
              items.push({
                label: 'WhatsApp employer',
                icon: MessageCircle,
                external: true,
                href: `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${job.companyName || 'Employer'}, this is THENIJOBS Admin regarding your job posting "${job.title}".`)}`,
              });
            }
            if (jobStatus === 'pending' || job.isActive === false) {
              items.push({ label: 'Approve & make live', icon: CheckCircle, tone: 'success', separatorBefore: true, onClick: () => doApprove(job) });
              items.push({ label: 'Reject with reason', icon: XCircle, tone: 'danger', onClick: () => openRejectModal(job) });
            } else if (jobStatus === 'active') {
              items.push({ label: 'Request revisions', icon: XCircle, separatorBefore: true, onClick: () => openRejectModal(job) });
            } else {
              items.push({ label: 'Re-approve job', icon: RefreshCw, tone: 'success', separatorBefore: true, onClick: () => doApprove(job) });
            }
            items.push({
              label: job.isFeatured ? 'Remove from homepage' : 'Feature on homepage',
              icon: Star,
              separatorBefore: true,
              onClick: () => doToggleFeatured(job.id, job.isFeatured),
            });
            items.push({ label: 'Delete listing', icon: Trash2, tone: 'danger', separatorBefore: true, onClick: () => doDelete(job.id) });
            return <ActionMenu label={`Actions for ${job.title}`} items={items} />;
          }}
        />
      )}

      {/* Reject Modal */}
      {rejectingJob && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-outfit" onClick={() => setRejectingJob(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-red-200 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-red-950 flex items-center gap-2">
                <XCircle size={18} className="text-red-600" />
                Reject Job Listing — {rejectingJob.title}
              </h3>
              <button onClick={() => setRejectingJob(null)} className="p-1 rounded-lg text-slate-500 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Select or type the revision reason. The employer will see this reason in their portal and on WhatsApp.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Quick Reasons:</label>
              {QUICK_REJECTION_REASONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRejectionReason(r)}
                  className={`w-full text-left text-xs p-2.5 rounded-xl border transition-all cursor-pointer ${
                    rejectionReason === r ? 'bg-red-50 border-red-300 text-red-900 font-bold' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Custom Rejection Reason:</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Explain what details the employer needs to correct..."
                className="w-full p-3 rounded-xl border border-gray-300 text-xs text-gray-900 outline-none focus:border-red-500 font-medium leading-relaxed"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRejectingJob(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(false)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                Reject in Portal
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(true)}
                className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={13} /> Reject &amp; WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Details Modal */}
      {inspectingJob && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-outfit" onClick={() => setInspectingJob(null)}>
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {inspectingJob.jobType}
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-1">{inspectingJob.title}</h3>
                <p className="text-xs text-gray-500">{inspectingJob.companyName || 'Company'}</p>
              </div>
              <button onClick={() => setInspectingJob(null)} className="p-1 rounded-lg text-slate-500 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2 text-gray-700">
              <p className="flex justify-between"><span className="text-gray-500">District / Location:</span> <span className="font-bold">{inspectingJob.location ? `${inspectingJob.location}, ` : ''}{inspectingJob.district}</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Salary:</span> <span className="font-bold text-emerald-700">{inspectingJob.salary || '—'}</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Experience / Education:</span> <span className="font-bold">{inspectingJob.experience || '—'} / {inspectingJob.education || '—'}</span></p>
              <p className="flex justify-between"><span className="text-gray-500">Openings:</span> <span className="font-bold">{inspectingJob.openings || 1}</span></p>
            </div>

            {inspectingJob.skills && inspectingJob.skills.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-800 block">Skills Required:</span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingJob.skills.map((s, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-100">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-xs font-bold text-gray-800 block mb-1">Full Description:</span>
              <p className="text-xs text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-2xl border border-gray-200 leading-relaxed max-h-48 overflow-y-auto">
                {inspectingJob.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { const j = inspectingJob; setInspectingJob(null); doApprove(j); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                Approve &amp; Activate
              </button>
              <button
                type="button"
                onClick={() => { const j = inspectingJob; setInspectingJob(null); openRejectModal(j); }}
                className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200"
              >
                Reject with Reason
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
