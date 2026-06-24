'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useEmployerStats } from '@/hooks/useRealtimeStats';
import { where } from 'firebase/firestore';
import {
  BarChart3, Download, FileText, Loader2, Briefcase,
  Users2, Calendar, Star, Eye, TrendingUp, IndianRupee, Lock
} from 'lucide-react';
import Link from 'next/link';
import { selectBestSubscription, planHasFeature } from '@/lib/subscriptions';
import { formatJobType } from '@/lib/jobFormatters';

export default function EmployerReportsPage() {
  const { user } = useAuth();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch live stats
  const { stats, loading: statsLoading } = useEmployerStats(companyId);

  // 3. Fetch jobs
  const { data: jobs, loading: jobsLoading } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  // 4. Fetch applications
  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  // 5. Fetch subscriptions
  const { data: subscriptions, loading: subLoading } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || ''),
  ], { skip: !companyId });

  const activeSub = selectBestSubscription(subscriptions);
  const activePlan = activeSub?.plan || company?.subscriptionPlan || (company?.isPremium ? 'premium' : 'free');
  const hasAnalytics = planHasFeature(activePlan, 'basic_analytics');

  const loading = companyLoading || statsLoading || jobsLoading || appsLoading || subLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit">
        <BarChart3 size={48} className="text-gray-600 mb-4" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">Please register your company profile first to view reports and metrics.</p>
        <Link href="/employer/company-profile" className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  if (!hasAnalytics && !companyLoading && !subLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Lock size={48} className="mb-4 text-cyan-400 animate-pulse" />
        <h2 className="text-xl font-bold text-white">Unlock Recruitment Reports</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          Analytics and performance reports are restricted to Basic and Premium plans. Upgrade today to track job views, application conversion rates, and pipeline health.
        </p>
        <Link href="/employer/billing" className="mt-6 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2.5 font-semibold text-white hover:opacity-90">
          Upgrade Plan
        </Link>
      </div>
    );
  }

  const jobMetrics = jobs.map((job) => {
    const appCount = applications.filter((app) => app.jobId === job.id).length;
    return {
      title: job.title,
      type: job.jobType,
      apps: appCount,
      views: job.viewCount || 0,
      status: job.status || (job.isActive !== false ? 'active' : 'draft')
    };
  }).sort((a, b) => b.apps - a.apps).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-outfit">Recruitment Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Analytics and metrics overview for {company?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading metrics and statistics...</p>
        </div>
      ) : (
        <>
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Briefcase size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Job Listings</h3>
                  <p className="text-[10px] text-gray-500">Recruitment campaigns</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white font-outfit">{jobs.length}</p>
              <p className="text-xs text-emerald-400 mt-1">{stats.activeJobs} currently active</p>
            </div>

            <div className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Users2 size={18} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Applications Received</h3>
                  <p className="text-[10px] text-gray-500">Candidate flow</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white font-outfit">{applications.length}</p>
              <p className="text-xs text-violet-400 mt-1">{stats.shortlisted} candidates shortlisted</p>
            </div>

            <div className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Eye size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Company Profile Views</h3>
                  <p className="text-[10px] text-gray-500">Brand engagement</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-white font-outfit">{company?.viewCount || 0}</p>
              <p className="text-xs text-amber-400 mt-1">Verified employer profile</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Job Listings */}
            <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white">Top Performing Jobs</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Job Title</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Views</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Applications</th>
                      <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {jobMetrics.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-xs text-gray-500">No job stats available.</td>
                      </tr>
                    ) : (
                      jobMetrics.map((job, idx) => {
                        const conversion = job.views > 0 ? Math.round((job.apps / job.views) * 100) : 0;
                        return (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-5 py-3.5">
                              <p className="text-sm font-medium text-white">{job.title}</p>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-gray-400 border border-white/[0.08]">{formatJobType(job.type)}</span>
                            </td>
                            <td className="px-3 py-3.5 text-center text-sm text-gray-300">{job.views}</td>
                            <td className="px-3 py-3.5 text-center text-sm text-white font-bold">{job.apps}</td>
                            <td className="px-3 py-3.5 text-center text-sm text-cyan-400 font-semibold">{conversion}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Funnel chart card */}
            <div className="lg:col-span-1 glass-card rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Pipeline Summary</h2>
              <div className="space-y-4">
                {[
                  { label: 'Applications', count: stats.totalApplications, color: 'cyan' },
                  { label: 'Shortlisted', count: stats.shortlisted, color: 'violet' },
                  { label: 'Interviews', count: stats.interviews, color: 'amber' },
                  { label: 'Hired', count: stats.hired, color: 'emerald' }
                ].map((stage, idx, arr) => {
                  const maxVal = arr[0].count || 1;
                  const pct = Math.round((stage.count / maxVal) * 100);
                  const colorMap: Record<string, string> = {
                    cyan: 'bg-cyan-500',
                    violet: 'bg-violet-500',
                    amber: 'bg-amber-500',
                    emerald: 'bg-emerald-500'
                  };
                  return (
                    <div key={stage.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{stage.label}</span>
                        <span className="font-bold text-white">{stage.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colorMap[stage.color]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
