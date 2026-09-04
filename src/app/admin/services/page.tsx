'use client';

import { useMemo, useState } from 'react';
import { Star, CheckCircle, XCircle, Eye, Loader2, Layers, BadgeCheck, Clock, Users } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { updateDocument } from '@/lib/firebase/firestoreService';
import {
  Button,
  DataTable,
  PageHeader,
  PageShell,
  Pill,
  Stat,
  StatGrid,
  Toolbar,
  type Column,
  type PillTone,
} from '@/components/dashboard';

// ===== TYPES =====
interface ServiceDoc {
  id: string;
  name: string;
  providerName?: string;
  provider?: string; // fallback
  providerId?: string;
  category?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  price?: string; // fallback
  status?: 'active' | 'pending' | 'paused' | 'rejected';
  rating?: number;
  reviewsCount?: number;
}

const STATUS_TONE: Record<string, PillTone> = {
  active: 'success',
  pending: 'warning',
  paused: 'neutral',
  rejected: 'danger',
};

const TABS = [
  { label: 'All services', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Pending', value: 'pending' },
];

function priceOf(s: ServiceDoc): string {
  if (s.priceMin && s.priceMax) {
    return `₹${s.priceMin.toLocaleString('en-IN')} – ₹${s.priceMax.toLocaleString('en-IN')}`;
  }
  return s.price || 'Price N/A';
}

export default function ServicesPage() {
  const { data: services, loading } = useCollection<ServiceDoc>('services');
  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = services.filter(s => {
    const serviceStatus = s.status || 'pending';
    const matchTab = tab === 'all' ? true : serviceStatus === tab;

    const name = s.name || '';
    const provider = s.providerName || s.provider || 'Unknown';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.toLowerCase().includes(searchQuery.toLowerCase());

    return matchTab && matchSearch;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('services', id, { status: 'active' });
    } catch (err) {
      console.error('Approve service error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await updateDocument('services', id, { status: 'rejected' });
    } catch (err) {
      console.error('Reject service error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic statistics
  const totalCount = services.length;
  const activeCount = services.filter(s => s.status === 'active').length;
  const pendingCount = services.filter(s => (s.status || 'pending') === 'pending').length;
  const providersCount = new Set(services.map(s => s.providerId).filter(Boolean)).size;

  const columns = useMemo<Column<ServiceDoc>[]>(() => [
    {
      key: 'name',
      header: 'Service',
      card: 'title',
      sortValue: s => s.name ?? '',
      render: s => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{s.name}</p>
          <p className="truncate text-xs text-slate-500">{s.category || 'General'}</p>
        </div>
      ),
    },
    {
      key: 'provider',
      header: 'Provider',
      hideBelow: 'lg',
      sortValue: s => s.providerName || s.provider || '',
      render: s => s.providerName || s.provider || 'Unknown',
    },
    {
      key: 'district',
      header: 'District',
      hideBelow: 'xl',
      sortValue: s => s.district ?? '',
      render: s => s.district || 'Theni',
    },
    {
      key: 'price',
      header: 'Price',
      sortValue: s => s.priceMin ?? Number.MAX_SAFE_INTEGER,
      render: s => <span className="whitespace-nowrap tabular-nums">{priceOf(s)}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      align: 'center',
      sortValue: s => s.rating ?? -1,
      render: s =>
        s.rating && s.rating > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
            <Star size={12} className="fill-amber-500 text-amber-500" />
            {s.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-slate-400">N/A</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: s => s.status ?? 'pending',
      render: s => {
        const st = s.status || 'pending';
        return <Pill tone={STATUS_TONE[st] ?? 'neutral'} dot>{st}</Pill>;
      },
    },
  ], []);

  return (
    <PageShell>
      <PageHeader
        title="Service marketplace"
        description="Approve, reject and monitor every service listing across the district."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Services' }]}
      />

      <StatGrid columns={4}>
        <Stat label="Total services" value={totalCount} icon={Layers} tone="violet" loading={loading} />
        <Stat label="Active" value={activeCount} icon={BadgeCheck} tone="emerald" loading={loading} />
        <Stat label="Pending" value={pendingCount} icon={Clock} tone="amber" loading={loading} />
        <Stat label="Providers" value={providersCount} icon={Users} tone="blue" loading={loading} />
      </StatGrid>

      <Toolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by service or provider…"
        filters={TABS.map(t => (
          <Button
            key={t.value}
            size="sm"
            variant={tab === t.value ? 'primary' : 'secondary'}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      />

      <DataTable
        label="Service listings"
        columns={columns}
        rows={filtered}
        getRowId={s => s.id}
        loading={loading}
        emptyIcon={Layers}
        emptyTitle={searchQuery ? 'No services match that search' : 'No services yet'}
        emptyDescription={
          searchQuery
            ? 'Try a different service or provider name, or clear the filter.'
            : 'Service listings submitted by providers will appear here for approval.'
        }
        rowActions={s => {
          const st = s.status || 'pending';
          if (actionLoading === s.id) {
            return <Loader2 size={15} className="animate-spin text-blue-600" aria-label="Saving" />;
          }
          return (
            <>
              {st === 'pending' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleApprove(s.id)}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    <CheckCircle size={14} /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReject(s.id)}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <XCircle size={14} /> Reject
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" aria-label={`View ${s.name}`}>
                <Eye size={14} /> View
              </Button>
            </>
          );
        }}
      />
    </PageShell>
  );
}
