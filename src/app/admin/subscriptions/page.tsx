'use client';

import { useMemo, useState } from 'react';
import { Clock, CreditCard, Download, TrendingUp, Users2 } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { orderBy, limit } from 'firebase/firestore';
import type { FirestoreTime } from '@/lib/firestoreTime';
import {
  Button, DataTable, FilterSelect, PageHeader, PageShell, Pill, Stat, StatGrid, Toolbar,
  type Column, type PillTone,
} from '@/components/dashboard';

interface SubscriptionDoc {
  id: string;
  businessName?: string;
  companyName?: string;
  plan: PlanType;
  amount: number;
  status: 'active' | 'expired' | 'cancelled';
  startDate?: FirestoreTime;
  endDate?: FirestoreTime;
  autoRenew?: boolean;
  paymentMethod?: string;
}

interface PaymentDoc {
  id: string;
  businessName?: string;
  companyName?: string;
  amount: number;
  plan?: string;
  paymentMethod?: string;
  status: string;
  createdAt?: FirestoreTime;
}

type PlanType = 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';

const PLAN_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  free:       { label: 'Free', tone: 'neutral' },
  basic:      { label: 'Basic', tone: 'info' },
  standard:   { label: 'Standard', tone: 'info' },
  premium:    { label: 'Premium', tone: 'violet' },
  enterprise: { label: 'Enterprise', tone: 'warning' },
};

const STATUS_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  active:    { label: 'Active', tone: 'success' },
  expired:   { label: 'Expired', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export default function SubscriptionsPage() {
  const { data: subscriptions, loading: subsLoading } = useCollection<SubscriptionDoc>('subscriptions');
  const { data: payments, loading: paymentsLoading } = useCollection<PaymentDoc>('payments', [
    orderBy('createdAt', 'desc'),
    limit(15)
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSubs = subscriptions.filter((sub) => {
    const name = sub.businessName || sub.companyName || 'Company';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const subPlan = sub.plan || 'free';
    const matchPlan = planFilter === 'all' || subPlan === planFilter;
    const subStatus = sub.status || 'active';
    const matchStatus = statusFilter === 'all' || subStatus === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const activeSubs = subscriptions.filter((s) => (s.status || 'active') === 'active');
  const activeCount = activeSubs.length;
  const expiredCount = subscriptions.filter((s) => s.status === 'expired' || s.status === 'cancelled').length;
  const monthlyRevenue = activeSubs.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const handleDownloadGSTInvoice = async (item: SubscriptionDoc) => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const invNum = `INV-TNJ-${String(item.id || Date.now()).slice(-6).toUpperCase()}`;
      const amount = Number(item.amount) || 999;
      const baseAmount = Math.round(amount / 1.18);
      const gstAmount = amount - baseAmount;
      const cgst = Math.round(gstAmount / 2);
      const sgst = gstAmount - cgst;
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42);
      pdf.text('TAX INVOICE', 105, 25, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105);
      pdf.text('THENIJOBS DIGITAL PRIVATE LIMITED', 20, 38);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Reg Office: NRT Road, Theni District, Tamil Nadu - 625531', 20, 44);
      pdf.text('GSTIN: 33AAAAA0000A1Z5 | Support: support@thenijobs.com', 20, 49);

      // Invoice Meta
      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 55, 190, 55);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Invoice No: ${invNum}`, 20, 64);
      pdf.text(`Invoice Date: ${dateStr}`, 140, 64);

      pdf.text('Billed To (Customer):', 20, 75);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Company: ${item.businessName || item.companyName || 'Registered Employer'}`, 20, 81);
      pdf.text('State: Tamil Nadu (Code: 33)', 20, 86);

      // Table Header
      pdf.setFillColor(241, 245, 249);
      pdf.rect(20, 95, 170, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Description / Service Plan', 24, 100);
      pdf.text('HSN / SAC', 110, 100);
      pdf.text('Amount (INR)', 160, 100);

      // Table Item
      pdf.setFont('helvetica', 'normal');
      pdf.text(`THENIJOBS — ${(item.plan || 'Standard').toUpperCase()} Annual Subscription`, 24, 110);
      pdf.text('998314', 110, 110);
      pdf.text(`₹${baseAmount.toLocaleString('en-IN')}`, 160, 110);

      pdf.line(20, 116, 190, 116);

      // Totals Breakdown
      pdf.text('Taxable Base Amount:', 110, 125);
      pdf.text(`₹${baseAmount.toLocaleString('en-IN')}`, 165, 125);

      pdf.text('CGST (9%):', 110, 131);
      pdf.text(`₹${cgst.toLocaleString('en-IN')}`, 165, 131);

      pdf.text('SGST (9%):', 110, 137);
      pdf.text(`₹${sgst.toLocaleString('en-IN')}`, 165, 137);

      pdf.line(110, 142, 190, 142);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Total Paid Amount:', 110, 150);
      pdf.text(`₹${amount.toLocaleString('en-IN')}`, 165, 150);

      // Footer
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('This is a computer-generated tax invoice and requires no physical signature.', 105, 270, { align: 'center' });

      pdf.save(`${invNum}-invoice.pdf`);
    } catch (e) {
      console.error('Invoice error:', e);
    }
  };

  const columns = useMemo<Column<SubscriptionDoc>[]>(() => [
    {
      key: 'business',
      header: 'Business',
      card: 'title',
      sortValue: sub => sub.businessName || sub.companyName || '',
      render: sub => {
        const name = sub.businessName || sub.companyName || 'Company';
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-[#EFF6FF] text-xs font-bold text-[#1E40AF]">
              {name[0]?.toUpperCase() || 'C'}
            </span>
            <span className="truncate font-semibold text-slate-900">{name}</span>
          </div>
        );
      },
    },
    {
      key: 'plan',
      header: 'Tier',
      sortValue: sub => sub.plan ?? 'free',
      render: sub => {
        const cfg = PLAN_CONFIG[sub.plan || 'free'] || PLAN_CONFIG.free;
        return <Pill tone={cfg.tone}>{cfg.label}</Pill>;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: sub => Number(sub.amount) || 0,
      render: sub => (
        <span className="font-semibold tabular-nums text-emerald-700">
          ₹{(Number(sub.amount) || 0).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortValue: sub => sub.status ?? 'active',
      render: sub => {
        const cfg = STATUS_CONFIG[sub.status || 'active'] || STATUS_CONFIG.active;
        return <Pill tone={cfg.tone} dot>{cfg.label}</Pill>;
      },
    },
    {
      key: 'paymentMethod',
      header: 'Payment method',
      hideBelow: 'xl',
      sortValue: sub => sub.paymentMethod ?? '',
      render: sub => sub.paymentMethod || 'Razorpay / UPI',
    },
  ], []);

  return (
    <PageShell>
      <PageHeader
        title="Subscriptions & billing"
        description="Company subscriptions, recurring revenue and payment invoices."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Subscriptions' }]}
      />

      <StatGrid columns={4}>
        <Stat label="Active subscriptions" value={activeCount} icon={CreditCard} tone="blue" loading={subsLoading} />
        <Stat
          label="Active MRR / volume"
          value={`₹${monthlyRevenue.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          tone="emerald"
          loading={subsLoading}
        />
        <Stat label="Total subscriber base" value={subscriptions.length} icon={Users2} tone="violet" loading={subsLoading} />
        <Stat label="Expired / lapsed" value={expiredCount} icon={Clock} tone="rose" loading={subsLoading} />
      </StatGrid>

      <Toolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by company or business name…"
        filters={
          <>
            <FilterSelect
              label="Plan"
              value={planFilter}
              onChange={setPlanFilter}
              options={[
                { label: 'All plans', value: 'all' },
                { label: 'Free', value: 'free' },
                { label: 'Standard', value: 'standard' },
                { label: 'Premium', value: 'premium' },
                { label: 'Enterprise', value: 'enterprise' },
              ]}
            />
            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'All status', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Expired', value: 'expired' },
                { label: 'Cancelled', value: 'cancelled' },
              ]}
            />
          </>
        }
      />

      <DataTable
        label="Company subscriptions"
        columns={columns}
        rows={filteredSubs}
        getRowId={sub => sub.id}
        loading={subsLoading}
        emptyIcon={CreditCard}
        emptyTitle="No subscriptions match this filter"
        emptyDescription="Clear the plan or status filter to see the full subscriber base."
        rowActions={sub => (
          <Button
            size="sm"
            variant="subtle"
            onClick={() => handleDownloadGSTInvoice(sub)}
            title="Download GST tax invoice PDF"
          >
            <Download size={13} /> Tax invoice
          </Button>
        )}
      />
    </PageShell>
  );
}
