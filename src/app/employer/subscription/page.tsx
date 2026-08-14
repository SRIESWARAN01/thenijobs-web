'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Crown, ChevronRight, Loader2, Sparkles, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

export default function EmployerSubscriptionPage() {
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

  const activeSub = subscriptions[0];
  const currentPlanSlug = activeSub ? activeSub.plan : (company?.subscriptionPlan || 'free');
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.slug === currentPlanSlug) || SUBSCRIPTION_PLANS[0];

  const loading = companyLoading || subLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center font-sans">
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
    <div className="p-4 sm:p-6 space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>Portal Subscription</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage and monitor your employer subscription and plan benefits</p>
      </div>

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

            {/* Link to change plans */}
            <div className="pt-4 border-t border-gray-100">
              <Link
                href="/employer/billing"
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                Change Subscription Plan <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Usage Stats details */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Features Included in {currentPlan.name} Plan</h3>
            <div className="space-y-2 text-xs">
              {currentPlan.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span className="text-gray-700 font-medium">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
