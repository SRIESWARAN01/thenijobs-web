'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Clock, CreditCard, Download, TrendingUp, Users2,
  AlertTriangle, MessageSquare, RefreshCcw, ShieldCheck,
  Calendar, BadgeCheck, Edit, Eye, Check, X, Plus, Sparkles,
  Building2, Package, Wrench, Image as ImageIcon, Video, GitBranch,
  Layers, Shield, Star, Crown, Search, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import {
  SUBSCRIPTION_PLANS,
  FEATURE_ACCESS_MATRIX_20_ROWS,
  FeatureMatrixRow,
  FeatureAccessType,
  SITE_CONTACT,
  PLAN_LIMITS
} from '@/lib/constants';
import type { FirestoreTime } from '@/lib/firestoreTime';
import {
  Button, DataTable, FilterSelect, PageHeader, PageShell, Pill, Stat, StatGrid, Toolbar,
  type Column, type PillTone,
} from '@/components/dashboard';
import { extendCompanyTrial, manualActivateSubscription, generateWhatsAppReminderUrl } from '@/lib/subscriptionService';
import { computeSubscriptionState, toJsDate } from '@/lib/subscriptionService';
import { useToast } from '@/contexts/ToastContext';
import { formatLimit, isUnlimited } from '@/lib/plans';

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

interface PaymentDoc {
  id: string;
  amount: number;
  currency?: string;
  orderId?: string;
  paymentId?: string;
  plan?: string;
  companyId?: string;
  status?: string;
  paymentMethod?: string;
  createdAt?: any;
}

const PLAN_CONFIG: Record<string, { label: string; tone: PillTone; icon: any }> = {
  free:       { label: 'Free', tone: 'neutral', icon: Shield },
  basic:      { label: 'Basic', tone: 'info', icon: Shield },
  standard:   { label: 'Standard', tone: 'info', icon: Star },
  premium:    { label: 'Premium', tone: 'violet', icon: Crown },
  enterprise: { label: 'Enterprise', tone: 'warning', icon: Building2 },
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
  const { data: payments = [], loading: paymentsLoading } = useCollection<PaymentDoc>('payments');

  // Active panel tabs
  const [activePanel, setActivePanel] = useState<'plans' | 'matrix' | 'subscriptions' | 'alerts'>('plans');

  // Subscriptions tab filters
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Feature matrix search/filter
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState('all');

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState(7);
  const [extendReason, setExtendReason] = useState('Admin grace period');
  const [manualPlan, setManualPlan] = useState<'basic' | 'standard' | 'premium' | 'enterprise'>('standard');

  // Plan Management & Live Custom Config
  const [livePlans, setLivePlans] = useState<any[]>(SUBSCRIPTION_PLANS);
  const [liveMatrix, setLiveMatrix] = useState<FeatureMatrixRow[]>(FEATURE_ACCESS_MATRIX_20_ROWS);
  const [plansLoading, setPlansLoading] = useState(false);

  // Modals state
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [previewPlan, setPreviewPlan] = useState<any | null>(null);
  const [editingMatrixRow, setEditingMatrixRow] = useState<FeatureMatrixRow | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Load custom plan & matrix configurations from API
  const fetchLivePlansAndMatrix = useCallback(async () => {
    try {
      setPlansLoading(true);
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        if (data.plans && Array.isArray(data.plans)) {
          setLivePlans(data.plans);
        }
        if (data.featureMatrix && Array.isArray(data.featureMatrix)) {
          setLiveMatrix(data.featureMatrix);
        }
      }
    } catch (err) {
      console.warn('[Admin Subscriptions] Failed to fetch live plan settings:', err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLivePlansAndMatrix();
  }, [fetchLivePlansAndMatrix]);

  // ── Companies with expired/expiring trials (alert queue) ────────────────────
  const alertCompanies = useMemo(() => {
    return allCompanies.filter(c => {
      const state = computeSubscriptionState(c as any);
      return (
        (state.isTrialExpired && !state.isPaidActive) ||
        (state.isTrialActive && !state.isPaidActive && state.trialDaysRemaining <= 3)
      );
    });
  }, [allCompanies]);

  // ── Authoritative Statistics Derived from Database ──────────────────────────
  const totalCompaniesCount = allCompanies.length;

  const activePaidCount = useMemo(() =>
    allCompanies.filter(c => computeSubscriptionState(c as any).isPaidActive).length, [allCompanies]);

  const trialActiveCount = useMemo(() =>
    allCompanies.filter(c => {
      const s = computeSubscriptionState(c as any);
      return s.isTrialActive && !s.isPaidActive;
    }).length, [allCompanies]);

  const trialExpiredCount = useMemo(() =>
    allCompanies.filter(c => {
      const s = computeSubscriptionState(c as any);
      return s.isTrialExpired && !s.isPaidActive;
    }).length, [allCompanies]);

  const pendingPaymentsCount = useMemo(() => {
    const pendingFromPayments = payments.filter(p => p.status === 'created' || p.status === 'pending').length;
    const pendingFromCompanies = allCompanies.filter(c => c.paymentStatus === 'pending').length;
    return Math.max(pendingFromPayments, pendingFromCompanies);
  }, [payments, allCompanies]);

  const totalVerifiedRevenue = useMemo(() => {
    // Sum real captured payments from payments collection
    const capturedFromPayments = payments
      .filter(p => p.status === 'captured')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Also include verified active subscriptions with status=active & paymentStatus=paid
    const capturedFromSubs = subscriptions
      .filter(s => s.status === 'active' && s.paymentStatus === 'paid')
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    return Math.max(capturedFromPayments, capturedFromSubs);
  }, [payments, subscriptions]);

  // Plan Distribution across all registered companies
  const planDistribution = useMemo(() => {
    const dist = { basic: 0, standard: 0, premium: 0, enterprise: 0, free: 0 };
    allCompanies.forEach(c => {
      const state = computeSubscriptionState(c as any);
      const p = (state.isPaidActive ? (c.subscriptionPlan || 'standard') : (state.isTrialActive ? 'standard' : 'free')).toLowerCase();
      if (p in dist) {
        dist[p as keyof typeof dist]++;
      } else {
        dist.free++;
      }
    });
    return dist;
  }, [allCompanies]);

  // Subscriptions Table Filtered Rows
  const filteredSubs = useMemo(() => {
    return subscriptions.filter((sub) => {
      const name = sub.businessName || sub.companyName || 'Company';
      const matchSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const subPlan = (sub.plan || 'free').toLowerCase();
      const matchPlan = planFilter === 'all' || subPlan === planFilter.toLowerCase();
      const subStatus = sub.status || 'active';
      const matchStatus = statusFilter === 'all' || subStatus === statusFilter || sub.paymentStatus === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [subscriptions, searchQuery, planFilter, statusFilter]);

  // Feature Matrix Filtered Rows
  const filteredMatrix = useMemo(() => {
    return liveMatrix.filter((row) => {
      const matchCategory = matrixCategoryFilter === 'all' || row.category === matrixCategoryFilter;
      const matchSearch = row.feature.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        row.category.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        row.basic.value.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        row.standard.value.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        row.premium.value.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        row.enterprise.value.toLowerCase().includes(matrixSearch.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [liveMatrix, matrixCategoryFilter, matrixSearch]);

  // Download Receipt PDF
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
      pdf.text(`Support: ${SITE_CONTACT.supportEmail} | Phone: ${SITE_CONTACT.phone1}`, 20, 49);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(20, 55, 190, 55);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Receipt No: ${receiptNum}`, 20, 64);
      pdf.text(`Receipt Date: ${dateStr}`, 140, 64);

      pdf.text('Received From:', 20, 75);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.businessName || item.companyName || 'Business Owner', 20, 81);
      pdf.text(`Plan Tier: ${(item.plan || 'standard').toUpperCase()} (1 Year Annual Membership)`, 20, 87);
      pdf.text(`Payment Gateway: ${item.paymentMethod || 'Razorpay 256-Bit SSL'}`, 20, 93);

      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(20, 105, 170, 20, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.text('Description', 25, 117);
      pdf.text('Amount (INR)', 155, 117);

      pdf.rect(20, 125, 170, 25, 'S');
      pdf.setFont('helvetica', 'normal');
      pdf.text(`THENIJOBS Annual Plan (${(item.plan || 'standard').toUpperCase()})`, 25, 137);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`₹${amount.toLocaleString('en-IN')}`, 155, 137);

      pdf.setFontSize(11);
      pdf.setTextColor(5, 150, 105);
      pdf.text('STATUS: VERIFIED & COMPLETED', 20, 165);

      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('This is a computer-generated tax receipt issued by THENIJOBS portal.', 105, 280, { align: 'center' });

      pdf.save(`THENIJOBS_Receipt_${receiptNum}.pdf`);
      toast.success('Receipt Downloaded! 📄', `Receipt ${receiptNum} saved as PDF.`);
    } catch (err: any) {
      console.error('Receipt PDF error:', err);
      toast.error('Download failed', err.message || 'Could not generate receipt PDF.');
    }
  };

  // Admin Actions
  const handleExtendTrial = useCallback(async (company: CompanyDoc) => {
    if (!company.id) return;
    setActionLoading(`extend_${company.id}`);
    try {
      await extendCompanyTrial(company.id, extendDays, currentUser?.uid || 'admin', extendReason);
      toast.success('Trial Extended! ⏳', `${company.name} extended by ${extendDays} days.`);
    } catch (err: any) {
      toast.error('Extension failed', err.message);
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

  // Save edited plan configuration
  const handleSavePlanEdit = async () => {
    if (!editingPlan) return;
    setSaveLoading(true);
    try {
      const updatedPlans = livePlans.map(p => {
        if (p.slug === editingPlan.slug || p.id === editingPlan.id) {
          return {
            ...p,
            ...editingPlan,
            price: Number(editingPlan.price) || p.price,
            monthlyEquivalent: Math.round((Number(editingPlan.price) || p.price) / 12),
            dailyEquivalent: Number(((Number(editingPlan.price) || p.price) / 365).toFixed(2)),
          };
        }
        return p;
      });

      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'admin_token'}`,
        },
        body: JSON.stringify({
          plans: updatedPlans,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save plan configuration.');
      }

      setLivePlans(updatedPlans);
      toast.success('Plan Configuration Saved! 🚀', `${editingPlan.name} plan updated. Changes apply to future checkouts.`);
      setEditingPlan(null);
    } catch (err: any) {
      console.error('Plan save error:', err);
      toast.error('Save failed', err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Toggle Plan Active State
  const handleTogglePlanActive = async (plan: any) => {
    const updatedStatus = plan.isActive === false ? true : false;
    try {
      const updatedPlans = livePlans.map(p => {
        if (p.slug === plan.slug) {
          return { ...p, isActive: updatedStatus };
        }
        return p;
      });

      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'admin_token'}`,
        },
        body: JSON.stringify({ plans: updatedPlans }),
      });

      if (!res.ok) throw new Error('Could not update status');
      setLivePlans(updatedPlans);
      toast.success(`Plan ${updatedStatus ? 'Activated' : 'Deactivated'}`, `${plan.name} status updated.`);
    } catch (err: any) {
      toast.error('Update failed', err.message);
    }
  };

  // Save edited matrix row
  const handleSaveMatrixRow = async () => {
    if (!editingMatrixRow) return;
    setSaveLoading(true);
    try {
      const updatedMatrix = liveMatrix.map(r => {
        if (r.id === editingMatrixRow.id) {
          return editingMatrixRow;
        }
        return r;
      });

      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.uid || 'admin_token'}`,
        },
        body: JSON.stringify({
          featureMatrix: updatedMatrix,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update matrix');

      setLiveMatrix(updatedMatrix);
      toast.success('Feature Matrix Updated! 📊', `Rule for "${editingMatrixRow.feature}" updated.`);
      setEditingMatrixRow(null);
    } catch (err: any) {
      toast.error('Matrix update failed', err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Subscriptions Table Columns Definition
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
            <div>
              <span className="truncate font-semibold text-slate-900 block">{name}</span>
              <span className="text-[10px] text-slate-400 font-mono">ID: {sub.id.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'plan',
      header: 'Tier',
      sortValue: sub => sub.plan ?? 'free',
      render: sub => {
        const cfg = PLAN_CONFIG[(sub.plan || 'free').toLowerCase()] || PLAN_CONFIG.free;
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
      header: 'Expiry / Renewal',
      hideBelow: 'lg',
      sortValue: sub => toJsDate(sub.endDate || sub.trialEndDate)?.getTime() ?? 0,
      render: sub => {
        const d = toJsDate(sub.endDate || sub.trialEndDate);
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

  // Badge Access Pill Styler for Feature Matrix
  const renderAccessBadge = (type: FeatureAccessType, value: string) => {
    switch (type) {
      case 'Unlimited':
        return (
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
              Unlimited
            </span>
            <p className="text-[11px] text-purple-950 font-bold">{value}</p>
          </div>
        );
      case 'Limited quantity':
        return (
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Limited
            </span>
            <p className="text-[11px] text-slate-800 font-semibold">{value}</p>
          </div>
        );
      case 'Available':
        return (
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Available
            </span>
            <p className="text-[11px] text-emerald-950 font-medium">{value}</p>
          </div>
        );
      case 'Premium feature':
        return (
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
              ⭐ Premium
            </span>
            <p className="text-[11px] text-amber-950 font-semibold">{value}</p>
          </div>
        );
      case 'Enterprise feature':
        return (
          <div className="space-y-0.5">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
              💎 Enterprise
            </span>
            <p className="text-[11px] text-indigo-950 font-bold">{value}</p>
          </div>
        );
      case 'Not available':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400">
            ✕ Not available
          </span>
        );
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Subscriptions & Billing"
        description="Manage the 4 subscription plans, feature access matrix, company subscriptions, payments, and trial expirations."
        breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Subscriptions' }]}
      />

      {/* ─── 1. REAL AUTHORITATIVE STATISTICS BAR (SECTION 2) ────────────────── */}
      <StatGrid columns={4}>
        <Stat
          label="Total Companies"
          value={totalCompaniesCount}
          icon={Building2}
          tone="blue"
          loading={companiesLoading}
        />
        <Stat
          label="Active Subscriptions"
          value={activePaidCount}
          icon={BadgeCheck}
          tone="emerald"
          loading={companiesLoading}
        />
        <Stat
          label="Trial Subscriptions"
          value={trialActiveCount}
          icon={Clock}
          tone="blue"
          loading={companiesLoading}
        />
        <Stat
          label="Expired Subscriptions"
          value={trialExpiredCount}
          icon={AlertTriangle}
          tone="rose"
          loading={companiesLoading}
        />
      </StatGrid>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Payments</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingPaymentsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting gateway verification or approval</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CreditCard size={24} />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verified Revenue Collected</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">₹{totalVerifiedRevenue.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Based on real captured payment &amp; subscription records</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Plan Distribution Badge Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <Layers size={14} className="text-blue-600" /> Plan Distribution:
        </span>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold">
            Basic: <strong>{planDistribution.basic}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
            Standard: <strong>{planDistribution.standard}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-violet-50 text-violet-800 border border-violet-200 font-bold">
            Premium: <strong>{planDistribution.premium}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
            Enterprise: <strong>{planDistribution.enterprise}</strong>
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
            Free / Expired: <strong>{planDistribution.free}</strong>
          </span>
        </div>
      </div>

      {/* ─── 2. PANEL NAVIGATION TABS ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mt-4 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActivePanel('plans')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
            activePanel === 'plans'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
          }`}
        >
          <CreditCard size={15} />
          <span>Plan Management &amp; Pricing</span>
        </button>

        <button
          onClick={() => setActivePanel('matrix')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
            activePanel === 'matrix'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
          }`}
        >
          <Layers size={15} />
          <span>Feature Access Matrix (20 Rows)</span>
        </button>

        <button
          onClick={() => setActivePanel('subscriptions')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
            activePanel === 'subscriptions'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
          }`}
        >
          <Users2 size={15} />
          <span>Subscribed Companies ({filteredSubs.length})</span>
        </button>

        <button
          onClick={() => setActivePanel('alerts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
            activePanel === 'alerts'
              ? 'bg-red-600 text-white border-red-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-red-300'
          }`}
        >
          <AlertTriangle size={15} />
          <span>Payment &amp; Trial Alerts</span>
          {alertCompanies.length > 0 && (
            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              activePanel === 'alerts' ? 'bg-white text-red-600' : 'bg-red-500 text-white'
            }`}>
              {alertCompanies.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── TAB 1: PLAN MANAGEMENT & PRICING TABLE (REQUIREMENT 2) ─────────── */}
      {activePanel === 'plans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Authoritative Subscription Plans</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and manage plan pricing, quotas, badges, and features. Prices are billed annually on a manual renewal basis.
                </p>
              </div>
              <Button
                size="sm"
                variant="subtle"
                onClick={fetchLivePlansAndMatrix}
                loading={plansLoading}
              >
                <RefreshCcw size={13} className="mr-1.5" /> Refresh Plans
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Plan</th>
                    <th className="py-3 px-4 text-right">Annual Price</th>
                    <th className="py-3 px-4">Billing Cycle</th>
                    <th className="py-3 px-4">Badge</th>
                    <th className="py-3 px-4 text-center">Subscribers</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {livePlans.map((plan) => {
                    const subscriberCount = allCompanies.filter(c => {
                      const state = computeSubscriptionState(c as any);
                      return state.isPaidActive && (c.subscriptionPlan || '').toLowerCase() === plan.slug;
                    }).length;

                    return (
                      <tr key={plan.slug} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                              {plan.slug === 'basic' && <Shield size={18} />}
                              {plan.slug === 'standard' && <Star size={18} />}
                              {plan.slug === 'premium' && <Crown size={18} />}
                              {plan.slug === 'enterprise' && <Building2 size={18} />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900">{plan.name}</p>
                              <p className="text-[11px] text-slate-500">{plan.bestFor}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right font-bold text-slate-900">
                          <div className="text-sm text-emerald-700">₹{plan.price.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ~₹{plan.dailyEquivalent}/day (₹{plan.monthlyEquivalent}/mo)
                          </div>
                        </td>

                        <td className="py-4 px-4 font-semibold text-slate-700">
                          Annual (Manual)
                        </td>

                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {plan.badge}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {subscriberCount} Companies
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePlanActive(plan)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              plan.isActive !== false
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {plan.isActive !== false ? '● Active' : '○ Inactive'}
                          </button>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewPlan(plan)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Preview Public Pricing Card"
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPlanFilter(plan.slug);
                                setActivePanel('subscriptions');
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="View all subscribed companies on this tier"
                            >
                              <Users2 size={13} />
                              <span>Subscribers</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingPlan(plan)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Edit Plan Price, Limits, and Features"
                            >
                              <Edit size={13} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: FEATURE ACCESS MATRIX (REQUIREMENT 3) ────────────────────── */}
      {activePanel === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  <span>Authoritative Feature Access Matrix (20 Rows)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single source of truth for subscription quotas, permission gates, and feature inheritance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search feature..."
                    value={matrixSearch}
                    onChange={e => setMatrixSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 w-44"
                  />
                </div>

                <select
                  value={matrixCategoryFilter}
                  onChange={e => setMatrixCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <option value="all">All Categories</option>
                  <option value="Core Resources & Postings">Core Resources &amp; Postings</option>
                  <option value="Digital Identity & Branding">Digital Identity &amp; Branding</option>
                  <option value="Marketing & Leads">Marketing &amp; Leads</option>
                  <option value="Enterprise & AI">Enterprise &amp; AI</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-separate border-spacing-0">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-50 p-3.5 border-b border-slate-200 w-1/4">Feature &amp; Category</th>
                    <th className="p-3.5 border-b border-slate-200 text-center">
                      Basic<br />
                      <span className="font-normal text-slate-500">₹999/yr</span>
                    </th>
                    <th className="p-3.5 border-b border-slate-200 text-center">
                      Standard<br />
                      <span className="font-normal text-slate-500">₹1,800/yr</span>
                    </th>
                    <th className="p-3.5 border-b border-blue-200 bg-blue-50/70 text-blue-900 text-center">
                      ⭐ Premium<br />
                      <span className="font-normal text-blue-700">₹3,500/yr</span>
                    </th>
                    <th className="p-3.5 border-b border-slate-200 text-center">
                      💎 Enterprise<br />
                      <span className="font-normal text-slate-500">₹5,000/yr</span>
                    </th>
                    <th className="p-3.5 border-b border-slate-200 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMatrix.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="sticky left-0 z-10 bg-white p-3.5 font-bold text-slate-900 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)]">
                        <div>
                          <span>{row.feature}</span>
                          <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{row.category}</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {renderAccessBadge(row.basic.accessType, row.basic.value)}
                      </td>

                      <td className="p-3.5 text-center">
                        {renderAccessBadge(row.standard.accessType, row.standard.value)}
                      </td>

                      <td className="p-3.5 text-center bg-blue-50/30">
                        {renderAccessBadge(row.premium.accessType, row.premium.value)}
                      </td>

                      <td className="p-3.5 text-center">
                        {renderAccessBadge(row.enterprise.accessType, row.enterprise.value)}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingMatrixRow(row)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                        >
                          <Edit size={12} className="inline mr-1" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SUBSCRIBED COMPANIES & PAYMENTS ──────────────────────────── */}
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
                    { label: 'Basic (₹999)', value: 'basic' },
                    { label: 'Standard (₹1,800)', value: 'standard' },
                    { label: 'Premium (₹3,500)', value: 'premium' },
                    { label: 'Enterprise (₹5,000)', value: 'enterprise' },
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

      {/* ─── TAB 4: PAYMENT ALERTS & TRIAL QUEUE ─────────────────────────────── */}
      {activePanel === 'alerts' && (
        <div className="space-y-4 mt-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Admin Bulk Controls</h3>
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
                  <option value="basic">Basic (₹999)</option>
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
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-all cursor-pointer"
                        title="Send WhatsApp payment reminder"
                      >
                        <MessageSquare size={12} /> WhatsApp
                      </button>
                      <button
                        onClick={() => handleExtendTrial(company)}
                        disabled={actionLoading === `extend_${company.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-60 cursor-pointer"
                        title={`Extend trial by ${extendDays} days`}
                      >
                        <RefreshCcw size={12} /> +{extendDays}d
                      </button>
                      <button
                        onClick={() => handleManualActivate(company)}
                        disabled={actionLoading === `activate_${company.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-60 cursor-pointer"
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

      {/* ─── MODAL 1: PLAN EDITOR MODAL (REQUIREMENT 2) ──────────────────────── */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit size={18} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Edit Plan: {editingPlan.name}</h3>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-700" /> Invariant Protection
                </p>
                <p className="text-[11px] mt-0.5 text-amber-800">
                  Price changes apply only to future checkouts and renewals. Past payments, receipts, and existing subscription terms remain immutable.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan Name</label>
                  <input
                    type="text"
                    value={editingPlan.name || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Price (₹ INR)</label>
                  <input
                    type="number"
                    value={editingPlan.price || 0}
                    onChange={e => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300 font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Verification Badge String</label>
                  <input
                    type="text"
                    value={editingPlan.badge || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Business Type (Best For)</label>
                  <input
                    type="text"
                    value={editingPlan.bestFor || ''}
                    onChange={e => setEditingPlan({ ...editingPlan, bestFor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Resource Quota Limits */}
              <div className="pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-900 mb-2">Resource Quotas &amp; Limits (Backend Enforced):</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Active Jobs Limit</label>
                    <input
                      type="number"
                      value={editingPlan.activeJobLimit !== undefined ? editingPlan.activeJobLimit : PLAN_LIMITS[editingPlan.slug]?.activeJobs ?? 5}
                      onChange={e => setEditingPlan({ ...editingPlan, activeJobLimit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Products Limit</label>
                    <input
                      type="number"
                      value={editingPlan.productLimit !== undefined ? editingPlan.productLimit : PLAN_LIMITS[editingPlan.slug]?.products ?? 0}
                      onChange={e => setEditingPlan({ ...editingPlan, productLimit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Services Limit</label>
                    <input
                      type="number"
                      value={editingPlan.serviceLimit !== undefined ? editingPlan.serviceLimit : PLAN_LIMITS[editingPlan.slug]?.services ?? 0}
                      onChange={e => setEditingPlan({ ...editingPlan, serviceLimit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Gallery Images</label>
                    <input
                      type="number"
                      value={editingPlan.galleryLimit !== undefined ? editingPlan.galleryLimit : PLAN_LIMITS[editingPlan.slug]?.galleryImages ?? 6}
                      onChange={e => setEditingPlan({ ...editingPlan, galleryLimit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Gallery Videos</label>
                    <input
                      type="number"
                      value={editingPlan.videoLimit !== undefined ? editingPlan.videoLimit : PLAN_LIMITS[editingPlan.slug]?.videos ?? 0}
                      onChange={e => setEditingPlan({ ...editingPlan, videoLimit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Branches</label>
                    <input
                      type="number"
                      value={editingPlan.branchLimit !== undefined ? editingPlan.branchLimit : PLAN_LIMITS[editingPlan.slug]?.branches ?? 0}
                      onChange={e => setEditingPlan({ ...editingPlan, branchLimit: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Features List */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-900 block">Plan Features Bullets ({editingPlan.features?.length || 0})</label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingPlan.features || [];
                      setEditingPlan({ ...editingPlan, features: [...current, 'New Plan Feature'] });
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Add Feature
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {(editingPlan.features || []).map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={feat}
                        onChange={e => {
                          const updated = [...editingPlan.features];
                          updated[idx] = e.target.value;
                          setEditingPlan({ ...editingPlan, features: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingPlan.features.filter((_: any, i: number) => i !== idx);
                          setEditingPlan({ ...editingPlan, features: updated });
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePlanEdit}
                disabled={saveLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saveLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>Save Plan Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: PRICING CARD PREVIEW MODAL ─────────────────────────────── */}
      {previewPlan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setPreviewPlan(null)}
              className="absolute top-4 right-4 p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center pt-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase">
                {previewPlan.badge || 'Verified Member'}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">{previewPlan.name} Plan</h3>
              <p className="text-xs text-slate-500 mt-0.5">{previewPlan.bestFor}</p>
            </div>

            <div className="text-center py-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="text-3xl font-black text-slate-900">
                ₹{previewPlan.price.toLocaleString('en-IN')}
                <span className="text-xs font-normal text-slate-500"> /year</span>
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-1">
                ~₹{previewPlan.dailyEquivalent}/day <span className="text-slate-400 font-normal">(₹{previewPlan.monthlyEquivalent}/mo)</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Billed annually · Manual renewal</p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto text-xs text-slate-600 pr-1">
              {(previewPlan.features || []).map((f: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPreviewPlan(null)}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: MATRIX ROW EDITOR MODAL ────────────────────────────────── */}
      {editingMatrixRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Feature Matrix Rule</h3>
                <p className="text-xs text-slate-500">{editingMatrixRow.feature} ({editingMatrixRow.category})</p>
              </div>
              <button
                onClick={() => setEditingMatrixRow(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[65vh] overflow-y-auto pr-1">
              {(['basic', 'standard', 'premium', 'enterprise'] as const).map(tier => {
                const item = editingMatrixRow[tier];
                return (
                  <div key={tier} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold uppercase text-slate-800 text-[11px]">{tier} Plan</span>
                      <select
                        value={item.accessType}
                        onChange={e => {
                          setEditingMatrixRow({
                            ...editingMatrixRow,
                            [tier]: { ...item, accessType: e.target.value as FeatureAccessType }
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-white font-bold"
                      >
                        <option value="Not available">Not available</option>
                        <option value="Available">Available</option>
                        <option value="Limited quantity">Limited quantity</option>
                        <option value="Unlimited">Unlimited</option>
                        <option value="Premium feature">Premium feature</option>
                        <option value="Enterprise feature">Enterprise feature</option>
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Display label / quota value"
                      value={item.value}
                      onChange={e => {
                        setEditingMatrixRow({
                          ...editingMatrixRow,
                          [tier]: { ...item, value: e.target.value }
                        });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingMatrixRow(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMatrixRow}
                disabled={saveLoading}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saveLoading ? <RefreshCcw size={13} className="animate-spin" /> : <Check size={13} />}
                <span>Save Matrix Rule</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}