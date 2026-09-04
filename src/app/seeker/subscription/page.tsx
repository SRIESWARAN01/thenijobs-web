'use client';

import { useState } from 'react';
import { Check, Star, Award, Zap, Loader2, Crown, CheckCircle2 } from 'lucide-react';
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
  const { data: profile, loading } = useDocument<any>('seekerProfiles', uid);

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
      <div className="flex flex-col items-center justify-center py-20 font-sans">
        <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
        <p className="text-xs text-gray-500 font-medium">Loading plan details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-gray-900 animate-in fade-in">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto py-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-3 border border-blue-100">
          <Zap size={13} className="text-blue-600" /> Accelerate Your Career in Theni
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Choose Your Candidate Plan
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Accelerate your job search and stand out to 500+ verified employers in Theni &amp; Tamil Nadu
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-stretch">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl p-6 flex flex-col justify-between border border-gray-200 shadow-sm">
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
          <button
            disabled
            className="w-full mt-8 py-3 rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold text-slate-500 cursor-default"
          >
            {isPremium ? 'Standard Free Plan' : 'Current Active Plan'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-white rounded-3xl p-6 flex flex-col justify-between border-2 border-blue-500 shadow-md relative overflow-hidden ring-4 ring-blue-50">
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
          
          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={isPremium}
            className="w-full mt-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Star size={14} className="fill-current" />
            {isPremium ? 'Plan Active' : 'Upgrade to Pro — ₹199'}
          </button>
        </div>
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
            <div key={idx} className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">{item.title}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        plan={seekerPlan}
      />
    </div>
  );
}
