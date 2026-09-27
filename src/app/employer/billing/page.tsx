'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { CreditCard, Check, ShieldCheck, Zap, Shield, Crown, Building2, Loader2, Star, Sparkles, ArrowRight, MessageCircle, PhoneCall, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS, SITE_CONTACT } from '@/lib/constants';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';
import { PageHeader } from '@/components/dashboard';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

export default function EmployerBillingPage() {
  const { user } = useAuth();
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
                </div>
              </div>

              <div className="flex items-center gap-3">
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
              </div>
            </div>
          </div>

          {/* Trial Expired Alert Banner */}
          {subState.isTrialExpired && !subState.isPaidActive && (
            <div className="rounded-3xl p-6 bg-red-50 border border-red-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-950">Your 15-Day Free Trial Has Ended</h3>
                  <p className="text-xs text-red-700 mt-0.5">
                    Select any plan below to reactivate your employer services, post jobs, and bring your company website back online.
                  </p>
                </div>
              </div>
              <a
                href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(`Hi THENIJOBS Support, my company "${company?.name || 'Company'}" 15-day free trial has ended. I need assistance with plan activation.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <MessageCircle size={15} />
                <span>WhatsApp Support</span>
              </a>
            </div>
          )}

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
                    {isCurrent ? (
                      <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-slate-500 text-xs font-bold cursor-default">
                        Plan Active
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenCheckout(plan)}
                        className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Upgrade to {plan.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
                href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(`Hello THENIJOBS Support, I have a question regarding employer subscription plans for "${company?.name || 'my business'}".`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <MessageCircle size={16} />
                <span>Chat on WhatsApp</span>
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
          onSuccess={() => {
            refresh?.();
          }}
        />
      )}
    </div>
  );
}
