'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { where } from 'firebase/firestore';
import {
  CalendarClock,
  Check,
  CreditCard,
  Crown,
  Loader2,
  Shield,
  ShieldCheck,
  Zap,
  Ticket,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { createPaymentRequest } from '@/lib/firebase/firestoreService';
import {
  YEARLY_SUBSCRIPTION_PLANS,
  getDaysUntilExpiry,
  getEffectiveSubscriptionStatus,
  selectBestSubscription,
  toDate,
  type VisibleSubscriptionPlanSlug,
} from '@/lib/subscriptions';

const iconMap = {
  Shield,
  Zap,
  Crown,
};

const colorMap: Record<VisibleSubscriptionPlanSlug, string> = {
  free: 'border-white/10',
  basic: 'border-cyan-500/20',
  premium: 'border-amber-500/35 bg-gradient-to-b from-amber-500/10 to-transparent',
  enterprise: 'border-purple-500/35 bg-gradient-to-b from-purple-500/10 to-transparent',
};

function formatDate(value?: unknown) {
  const date = toDate(value);
  if (!date) return 'Not set';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const loadRazorpayScript = () => {
  return new Promise<boolean>((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function EmployerBillingPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isBusinessPortal = pathname ? pathname.startsWith('/business') : false;
  const companyProfileUrl = isBusinessPortal ? '/business/company-profile' : '/employer/company-profile';
  const [requestingPlan, setRequestingPlan] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || ''),
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const { data: subscriptions, loading: subLoading } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || ''),
  ], { skip: !companyId });

  const activeSub = selectBestSubscription(subscriptions);
  const currentPlanSlug = activeSub?.plan || 'free';
  const currentStatus = activeSub ? getEffectiveSubscriptionStatus(activeSub as any) : 'active';

  const { data: pendingRequests } = useCollection<any>('paymentRequests', [
    where('companyId', '==', companyId || ''),
    where('status', '==', 'pending'),
  ], { skip: !companyId });

  const loading = companyLoading || subLoading;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setAppliedCoupon(null);
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      const q = query(
        collection(db, 'coupons'),
        where('code', '==', couponCode.trim().toUpperCase()),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setCouponError('Invalid or inactive coupon code.');
        setCouponLoading(false);
        return;
      }
      const couponDoc = snap.docs[0];
      const couponData = couponDoc.data();

      // Check dates
      const now = new Date();
      if (couponData.validFrom && new Date(couponData.validFrom) > now) {
        setCouponError('This coupon code is not active yet.');
        setCouponLoading(false);
        return;
      }
      if (couponData.validUntil && new Date(couponData.validUntil) < now) {
        setCouponError('This coupon code has expired.');
        setCouponLoading(false);
        return;
      }

      // Check usage limits
      const usedCount = couponData.usedCount || 0;
      const usageLimit = couponData.usageLimit || 0;
      if (usedCount >= usageLimit) {
        setCouponError('This coupon code usage limit has been reached.');
        setCouponLoading(false);
        return;
      }

      setAppliedCoupon({ ...couponData, id: couponDoc.id });
      setCouponError(null);
    } catch (err) {
      console.error('Apply coupon error:', err);
      setCouponError('Failed to apply coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleUpgradeRequest = async (plan: typeof YEARLY_SUBSCRIPTION_PLANS[number]) => {
    if (!user?.uid || !companyId || plan.slug === 'free') return;
    setRequestingPlan(plan.slug);
    setRequestMessage(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setRequestMessage('Failed to load payment gateway SDK. Are you online?');
        return;
      }

      // 1. Create order in cloud functions
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('@/lib/firebase/config');
      
      const createOrderCallable = httpsCallable<{ planSlug: string; audience: string; couponCode?: string }, { orderId: string; amount: number; currency: string; keyId: string; mockMode?: boolean }>(
        functions,
        'createRazorpayOrder'
      );
      
      const orderRes = await createOrderCallable({
        planSlug: plan.slug,
        audience: 'employer',
        couponCode: appliedCoupon && appliedCoupon.applicablePlans?.includes(plan.slug) ? appliedCoupon.code : undefined
      });
      const { orderId, amount, currency, keyId, mockMode } = orderRes.data;

      // 2. Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'THENIJOBS',
        description: `Upgrade to ${plan.name} (Yearly)`,
        order_id: orderId,
        handler: async (response: any) => {
          setRequestingPlan(plan.slug);
          try {
            const verifyCallable = httpsCallable<any, { success: boolean }>(functions, 'verifyRazorpayPayment');
            const verifyRes = await verifyCallable({
              razorpay_payment_id: response.razorpay_payment_id || 'mock_pay_id',
              razorpay_order_id: response.razorpay_order_id || orderId,
              razorpay_signature: response.razorpay_signature || '',
              planSlug: plan.slug,
              audience: 'employer',
              companyId,
            });

            if (verifyRes.data?.success) {
              setRequestMessage(`Subscription upgraded to ${plan.name} successfully!`);
              window.location.reload();
            } else {
              setRequestMessage('Payment verification failed.');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            setRequestMessage('Failed to verify payment with server.');
          } finally {
            setRequestingPlan(null);
          }
        },
        prefill: {
          name: user?.displayName || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#06b6d4', // cyan color
        },
        modal: {
          ondismiss: () => {
            setRequestingPlan(null);
          }
        }
      };

      if (mockMode) {
        const confirmMock = window.confirm(`[TEST/DISCOUNT MODE] Order created: ${orderId}.\nClick OK to simulate successful payment.`);
        if (confirmMock) {
          options.handler({
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
            razorpay_order_id: orderId,
            razorpay_signature: 'mock_sig',
          });
        } else {
          setRequestingPlan(null);
        }
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }

    } catch (err: any) {
      console.error('Payment request error:', err);
      setRequestMessage(err?.message || 'Unable to process payment request.');
      setRequestingPlan(null);
    }
  };

  const handleBankTransferUpgrade = async (plan: typeof YEARLY_SUBSCRIPTION_PLANS[number]) => {
    if (!user?.uid || !companyId || plan.slug === 'free') return;

    let finalPrice = plan.price;
    let discountAmount = 0;
    const isCouponApplicable = appliedCoupon && appliedCoupon.applicablePlans?.includes(plan.slug);

    if (isCouponApplicable) {
      discountAmount = appliedCoupon.type === 'percentage'
        ? Math.round(plan.price * (appliedCoupon.value / 100))
        : appliedCoupon.value;
      finalPrice = Math.max(0, plan.price - discountAmount);
    }

    const confirmRequest = window.confirm(
      `Submit bank transfer request for ${plan.name}?\n\nPlease transfer ₹${finalPrice} to our official bank account ${isCouponApplicable ? `(Applied ${appliedCoupon.code} - Saved ₹${discountAmount})` : ''}:\n` +
      `Bank: State Bank of India\n` +
      `Account: 12345678901\n` +
      `IFSC: SBIN0001234\n` +
      `Branch: Theni Main\n\n` +
      `Click OK to submit your request. Our admins will approve your plan once payment is verified.`
    );
    if (!confirmRequest) return;

    setRequestingPlan(plan.slug);
    setRequestMessage(null);
    try {
      await createPaymentRequest({
        userId: user.uid,
        companyId,
        audience: 'employer',
        plan: plan.slug,
        planName: plan.name,
        amount: finalPrice,
        originalAmount: plan.price,
        couponCode: isCouponApplicable ? appliedCoupon.code : null,
        discountAmount: discountAmount,
        period: 'yearly',
        businessName: company?.name || 'Employer Company',
        companyName: company?.name || 'Employer Company',
        requesterName: user?.displayName || user?.email || 'Employer',
        requesterEmail: user?.email,
        requesterPhone: user?.phone || '',
      });
      setRequestMessage(`Bank transfer request for ${plan.name} submitted successfully! Awaiting admin verification.`);
    } catch (err: any) {
      console.error('Manual upgrade request error:', err);
      setRequestMessage(err?.message || 'Unable to submit request.');
    } finally {
      setRequestingPlan(null);
    }
  };

  if (!companyId && !companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-outfit text-white">
        <CreditCard size={48} className="mb-4 text-gray-500" />
        <h2 className="text-lg font-semibold text-white">No Company Profile</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          Please register your company profile first to view yearly plans and subscriptions.
        </p>
        <Link href={companyProfileUrl} className="mt-4 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-5 py-2.5 font-semibold text-white hover:opacity-90">
          Setup Company Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit text-white">
      <div>
        <h1 className="text-2xl font-bold">Yearly Pricing & Plans</h1>
        <p className="mt-1 text-sm text-gray-400">Only yearly plans are available. All upgrades are valid for 1 year.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="mb-4 animate-spin text-cyan-400" />
          <p className="text-sm text-gray-400">Loading plans...</p>
        </div>
      ) : (
        <>
          {/* Enhanced Current Plan Status Card */}
          {(() => {
            const daysLeft = activeSub ? getDaysUntilExpiry(activeSub.endDate) : null;
            const totalDays = 365;
            const progressPct = daysLeft !== null ? Math.max(0, Math.min(100, (daysLeft / totalDays) * 100)) : 100;
            const isExpired = currentStatus === 'expired';
            const isExpiringSoon = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;

            const statusStyle = isExpired
              ? { border: 'border-rose-500/20', bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Expired' }
              : isExpiringSoon
                ? { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Expiring Soon' }
                : currentStatus === 'pending_renewal'
                  ? { border: 'border-amber-500/20', bg: 'bg-amber-500/10', text: 'text-amber-300', label: 'Pending Renewal' }
                  : { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Active' };

            const progressColor = isExpired ? 'bg-rose-500' : isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500';

            return (
              <div className={`glass-card rounded-2xl border ${statusStyle.border} p-5 space-y-4`}>
                {/* Plan name + status */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statusStyle.bg}`}>
                      <CreditCard size={18} className={statusStyle.text} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Current Plan:{' '}
                        <span className="text-cyan-300">
                          {activeSub?.planName || `${currentPlanSlug[0].toUpperCase()}${currentPlanSlug.slice(1)} Plan`}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {activeSub
                          ? `Subscribed on ${formatDate(activeSub.startDate || activeSub.createdAt)}`
                          : 'Free yearly access. Upgrade for extra employer tools.'}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border ${statusStyle.border} ${statusStyle.bg} px-3 py-1 text-xs font-bold ${statusStyle.text}`}>
                    <ShieldCheck size={14} />
                    {statusStyle.label}
                  </span>
                </div>

                {/* Validity details */}
                {activeSub && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Expiry Date</p>
                      <p className="text-sm font-bold text-white mt-1">{formatDate(activeSub.endDate)}</p>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Remaining</p>
                      <p className={`text-sm font-bold mt-1 ${isExpired ? 'text-rose-400' : isExpiringSoon ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {daysLeft !== null ? (daysLeft <= 0 ? 'Expired' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''}`) : '—'}
                      </p>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Plan Type</p>
                      <p className="text-sm font-bold text-white mt-1 capitalize">{currentPlanSlug}</p>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Renewal</p>
                      <p className={`text-sm font-bold mt-1 ${isExpired ? 'text-rose-400' : 'text-gray-300'}`}>
                        {isExpired ? 'Renew Now' : 'Auto-renew'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                {activeSub && (
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                      <span>Plan validity</span>
                      <span>{daysLeft !== null && daysLeft > 0 ? `${daysLeft} of ${totalDays} days remaining` : 'Expired'}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressColor} transition-all duration-1000 ease-out`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Expired notice */}
                {isExpired && currentPlanSlug !== 'free' && (
                  <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 px-4 py-3 text-xs text-rose-300/80">
                    <p className="font-bold text-rose-300 mb-1">⚠️ Your plan has expired</p>
                    <p>Your company profile is still visible, but Premium badge, priority ranking, and featured listings have been removed. Renew below to restore all benefits instantly.</p>
                  </div>
                )}
              </div>
            );
          })()}


          {/* Coupon Input Code */}
          <div className="glass-card rounded-2xl p-5 border border-white/[0.08] bg-white/[0.01] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-outfit">
                <Ticket size={16} className="text-amber-400" /> Have a Coupon Code?
              </h3>
              <p className="text-[11px] text-gray-400">Enter coupon code below to apply discount on subscription upgrades</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ENTER COUPON CODE"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={couponLoading || !!appliedCoupon}
                  className="search-input text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 w-full sm:w-48 disabled:opacity-50"
                />
                {appliedCoupon && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400">
                    <Check size={12} className="text-emerald-400" />
                  </span>
                )}
              </div>
              
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                  className="px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-colors"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {couponLoading && <Loader2 size={12} className="animate-spin" />}
                  Apply
                </button>
              )}
            </div>
          </div>
          
          {couponError && (
            <p className="text-xs font-semibold text-rose-400">{couponError}</p>
          )}
          {appliedCoupon && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-300">
              🎉 Coupon &quot;{appliedCoupon.code}&quot; applied successfully!{' '}
              {appliedCoupon.type === 'percentage'
                ? `${appliedCoupon.value}% discount applied to applicable plans.`
                : `Flat ₹${appliedCoupon.value} discount applied to applicable plans.`
              }
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
            {YEARLY_SUBSCRIPTION_PLANS.map((plan) => {
              const Icon = iconMap[plan.icon as keyof typeof iconMap] || Shield;
              const isCurrent = plan.slug === currentPlanSlug;
              const hasPendingRequest = pendingRequests.some((request) => request.plan === plan.slug);

              // Calculate discount
              const isCouponApplicable = appliedCoupon && appliedCoupon.applicablePlans?.includes(plan.slug);
              let discountAmount = 0;
              let finalPrice = plan.price;
              if (isCouponApplicable) {
                discountAmount = appliedCoupon.type === 'percentage'
                  ? Math.round(plan.price * (appliedCoupon.value / 100))
                  : appliedCoupon.value;
                finalPrice = Math.max(0, plan.price - discountAmount);
              }

              return (
                <article
                  key={plan.slug}
                  className={`glass-card relative flex flex-col justify-between rounded-3xl border p-6 ${colorMap[plan.slug]} ${isCurrent ? 'ring-2 ring-cyan-500' : ''}`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      Current Plan
                    </span>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] text-cyan-300">
                        <Icon size={20} />
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <CalendarClock size={13} />
                        1 year
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-white font-outfit">{plan.name}</h3>
                      <div className="mt-2 flex flex-col gap-1 font-outfit">
                        {isCouponApplicable ? (
                          <>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-extrabold text-white">₹{finalPrice.toLocaleString('en-IN')}</span>
                              <span className="text-xs text-gray-500">/ year</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-gray-500 line-through">₹{plan.price.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5 uppercase tracking-wide">
                                Save ₹{discountAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold text-white">{plan.displayPrice}</span>
                            <span className="text-xs text-gray-500">/ year</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2.5 border-t border-white/[0.06] pt-4 text-xs text-gray-400 font-outfit">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check size={14} className="mt-0.5 shrink-0 text-cyan-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 border-t border-white/[0.06] pt-6">
                    {isCurrent || plan.slug === 'free' ? (
                      <button disabled className="w-full rounded-xl bg-white/[0.04] py-2.5 text-xs font-semibold text-gray-500">
                        {isCurrent ? 'Plan Active' : 'Free Included'}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpgradeRequest(plan)}
                          disabled={requestingPlan === plan.slug || hasPendingRequest}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                          {requestingPlan === plan.slug && <Loader2 size={12} className="animate-spin" />}
                          {hasPendingRequest ? 'Request Pending' : `Request ${plan.name}`}
                        </button>
                        
                        {!hasPendingRequest && (
                          <button
                            type="button"
                            onClick={() => handleBankTransferUpgrade(plan)}
                            disabled={requestingPlan === plan.slug}
                            className="mt-2.5 text-center text-[10px] text-gray-400 hover:text-cyan-400 underline w-full cursor-pointer transition-colors"
                          >
                            Pay via Manual Bank Transfer
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {requestMessage && (
            <p className="text-center text-xs font-semibold text-cyan-300">{requestMessage}</p>
          )}
        </>
      )}
    </div>
  );
}
