'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { AI_CONNECTION_FEE_INR } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';

interface AIConnectionFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  onActivated?: () => void;
}

// Same dynamic-load pattern as SeekerPublicProfileModal.tsx -- duplicated rather than shared for
// the same reason that file gives: small, self-contained, and this component's own activation
// wait (polling, not a Firestore listener -- see below) is different enough not to warrant it.
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

const POLL_INTERVAL_MS = 2000;
const WEBHOOK_WAIT_TIMEOUT_MS = 30000;

/**
 * AI-CONNECT-1 -- unlike SeekerPublicProfileModal.tsx, this cannot watch its own target document
 * with a Firestore listener: firestore.rules denies EVERY client read of aiConnections/{uid},
 * including the owner, by design (see the rules block's own comment) -- exactly what keeps the
 * encrypted key material off the wire to any browser. So activation is confirmed by polling this
 * phase's own GET /api/ai/connections/status route instead, which already safely exposes
 * `feePaid` without ever touching encryptedKey/iv/authTag. Same principle as the precedent this
 * mirrors: never claim success on the client's own say-so, only on a server-confirmed write.
 */
export default function AIConnectionFeeModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  onActivated,
}: AIConnectionFeeModalProps) {
  const toast = useToast();
  const [state, setState] = useState<'ready' | 'processing' | 'waiting' | 'success' | 'failed'>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastPaymentId, setLastPaymentId] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setState('ready');
      setErrorMessage('');
      setLastPaymentId('');
      loadRazorpayScript();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const authedFetch = async (url: string, init?: RequestInit) => {
    const idToken = await auth.currentUser?.getIdToken();
    return fetch(url, {
      ...init,
      headers: { ...(init?.headers || {}), Authorization: idToken ? `Bearer ${idToken}` : '' },
    });
  };

  const waitForActivation = (paymentId: string) => {
    setState('waiting');
    setLastPaymentId(paymentId);

    pollRef.current = setInterval(async () => {
      try {
        const res = await authedFetch('/api/ai/connections/status');
        const data = await res.json().catch(() => null);
        if (data?.feePaid === true) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setState('success');
          toast.success('You can now connect your AI key!', 'The one-time connection fee is paid.');
          onActivated?.();
        }
      } catch (err) {
        console.error('[AI Connection Fee] status poll failed:', err);
      }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
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
      const orderRes = await authedFetch('/api/ai/connections/fee/create-order', { method: 'POST' });
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
        amount: Math.round(AI_CONNECTION_FEE_INR * 100),
        currency: 'INR',
        name: 'THENIJOBS',
        description: 'AI Key Connection — One-Time Fee',
        image: '/logo.png',
        order_id: orderData.orderId,
        prefill: {
          name: userName || 'THENIJOBS User',
          email: userEmail || '',
        },
        theme: { color: '#2563EB', backdrop_color: 'rgba(15, 23, 42, 0.75)' },
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
      console.error('[AI Connection Fee] payment error:', err);
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
          <span className="font-black text-sm text-slate-900">Connect Your Own AI Key</span>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {state === 'ready' && (
            <>
              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border-2 border-blue-200 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">One-Time Connection Fee</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-gray-900">₹{AI_CONNECTION_FEE_INR}</span>
                  <span className="text-xs text-gray-500 font-semibold">/ one-time</span>
                </div>
                <p className="text-xs text-gray-600">Pay once to unlock connecting your own OpenAI or Gemini key. Actual AI usage is billed by the provider directly to your own account, never by THENIJOBS.</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                <ShieldCheck size={20} className="text-blue-600 shrink-0" />
                <p className="text-[11px] text-gray-500">Secure Razorpay checkout. Your key connection unlocks automatically once payment is confirmed — usually within seconds.</p>
              </div>
              <button
                onClick={handlePay}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Lock size={15} /> <span>Pay ₹{AI_CONNECTION_FEE_INR} & Unlock</span> <ArrowRight size={15} />
              </button>
            </>
          )}

          {state === 'processing' && (
            <div className="py-10 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-900">Connecting to Razorpay...</p>
            </div>
          )}

          {state === 'waiting' && (
            <div className="py-10 text-center space-y-3">
              <Loader2 size={32} className="animate-spin text-blue-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-900">Payment received — unlocking your AI connection...</p>
              <p className="text-xs text-gray-500">This usually takes just a few seconds.</p>
            </div>
          )}

          {state === 'success' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <p className="text-sm font-bold text-gray-900">You can now connect your AI key!</p>
              <button onClick={onClose} className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors">
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
                  <button onClick={handlePay} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
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
