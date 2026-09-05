'use client';

import { useMemo, useState } from 'react';
import { Eye, Loader2, Megaphone, MousePointerClick, Pause, Play, Trash2, TrendingUp } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument, deleteDocument } from '@/lib/firebase/firestoreService';
import { useToast } from '@/contexts/ToastContext';
import type { FirestoreTime } from '@/lib/firestoreTime';
import {
  Button, DataTable, PageHeader, PageShell, Pill, Stat, StatGrid, Toolbar,
  type Column, type PillTone,
} from '@/components/dashboard';

interface AdDoc {
  id: string;
  title: string;
  type: 'Banner' | 'Sponsored' | 'Featured';
  placement: string;
  status: 'active' | 'paused' | 'ended' | 'draft';
  startDate?: FirestoreTime;
  endDate?: FirestoreTime;
  impressions?: number;
  clicks?: number;
}

const STATUS_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  active: { label: 'Active & live', tone: 'success' },
  paused: { label: 'Paused', tone: 'warning' },
  ended:  { label: 'Ended', tone: 'neutral' },
  draft:  { label: 'Draft', tone: 'info' },
};

const TYPE_TONE: Record<string, PillTone> = {
  Banner: 'info',
  Sponsored: 'violet',
  Featured: 'warning',
};

export default function AdsPage() {
  const toast = useToast();
  const { data: ads, loading } = useCollection<AdDoc>('advertisements');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = ads.filter(a => {
    const title = a.title || '';
    const placement = a.placement || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      placement.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'active' ? 'paused' : 'active';
    setActionLoading(id);
    try {
      await updateDocument('advertisements', id, { status: next });
      toast.success(next === 'active' ? 'Campaign activated' : 'Campaign paused');
    } catch (err) {
      console.error('Toggle ad status error:', err);
      toast.error('Failed to update campaign');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ad campaign?')) return;
    setActionLoading(id);
    try {
      await deleteDocument('advertisements', id);
      toast.info('Ad campaign deleted');
    } catch (err) {
      console.error('Delete ad campaign error:', err);
      toast.error('Failed to delete ad');
    } finally {
      setActionLoading(null);
    }
  };

  const activeCount = ads.filter(a => a.status === 'active').length;
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%' : '0.0%';

  const columns = useMemo<Column<AdDoc>[]>(() => [
    {
      key: 'title',
      header: 'Campaign',
      card: 'title',
      sortValue: a => a.title ?? '',
      render: a => <span className="font-semibold text-slate-900">{a.title || 'Untitled campaign'}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      align: 'center',
      sortValue: a => a.type ?? '',
      render: a => <Pill tone={TYPE_TONE[a.type] ?? 'info'}>{a.type || 'Banner'}</Pill>,
    },
    {
      key: 'placement',
      header: 'Placement',
      hideBelow: 'lg',
      sortValue: a => a.placement ?? '',
      render: a => a.placement || '—',
    },
    {
      key: 'impressions',
      header: 'Impressions',
      align: 'center',
      sortValue: a => a.impressions ?? 0,
      render: a => <span className="font-semibold tabular-nums">{(a.impressions || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'clicks',
      header: 'Clicks',
      align: 'center',
      sortValue: a => a.clicks ?? 0,
      render: a => <span className="font-semibold tabular-nums text-emerald-700">{(a.clicks || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: a => a.status ?? 'draft',
      render: a => {
        const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.draft;
        return <Pill tone={st.tone} dot>{st.label}</Pill>;
      },
    },
  ], []);

  return (
    <PageShell>
      <PageHeader
        title="Advertisement campaigns"
        description="Sponsored banners, promoted listings and click-tracking metrics."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Advertisements' }]}
      />

      <StatGrid columns={4}>
        <Stat label="Active campaigns" value={activeCount} icon={Megaphone} tone="blue" loading={loading} />
        <Stat label="Impressions" value={totalImpressions.toLocaleString('en-IN')} icon={Eye} tone="violet" loading={loading} />
        <Stat label="Clicks & leads" value={totalClicks.toLocaleString('en-IN')} icon={MousePointerClick} tone="emerald" loading={loading} />
        <Stat label="Average CTR" value={avgCtr} icon={TrendingUp} tone="amber" loading={loading} />
      </StatGrid>

      <Toolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search campaigns or placements…"
      />

      <DataTable
        label="Advertisement campaigns"
        columns={columns}
        rows={filtered}
        getRowId={a => a.id}
        loading={loading}
        emptyIcon={Megaphone}
        emptyTitle={searchQuery ? 'No campaigns match that search' : 'No campaigns yet'}
        emptyDescription={
          searchQuery
            ? 'Try a different campaign name or placement.'
            : 'Sponsored banners and promoted listings will appear here once created.'
        }
        rowActions={ad => {
          if (actionLoading === ad.id) {
            return <Loader2 size={15} className="animate-spin text-blue-600" aria-label="Saving" />;
          }
          return (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleToggleStatus(ad.id, ad.status)}
                title={ad.status === 'active' ? 'Pause campaign' : 'Activate campaign'}
              >
                {ad.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                {ad.status === 'active' ? 'Pause' : 'Activate'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(ad.id)}
                className="text-rose-600 hover:bg-rose-50"
                aria-label={`Delete ${ad.title ?? 'campaign'}`}
                title="Delete"
              >
                <Trash2 size={14} />
              </Button>
            </>
          );
        }}
      />
    </PageShell>
  );
}
