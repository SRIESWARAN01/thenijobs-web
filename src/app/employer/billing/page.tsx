'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { CreditCard, Check, ShieldCheck, Zap, Shield, Crown, Building2, Loader2, Star, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';

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
    <div className="p-4 sm:p-6 space-y-6 font-sans">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Pricing &amp; Subscriptions</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your annual recruitment subscription and feature unlocks</p>
      </div>

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
                  <p className="text-base font-extrabold text-emerald-600">Active</p>
                </div>
              </div>
            </div>
          </div>

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
