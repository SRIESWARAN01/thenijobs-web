'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import type { VisibleSubscriptionPlanSlug } from '@/lib/subscriptions';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutOptions {
  planSlug: 'basic' | 'premium';
  audience: 'seeker' | 'employer';
  companyId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

interface CheckoutState {
  isProcessing: boolean;
  isScriptLoaded: boolean;
  error: string | null;
  success: boolean;
}

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpayCheckout() {
  const [state, setState] = useState<CheckoutState>({
    isProcessing: false,
    isScriptLoaded: false,
    error: null,
    success: false,
  });
  const callbackRef = useRef<{
    onSuccess?: () => void;
    onError?: (msg: string) => void;
  }>({});

  // Preload the script
  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setState((s) => ({ ...s, isScriptLoaded: loaded }));
    });
  }, []);

  const initiatePayment = useCallback(
    async (options: RazorpayCheckoutOptions, callbacks?: { onSuccess?: () => void; onError?: (msg: string) => void }) => {
      callbackRef.current = callbacks || {};
      setState((s) => ({ ...s, isProcessing: true, error: null, success: false }));

      try {
        // Step 1: Load script if not already loaded
        const scriptLoaded = await loadRazorpayScript();

        // Step 2: Create Razorpay order via Cloud Function
        const createOrder = httpsCallable<
          { planSlug: string; audience: string },
          { orderId: string; amount: number; currency: string; keyId: string; mockMode: boolean }
        >(functions, 'createRazorpayOrder');

        const orderResult = await createOrder({
          planSlug: options.planSlug,
          audience: options.audience,
        });

        const { orderId, amount, currency, keyId, mockMode } = orderResult.data;

        // Step 3: If mock mode OR script failed to load, simulate payment
        if (mockMode || !scriptLoaded) {
          const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 11)}`;

          const verifyPayment = httpsCallable<
            {
              razorpay_payment_id: string;
              razorpay_order_id: string;
              razorpay_signature: string;
              planSlug: string;
              audience: string;
              companyId?: string;
            },
            { success: boolean }
          >(functions, 'verifyRazorpayPayment');

          await verifyPayment({
            razorpay_payment_id: mockPaymentId,
            razorpay_order_id: orderId,
            razorpay_signature: '',
            planSlug: options.planSlug,
            audience: options.audience,
            companyId: options.companyId,
          });

          setState((s) => ({ ...s, isProcessing: false, success: true }));
          callbackRef.current.onSuccess?.();
          return;
        }

        // Step 4: Open Razorpay checkout modal
        const rzpOptions = {
          key: keyId,
          amount,
          currency,
          name: 'THENIJOBS',
          description: `${options.planSlug === 'premium' ? 'Premium' : 'Basic'} Plan — 1 Year`,
          order_id: orderId,
          prefill: {
            name: options.userName || '',
            email: options.userEmail || '',
            contact: options.userPhone || '',
          },
          theme: {
            color: '#7c3aed',
            backdrop_color: 'rgba(10, 10, 26, 0.85)',
          },
          modal: {
            ondismiss: () => {
              setState((s) => ({ ...s, isProcessing: false, error: 'Payment was cancelled.' }));
              callbackRef.current.onError?.('Payment was cancelled.');
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              // Step 5: Verify payment via Cloud Function
              const verifyPayment = httpsCallable<
                {
                  razorpay_payment_id: string;
                  razorpay_order_id: string;
                  razorpay_signature: string;
                  planSlug: string;
                  audience: string;
                  companyId?: string;
                },
                { success: boolean }
              >(functions, 'verifyRazorpayPayment');

              await verifyPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planSlug: options.planSlug,
                audience: options.audience,
                companyId: options.companyId,
              });

              setState((s) => ({ ...s, isProcessing: false, success: true }));
              callbackRef.current.onSuccess?.();
            } catch (err: any) {
              const msg = err?.message || 'Payment verification failed. Please contact support.';
              setState((s) => ({ ...s, isProcessing: false, error: msg }));
              callbackRef.current.onError?.(msg);
            }
          },
        };

        const razorpayInstance = new window.Razorpay(rzpOptions);
        razorpayInstance.on('payment.failed', (response: any) => {
          const msg = response?.error?.description || 'Payment failed. Please try again.';
          setState((s) => ({ ...s, isProcessing: false, error: msg }));
          callbackRef.current.onError?.(msg);
        });
        razorpayInstance.open();
      } catch (err: any) {
        const msg = err?.message || 'Failed to initiate payment. Please try again.';
        setState((s) => ({ ...s, isProcessing: false, error: msg }));
        callbackRef.current.onError?.(msg);
      }
    },
    [],
  );

  const resetState = useCallback(() => {
    setState({ isProcessing: false, isScriptLoaded: state.isScriptLoaded, error: null, success: false });
  }, [state.isScriptLoaded]);

  return {
    initiatePayment,
    resetState,
    isProcessing: state.isProcessing,
    isScriptLoaded: state.isScriptLoaded,
    error: state.error,
    success: state.success,
  };
}
