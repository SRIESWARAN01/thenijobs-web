'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart2, Briefcase, Building2, Calendar, CheckCircle, ChevronRight, Clock,
  Eye, Loader2, Plus, Send, Star, UserCheck, Users, XCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useEmployerStats } from '@/hooks/useRealtimeStats';
import { updateApplicationStatus } from '@/lib/firebase/firestoreService';
import { where, limit, orderBy } from 'firebase/firestore';
import { formatDate, type FirestoreTime } from '@/lib/firestoreTime';
import {
  Button, Card, CardBody, CardHeader, DataTable, EmptyState, PageHeader, PageShell,
  Pill, Stat, StatGrid, type Column, type PillTone,
} from '@/components/dashboard';

const STATUS_LABEL: Record<string, { tone: PillTone; label: string }> = {
  applied:             { tone: 'info', label: 'Applied' },
  shortlisted:         { tone: 'violet', label: 'Shortlisted' },
  interview_scheduled: { tone: 'warning', label: 'Interview' },
  selected:            { tone: 'success', label: 'Selected' },
  rejected:            { tone: 'danger', label: 'Rejected' },
};

interface CompanyDoc { id: string; name?: string; viewCount?: number; verificationStatus?: string; rejectionReason?: string }
interface ApplicationDoc { id: string; seekerName?: string; status?: string; createdAt?: FirestoreTime }
interface JobDoc { id: string; title?: string; jobType?: string; isUrgent?: boolean; applicationsCount?: number; viewCount?: number; createdAt?: FirestoreTime }
interface InterviewDoc { id: string; seekerName?: string; mode?: string; date?: string; time?: string }

export default function EmployerDashboard() {
  const { user } = useAuth();

  const { data: companies, loading: companyLoading } = useCollection<CompanyDoc>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];
  const companyId = company?.id;

  const { stats, loading: statsLoading } = useEmployerStats(companyId);

  const { data: applications, loading: appsLoading } = useCollection<ApplicationDoc>('applications', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc'),
    limit(5)
  ], { skip: !companyId });

  const { data: activeJobs, loading: jobsLoading } = useCollection<JobDoc>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true),
    limit(6)
  ], { skip: !companyId });

  const { data: interviews } = useCollection<InterviewDoc>('interviews', [
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

  const jobColumns = useMemo<Column<JobDoc>[]>(() => [
    {
      key: 'title',
      header: 'Job title',
      card: 'title',
      sortValue: j => j.title ?? '',
      render: j => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{j.title || 'Untitled job'}</p>
            {j.isUrgent && <Pill tone="danger">Urgent</Pill>}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">Posted {formatDate(j.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'jobType',
      header: 'Type',
      hideBelow: 'lg',
      sortValue: j => j.jobType ?? '',
      render: j => <Pill tone="info">{j.jobType || 'Full time'}</Pill>,
    },
    {
      key: 'applicationsCount',
      header: 'Applications',
      align: 'center',
      sortValue: j => j.applicationsCount ?? 0,
      render: j => <span className="font-semibold tabular-nums text-slate-900">{j.applicationsCount || 0}</span>,
    },
    {
      key: 'viewCount',
      header: 'Views',
      align: 'center',
      hideBelow: 'xl',
      sortValue: j => j.viewCount ?? 0,
      render: j => <span className="tabular-nums">{j.viewCount || 0}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: () => <Pill tone="success" dot>Active</Pill>,
    },
  ], []);

  if (!companyId && !companyLoading) {
    return (
      <PageShell>
        <EmptyState
          icon={Building2}
          title="No company registered"
          description="Register your company profile to access the dashboard and start posting jobs."
          action={
            <Link href="/employer/company-profile">
              <Button variant="primary">Create company profile</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  const funnel = [
    { label: 'Applied', count: stats?.totalApplications || 0, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Shortlisted', count: stats?.shortlisted || 0, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Interviewed', count: stats?.interviews || 0, bg: '#FFFBEB', color: '#D97706' },
    { label: 'Hired', count: stats?.hired || 0, bg: '#ECFDF5', color: '#059669' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Employer dashboard"
        description={`${company?.name || 'Your company'} — manage your hiring pipeline.`}
        actions={
          <Link href="/employer/post-job">
            <Button variant="primary">
              <Plus size={16} /> Post new job
            </Button>
          </Link>
        }
      />

      {company && company.verificationStatus !== 'verified' && (
        <div
          role="status"
          className={`rounded-2xl border p-3.5 text-sm font-medium ${
            company.verificationStatus === 'pending'
              ? 'border-amber-200 bg-[#FFFBEB] text-[#92400E]'
              : 'border-rose-200 bg-[#FEF2F2] text-[#991B1B]'
          }`}
        >
          {company.verificationStatus === 'pending'
            ? 'Your company profile is under review. You can still post jobs, but they become visible after approval.'
            : `Company rejected: ${company.rejectionReason || 'See your company profile for details.'}`}
        </div>
      )}

      <StatGrid columns={6}>
        <Stat label="Active jobs" value={stats?.activeJobs || 0} icon={Briefcase} tone="blue" loading={loading} />
        <Stat label="Applications" value={stats?.totalApplications || 0} icon={Users} tone="violet" loading={loading} />
        <Stat label="Shortlisted" value={stats?.shortlisted || 0} icon={UserCheck} tone="emerald" loading={loading} />
        <Stat label="Interviews" value={stats?.interviews || 0} icon={Calendar} tone="amber" loading={loading} />
        <Stat label="Hired" value={stats?.hired || 0} icon={Star} tone="rose" loading={loading} />
        <Stat label="Profile views" value={company?.viewCount || 0} icon={Eye} tone="slate" loading={loading} />
      </StatGrid>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        {/* Recent applications */}
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title="Recent applications"
            description="Latest candidate submissions"
            action={<Link href="/employer/candidates" className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all →</Link>}
          />
          {appsLoading ? (
            <div className="flex justify-center p-8"><Loader2 size={20} className="animate-spin text-blue-600" /></div>
          ) : applications.length === 0 ? (
            <EmptyState variant="inline" icon={Users} title="No applications received yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {applications.map(app => {
                const st = STATUS_LABEL[app.status ?? 'applied'] ?? STATUS_LABEL.applied;
                return (
                  <li key={app.id} className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-5">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#2563EB]"
                        style={{ background: '#EFF6FF' }}
                      >
                        {initials(app.seekerName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">{app.seekerName || 'Candidate'}</span>
                          <Pill tone={st.tone}>{st.label}</Pill>
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">{formatDate(app.createdAt)}</span>
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {actionLoading === app.id ? (
                        <Loader2 size={15} className="animate-spin text-blue-600" aria-label="Saving" />
                      ) : app.status === 'applied' ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 sm:flex-none"
                            onClick={() => handleAppStatus(app.id, 'shortlisted')}
                          >
                            <CheckCircle size={14} /> Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 sm:flex-none"
                            onClick={() => handleAppStatus(app.id, 'rejected')}
                          >
                            <XCircle size={14} /> Reject
                          </Button>
                        </>
                      ) : null}
                      <Link href="/employer/candidates" aria-label={`View ${app.seekerName ?? 'candidate'}`}>
                        <Button size="sm" variant="ghost"><Eye size={14} /></Button>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Interviews */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader title="Upcoming interviews" action={<Calendar size={16} className="text-slate-400" aria-hidden />} />
          <div className="flex-1">
            {interviews.length === 0 ? (
              <EmptyState variant="inline" icon={Calendar} title="No scheduled interviews" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {interviews.map(iv => (
                  <li key={iv.id} className="px-4 py-3.5 transition-colors hover:bg-slate-50/70 sm:px-5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{iv.seekerName || 'Candidate'}</p>
                      <Pill tone="warning">{iv.mode || 'Phone'}</Pill>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={11} aria-hidden />
                      {iv.date || 'Date TBC'}{iv.time ? ` at ${iv.time}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
            <Link href="/employer/interviews" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
              View all interviews <ChevronRight size={13} />
            </Link>
          </div>
        </Card>
      </div>

      {/* Active jobs */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Active jobs"
          description="Your current job postings"
          action={<Link href="/employer/jobs" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Manage jobs →</Link>}
        />
        <CardBody className="p-0">
          <DataTable
            label="Active job postings"
            className="rounded-none border-0"
            columns={jobColumns}
            rows={activeJobs}
            getRowId={j => j.id}
            loading={jobsLoading}
            emptyIcon={Briefcase}
            emptyTitle="No active job listings"
            emptyDescription="Post a job and it will appear here with its views and applications."
            emptyAction={
              <Link href="/employer/post-job">
                <Button variant="primary"><Plus size={16} /> Post a job</Button>
              </Link>
            }
          />
        </CardBody>
      </Card>

      {/* Recruitment funnel */}
      <Card>
        <CardHeader title="Recruitment funnel" action={<BarChart2 size={16} className="text-slate-400" aria-hidden />} />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {funnel.map(stage => (
              <div
                key={stage.label}
                className="rounded-2xl border p-4 text-center"
                style={{ background: stage.bg, borderColor: stage.bg }}
              >
                <p className="text-2xl font-bold tabular-nums" style={{ color: stage.color }}>{stage.count}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">{stage.label}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </PageShell>
  );
}
