'use client';

import { useMemo } from 'react';
import { Activity, AlertCircle, BarChart3, Cpu, DollarSign, Zap } from 'lucide-react';
import { orderBy, limit } from 'firebase/firestore';
import { useCollection } from '@/hooks/useFirestore';
import {
  Card,
  CardBody,
  CardHeader,
  DataTable,
  PageHeader,
  PageShell,
  Pill,
  Stat,
  StatGrid,
  type Column,
} from '@/components/dashboard';

interface AIUsageLog {
  id: string;
  feature?: string;
  role?: string;
  creditsUsed?: number;
  success?: boolean;
}

export default function AdminAIAnalyticsPage() {
  const { data: rawLogs, loading } = useCollection<AIUsageLog>('aiUsageLogs', [
    orderBy('createdAt', 'desc'),
    limit(200)
  ]);

  const totalRequests = rawLogs.length;
  const successfulRequests = rawLogs.filter(l => l.success).length;
  const failedRequests = rawLogs.filter(l => !l.success).length;
  const totalCreditsConsumed = rawLogs.reduce((sum, l) => sum + (l.creditsUsed || 0), 0);

  // Estimate cost ($0.0005 per request on average with Groq Llama 3.3 70B)
  const estimatedCostUSD = (totalRequests * 0.0005).toFixed(4);
  const successRate = totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 100;

  // Group by feature
  const featureCounts: Record<string, number> = {};
  rawLogs.forEach(l => {
    const feat = l.feature || 'unknown';
    featureCounts[feat] = (featureCounts[feat] || 0) + 1;
  });

  const columns = useMemo<Column<AIUsageLog>[]>(() => [
    {
      key: 'feature',
      header: 'Feature',
      card: 'title',
      sortValue: l => l.feature ?? '',
      render: l => <span className="font-semibold capitalize">{(l.feature || '').replace(/_/g, ' ') || '—'}</span>,
    },
    { key: 'role', header: 'Role', sortValue: l => l.role ?? '', render: l => l.role || 'SEEKER' },
    {
      key: 'creditsUsed',
      header: 'Credits',
      align: 'right',
      sortValue: l => l.creditsUsed ?? 1,
      render: l => <span className="font-semibold tabular-nums text-emerald-700">-{l.creditsUsed || 1}</span>,
    },
    {
      key: 'success',
      header: 'Status',
      align: 'center',
      sortValue: l => (l.success ? 1 : 0),
      render: l => (
        <Pill tone={l.success ? 'success' : 'danger'} dot>
          {l.success ? 'Success' : 'Failed'}
        </Pill>
      ),
    },
  ], []);

  return (
    <PageShell>
      <PageHeader
        title="AI system analytics"
        description="Server-side tracking of Groq API requests, credit deductions, error rates and estimated cost."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'AI analytics' }]}
        actions={
          <Pill tone="info">
            <Cpu size={12} /> llama-3.3-70b-versatile
          </Pill>
        }
      />

      <StatGrid columns={4}>
        <Stat
          label="Total AI requests"
          value={totalRequests.toLocaleString()}
          icon={Activity}
          tone="blue"
          loading={loading}
          hint={`${successfulRequests} successful (${successRate}%)`}
        />
        <Stat
          label="Credits consumed"
          value={totalCreditsConsumed.toLocaleString()}
          icon={Zap}
          tone="emerald"
          loading={loading}
          hint="Deducted on success only"
        />
        <Stat
          label="Failed requests"
          value={failedRequests}
          icon={AlertCircle}
          tone="rose"
          loading={loading}
          hint="No credits charged on failure"
        />
        <Stat
          label="Est. usage cost"
          value={`$${estimatedCostUSD}`}
          icon={DollarSign}
          tone="violet"
          loading={loading}
          hint="At $0.0005 per request"
        />
      </StatGrid>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Feature breakdown */}
        <Card className="lg:col-span-5">
          <CardHeader title="Usage by AI feature" description="Share of the last 200 logged requests" />
          <CardBody>
            {Object.keys(featureCounts).length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No logged requests yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(featureCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([feat, count]) => {
                    const percent = Math.round((count / Math.max(1, totalRequests)) * 100);
                    return (
                      <div key={feat} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                          <span className="truncate capitalize">{feat.replace(/_/g, ' ')}</span>
                          <span className="shrink-0 tabular-nums text-slate-500">
                            {count} · {percent}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-[#2563EB]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Live logs */}
        <Card className="lg:col-span-7">
          <CardHeader
            title="Recent execution logs"
            description="Most recent server-side AI calls"
            action={<BarChart3 size={16} className="text-slate-400" aria-hidden />}
          />
          <CardBody className="p-0">
            <DataTable
              label="Recent AI execution logs"
              className="rounded-none border-0"
              columns={columns}
              rows={rawLogs.slice(0, 8)}
              getRowId={l => l.id}
              loading={loading}
              skeletonRows={5}
              dense
              emptyIcon={Activity}
              emptyTitle="No logs found"
              emptyDescription="AI requests will appear here as soon as the gateway serves one."
            />
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
