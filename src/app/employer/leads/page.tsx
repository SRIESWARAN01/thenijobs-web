'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { updateLeadStatus } from '@/lib/firebase/firestoreService';
import { where, orderBy } from 'firebase/firestore';
import { Loader2, Mail, MessageSquare, Phone, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { formatDate, toDate, type FirestoreTime } from '@/lib/firestoreTime';
import {
  ActionMenu, Button, DataTable, EmptyState, FilterSelect, PageHeader, PageShell, Pill,
  Toolbar, ViewToggle, useViewMode,
  type ActionItem, type Column, type PillTone,
} from '@/components/dashboard';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

interface CompanyDoc { id: string; name?: string }

interface LeadDoc {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  service?: string;
  message?: string;
  status: LeadStatus;
  createdAt: FirestoreTime;
  notes?: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; tone: PillTone }> = {
  new:       { label: 'New', tone: 'info' },
  contacted: { label: 'Contacted', tone: 'warning' },
  qualified: { label: 'Qualified', tone: 'violet' },
  converted: { label: 'Converted', tone: 'success' },
  lost:      { label: 'Lost', tone: 'danger' },
};

const STAGES: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export default function EmployerLeadsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [view, setView] = useViewMode('employer-leads', 'table');
  const toast = useToast();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<CompanyDoc>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch leads
  const { data: leads, loading: leadsLoading } = useCollection<LeadDoc>('leads', [
    where('companyId', '==', companyId || ''),
    orderBy('createdAt', 'desc')
  ], { skip: !companyId });

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    setActionLoading(leadId);
    try {
      await updateLeadStatus(leadId, status);
      toast.success(`Lead status updated to ${status}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lead status');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = leads.filter((lead) => {
    const matchesSearch = lead.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (lead.service || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.message || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'LD';
  };

  const getWhatsAppNumber = (phone?: string) => {
    const digits = phone?.replace(/\D/g, '') || '';
    return digits.length === 10 ? `91${digits}` : digits;
  };

  const loading = companyLoading || leadsLoading;

  const columns: Column<LeadDoc>[] = [
    {
      key: 'customerName',
      header: 'Customer',
      card: 'title',
      sortValue: l => l.customerName ?? '',
      render: l => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#EFF6FF] text-xs font-bold text-[#1E40AF]">
            {getInitials(l.customerName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-900">{l.customerName}</span>
            {l.service && <span className="block truncate text-xs text-slate-500">Wants: {l.service}</span>}
          </span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      sortValue: l => l.customerPhone || l.customerEmail || '',
      render: l => (
        <span className="block min-w-0">
          {l.customerPhone && (
            <span className="flex items-center gap-1 font-mono text-xs text-slate-700">
              <Phone size={11} className="text-slate-400" aria-hidden /> {l.customerPhone}
            </span>
          )}
          {l.customerEmail && (
            <span className="flex items-center gap-1 truncate text-xs text-slate-500">
              <Mail size={11} className="text-slate-400" aria-hidden /> {l.customerEmail}
            </span>
          )}
          {!l.customerPhone && !l.customerEmail && <span className="text-slate-300">&mdash;</span>}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Enquiry',
      hideBelow: 'xl',
      className: 'whitespace-normal',
      sortValue: l => l.message ?? '',
      render: l => l.message
        ? <span className="line-clamp-2 block max-w-xs text-xs text-slate-600">{l.message}</span>
        : <span className="text-slate-300">&mdash;</span>,
    },
    {
      key: 'createdAt',
      header: 'Received',
      hideBelow: 'lg',
      sortValue: l => toDate(l.createdAt)?.getTime() ?? 0,
      render: l => <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(l.createdAt)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: l => l.status ?? 'new',
      render: l => {
        const cfg = STATUS_CONFIG[l.status] || STATUS_CONFIG.new;
        return <Pill tone={cfg.tone} dot>{cfg.label}</Pill>;
      },
    },
  ];

  if (!companyId && !companyLoading) {
    return (
      <PageShell>
        <EmptyState
          icon={TrendingUp}
          title="No company profile yet"
          description="Register your company profile to view and manage customer leads."
          action={
            <Link href="/employer/company-profile">
              <Button variant="primary">Set up company profile</Button>
            </Link>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Lead inbox"
        description="Company page-ல் வரும் Send Inquiry, Request Quote மற்றும் WhatsApp leads அனைத்தையும் இங்கே manage செய்யலாம்."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Leads' }]}
      />

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by customer, service or message…"
        filters={
          <>
            <FilterSelect
              label="Lead status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All statuses', value: 'all' },
                ...STAGES.map(s => ({ label: STATUS_CONFIG[s].label, value: s })),
              ]}
            />
            <ViewToggle value={view} onChange={setView} />
          </>
        }
      />

      <DataTable
        label="Customer leads"
        loading={loading}
        view={view}
        gridColumns={2}
        columns={columns}
        rows={filtered}
        getRowId={l => l.id}
        emptyIcon={TrendingUp}
        emptyTitle="No leads yet"
        emptyDescription="இன்னும் quote / inquiry leads வரவில்லை. Enquiries from your company page will land here."
        rowActions={lead => {
          if (actionLoading === lead.id) {
            return <Loader2 size={16} className="animate-spin text-blue-600" aria-label="Saving" />;
          }
          const wa = getWhatsAppNumber(lead.customerPhone);
          const items: ActionItem[] = [];
          if (lead.customerPhone) items.push({ label: 'Call customer', icon: Phone, href: `tel:${lead.customerPhone}` });
          if (wa) {
            items.push({
              label: 'WhatsApp customer',
              icon: MessageSquare,
              external: true,
              href: `https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${lead.customerName}, we received your THENIJOBS enquiry.`)}`,
            });
          }
          if (lead.customerEmail) items.push({ label: 'Email customer', icon: Mail, href: `mailto:${lead.customerEmail}` });
          STAGES.filter(s => s !== lead.status).forEach((s, i) => {
            items.push({
              label: `Mark ${STATUS_CONFIG[s].label.toLowerCase()}`,
              icon: TrendingUp,
              tone: s === 'converted' ? 'success' : s === 'lost' ? 'danger' : 'default',
              separatorBefore: i === 0,
              onClick: () => handleStatusChange(lead.id, s),
            });
          });
          return <ActionMenu label={`Actions for ${lead.customerName}`} items={items} />;
        }}
      />
    </PageShell>
  );
}
