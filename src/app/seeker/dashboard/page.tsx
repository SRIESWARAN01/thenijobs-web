'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase, Send, Bookmark, Calendar, Bell, Eye, Clock,
  ChevronRight, MapPin, FileText, Sparkles, TrendingUp,
  User, Search, Building2, ArrowUpRight, CheckCircle2, AlertCircle, Award, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useSeekerStats } from '@/hooks/useRealtimeStats';
import { where, orderBy, limit } from 'firebase/firestore';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  applied:             { bg: '#EFF6FF', text: '#2563EB', label: 'Applied' },
  under_review:        { bg: '#F5F3FF', text: '#7C3AED', label: 'Under Review' },
  shortlisted:         { bg: '#ECFDF5', text: '#059669', label: 'Shortlisted' },
  interview_scheduled: { bg: '#FFFBEB', text: '#D97706', label: 'Interview Scheduled' },
  selected:            { bg: '#ECFDF5', text: '#059669', label: '✓ Selected' },
  rejected:            { bg: '#FEF2F2', text: '#DC2626', label: 'Rejected' } };

const QUICK_ACTIONS = [
  { label: 'My Resume', icon: FileText, href: '/seeker/resume', bg: '#EFF6FF', color: '#2563EB' },
  { label: 'Edit Profile', icon: User, href: '/seeker/profile', bg: '#ECFDF5', color: '#059669' },
  { label: 'Job Alerts', icon: Bell, href: '/seeker/job-alerts', bg: '#FFFBEB', color: '#D97706' },
  { label: 'AI Coach', icon: Sparkles, href: '/seeker/ai-coach', bg: '#F5F3FF', color: '#7C3AED' },
];

function useCounter(target: number) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = target / (1000 / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

export default function SeekerDashboard() {
  const { user, firebaseUser } = useAuth() as any;
  const uid = user?.uid;

  const { stats, loading: statsLoading } = useSeekerStats(uid);
  const { data: applications, loading: appsLoading } = useCollection<any>('applications', [
    where('seekerId', '==', uid || ''), orderBy('createdAt', 'desc'), limit(5)
  ], { skip: !uid });
  const { data: interviews } = useCollection<any>('interviews', [
    where('seekerId', '==', uid || ''), limit(4)
  ], { skip: !uid });
  const { data: jobs, loading: jobsLoading } = useCollection<any>('jobs', [
    where('isActive', '==', true), where('status', '==', 'active'),
    orderBy('createdAt', 'desc'), limit(4)
  ]);

  const displayName = user?.displayName || firebaseUser?.displayName || 'Seeker';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const loading = statsLoading || appsLoading || jobsLoading;

  const statItems = [
    { label: 'Applied Jobs', value: stats?.appliedJobs || 0, icon: Send, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Saved Jobs', value: stats?.savedJobs || 0, icon: Bookmark, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Interviews', value: stats?.interviews || 0, icon: Calendar, bg: '#ECFDF5', color: '#059669' },
    { label: 'Profile Views', value: stats?.profileViews || 0, icon: Eye, bg: '#F5F3FF', color: '#7C3AED' },
  ];

  // ─── Profile Completion Gamification ───
  const profileChecks = [
    { key: 'name', label: 'Add your name', done: !!(user?.displayName), href: '/seeker/profile', icon: User },
    { key: 'phone', label: 'Add phone number', done: !!(user?.phone || user?.phoneNumber), href: '/seeker/profile', icon: User },
    { key: 'photo', label: 'Upload profile photo', done: !!(user?.photoURL || firebaseUser?.photoURL), href: '/seeker/profile', icon: User },
    { key: 'skills', label: 'Add your skills', done: !!(user?.skills?.length), href: '/seeker/skills', icon: Sparkles },
    { key: 'education', label: 'Add education', done: !!(user?.education?.length), href: '/seeker/profile', icon: Award },
    { key: 'experience', label: 'Add work experience', done: !!(user?.experience?.length), href: '/seeker/profile', icon: Briefcase },
    { key: 'resume', label: 'Upload resume', done: !!(user?.resumeUrl || user?.resumeURL), href: '/seeker/resume', icon: FileText },
    { key: 'bio', label: 'Write a short bio', done: !!(user?.bio || user?.about), href: '/seeker/profile', icon: FileText },
  ];
  const completedCount = profileChecks.filter(c => c.done).length;
  const profileStrength = Math.round((completedCount / profileChecks.length) * 100);
  const strengthColor = profileStrength >= 80 ? '#10B981' : profileStrength >= 50 ? '#F59E0B' : '#EF4444';
  const strengthLabel = profileStrength >= 80 ? 'Strong' : profileStrength >= 50 ? 'Growing' : 'Beginner';
  const pendingChecks = profileChecks.filter(c => !c.done);

  return (
    <div className="p-4 sm:p-6 space-y-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Welcome header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-emerald-700 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}>
              {initials}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Welcome back, {displayName}! 👋
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Keep your profile updated to get better job matches</p>
              {/* Profile strength */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden" style={{ maxWidth: 120 }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${profileStrength}%`, background: '#10B981' }} />
                </div>
                <span className="text-xs text-emerald-600 font-semibold">{profileStrength}% profile</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/seeker/profile" className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all">
              Update Profile
            </Link>
            <Link href="/jobs" className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:opacity-90 flex items-center gap-1.5"
              style={{ background: '#10B981' }}>
              <Search size={14} /> Find Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Employer Upgrade / Post a Job Callout */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-extrabold uppercase tracking-wide">
                Hiring Talent?
              </span>
              <span className="text-xs text-blue-200">For Business Owners &amp; Recruiters</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              Post Jobs &amp; Hire Local Talent in Theni
            </h3>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Register your business, publish job openings, and receive verified candidate applications directly.
            </p>
          </div>
        </div>

        <Link
          href="/seeker/become-employer"
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Briefcase size={14} /> Post a Job / Become Employer <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statItems.map(stat => {
              const Icon = stat.icon;
              const count = stat.value;
              return (
                <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: stat.bg }}>
                    <Icon size={18} style={{ color: stat.color }} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{count}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Recommended Jobs */}
            <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                    <Sparkles size={15} style={{ color: '#059669' }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Recommended Jobs</h2>
                    <p className="text-[10px] text-gray-400">Latest matching opportunities</p>
                  </div>
                </div>
                <Link href="/jobs" className="text-xs text-emerald-600 font-semibold hover:text-emerald-700">Browse All →</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {jobs.length === 0 ? (
                  <div className="p-10 text-center">
                    <Briefcase size={28} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-xs text-gray-400">No active jobs listed</p>
                  </div>
                ) : jobs.map(job => (
                  <div key={job.id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-blue-600 flex-shrink-0 border border-blue-100"
                      style={{ background: '#EFF6FF' }}>
                      {(job.companyName || 'J')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                        {job.isUrgent && <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-amber-50 text-amber-600">URGENT</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">{job.companyName} · <MapPin size={9} className="inline" /> {job.district}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                          {job.jobType?.replace('_', ' ') || 'Full Time'}
                        </span>
                        {job.salaryMin && (
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            ₹{Number(job.salaryMin).toLocaleString('en-IN')}/mo
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/jobs/${job.id}`}
                      className="px-3 py-1.5 text-[11px] font-semibold text-gray-900 rounded-lg transition-all hover:opacity-90 flex-shrink-0"
                      style={{ background: '#10B981' }}>
                      Apply
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* ═══ Profile Completion Gamification Card ═══ */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: profileStrength >= 80 ? '#ECFDF5' : '#FFFBEB' }}>
                    <Award size={15} style={{ color: strengthColor }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Profile Strength</h2>
                    <p className="text-[10px] text-gray-400">Complete your profile to get more job matches</p>
                  </div>
                </div>

                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Circular progress ring */}
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={strengthColor} strokeWidth="3"
                        strokeDasharray={`${profileStrength} ${100 - profileStrength}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold" style={{ color: strengthColor }}>{profileStrength}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: strengthColor }}>{strengthLabel}</p>
                    <p className="text-[11px] text-gray-500">{completedCount}/{profileChecks.length} sections completed</p>
                    {profileStrength >= 80 && (
                      <p className="text-[10px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                        <CheckCircle2 size={10} /> Great job! Employers can find you easily.
                      </p>
                    )}
                  </div>
                </div>

                {/* Pending action items */}
                {pendingChecks.length > 0 && (
                  <div className="px-5 pb-4 space-y-1.5">
                    {pendingChecks.slice(0, 3).map(check => {
                      const Icon = check.icon;
                      return (
                        <Link key={check.key} href={check.href}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all group">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-50 text-amber-500 flex-shrink-0">
                            <Icon size={12} />
                          </div>
                          <span className="text-xs text-gray-600 flex-1 font-medium">{check.label}</span>
                          <AlertCircle size={12} className="text-amber-400 group-hover:text-amber-500" />
                        </Link>
                      );
                    })}
                    {pendingChecks.length > 3 && (
                      <p className="text-[10px] text-gray-400 text-center pt-1">
                        +{pendingChecks.length - 3} more to complete
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming Interviews */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                    <Calendar size={15} style={{ color: '#D97706' }} />
                  </div>
                  <h2 className="text-sm font-semibold text-gray-900">Upcoming Interviews</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {interviews.length === 0 ? (
                    <div className="p-8 text-center">
                      <Calendar size={24} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-xs text-gray-400">No scheduled interviews</p>
                    </div>
                  ) : interviews.map(iv => (
                    <div key={iv.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                      <p className="text-sm font-medium text-gray-900">{iv.companyName}</p>
                      <p className="text-[11px] text-gray-400">{iv.jobTitle}</p>
                      <div className="flex items-center justify-between mt-1.5 text-[11px]">
                        <span className="flex items-center gap-1 text-gray-400"><Clock size={10} />{iv.date} at {iv.time}</span>
                        <span className="px-2 py-0.5 rounded-full font-semibold" style={{ background: '#FFFBEB', color: '#D97706' }}>{iv.mode}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 border-t border-gray-50">
                  <Link href="/seeker/interviews" className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700">
                    View all <ChevronRight size={12} />
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map(action => {
                    const Icon = action.icon;
                    return (
                      <Link key={action.label} href={action.href}
                        className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: action.bg }}>
                          <Icon size={14} style={{ color: action.color }} />
                        </div>
                        <span className="text-xs text-gray-700 font-medium leading-tight">{action.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Application Tracking */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <TrendingUp size={15} style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">My Applications</h2>
                  <p className="text-[10px] text-gray-400">Track your job application status</p>
                </div>
              </div>
              <Link href="/seeker/applications" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {applications.length === 0 ? (
                <div className="p-10 text-center">
                  <Send size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-xs text-slate-600 font-medium">No applications sent yet</p>
                  <Link href="/jobs" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 font-semibold">
                    Browse jobs <ArrowUpRight size={11} />
                  </Link>
                </div>
              ) : applications.map(app => {
                const st = STATUS_STYLES[app.status] || STATUS_STYLES['applied'];
                return (
                  <div key={app.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0"
                      style={{ background: '#EFF6FF' }}>
                      <Building2 size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{app.jobTitle}</p>
                      <p className="text-[11px] text-gray-400">{app.companyName} · {app.createdAt ? new Date(app.createdAt?.toMillis?.() || app.createdAt).toLocaleDateString() : 'Recently'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0"
                      style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
