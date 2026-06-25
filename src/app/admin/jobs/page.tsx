'use client';

import { useState } from 'react';
import {
  Briefcase, Search, ChevronDown, Eye, CheckCircle, XCircle,
  Star, Trash2, AlertTriangle, Clock, Users,
  MapPin, Download, Loader2, Zap, Calendar
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
import { LAUNCH_DISTRICT, THENI_LAUNCH_LOCATIONS } from '@/lib/types';
import { matchesSearch } from '@/lib/search';
import { Select } from '@/components/ui/Select';

// ===== TYPES =====
interface JobDoc {
  id: string;
  title: string;
  companyName?: string;
  company?: string; // fallback
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
  salary?: string; // fallback
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
const DISTRICTS = ['All Areas', ...THENI_LAUNCH_LOCATIONS];

const JOB_TYPES_OPTIONS = JOB_TYPES.map((t) => ({ value: t, label: t }));
const CATEGORIES_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));
const DISTRICTS_OPTIONS = DISTRICTS.map((d) => ({ value: d, label: d }));

export default function JobsPage() {
  const { user: currentUser } = useAuth();
  const { data: jobs, loading } = useCollection<JobDoc>('jobs');
  const { data: applications } = useCollection<any>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Areas');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredJobs = jobs.filter((job) => {
    const company = job.companyName || job.company || 'Unknown';
    const matchSearch = matchesSearch(searchQuery, [
      { value: job.title || '', weight: 3 },
      { value: company, weight: 2 },
      job.category,
      job.description,
      job.skills || [],
    ]);

    const jobStatus = getEffectiveJobStatus(job);
    const isJobActive = jobStatus === 'active';

    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') {
      matchTab = !!job.isFeatured;
    } else if (activeTab === 'Active') {
      matchTab = isJobActive;
    } else if (activeTab === 'Pending') {
      matchTab = jobStatus === 'pending' || jobStatus === 'pending_renewal';
    } else {
      matchTab = jobStatus === activeTab.toLowerCase();
    }

    const typeConfig = JOB_TYPE_CONFIG[job.jobType] || { label: job.jobType };
    const matchType = typeFilter === 'All Types' || typeConfig.label === typeFilter;
    
    const category = job.category || 'Other';
    const matchCategory = categoryFilter === 'All Categories' || category === categoryFilter;
    
    const district = job.district || LAUNCH_DISTRICT;
    const location = job.location || district;
    const matchDistrict = districtFilter === 'All Areas' || location === districtFilter || district === districtFilter;
    
    return matchSearch && matchTab && matchType && matchCategory && matchDistrict;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveJob(id, currentUser?.uid || 'admin');
      alert('Job approved successfully!');
    } catch (err: any) {
      console.error('Approve job error:', err);
      alert('Failed to approve job: ' + (err.message || err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectJob(id, currentUser?.uid || 'admin');
      alert('Job rejected successfully!');
    } catch (err: any) {
      console.error('Reject job error:', err);
      alert('Failed to reject job: ' + (err.message || err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured?: boolean) => {
    setActionLoading(id);
    try {
      await updateDocument('jobs', id, { isFeatured: !currentFeatured });
      alert(currentFeatured ? 'Job removed from featured list!' : 'Job marked as featured successfully!');
    } catch (err: any) {
      console.error('Feature job error:', err);
      alert('Failed to update featured status: ' + (err.message || err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('jobs', id);
      alert('Job posting deleted successfully!');
    } catch (err: any) {
      console.error('Delete job error:', err);
      alert('Failed to delete job: ' + (err.message || err));
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic counts for stats
  const totalCount = jobs.length;
  const activeCount = jobs.filter((j) => getEffectiveJobStatus(j) === 'active').length;
  const pendingCount = jobs.filter((j) => ['pending', 'pending_renewal'].includes(getEffectiveJobStatus(j))).length;
  const expiredCount = jobs.filter((j) => getEffectiveJobStatus(j) === 'expired').length;
  const featuredCount = jobs.filter((j) => j.isFeatured).length;

  const stats = [
    { label: 'Total Jobs', value: totalCount, icon: Briefcase, color: 'violet' },
    { label: 'Active', value: activeCount, icon: Zap, color: 'emerald' },
    { label: 'Pending Review', value: pendingCount, icon: Clock, color: 'amber' },
    { label: 'Expired', value: expiredCount, icon: Calendar, color: 'gray' },
    { label: 'Featured', value: featuredCount, icon: Star, color: 'cyan' },
  ];

  const statColorMap: Record<string, { bg: string; text: string }> = {
    violet: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
    gray: { bg: 'bg-gray-500/15', text: 'text-gray-400' },
    cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  };

  const formatDateValue = (value?: unknown) => {
    const date = toDate(value);
    return date ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';
  };

  const getApplicationMetrics = (jobId: string, fallbackTotal = 0, fallbackWalkIns = 0) => {
    const rows = applications.filter((app) => app.jobId === jobId);
    return {
      total: rows.length || fallbackTotal,
      walkIns: rows.filter((app) => app.applicationType === 'walk_in').length || fallbackWalkIns,
      shortlisted: rows.filter((app) => app.status === 'shortlisted').length,
      selected: rows.filter((app) => app.status === 'selected').length,
    };
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Job Management</h1>
          <p className="text-sm text-gray-400 mt-1">Review, approve, and manage all job postings</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const colors = statColorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass-card rounded-2xl p-4 hover:border-white/[0.15] transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon size={18} className={colors.text} />
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
            onClick={() => setActiveTab(tab)}
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
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            options={JOB_TYPES_OPTIONS}
            placeholder="All Types"
            className="w-40"
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={CATEGORIES_OPTIONS}
            placeholder="All Categories"
            className="w-48"
          />
          <Select
            value={districtFilter}
            onChange={setDistrictFilter}
            options={DISTRICTS_OPTIONS}
            placeholder="All Areas"
            className="w-48"
          />
        </div>
      </div>

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
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Job</th>
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
                  const salaryText = job.salaryMin && job.salaryMax ? `₹${job.salaryMin.toLocaleString('en-IN')} - ₹${job.salaryMax.toLocaleString('en-IN')}/mo` : job.salary || 'Salary N/A';

                  return (
                    <tr key={job.id} className={`hover:bg-white/[0.02] transition-colors ${jobStatus === 'reported' ? 'bg-rose-500/[0.03]' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{job.title}</p>
                            {jobStatus === 'reported' && <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{salaryText}</p>
                          {job.reportReason && (
                            <p className="text-[10px] text-rose-400/70 mt-0.5 italic">{job.reportReason}</p>
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
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">{plan}</p>
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
                          Walk-in {appMetrics.walkIns} · Shortlisted {appMetrics.shortlisted} · Selected {appMetrics.selected}
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
                          className={`transition-all ${job.isFeatured ? 'text-amber-400' : 'text-gray-600 hover:text-amber-400'}`}
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
                              {jobStatus !== 'active' && (
                                <button
                                  onClick={() => handleApprove(job.id)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                                  title="Approve Job"
                                >
                                  <CheckCircle size={15} />
                                </button>
                              )}
                              {jobStatus !== 'rejected' && (
                                <button
                                  onClick={() => handleReject(job.id)}
                                  className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                  title="Reject Job"
                                >
                                  <XCircle size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(job.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                                title="Remove Job"
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
              <Briefcase size={28} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400">No jobs found</p>
            <p className="text-xs text-gray-600 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
