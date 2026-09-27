'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  Clock, CreditCard, Download, TrendingUp, Users2,
  AlertTriangle, MessageSquare, RefreshCcw, ShieldCheck,
  Calendar, BadgeCheck,
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { SITE_CONTACT } from '@/lib/constants';
import type { FirestoreTime } from '@/lib/firestoreTime';
import {
  Button, DataTable, FilterSelect, PageHeader, PageShell, Pill, Stat, StatGrid, Toolbar,
  type Column, type PillTone,
} from '@/components/dashboard';
import { extendCompanyTrial, manualActivateSubscription, generateWhatsAppReminderUrl } from '@/lib/subscriptionService';
import { computeSubscriptionState, toJsDate } from '@/lib/subscriptionService';
import { useToast } from '@/contexts/ToastContext';

type PlanType = 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';

interface SubscriptionDoc {
  id: string;
  businessName?: string;
  companyName?: string;
  plan: PlanType;
  amount: number;
  status: string;
  paymentStatus?: string;
  startDate?: FirestoreTime;
  endDate?: FirestoreTime;
  trialStartDate?: FirestoreTime;
  trialEndDate?: FirestoreTime;
  autoRenew?: boolean;
  paymentMethod?: string;
  companyId?: string;
  userId?: string;
}

interface CompanyDoc {
  id: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  slug?: string;
  ownerId?: string;
  subscriptionStatus?: string;
  accountStatus?: string;
  websiteStatus?: string;
  paymentStatus?: string;
  trialStartDate?: FirestoreTime;
  trialEndDate?: FirestoreTime;
  subscriptionPlan?: string;
  verificationStatus?: string;
  adminApprovedAt?: FirestoreTime;
}

const PLAN_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  free:       { label: 'Free', tone: 'neutral' },
  basic:      { label: 'Basic', tone: 'info' },
  standard:   { label: 'Standard', tone: 'info' },
  premium:    { label: 'Premium', tone: 'violet' },
  enterprise: { label: 'Enterprise', tone: 'warning' },
};

const STATUS_CONFIG: Record<string, { label: string; tone: PillTone }> = {
  active:               { label: 'Active (Paid)', tone: 'success' },
  trial:                { label: 'Trial', tone: 'info' },
  trial_active:         { label: 'Trial Active', tone: 'info' },
  trial_expired:        { label: 'Trial Expired', tone: 'danger' },
  pending_admin_approval: { label: 'Pending Approval', tone: 'warning' },
  suspended:            { label: 'Suspended', tone: 'danger' },
  expired:              { label: 'Expired', tone: 'neutral' },
  cancelled:            { label: 'Cancelled', tone: 'danger' },
};

export default function SubscriptionsPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { data: subscriptions, loading: subsLoading } = useCollection<SubscriptionDoc>('subscriptions');
  const { data: allCompanies, loading: companiesLoading } = useCollection<CompanyDoc>('companies');

  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activePanel, setActivePanel] = useState<'subscriptions' | 'alerts'>('subscriptions');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState(7);
  const [extendReason, setExtendReason] = useState('Admin grace period');
  const [manualPlan, setManualPlan] = useState<'standard' | 'premium' | 'enterprise'>('standard');

  // ── Companies with expired/expiring trials (alert queue) ────────────────────
  const alertCompanies = useMemo(() => {
    const now = new Date();
    return allCompanies.filter(c => {
      const state = computeSubscriptionState(c as any);
      // Trial expired without payment OR trial active but expiring in ≤3 days
      return (
        (state.isTrialExpired && !state.isPaidActive) ||
        (state.isTrialActive && !state.isPaidActive && state.trialDaysRemaining <= 3)
      );
    });
  }, [allCompanies]);

  // ── Subscription stats ───────────────────────────────────────────────────────
  const activePaidCount = useMemo(() =>
    allCompanies.filter(c => computeSubscriptionState(c as any).isPaidActive).length, [allCompanies]);
  const trialActiveCount = useMemo(() =>
    allCompanies.filter(c => { const s = computeSubscriptionState(c as any); return s.isTrialActive && !s.isPaidActive; }).length, [allCompanies]);
  const trialExpiredCount = useMemo(() =>
    allCompanies.filter(c => { const s = computeSubscriptionState(c as any); return s.isTrialExpired && !s.isPaidActive; }).length, [allCompanies]);
  const totalRevenue = useMemo(() =>
    subscriptions.filter(s => s.status === 'active' && s.paymentStatus === 'paid')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0), [subscriptions]);

  const filteredSubs = subscriptions.filter((sub) => {
    const name = sub.businessName || sub.companyName || 'Company';
    const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const subPlan = sub.plan || 'free';
    const matchPlan = planFilter === 'all' || subPlan === planFilter;
    const subStatus = sub.status || 'active';
    const matchStatus = statusFilter === 'all' || subStatus === statusFilter || sub.paymentStatus === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const handleDownloadReceipt = async (item: SubscriptionDoc) => {
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const receiptNum = `RCPT-TNJ-${String(item.id || Date.now()).slice(-6).toUpperCase()}`;
      const amount = Number(item.amount) || 1800;
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42);
      pdf.text('PAYMENT RECEIPT', 105, 25, { align: 'center' });

      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105);
      pdf.text('THENIJOBS', 20, 38);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text(SITE_CONTACT.fullAddress, 20, 44);
      pdf.text(`Support: ${SITE_CONTACT.supportEmail}`, 20, 49);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 55, 190, 55);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Receipt No: ${receiptNum}`, 20, 64);
      pdf.text(`Receipt Date: ${dateStr}`, 140, 64);

      pdf.text('Received From:', 20, 75);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Company: ${item.businessName || item.companyName || 'Registered Employer'}`, 20, 81);

      pdf.setFillColor(241, 245, 249);
      pdf.rect(20, 95, 170, 8, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Description / Service Plan', 24, 100);
      pdf.text('Amount (INR)', 160, 100);

      pdf.setFont('helvetica', 'normal');
      pdf.text(`THENIJOBS — ${(item.plan || 'Standard').toUpperCase()} Annual Subscription`, 24, 110);
      pdf.text(`₹${amount.toLocaleString('en-IN')}`, 160, 110);
      pdf.line(20, 116, 190, 116);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Total Amount Paid:', 110, 128);
      pdf.text(`₹${amount.toLocaleString('en-IN')}`, 165, 128);

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('This is a computer-generated payment receipt. Not a GST invoice.', 105, 270, { align: 'center' });
      pdf.save(`${receiptNum}-receipt.pdf`);
    } catch (e) {
      console.error('Receipt error:', e);
    }
  };

  const handleExtendTrial = useCallback(async (company: CompanyDoc) => {
    if (!company.id) return;
    setActionLoading(`extend_${company.id}`);
    try {
      await extendCompanyTrial(company.id, extendDays, currentUser?.uid || 'admin', extendReason);
      toast.success('Trial Extended! 🎉', `${company.name} trial extended by ${extendDays} days.`);
    } catch (err: any) {
      toast.error('Failed to extend trial', err.message);
    } finally {
      setActionLoading(null);
    }
  }, [currentUser, extendDays, extendReason, toast]);

  const handleManualActivate = useCallback(async (company: CompanyDoc) => {
    if (!company.id) return;
    setActionLoading(`activate_${company.id}`);
    try {
      await manualActivateSubscription(company.id, manualPlan, currentUser?.uid || 'admin', 'Admin manual activation');
      toast.success('Subscription Activated! 🌟', `${company.name} is now on a 1-year ${manualPlan} plan.`);
    } catch (err: any) {
      toast.error('Activation failed', err.message);
    } finally {
      setActionLoading(null);
    }
  }, [currentUser, manualPlan, toast]);

  const handleWhatsAppReminder = useCallback((company: CompanyDoc) => {
    const url = generateWhatsAppReminderUrl(company);
    window.open(url, '_blank');
  }, []);

  const handleRenewSubscription = useCallback(async (sub: SubscriptionDoc) => {
    const cId = sub.companyId || sub.userId || sub.id;
    if (!cId) { toast.error('Cannot renew', 'No company ID found on this subscription.'); return; }
    setActionLoading(`renew_${sub.id}`);
    try {
      await manualActivateSubscription(cId, (sub.plan as any) || 'standard', currentUser?.uid || 'admin', 'Admin renewal via subscriptions panel');
      toast.success('Subscription Renewed! 🌟', `${sub.businessName || sub.companyName || 'Company'} renewed for 1 year on ${sub.plan || 'standard'} plan.`);
    } catch (err: any) {
      toast.error('Renewal failed', err.message);
    } finally {
      setActionLoading(null);
    }
  }, [currentUser, toast]);

  const subColumns = useMemo<Column<SubscriptionDoc>[]>(() => [
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
      key: 'trialEnd',
      header: 'Trial End',
      hideBelow: 'lg',
      sortValue: sub => toJsDate(sub.trialEndDate)?.getTime() ?? 0,
      render: sub => {
        const d = toJsDate(sub.trialEndDate);
        return d ? <span className="text-xs text-slate-600">{d.toLocaleDateString('en-IN')}</span> : <span className="text-slate-400 text-xs">—</span>;
      },
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      hideBelow: 'xl',
      sortValue: sub => sub.paymentMethod ?? '',
      render: sub => <span className="text-xs">{sub.paymentMethod || 'Razorpay / UPI'}</span>,
    },
  ], []);

  return (
    <PageShell>
      <PageHeader
        title="Subscriptions & Billing"
        description="Company subscriptions, trial expirations, payment status, and revenue tracking."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Subscriptions' }]}
      />

      <StatGrid columns={4}>
        <Stat label="Paid Active" value={activePaidCount} icon={BadgeCheck} tone="emerald" loading={companiesLoading} />
        <Stat label="Trial Active" value={trialActiveCount} icon={Clock} tone="blue" loading={companiesLoading} />
        <Stat label="Trial Expired (Unpaid)" value={trialExpiredCount} icon={AlertTriangle} tone="rose" loading={companiesLoading} />
        <Stat label="Total Revenue Collected" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={TrendingUp} tone="violet" loading={subsLoading} />
      </StatGrid>

      {/* Panel Tabs */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setActivePanel('subscriptions')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activePanel === 'subscriptions' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
        >
          <CreditCard size={13} className="inline mr-1.5" />All Subscriptions
        </button>
        <button
          onClick={() => setActivePanel('alerts')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all flex items-center gap-1.5 ${activePanel === 'alerts' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'}`}
        >
          <AlertTriangle size={13} />
          Payment Alerts
          {alertCompanies.length > 0 && (
            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${activePanel === 'alerts' ? 'bg-white text-red-600' : 'bg-red-500 text-white'}`}>
              {alertCompanies.length}
            </span>
          )}
        </button>
      </div>

      {/* Subscriptions Panel */}
      {activePanel === 'subscriptions' && (
        <>
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
                    { label: 'Active (Paid)', value: 'active' },
                    { label: 'Trial Active', value: 'trial' },
                    { label: 'Trial Expired', value: 'trial_expired' },
                    { label: 'Expired', value: 'expired' },
                    { label: 'Cancelled', value: 'cancelled' },
                  ]}
                />
              </>
            }
          />

          <DataTable
            label="Company subscriptions"
            columns={subColumns}
            rows={filteredSubs}
            getRowId={sub => sub.id}
            loading={subsLoading}
            emptyIcon={CreditCard}
            emptyTitle="No subscriptions match this filter"
            emptyDescription="Clear the plan or status filter to see the full subscriber base."
            rowActions={sub => (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => handleRenewSubscription(sub)}
                  title="Renew / Reactivate this subscription for 1 year"
                  disabled={actionLoading === `renew_${sub.id}`}
                >
                  <RefreshCcw size={13} /> {actionLoading === `renew_${sub.id}` ? 'Renewing…' : 'Renew'}
                </Button>
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={() => handleDownloadReceipt(sub)}
                  title="Download payment receipt PDF"
                >
                  <Download size={13} /> Receipt
                </Button>
              </div>
            )}
          />
        </>
      )}

      {/* Payment Alerts Panel */}
      {activePanel === 'alerts' && (
        <div className="space-y-4 mt-4">
          {/* Admin Controls */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Admin Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Extend Trial By (days)</label>
                <select
                  value={extendDays}
                  onChange={e => setExtendDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={15}>15 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Extension Reason</label>
                <input
                  value={extendReason}
                  onChange={e => setExtendReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. Admin grace period"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Manual Activation Plan</label>
                <select
                  value={manualPlan}
                  onChange={e => setManualPlan(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="standard">Standard (₹1,800)</option>
                  <option value="premium">Premium (₹3,500)</option>
                  <option value="enterprise">Enterprise (₹5,000)</option>
                </select>
              </div>
            </div>
          </div>

          {alertCompanies.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
              <ShieldCheck size={36} className="mx-auto mb-3 text-emerald-400" />
              <p className="font-semibold text-slate-700">No payment alerts right now</p>
              <p className="text-xs mt-1">All businesses are either on paid plans or have active trials with &gt;3 days remaining.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertCompanies.map(company => {
                const state = computeSubscriptionState(company as any);
                const isExpired = state.isTrialExpired;
                return (
                  <div key={company.id} className={`bg-white rounded-2xl border p-4 flex items-start gap-4 ${isExpired ? 'border-red-200' : 'border-amber-200'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${isExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {company.name?.[0]?.toUpperCase() || 'B'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm">{company.name}</p>
                        {isExpired ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">Trial Expired</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">Expires in {state.trialDaysRemaining}d</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {company.phone || 'No phone'} ·{' '}
                        {state.trialEndDate ? `Trial ended: ${state.trialEndDate.toLocaleDateString('en-IN')}` : 'Trial dates not set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <button
                        onClick={() => handleWhatsAppReminder(company)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-all"
                        title="Send WhatsApp payment reminder"
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </button>
                      <button
                        onClick={() => handleExtendTrial(company)}
                        disabled={actionLoading === `extend_${company.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-60"
                        title={`Extend trial by ${extendDays} days`}
                      >
                        <RefreshCcw size={12} /> +{extendDays}d
                      </button>
                      <button
                        onClick={() => handleManualActivate(company)}
                        disabled={actionLoading === `activate_${company.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-60"
                        title="Manually activate 1-year paid subscription"
                      >
                        <BadgeCheck size={12} /> Activate
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
