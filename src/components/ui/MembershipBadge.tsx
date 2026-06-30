'use client';

import { BadgeCheck } from 'lucide-react';
import { getCompanyActivePlan } from '@/lib/subscriptions';

interface MembershipBadgeProps {
  company?: any;
  plan?: string;
  size?: number;
  showTooltip?: boolean;
}

export default function MembershipBadge({ company, plan, size = 16, showTooltip = true }: MembershipBadgeProps) {
  const activePlan = plan || getCompanyActivePlan(company);

  if (activePlan === 'free') {
    return (
      <span 
        title={showTooltip ? "Normal Member" : undefined} 
        className="shrink-0 inline-block align-middle ml-1 animate-fade-in"
      >
        <BadgeCheck size={size} className="text-slate-400 fill-slate-400/10" />
      </span>
    );
  }

  if (activePlan === 'basic') {
    // Normal Plan / Standard (Gray Badge)
    return (
      <span 
        title={showTooltip ? "Standard Normal Member" : undefined} 
        className="shrink-0 inline-block align-middle ml-1 animate-fade-in"
      >
        <BadgeCheck size={size} className="text-slate-400 fill-slate-400/10" />
      </span>
    );
  }

  if (activePlan === 'premium') {
    // Premium Plan (Blue Badge)
    return (
      <span 
        title={showTooltip ? "Premium Member" : undefined} 
        className="shrink-0 inline-block align-middle ml-1 animate-fade-in"
      >
        <BadgeCheck size={size} className="text-blue-500 fill-blue-500/10" />
      </span>
    );
  }

  if (activePlan === 'enterprise') {
    // Entrepreneur Plan (Gold Badge)
    return (
      <span className="inline-flex items-center gap-0.5 align-middle ml-1 shrink-0 animate-fade-in">
        <span title={showTooltip ? "Entrepreneur VIP Member" : undefined}>
          <BadgeCheck size={size} className="text-amber-500 fill-amber-500/10" />
        </span>
        <span className="text-xs text-amber-500 font-extrabold select-none" style={{ fontSize: size * 0.65 }} title="VIP Crown">👑</span>
      </span>
    );
  }

  return null;
}
