'use client';

import { useState } from 'react';
import { Zap, CheckCircle2, Clock, Share2, Sparkles, AlertCircle, Loader2, X } from 'lucide-react';
import { URGENT_HIRING_BADGE_FEE_INR, URGENT_HIRING_DURATION_HOURS } from '@/lib/constants';

interface UrgentHiringBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    openings?: number;
    isUrgent?: boolean;
    urgentUntil?: any;
  } | null;
  userId: string;
  onSuccess?: () => void;
}

export default function UrgentHiringBadgeModal({
  isOpen,
  onClose,
  job,
  userId,
  onSuccess,
}: UrgentHiringBadgeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState<string>('');

  if (!isOpen || !job) return null;

  const handlePayAndActivate = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create Order
      const res = await fetch('/api/payment/urgent-badge/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, userId }),
      });
      const orderData = await res.json();

      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate order');
      }

      // 2. Launch Razorpay if configured, or auto-verify in test/dev
      if (orderData.isRazorpay && typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: orderData.key,
          amount: orderData.amount * 100,
          currency: 'INR',
          name: 'THENIJOBS',
          description: `48h Urgent Spotlight: ${job.title}`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
          },
          prefill: { name: 'Business Owner' },
          theme: { color: '#DC2626' },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Dev fallback verification
        await verifyPayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `dev_urg_${Date.now()}`,
          razorpay_signature: 'dev_mock_signature',
        });
      }
    } catch (err: any) {
      console.error('[Urgent Spotlight Activation Error]:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentDetails: any) => {
    try {
      const verifyRes = await fetch('/api/payment/urgent-badge/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentDetails,
          jobId: job.id,
          userId,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Verification failed');
      }

      setActivated(true);
      setWhatsAppText(verifyData.whatsAppBroadcastText || '');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleShareToWhatsApp = () => {
    if (!whatsAppText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(whatsAppText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden font-outfit">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-black tracking-wider uppercase mb-2">
            <Zap size={14} className="fill-yellow-300 text-yellow-300 animate-pulse" />
            48-Hour Urgent Spotlight
          </div>
          <h2 className="text-xl sm:text-2xl font-black leading-tight">
            அவசர ஆட்கள் தேவை!
          </h2>
          <p className="text-xs sm:text-sm text-red-100 mt-1">
            Pin &quot;{job.title}&quot; to the top of THENIJOBS for 48 hours.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 font-semibold">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {!activated ? (
            <>
              {/* Feature Highlights */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <Zap size={16} className="fill-red-600" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                      Pulsing Red Urgent Badge (அவசர தேவை பேட்ஜ்)
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                      Flashing animated red badge alerts candidates across all search and taluk pages.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                      Top Priority Placement (முதல் வரிசையில் தெரியும்)
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                      Pinned right at the top of homepage feeds and taluk hubs for 48 hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Share2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                      Instant WhatsApp Broadcast Card (வாட்ஸ்அப் பகிர்வு)
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                      Pre-formatted high-conversion broadcast text with 1-tap WhatsApp sharing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 flex items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    Micro-Fee
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900">
                      ₹{URGENT_HIRING_BADGE_FEE_INR}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-400 line-through">₹149</span>
                    <span className="text-xs font-bold text-emerald-600">Save 34%</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Valid for {URGENT_HIRING_DURATION_HOURS} hours from payment</p>
                </div>

                <button
                  onClick={handlePayAndActivate}
                  disabled={loading}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="fill-white" />
                      Spotlight for ₹{URGENT_HIRING_BADGE_FEE_INR}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Celebration & WhatsApp Share State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-xs">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1">
                48-Hour Urgent Spotlight Activated! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-5 leading-relaxed">
                Your job is now highlighted with a pulsing red badge and pinned to the top of all Theni job feeds!
              </p>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left mb-5">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                  <Share2 size={14} /> Ready to broadcast to Theni WhatsApp groups:
                </p>
                <div className="p-3 rounded-xl bg-white text-gray-700 text-xs font-mono whitespace-pre-wrap max-h-36 overflow-y-auto border border-emerald-100">
                  {whatsAppText}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleShareToWhatsApp}
                  className="flex-1 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 size={16} /> Share on WhatsApp (வாட்ஸ்அப் பகிர்வு)
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
