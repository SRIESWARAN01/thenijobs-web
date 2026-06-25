'use client';

import Link from 'next/link';
import { where } from 'firebase/firestore';
import { ChevronRight, Crown, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import {
  YEARLY_PLAN_BY_SLUG,
  getEffectiveSubscriptionStatus,
  normalizePlanSlug,
  planHasFeature,
  selectBestSubscription,
  toDate,
} from '@/lib/subscriptions';

function formatDate(value?: unknown) {
  const date = toDate(value);
  if (!date) return 'Not set';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EmployerSubscriptionPage() {
  const { user } = useAuth();

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || ''),
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const { data: subscriptions, loading: subLoading } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || ''),
  ], { skip: !companyId });

  const activeSub = selectBestSubscription(subscriptions);
  const planSlug = normalizePlanSlug(activeSub?.plan || company?.subscriptionPlan || (company?.isPremium ? 'premium' : 'free'));
  const plan = YEARLY_PLAN_BY_SLUG[planSlug];
  const currentStatus = activeSub ? getEffectiveSubscriptionStatus(activeSub as any) : 'active';
  const loading = companyLoading || subLoading;

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <Crown size={48} className="mb-4 text-gray-600" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          Please register your company profile first to view subscription details.
        </p>
        <Link href="/employer/company-profile" className="mt-4 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2.5 font-semibold text-white hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      <div>
        <h1 className="text-2xl font-bold">Portal Subscription</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your yearly employer subscription and plan benefits</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="mb-4 animate-spin text-cyan-400" />
          <p className="text-sm text-gray-400">Loading subscription details...</p>
        </div>
      ) : (
        <div className="max-w-xl space-y-6">
          <div className="glass-card rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 text-base font-bold text-white">
                  {activeSub?.planName || plan.name} <Sparkles size={14} className="text-amber-400" />
                </h3>
                <p className="mt-0.5 text-xs capitalize text-gray-400">{currentStatus.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 text-xs">
              <div>
                <p className="text-gray-500">Billing Period</p>
                <p className="mt-0.5 font-semibold text-white">Yearly</p>
              </div>
              <div>
                <p className="text-gray-500">Expiry Date</p>
                <p className="mt-0.5 font-semibold text-white">{formatDate(activeSub?.endDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment Date</p>
                <p className="mt-0.5 font-semibold text-white">{formatDate(activeSub?.paymentDate || activeSub?.startDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="mt-0.5 font-semibold text-white">{plan.displayPrice} / year</p>
              </div>
            </div>

            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <Link
                href="/employer/billing"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-xs font-semibold text-cyan-400 transition-all hover:bg-white/[0.08]"
              >
                Change Yearly Plan <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Features Included</h3>
            <div className="mt-3 space-y-2 text-xs">
              {[
                ['Direct Candidate Contact', 'direct_candidate_contact'],
                ['Premium Badge', 'premium_badge'],
                ['Lead Dashboard', 'lead_dashboard'],
              ].map(([label, feature]) => (
                <div key={feature} className="flex justify-between border-b border-white/[0.04] py-1 last:border-b-0">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-white">
                    {planHasFeature(planSlug, feature as any) ? 'Enabled' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

