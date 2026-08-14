'use client';

import { Check, Star, Award, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';

const BENEFITS = [
  'Featured profile badge shown to employers first',
  'Direct WhatsApp chat links with verified employers',
  'Priority application review (marked as Premium Candidate)',
  'Unlimited active job alerts (Free is limited to 2)',
  'AI Coach mock interviews',
  'Resume rating and keyword suggestions'
];

export default function SeekerSubscriptionPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  // Fetch seekerProfile to see if they have any active subscription
  const { data: profile, loading } = useDocument<any>('seekerProfiles', uid);

  const isPremium = profile?.isPremium === true;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-gray-900">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading plan details...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto font-outfit text-gray-900">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto py-4">
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="text-sm text-gray-400 mt-2">Accelerate your job search and stand out to top employers in Theni</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        {/* Free Plan */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between border-gray-100 bg-white/[0.01]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Basic Tier</span>
              {!isPremium && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.08] text-gray-300 font-bold uppercase">
                  Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">Free Plan</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">₹0</span>
              <span className="text-xs text-gray-500">/ forever</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Essential features to search and apply to local jobs.</p>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-gray-300">
                <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>Apply to standard local jobs</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-300">
                <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>Basic profile and resume upload</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-300">
                <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                <span>Up to 2 active job alerts</span>
              </div>
            </div>
          </div>
          <button
            disabled
            className="w-full mt-8 py-3 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-400 cursor-not-allowed"
          >
            {isPremium ? 'Downgrade' : 'Current Plan'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between border-emerald-200 bg-gradient-to-b from-emerald-500/5 to-transparent relative overflow-hidden">
          <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Popular
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <Zap size={12} /> Pro Seeker
              </span>
              {isPremium && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-200 font-bold uppercase">
                  Active
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">Premium Candidate</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-white">₹199</span>
              <span className="text-xs text-gray-500">/ 3 months</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">Get noticed by recruiters, unlock direct chats, and boost your job search.</p>

            <div className="mt-6 space-y-3">
              {BENEFITS.map((b, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            disabled={isPremium}
            className="w-full mt-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Star size={12} />
            {isPremium ? 'Active Plan' : 'Upgrade Now'}
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[
          { icon: Award, title: 'Verified Jobs Only', desc: 'Every employer is manually checked' },
          { icon: Star, title: 'Job Matching', desc: 'Get matched with high quality openings' },
          { icon: Zap, title: 'Instant Delivery', desc: 'WhatsApp and SMS alerts' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-card rounded-2xl p-4 flex items-center gap-3 border-white/[0.04] bg-white/[0.01]">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
                <Icon size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900">{item.title}</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
