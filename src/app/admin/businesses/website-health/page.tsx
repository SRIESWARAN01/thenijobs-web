'use client';

import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { PageShell, PageHeader, DataTable, Pill, type Column, type PillTone } from '@/components/dashboard';
import { formatDate } from '@/lib/firestoreTime';
import type { PortfolioSite } from '@/lib/types/portfolio';

interface CompanyDoc {
  id: string;
  name: string;
  district?: string;
}

interface HealthRow {
  id: string;
  companyName: string;
  district: string;
  hasSite: boolean;
  logoSet: boolean;
  faviconSet: boolean;
  status: PortfolioSite['status'] | null;
  seoComplete: boolean;
  updatedAt: unknown;
  publishedAt: unknown;
}

function StatusPill({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  const tone: PillTone = ok ? 'success' : 'neutral';
  return (
    <Pill tone={tone} dot>
      {ok ? yes : no}
    </Pill>
  );
}

export default function AdminWebsiteHealthPage() {
  const router = useRouter();
  const { data: companies, loading: companiesLoading } = useCollection<CompanyDoc>('companies');
  const { data: sites, loading: sitesLoading } = useCollection<PortfolioSite>('portfolioSites');

  const loading = companiesLoading || sitesLoading;

  const sitesByCompanyId = new Map<string, PortfolioSite>();
  for (const site of sites) {
    if (site.companyId) sitesByCompanyId.set(site.companyId, site);
  }

  const rows: HealthRow[] = companies.map(c => {
    const site = sitesByCompanyId.get(c.id);
    return {
      id: c.id,
      companyName: c.name || 'Unnamed company',
      district: c.district || '—',
      hasSite: !!site,
      logoSet: !!site?.branding?.logo,
      faviconSet: !!site?.branding?.favicon,
      status: site?.status ?? null,
      seoComplete: !!(site?.seo?.title && site?.seo?.description),
      updatedAt: site?.updatedAt ?? null,
      publishedAt: site?.publishedAt ?? null,
    };
  });

  const columns: Column<HealthRow>[] = [
    {
      key: 'companyName',
      header: 'Company',
      card: 'title',
      render: row => (
        <div>
          <p className="font-semibold text-slate-900">{row.companyName}</p>
          <p className="text-[11px] text-slate-500">{row.district}</p>
        </div>
      ),
      sortValue: row => row.companyName,
    },
    {
      key: 'hasSite',
      header: 'Website',
      render: row => <StatusPill ok={row.hasSite} yes="Created" no="Not created" />,
      sortValue: row => (row.hasSite ? 1 : 0),
    },
    {
      key: 'status',
      header: 'Published',
      render: row => {
        if (!row.hasSite) return <Pill tone="neutral">—</Pill>;
        if (row.status === 'published') return <Pill tone="success" dot>Published</Pill>;
        if (row.status === 'pending_review') return <Pill tone="info" dot>Pending Review</Pill>;
        if (row.status === 'unpublished') return <Pill tone="warning" dot>Unpublished</Pill>;
        return <Pill tone="neutral" dot>Draft</Pill>;
      },
      sortValue: row => row.status || '',
    },
    {
      key: 'logoSet',
      header: 'Logo',
      render: row => <StatusPill ok={row.logoSet} yes="Set" no="Missing" />,
      sortValue: row => (row.logoSet ? 1 : 0),
      hideBelow: 'md',
    },
    {
      key: 'faviconSet',
      header: 'Favicon',
      render: row => <StatusPill ok={row.faviconSet} yes="Set" no="Missing" />,
      sortValue: row => (row.faviconSet ? 1 : 0),
      hideBelow: 'md',
    },
    {
      key: 'seoComplete',
      header: 'SEO',
      render: row => <StatusPill ok={row.seoComplete} yes="Complete" no="Incomplete" />,
      sortValue: row => (row.seoComplete ? 1 : 0),
      hideBelow: 'lg',
    },
    {
      key: 'updatedAt',
      header: 'Last updated',
      render: row => <span className="text-xs text-slate-600">{row.hasSite ? formatDate(row.updatedAt as never, '—') : '—'}</span>,
      hideBelow: 'lg',
    },
    {
      key: 'publishedAt',
      header: 'Last published',
      render: row => <span className="text-xs text-slate-600">{row.publishedAt ? formatDate(row.publishedAt as never, '—') : '—'}</span>,
      hideBelow: 'xl',
    },
  ];

  return (
    <PageShell className="max-w-6xl">
      <PageHeader
        title="Company website health"
        description="Website, logo, favicon, SEO and publish status for every company, computed from the same data the admin website manager edits."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Businesses', href: '/admin/businesses' }, { label: 'Website health' }]}
      />
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Broken-image detection is not shown here: checking every logo/favicon/cover URL for every
        company would mean fetching them all on every page load. Open a company&apos;s website
        manager to see its images render (or fail to) directly.
      </div>
      <DataTable<HealthRow>
        columns={columns}
        rows={rows}
        getRowId={row => row.id}
        loading={loading}
        onRowClick={row => router.push(`/admin/businesses/${row.id}/website`)}
        emptyTitle="No companies yet"
        emptyIcon={Globe}
        label="Company website health"
      />
    </PageShell>
  );
}
