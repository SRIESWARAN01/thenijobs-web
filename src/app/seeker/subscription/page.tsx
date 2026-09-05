'use client';

import { useState } from 'react';
import { Check, Star, Award, Zap, Loader2, Crown, CheckCircle2 } from 'lucide-react';
import { Button, Card, PageHeader, PageShell, Pill } from '@/components/dashboard';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';

const BENEFITS = [
  'Featured candidate badge shown to recruiters first',
  'Direct WhatsApp chat links with verified employers',
  'Priority application review (marked as Premium Candidate)',
  'Unlimited active job alerts (Free is limited to 2)',
  'AI Coach mock interviews & resume review',
  'Instant SMS & WhatsApp alerts for high-match jobs',
];

export default function SeekerSubscriptionPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch seekerProfile to see if they have any active subscription
  const { data: profile, loading } = useDocument<{ isPremium?: boolean }>('seekerProfiles', uid);

  const isPremium = profile?.isPremium === true;

  const seekerPlan: PlanDetails = {
    name: 'Pro Candidate',
    slug: 'seeker_pro',
    price: 199,
    dailyEquivalent: 2,
    period: 'quarterly',
    features: BENEFITS,
  };

  if (loading) {
    return (
      <PageShell className="max-w-4xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="mb-4 animate-spin text-blue-600" />
          <p className="text-xs font-medium text-slate-500">Loading plan details…</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-4xl">
      <PageHeader
        title="Choose your candidate plan"
        // TRUST-2: was 'stand out to 500+ verified employers'. There were 104 verified
        // companies, and this number sits on the page that asks a job seeker to pay.
        description="Accelerate your job search and stand out to verified employers in Theni & Tamil Nadu."
        breadcrumbs={[{ label: 'Seeker', href: '/seeker/dashboard' }, { label: 'Subscription' }]}
        actions={
          <Pill tone="info">
            <Zap size={12} /> Accelerate your career in Theni
          </Pill>
        }
      />

      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        {/* Free Plan */}
        <Card className="flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Basic Tier</span>
              {!isPremium && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase">
                  Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">Free Plan</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-gray-900">₹0</span>
              <span className="text-xs text-gray-500 font-normal">/ forever</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Essential features to search and apply to local jobs.</p>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Apply to standard local jobs</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Basic profile and resume upload</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <Check size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                <span>Up to 2 active job alerts</span>
              </div>
            </div>
          </div>
          <Button variant="subtle" disabled block className="mt-8 cursor-default disabled:opacity-100">
            {isPremium ? 'Standard free plan' : 'Current active plan'}
          </Button>
        </Card>

        {/* Premium Plan */}
        <Card className="relative flex flex-col justify-between overflow-hidden border-2 border-blue-500 p-6 shadow-md ring-4 ring-blue-50">
          <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            Recommended
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                <Crown size={14} /> Pro Candidate
              </span>
              {isPremium && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                  Active Plan
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">Premium Candidate</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-gray-900">₹199</span>
              <span className="text-xs text-gray-500 font-normal">/ 3 months (~₹2/day)</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Get noticed by recruiters, unlock direct chats, and boost your job applications.</p>

            <div className="mt-6 space-y-3">
              {BENEFITS.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 font-medium">
                  <CheckCircle2 size={14} className="text-blue-600 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            block
            onClick={() => setIsCheckoutOpen(true)}
            disabled={isPremium}
            className="mt-8 border-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95"
          >
            <Star size={14} className="fill-current" aria-hidden />
            {isPremium ? 'Plan active' : 'Upgrade to Pro — ₹199'}
          </Button>
        </Card>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[
          { icon: Award, title: 'Verified Jobs Only', desc: 'Every employer is verified in Theni' },
          { icon: Star, title: 'Top Candidate Badge', desc: 'Get shown at top of employer applicant lists' },
          { icon: Zap, title: 'Instant Delivery', desc: 'WhatsApp and SMS direct alerts' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-blue-600">
                <Icon size={18} aria-hidden />
              </span>
              <span>
                <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">{item.desc}</p>
              </span>
            </Card>
          );
        })}
      </div>

      {/* Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        plan={seekerPlan}
      />
    </PageShell>
  );
}
