'use client';

import { ShieldCheck } from 'lucide-react';
import { getCompanyActivePlan } from '@/lib/subscriptions';

interface MembershipBadgeProps {
  company?: any;
  plan?: string;
  size?: number;
  showTooltip?: boolean;
  /** 'icon' = just the badge icon (default), 'pill' = badge + label pill */
  variant?: 'icon' | 'pill';
}

/**
 * Plan → Badge mapping:
 *  free       → no badge shown
 *  basic      → 🟢 Green Verified Badge
 *  premium    → 🟡 Gold/Yellow Premium Verified Badge
 *  enterprise → 🔵 Blue Premium Badge (solid blue bg + white tick)
 */
export default function MembershipBadge({
  company,
  plan,
  size = 16,
  showTooltip = true,
  variant = 'icon',
}: MembershipBadgeProps) {
  const activePlan = plan || getCompanyActivePlan(company);

  // Free → no badge
  if (!activePlan || activePlan === 'free') return null;

  // ── Standard / Basic → Green Verified Badge ────────────────────────────
  if (activePlan === 'basic') {
    if (variant === 'pill') {
      return (
        <span
          title={showTooltip ? 'Standard Verified Business' : undefined}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold tracking-wide select-none"
        >
          <ShieldCheck size={11} className="fill-emerald-500/20" />
          Verified
        </span>
      );
    }
    return (
      <span
        title={showTooltip ? 'Standard Verified Business' : undefined}
        className="shrink-0 inline-flex items-center justify-center align-middle ml-1 animate-fade-in"
      >
        <ShieldCheck
          size={size}
          className="text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]"
          style={{ filter: 'drop-shadow(0 0 3px rgba(52,211,153,0.4))' }}
        />
      </span>
    );
  }

  // ── Premium → Gold/Yellow Premium Verified Badge ───────────────────────
  if (activePlan === 'premium') {
    if (variant === 'pill') {
      return (
        <span
          title={showTooltip ? 'Premium Verified Business' : undefined}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-wide select-none"
          style={{ boxShadow: '0 0 8px rgba(245,158,11,0.15)' }}
        >
          <ShieldCheck size={11} className="fill-amber-500/20" />
          Premium
        </span>
      );
    }
    return (
      <span
        title={showTooltip ? 'Premium Verified Business' : undefined}
        className="shrink-0 inline-flex items-center justify-center align-middle ml-1 animate-fade-in relative"
      >
        {/* Glow ring */}
        <span
          className="absolute inset-0 rounded-full animate-pulse"
          style={{ boxShadow: '0 0 6px 1px rgba(245,158,11,0.35)' }}
        />
        <ShieldCheck
          size={size}
          className="text-amber-400 relative z-10"
          style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.6))' }}
        />
      </span>
    );
  }

  // ── Enterprise → Blue Premium Badge (solid blue bg + white shield) ─────
  if (activePlan === 'enterprise') {
    if (variant === 'pill') {
      return (
        <span
          title={showTooltip ? 'Enterprise Verified Business' : undefined}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide select-none text-white"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
            boxShadow: '0 0 10px rgba(37,99,235,0.35)',
          }}
        >
          <ShieldCheck size={11} className="text-white" />
          Enterprise
        </span>
      );
    }
    return (
      <span
        title={showTooltip ? 'Enterprise Premium Business' : undefined}
        className="shrink-0 inline-flex items-center justify-center align-middle ml-1 animate-fade-in relative"
      >
        {/* Blue solid circle bg */}
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            boxShadow: '0 0 8px 2px rgba(59,130,246,0.45)',
            borderRadius: '50%',
            transform: 'scale(0.8)',
          }}
        />
        <ShieldCheck
          size={size}
          className="text-white relative z-10"
          strokeWidth={2.5}
          style={{ filter: 'drop-shadow(0 0 3px rgba(59,130,246,0.7))' }}
        />
      </span>
    );
  }

  return null;
}
