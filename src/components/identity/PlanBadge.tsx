'use client';

import { Shield, Award, Star, Diamond, CheckCircle, Clock } from 'lucide-react';
import type { PlanTier } from '@/lib/types/portfolio';
import { PLAN_BADGES } from '@/lib/types/portfolio';

interface PlanBadgeProps {
  plan: PlanTier | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  isVerified?: boolean;
  verificationStatus?: string;
  showVerificationState?: boolean;
}

export function getPlanBadgeInfo(
  plan: string | undefined,
  isVerified?: boolean,
  verificationStatus?: string
) {
  const normalizedPlan = (plan || 'free').toLowerCase() as PlanTier;
  const badgeDef = PLAN_BADGES.find(b => b.plan === normalizedPlan) || PLAN_BADGES[0];

  // A paid plan subscription alone does NOT imply legal admin verification
  const isLegallyVerified = isVerified === true || verificationStatus === 'verified';
  const isPending = verificationStatus === 'pending' || verificationStatus === 'pending_admin_approval';

  let displayLabel = badgeDef.label;
  if (!isLegallyVerified) {
    if (normalizedPlan === 'basic') displayLabel = isPending ? 'Basic Member · Verification Pending' : 'Basic Member';
    else if (normalizedPlan === 'standard') displayLabel = isPending ? 'Silver Member · Verification Pending' : 'Silver Member';
    else if (normalizedPlan === 'premium') displayLabel = isPending ? 'Gold Member · Verification Pending' : 'Gold Member';
    else if (normalizedPlan === 'enterprise') displayLabel = isPending ? 'Platinum Corporate · Verification Pending' : 'Platinum Corporate';
    else displayLabel = 'Free Member';
  }

  return {
    ...badgeDef,
    isLegallyVerified,
    isPending,
    displayLabel,
  };
}

export default function PlanBadge({
  plan,
  size = 'md',
  showLabel = true,
  isVerified,
  verificationStatus,
  showVerificationState = false,
}: PlanBadgeProps) {
  const badgeInfo = getPlanBadgeInfo(plan, isVerified, verificationStatus);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2 font-bold',
  }[size];

  const label = showVerificationState ? badgeInfo.displayLabel : badgeInfo.label;

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold shadow-xs transition-all ${sizeClasses}`}
      style={{
        background: badgeInfo.bgColor,
        color: badgeInfo.color,
        border: `1px solid ${badgeInfo.borderColor}`,
      }}
      title={badgeInfo.isLegallyVerified ? 'Admin-Verified Business' : 'Subscription Tier (Verification Pending Review)'}
    >
      <span>{badgeInfo.emoji}</span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
