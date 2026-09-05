'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Eye, Users2, Star, Mic, CheckCircle2, XCircle,
  Pause, Play, X as XIcon, RotateCcw, Copy, Trash2, Archive, Share2,
  Loader2, MapPin, Banknote, Clock, Calendar, FileText,
  Zap, Phone, Video, History, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useDocument, useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument, createDocument } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import JobShareModal from '@/components/employer/JobShareModal';
import JobPreviewModal from '@/components/employer/JobPreviewModal';
import JobPerformanceDashboard from '@/components/employer/JobPerformanceDashboard';
import JobQuickUpdateModals from '@/components/employer/JobQuickUpdateModals';
import {
  ActionMenu, Button, PageHeader, PageShell, Pill, Stat, StatGrid, Tabs,
  type ActionItem,
} from '@/components/dashboard';

type JobStatus = 'active' | 'pending' | 'rejected' | 'paused' | 'draft' | 'closed' | 'expired';
type TabId = 'overview' | 'applications' | 'performance' | 'history';
type QuickModal = 'salary' | 'description' | 'skills' | 'vacancies' | 'deadline' | 'contact' | 'interview' | null;

const STATUS_STYLES: Record<JobStatus, { bg: string; text: string; label: string }> = {
  active:   { bg: '#ECFDF5', text: '#059669', label: 'Live' },
  pending:  { bg: '#FFFBEB', text: '#D97706', label: 'Pending Approval' },
  rejected: { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected' },
  paused:   { bg: '#F5F3FF', text: '#7C3AED', label: 'Paused' },
  draft:    { bg: '#F9FAFB', text: '#6B7280', label: 'Draft' },
  closed:   { bg: '#FEF2F2', text: '#DC2626', label: 'Closed' },
  expired:  { bg: '#F9FAFB', text: '#9CA3AF', label: 'Expired' },
};

function resolveStatus(job: any): JobStatus {
  if (job.status === 'pending') return 'pending';
  if (job.status === 'rejected') return 'rejected';
  if (job.status === 'active' || (job.isActive === true && !job.status)) return 'active';
  if (job.status === 'paused') return 'paused';
  if (job.status === 'closed') return 'closed';
  if (job.status === 'expired') return 'expired';
  if (job.isActive === false) return 'pending';
  return 'draft';
}

export default function EmployerJobDetailClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  // Fetch job document
  const { data: job, loading: jobLoading } = useDocument<any>('jobs', jobId);

  // Fetch company for preview
  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];

  // Fetch applications for this job
  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('jobId', '==', jobId),
    orderBy('appliedAt', 'desc')
  ], { skip: !jobId });

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [quickModal, setQuickModal] = useState<QuickModal>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const jobStatus = job ? resolveStatus(job) : 'draft';
  const statusStyle = STATUS_STYLES[jobStatus];

  // Performance data from applications
  const perfData = useMemo(() => {
    const apps = applications || [];
    return {
      views: job?.viewCount || 0,
      applications: apps.length,
      underReview: apps.filter((a: any) => a.status === 'under_review' || a.status === 'applied').length,
      shortlisted: apps.filter((a: any) => a.status === 'shortlisted').length,
      interview: apps.filter((a: any) => a.status === 'interview').length,
      selected: apps.filter((a: any) => a.status === 'selected' || a.status === 'hired').length,
      rejected: apps.filter((a: any) => a.status === 'rejected').length,
    };
  }, [applications, job]);

  const salary = job?.salaryMin && job?.salaryMax
    ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} – ₹${Number(job.salaryMax).toLocaleString('en-IN')}/mo`
    : job?.salary || '—';

  // Actions
  const handleStatusChange = async (newStatus: JobStatus) => {
    setActionLoading(newStatus);
    try {
      // RULES-1 (D-JOBSTATE): a poster cannot self-activate; "resume" re-submits for admin review.
      const status: JobStatus = newStatus === 'active' ? 'pending' : newStatus;
      await updateDocument('jobs', jobId, { status, isActive: false, updatedAt: new Date() });
      if (status === 'pending') toast.success('Sent for re-approval — it goes live after admin review.');
      else if (status === 'paused') toast.success('Job paused.');
      else if (status === 'closed') toast.info('Job closed.');
    } catch (e) { console.error(e); toast.error('Status update failed'); }
    finally { setActionLoading(null); }
  };

  const handleDuplicate = async () => {
    if (!job) return;
    setActionLoading('duplicate');
    try {
      const { id: _id, createdAt: _ca, viewCount: _vc, applicationsCount: _ac, status: _s, isActive: _ia, ...rest } = job;
      const newId = await createDocument('jobs', {
        ...rest,
        title: `${job.title} (Copy)`,
        status: 'draft',
        isActive: false,
        viewCount: 0,
        applicationsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      router.push(`/employer/jobs/${newId}`);
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleArchive = async () => {
    setActionLoading('archive');
    try {
      await updateDocument('jobs', jobId, { status: 'closed', isActive: false, archived: true, updatedAt: new Date() });
      router.push('/employer/jobs');
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this job posting?')) return;
    setActionLoading('delete');
    try {
      await deleteDocument('jobs', jobId);
      router.push('/employer/jobs');
    } catch (e) { console.error(e); }
    finally { setActionLoading(null); }
  };

  const handleExtend = async () => {
    setQuickModal('deadline');
  };

  if (jobLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Briefcase size={32} className="text-slate-500 mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Job Not Found</h2>
        <p className="text-sm text-gray-500 mt-1 mb-4">This job posting may have been deleted.</p>
        <Link href="/employer/jobs" className="text-sm font-semibold text-blue-600 hover:text-blue-800">← Back to Jobs</Link>
      </div>
    );
  }

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'applications', label: 'Applications', count: perfData.applications },
    { id: 'performance', label: 'Performance' },
    { id: 'history', label: 'History' },
  ];

  const QUICK_ACTIONS = [
    { label: 'Update Salary', icon: Banknote, modal: 'salary' as QuickModal, color: '#059669' },
    { label: 'Update Description', icon: FileText, modal: 'description' as QuickModal, color: '#2563EB' },
    { label: 'Update Skills', icon: Zap, modal: 'skills' as QuickModal, color: '#7C3AED' },
    { label: 'Update Vacancies', icon: Users2, modal: 'vacancies' as QuickModal, color: '#D97706' },
    { label: 'Update Deadline', icon: Calendar, modal: 'deadline' as QuickModal, color: '#DC2626' },
    { label: 'Update Contact', icon: Phone, modal: 'contact' as QuickModal, color: '#0891B2' },
    { label: 'Update Interview', icon: Video, modal: 'interview' as QuickModal, color: '#E11D48' },
  ];

  const menuItems: ActionItem[] = [
    { label: 'Share job', icon: Share2, onClick: () => setShowShareModal(true) },
    { label: 'Preview', icon: Eye, onClick: () => setShowPreviewModal(true) },
  ];
  if (jobStatus !== 'closed') {
    menuItems.push({ label: 'Close job', icon: XIcon, separatorBefore: true, onClick: () => handleStatusChange('closed') });
  }
  if (jobStatus === 'expired') {
    menuItems.push({ label: 'Extend deadline', icon: RotateCcw, onClick: handleExtend });
  }
  menuItems.push({ label: 'Duplicate job', icon: Copy, onClick: handleDuplicate });
  menuItems.push({ label: 'Archive', icon: Archive, onClick: handleArchive });
  menuItems.push({ label: 'Delete', icon: Trash2, tone: 'danger', separatorBefore: true, onClick: handleDelete });

  return (
    <PageShell className="max-w-5xl">
      <PageHeader
        title={job.title}
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Jobs', href: '/employer/jobs' }, { label: job.title }]}
        actions={
          <>
            {(jobStatus === 'active' || jobStatus === 'paused') && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleStatusChange(jobStatus === 'active' ? 'paused' : 'active')}
                disabled={!!actionLoading}
                title={jobStatus === 'active' ? 'Pause' : 'Resume (re-submits for admin approval)'}
                className={
                  jobStatus === 'active'
                    ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }
              >
                {actionLoading === 'paused' || actionLoading === 'active'
                  ? <Loader2 size={16} className="animate-spin" />
                  : jobStatus === 'active' ? <Pause size={16} /> : <Play size={16} />}
              </Button>
            )}
            <ActionMenu label={`Actions for ${job.title}`} items={menuItems} />
          </>
        }
      />

      <div className="-mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 sm:-mt-4">
        <Pill tone="neutral">{statusStyle.label}</Pill>
        <span>{job.district || 'Theni'} · {salary}</span>
        <span>{job.jobType || 'Full Time'}</span>
      </div>

      <StatGrid columns={6}>
        <Stat label="Views" value={perfData.views} icon={Eye} tone="blue" />
        <Stat label="Applied" value={perfData.applications} icon={FileText} tone="violet" />
        <Stat label="Shortlisted" value={perfData.shortlisted} icon={Star} tone="emerald" />
        <Stat label="Interview" value={perfData.interview} icon={Mic} tone="blue" />
        <Stat label="Selected" value={perfData.selected} icon={CheckCircle2} tone="emerald" />
        <Stat label="Rejected" value={perfData.rejected} icon={XCircle} tone="rose" />
      </StatGrid>

      <Tabs label="Job detail sections" value={activeTab} onChange={(id) => setActiveTab(id as TabId)} tabs={TABS} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Quick Update Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Updates</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <button key={action.label} onClick={() => setQuickModal(action.modal)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-left transition-all">
                    <Icon size={14} style={{ color: action.color }} />
                    <span className="text-xs font-medium text-gray-700">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Details Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Job Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Location', value: job.district || 'Theni', icon: MapPin },
                { label: 'Salary', value: salary, icon: Banknote },
                { label: 'Type', value: job.jobType || 'Full Time', icon: Clock },
                { label: 'Openings', value: job.openings || '1', icon: Users2 },
                { label: 'Experience', value: job.experience || '—', icon: Briefcase },
                { label: 'Deadline', value: job.deadline ? new Date(job.deadline).toLocaleDateString('en-IN') : '—', icon: Calendar },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className="text-slate-500" />
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">{item.label}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{item.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Description */}
            {job.description && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-1.5">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            )}

            {/* Skills */}
            {job.skills?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-1.5">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-1.5">Benefits</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.benefits.map((b: string) => (
                    <span key={b} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">✨ {b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Deadline Warning */}
          {job.deadline && (
            <DeadlineCard deadline={job.deadline} onExtend={handleExtend} />
          )}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-3">
          {appsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-blue-500" />
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Users2 size={28} className="mx-auto text-slate-500 mb-2" />
              <p className="text-sm font-medium text-gray-500">No applications yet</p>
              <p className="text-xs text-slate-500 mt-1">Applications will appear here once candidates apply</p>
            </div>
          ) : (
            <>
              {/* Application Status Filter */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].map(f => (
                  <span key={f} className="px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-xs font-medium text-gray-600 whitespace-nowrap cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-all">
                    {f}
                  </span>
                ))}
              </div>

              {/* Application Cards */}
              {applications.map((app: any) => (
                <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {(app.seekerName || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{app.seekerName || 'Applicant'}</p>
                      <p className="text-xs text-gray-500">{app.seekerEmail || ''} · Applied {app.appliedAt ? new Date(app.appliedAt?.toMillis?.() || app.appliedAt).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      app.status === 'selected' ? 'bg-emerald-50 text-emerald-600' :
                      app.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      app.status === 'shortlisted' ? 'bg-blue-50 text-blue-600' :
                      app.status === 'interview' ? 'bg-cyan-50 text-cyan-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {(app.status || 'applied').replace('_', ' ')}
                    </span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <JobPerformanceDashboard
          data={perfData}
          jobTitle={job.title}
          jobStatus={jobStatus}
        />
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <History size={28} className="mx-auto text-slate-500 mb-2" />
          <p className="text-sm font-medium text-gray-500">Change History</p>
          <p className="text-xs text-slate-500 mt-1">All job updates and changes will be logged here</p>
          <p className="text-xs text-slate-500 mt-0.5">Created: {job.createdAt ? new Date(job.createdAt?.toMillis?.() || job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown'}</p>
        </div>
      )}

      {/* Modals */}
      <JobShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        job={{
          id: jobId,
          title: job.title,
          companyName: company?.name || job.companyName || '',
          district: job.district,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          salary: job.salary,
          status: jobStatus,
          jobType: job.jobType,
        }}
      />

      <JobPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        job={{
          ...job,
          companyName: company?.name || job.companyName,
        }}
        companyData={company ? {
          name: company.name,
          logo: company.logo,
          category: company.category,
          district: company.district,
          isVerified: company.verificationStatus === 'verified',
          rating: company.rating,
          reviewCount: company.reviewCount,
        } : undefined}
      />

      <JobQuickUpdateModals
        activeModal={quickModal}
        onClose={() => setQuickModal(null)}
        jobId={jobId}
        currentData={{
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          isNegotiable: job.isNegotiable,
          description: job.description,
          skills: job.skills,
          openings: job.openings,
          deadline: job.deadline,
          contactPerson: job.contactPerson,
          contactPhone: job.contactPhone,
          contactEmail: job.contactEmail,
          interviewDate: job.interviewDate,
          interviewTime: job.interviewTime,
          interviewLocation: job.interviewLocation,
          meetingLink: job.meetingLink,
        }}
      />
    </PageShell>
  );
}

/* ─── Deadline Card Sub-component ──────────────────────────────── */
function DeadlineCard({ deadline, onExtend }: { deadline: string; onExtend: () => void }) {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = diffDays <= 0;
  const isUrgent = diffDays <= 3 && diffDays > 0;
  const isWarning = diffDays <= 7 && diffDays > 3;

  return (
    <div className={`rounded-xl border p-4 flex items-center justify-between ${
      isExpired ? 'bg-red-50 border-red-200' :
      isUrgent ? 'bg-amber-50 border-amber-200' :
      isWarning ? 'bg-yellow-50 border-yellow-200' :
      'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center gap-3">
        <Calendar size={18} className={
          isExpired ? 'text-red-500' : isUrgent ? 'text-amber-500' : 'text-gray-500'
        } />
        <div>
          <p className={`text-sm font-semibold ${isExpired ? 'text-red-800' : isUrgent ? 'text-amber-800' : 'text-gray-800'}`}>
            {isExpired ? '❌ Deadline Expired' :
             isUrgent ? `⚠️ ${diffDays} day${diffDays > 1 ? 's' : ''} remaining` :
             isWarning ? `📅 ${diffDays} days remaining` :
             `📅 Deadline: ${deadlineDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {deadlineDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      {isExpired && (
        <button onClick={onExtend}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all flex items-center gap-1">
          <RotateCcw size={12} /> Extend
        </button>
      )}
    </div>
  );
}
