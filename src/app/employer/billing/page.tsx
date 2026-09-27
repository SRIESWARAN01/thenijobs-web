'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS, SITE_CONTACT } from '@/lib/constants';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';
import { PageHeader } from '@/components/dashboard';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { generatePaymentReceiptPDF, ReceiptData } from '@/lib/pdf/receiptGenerator';
import { getDeterministicBillingSlogan } from '@/lib/billing/sloganLibrary';
import { generateAdminWhatsAppContactUrl } from '@/lib/subscriptionService';
import { toDate } from '@/lib/firestoreTime';
import { useToast } from '@/contexts/ToastContext';

export default function EmployerBillingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch active subscriptions
  const { data: subscriptions, loading: subLoading, refresh } = useCollection<any>('subscriptions', [
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

  const activeSub = subscriptions[0];
  const currentPlanSlug = activeSub ? activeSub.plan : (company?.subscriptionPlan || 'free');
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.slug === currentPlanSlug) || SUBSCRIPTION_PLANS[0];
  const subState = useSubscriptionStatus(company, user);

  const loading = companyLoading || subLoading;

  const handleOpenCheckout = (plan: any) => {
    setSelectedPlan({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      dailyEquivalent: plan.dailyEquivalent,
      features: plan.features,
    });
    setIsCheckoutOpen(true);
  };

  /**
   * Generates and downloads official publication-quality A4 Tax Invoice / Payment Receipt PDF
   * including Logo, Platform & Company Address, Amount, Start Date, Ending Date, and verification details.
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

      // Extract existing slogan stored with the payment record so historical invoices never change
      let sloganText = pay?.sloganText;
      let sloganLanguage = pay?.sloganLanguage;
      let sloganId = pay?.sloganId;
      let sloganCycle = pay?.sloganCycle;

      // If historical payment predated dynamic slogan, use deterministic generator based on receipt seed
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
        // Preserved slogan
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

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 sm:space-y-6">
      <PageHeader
        title="Pricing & subscriptions"
        description="Your annual recruitment subscription and feature unlocks."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Billing' }]}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
          <p className="text-xs text-gray-500 font-medium">Loading subscription details...</p>
        </div>
      ) : (
        <>
          {/* Current Active Plan Overview Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Crown size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">{currentPlan.name} Plan Active</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      CURRENT PLAN
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {currentPlan.price === 0 ? 'Free tier account' : `₹${currentPlan.price.toLocaleString('en-IN')}/year (~₹${currentPlan.dailyEquivalent}/day)`}
                  </p>
                  {subState.isPaidActive && subState.subscriptionEndDate && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>Valid until {subState.subscriptionEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center min-w-[100px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Active Jobs</p>
                  <p className="text-base font-extrabold text-gray-900">{jobs.length}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-center min-w-[100px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Status</p>
                  <p className={`text-base font-extrabold ${subState.isPaidActive ? 'text-emerald-600' : subState.isTrialActive ? 'text-amber-600' : 'text-red-600'}`}>
                    {subState.isPaidActive ? 'Active' : subState.isTrialActive ? `Trial (${subState.trialDaysRemaining}d)` : 'Trial Expired'}
                  </p>
                </div>
                {(subState.isPaidActive || (payments && payments.length > 0)) && (
                  <button
                    onClick={() => handleDownloadReceipt()}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
                    title="Download Official Tax Invoice / Payment Receipt (PDF)"
                  >
                    <Download size={14} />
                    <span>Download Receipt (PDF)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Trial Expired Alert Banner */}
          {subState.isTrialExpired && !subState.isPaidActive && (
            <div className="rounded-3xl p-6 bg-red-50 border border-red-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                    <span>🚫</span> Trial Expired — Upgrade Required
                  </div>
                  <h3 className="text-base font-bold text-red-950">🚫 Trial Expired — Upgrade Required</h3>
                  <p className="text-xs text-red-700 mt-0.5">
                    Your 15-day free trial has expired. Select any plan below to reactivate your employer services, or contact admin directly on WhatsApp (+91 93605 19460) for instant upgrade assistance.
                  </p>
                </div>
              </div>
              <a
                href={generateAdminWhatsAppContactUrl(company)}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
              >
                <MessageCircle size={15} />
                <span>Chat Admin on WhatsApp (+91 93605 19460)</span>
              </a>
            </div>
          )}

          {/* Subscription Expiring Soon Banner — shows when < 30 days left on paid plan */}
          {subState.isPaidActive && subState.subscriptionEndDate && (() => {
            const daysLeft = Math.ceil((subState.subscriptionEndDate.getTime() - Date.now()) / 86400000);
            return daysLeft > 0 && daysLeft <= 30 ? (
              <div className="rounded-3xl p-5 bg-amber-50 border border-amber-300 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-amber-950 text-sm">⏰ Subscription Expiring in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Renew before {subState.subscriptionEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} to avoid service interruption. Contact admin on WhatsApp for instant renewal.
                    </p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(`🔄 *THENIJOBS Subscription Renewal Request*\n\nHello THENIJOBS Admin,\n\nI would like to *renew my subscription* for *"${company?.name || 'my business'}"* before it expires in ${daysLeft} days (${subState.subscriptionEndDate.toLocaleDateString('en-IN')}).\n\nPlease assist me with renewal options and payment.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all whitespace-nowrap"
                >
                  <MessageCircle size={15} />
                  Renew Now — WhatsApp Admin
                </a>
              </div>
            ) : null;
          })()}

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = plan.slug === currentPlanSlug;
              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-5 border transition-all flex flex-col justify-between relative bg-white ${
                    plan.recommended
                      ? 'border-blue-500 shadow-md ring-2 ring-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-sm">
                      {plan.badge}
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-base font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 min-h-[32px]">{plan.bestFor}</p>
                    </div>

                    <div className="text-center py-2 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="text-2xl font-extrabold text-gray-900">
                        ₹{plan.price.toLocaleString('en-IN')}
                        <span className="text-xs text-slate-500 font-normal"> /yr</span>
                      </div>
                      {plan.price > 0 && (
                        <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                          ~₹{plan.dailyEquivalent}/day
                        </div>
                      )}
                    </div>

                    <ul className="space-y-1.5 text-xs text-gray-600 pt-2">
                      {plan.features.slice(0, 5).map((feature, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-[11px]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-4 border-t border-gray-100">
                    {isCurrent && subState.isPaidActive ? (
                      <div className="space-y-2">
                        <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-slate-500 text-xs font-bold cursor-default">
                          ✅ Plan Active
                        </button>
                        {/* Quick Renew button visible on active plan card */}
                        <a
                          href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(`🔄 *Renewal Request — ${plan.name} Plan*\n\nHello THENIJOBS Admin,\n\nI want to renew my *${plan.name}* subscription for *"${company?.name || 'my business'}"*.\n\nPlease help me with renewal and payment.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle size={12} /> Contact Admin to Renew
                        </a>
                      </div>
                    ) : isCurrent ? (
                      <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-slate-500 text-xs font-bold cursor-default">
                        Plan Active
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCheckout(plan)}
                        className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                      >
                        {subState.isTrialExpired && !subState.isPaidActive ? `Reactivate with ${plan.name}` : `Upgrade to ${plan.name}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Receipts & Tax Invoices Section */}
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
                              <span>Download PDF</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : subState.isPaidActive ? (
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-gray-900">{currentPlan.name} Annual Subscription Active</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Valid from {subState.subscriptionStartDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Activation'} until {subState.subscriptionEndDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) || '1 Year'}.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadReceipt()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download size={13} />
                  <span>Download Official Receipt (PDF)</span>
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 text-center">
                <FileText size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-semibold text-gray-700">No Payment Invoices Yet</p>
                <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                  When you activate any paid plan, your official GST-compliant tax invoices with logo, registered address, start date &amp; ending date will be available here for instant download anytime.
                </p>
              </div>
            )}
          </div>

          {/* WhatsApp Support & Offline Payment Assistance Card */}
          <div className="rounded-3xl p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <MessageCircle size={26} />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  Need Help Choosing a Plan or Prefer Direct UPI / Bank Transfer?
                </h3>
                <p className="text-xs text-emerald-800 mt-1 max-w-xl leading-relaxed">
                  Our local Theni support team is available on WhatsApp to assist with instant manual activations, corporate invoices, GST billing, and plan recommendations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
              <a
                href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(
                  subState.isTrialExpired && !subState.isPaidActive
                    ? `🔄 *THENIJOBS Renewal Request*\n\nHello Admin,\n\nMy subscription for *"${company?.name || 'my business'}"* has expired. I want to *renew / reactivate* my plan.\n\nPlease help me with payment and instant activation.`
                    : `Hello THENIJOBS Support, I have a question regarding employer subscription plans for "${company?.name || 'my business'}".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <MessageCircle size={16} />
                <span>{subState.isTrialExpired && !subState.isPaidActive ? 'Request Renewal via Admin' : 'Chat on WhatsApp'}</span>
              </a>
              <a
                href={`tel:${SITE_CONTACT.phone1Raw}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-bold text-xs transition-all"
              >
                <PhoneCall size={15} />
                <span>Call Support</span>
              </a>
            </div>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {selectedPlan && (
        <PaymentCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plan={selectedPlan}
          companyId={companyId}
          companyName={company?.name}
          companyAddress={company?.address || (company?.district ? `${company.district}, Tamil Nadu` : undefined)}
          companyPhone={company?.phone}
          companyGst={company?.gstNumber}
          company={company || undefined}
          onSuccess={() => {
            refresh?.();
          }}
        />
      )}
    </div>
  );
}

