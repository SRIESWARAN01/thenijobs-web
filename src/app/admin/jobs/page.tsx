'use client';

import { useState, useMemo } from 'react';
import {
  Briefcase, Search, Eye, CheckCircle, XCircle,
  Star, Trash2, AlertTriangle, Clock, Pencil,
  MapPin, Download, Loader2, Zap, Calendar, X, Save,
  ChevronDown, CheckSquare, Square, RotateCcw
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import {
  approveJob,
  rejectJob,
  deleteDocument,
  updateDocument,
} from '@/lib/firebase/firestoreService';
import { getEffectiveJobExpiry, getEffectiveJobStatus, getJobPostedDate } from '@/lib/jobPolicy';
import { toDate } from '@/lib/subscriptions';
import { LAUNCH_DISTRICT } from '@/lib/types';
import { useLocations } from '@/hooks/useLocations';
import { matchesSearch } from '@/lib/search';
import { Select } from '@/components/ui/Select';

// ===== TYPES =====
interface JobDoc {
  id: string;
  title: string;
  companyName?: string;
  company?: string;
  jobType: JobType;
  category?: string;
  district?: string;
  location?: string;
  description?: string;
  skills?: string[];
  applicationsCount?: number;
  walkInApplicationsCount?: number;
  viewCount?: number;
  status?: 'active' | 'pending' | 'pending_renewal' | 'expired' | 'reported' | 'featured' | 'rejected' | 'closed' | 'paused';
  isActive?: boolean;
  isFeatured?: boolean;
  planAtCreation?: string;
  planType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string;
  createdAt?: any;
  postedAt?: any;
  activatedAt?: any;
  expiresAt?: any;
  reportReason?: string;
}

type JobType = 'full_time' | 'part_time' | 'internship' | 'remote' | 'fresher';

// ===== CONSTANTS =====
const JOB_TYPE_CONFIG: Record<JobType, { label: string; bg: string; text: string }> = {
  full_time: { label: 'Full Time', bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  part_time: { label: 'Part Time', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  internship: { label: 'Internship', bg: 'bg-violet-500/15', text: 'text-violet-400' },
  remote: { label: 'Remote', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  fresher: { label: 'Fresher', bg: 'bg-green-500/15', text: 'text-green-400' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  pending_renewal: { label: 'Renewal', bg: 'bg-amber-500/15', text: 'text-amber-300', dot: 'bg-amber-300' },
  expired: { label: 'Expired', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  reported: { label: 'Reported', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400' },
  rejected: { label: 'Rejected', bg: 'bg-rose-500/15', text: 'text-rose-300', dot: 'bg-rose-300' },
  closed: { label: 'Closed', bg: 'bg-gray-500/15', text: 'text-gray-400', dot: 'bg-gray-400' },
  paused: { label: 'Paused', bg: 'bg-amber-500/15', text: 'text-amber-300', dot: 'bg-amber-300' },
};

const TABS = ['All', 'Active', 'Pending', 'Expired', 'Reported', 'Featured'] as const;
const JOB_TYPES = ['All Types', 'Full Time', 'Part Time', 'Internship', 'Remote', 'Fresher'];
const CATEGORIES = ['All Categories', 'IT & Software', 'Marketing', 'Sales', 'Healthcare', 'Education', 'Engineering', 'Retail', 'Agriculture', 'Construction'];
const JOB_TYPE_OPTIONS_EDIT = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
  { value: 'fresher', label: 'Fresher' },
];
const STATUS_OPTIONS_EDIT = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'rejected', label: 'Rejected' },
];

const JOB_TYPES_OPTIONS = JOB_TYPES.map((t) => ({ value: t, label: t }));
const CATEGORIES_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

// ===== EDIT JOB MODAL =====
function EditJobModal({ job, onClose, onSave }: { job: JobDoc; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [form, setForm] = useState<{
    title: string;
    description: string;
    jobType: JobType;
    location: string;
    category: string;
    salaryMin: string;
    salaryMax: string;
    status: 'active' | 'pending' | 'pending_renewal' | 'expired' | 'reported' | 'featured' | 'rejected' | 'closed' | 'paused';
  }>({
    title: job.title || '',
    description: job.description || '',
    jobType: (job.jobType as JobType) || 'full_time',
    location: job.location || '',
    category: job.category || '',
    salaryMin: job.salaryMin?.toString() || '',
    salaryMax: job.salaryMax?.toString() || '',
    status: job.status || 'pending',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        jobType: form.jobType as JobType,
        location: form.location.trim(),
        category: form.category.trim(),
        salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : null,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : null,
        status: form.status as JobDoc['status'],
        isActive: form.status === 'active',
        updatedAt: new Date(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg glass-card rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white font-outfit">Edit Job</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Job Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="search-input w-full px-4 py-2.5 text-sm"
              placeholder="e.g. Software Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Job Type</label>
              <Select value={form.jobType} onChange={v => setForm({ ...form, jobType: v as JobType })} options={JOB_TYPE_OPTIONS_EDIT} className="w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Status</label>
              <Select value={form.status} onChange={v => setForm({ ...form, status: v as 'active' | 'pending' | 'pending_renewal' | 'expired' | 'reported' | 'featured' | 'rejected' | 'closed' | 'paused' })} options={STATUS_OPTIONS_EDIT} className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Category</label>
              <input
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="search-input w-full px-4 py-2.5 text-sm"
                placeholder="Category"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Location</label>
              <input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="search-input w-full px-4 py-2.5 text-sm"
                placeholder="Location"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Min Salary (₹/mo)</label>
              <input
                type="number"
                value={form.salaryMin}
                onChange={e => setForm({ ...form, salaryMin: e.target.value })}
                className="search-input w-full px-4 py-2.5 text-sm"
                placeholder="e.g. 15000"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">Max Salary (₹/mo)</label>
              <input
                type="number"
                value={form.salaryMax}
                onChange={e => setForm({ ...form, salaryMax: e.target.value })}
                className="search-input w-full px-4 py-2.5 text-sm"
                placeholder="e.g. 30000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="search-input w-full px-4 py-2.5 text-sm resize-none"
              placeholder="Job description..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== REJECT WITH REASON MODAL =====
function RejectModal({ jobTitle, onClose, onConfirm }: { jobTitle: string; onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const PRESET_REASONS = [
    'Incomplete job details',
    'Misleading job description',
    'Duplicate posting',
    'Spam or inappropriate content',
    'Invalid salary information',
    'Company not verified',
  ];

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(reason || 'Rejected by admin'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md glass-card rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
            <XCircle size={18} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-outfit">Reject Job</h2>
            <p className="text-xs text-gray-500 truncate max-w-xs">{jobTitle}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3">Select a reason or write a custom reason:</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_REASONS.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-medium border transition-all ${reason === r ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-white/[0.03] border-white/10 text-gray-400 hover:text-white'}`}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="Custom reason (optional)..."
          className="search-input w-full px-4 py-2.5 text-sm resize-none mb-5"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] transition-all">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Reject Job
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN PAGE =====
export default function JobsPage() {
  const { user: currentUser } = useAuth();
  const { allAreas } = useLocations();

  const districtOptions = useMemo(() => {
    return [{ value: 'All Areas', label: 'All Areas' }, ...allAreas.map(d => ({ value: d, label: d }))];
  }, [allAreas]);

  const { data: jobs, loading } = useCollection<JobDoc>('jobs');
  const { data: applications } = useCollection<any>('jobApplications');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Areas');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Edit modal
  const [editJob, setEditJob] = useState<JobDoc | null>(null);

  // Reject modal
  const [rejectJob_, setRejectJob] = useState<JobDoc | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const company = job.companyName || job.company || 'Unknown';
    const matchSearch = matchesSearch(searchQuery, [
      { value: job.title || '', weight: 3 },
      { value: company, weight: 2 },
      job.category,
      job.description,
      job.skills || [],
    ]);

    const jobStatus = getEffectiveJobStatus(job);

    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') {
      matchTab = !!job.isFeatured;
    } else if (activeTab === 'Active') {
      matchTab = jobStatus === 'active';
    } else if (activeTab === 'Pending') {
      matchTab = jobStatus === 'pending' || jobStatus === 'pending_renewal';
    } else {
      matchTab = jobStatus === activeTab.toLowerCase();
    }

    const typeConfig = JOB_TYPE_CONFIG[job.jobType] || { label: job.jobType };
    const matchType = typeFilter === 'All Types' || typeConfig.label === typeFilter;
    const matchCategory = categoryFilter === 'All Categories' || (job.category || 'Other') === categoryFilter;
    const district = job.district || LAUNCH_DISTRICT;
    const matchDistrict = districtFilter === 'All Areas' || (job.location || district) === districtFilter || district === districtFilter;

    return matchSearch && matchTab && matchType && matchCategory && matchDistrict;
  }), [jobs, searchQuery, activeTab, typeFilter, categoryFilter, districtFilter]);

  // ===== ACTION HANDLERS =====
  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveJob(id, currentUser?.uid || 'admin');
    } catch (err: any) {
      alert('Failed to approve: ' + (err.message || err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (id: string, reason: string) => {
    await rejectJob(id, currentUser?.uid || 'admin');
    if (reason) {
      await updateDocument('jobs', id, { reportReason: reason });
    }
    setRejectJob(null);
  };

  const handleEdit = async (data: any) => {
    if (!editJob) return;
    await updateDocument('jobs', editJob.id, data);
  };

  const handleToggleFeatured = async (id: string, currentFeatured?: boolean) => {
    setActionLoading(id);
    try {
      await updateDocument('jobs', id, { isFeatured: !currentFeatured });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this job posting?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('jobs', id);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err: any) {
      alert('Failed to delete: ' + (err.message || err));
    } finally {
      setActionLoading(null);
    }
  };

  // ===== BULK ACTIONS =====
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredJobs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredJobs.map(j => j.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const bulkApprove = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Approve ${selectedIds.size} selected jobs?`)) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => approveJob(id, currentUser?.uid || 'admin').catch(() => {})));
      setSelectedIds(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkReject = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Reject ${selectedIds.size} selected jobs?`)) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => rejectJob(id, currentUser?.uid || 'admin').catch(() => {})));
      setSelectedIds(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (!selectedIds.size) return;
    if (!window.confirm(`Permanently delete ${selectedIds.size} selected jobs? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selectedIds].map(id => deleteDocument('jobs', id).catch(() => {})));
      setSelectedIds(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  // ===== CSV EXPORT =====
  const handleExport = () => {
    const rows = [
      ['Job Title', 'Company', 'Type', 'Category', 'Location', 'Salary Min', 'Salary Max', 'Status', 'Posted Date', 'Expiry Date', 'Views', 'Applications', 'Plan'],
      ...filteredJobs.map(j => [
        j.title || '',
        j.companyName || j.company || '',
        j.jobType || '',
        j.category || '',
        j.location || j.district || '',
        j.salaryMin?.toString() || '',
        j.salaryMax?.toString() || '',
        getEffectiveJobStatus(j),
        toDate(j.postedAt || j.createdAt)?.toLocaleDateString('en-IN') || '',
        toDate(getEffectiveJobExpiry(j))?.toLocaleDateString('en-IN') || '',
        (j.viewCount || 0).toString(),
        (j.applicationsCount || 0).toString(),
        j.planType || j.planAtCreation || 'free',
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thenijobs_jobs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalCount = jobs.length;
  const activeCount = jobs.filter(j => getEffectiveJobStatus(j) === 'active').length;
  const pendingCount = jobs.filter(j => ['pending', 'pending_renewal'].includes(getEffectiveJobStatus(j))).length;
  const expiredCount = jobs.filter(j => getEffectiveJobStatus(j) === 'expired').length;
  const featuredCount = jobs.filter(j => j.isFeatured).length;

  const stats = [
    { label: 'Total Jobs', value: totalCount, icon: Briefcase, bg: 'bg-violet-500/15', text: 'text-violet-400' },
    { label: 'Active', value: activeCount, icon: Zap, bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    { label: 'Pending Review', value: pendingCount, icon: Clock, bg: 'bg-amber-500/15', text: 'text-amber-400' },
    { label: 'Expired', value: expiredCount, icon: Calendar, bg: 'bg-gray-500/15', text: 'text-gray-400' },
    { label: 'Featured', value: featuredCount, icon: Star, bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  ];

  const formatDateValue = (value?: unknown) => {
    const date = toDate(value);
    return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';
  };

  const getApplicationMetrics = (jobId: string, fallbackTotal = 0, fallbackWalkIns = 0) => {
    const rows = applications.filter(app => app.jobId === jobId);
    return {
      total: rows.length || fallbackTotal,
      walkIns: rows.filter(app => app.applicationType === 'walk_in').length || fallbackWalkIns,
      shortlisted: rows.filter(app => app.status === 'shortlisted').length,
      selected: rows.filter(app => app.status === 'selected').length,
    };
  };

  const allVisible = filteredJobs.length > 0 && selectedIds.size === filteredJobs.length;

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Modals */}
      {editJob && (
        <EditJobModal job={editJob} onClose={() => setEditJob(null)} onSave={handleEdit} />
      )}
      {rejectJob_ && (
        <RejectModal
          jobTitle={rejectJob_.title}
          onClose={() => setRejectJob(null)}
          onConfirm={(reason) => handleRejectConfirm(rejectJob_.id, reason)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Job Management</h1>
          <p className="text-sm text-gray-400 mt-1">Review, approve, edit, and manage all job postings</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/[0.15] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon size={18} className={stat.text} />
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-outfit">{stat.value}</p>
                  <p className="text-[10px] text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === tab
              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            {tab}
            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search jobs by title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={typeFilter} onChange={setTypeFilter} options={JOB_TYPES_OPTIONS} placeholder="All Types" className="w-40" />
          <Select value={categoryFilter} onChange={setCategoryFilter} options={CATEGORIES_OPTIONS} placeholder="All Categories" className="w-48" />
          <Select value={districtFilter} onChange={setDistrictFilter} options={districtOptions} placeholder="All Areas" className="w-48" />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <span className="text-sm font-semibold text-violet-300">{selectedIds.size} selected</span>
          <div className="flex-1" />
          {bulkLoading ? (
            <Loader2 size={16} className="animate-spin text-violet-400" />
          ) : (
            <>
              <button onClick={bulkApprove} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-all">
                <CheckCircle size={13} /> Approve All
              </button>
              <button onClick={bulkReject} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/25 transition-all">
                <XCircle size={13} /> Reject All
              </button>
              <button onClick={bulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/25 transition-all">
                <Trash2 size={13} /> Delete All
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                <X size={14} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Jobs Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading jobs from Firestore...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-4 py-3.5 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white transition-colors">
                      {allVisible ? <CheckSquare size={16} className="text-violet-400" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Job</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Company</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Dates</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Views</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden xl:table-cell">Apps</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Featured</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredJobs.map((job) => {
                  const jobStatus = getEffectiveJobStatus(job);
                  const statusConfig = STATUS_CONFIG[jobStatus] || STATUS_CONFIG.pending;
                  const plan = (job.planType || job.planAtCreation || 'free').toString();
                  const typeConfig = JOB_TYPE_CONFIG[job.jobType] || JOB_TYPE_CONFIG.full_time;
                  const postedDate = formatDateValue(getJobPostedDate(job) || job.createdAt);
                  const expiryDate = formatDateValue(getEffectiveJobExpiry(job));
                  const appMetrics = getApplicationMetrics(job.id, job.applicationsCount || 0, job.walkInApplicationsCount || 0);
                  const salaryText = job.salaryMin && job.salaryMax ? `₹${job.salaryMin.toLocaleString('en-IN')} - ₹${job.salaryMax.toLocaleString('en-IN')}/mo` : job.salary || 'N/A';
                  const isSelected = selectedIds.has(job.id);

                  return (
                    <tr key={job.id} className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-violet-500/[0.04]' : ''} ${jobStatus === 'reported' ? 'bg-rose-500/[0.03]' : ''}`}>
                      <td className="px-4 py-3.5">
                        <button onClick={() => toggleSelect(job.id)} className="text-gray-400 hover:text-violet-400 transition-colors">
                          {isSelected ? <CheckSquare size={15} className="text-violet-400" /> : <Square size={15} />}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate max-w-[180px]">{job.title}</p>
                            {jobStatus === 'reported' && <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{salaryText}</p>
                          {job.reportReason && (
                            <p className="text-[10px] text-rose-400/70 mt-0.5 italic truncate max-w-[180px]">{job.reportReason}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-gray-300">{job.companyName || job.company || 'Unknown'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${typeConfig.bg} ${typeConfig.text}`}>
                            {typeConfig.label}
                          </span>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{plan}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <p className="text-xs text-gray-300">Posted: {postedDate}</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">Expiry: {expiryDate}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Eye size={12} className="text-gray-500" />
                          <span className="text-sm text-white font-medium">{job.viewCount || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden xl:table-cell">
                        <p className="text-xs text-white font-semibold">Total {appMetrics.total}</p>
                        <p className="mt-0.5 text-[10px] text-gray-500">
                          Walk-in {appMetrics.walkIns} · Shortlisted {appMetrics.shortlisted}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-center">
                        <button
                          onClick={() => handleToggleFeatured(job.id, job.isFeatured)}
                          className={`transition-all ${job.isFeatured ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
                        >
                          <Star size={16} fill={job.isFeatured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === job.id ? (
                            <Loader2 size={16} className="text-violet-400 animate-spin" />
                          ) : (
                            <>
                              {/* Edit */}
                              <button
                                onClick={() => setEditJob(job)}
                                className="p-2 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                                title="Edit Job"
                              >
                                <Pencil size={14} />
                              </button>
                              {/* Approve */}
                              {jobStatus !== 'active' && (
                                <button
                                  onClick={() => handleApprove(job.id)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                  title="Approve Job"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              {/* Reject */}
                              {jobStatus !== 'rejected' && (
                                <button
                                  onClick={() => setRejectJob(job)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                  title="Reject Job"
                                >
                                  <XCircle size={15} />
                                </button>
                              )}
                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(job.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                title="Delete Job"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
              <Briefcase size={28} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-400">No jobs found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
