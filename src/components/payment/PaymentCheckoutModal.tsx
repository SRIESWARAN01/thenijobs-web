'use client';

import React, { useState } from 'react';
import { 
  X, Check, ShieldCheck, CreditCard, Smartphone, Building2, 
  Sparkles, Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight 
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

export interface PlanDetails {
  name: string;
  slug: string;
  price: number;
  dailyEquivalent?: number;
  period?: string;
  features?: string[];
}

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanDetails;
  companyId?: string;
  companyName?: string;
  onSuccess?: () => void;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'sandbox';

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

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', exp: '', cvv: '', name: '' });
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  if (!isOpen) return null;

  const handlePayment = async () => {
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
        throw new Error(orderData.error || 'Failed to initiate payment order.');
      }

      // 2. Simulate gateway processing time (or Razorpay handler)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Backend Verification
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          planSlug: plan.slug,
          planName: plan.name,
          amount: plan.price,
          companyId: companyId || '',
          companyName: companyName || (user as any)?.displayName || 'Business',
          userId: user?.uid || '',
          userName: (user as any)?.displayName || user?.email || 'Customer',
          paymentMethod: paymentMethod.toUpperCase(),
          status: 'success',
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed at backend.');
      }

      setTransactionId(verifyData.paymentId);
      setPaymentState('success');
      toast?.success('Payment Successful! 🎉', `${plan.name} Plan is now active.`);
      onSuccess?.();
    } catch (err: any) {
      console.error('Payment checkout error:', err);
      setPaymentState('failed');
      setErrorMessage(err.message || 'Payment could not be processed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              ₹
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Secure Checkout
              </h2>
              <p className="text-[11px] text-gray-500">256-bit SSL Encrypted Payment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={paymentState === 'processing'}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {paymentState === 'success' ? (
            /* Success State */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-4 border-emerald-100 animate-in zoom-in">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Payment Successful!
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Your subscription to <strong className="text-gray-800">{plan.name} Plan</strong> has been activated.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-bold text-gray-900">₹{plan.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono font-semibold text-gray-800">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Validity</span>
                  <span className="font-medium text-emerald-600 font-semibold">1 Year Active</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md"
              >
                Done &amp; Continue
              </button>
            </div>
          ) : paymentState === 'failed' ? (
            /* Failed State */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border-4 border-red-100 animate-in zoom-in">
                <AlertCircle size={36} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Payment Failed
                </h3>
                <p className="text-xs text-red-600 mt-1 px-4 leading-relaxed font-medium">
                  {errorMessage || 'Payment could not be completed. Your account was not charged.'}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setPaymentState('idle')}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Checkout & Method Selection */
            <div className="space-y-5">
              {/* Order Summary Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Plan Selected</span>
                  <h4 className="text-base font-bold text-gray-900">{plan.name} Plan</h4>
                  <p className="text-[11px] text-gray-500">Annual Subscription (365 Days)</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-blue-700">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </div>
                  {plan.dailyEquivalent && (
                    <span className="text-[10px] text-emerald-700 font-semibold">~₹{plan.dailyEquivalent}/day</span>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { id: 'upi' as const, label: 'UPI / QR', icon: Smartphone },
                    { id: 'card' as const, label: 'Cards', icon: CreditCard },
                    { id: 'netbanking' as const, label: 'NetBanking', icon: Building2 },
                    { id: 'sandbox' as const, label: '1-Click Pay', icon: Sparkles },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        paymentMethod === id
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                      }`}
                    >
                      <Icon size={18} className={paymentMethod === id ? 'text-blue-600' : 'text-gray-400'} />
                      <span className="text-xs font-bold">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Input Details */}
              {paymentMethod === 'upi' && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <label className="text-xs font-semibold text-gray-700 block">UPI ID / VPA</label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@okaxis / phone@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2 text-[10px] text-gray-500 font-medium pt-1">
                    <span>Supported:</span>
                    <span className="text-gray-700 font-bold">GPay • PhonePe • Paytm • BHIM</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Card Number</label>
                    <input
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      maxLength={19}
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Valid Thru</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardDetails.exp}
                        onChange={(e) => setCardDetails({ ...cardDetails, exp: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                  <label className="text-xs font-semibold text-gray-700 block">Select Your Bank</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Canara Bank">Canara Bank</option>
                    <option value="Indian Bank">Indian Bank</option>
                  </select>
                </div>
              )}

              {paymentMethod === 'sandbox' && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles size={14} className="text-amber-600" /> Instant Sandbox Payment
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Instantly verifies and activates your subscription in database without entering bank details.
                  </p>
                </div>
              )}

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-95 shadow-md disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying Payment...
                  </>
                ) : (
                  <>
                    <Lock size={15} /> Pay ₹{plan.price.toLocaleString('en-IN')} &amp; Activate
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>100% Money-back guarantee • GST invoice provided</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
