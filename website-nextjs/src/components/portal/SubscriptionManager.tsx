'use client';

import { useState } from 'react';
import {
  Crown, Zap, Shield, Calendar, Clock, ArrowUpRight,
  CreditCard, AlertTriangle, CheckCircle, Sparkles,
} from 'lucide-react';
import {
  YEARLY_PLAN_BY_SLUG,
  getEffectiveSubscriptionStatus,
  getDaysUntilExpiry,
  normalizePlanSlug,
  formatPlanPeriod,
  type VisibleSubscriptionPlanSlug,
} from '@/lib/subscriptions';
import UpgradePlanDialog from './UpgradePlanDialog';

interface SubscriptionData {
  plan?: string;
  planName?: string;
  status?: string;
  startDate?: any;
  endDate?: any;
  amount?: number;
  paymentMethod?: string;
}

interface SubscriptionManagerProps {
  subscription?: SubscriptionData | null;
  audience: 'seeker' | 'employer' | 'business';
  companyId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onRefresh?: () => void;
}

const planIcons: Record<VisibleSubscriptionPlanSlug, typeof Shield> = {
  free: Shield,
  basic: Zap,
  premium: Crown,
};

const planGradients: Record<VisibleSubscriptionPlanSlug, string> = {
  free: 'from-slate-500 to-slate-600',
  basic: 'from-cyan-500 to-blue-600',
  premium: 'from-amber-500 to-rose-500',
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' },
  pending_renewal: { label: 'Renewal Due', color: 'text-amber-400', bgColor: 'bg-amber-500/15' },
  expired: { label: 'Expired', color: 'text-rose-400', bgColor: 'bg-rose-500/15' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-500/15' },
};

function toReadableDate(value: unknown): string {
  if (!value) return '—';
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === 'object' && value !== null) {
    const ts = value as { toDate?: () => Date; seconds?: number };
    if (typeof ts.toDate === 'function') date = ts.toDate();
    else if (typeof ts.seconds === 'number') date = new Date(ts.seconds * 1000);
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  }
  if (!date || isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SubscriptionManager({
  subscription,
  audience,
  companyId,
  userName,
  userEmail,
  userPhone,
  onRefresh,
}: SubscriptionManagerProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const planSlug = normalizePlanSlug(subscription?.plan || subscription?.planName);
  const plan = YEARLY_PLAN_BY_SLUG[planSlug];
  const effectiveStatus = getEffectiveSubscriptionStatus(subscription);
  const daysLeft = getDaysUntilExpiry(subscription?.endDate);
  const Icon = planIcons[planSlug];
  const gradient = planGradients[planSlug];
  const status = statusConfig[effectiveStatus] || statusConfig.expired;
  const canUpgrade = planSlug !== 'premium';

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Plan Header */}
        <div className={`bg-gradient-to-r ${gradient} p-5 relative overflow-hidden`}>
          {/* Background decoration */}
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-md" />
          <div className="absolute -right-2 -bottom-4 h-16 w-16 rounded-full bg-white/5 blur-sm" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Icon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-outfit text-white">{plan.name}</h3>
                <p className="text-xs text-white/70">{formatPlanPeriod(plan)}</p>
              </div>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${status.bgColor} ${status.color} backdrop-blur-sm`}>
              {status.label}
            </div>
          </div>
        </div>

        {/* Plan Details */}
        <div className="p-5 space-y-4">
          {/* Renewal Warning */}
          {effectiveStatus === 'pending_renewal' && daysLeft !== null && (
            <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5">
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-300">Renewal Required</p>
                <p className="text-[11px] text-amber-400/80">
                  Your plan expires in {daysLeft} day{daysLeft === 1 ? '' : 's'}. Renew to keep your features active.
                </p>
              </div>
            </div>
          )}

          {/* Expired Warning */}
          {effectiveStatus === 'expired' && (
            <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5">
              <AlertTriangle size={16} className="text-rose-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-300">Plan Expired</p>
                <p className="text-[11px] text-rose-400/80">
                  Your subscription has expired. Upgrade to restore premium features.
                </p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar size={12} className="text-gray-500" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Start Date</span>
              </div>
              <p className="text-sm font-semibold text-white">{toReadableDate(subscription?.startDate)}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={12} className="text-gray-500" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Expires</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {toReadableDate(subscription?.endDate)}
                {daysLeft !== null && daysLeft >= 0 && (
                  <span className="text-xs text-gray-500 ml-1">({daysLeft}d)</span>
                )}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CreditCard size={12} className="text-gray-500" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Amount Paid</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {subscription?.amount ? `₹${subscription.amount}` : '₹0'}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={12} className="text-gray-500" />
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Active Jobs</span>
              </div>
              <p className="text-sm font-semibold text-white">{plan.maxActiveJobs}</p>
            </div>
          </div>

          {/* Features Summary */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3.5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Plan Features</p>
            <div className="grid grid-cols-1 gap-1.5">
              {plan.features.slice(0, 5).map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                  <span className="text-xs text-gray-300">{feature}</span>
                </div>
              ))}
              {plan.features.length > 5 && (
                <p className="text-xs text-gray-500 ml-5">+{plan.features.length - 5} more</p>
              )}
            </div>
          </div>

          {/* Upgrade Button */}
          {canUpgrade && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="w-full btn-gradient py-3 rounded-2xl font-bold text-sm relative z-10 flex items-center justify-center gap-2"
            >
              <Sparkles size={15} />
              Upgrade Plan
              <ArrowUpRight size={14} />
            </button>
          )}

          {!canUpgrade && effectiveStatus === 'active' && (
            <div className="flex items-center justify-center gap-2 py-2.5">
              <Crown size={14} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400">You&apos;re on the highest plan</span>
            </div>
          )}
        </div>
      </div>

      <UpgradePlanDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={planSlug}
        audience={audience}
        companyId={companyId}
        userName={userName}
        userEmail={userEmail}
        userPhone={userPhone}
        onUpgradeComplete={() => {
          onRefresh?.();
        }}
      />
    </>
  );
}
