'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { CreditCard, Check, ShieldCheck, Zap, Shield, Crown, Building2, Loader2, Star, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

export default function EmployerBillingPage() {
  const { user } = useAuth();

  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  // 2. Fetch active subscriptions
  const { data: subscriptions, loading: subLoading } = useCollection<any>('subscriptions', [
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

  if (!companyId && !companyLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center font-sans">
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
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Pricing & Subscriptions</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your annual recruitment subscription and feature unlocks</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
          <p className="text-xs text-gray-500 font-medium">Loading subscription details...</p>
        </div>
      ) : (
        <>
          {/* Current plan status banner */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CreditCard size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Tier</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {currentPlan.name} Plan
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  {currentPlan.price === 0 ? 'Free Access' : `₹${currentPlan.price}/year (~₹${currentPlan.dailyEquivalent}/day)`}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Active Jobs: <strong className="text-gray-900">{jobs?.length || 0}</strong> posted
                </p>
              </div>
            </div>

            {activeSub && (
              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
                <ShieldCheck size={15} /> Active Subscription
              </span>
            )}
          </div>

          {/* Plans Grid (5 Tiers) */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 pt-2">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const isCurrent = currentPlan.slug === plan.slug;
              const isStandard = plan.slug === 'standard';

              return (
                <div
                  key={plan.slug}
                  className={`bg-white rounded-3xl p-5 flex flex-col justify-between border relative shadow-sm transition-all ${
                    isCurrent ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/20' : isStandard ? 'border-blue-400' : 'border-gray-100'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase">
                      Current Plan
                    </span>
                  )}
                  {plan.badge && !isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold whitespace-nowrap">
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
                        <span className="text-xs text-gray-400 font-normal"> /yr</span>
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
                      <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold cursor-default">
                        Plan Active
                      </button>
                    ) : (
                      <button
                        onClick={() => alert(`Upgrading to ${plan.name} Plan (₹${plan.price}/year). Online payment processing!`)}
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
    </div>
  );
}
