'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Send, Bookmark, Calendar, Bell,
  TrendingUp, Eye, Clock, MapPin, Building2, FileText,
  Sparkles, User, Search, Loader2, type LucideIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useSeekerStats } from '@/hooks/useRealtimeStats';
import { where, orderBy, limit } from 'firebase/firestore';
import { formatJobType } from '@/lib/jobFormatters';
import { isPublicJobVisible } from '@/lib/jobPolicy';

// Animated counter
function useCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    if (target === 0) { setCount(0); return; }
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  applied: { label: 'Applied', color: 'bg-cyan-500/10 text-cyan-400' },
  under_review: { label: 'Under Review', color: 'bg-violet-500/10 text-violet-400' },
  shortlisted: { label: 'Shortlisted', color: 'bg-emerald-500/10 text-emerald-400' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-amber-500/10 text-amber-400' },
  selected: { label: 'Selected', color: 'bg-emerald-500/10 text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-rose-500/10 text-rose-400' },
};

const colorMap: Record<string, { bg: string; text: string }> = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color: keyof typeof colorMap;
}

function StatCard({ stat }: { stat: StatItem }) {
  const count = useCounter(stat.value);
  const colors = colorMap[stat.color];
  const Icon = stat.icon;

  return (
    <div className="glass-card rounded-2xl p-4 hover:border-white/15 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon size={18} className={colors.text} />
        </div>
      </div>
      <p className="text-xl font-bold text-white font-outfit">{count}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{stat.label}</p>
    </div>
  );
}

export default function SeekerDashboard() {
  const { user, firebaseUser } = useAuth();
  const uid = user?.uid;

  // 1. Fetch live stats
  const { stats, loading: statsLoading } = useSeekerStats(uid);

  // 2. Fetch recent applications
  const { data: applications, loading: appsLoading } = useCollection<any>('jobApplications', [
    where('applicantId', '==', uid || ''),
    orderBy('appliedDate', 'desc'),
    limit(5)
  ], { skip: !uid });

  // 3. Fetch upcoming interviews
  const { data: interviews, loading: interviewsLoading } = useCollection<any>('interviews', [
    where('seekerId', '==', uid || ''),
    limit(5)
  ], { skip: !uid });

  // 4. Fetch recommended jobs (fetch latest active jobs as fallbacks)
  const { data: jobs, loading: jobsLoading } = useCollection<any>('jobs', [
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(20)
  ]);

  const visibleJobs = useMemo(() => {
    return jobs.filter(j => isPublicJobVisible(j)).slice(0, 4);
  }, [jobs]);

  const statsItems: StatItem[] = [
    { label: 'Applied Jobs', value: stats.appliedJobs, icon: Send, color: 'violet' },
    { label: 'Saved Jobs', value: stats.savedJobs, icon: Bookmark, color: 'amber' },
    { label: 'Interviews Scheduled', value: stats.interviews, icon: Calendar, color: 'cyan' },
    { label: 'Profile Views', value: stats.profileViews, icon: Eye, color: 'emerald' },
  ];

  const loading = statsLoading || appsLoading || interviewsLoading || jobsLoading;

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AS';
  };

  const displayName = user?.displayName || firebaseUser?.displayName || 'Seeker';

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      {/* Welcome Header */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-emerald-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-lg font-bold">{getInitials(displayName)}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white font-outfit">Welcome back, {displayName}! 👋</h1>
              <p className="text-sm text-gray-400 mt-0.5">Your profile is active. Keep it up to date to get better job matches.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/seeker/profile" className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.08] transition-all font-medium">
              Update Profile
            </Link>
            <Link href="/jobs" className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5">
              <Search size={14} />
              Find Jobs
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsItems.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recommended Jobs */}
            <div className="xl:col-span-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Sparkles size={16} className="text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white">Recommended & Latest Jobs</h2>
                      <p className="text-[10px] text-gray-500">Matching opportunities for you</p>
                    </div>
                  </div>
                  <Link href="/jobs" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">
                    Browse All →
                  </Link>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {visibleJobs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No active jobs listed.</div>
                  ) : (
                    visibleJobs.map((job) => (
                      <div key={job.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
                          <span className="text-xs font-bold text-white">{(job.companyName || 'JB').slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">{job.title}</p>
                            {job.isUrgent && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 text-rose-400 uppercase">Urgent</span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {job.companyName} · <MapPin size={10} className="inline" /> {job.district}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-medium">{formatJobType(job.jobType)}</span>
                            {job.salaryMin && (
                              <span className="text-[10px] text-gray-500">₹{job.salaryMin.toLocaleString('en-IN')}–₹{job.salaryMax.toLocaleString('en-IN')}/month</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <Link href={`/jobs/${job.id}`} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/20 transition-colors">
                              Apply
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="xl:col-span-1 space-y-6">
              {/* Upcoming Interviews */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Calendar size={16} className="text-amber-400" />
                    </div>
                    <h2 className="text-sm font-semibold text-white">Upcoming Interviews</h2>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {interviews.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-500">No interviews scheduled yet.</div>
                  ) : (
                    interviews.map((interview) => (
                      <div key={interview.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-violet-400">{(interview.companyName || 'CO').slice(0, 2).toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{interview.companyName}</p>
                            <p className="text-[10px] text-gray-500">{interview.jobTitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 flex items-center gap-1"><Clock size={10} /> {interview.date}, {interview.time}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 font-medium text-[10px]">{interview.mode}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="glass-card rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Upload Resume', icon: FileText, href: '/seeker/resume', color: 'violet' },
                    { label: 'Edit Profile', icon: User, href: '/seeker/profile', color: 'cyan' },
                    { label: 'Job Alerts', icon: Bell, href: '/seeker/job-alerts', color: 'amber' },
                    { label: 'AI Coach', icon: Sparkles, href: '/seeker/ai-coach', color: 'emerald' },
                  ].map((action) => {
                    const colors = colorMap[action.color];
                    const Icon = action.icon;
                    return (
                      <Link key={action.label} href={action.href}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all">
                        <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon size={14} className={colors.text} />
                        </div>
                        <span className="text-xs text-gray-300 font-medium">{action.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Application Tracking */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-violet-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Application Tracking</h2>
                  <p className="text-[10px] text-gray-500">Your recent job applications</p>
                </div>
              </div>
            </div>

            {/* Application List */}
            <div className="divide-y divide-white/[0.04]">
              {applications.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500">No applications sent yet.</div>
              ) : (
                applications.map((app) => (
                  <div key={app.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <Building2 size={18} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{app.jobTitle}</p>
                       <p className="text-[11px] text-gray-500">{app.companyName} · Applied {app.appliedDate ? new Date(app.appliedDate.seconds * 1000).toLocaleDateString() : 'Recently'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusConfig[app.status || 'applied']?.color || 'bg-gray-500/10 text-gray-400'}`}>
                      {statusConfig[app.status || 'applied']?.label || app.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
