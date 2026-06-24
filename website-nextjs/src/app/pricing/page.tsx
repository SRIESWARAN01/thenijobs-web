'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Crown, Shield, Zap, Sparkles, Loader2 } from 'lucide-react';
import Header from '@/components/navigation/Header';
import { YEARLY_SUBSCRIPTION_PLANS, formatPlanPeriod } from '@/lib/subscriptions';
import { useAuth } from '@/contexts/AuthContext';
import UpgradePlanDialog from '@/components/portal/UpgradePlanDialog';

const iconMap: Record<string, typeof Shield> = {
  free: Shield,
  basic: Zap,
  premium: Crown,
};

const toneMap: Record<string, string> = {
  free: 'border-slate-700/50 bg-[#0d0d20]/80 text-white',
  basic: 'border-cyan-500/30 bg-cyan-500/[0.06] text-white',
  premium: 'border-amber-500/30 bg-amber-500/[0.06] text-white',
};

const ctaMap: Record<string, string> = {
  free: 'bg-white/10 hover:bg-white/15 text-white border border-white/10',
  basic: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white',
  premium: 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white',
};

export default function PricingPage() {
  const { user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<'basic' | 'premium'>('premium');

  const handlePlanSelect = (slug: string) => {
    if (slug === 'free') return;
    setSelectedUpgrade(slug as 'basic' | 'premium');
    setUpgradeOpen(true);
  };

  // Determine audience from user role
  const audience: 'seeker' | 'employer' =
    user?.role === 'job_seeker' ? 'seeker' : 'employer';

  return (
    <main className="min-h-screen bg-[#0a0a1a] blob-bg grid-pattern">
      <Header />

      <section className="px-4 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 mb-5">
              <Sparkles size={13} className="text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Yearly Plans Only</span>
            </div>
            <h1 className="font-outfit text-4xl font-black text-white sm:text-5xl gradient-text">
              Free, Basic and Premium access
            </h1>
            <p className="mt-4 text-base font-semibold leading-7 text-gray-400">
              THENIJOBS subscriptions run on a yearly model. Paid features unlock only for users with an active plan.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {YEARLY_SUBSCRIPTION_PLANS.map((plan) => {
              const Icon = iconMap[plan.slug] || Shield;
              return (
                <article
                  key={plan.slug}
                  className={`relative rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${toneMap[plan.slug]}`}
                >
                  {plan.recommended && (
                    <span className="absolute right-5 top-5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-1 text-[10px] font-black uppercase text-white shadow-lg">
                      Recommended
                    </span>
                  )}
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    plan.slug === 'premium'
                      ? 'bg-gradient-to-br from-amber-500 to-rose-500'
                      : plan.slug === 'basic'
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600'
                        : 'bg-white/10'
                  }`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <h2 className="mt-5 text-xl font-black">{plan.name}</h2>
                  <p className="mt-1 text-sm font-semibold text-gray-400">{plan.bestFor}</p>
                  <div className="mt-6">
                    <span className="font-outfit text-4xl font-black gradient-text">{plan.displayPrice}</span>
                    <span className="ml-2 text-sm font-bold text-gray-500">/ {plan.durationLabel}</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-500">{plan.statusLabel}</p>

                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm font-semibold">
                        <Check size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 text-sm font-semibold">
                    <div className="flex justify-between text-gray-300">
                      <span>Active jobs</span>
                      <span>{plan.maxActiveJobs}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-gray-300">
                      <span>Job alerts</span>
                      <span>{plan.maxJobAlerts}</span>
                    </div>
                    <div className="mt-2 flex justify-between text-gray-300">
                      <span>Billing</span>
                      <span>{formatPlanPeriod(plan)}</span>
                    </div>
                  </div>

                  {plan.slug === 'free' ? (
                    <Link
                      href="/register"
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all ${ctaMap[plan.slug]}`}
                    >
                      Get Started <ArrowRight size={15} />
                    </Link>
                  ) : user ? (
                    <button
                      onClick={() => handlePlanSelect(plan.slug)}
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all shadow-lg cursor-pointer ${ctaMap[plan.slug]}`}
                    >
                      <Sparkles size={14} />
                      Pay Now
                      <ArrowRight size={15} />
                    </button>
                  ) : (
                    <Link
                      href="/register"
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-all shadow-lg ${ctaMap[plan.slug]}`}
                    >
                      Get Started <ArrowRight size={15} />
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {user && (
        <UpgradePlanDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          currentPlan="free"
          audience={audience}
          userName={user.displayName || undefined}
          userEmail={user.email || undefined}
          onUpgradeComplete={() => {
            window.location.reload();
          }}
        />
      )}
    </main>
  );
}

