'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useEmployerStats } from '@/hooks/useRealtimeStats';
import { where } from 'firebase/firestore';
import { BarChart3, Briefcase, Download, Eye, Users2 } from 'lucide-react';
import Link from 'next/link';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  EmptyState,
  PageHeader,
  PageShell,
  Pill,
  Stat,
  StatGrid,
  type Column,
} from '@/components/dashboard';

interface CompanyDoc { id: string; name?: string; viewCount?: number }
interface JobDoc { id: string; title?: string; jobType?: string; viewCount?: number; status?: string; isActive?: boolean }
interface ApplicationDoc { id: string; jobId?: string }

interface JobMetric {
  id: string;
  title: string;
  type: string;
  apps: number;
  views: number;
  status: string;
}

export default function EmployerReportsPage() {
  const { user } = useAuth();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<CompanyDoc>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch live stats
  const { stats, loading: statsLoading } = useEmployerStats(companyId);

  // 3. Fetch jobs
  const { data: jobs, loading: jobsLoading } = useCollection<JobDoc>('jobs', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  // 4. Fetch applications
  const { data: applications, loading: appsLoading } = useCollection<ApplicationDoc>('applications', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const loading = companyLoading || statsLoading || jobsLoading || appsLoading;

  const jobMetrics = useMemo<JobMetric[]>(() => jobs.map((job) => {
    const appCount = applications.filter((app) => app.jobId === job.id).length;
    return {
      id: job.id,
      title: job.title || 'Untitled job',
      type: job.jobType || '',
      apps: appCount,
      views: job.viewCount || 0,
      status: job.status || (job.isActive !== false ? 'active' : 'draft')
    };
  }).sort((a, b) => b.apps - a.apps).slice(0, 5), [jobs, applications]);

  const columns = useMemo<Column<JobMetric>[]>(() => [
    {
      key: 'title',
      header: 'Job title',
      card: 'title',
      sortValue: j => j.title,
      render: j => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{j.title}</p>
          {j.type && (
            <span className="mt-0.5 inline-block text-xs capitalize text-slate-500">
              {j.type.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      align: 'center',
      sortValue: j => j.views,
      render: j => <span className="tabular-nums">{j.views}</span>,
    },
    {
      key: 'apps',
      header: 'Applications',
      align: 'center',
      sortValue: j => j.apps,
      render: j => <span className="font-semibold tabular-nums text-slate-900">{j.apps}</span>,
    },
    {
      key: 'conversion',
      header: 'Conversion',
      align: 'center',
      sortValue: j => (j.views > 0 ? j.apps / j.views : 0),
      render: j => {
        const conversion = j.views > 0 ? Math.round((j.apps / j.views) * 100) : 0;
        return <Pill tone={conversion >= 10 ? 'success' : 'neutral'}>{conversion}%</Pill>;
      },
    },
  ], []);

  if (!companyId && !companyLoading) {
    return (
      <PageShell>
        <EmptyState
          icon={BarChart3}
          title="No company profile yet"
          description="Register your company profile to unlock recruitment reports and metrics."
          action={
            <Link href="/employer/company-profile">
              <Button variant="primary">Set up company profile</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  const pipeline = [
    { label: 'Applications', count: stats.totalApplications, bar: 'bg-blue-500' },
    { label: 'Shortlisted', count: stats.shortlisted, bar: 'bg-violet-500' },
    { label: 'Interviews', count: stats.interviews, bar: 'bg-amber-500' },
    { label: 'Hired', count: stats.hired, bar: 'bg-emerald-500' },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Recruitment reports"
        description={company?.name ? `Analytics and metrics for ${company.name}.` : 'Analytics and metrics overview.'}
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Reports' }]}
        actions={
          <Button variant="secondary" size="sm">
            <Download size={14} /> Export CSV
          </Button>
        }
      />

      <StatGrid columns={3}>
        <Stat
          label="Job listings"
          value={jobs.length}
          icon={Briefcase}
          tone="blue"
          loading={loading}
          hint={`${stats.activeJobs} currently active`}
        />
        <Stat
          label="Applications received"
          value={applications.length}
          icon={Users2}
          tone="violet"
          loading={loading}
          hint={`${stats.shortlisted} shortlisted`}
        />
        <Stat
          label="Profile views"
          value={company?.viewCount || 0}
          icon={Eye}
          tone="amber"
          loading={loading}
          hint="Company brand engagement"
        />
      </StatGrid>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Top performing jobs" description="Ranked by applications received" />
          <CardBody className="p-0">
            <DataTable
              label="Top performing jobs"
              className="rounded-none border-0"
              columns={columns}
              rows={jobMetrics}
              getRowId={j => j.id}
              loading={loading}
              skeletonRows={4}
              emptyIcon={Briefcase}
              emptyTitle="No job stats available"
              emptyDescription="Publish a job and its views and applications will be tracked here."
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Pipeline summary" description="Candidate flow by stage" />
          <CardBody className="space-y-4">
            {pipeline.map((stage) => {
              const maxVal = pipeline[0].count || 1;
              const pct = Math.round((stage.count / maxVal) * 100);
              return (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500">{stage.label}</span>
                    <span className="font-semibold tabular-nums text-slate-900">
                      {stage.count} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${stage.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
