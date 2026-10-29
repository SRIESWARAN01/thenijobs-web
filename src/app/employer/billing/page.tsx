'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployerCompany } from '@/hooks/useEmployerCompany';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { 
  CreditCard, 
  Check, 
  ShieldCheck, 
  Zap, 
  Shield, 
  Crown, 
  Building2, 
  Loader2, 
  Star, 
  Sparkles, 
  ArrowRight, 
  MessageCircle, 
  PhoneCall, 
  ShieldAlert,
  Download,
  FileText,
  Calendar,
  Briefcase,
  Package,
  Wrench,
  Image as ImageIcon,
  Video,
  GitBranch,
  Users,
  AlertCircle,
  Info,
  RefreshCw,
  X,
  BadgeCheck,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS, SITE_CONTACT } from '@/lib/constants';
import { getPlanLimits, formatLimit, isUnlimited, PLAN_HIERARCHY } from '@/lib/plans';
import { getPlanBadgeInfo } from '@/components/identity/PlanBadge';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';
import { PageHeader } from '@/components/dashboard';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { generatePaymentReceiptPDF, ReceiptData } from '@/lib/pdf/receiptGenerator';
import { getDeterministicBillingSlogan } from '@/lib/billing/sloganLibrary';
import { generateAdminWhatsAppContactUrl } from '@/lib/subscriptionService';
import { toDate } from '@/lib/firestoreTime';
import { useToast } from '@/contexts/ToastContext';

interface PlanChangeModalData {
  type: 'upgrade' | 'downgrade' | 'renewal';
  plan: (typeof SUBSCRIPTION_PLANS)[number];
  currentPlan: (typeof SUBSCRIPTION_PLANS)[number];
  priceDifference?: number;
}

export default function EmployerBillingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [planChangeModal, setPlanChangeModal] = useState<PlanChangeModalData | null>(null);

  // 1. Fetch employer's company
  const { company: canonicalComp, loading: companyLoading } = useEmployerCompany();
  const company = canonicalComp;
  const companyId = company?.id;

  // 2. Fetch active subscriptions
  const { data: subscriptions, loading: subLoading, refresh: refreshSubs } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || ''),
    where('status', '==', 'active')
  ], { skip: !companyId });

  // 3. Fetch company active jobs count
  const { data: jobs } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true)
  ], { skip: !companyId });

  // 4. Fetch payment history records
  const { data: payments } = useCollection<any>('payments', [
    where('companyId', '==', companyId || ''),
    where('status', '==', 'captured')
  ], { skip: !companyId });

  const activeSub = subscriptions?.[0];
  const currentPlanSlug = activeSub ? activeSub.plan : (company?.subscriptionPlan || 'free');
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.slug === currentPlanSlug) || SUBSCRIPTION_PLANS[0];
  const subState = useSubscriptionStatus(company as any, user);

  const loading = companyLoading || subLoading;

  // Authoritative limits and current usage
  const limits = getPlanLimits(currentPlanSlug);
  const activeJobsCount = jobs?.length || 0;
  const productsCount = company?.products?.length || 0;
  const servicesCount = company?.services?.length || 0;
  const galleryCount = company?.galleryImages?.length || (company?.gallery?.length || 0);
  const videosCount = company?.galleryVideos?.length || 0;
  const branchesCount = company?.branches?.length || 0;
  const staffCount = company?.teamMembers?.length || 0;

  // Verification status separation
  const isBusinessVerified = company?.verificationStatus === 'verified' || company?.isVerified === true;
  const badgeInfo = getPlanBadgeInfo(currentPlanSlug, isBusinessVerified, company?.verificationStatus);

  const handleOpenPlanChange = (plan: (typeof SUBSCRIPTION_PLANS)[number], type: 'upgrade' | 'downgrade' | 'renewal') => {
    const priceDifference = Math.max(0, plan.price - (currentPlan?.price || 0));
    setPlanChangeModal({
      type,
      plan,
      currentPlan,
      priceDifference,
    });
  };

  const handleConfirmPlanChange = () => {
    if (!planChangeModal) return;
    const target = planChangeModal.plan;
    setPlanChangeModal(null);
    setSelectedPlan({
      name: target.name,
      slug: target.slug,
      price: target.price,
      dailyEquivalent: target.dailyEquivalent,
      monthlyEquivalent: target.monthlyEquivalent,
      features: target.features,
      badge: target.badge,
    });
    setIsCheckoutOpen(true);
  };

  /**
   * Generates and downloads official publication-quality A4 Tax Invoice / Payment Receipt PDF
   */
  const handleDownloadReceipt = async (paymentItem?: any) => {
    try {
      const pay = paymentItem || payments?.[0];
      const targetPlanSlug = pay?.plan || company?.subscriptionPlan || (subState.isPaidActive ? subState.plan : 'standard');
      const targetPlan = SUBSCRIPTION_PLANS.find(p => p.slug === targetPlanSlug) || currentPlan;
      const amount = pay?.amount || (targetPlan ? targetPlan.price : 1800);

      const now = new Date();
      const startDateObj = pay?.createdAt ? (toDate(pay.createdAt) || now) : (subState.subscriptionStartDate || now);
      const endDateObj = subState.subscriptionEndDate || new Date(startDateObj.getTime() + 365 * 24 * 60 * 60 * 1000);

      const formattedStartDate = startDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const formattedEndDate = endDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const formattedDateTime = startDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const resolvedAddress = company?.address
        ? `${company.address}${company.district ? ', ' + company.district : ''}, Tamil Nadu`
        : (company?.district ? `${company.district}, Tamil Nadu` : 'Theni District, Tamil Nadu');

      const receiptNo = pay?.orderId
        ? `THENI-REC-${pay.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`
        : `THENI-REC-${(companyId || 'BILL').slice(-6).toUpperCase()}`;

      let sloganText = pay?.sloganText;
      let sloganLanguage = pay?.sloganLanguage;
      let sloganId = pay?.sloganId;
      let sloganCycle = pay?.sloganCycle;

      if (!sloganText) {
        const fallbackSlogan = getDeterministicBillingSlogan(receiptNo || pay?.orderId || companyId);
        sloganText = fallbackSlogan.sloganText;
        sloganLanguage = fallbackSlogan.sloganLanguage;
        sloganId = fallbackSlogan.sloganId;
        sloganCycle = fallbackSlogan.sloganCycle;
      }

      const receiptData: ReceiptData = {
        receiptNo,
        paymentId: pay?.paymentId || 'pay_online_verified',
        orderId: pay?.orderId || `order_${companyId || 'SUB'}`,
        amount,
        planName: targetPlan.name,
        planSlug: targetPlan.slug,
        date: formattedDateTime,
        startDate: formattedStartDate,
        expiryDate: formattedEndDate,
        billedTo: company?.name || user?.displayName || 'Business Owner',
        address: resolvedAddress,
        phone: company?.phone || (user as any)?.phone || '',
        gst: company?.gstNumber || '',
        email: user?.email || company?.email || '',
        paymentMethod: pay?.paymentMethod || 'Razorpay 256-Bit SSL (UPI / Cards)',
        status: 'PAID / ACTIVE',
        sloganText,
        sloganLanguage,
        sloganId,
        sloganCycle,
      };

      const doc = await generatePaymentReceiptPDF(receiptData);
      doc.save(`THENIJOBS_Receipt_${receiptData.receiptNo}.pdf`);
      toast.success('🎉 Official Receipt Downloaded!', `${targetPlan.name} PDF invoice saved.`);
    } catch (err: any) {
      console.error('Receipt download error:', err);
      toast.error('Download Failed', 'Could not generate receipt PDF. Please try again.');
    }
  };

  if (!companyId && !companyLoading) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <CreditCard size={48} className="text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 font-sans">No Company Profile Found</h2>
          <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">Please register your company profile first to view pricing plans and subscription options.</p>
          <Link href="/employer/company-profile" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors">
            Setup Company Profile
          </Link>
        </div>
      </div>
    );
  }

  // Days remaining on subscription
  let daysRemaining = 0;
  if (subState.isPaidActive && subState.subscriptionEndDate) {
    daysRemaining = Math.max(0, Math.ceil((subState.subscriptionEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  } else if (subState.isTrialActive) {
    daysRemaining = subState.trialDaysRemaining;
  }

  const currentPlanIndex = PLAN_HIERARCHY.indexOf(currentPlanSlug as any);

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6">
      <PageHeader
        title="Pricing & Subscriptions"
        description="Manage your annual subscription, resource usage limits, and tax invoices."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Billing' }]}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
          <p className="text-xs text-gray-500 font-medium">Loading subscription details...</p>
        </div>
      ) : (
        <>
          {/* ─── 1. CURRENT SUBSCRIPTION OVERVIEW CARD ─────────────────────── */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Crown size={28} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{currentPlan.name} Plan</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 uppercase tracking-wider">
                      {subState.isPaidActive ? 'Active Plan' : subState.isTrialActive ? 'Free Trial' : 'Expired'}
                    </span>
                    {/* Badge separation */}
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 border"
                      style={{
                        background: badgeInfo.bgColor,
                        color: badgeInfo.color,
                        borderColor: badgeInfo.borderColor,
                      }}
                    >
                      <span>{badgeInfo.emoji}</span>
                      <span>{badgeInfo.displayLabel}</span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {currentPlan.price === 0
                      ? 'Free tier account'
                      : `₹${currentPlan.price.toLocaleString('en-IN')}/year (~₹${currentPlan.dailyEquivalent}/day) · Manual annual renewal`}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-2">
                    {subState.isPaidActive && subState.subscriptionStartDate && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Calendar size={13} className="text-blue-600" />
                        Activated: <strong>{subState.subscriptionStartDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                      </span>
                    )}
                    {subState.isPaidActive && subState.subscriptionEndDate && (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <Calendar size={13} className="text-emerald-600" />
                        Expires: <strong>{subState.subscriptionEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                        <span className="text-[11px] font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-1">
                          {daysRemaining} days left
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons & Quick Stats */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center min-w-[90px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Active Jobs</p>
                  <p className="text-base font-extrabold text-gray-900">
                    {activeJobsCount} / {formatLimit(limits.activeJobs)}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center min-w-[90px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Status</p>
                  <p className={`text-base font-extrabold ${subState.isPaidActive ? 'text-emerald-600' : subState.isTrialActive ? 'text-amber-600' : 'text-red-600'}`}>
                    {subState.isPaidActive ? 'Active' : subState.isTrialActive ? `Trial (${daysRemaining}d)` : 'Expired'}
                  </p>
                </div>

                {/* Direct in-app renewal button */}
                {subState.isPaidActive && (
                  <button
                    onClick={() => handleOpenPlanChange(currentPlan, 'renewal')}
                    className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Renew Plan</span>
                  </button>
                )}

                {(subState.isPaidActive || (payments && payments.length > 0)) && (
                  <button
                    onClick={() => handleDownloadReceipt()}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                    title="Download Official Tax Invoice / Payment Receipt (PDF)"
                  >
                    <Download size={14} />
                    <span>Receipt (PDF)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ─── 2. RESOURCE USAGE & QUOTAS DASHBOARD (SECTION 8) ─────────── */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Zap size={18} className="text-amber-500" />
                  <span>Plan Limits &amp; Current Resource Usage</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real-time quota monitoring. Quotas are enforced on backend operations to preserve service reliability.
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 w-fit">
                {currentPlan.name} Quota Allocation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Active Jobs */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-blue-600" /> Active Jobs</span>
                  <span className="font-mono text-slate-900">{activeJobsCount} / {formatLimit(limits.activeJobs)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isUnlimited(limits.activeJobs) ? 'bg-purple-600 w-1/4' : (activeJobsCount >= limits.activeJobs ? 'bg-red-500' : 'bg-blue-600')
                    }`}
                    style={{ width: isUnlimited(limits.activeJobs) ? '25%' : `${Math.min(100, (activeJobsCount / Math.max(1, limits.activeJobs)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {isUnlimited(limits.activeJobs) ? 'Unlimited active postings' : `${Math.max(0, limits.activeJobs - activeJobsCount)} remaining`}
                </p>
              </div>

              {/* Products */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Package size={14} className="text-emerald-600" /> Products</span>
                  <span className="font-mono text-slate-900">
                    {limits.products === 0 ? 'Not Included' : `${productsCount} / ${formatLimit(limits.products)}`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      limits.products === 0 ? 'bg-gray-300 w-0' : isUnlimited(limits.products) ? 'bg-purple-600 w-1/4' : (productsCount >= limits.products ? 'bg-red-500' : 'bg-emerald-600')
                    }`}
                    style={{ width: limits.products === 0 ? '0%' : isUnlimited(limits.products) ? '25%' : `${Math.min(100, (productsCount / Math.max(1, limits.products)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {limits.products === 0 ? 'Upgrade to Standard for 20' : isUnlimited(limits.products) ? 'Unlimited products' : `${Math.max(0, limits.products - productsCount)} remaining`}
                </p>
              </div>

              {/* Services */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Wrench size={14} className="text-amber-600" /> Services</span>
                  <span className="font-mono text-slate-900">
                    {limits.services === 0 ? 'Not Included' : `${servicesCount} / ${formatLimit(limits.services)}`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      limits.services === 0 ? 'bg-gray-300 w-0' : isUnlimited(limits.services) ? 'bg-purple-600 w-1/4' : (servicesCount >= limits.services ? 'bg-red-500' : 'bg-amber-600')
                    }`}
                    style={{ width: limits.services === 0 ? '0%' : isUnlimited(limits.services) ? '25%' : `${Math.min(100, (servicesCount / Math.max(1, limits.services)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {limits.services === 0 ? 'Upgrade to Standard for 10' : isUnlimited(limits.services) ? 'Unlimited services' : `${Math.max(0, limits.services - servicesCount)} remaining`}
                </p>
              </div>

              {/* Gallery Images & Videos */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><ImageIcon size={14} className="text-indigo-600" /> Gallery Images</span>
                  <span className="font-mono text-slate-900">{galleryCount} / {formatLimit(limits.galleryImages)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isUnlimited(limits.galleryImages) ? 'bg-purple-600 w-1/4' : (galleryCount >= limits.galleryImages ? 'bg-red-500' : 'bg-indigo-600')
                    }`}
                    style={{ width: isUnlimited(limits.galleryImages) ? '25%' : `${Math.min(100, (galleryCount / Math.max(1, limits.galleryImages)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Videos: {videosCount} / {formatLimit(limits.videos)}
                </p>
              </div>

              {/* Branches */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><GitBranch size={14} className="text-teal-600" /> Branches</span>
                  <span className="font-mono text-slate-900">
                    {limits.branches === 0 ? 'Not Included' : `${branchesCount} / ${formatLimit(limits.branches)}`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      limits.branches === 0 ? 'bg-gray-300 w-0' : isUnlimited(limits.branches) ? 'bg-purple-600 w-1/4' : (branchesCount >= limits.branches ? 'bg-red-500' : 'bg-teal-600')
                    }`}
                    style={{ width: limits.branches === 0 ? '0%' : isUnlimited(limits.branches) ? '25%' : `${Math.min(100, (branchesCount / Math.max(1, limits.branches)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {limits.branches === 0 ? 'Upgrade to Standard for 3' : isUnlimited(limits.branches) ? 'Unlimited branches' : `${Math.max(0, limits.branches - branchesCount)} remaining`}
                </p>
              </div>

              {/* Staff IDs */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5"><Users size={14} className="text-rose-600" /> Staff IDs</span>
                  <span className="font-mono text-slate-900">
                    {limits.staffIds === 0 ? 'Not Included' : `${staffCount} / ${formatLimit(limits.staffIds)}`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      limits.staffIds === 0 ? 'bg-gray-300 w-0' : isUnlimited(limits.staffIds) ? 'bg-purple-600 w-1/4' : (staffCount >= limits.staffIds ? 'bg-red-500' : 'bg-rose-600')
                    }`}
                    style={{ width: limits.staffIds === 0 ? '0%' : isUnlimited(limits.staffIds) ? '25%' : `${Math.min(100, (staffCount / Math.max(1, limits.staffIds)) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {limits.staffIds === 0 ? 'Included in Premium (25) & Enterprise' : isUnlimited(limits.staffIds) ? 'Unlimited staff IDs' : `${Math.max(0, limits.staffIds - staffCount)} remaining`}
                </p>
              </div>
            </div>
          </div>

          {/* ─── 3. ANNUAL PRICING PLANS & UPGRADE/DOWNGRADE CARDS ────────── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Available Annual Subscription Tiers</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select a plan to upgrade, renew, or transition your company account.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrent = plan.slug === currentPlanSlug;
                const targetIndex = PLAN_HIERARCHY.indexOf(plan.slug as any);
                const isUpgrade = targetIndex > currentPlanIndex;
                const isDowngrade = targetIndex < currentPlanIndex;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl p-5 border transition-all flex flex-col justify-between relative bg-white ${
                      isCurrent && subState.isPaidActive
                        ? 'border-emerald-500 ring-2 ring-emerald-50 shadow-md'
                        : plan.recommended
                        ? 'border-blue-500 shadow-md ring-2 ring-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan.badge && (
                      <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-sm ${
                        isCurrent ? 'bg-emerald-600' : plan.recommended ? 'bg-blue-600' : 'bg-slate-800'
                      }`}>
                        {isCurrent ? 'ACTIVE PLAN' : plan.badge}
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="text-center pt-1">
                        <h4 className="text-base font-bold text-gray-900">{plan.name}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5 min-h-[32px]">{plan.bestFor}</p>
                      </div>

                      <div className="text-center py-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="text-2xl font-extrabold text-gray-900">
                          ₹{plan.price.toLocaleString('en-IN')}
                          <span className="text-xs text-slate-500 font-normal"> /yr</span>
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                          ~₹{plan.dailyEquivalent}/day <span className="text-gray-400 font-normal">(₹{plan.monthlyEquivalent}/mo)</span>
                        </div>
                      </div>

                      <ul className="space-y-1.5 text-xs text-gray-600 pt-2">
                        {plan.features.slice(0, 5).map((feature, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100">
                      {isCurrent && subState.isPaidActive ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleOpenPlanChange(plan, 'renewal')}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw size={13} /> Renew Active Plan
                          </button>
                        </div>
                      ) : isUpgrade ? (
                        <button
                          onClick={() => handleOpenPlanChange(plan, 'upgrade')}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1"
                        >
                          Upgrade to {plan.name} <ArrowRight size={13} />
                        </button>
                      ) : isDowngrade ? (
                        <button
                          onClick={() => handleOpenPlanChange(plan, 'downgrade')}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                        >
                          Transition to {plan.name}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenPlanChange(plan, 'renewal')}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          Activate {plan.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── 4. PAYMENT RECEIPTS & TAX INVOICES TABLE ─────────────────── */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  <span>Payment Receipts &amp; Tax Invoices</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Official GST-compliant tax invoices with logo, registered address, start date, ending date, and payment confirmation.
                </p>
              </div>
              {(subState.isPaidActive || (payments && payments.length > 0)) && (
                <button
                  onClick={() => handleDownloadReceipt()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  <Download size={14} />
                  <span>Download Latest Receipt (PDF)</span>
                </button>
              )}
            </div>

            {payments && payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2.5 px-3">Receipt / Order ID</th>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Official Slogan</th>
                      <th className="py-2.5 px-3">Validity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((pay: any) => {
                      const payPlan = SUBSCRIPTION_PLANS.find(p => p.slug === pay.plan) || currentPlan;
                      const payDate = pay.createdAt ? (toDate(pay.createdAt) || new Date()) : new Date();
                      const payEnd = subState.subscriptionEndDate || new Date(payDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                      const displaySlogan = pay.sloganText || 'Pay. Publish. Grow.';
                      return (
                        <tr key={pay.id || pay.orderId} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-gray-900">
                            {pay.orderId || pay.paymentId || 'PAY-REF'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-900">
                            {pay.planName || payPlan.name}
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-900">
                            ₹{(pay.amount || payPlan.price).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-blue-900 font-medium italic max-w-[220px] truncate" title={displaySlogan}>
                            &ldquo;{displaySlogan}&rdquo;
                          </td>
                          <td className="py-3 px-3 text-gray-600 text-[11px]">
                            {payDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {payEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                              PAID
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDownloadReceipt(pay)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            >
                              <Download size={12} />
                              <span>PDF</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs">
                No verified payment transactions found for this company yet.
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── 5. PLAN CHANGE CONFIRMATION MODAL (SECTION 10) ─────────────── */}
      {planChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {planChangeModal.type === 'renewal' ? (
                  <>
                    <RefreshCw size={18} className="text-emerald-600" />
                    <span>Renew {planChangeModal.plan.name} Plan</span>
                  </>
                ) : planChangeModal.type === 'upgrade' ? (
                  <>
                    <Sparkles size={18} className="text-blue-600" />
                    <span>Upgrade to {planChangeModal.plan.name} Plan</span>
                  </>
                ) : (
                  <>
                    <Info size={18} className="text-amber-600" />
                    <span>Switch to {planChangeModal.plan.name} Plan</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setPlanChangeModal(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Price & Transition Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Plan:</span>
                <strong className="text-gray-900">{planChangeModal.currentPlan.name} (₹{planChangeModal.currentPlan.price}/yr)</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target Plan:</span>
                <strong className="text-blue-700">{planChangeModal.plan.name} (₹{planChangeModal.plan.price}/yr)</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-gray-800">Billing Amount:</span>
                <strong className="text-base text-gray-900 font-extrabold">₹{planChangeModal.plan.price.toLocaleString('en-IN')} /year</strong>
              </div>
            </div>

            {/* Terms & Usage Handling Notice */}
            <div className="rounded-2xl p-4 bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-blue-950">
                <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                Data Preservation &amp; Quota Policy:
              </p>
              {planChangeModal.type === 'upgrade' ? (
                <p className="text-[11px] leading-relaxed text-blue-900">
                  Upgrading takes effect immediately upon payment. All existing listings and company data are preserved, and your higher resource limits (active jobs, catalogue items, templates, and branches) unlock instantly.
                </p>
              ) : planChangeModal.type === 'downgrade' ? (
                <p className="text-[11px] leading-relaxed text-blue-900">
                  <strong>Zero data loss guarantee:</strong> All your existing active jobs, products, and services will remain safe and active. When creating new content, the lower plan limits will apply.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-blue-900">
                  Renewing extends your active subscription for 1 full year from your current expiry date with uninterrupted service access and receipt generation.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlanChangeModal(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPlanChange}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. CHECKOUT MODAL ─────────────────────────────────────────── */}
      {selectedPlan && (
        <PaymentCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plan={selectedPlan}
          companyId={companyId}
          companyName={company?.name}
          companyAddress={company?.address}
          companyPhone={company?.phone}
          companyGst={company?.gstNumber}
          company={company}
          onSuccess={() => {
            refreshSubs?.();
            toast.success('🎉 Subscription Updated Successfully!');
          }}
        />
      )}
    </div>
  );
}
