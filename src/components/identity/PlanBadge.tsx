'use client';

import { Shield, Award, Star, Diamond } from 'lucide-react';
import type { PlanTier } from '@/lib/types/portfolio';
import { PLAN_BADGES } from '@/lib/types/portfolio';

interface PlanBadgeProps {
  plan: PlanTier | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function PlanBadge({ plan, size = 'md', showLabel = true }: PlanBadgeProps) {
  const normalizedPlan = (plan || 'free').toLowerCase() as PlanTier;
  const badge = PLAN_BADGES.find(b => b.plan === normalizedPlan) || PLAN_BADGES[0];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2 font-bold',
  }[size];

  const iconSizes = { sm: 10, md: 13, lg: 16 }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold shadow-xs transition-all ${sizeClasses}`}
      style={{
        background: badge.bgColor,
        color: badge.color,
        border: `1px solid ${badge.borderColor}`,
      }}
    >
      <span>{badge.emoji}</span>
      {showLabel && <span>{badge.label}</span>}
    </span>
  );
}
