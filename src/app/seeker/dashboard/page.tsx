'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle, ArrowRight, ArrowUpRight, Award, Bell, Bookmark, Briefcase, Building2,
  Calendar, CheckCircle2, ChevronRight, Clock, Eye, FileText, MapPin, Search, Send,
  Sparkles, TrendingUp, User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useSeekerStats } from '@/hooks/useRealtimeStats';
import { where, orderBy, limit } from 'firebase/firestore';
import { formatDate, type FirestoreTime } from '@/lib/firestoreTime';
import {
  Button, Card, CardBody, CardHeader, EmptyState, PageHeader, PageShell, Pill,
  Stat, StatGrid, type PillTone,
} from '@/components/dashboard';

const STATUS_LABEL: Record<string, { tone: PillTone; label: string }> = {
  applied:             { tone: 'info', label: 'Applied' },
  under_review:        { tone: 'violet', label: 'Under review' },
  shortlisted:         { tone: 'success', label: 'Shortlisted' },
  interview_scheduled: { tone: 'warning', label: 'Interview scheduled' },
  selected:            { tone: 'success', label: 'Selected' },
  rejected:            { tone: 'danger', label: 'Rejected' },
};

const QUICK_ACTIONS = [
  { label: 'My resume', icon: FileText, href: '/seeker/resume', bg: '#EFF6FF', color: '#2563EB' },
  { label: 'Edit profile', icon: User, href: '/seeker/profile', bg: '#ECFDF5', color: '#059669' },
  { label: 'Job alerts', icon: Bell, href: '/seeker/job-alerts', bg: '#FFFBEB', color: '#D97706' },
  { label: 'AI coach', icon: Sparkles, href: '/seeker/ai-coach', bg: '#F5F3FF', color: '#7C3AED' },
];

interface ApplicationDoc { id: string; jobTitle?: string; companyName?: string; status?: string; createdAt?: FirestoreTime }
interface InterviewDoc { id: string; companyName?: string; jobTitle?: string; date?: string; time?: string; mode?: string }
interface JobDoc { id: string; title?: string; companyName?: string; district?: string; jobType?: string; salaryMin?: number | string; isUrgent?: boolean }

interface SeekerProfile {
  uid?: string;
  displayName?: string;
  photoURL?: string;
  phone?: string;
  phoneNumber?: string;
  skills?: unknown[];
  education?: unknown[];
  experience?: unknown[];
  resumeUrl?: string;
  resumeURL?: string;
  bio?: string;
  about?: string;
}

interface ProfileCheck { key: string; label: string; done: boolean; href: string; icon: LucideIcon }

export default function SeekerDashboard() {
  const auth = useAuth();
  const user = auth.user as SeekerProfile | null | undefined;
  const firebaseUser = (auth as { firebaseUser?: { displayName?: string; photoURL?: string } }).firebaseUser;
  const uid = user?.uid;

  const { stats, loading: statsLoading } = useSeekerStats(uid);
  const { data: applications, loading: appsLoading } = useCollection<ApplicationDoc>('applications', [
    where('seekerId', '==', uid || ''), orderBy('createdAt', 'desc'), limit(5)
  ], { skip: !uid });
  const { data: interviews } = useCollection<InterviewDoc>('interviews', [
    where('seekerId', '==', uid || ''), limit(4)
  ], { skip: !uid });
  const { data: jobs, loading: jobsLoading } = useCollection<JobDoc>('jobs', [
    where('isActive', '==', true), where('status', '==', 'active'),
    orderBy('createdAt', 'desc'), limit(4)
  ]);

  const displayName = user?.displayName || firebaseUser?.displayName || 'Seeker';
  const loading = statsLoading || appsLoading || jobsLoading;

  // ─── Profile completion ───
  const profileChecks: ProfileCheck[] = [
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
  const strengthColor = profileStrength >= 80 ? '#059669' : profileStrength >= 50 ? '#D97706' : '#DC2626';
  const strengthLabel = profileStrength >= 80 ? 'Strong' : profileStrength >= 50 ? 'Growing' : 'Beginner';
  const pendingChecks = profileChecks.filter(c => !c.done);

  return (
    <PageShell>
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description="Keep your profile updated to get better job matches."
        actions={
          <>
            <Link href="/seeker/profile"><Button variant="secondary">Update profile</Button></Link>
            <Link href="/jobs">
              <Button variant="primary"><Search size={15} /> Find jobs</Button>
            </Link>
          </>
        }
      />

      {/* Employer callout */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/20 text-blue-200">
            <Building2 size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-950">
                Hiring talent?
              </span>
              <span className="text-xs text-blue-200">For business owners &amp; recruiters</span>
            </div>
            <h2 className="mt-1 text-base font-bold text-white sm:text-lg">
              Post jobs &amp; hire local talent in Theni
            </h2>
            <p className="mt-0.5 text-xs text-blue-200/90">
              Register your business, publish openings, and receive verified candidate applications directly.
            </p>
          </div>
        </div>
        <Link href="/seeker/become-employer" className="shrink-0">
          <Button className="w-full border-0 bg-blue-600 text-white hover:bg-blue-500 sm:w-auto">
            <Briefcase size={14} /> Become an employer <ArrowRight size={14} />
          </Button>
        </Link>
      </div>

      <StatGrid columns={4}>
        <Stat label="Applied jobs" value={stats?.appliedJobs || 0} icon={Send} tone="blue" loading={loading} />
        <Stat label="Saved jobs" value={stats?.savedJobs || 0} icon={Bookmark} tone="amber" loading={loading} />
        <Stat label="Interviews" value={stats?.interviews || 0} icon={Calendar} tone="emerald" loading={loading} />
        <Stat label="Profile views" value={stats?.profileViews || 0} icon={Eye} tone="violet" loading={loading} />
      </StatGrid>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        {/* Recommended jobs */}
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title="Recommended jobs"
            description="Latest matching opportunities"
            action={<Link href="/jobs" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">Browse all →</Link>}
          />
          {jobs.length === 0 ? (
            <EmptyState variant="inline" icon={Briefcase} title="No active jobs listed" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {jobs.map(job => (
                <li key={job.id} className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 font-bold text-[#2563EB]"
                      style={{ background: '#EFF6FF' }}
                    >
                      {(job.companyName || 'J')[0].toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{job.title || 'Untitled job'}</span>
                        {job.isUrgent && <Pill tone="warning">Urgent</Pill>}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <span className="truncate">{job.companyName || 'Company'}</span>
                        {job.district && (
                          <>
                            <MapPin size={10} aria-hidden />
                            <span className="truncate">{job.district}</span>
                          </>
                        )}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Pill tone="info">{(job.jobType || 'full_time').replace(/_/g, ' ')}</Pill>
                        {job.salaryMin && (
                          <span className="text-xs font-semibold text-emerald-700">
                            ₹{Number(job.salaryMin).toLocaleString('en-IN')}/mo
                          </span>
                        )}
                      </span>
                    </span>
                  </div>
                  <Link href={`/jobs/${job.id}`} className="shrink-0">
                    <Button size="sm" className="w-full border-0 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
                      Apply
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Profile strength */}
          <Card className="overflow-hidden">
            <CardHeader
              title="Profile strength"
              description="Complete your profile to get more matches"
              action={<Award size={16} style={{ color: strengthColor }} aria-hidden />}
            />
            <CardBody className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" stroke={strengthColor} strokeWidth="3"
                    strokeDasharray={`${profileStrength} ${100 - profileStrength}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold" style={{ color: strengthColor }}>{profileStrength}%</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: strengthColor }}>{strengthLabel}</p>
                <p className="text-xs text-slate-500">{completedCount}/{profileChecks.length} sections completed</p>
                {profileStrength >= 80 && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 size={11} aria-hidden /> Employers can find you easily.
                  </p>
                )}
              </div>
            </CardBody>
            {pendingChecks.length > 0 && (
              <div className="space-y-1.5 px-4 pb-4 sm:px-5">
                {pendingChecks.slice(0, 3).map(check => {
                  const Icon = check.icon;
                  return (
                    <Link
                      key={check.key}
                      href={check.href}
                      className="group flex items-center gap-2.5 rounded-xl border border-dashed border-slate-200 p-2.5 transition-all hover:border-amber-300 hover:bg-amber-50/40"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFFBEB] text-amber-600">
                        <Icon size={12} aria-hidden />
                      </span>
                      <span className="flex-1 text-xs font-medium text-slate-700">{check.label}</span>
                      <AlertCircle size={12} className="text-amber-500" aria-hidden />
                    </Link>
                  );
                })}
                {pendingChecks.length > 3 && (
                  <p className="pt-1 text-center text-xs text-slate-500">
                    +{pendingChecks.length - 3} more to complete
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Upcoming interviews */}
          <Card className="overflow-hidden">
            <CardHeader title="Upcoming interviews" action={<Calendar size={16} className="text-slate-400" aria-hidden />} />
            {interviews.length === 0 ? (
              <EmptyState variant="inline" icon={Calendar} title="No scheduled interviews" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {interviews.map(iv => (
                  <li key={iv.id} className="px-4 py-3.5 transition-colors hover:bg-slate-50/70 sm:px-5">
                    <p className="truncate text-sm font-semibold text-slate-900">{iv.companyName || 'Company'}</p>
                    <p className="truncate text-xs text-slate-500">{iv.jobTitle}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock size={10} aria-hidden />
                        {iv.date || 'Date TBC'}{iv.time ? ` at ${iv.time}` : ''}
                      </span>
                      {iv.mode && <Pill tone="warning">{iv.mode}</Pill>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
              <Link href="/seeker/interviews" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                View all <ChevronRight size={12} />
              </Link>
            </div>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardBody>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-3 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: action.bg }}>
                        <Icon size={14} style={{ color: action.color }} aria-hidden />
                      </span>
                      <span className="text-xs font-medium leading-tight text-slate-700">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Application tracking */}
      <Card className="overflow-hidden">
        <CardHeader
          title="My applications"
          description="Track your job application status"
          action={<Link href="/seeker/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</Link>}
        />
        {applications.length === 0 ? (
          <EmptyState
            variant="inline"
            icon={Send}
            title="No applications sent yet"
            description="Browse the latest openings and apply in a couple of taps."
            action={
              <Link href="/jobs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                Browse jobs <ArrowUpRight size={12} />
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {applications.map(app => {
              const st = STATUS_LABEL[app.status ?? 'applied'] ?? STATUS_LABEL.applied;
              return (
                <li key={app.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/70 sm:px-5">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#2563EB]"
                    style={{ background: '#EFF6FF' }}
                  >
                    <Building2 size={15} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{app.jobTitle || 'Job'}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {app.companyName} · {formatDate(app.createdAt)}
                    </span>
                  </span>
                  <Pill tone={st.tone}>{st.label}</Pill>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <TrendingUp size={12} aria-hidden />
        <span>Stats refresh automatically as employers act on your applications.</span>
      </div>
    </PageShell>
  );
}
