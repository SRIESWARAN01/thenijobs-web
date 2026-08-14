'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { hasFeaturePermission, getRequiredPlanForFeature, FeatureGateKey } from '@/lib/plans';

interface FeatureGateProps {
  planSlug: string | undefined;
  feature: FeatureGateKey;
  featureTitle?: string;
  featureDescription?: string;
  children: React.ReactNode;
  fallbackMode?: 'card' | 'inline' | 'modal' | 'hidden';
}

export default function FeatureGate({
  planSlug,
  feature,
  featureTitle = 'Upgrade Plan to Unlock Feature',
  featureDescription = 'This feature is available on higher subscription tiers for local businesses.',
  children,
  fallbackMode = 'card',
}: FeatureGateProps) {
  const isAllowed = hasFeaturePermission(planSlug, feature);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallbackMode === 'hidden') {
    return null;
  }

  const requiredPlan = getRequiredPlanForFeature(feature);

  if (fallbackMode === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
        <Lock size={13} className="text-amber-600 shrink-0" />
        <span>Requires <strong>{requiredPlan.name} Plan</strong> (₹{requiredPlan.price}/yr)</span>
        <Link href="/employer/billing" className="ml-1 text-blue-600 hover:underline flex items-center gap-0.5">
          Upgrade <ArrowRight size={10} />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-sm text-center max-w-lg mx-auto my-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
        <Lock size={26} />
      </div>

      <div>
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold mb-2">
          <Sparkles size={13} /> {requiredPlan.name} Feature
        </div>
        <h3 className="text-lg font-bold text-gray-900 font-sans">{featureTitle}</h3>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">{featureDescription}</p>
      </div>

      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
        Upgrade to <strong className="text-gray-900">{requiredPlan.name} Plan</strong> for just <strong className="text-emerald-600">₹{requiredPlan.price}/year</strong> (equivalent to ₹{Math.round(requiredPlan.price / 12)}/month).
      </div>

      <Link
        href="/employer/billing"
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md"
      >
        Upgrade to {requiredPlan.name} <ArrowRight size={16} />
      </Link>
    </div>
  );
}
