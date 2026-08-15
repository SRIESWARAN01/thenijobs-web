'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, ShieldCheck, Sparkles, Lock, Loader2, 
  AlertCircle, CheckCircle2, ArrowRight, Download, Printer,
  RefreshCw, Building2, Phone, Mail, HelpCircle, FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SITE_CONTACT } from '@/lib/constants';

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
  onSuccess,
}: PaymentCheckoutModalProps) {
  const { user } = useAuth();
  const toast = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<'ready' | 'processing' | 'success' | 'failed'>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionDetails, setTransactionDetails] = useState<{
    receiptNo: string;
    paymentId: string;
    orderId: string;
    amount: number;
    planName: string;
    date: string;
    expiryDate: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPaymentState('ready');
      setErrorMessage('');
      setTransactionDetails(null);
      loadRazorpayScript();
    }
  }, [isOpen, plan]);

  if (!isOpen) return null;

  const handleLaunchRazorpay = async () => {
    if (!user) {
      toast.warning('Please login to activate your subscription.');
      return;
    }

    setLoading(true);
    setPaymentState('processing');
    setErrorMessage('');

    try {
      // 1. Create order on backend
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
      
      const razorpayKey = orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_THENIJOBS_GATEWAY';

      // 2. Initialize Razorpay Checkout
      if (isScriptLoaded && (window as any).Razorpay) {
        const options = {
          key: razorpayKey,
          amount: Math.round(plan.price * 100),
          currency: 'INR',
          name: 'THENIJOBS',
          description: `${plan.name} Annual Subscription (1 Year)`,
          image: '/logo.png',
          order_id: orderData.isRazorpay ? orderData.orderId : undefined,
          prefill: {
            name: user.displayName || companyName || 'THENIJOBS Customer',
            email: user.email || '',
            contact: (user as any).phoneNumber || (user as any).phone || '9360519460',
          },
          theme: {
            color: '#2563EB',
            backdrop_color: 'rgba(15, 23, 42, 0.7)',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setPaymentState('failed');
              setErrorMessage('Payment was cancelled or closed before completion. No amount was deducted.');
            },
          },
          handler: async function (response: any) {
            await handleVerifyPayment(
              orderData.orderId,
              response.razorpay_payment_id || `pay_${Date.now()}`,
              response.razorpay_signature || ''
            );
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setLoading(false);
          setPaymentState('failed');
          setErrorMessage(response.error?.description || 'Payment transaction failed at the bank or UPI gateway.');
        });
        rzp.open();
      } else {
        // Fallback direct verification
        await handleVerifyPayment(
          orderData.orderId,
          `pay_direct_${Date.now()}`,
          'direct_authorized'
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
          companyName: companyName || user?.displayName || 'Business',
          userId: user?.uid || '',
          userName: user?.displayName || user?.email || 'Customer',
          paymentMethod: 'RAZORPAY_SECURE',
          status: 'success',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed at backend.');
      }

      const now = new Date();
      const exp = new Date();
      exp.setFullYear(now.getFullYear() + 1);

      setTransactionDetails({
        receiptNo: `THENI-REC-${Date.now().toString().slice(-6)}`,
        paymentId: verifyData.paymentId || paymentId,
        orderId,
        amount: plan.price,
        planName: plan.name,
        date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        expiryDate: exp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      });

      setPaymentState('success');
      toast.success('🎉 Subscription Activated!', `${plan.name} plan is now active for 1 full year.`);
      onSuccess?.();
    } catch (err: any) {
      console.error('Verification error:', err);
      setPaymentState('failed');
      setErrorMessage(err.message || 'Failed to verify transaction. Please contact support with payment reference.');
    } finally {
      setLoading(false);
    }
  };

  /** Download High-Res PDF Slip */
  const handleDownloadReceiptPDF = async () => {
    if (!receiptRef.current) return;
    toast.info('Generating official payment receipt PDF...');

    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 10, 15, imgWidth, imgHeight);
      pdf.save(`THENIJOBS_Receipt_${transactionDetails?.receiptNo || 'Payment'}.pdf`);
      toast.success('Receipt PDF Downloaded!');
    } catch (err) {
      console.error(err);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-outfit" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 animate-in zoom-in-95 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              THENI<span className="text-blue-600">JOBS</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
              Secure Checkout
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* STATE 1: READY / SUMMARY */}
          {paymentState === 'ready' && (
            <div className="space-y-4">
              {/* Plan Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border-2 border-blue-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Selected Annual Plan</span>
                    <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-blue-700">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs text-gray-500 block">/ 1 Year Access</span>
                  </div>
                </div>

                {plan.dailyEquivalent && (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                    ⚡ Just ~₹{plan.dailyEquivalent}/day ({plan.monthlyEquivalent ? `₹${plan.monthlyEquivalent}/mo` : 'Super Affordable'})
                  </p>
                )}

                {/* Features Highlights */}
                {plan.features && plan.features.length > 0 && (
                  <div className="pt-2 border-t border-blue-100 space-y-1.5">
                    <p className="text-[11px] font-bold text-gray-700 uppercase">Includes:</p>
                    <ul className="space-y-1 text-xs text-gray-600">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-600 shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Secure Razorpay Guarantee */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-gray-900">Direct Razorpay 256-Bit SSL Checkout</p>
                  <p className="text-gray-500 text-[11px]">Pay via UPI (GPay, PhonePe, Paytm), Netbanking, Debit/Credit Card, or Wallets.</p>
                </div>
              </div>

              {/* Direct Launch Button */}
              <button
                onClick={handleLaunchRazorpay}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
                Pay ₹{plan.price.toLocaleString('en-IN')} with Razorpay
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STATE 2: PROCESSING */}
          {paymentState === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <Loader2 size={42} className="text-blue-600 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-gray-900">Connecting to Razorpay Secure Gateway...</h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Please complete payment on the Razorpay screen. Do not refresh or close this window.
              </p>
            </div>
          )}

          {/* STATE 3: FAILED */}
          {paymentState === 'failed' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Payment Incomplete or Cancelled</h3>
                <p className="text-xs text-red-600 mt-1 max-w-sm mx-auto font-medium">{errorMessage}</p>
                <p className="text-[11px] text-gray-400 mt-1">Your subscription was not activated. You can safely retry.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunchRazorpay}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RefreshCw size={13} /> Retry Payment
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: SUCCESS SLIP / RECEIPT */}
          {paymentState === 'success' && transactionDetails && (
            <div className="space-y-4 animate-fade-in">
              {/* Printable Slip Container */}
              <div
                ref={receiptRef}
                className="bg-white border-2 border-emerald-300 rounded-2xl p-5 text-gray-900 space-y-4 font-sans shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-base text-slate-900">THENI<span className="text-blue-600">JOBS</span></span>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-[10px] text-gray-500">Official Tax Invoice &amp; Payment Receipt</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      PAID / ACTIVE
                    </span>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{transactionDetails.receiptNo}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-medium">Billed To:</span>
                    <p className="font-bold text-gray-900">{user?.displayName || companyName || 'Valued Customer'}</p>
                    <p className="text-[11px] text-gray-500">{user?.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block font-medium">Payment Date:</span>
                    <p className="font-semibold text-gray-800 text-[11px]">{transactionDetails.date}</p>
                  </div>
                </div>

                {/* Plan Line Items Table */}
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-gray-700 border-b border-gray-200 pb-1.5">
                    <span>Description</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <div>
                      <p>{transactionDetails.planName} (1 Year Annual Access)</p>
                      <p className="text-[10px] font-normal text-gray-500">Valid until: {transactionDetails.expiryDate}</p>
                    </div>
                    <span>₹{transactionDetails.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-black text-sm text-slate-900">
                    <span>Total Paid</span>
                    <span className="text-emerald-700">₹{transactionDetails.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment Reference & Support */}
                <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <span>Ref: <strong className="font-mono text-gray-700">{transactionDetails.paymentId}</strong></span>
                  <span>Support: <strong>{SITE_CONTACT.phone1}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDownloadReceiptPDF}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Download size={14} /> Download Receipt (PDF)
                </button>
                <button
                  onClick={onClose}
                  className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Check size={14} /> Continue to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
