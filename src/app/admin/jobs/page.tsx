'use client';

import { useState } from 'react';
import {
  Briefcase, Search, CheckCircle, XCircle,
  Star, Trash2, AlertTriangle, Clock, MapPin, Download, Loader2, Zap, Calendar
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';
import { approveJob, rejectJob, deleteDocument, updateDocument } from '@/lib/firebase/firestoreService';

interface JobDoc {
  id: string; title: string; companyName?: string; company?: string;
  jobType: string; category?: string; district?: string;
  applicationsCount?: number; viewCount?: number;
  status?: string; isActive?: boolean; isFeatured?: boolean;
  salaryMin?: number; salaryMax?: number; salary?: string;
  createdAt?: any; reportReason?: string;
}

const JOB_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  full_time:  { bg: '#EFF6FF', text: '#2563EB', label: 'Full Time' },
  part_time:  { bg: '#FFFBEB', text: '#D97706', label: 'Part Time' },
  internship: { bg: '#F5F3FF', text: '#7C3AED', label: 'Internship' },
  remote:     { bg: '#ECFDF5', text: '#059669', label: 'Remote' },
  fresher:    { bg: '#ECFDF5', text: '#059669', label: 'Fresher' } };

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active:   { bg: '#ECFDF5', text: '#059669', dot: '#059669', label: 'Active' },
  pending:  { bg: '#FFFBEB', text: '#D97706', dot: '#D97706', label: 'Pending' },
  expired:  { bg: '#F9FAFB', text: '#6B7280', dot: '#9CA3AF', label: 'Expired' },
  reported: { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626', label: 'Reported' },
  rejected: { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626', label: 'Rejected' } };

const TABS = ['All', 'Active', 'Pending', 'Expired', 'Reported', 'Featured'] as const;
const JOB_TYPES = ['All Types', 'Full Time', 'Part Time', 'Internship', 'Remote', 'Fresher'];
const CATEGORIES = ['All Categories', 'IT & Software', 'Marketing', 'Sales', 'Healthcare', 'Education', 'Engineering', 'Retail', 'Agriculture', 'Construction'];
const DISTRICTS = ['All Districts', 'Theni', 'Madurai', 'Dindigul', 'Chennai', 'Coimbatore', 'Trichy', 'Salem'];

export default function AdminJobsPage() {
  const { user: currentUser } = useAuth();
  const { data: jobs, loading } = useCollection<JobDoc>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isActive = (job: JobDoc) => job.isActive !== false && job.status !== 'pending' && job.status !== 'expired' && job.status !== 'reported' && job.status !== 'rejected';
  const getStatus = (job: JobDoc) => job.status || (isActive(job) ? 'active' : 'pending');

  const filtered = jobs.filter(job => {
    const company = job.companyName || job.company || '';
    const matchSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || company.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStatus(job);
    let matchTab = activeTab === 'All';
    if (activeTab === 'Featured') matchTab = !!job.isFeatured;
    else if (activeTab === 'Active') matchTab = isActive(job);
    else if (activeTab === 'Pending') matchTab = status === 'pending' || job.isActive === false;
    else matchTab = status === activeTab.toLowerCase();

    const typeLabel = JOB_TYPE_STYLES[job.jobType]?.label || job.jobType;
    const matchType = typeFilter === 'All Types' || typeLabel === typeFilter;
    const matchCat = categoryFilter === 'All Categories' || (job.category || '') === categoryFilter;
    const matchDist = districtFilter === 'All Districts' || (job.district || '') === districtFilter;
    return matchSearch && matchTab && matchType && matchCat && matchDist;
  });

  const doApprove = async (id: string) => {
    setActionLoading(id);
    try { await approveJob(id, currentUser?.uid || 'admin'); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };
  const doReject = async (id: string) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(id);
    try { await rejectJob(id, currentUser?.uid || 'admin', reason); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };
  const doToggleFeatured = async (id: string, cur?: boolean) => {
    setActionLoading(id);
    try { await updateDocument('jobs', id, { isFeatured: !cur }); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };
  const doDelete = async (id: string) => {
    if (!window.confirm('Delete this job posting?')) return;
    setActionLoading(id);
    try { await deleteDocument('jobs', id); }
    catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const totalCount = jobs.length;
  const activeCount = jobs.filter(isActive).length;
  const pendingCount = jobs.filter(j => getStatus(j) === 'pending' || j.isActive === false).length;
  const expiredCount = jobs.filter(j => j.status === 'expired').length;
  const featuredCount = jobs.filter(j => j.isFeatured).length;

  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Job Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review, approve and manage all job postings</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
          <Download size={15} /> <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: totalCount, icon: Briefcase, bg: '#EFF6FF', color: '#2563EB' },
          { label: 'Active', value: activeCount, icon: Zap, bg: '#ECFDF5', color: '#059669' },
          { label: 'Pending', value: pendingCount, icon: Clock, bg: '#FFFBEB', color: '#D97706' },
          { label: 'Expired', value: expiredCount, icon: Calendar, bg: '#F9FAFB', color: '#6B7280' },
          { label: 'Featured', value: featuredCount, icon: Star, bg: '#FFFBEB', color: '#D97706' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                  <Icon size={16} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 overflow-x-auto no-scrollbar w-fit">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}>
            {tab}
            {tab === 'Pending' && pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] text-white font-bold" style={{ background: '#D97706' }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by job title or company..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 transition-all" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { value: typeFilter, onChange: setTypeFilter, options: JOB_TYPES },
            { value: categoryFilter, onChange: setCategoryFilter, options: CATEGORIES },
            { value: districtFilter, onChange: setDistrictFilter, options: DISTRICTS },
          ].map((s, i) => (
            <select key={i} value={s.value} onChange={e => s.onChange(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 outline-none cursor-pointer">
              {s.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Jobs table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading jobs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">District</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Apps</th>
                  <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">★</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center">
                    <Briefcase size={24} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">No jobs found</p>
                  </td></tr>
                ) : filtered.map(job => {
                  const typeStyle = JOB_TYPE_STYLES[job.jobType] || { bg: '#F9FAFB', text: '#6B7280', label: job.jobType };
                  const jobStatus = getStatus(job);
                  const statusStyle = STATUS_STYLES[jobStatus] || STATUS_STYLES['pending'];
                  const salary = job.salaryMin && job.salaryMax
                    ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} – ₹${Number(job.salaryMax).toLocaleString('en-IN')}/mo`
                    : job.salary || '—';

                  return (
                    <tr key={job.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{job.title}</p>
                          {jobStatus === 'reported' && <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{salary}</p>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-sm text-gray-600">
                        {job.companyName || job.company || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: typeStyle.bg, color: typeStyle.text }}>
                          {typeStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={11} /> {job.district || 'Theni'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell text-sm font-semibold text-gray-900">
                        {job.applicationsCount || 0}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: statusStyle.bg, color: statusStyle.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-center">
                        <button onClick={() => doToggleFeatured(job.id, job.isFeatured)}
                          className={`transition-all ${job.isFeatured ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
                          <Star size={16} fill={job.isFeatured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === job.id ? (
                            <Loader2 size={15} className="animate-spin text-blue-500" />
                          ) : (
                            <>
                              {(job.isActive === false || jobStatus === 'pending') && (
                                <>
                                  <button onClick={() => doApprove(job.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all" title="Approve">
                                    <CheckCircle size={15} />
                                  </button>
                                  <button onClick={() => doReject(job.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Reject">
                                    <XCircle size={15} />
                                  </button>
                                </>
                              )}
                              <button onClick={() => doDelete(job.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
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
      </div>
    </div>
  );
}
