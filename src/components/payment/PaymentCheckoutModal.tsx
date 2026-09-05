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
    billedTo: string;
    email: string;
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
      const razorpayKey = orderData.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_THENIJOBS_GATEWAY';

      // 2. Initialize Direct Razorpay Checkout Modal
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
            backdrop_color: 'rgba(15, 23, 42, 0.75)',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setPaymentState('failed');
              setErrorMessage('Payment window was closed or cancelled. No funds were debited.');
            },
          },
          handler: async function (response: any) {
            // PAY-1: these two used to fall back to `pay_${Date.now()}` and an empty string.
            // A Razorpay success callback always carries both; if one is missing something is
            // wrong, and substituting a value we made up is how an unverifiable payment used to
            // reach the server looking verifiable. Pass them through as they came.
            if (!response?.razorpay_payment_id || !response?.razorpay_signature) {
              setLoading(false);
              setPaymentState('failed');
              setErrorMessage(
                'The gateway returned an incomplete confirmation, so the subscription was not activated. If money was debited, contact support with your order id — do not pay again.',
              );
              return;
            }
            await handleVerifyPayment(
              orderData.orderId,
              response.razorpay_payment_id,
              response.razorpay_signature,
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
        // PAY-1: this used to call handleVerifyPayment with a made-up payment id and the
        // literal signature 'direct_authorized' — the browser asserting to our own server that
        // a payment it never saw had succeeded. Anything that stops checkout.razorpay.com from
        // loading (an ad blocker, a corporate proxy, request blocking in devtools, no network)
        // took this branch, and the server activated a year's subscription for free because it
        // only verified signatures when a secret happened to be configured.
        //
        // A payment gateway that cannot load is a failure. There is no honest way for the
        // client to authorise a payment on its own.
        setLoading(false);
        setPaymentState('failed');
        setErrorMessage(
          'The secure payment window could not be opened. This is usually an ad blocker or a network restriction. Please disable it or try another network — no money has been debited.',
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
        billedTo: companyName || user?.displayName || 'Customer',
        email: user?.email || '',
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

  /** Direct Vector jsPDF Invoice Generator (100% Reliable across all mobile & desktop browsers) */
  const generateVectorReceiptPDF = () => {
    if (!transactionDetails) return;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = 22;
    const margin = 20;
    const pageWidth = 210;

    // Header Logo & Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(37, 99, 235);
    pdf.text('THENIJOBS', margin, y);
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Official Platform Invoice & Payment Receipt', margin, y + 6);

    // Paid Stamp
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(16, 185, 129);
    pdf.text('✓ PAID / ACTIVE', pageWidth - margin, y, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Receipt: ${transactionDetails.receiptNo}`, pageWidth - margin, y + 6, { align: 'right' });
    y += 18;

    // Divider Line
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Billed To & Dates
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Billed To:', margin, y);
    pdf.text('Payment Information:', pageWidth / 2 + 10, y);
    y += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(transactionDetails.billedTo, margin, y);
    pdf.text(`Date: ${transactionDetails.date}`, pageWidth / 2 + 10, y);
    y += 5;
    pdf.text(transactionDetails.email, margin, y);
    pdf.text(`Payment Ref: ${transactionDetails.paymentId}`, pageWidth / 2 + 10, y);
    y += 5;
    pdf.text('Location: Theni District, Tamil Nadu', margin, y);
    pdf.text(`Gateway: Razorpay 256-Bit SSL`, pageWidth / 2 + 10, y);
    y += 12;

    // Table Header
    pdf.setFillColor(245, 247, 250);
    pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Description / Subscription Plan', margin + 4, y + 5.5);
    pdf.text('Duration', pageWidth / 2 + 10, y + 5.5);
    pdf.text('Amount', pageWidth - margin - 4, y + 5.5, { align: 'right' });
    y += 14;

    // Table Row
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${transactionDetails.planName} Annual Subscription`, margin + 4, y);
    pdf.text('1 Year Access', pageWidth / 2 + 10, y);
    pdf.text(`₹${transactionDetails.amount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y, { align: 'right' });
    y += 5;
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Active until: ${transactionDetails.expiryDate}`, margin + 4, y);
    y += 10;

    // Total Line
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 6;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(17, 24, 39);
    pdf.text('Total Paid (INR):', pageWidth / 2 + 10, y);
    pdf.setTextColor(16, 185, 129);
    pdf.text(`₹${transactionDetails.amount.toLocaleString('en-IN')}`, pageWidth - margin - 4, y, { align: 'right' });
    y += 16;

    // Dynamic Enterprise Slogan
    const slogan = getReceiptGrowthSlogan(plan.slug, transactionDetails.receiptNo);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text(`"${slogan}"`, pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Official Footer Notice
    pdf.setDrawColor(240, 240, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, pageWidth - margin * 2, 28, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(50, 50, 50);
    pdf.text('THENIJOBS Official Customer Support', margin + 4, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Candidate & Employer Support: ${SITE_CONTACT.phone1}  |  WhatsApp: ${SITE_CONTACT.whatsapp}`, margin + 4, y + 12);
    pdf.text(`Email: ${SITE_CONTACT.email}  |  Official Portal: https://thenijobs.com`, margin + 4, y + 17);
    pdf.text('Address: North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu - 625533', margin + 4, y + 22);

    pdf.save(`THENIJOBS_Receipt_${transactionDetails.receiptNo}.pdf`);
    toast.success('🎉 Official Receipt PDF Downloaded Successfully!');
  };

  /** Multi-Layer PDF Download */
  const handleDownloadReceiptPDF = async () => {
    toast.info('Generating official payment receipt PDF...');
    try {
      if (!receiptRef.current) {
        generateVectorReceiptPDF();
        return;
      }
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
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

      pdf.addImage(imgData, 'JPEG', 10, 15, imgWidth, imgHeight, '', 'FAST');
      pdf.save(`THENIJOBS_Receipt_${transactionDetails?.receiptNo || 'Payment'}.pdf`);
      toast.success('🎉 Receipt PDF Downloaded!');
    } catch (err) {
      console.warn('Canvas PDF fallback to Vector PDF engine:', err);
      generateVectorReceiptPDF();
    }
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
                  Please complete the payment on the Razorpay screen. Your subscription will automatically activate once confirmed.
                </p>
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
                <h3 className="text-base font-bold text-red-950">Payment Incomplete or Cancelled</h3>
                <p className="text-xs text-red-800 mt-1 max-w-sm mx-auto">
                  {errorMessage || 'Payment was not completed. Subscription was not activated and no amount was debited.'}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white border border-red-200 text-red-800 text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunchRazorpay}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RefreshCw size={14} /> Retry Payment
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: SUCCESS SLIP / OFFICIAL TAX INVOICE */}
          {paymentState === 'success' && transactionDetails && (
            <div className="space-y-4 animate-fade-in">
              {/* Printable Slip Container */}
              <div
                ref={receiptRef}
                className="bg-white border-2 border-emerald-300 rounded-3xl p-5 text-gray-900 space-y-4 font-outfit shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-200 pb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-base text-slate-900">THENI<span className="text-blue-600">JOBS</span></span>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-[10px] text-gray-500">Official Subscription Invoice &amp; Payment Receipt</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      PAID / ACTIVE
                    </span>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5 font-bold">{transactionDetails.receiptNo}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Billed To:</span>
                    <p className="font-bold text-gray-900">{transactionDetails.billedTo}</p>
                    <p className="text-[11px] text-gray-500">{transactionDetails.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase">Payment Date:</span>
                    <p className="font-semibold text-gray-800 text-[11px]">{transactionDetails.date}</p>
                  </div>
                </div>

                {/* Plan Line Items Table */}
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-3.5 space-y-2 text-xs">
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
                    <span className="text-emerald-700 font-black">₹{transactionDetails.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Dynamic Enterprise Growth Slogan */}
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
                  <p className="text-[11px] font-semibold text-blue-900 italic">
                    &ldquo;{getReceiptGrowthSlogan(plan.slug, transactionDetails.receiptNo)}&rdquo;
                  </p>
                </div>

                {/* Payment Reference & Support */}
                <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <span>Payment Ref: <strong className="font-mono text-gray-800">{transactionDetails.paymentId}</strong></span>
                  <span>Official Support: <strong>{SITE_CONTACT.phone1}</strong></span>
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
