'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Crown, Zap, Check, Loader2, Sparkles, AlertCircle, ArrowRight, Building2 } from 'lucide-react';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';
import { useToast } from '@/hooks/useToast';
import { YEARLY_SUBSCRIPTION_PLANS, type VisibleSubscriptionPlanSlug } from '@/lib/subscriptions';

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: VisibleSubscriptionPlanSlug;
  audience: 'seeker' | 'employer' | 'business';
  companyId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onUpgradeComplete?: () => void;
  initialPlan?: 'basic' | 'premium' | 'enterprise';
}

const planMeta = {
  basic: {
    icon: Zap,
    gradient: 'from-cyan-500 to-blue-600',
    glowColor: 'rgba(6, 182, 212, 0.3)',
    borderActive: 'border-cyan-500/50',
    bgActive: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-300',
  },
  premium: {
    icon: Crown,
    gradient: 'from-amber-500 to-rose-500',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    borderActive: 'border-amber-500/50',
    bgActive: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-300',
  },
  enterprise: {
    icon: Building2,
    gradient: 'from-violet-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.3)',
    borderActive: 'border-violet-500/50',
    bgActive: 'bg-violet-500/10',
    textColor: 'text-violet-400',
    badgeColor: 'bg-violet-500/20 text-violet-300',
  },
};

export default function UpgradePlanDialog({
  open,
  onOpenChange,
  currentPlan = 'free',
  audience,
  companyId,
  userName,
  userEmail,
  userPhone,
  onUpgradeComplete,
  initialPlan,
}: UpgradePlanDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise'>('premium');

  useEffect(() => {
    if (open && initialPlan) {
      setSelectedPlan(initialPlan);
    }
  }, [open, initialPlan]);

  const { initiatePayment, isProcessing, error, success, resetState } = useRazorpayCheckout();
  const { toast } = useToast();

  const upgradePlans = YEARLY_SUBSCRIPTION_PLANS.filter(
    (p) => p.slug !== 'free' && p.slug !== currentPlan,
  );

  // If current plan is basic, show premium and enterprise. If premium, only show enterprise
  const availablePlans = upgradePlans.filter((p) => {
    if (currentPlan === 'basic') return p.slug === 'premium' || p.slug === 'enterprise';
    if (currentPlan === 'premium') return p.slug === 'enterprise';
    return true;
  });

  const handlePay = async () => {
    await initiatePayment(
      {
        planSlug: selectedPlan,
        audience: audience === 'business' ? 'employer' : audience,
        companyId,
        userName,
        userEmail,
        userPhone,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Upgrade Successful!',
            description: `You're now on the ${selectedPlan === 'enterprise' ? 'Enterprise' : selectedPlan === 'premium' ? 'Premium' : 'Standard'} plan. Enjoy your new features!`,
            variant: 'success',
          });
          onUpgradeComplete?.();
          setTimeout(() => {
            onOpenChange(false);
            resetState();
          }, 2000);
        },
        onError: (msg) => {
          toast({
            title: 'Payment Issue',
            description: msg,
            variant: 'error',
          });
        },
      },
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!isProcessing) {
      if (!open) resetState();
      onOpenChange(open);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[201] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/[0.08] bg-[#0d0d20]/95 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-xl focus:outline-none"
          aria-describedby="upgrade-plan-description"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold font-outfit text-white">
                  Upgrade Plan
                </Dialog.Title>
              </div>
            </div>
            <Dialog.Close className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>
          <p id="upgrade-plan-description" className="text-sm text-gray-400 mb-6">
            Unlock premium features with a yearly subscription
          </p>

          {/* Success State */}
          {success && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <Check size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold font-outfit text-white">Upgrade Complete!</h3>
              <p className="text-sm text-gray-400 text-center">
                Your {selectedPlan === 'premium' ? 'Premium' : selectedPlan === 'enterprise' ? 'Enterprise' : 'Basic'} plan is now active.
                <br />Enjoy your new features!
              </p>
            </div>
          )}

          {/* Plan Selection */}
          {!success && (
            <>
              <div className="space-y-3 mb-6">
                {availablePlans.map((plan) => {
                  if (plan.slug !== 'basic' && plan.slug !== 'premium' && plan.slug !== 'enterprise') return null;
                  const meta = planMeta[plan.slug];
                  const isSelected = selectedPlan === plan.slug;
                  const Icon = meta.icon;

                  return (
                    <button
                      key={plan.slug}
                      onClick={() => setSelectedPlan(plan.slug as 'basic' | 'premium' | 'enterprise')}
                      disabled={isProcessing}
                      className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? `${meta.borderActive} ${meta.bgActive}`
                          : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                      } ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 bg-gradient-to-br ${meta.gradient}`}
                        >
                          <Icon size={20} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-white text-sm">{plan.name}</span>
                            {plan.recommended && (
                              <span className="text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/10 px-2 py-0.5 text-gray-300">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1.5 mb-2">
                            <span className={`font-outfit text-2xl font-black ${meta.textColor}`}>
                              {plan.displayPrice}
                            </span>
                            <span className="text-xs text-gray-500">/ year</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            {plan.features.slice(0, 4).map((feature) => (
                              <div key={feature} className="flex items-center gap-1.5">
                                <Check size={12} className="text-emerald-400 shrink-0" />
                                <span className="text-xs text-gray-400">{feature}</span>
                              </div>
                            ))}
                            {plan.features.length > 4 && (
                              <span className="text-xs text-gray-500 ml-4">
                                +{plan.features.length - 4} more features
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border mt-1 transition-all ${
                            isSelected
                              ? `${meta.borderActive} ${meta.bgActive}`
                              : 'border-white/20'
                          }`}
                        >
                          {isSelected && (
                            <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${meta.gradient}`} />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15 mb-4">
                  <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                  <p className="text-[11px] text-rose-300">{error}</p>
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full btn-gradient py-3.5 rounded-2xl font-bold text-sm relative z-10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    Pay{' '}
                    {YEARLY_SUBSCRIPTION_PLANS.find((p) => p.slug === selectedPlan)?.displayPrice ||
                      ''}{' '}
                    / Year
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {/* Manual Payment Request */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.06]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#0d0d20] px-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const planInfo = YEARLY_SUBSCRIPTION_PLANS.find((p) => p.slug === selectedPlan);
                  const msg = [
                    `🔔 *Manual Payment Request*`,
                    ``,
                    `Plan: *${planInfo?.name || selectedPlan}*`,
                    `Amount: *${planInfo?.displayPrice || ''}* / Year`,
                    ``,
                    `Name: ${userName || 'N/A'}`,
                    `Email: ${userEmail || 'N/A'}`,
                    `Phone: ${userPhone || 'N/A'}`,
                    companyId ? `Company ID: ${companyId}` : '',
                    ``,
                    `I would like to pay via UPI / Bank Transfer.`,
                    `Please share the payment details.`,
                    ``,
                    `— via THENIJOBS`,
                  ].filter(Boolean).join('\n');
                  window.open(`https://wa.me/917094826586?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-sm font-bold text-gray-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-emerald-400" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.547 4.106 1.508 5.836L0 24l6.335-1.463A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.78 9.78 0 01-5.26-1.533l-.378-.224-3.915.905.966-3.769-.256-.396A9.777 9.777 0 012.182 12c0-5.414 4.404-9.818 9.818-9.818S21.818 6.586 21.818 12 17.414 21.818 12 21.818z" />
                </svg>
                Request Manual Payment (UPI / Bank)
              </button>

              <p className="text-[10px] text-gray-500 text-center mt-3 leading-relaxed">
                Payments processed securely via Razorpay. By proceeding, you agree to
                our terms of service. Subscription is valid for 1 year from the date of payment.
              </p>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
