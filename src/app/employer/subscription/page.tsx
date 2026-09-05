'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Crown, ChevronRight, Loader2, Sparkles, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';
import { PageHeader } from '@/components/dashboard';

export default function EmployerSubscriptionPage() {
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

  const activeSub = subscriptions[0];
  const currentPlanSlug = activeSub ? activeSub.plan : (company?.subscriptionPlan || 'free');
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.slug === currentPlanSlug) || SUBSCRIPTION_PLANS[0];

  const loading = companyLoading || subLoading;

  const handleOpenUpgrade = (plan: any) => {
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
          <Crown size={48} className="text-blue-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 font-sans">No Company Profile</h2>
          <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">Please register your company profile first to view subscription details.</p>
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
        title="Portal subscription"
        description="Monitor your employer subscription and plan benefits."
        breadcrumbs={[{ label: 'Employer', href: '/employer/dashboard' }, { label: 'Subscription' }]}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
          <p className="text-xs text-gray-500 font-medium">Loading subscription details...</p>
        </div>
      ) : (
        <div className="max-w-xl space-y-6">
          {/* Card detailing plan */}
          <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Crown size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {currentPlan.name} Plan
                  </h3>
                  {currentPlan.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                      {currentPlan.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentPlan.price === 0 ? 'Free Forever' : `₹${currentPlan.price}/year (~₹${currentPlan.dailyEquivalent}/day)`}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500">Subscription Status</p>
                <p className="text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Active
                </p>
              </div>
              <div>
                <p className="text-gray-500">Billing Cycle</p>
                <p className="text-gray-900 font-bold mt-0.5">{currentPlan.price === 0 ? 'Forever' : 'Annual'}</p>
              </div>
            </div>

            {/* Plan Features */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-800 mb-2">Included Benefits:</p>
              <ul className="space-y-1.5 text-xs text-gray-600">
                {currentPlan.features.map((feat: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Link to change plans */}
            <div className="pt-4 border-t border-gray-100 flex gap-2">
              <Link
                href="/employer/billing"
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold text-center hover:bg-gray-50 transition-colors"
              >
                View All Plans
              </Link>
              {currentPlanSlug === 'free' && (
                <button
                  onClick={() => handleOpenUpgrade(SUBSCRIPTION_PLANS[1])}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold text-center hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Upgrade to Basic
                </button>
              )}
            </div>
          </div>
        </div>
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
