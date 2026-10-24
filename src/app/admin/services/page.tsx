'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Star, CheckCircle, XCircle, Eye, Loader2, Layers, BadgeCheck, Clock,
  Users, ShoppingBag, Package, Wrench, ExternalLink, MapPin
} from 'lucide-react';
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
  provider?: string;
  providerId?: string;
  category?: string;
  district?: string;
  priceMin?: number;
  priceMax?: number;
  price?: string;
  status?: 'active' | 'pending' | 'paused' | 'rejected';
  rating?: number;
  reviewsCount?: number;
}

interface MarketplaceItemRow {
  id: string;
  name: string;
  type: 'product' | 'service';
  providerName: string;
  companySlug: string;
  companyId: string;
  district: string;
  category: string;
  priceDisplay: string;
  status: 'active' | 'pending' | 'paused' | 'rejected';
  rating?: number;
  isCompanyEmbedded: boolean;
}

const STATUS_TONE: Record<string, PillTone> = {
  active: 'success',
  pending: 'warning',
  paused: 'neutral',
  rejected: 'danger',
};

const VIEW_TABS = [
  { label: 'All Listings', value: 'all' },
  { label: 'Products', value: 'product' },
  { label: 'Services', value: 'service' },
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
  const { data: services, loading: servicesLoading } = useCollection<ServiceDoc>('services');
  const { data: companies, loading: companiesLoading } = useCollection<any>('companies');

  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Combine standalone services and company-embedded marketplace items
  const combinedItems: MarketplaceItemRow[] = useMemo(() => {
    const rows: MarketplaceItemRow[] = [];

    // 1. Standalone services
    services.forEach(s => {
      rows.push({
        id: s.id,
        name: s.name || 'Unnamed Service',
        type: 'service',
        providerName: s.providerName || s.provider || 'Independent Provider',
        companySlug: '',
        companyId: s.providerId || '',
        district: s.district || 'Theni',
        category: s.category || 'General Service',
        priceDisplay: priceOf(s),
        status: s.status || 'pending',
        rating: s.rating,
        isCompanyEmbedded: false,
      });
    });

    // 2. Company-embedded products & services
    companies.forEach(c => {
      const companyName = c.name || 'Unnamed Business';
      const companySlug = c.slug || c.id;
      const district = c.district || 'Theni';
      const companyStatus = c.verificationStatus === 'verified' || c.isVerified ? 'active' : 'pending';

      // Products
      if (Array.isArray(c.products)) {
        c.products.forEach((p: any, idx: number) => {
          if (!p) return;
          const pName = typeof p === 'string' ? p : p.name;
          if (!pName) return;
          const pId = (typeof p === 'object' && p.id) ? p.id : `prod-${idx}`;
          const pPrice = typeof p === 'object' && p.price ? `₹${Number(p.price).toLocaleString('en-IN')}${p.unit ? ` / ${p.unit}` : ''}` : 'Price on request';

          rows.push({
            id: `${c.id}_p_${pId}`,
            name: pName,
            type: 'product',
            providerName: companyName,
            companySlug,
            companyId: c.id,
            district,
            category: (typeof p === 'object' && p.category) || 'General Goods',
            priceDisplay: pPrice,
            status: companyStatus,
            isCompanyEmbedded: true,
          });
        });
      }

      // Services
      if (Array.isArray(c.services)) {
        c.services.forEach((s: any, idx: number) => {
          if (!s) return;
          const sName = typeof s === 'string' ? s : s.name;
          if (!sName) return;
          const sId = (typeof s === 'object' && s.id) ? s.id : `srv-${idx}`;
          const sPrice = typeof s === 'object' && (s.startingPrice || s.price)
            ? `Starts ₹${Number(s.startingPrice || s.price).toLocaleString('en-IN')}`
            : (typeof s === 'object' && s.pricingType ? s.pricingType : 'Rate on inquiry');

          rows.push({
            id: `${c.id}_s_${sId}`,
            name: sName,
            type: 'service',
            providerName: companyName,
            companySlug,
            companyId: c.id,
            district,
            category: (typeof s === 'object' && s.category) || 'Local Service',
            priceDisplay: sPrice,
            status: companyStatus,
            isCompanyEmbedded: true,
          });
        });
      }
    });

    return rows;
  }, [services, companies]);

  const loading = servicesLoading || companiesLoading;

  const filtered = useMemo(() => {
    return combinedItems.filter(item => {
      let matchTab = true;
      if (tab === 'product' || tab === 'service') {
        matchTab = item.type === tab;
      } else if (tab === 'active' || tab === 'pending') {
        matchTab = item.status === tab;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.providerName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q);

      return matchTab && matchSearch;
    });
  }, [combinedItems, tab, searchQuery]);

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

  // Real Dynamic statistics
  const totalListings = combinedItems.length;
  const productCount = combinedItems.filter(i => i.type === 'product').length;
  const serviceCount = combinedItems.filter(i => i.type === 'service').length;
  const activeCount = combinedItems.filter(i => i.status === 'active').length;
  const verifiedBusinessesCount = companies.filter(c => c.verificationStatus === 'verified' || c.isVerified).length;

  const columns = useMemo<Column<MarketplaceItemRow>[]>(() => [
    {
      key: 'name',
      header: 'Listing Name',
      card: 'title',
      sortValue: s => s.name ?? '',
      render: s => (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {s.type === 'product' ? (
              <span className="p-1 rounded-md bg-emerald-50 text-emerald-600"><Package size={13} /></span>
            ) : (
              <span className="p-1 rounded-md bg-blue-50 text-blue-600"><Wrench size={13} /></span>
            )}
            <p className="truncate font-semibold text-slate-900">{s.name}</p>
          </div>
          <p className="truncate text-xs text-slate-500 pl-6">{s.category}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      align: 'center',
      hideBelow: 'sm',
      sortValue: s => s.type,
      render: s => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
          s.type === 'product' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {s.type}
        </span>
      ),
    },
    {
      key: 'provider',
      header: 'Merchant / Provider',
      hideBelow: 'lg',
      sortValue: s => s.providerName,
      render: s => (
        <div className="truncate text-xs">
          <p className="font-medium text-slate-900">{s.providerName}</p>
          <p className="text-[11px] text-slate-400">{s.district}</p>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Pricing',
      sortValue: s => s.priceDisplay,
      render: s => <span className="whitespace-nowrap font-medium text-slate-900 text-xs tabular-nums">{s.priceDisplay}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: s => s.status,
      render: s => {
        const st = s.status || 'pending';
        return <Pill tone={STATUS_TONE[st] ?? 'neutral'} dot>{st}</Pill>;
      },
    },
  ], []);

  return (
    <PageShell>
      <PageHeader
        title="Marketplace & Services Moderation"
        description="Inspect, moderate and monitor product and service listings across Theni district businesses."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Marketplace & Services' }]}
      />

      <StatGrid columns={4}>
        <Stat label="Total Listings" value={totalListings} icon={ShoppingBag} tone="violet" loading={loading} />
        <Stat label="Products" value={productCount} icon={Package} tone="emerald" loading={loading} />
        <Stat label="Services" value={serviceCount} icon={Wrench} tone="blue" loading={loading} />
        <Stat label="Verified Merchants" value={verifiedBusinessesCount} icon={BadgeCheck} tone="amber" loading={loading} />
      </StatGrid>

      <Toolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by title, merchant, category or location…"
        filters={VIEW_TABS.map(t => (
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
        label="Marketplace listings"
        columns={columns}
        rows={filtered}
        getRowId={s => s.id}
        loading={loading}
        emptyIcon={Layers}
        emptyTitle={searchQuery ? 'No listings match that search' : 'No listings found'}
        emptyDescription={
          searchQuery
            ? 'Try a different keyword or location, or reset the tab filter.'
            : 'Product and service listings submitted by merchants will appear here.'
        }
        rowActions={s => {
          const st = s.status || 'pending';
          if (actionLoading === s.id) {
            return <Loader2 size={15} className="animate-spin text-blue-600" aria-label="Saving" />;
          }

          // Build preview URL
          let previewUrl = '/marketplace';
          if (s.isCompanyEmbedded && s.companySlug) {
            const rawItemId = s.id.split('_').slice(2).join('_');
            previewUrl = `/marketplace/${s.type}/${s.companySlug}/${rawItemId}`;
          }

          return (
            <div className="flex items-center gap-1.5">
              {!s.isCompanyEmbedded && st === 'pending' && (
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
              <Link
                href={previewUrl}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                title="View live listing"
              >
                <Eye size={13} /> View Live
              </Link>
            </div>
          );
        }}
      />
    </PageShell>
  );
}

