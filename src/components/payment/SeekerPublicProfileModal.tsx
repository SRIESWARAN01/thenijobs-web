'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SEEKER_PUBLIC_PROFILE_FEE_INR } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';

interface SeekerPublicProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  userEmail?: string;
  onActivated?: () => void;
}

// Same dynamic-load pattern as PaymentCheckoutModal.tsx -- duplicated rather than shared since
// it's a small, self-contained helper and this component intentionally does not reuse that
// modal's client-driven verify flow (see the header comment on the webhook route for why).
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const WEBHOOK_WAIT_TIMEOUT_MS = 30000;

/**
 * SEEKERPRIVACY-1 — unlike PaymentCheckoutModal.tsx, this never calls /api/payment/verify.
 * Activation (isPortfolioPublic + publicProfilePaidUntil) happens exclusively via the real
 * server-to-server Razorpay webhook in ../../app/api/payment/seeker-public-profile/webhook,
 * independent of this browser tab. After the Razorpay popup reports a client-side success, this
 * component only WATCHES seekerProfiles/{userId} (a live Firestore listener, permitted by the
 * existing owner-read rule) for the webhook's own write to land — it never asserts success on
 * the client's own say-so.
 */
export default function SeekerPublicProfileModal({
  isOpen,
  onClose,
  userId,
  userName,
  userEmail,
  onActivated,
}: SeekerPublicProfileModalProps) {
  const toast = useToast();
  const [state, setState] = useState<'ready' | 'processing' | 'waiting' | 'success' | 'failed'>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastPaymentId, setLastPaymentId] = useState('');
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setState('ready');
      setErrorMessage('');
      setLastPaymentId('');
      loadRazorpayScript();
    }
    return () => {
      unsubscribeRef.current?.();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const waitForActivation = (paymentId: string) => {
    setState('waiting');
    setLastPaymentId(paymentId);

    unsubscribeRef.current = onSnapshot(doc(db, 'seekerProfiles', userId), (snap) => {
      const data = snap.data();
      const paidUntil = data?.publicProfilePaidUntil?.toMillis?.() ?? null;
      if (data?.isPortfolioPublic === true && paidUntil && paidUntil > Date.now()) {
        unsubscribeRef.current?.();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setState('success');
        toast.success('🎉 Your profile is now public!', 'Anyone with the link can view your portfolio for the next year.');
        onActivated?.();
      }
    }, (err) => {
      console.error('[Seeker Public Profile] activation listener error:', err);
    });

    timeoutRef.current = setTimeout(() => {
      unsubscribeRef.current?.();
      // The payment genuinely captured (Razorpay's own popup confirmed it) -- this is not a
      // failure, just a slower-than-usual webhook delivery. Never claim success that hasn't
      // actually landed in Firestore yet.
      setState('failed');
      setErrorMessage(
        `Your payment was received but activation is taking longer than expected. It will complete automatically shortly — reopen this page in a minute, or contact support with payment ID ${paymentId} if it doesn't.`,
      );
    }, WEBHOOK_WAIT_TIMEOUT_MS);
  };

  const handlePay = async () => {
    setState('processing');
    setErrorMessage('');

    try {
      const orderRes = await fetch('/api/payment/seeker-public-profile/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate payment order with gateway.');
      }

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !(window as any).Razorpay) {
        setState('failed');
        setErrorMessage('The secure payment window could not be opened. This is usually an ad blocker or a network restriction. Please disable it or try another network — no money has been debited.');
        return;
      }

      const options = {
        key: orderData.key,
        amount: Math.round(SEEKER_PUBLIC_PROFILE_FEE_INR * 100),
        currency: 'INR',
        name: 'THENIJOBS',
        description: 'Public Profile — 1 Year Access',
        image: '/logo.png',
        order_id: orderData.orderId,
        prefill: {
          name: userName || 'THENIJOBS Seeker',
          email: userEmail || '',
        },
        theme: { color: '#10B981', backdrop_color: 'rgba(15, 23, 42, 0.75)' },
        modal: {
          ondismiss: function () {
            setState('failed');
            setErrorMessage('Payment window was closed or cancelled. No funds were debited.');
          },
        },
        handler: function (response: any) {
          if (!response?.razorpay_payment_id) {
            setState('failed');
            setErrorMessage('The gateway returned an incomplete confirmation. If money was debited, contact support — do not pay again.');
            return;
          }
          // Deliberately not calling /api/payment/verify here — see the file header comment.
          // The popup reporting success only means Razorpay captured the payment; activation
          // still waits for the real webhook to land.
          waitForActivation(response.razorpay_payment_id);
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setState('failed');
        setErrorMessage(response.error?.description || 'Payment transaction was declined by bank/UPI.');
      });
      rzp.open();
    } catch (err: any) {
      console.error('[Seeker Public Profile] payment error:', err);
      setState('failed');
      setErrorMessage(err.message || 'Payment initiation failed. Please check your internet connection.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-200 animate-fade-in"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <span className="font-black text-sm text-slate-900">Make Your Profile Public</span>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {state === 'ready' && (
            <>
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white border-2 border-emerald-200 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Public Profile Access</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-gray-900">₹{SEEKER_PUBLIC_PROFILE_FEE_INR}</span>
                  <span className="text-xs text-gray-500 font-semibold">/ 1 year</span>
                </div>
                <p className="text-xs text-gray-600">Anyone with the link can view your portfolio at thenijobs.com/portfolio/seeker/… for the next year.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                <p className="text-[11px] text-gray-500">Secure Razorpay checkout. Your profile activates automatically once payment is confirmed — usually within seconds.</p>
              </div>
              <button
                onClick={handlePay}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Lock size={15} /> <span>Pay ₹{SEEKER_PUBLIC_PROFILE_FEE_INR} & Go Public</span> <ArrowRight size={15} />
              </button>
            </>
          )}

          {state === 'processing' && (
            <div className="py-10 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-900">Connecting to Razorpay...</p>
            </div>
          )}

          {state === 'waiting' && (
            <div className="py-10 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-900">Payment received — activating your public profile...</p>
              <p className="text-xs text-gray-500">This usually takes just a few seconds.</p>
            </div>
          )}

          {state === 'success' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-sm font-bold text-gray-900">Your profile is now public!</p>
              <p className="text-xs text-gray-500">Active for the next 1 year.</p>
              <button onClick={onClose} className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors">
                Done
              </button>
            </div>
          )}

          {state === 'failed' && (
            <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-3">
              <AlertCircle size={26} className="text-amber-600 mx-auto" />
              <p className="text-xs text-amber-900">{errorMessage}</p>
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors">
                  Close
                </button>
                {!lastPaymentId && (
                  <button onClick={handlePay} className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                    <RefreshCw size={13} /> Retry
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
