'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase, Calendar, Eye, Clock, CheckCircle, XCircle, ChevronRight, Star,
  Plus, Send, Loader2, UserCheck, Building2,
  Users, BarChart2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useEmployerStats } from '@/hooks/useRealtimeStats';
import { updateApplicationStatus } from '@/lib/firebase/firestoreService';
import { where, limit, orderBy } from 'firebase/firestore';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  applied:             { bg: '#EFF6FF', text: '#2563EB', label: 'Applied' },
  shortlisted:         { bg: '#F5F3FF', text: '#7C3AED', label: 'Shortlisted' },
  interview_scheduled: { bg: '#FFFBEB', text: '#D97706', label: 'Interview' },
  selected:            { bg: '#ECFDF5', text: '#059669', label: 'Selected' },
  rejected:            { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected' } };

export default function EmployerDashboard() {
  const { user } = useAuth();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];
  const companyId = company?.id;

  const { stats, loading: statsLoading } = useEmployerStats(companyId);

  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc'),
    limit(5)
  ], { skip: !companyId });

  const { data: activeJobs, loading: jobsLoading } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true),
    limit(6)
  ], { skip: !companyId });

  const { data: interviews, loading: interviewsLoading } = useCollection<any>('interviews', [
    where('companyId', '==', companyId || ''),
    limit(5)
  ], { skip: !companyId });

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAppStatus = async (appId: string, status: string) => {
    setActionLoading(appId);
    try { await updateApplicationStatus(appId, status); }
    catch (err) { console.error(err); }
    finally { setActionLoading(null); }
  };

  const initials = (name?: string) => name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C';

  const loading = companyLoading || statsLoading || appsLoading || jobsLoading;

  const statItems = [
    { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: Briefcase, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Applications', value: stats?.totalApplications || 0, icon: Users, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Shortlisted', value: stats?.shortlisted || 0, icon: UserCheck, bg: '#ECFDF5', color: '#059669' },
    { label: 'Interviews', value: stats?.interviews || 0, icon: Calendar, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Hired', value: stats?.hired || 0, icon: Star, bg: '#FFF1F2', color: '#E11D48' },
    { label: 'Profile Views', value: company?.viewCount || 0, icon: Eye, bg: '#F0F9FF', color: '#0284C7' },
  ];

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
          <Building2 size={28} className="text-blue-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
          No Company Registered
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mb-5 leading-relaxed">
          Register your company profile first to access the dashboard and start posting jobs.
        </p>
        <Link href="/employer/company-profile"
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm">
          Create Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Employer Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {company?.name || 'Your Company'} — manage your hiring pipeline
          </p>
        </div>
        <Link href="/employer/post-job"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm">
          <Plus size={16} /> Post New Job
        </Link>
      </div>

      {/* Company Status Banner */}
      {company && company.verificationStatus !== 'verified' && (
        <div className={`flex items-center gap-3 p-3.5 rounded-2xl border text-sm font-medium ${
          company.verificationStatus === 'pending'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {company.verificationStatus === 'pending' ? '⏳' : '❌'}
          {company.verificationStatus === 'pending'
            ? 'Your company profile is under review. You can still post jobs, but they will be visible after approval.'
            : `Company rejected: ${company.rejectionReason || 'See company profile for details.'}`}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            {statItems.map(stat => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 flex-shrink-0"
                    style={{ background: stat.bg }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{stat.value.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Recent Applications */}
            <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F5F3FF' }}>
                    <Send size={15} style={{ color: '#7C3AED' }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Recent Applications</h2>
                    <p className="text-[10px] text-slate-500">Latest candidate submissions</p>
                  </div>
                </div>
                <Link href="/employer/candidates" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                  View all →
                </Link>
              </div>

              <div className="divide-y divide-gray-50">
                {applications.length === 0 ? (
                  <div className="p-10 text-center">
                    <Users size={28} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-xs text-slate-600 font-medium">No applications received yet</p>
                  </div>
                ) : applications.map(app => {
                  const st = STATUS_STYLES[app.status] || STATUS_STYLES['applied'];
                  return (
                    <div key={app.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-blue-600 flex-shrink-0"
                        style={{ background: '#EFF6FF' }}>
                        {initials(app.seekerName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{app.seekerName || 'Candidate'}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                            style={{ background: st.bg, color: st.text }}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {app.createdAt ? new Date(app.createdAt?.toMillis?.() || app.createdAt).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {actionLoading === app.id ? (
                          <Loader2 size={14} className="animate-spin text-blue-600" />
                        ) : app.status === 'applied' ? (
                          <>
                            <button onClick={() => handleAppStatus(app.id, 'shortlisted')}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                              <CheckCircle size={13} />
                            </button>
                            <button onClick={() => handleAppStatus(app.id, 'rejected')}
                              className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all">
                              <XCircle size={13} />
                            </button>
                          </>
                        ) : null}
                        <Link href={`/employer/candidates`}
                          className="p-1.5 rounded-lg bg-gray-50 text-slate-500 hover:bg-gray-100 transition-all">
                          <Eye size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interviews */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                    <Calendar size={15} style={{ color: '#D97706' }} />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">Upcoming Interviews</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {interviews.length === 0 ? (
                  <div className="p-10 text-center">
                    <Calendar size={28} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-xs text-slate-600 font-medium">No scheduled interviews</p>
                  </div>
                ) : interviews.map(iv => (
                  <div key={iv.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{iv.seekerName || 'Candidate'}</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#FFFBEB', color: '#D97706' }}>
                        {iv.mode || 'Phone'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={11} />
                      <span>{iv.date} at {iv.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-gray-50">
                <Link href="/employer/interviews" className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700">
                  View all interviews <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* Active Jobs table */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <Briefcase size={15} style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Active Jobs</h2>
                  <p className="text-[10px] text-slate-500">Your current job postings</p>
                </div>
              </div>
              <Link href="/employer/jobs" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                Manage Jobs →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Job Title</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Type</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Applications</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Views</th>
                    <th className="text-center px-3 py-3 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeJobs.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500">
                      No active job listings. <Link href="/employer/post-job" className="text-blue-600 font-semibold">Post a job →</Link>
                    </td></tr>
                  ) : activeJobs.map(job => (
                    <tr key={job.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{job.title}</p>
                          {job.isUrgent && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded" style={{ background: '#FEF2F2', color: '#DC2626' }}>URGENT</span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Posted {job.createdAt ? new Date(job.createdAt?.toMillis?.() || job.createdAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </td>
                      <td className="px-3 py-3.5 hidden sm:table-cell">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                          {job.jobType || 'Full Time'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-gray-900">{job.applicationsCount || 0}</td>
                      <td className="px-3 py-3.5 text-center text-gray-500 hidden md:table-cell">{job.viewCount || 0}</td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: '#ECFDF5', color: '#059669' }}>Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recruitment Funnel */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#F5F3FF' }}>
                <BarChart2 size={15} style={{ color: '#7C3AED' }} />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">Recruitment Funnel</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Applied', count: stats?.totalApplications || 0, bg: '#EFF6FF', color: '#2563EB' },
                { label: 'Shortlisted', count: stats?.shortlisted || 0, bg: '#F5F3FF', color: '#7C3AED' },
                { label: 'Interviewed', count: stats?.interviews || 0, bg: '#FFFBEB', color: '#D97706' },
                { label: 'Hired', count: stats?.hired || 0, bg: '#ECFDF5', color: '#059669' },
              ].map(stage => (
                <div key={stage.label} className="text-center p-4 rounded-2xl border"
                  style={{ background: stage.bg, borderColor: stage.bg }}>
                  <p className="text-2xl font-bold mb-1" style={{ color: stage.color, fontFamily: "'Poppins', sans-serif" }}>
                    {stage.count}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">{stage.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
