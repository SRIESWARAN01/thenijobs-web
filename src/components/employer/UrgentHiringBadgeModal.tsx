'use client';

import { useState } from 'react';
import { Zap, CheckCircle2, Share2, Sparkles, AlertCircle, Loader2, X, Radio, Send, BellRing } from 'lucide-react';
import { URGENT_HIRING_BADGE_FEE_INR, URGENT_HIRING_SUPER_FEE_INR, URGENT_HIRING_DURATION_HOURS } from '@/lib/constants';
import UrgentSpotlightBadge from '@/components/jobs/UrgentSpotlightBadge';

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
  const [selectedFee, setSelectedFee] = useState<number>(URGENT_HIRING_BADGE_FEE_INR);
  const [activated, setActivated] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState<string>('');
  const [broadcastChannel, setBroadcastChannel] = useState<{
    name?: string;
    tamilName?: string;
    url?: string;
    directUrl?: string;
  } | null>(null);

  if (!isOpen || !job) return null;

  const handlePayAndActivate = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create Order with chosen micro-fee tier (₹99 or ₹149)
      const res = await fetch('/api/payment/urgent-badge/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, userId, fee: selectedFee }),
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
          description: `48h Urgent Spotlight: ${job.title} (₹${selectedFee})`,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              fee: selectedFee,
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
          fee: selectedFee,
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
          fee: selectedFee,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Verification failed');
      }

      setActivated(true);
      setWhatsAppText(verifyData.whatsAppBroadcastText || '');
      setBroadcastChannel({
        name: verifyData.channelName,
        tamilName: verifyData.channelTamilName,
        url: verifyData.channelUrl,
        directUrl: verifyData.directWhatsAppShareUrl,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleShareToWhatsApp = () => {
    if (broadcastChannel?.directUrl) {
      window.open(broadcastChannel.directUrl, '_blank');
      return;
    }
    if (!whatsAppText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(whatsAppText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden font-outfit max-h-[92vh] overflow-y-auto">
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
            Pin &quot;{job.title}&quot; to the top of homepage and taluk hubs for 48 hours.
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
              {/* Badge Preview */}
              <div className="mb-5 p-3.5 rounded-2xl bg-red-50/70 border border-red-200/80">
                <span className="text-[10px] font-black uppercase text-red-700 tracking-wider block mb-1.5">
                  Live Animated Badge Preview on Your Job
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <UrgentSpotlightBadge variant="full" />
                </div>
              </div>

              {/* Tier Selection (₹99 vs ₹149) */}
              <div className="space-y-3 mb-5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Select Spotlight Micro-Fee Tier:
                </label>

                {/* Option 1: ₹99 Standard */}
                <div
                  onClick={() => setSelectedFee(URGENT_HIRING_BADGE_FEE_INR)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    selectedFee === URGENT_HIRING_BADGE_FEE_INR
                      ? 'border-red-600 bg-red-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="spotlightFee"
                      checked={selectedFee === URGENT_HIRING_BADGE_FEE_INR}
                      onChange={() => setSelectedFee(URGENT_HIRING_BADGE_FEE_INR)}
                      className="mt-1 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-gray-900">
                          ₹99 — Standard 48h Spotlight
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                          Popular
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Flashing red badge + Pinned to top of Homepage &amp; Taluk Hubs for 48 hours + WhatsApp Share Card generator.
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-black text-gray-900 shrink-0">₹99</span>
                </div>

                {/* Option 2: ₹149 Super Spotlight */}
                <div
                  onClick={() => setSelectedFee(URGENT_HIRING_SUPER_FEE_INR)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    selectedFee === URGENT_HIRING_SUPER_FEE_INR
                      ? 'border-red-600 bg-red-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="radio"
                      name="spotlightFee"
                      checked={selectedFee === URGENT_HIRING_SUPER_FEE_INR}
                      onChange={() => setSelectedFee(URGENT_HIRING_SUPER_FEE_INR)}
                      className="mt-1 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-gray-900">
                          ₹149 — Super 48h Spotlight
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                          <Sparkles size={10} /> Max Inquiries
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Everything in ₹99 + <strong>Instant Auto-Broadcast to the relevant Taluk WhatsApp Alert Channel</strong> + Multi-Taluk Distribution.
                      </p>
                    </div>
                  </div>
                  <span className="text-base font-black text-gray-900 shrink-0">₹149</span>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-2.5 mb-6 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span><strong>Animated Flashing Red Badge:</strong> &quot;Urgent Requirement (அவசர ஆட்கள் தேவை)&quot; alerts candidates instantly.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span><strong>Pinned Top Position:</strong> Highest feed priority on homepage and taluk hubs for exactly 48 hours.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span><strong>Taluk WhatsApp Channel Alert:</strong> Pre-formatted broadcast ready to share with 1 tap.</span>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="p-4 rounded-2xl bg-red-50/70 border border-red-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                    One-time Micro-fee
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900">
                      ₹{selectedFee}
                    </span>
                    <span className="text-xs text-gray-400">Valid for {URGENT_HIRING_DURATION_HOURS} hours</span>
                  </div>
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
                      Spotlight for ₹{selectedFee}
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
              <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mb-4 leading-relaxed">
                Your job is now highlighted with the flashing red badge and pinned to the top of homepage and taluk hubs!
              </p>

              {/* Taluk Auto-Broadcast Alert Box */}
              {broadcastChannel && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-left mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
                    <BellRing size={15} className="text-amber-600 shrink-0" />
                    <span>Auto-Broadcasted to Taluk Channel:</span>
                  </div>
                  <p className="text-xs font-extrabold text-amber-800">
                    {broadcastChannel.tamilName || broadcastChannel.name}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Your vacancy is automatically alerted to local candidates in this taluk.
                  </p>
                </div>
              )}

              {/* Pre-formatted WhatsApp Broadcast Box */}
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
                  <Send size={16} /> Broadcast on WhatsApp (வாட்ஸ்அப் பகிர்வு)
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
