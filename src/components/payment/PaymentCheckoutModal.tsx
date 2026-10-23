'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, ShieldCheck, Sparkles, Lock, Loader2, 
  AlertCircle, CheckCircle2, ArrowRight, Download, Printer,
  RefreshCw, Building2, Phone, Mail, HelpCircle, FileText,
  CreditCard, Smartphone
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SITE_CONTACT } from '@/lib/constants';
import { getReceiptGrowthSlogan } from '@/lib/branding/slogans';
import { generatePaymentReceiptPDF, ReceiptData } from '@/lib/pdf/receiptGenerator';
import { getDeterministicBillingSlogan } from '@/lib/billing/sloganLibrary';

export interface PlanDetails {
  name: string;
  slug: string;
  price: number;
  dailyEquivalent?: number;
  monthlyEquivalent?: number;
  period?: string;
  features?: string[];
  badge?: string;
}

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanDetails;
  companyId?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyGst?: string;
  company?: any;
  onSuccess?: () => void;
}

// Dynamically load Razorpay SDK
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

export default function PaymentCheckoutModal({
  isOpen,
  onClose,
  plan,
  companyId,
  companyName,
  companyAddress,
  companyPhone,
  companyGst,
  company,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  const autoDownloadedRef = useRef<string | null | undefined>(null);

  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<'ready' | 'processing' | 'reconciling' | 'reconciling_manual' | 'success' | 'failed'>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionDetails, setTransactionDetails] = useState<ReceiptData | null>(null);
  const [pendingIdentifiers, setPendingIdentifiers] = useState<{ orderId: string; paymentId: string } | null>(null);
  const [reconcileAttemptCount, setReconcileAttemptCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPaymentState('ready');
      setErrorMessage('');
      setTransactionDetails(null);
      setPendingIdentifiers(null);
      setReconcileAttemptCount(0);
      autoDownloadedRef.current = null;
      loadRazorpayScript();
    }
  }, [isOpen, plan]);

  /**
   * Automatic Receipt Download:
   * When backend confirms payment and transactionDetails is set, automatically trigger the browser
   * PDF download without forcing the user to click another button (where browser policies allow).
   */
  useEffect(() => {
    if (paymentState === 'success' && transactionDetails && autoDownloadedRef.current !== transactionDetails.paymentId) {
      autoDownloadedRef.current = transactionDetails.paymentId;
      // Trigger automatic PDF generation and browser download
      generatePaymentReceiptPDF(transactionDetails)
        .then((pdf) => {
          pdf.save(`THENIJOBS_Receipt_${transactionDetails.receiptNo}.pdf`);
          toast.success('🎉 Official Receipt Downloaded Automatically!');
        })
        .catch((pdfErr) => {
          console.warn('[Payment Modal] Auto-download PDF blocked/failed (manual button available):', pdfErr);
        });
    }
  }, [paymentState, transactionDetails, toast]);

  if (!isOpen) return null;

  /**
   * Auto-polls the reconciliation endpoint when server-side database synchronization is in-flight.
   */
  const pollReconciliation = async (orderId: string, paymentId: string, maxAttempts = 6): Promise<boolean> => {
    setLoading(true);
    setPaymentState('reconciling');
    setPendingIdentifiers({ orderId, paymentId });

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setReconcileAttemptCount(attempt);
      try {
        const res = await fetch(`/api/payment/reconcile?orderId=${encodeURIComponent(orderId)}&paymentId=${encodeURIComponent(paymentId)}`, {
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          if (data.isPaid && (data.receiptData || data.payment)) {
            const resolvedReceipt: ReceiptData = data.receiptData || {
              receiptNo: `THENI-REC-${paymentId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`,
              paymentId,
              orderId,
              amount: plan.price,
              planName: plan.name,
              planSlug: plan.slug,
              date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              startDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              billedTo: companyName || company?.name || user?.displayName || 'Business Owner',
              address: companyAddress || 'Theni District, Tamil Nadu',
              phone: companyPhone || (user as any)?.phone || '',
              email: user?.email || '',
              gst: companyGst || '',
              paymentMethod: 'Razorpay 256-Bit SSL (UPI / Cards)',
              status: 'PAID / ACTIVE',
            };

            setTransactionDetails(resolvedReceipt);
            setPaymentState('success');
            toast.success('🎉 Payment Confirmed!', `${plan.name} subscription has been confirmed and activated.`);
            onSuccess?.();
            setLoading(false);
            return true;
          }
        }
      } catch (pollErr) {
        console.warn(`[Payment Modal] Reconcile poll attempt ${attempt} warning:`, pollErr);
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }

    setLoading(false);
    setPaymentState('reconciling_manual');
    return false;
  };

  const handleLaunchRazorpay = async () => {
    if (!user) {
      toast.warning('Please login to activate your subscription.');
      return;
    }

    setLoading(true);
    setPaymentState('processing');
    setErrorMessage('');

    try {
      // 1. Create secure order on backend
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug: plan.slug,
          planName: plan.name,
          amount: plan.price,
          companyId: companyId || '',
          userId: user?.uid || '',
          role: (user as any)?.role || 'employer',
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate payment order with gateway.');
      }

      // Check if Razorpay script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      const razorpayKey = orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

      // 2. Initialize Direct Razorpay Checkout Modal
      if (isScriptLoaded && (window as any).Razorpay) {
        const options = {
          key: razorpayKey,
          amount: Math.round(plan.price * 100),
          currency: 'INR',
          name: 'THENIJOBS',
          description: `${plan.name} Annual Subscription (1 Year)`,
          image: '/logo.png',
          order_id: orderData.orderId,
          prefill: {
            name: user.displayName || companyName || 'THENIJOBS Customer',
            email: user.email || '',
            contact: (user as any).phoneNumber || (user as any).phone || '9360519460',
          },
          theme: {
            color: '#2563EB',
            backdrop_color: 'rgba(15, 23, 42, 0.75)',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              // Only report cancelled if we didn't already capture/proceed to verify
              setPaymentState((current) => {
                if (current === 'processing') {
                  setErrorMessage('Payment window was closed before completion. No funds were debited.');
                  return 'failed';
                }
                return current;
              });
            },
          },
          handler: async function (response: any) {
            if (!response?.razorpay_payment_id) {
              setLoading(false);
              setPaymentState('failed');
              setErrorMessage(
                'The gateway returned an incomplete confirmation. If money was debited, contact support with your order id — do not pay again.',
              );
              return;
            }

            setPendingIdentifiers({
              orderId: orderData.orderId,
              paymentId: response.razorpay_payment_id,
            });

            await handleVerifyPayment(
              orderData.orderId,
              response.razorpay_payment_id,
              response.razorpay_signature || '',
            );
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setLoading(false);
          setPaymentState('failed');
          setErrorMessage(response.error?.description || 'Payment transaction was declined by bank/UPI.');
        });
        rzp.open();
      } else {
        setLoading(false);
        setPaymentState('failed');
        setErrorMessage(
          'The secure payment window could not be opened. This is usually caused by an ad blocker or network restriction. Please disable it or try another network — no money has been debited.',
        );
      }
    } catch (err: any) {
      console.error('Payment checkout error:', err);
      setLoading(false);
      setPaymentState('failed');
      setErrorMessage(err.message || 'Payment initiation failed. Please check your internet connection.');
    }
  };

  const handleVerifyPayment = async (orderId: string, paymentId: string, signature: string) => {
    try {
      setLoading(true);
      setPaymentState('processing');

      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature,
          planSlug: plan.slug,
          planName: plan.name,
          amount: plan.price,
          companyId: companyId || '',
          companyName: companyName || company?.name || user?.displayName || 'Business',
          companyAddress: companyAddress || (company?.district ? `${company.district}, Tamil Nadu` : undefined),
          companyPhone: companyPhone || (user as any)?.phone || '',
          companyGst: companyGst || company?.gstNumber || '',
          userId: user?.uid || '',
          userName: user?.displayName || user?.email || 'Customer',
          userEmail: user?.email || '',
          userPhone: (user as any)?.phoneNumber || (user as any)?.phone || companyPhone || '',
          paymentMethod: 'RAZORPAY_SECURE',
          status: 'success',
        }),
      });

      const verifyData = await verifyRes.json();

      // If server verified Razorpay but is synchronizing records asynchronously
      if (verifyRes.status === 202 || verifyData?.pendingReconciliation) {
        await pollReconciliation(orderId, paymentId);
        return;
      }

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed at backend.');
      }

      // If server returned pre-formatted receiptData, use it directly!
      if (verifyData.receiptData) {
        setTransactionDetails(verifyData.receiptData);
      } else {
        const now = new Date();
        const exp = new Date();
        if (plan.slug === 'seeker_pro' || plan.slug === 'seeker-premium') {
          exp.setMonth(now.getMonth() + 3);
        } else {
          exp.setFullYear(now.getFullYear() + 1);
        }

        const formattedStartDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const formattedEndDate = exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const formattedDateTime = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        const resolvedAddress = companyAddress || company?.address 
          ? `${company?.address || companyAddress}${company?.district ? ', ' + company.district : ''}, Tamil Nadu`
          : (company?.district ? `${company.district}, Tamil Nadu` : 'Theni District, Tamil Nadu');

        const assignedSlogan = verifyData?.slogan || getDeterministicBillingSlogan(orderId);

        const receiptObj: ReceiptData = {
          receiptNo: verifyData.receiptNo || `THENI-REC-${paymentId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`,
          paymentId: verifyData.paymentId || paymentId,
          orderId,
          amount: plan.price,
          planName: plan.name,
          planSlug: plan.slug,
          date: formattedDateTime,
          startDate: formattedStartDate,
          expiryDate: formattedEndDate,
          billedTo: companyName || company?.name || user?.displayName || 'Business Owner',
          address: resolvedAddress,
          phone: companyPhone || company?.phone || (user as any)?.phone || '',
          gst: companyGst || company?.gstNumber || '',
          email: user?.email || company?.email || '',
          paymentMethod: 'Razorpay (UPI / NetBanking / Cards)',
          status: 'PAID / ACTIVE',
          sloganId: assignedSlogan?.sloganId || assignedSlogan?.id,
          sloganText: assignedSlogan?.sloganText || assignedSlogan?.text,
          sloganLanguage: assignedSlogan?.sloganLanguage || assignedSlogan?.language,
          sloganCycle: assignedSlogan?.sloganCycle || assignedSlogan?.cycle || 1,
        };

        setTransactionDetails(receiptObj);
      }

      setPaymentState('success');
      toast.success('🎉 Subscription Activated!', `${plan.name} plan is active.`);
      onSuccess?.();
    } catch (err: any) {
      console.error('Verification error:', err);
      // If paymentId was received, try polling reconcile before failing!
      if (paymentId && orderId) {
        console.log('[Payment Modal] Network/verification error with paymentId present. Polling reconciliation...');
        await pollReconciliation(orderId, paymentId);
        return;
      }
      setPaymentState('failed');
      setErrorMessage(err.message || 'Failed to verify transaction. Please contact support with payment reference.');
    } finally {
      setLoading(false);
    }
  };

  /** Direct Vector jsPDF Invoice Generator (100% Reliable across all mobile & desktop browsers) */
  const generateVectorReceiptPDF = async () => {
    if (!transactionDetails) return;
    const pdf = await generatePaymentReceiptPDF(transactionDetails);
    pdf.save(`THENIJOBS_Receipt_${transactionDetails.receiptNo}.pdf`);
    toast.success('🎉 Official Receipt PDF Downloaded Successfully!');
  };

  /** Multi-Layer PDF Download */
  const handleDownloadReceiptPDF = async () => {
    generateVectorReceiptPDF();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs font-outfit" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 animate-fade-in max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-slate-900 tracking-tight">
              THENI<span className="text-blue-600">JOBS</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wide">
              Direct Checkout
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* STATE 1: READY / DIRECT SUMMARY */}
          {paymentState === 'ready' && (
            <div className="space-y-4">
              {/* Plan Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50/40 to-white border-2 border-blue-200 space-y-3 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700">Selected Annual Subscription</span>
                    <h3 className="text-2xl font-black text-gray-900 leading-tight">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-700">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-gray-500 font-semibold block">/ 1 Full Year</span>
                  </div>
                </div>

                {plan.dailyEquivalent && (
                  <p className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-xl border border-emerald-200">
                    ⚡ Just ~₹{plan.dailyEquivalent}/day ({plan.monthlyEquivalent ? `₹${plan.monthlyEquivalent}/mo` : 'Super Affordable'})
                  </p>
                )}

                {/* Features Highlights */}
                {plan.features && plan.features.length > 0 && (
                  <div className="pt-2 border-t border-blue-100 space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Includes:</p>
                    <ul className="space-y-1 text-xs text-gray-700">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Secure Razorpay Direct Guarantee */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck size={22} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-gray-900">Direct Razorpay 256-Bit SSL Gateway</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">Pay securely via UPI (GPay, PhonePe, Paytm), Netbanking, Debit/Credit Card, or Wallets.</p>
                </div>
              </div>

              {/* Direct Launch Button */}
              <button
                onClick={handleLaunchRazorpay}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                <span>Proceed to Razorpay Checkout (₹{plan.price.toLocaleString('en-IN')})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STATE 2: PROCESSING */}
          {paymentState === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
                <Loader2 size={32} className="animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Connecting to Razorpay Secure Gateway...</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Please complete the payment on the Razorpay screen. Your subscription and official tax invoice will automatically activate once confirmed.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2B: RECONCILING (Payment received, confirming DB records) */}
          {paymentState === 'reconciling' && (
            <div className="py-10 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Payment Received! Confirming with Database...</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  Your payment was verified by Razorpay. Synchronizing your subscription and generating your receipt...
                  {reconcileAttemptCount > 0 && ` (Attempt ${reconcileAttemptCount}/6)`}
                </p>
              </div>

              {pendingIdentifiers && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-left text-xs space-y-1 max-w-md mx-auto">
                  <div className="flex justify-between text-gray-600">
                    <span>Order ID:</span>
                    <strong className="font-mono text-gray-900">{pendingIdentifiers.orderId}</strong>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment ID:</span>
                    <strong className="font-mono text-blue-700">{pendingIdentifiers.paymentId}</strong>
                  </div>
                </div>
              )}

              <p className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl max-w-md mx-auto">
                ⚠️ Please do NOT close this window or pay again. Your funds have been authorized and your account is being updated.
              </p>
            </div>
          )}

          {/* STATE 2C: RECONCILING MANUAL FALLBACK */}
          {paymentState === 'reconciling_manual' && (
            <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-200 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-blue-950">Payment Confirmation In Progress</h3>
                <p className="text-xs text-blue-900 mt-1 max-w-sm mx-auto">
                  Razorpay authorized your payment, but database confirmation is taking a few extra moments. 
                  <strong> If money was debited, do not pay again.</strong>
                </p>
              </div>

              {pendingIdentifiers && (
                <div className="p-3 bg-white rounded-2xl border border-blue-100 text-left text-xs space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Order ID:</span>
                    <strong className="font-mono text-gray-900">{pendingIdentifiers.orderId}</strong>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment ID:</span>
                    <strong className="font-mono text-blue-700">{pendingIdentifiers.paymentId}</strong>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => pendingIdentifiers && pollReconciliation(pendingIdentifiers.orderId, pendingIdentifiers.paymentId)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Check Status Now
                </button>
                <a
                  href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(
                    `Hello THENIJOBS Support, my payment of ₹${plan.price} was authorized (Order ID: ${pendingIdentifiers?.orderId}, Payment ID: ${pendingIdentifiers?.paymentId}), please help confirm my subscription.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  WhatsApp Support
                </a>
              </div>
            </div>
          )}

          {/* STATE 3: FAILED / CANCELLED */}
          {paymentState === 'failed' && (
            <div className="p-6 rounded-3xl bg-red-50 border border-red-200 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-950">
                  {pendingIdentifiers?.paymentId ? 'Payment Verification Incomplete' : 'Payment Incomplete or Cancelled'}
                </h3>
                <p className="text-xs text-red-800 mt-1 max-w-sm mx-auto leading-relaxed">
                  {errorMessage || (
                    pendingIdentifiers?.paymentId
                      ? 'The payment could not be confirmed immediately. If money was debited, quote your order ID and payment ID to support — do not pay again.'
                      : 'Payment was not completed. Subscription was not activated and no amount was debited.'
                  )}
                </p>
              </div>

              {pendingIdentifiers && (
                <div className="p-3 bg-white rounded-2xl border border-red-100 text-left text-xs space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Order ID:</span>
                    <strong className="font-mono text-gray-900">{pendingIdentifiers.orderId}</strong>
                  </div>
                  {pendingIdentifiers.paymentId && (
                    <div className="flex justify-between text-gray-600">
                      <span>Payment ID:</span>
                      <strong className="font-mono text-red-700">{pendingIdentifiers.paymentId}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white border border-red-200 text-red-800 text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  Close
                </button>
                {pendingIdentifiers?.paymentId ? (
                  <button
                    onClick={() => pollReconciliation(pendingIdentifiers.orderId, pendingIdentifiers.paymentId)}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <RefreshCw size={14} /> Recheck Status
                  </button>
                ) : (
                  <button
                    onClick={handleLaunchRazorpay}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <RefreshCw size={14} /> Retry Payment
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STATE 4: SUCCESS SLIP / OFFICIAL TAX INVOICE */}
          {paymentState === 'success' && transactionDetails && (
            <div className="space-y-4 animate-fade-in">
              {/* Printable Slip Container */}
              <div
                ref={receiptRef}
                className="bg-white border-2 border-emerald-300 rounded-3xl p-5 text-gray-900 space-y-4 font-outfit shadow-sm text-xs"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center border border-blue-200 shrink-0">
                      TJ
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-base text-slate-900">THENI<span className="text-blue-600">JOBS</span></span>
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      </div>
                      <p className="text-[10px] text-gray-500">Official Tax Invoice &amp; Payment Receipt</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu - 625533</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      ✓ PAID / ACTIVE
                    </span>
                    <p className="text-[10px] text-gray-600 font-mono mt-1 font-bold">{transactionDetails.receiptNo}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{transactionDetails.date}</p>
                  </div>
                </div>

                {/* Details Grid: Billed To vs Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block font-bold uppercase tracking-wider">Billed To (Employer):</span>
                    <p className="font-bold text-gray-900 text-sm mt-0.5">{transactionDetails.billedTo}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">{transactionDetails.address}</p>
                    {transactionDetails.email && <p className="text-[10px] text-gray-500 mt-0.5">Email: {transactionDetails.email}</p>}
                    {transactionDetails.phone && <p className="text-[10px] text-gray-500">Phone: {transactionDetails.phone}</p>}
                  </div>

                  <div className="space-y-1 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Subscription Validity:</span>
                      <p className="font-bold text-blue-700 text-xs mt-0.5">{transactionDetails.planName} (1 Year)</p>
                    </div>
                    <div className="flex sm:justify-end gap-2 text-[11px]">
                      <span className="text-gray-500">Start Date:</span>
                      <strong className="text-gray-900">{transactionDetails.startDate}</strong>
                    </div>
                    <div className="flex sm:justify-end gap-2 text-[11px]">
                      <span className="text-gray-500">Ending Date:</span>
                      <strong className="text-red-600">{transactionDetails.expiryDate}</strong>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-semibold">365 Days Active Access</p>
                  </div>
                </div>

                {/* Plan Line Items Table */}
                <div className="rounded-2xl bg-white border border-gray-200 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-gray-700 border-b border-gray-200 pb-1.5 text-[11px]">
                    <span>Item &amp; Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <div>
                      <p>{transactionDetails.planName} Annual Subscription</p>
                      <p className="text-[10px] font-normal text-gray-500">
                        Validity: {transactionDetails.startDate} to {transactionDetails.expiryDate} (1 Year)
                      </p>
                    </div>
                    <span>₹{transactionDetails.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 text-xs text-gray-500">
                    <span>GST &amp; Platform Charges</span>
                    <span className="text-emerald-600 font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-black text-sm text-slate-900">
                    <span>Total Amount Paid</span>
                    <span className="text-emerald-700 font-black text-base">₹{transactionDetails.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Dynamic Unique Slogan */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-center space-y-1">
                  <p className="text-xs sm:text-sm font-bold text-blue-900 italic font-sans leading-relaxed">
                    &ldquo;{transactionDetails.sloganText || getReceiptGrowthSlogan(plan.slug, transactionDetails.receiptNo)}&rdquo;
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Thank you for choosing THENIJOBS.
                  </p>
                </div>

                {/* Payment Reference & Support */}
                <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <span>Payment Ref: <strong className="font-mono text-gray-800">{transactionDetails.paymentId}</strong></span>
                  <span>Support: <strong>{SITE_CONTACT.phone1}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDownloadReceiptPDF}
                  className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Download size={14} /> Download Receipt (PDF)
                </button>
                <button
                  onClick={onClose}
                  className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Check size={14} /> Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
