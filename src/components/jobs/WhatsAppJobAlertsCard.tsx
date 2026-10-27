'use client';

import { useState } from 'react';
import { MessageCircle, BellRing, Check, MapPin, Briefcase, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { THENI_TALUKS, POPULAR_JOB_CATEGORIES, sanitizeWhatsAppPhone, SITE_CONTACT } from '@/lib/constants';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  defaultTaluk?: string;
  className?: string;
  compact?: boolean;
}

export default function WhatsAppJobAlertsCard({ defaultTaluk, className = '', compact = false }: Props) {
  const { user } = useAuth();
  const toast = useToast();

  const [selectedTaluks, setSelectedTaluks] = useState<string[]>(
    defaultTaluk ? [defaultTaluk] : ['theni']
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'retail_sales',
    'accounts',
  ]);
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const toggleTaluk = (talukId: string) => {
    if (selectedTaluks.includes(talukId)) {
      if (selectedTaluks.length > 1) {
        setSelectedTaluks(selectedTaluks.filter((t) => t !== talukId));
      }
    } else {
      setSelectedTaluks([...selectedTaluks, talukId]);
    }
  };

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== catId));
      }
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.warning('தயவுசெய்து சரியான 10 இலக்க வாட்ஸ்அப் மொபைல் எண்ணை உள்ளிடவும்.');
      return;
    }

    setSubmitting(true);
    try {
      const sanitized = sanitizeWhatsAppPhone(digits);
      await addDoc(collection(db, 'jobAlerts'), {
        userId: user?.uid || `guest_${Date.now()}`,
        userEmail: user?.email || '',
        whatsappNumber: sanitized,
        selectedTaluks,
        selectedCategories,
        source: 'whatsapp_alerts_card',
        isActive: true,
        channelNotificationEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubscribed(true);
      toast.success('🎉 வாட்ஸ்அப் வேலைவாய்ப்பு எச்சரிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது!');
    } catch (err: any) {
      console.error('Failed to subscribe to alerts:', err);
      toast.error('பதிவு செய்வதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`rounded-3xl overflow-hidden border border-emerald-200/60 shadow-lg relative font-sans ${className}`}
      style={{
        background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 50%, #E6FFFA 100%)',
      }}
    >
      {/* Subtle WhatsApp watermark glow */}
      <div className="absolute -right-8 -top-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="p-5 sm:p-6 relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <MessageCircle size={26} className="fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Sparkles size={11} /> 100% Free Daily Alerts
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                Get Job Alerts on WhatsApp
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                தினசரி புதிய வேலைவாய்ப்புகள் உங்கள் வாட்ஸ்அப்பிற்கே வரும்
              </p>
            </div>
          </div>
        </div>

        {subscribed ? (
          /* Success State */
          <div className="p-4 rounded-2xl bg-white/90 border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <Check size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">வாட்ஸ்அப் அலர்ட் இயக்கப்பட்டது!</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                உங்கள் தாலுகா வேலைகள் தினமும் காலை 9 மணிக்கு வாட்ஸ்அப்பில் பகிரப்படும்.
              </p>
            </div>
            <a
              href={SITE_CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <ExternalLink size={14} />
              <span>Join THENIJOBS WhatsApp Channel</span>
            </a>
          </div>
        ) : (
          /* Interactive Subscription Form */
          <form onSubmit={handleSubscribe} className="space-y-4">
            {/* Taluk Multi-Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin size={13} className="text-emerald-600" />
                <span>தேனி தாலுகாவை தேர்வு செய்க (Choose Taluks):</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {THENI_TALUKS.map((taluk) => {
                  const isSelected = selectedTaluks.includes(taluk.id);
                  return (
                    <button
                      type="button"
                      key={taluk.id}
                      onClick={() => toggleTaluk(taluk.id)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white/80 hover:bg-white text-slate-700 border border-emerald-200/80'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                      <span>{taluk.name}</span>
                      <span className="text-[10px] opacity-80">({taluk.tamilName})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Multi-Selector (Visible in full view) */}
            {!compact && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase size={13} className="text-emerald-600" />
                  <span>பணி பிரிவுகள் (Job Categories):</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_JOB_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategory(cat.id)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-800 text-white'
                            : 'bg-white/80 hover:bg-white text-slate-600 border border-emerald-200/70'
                        }`}
                      >
                        {isSelected && <Check size={11} />}
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile Input & Submit Button */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-800 font-bold text-xs">
                  +91
                </div>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="10 இலக்க வாட்ஸ்அப் எண்"
                  className="w-full pl-11 pr-3 py-2.5 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 font-bold text-slate-900 shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="py-2.5 px-5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-700/20 active:scale-98 disabled:opacity-50 shrink-0"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
              >
                <BellRing size={14} />
                <span>{submitting ? 'பதிவு செய்கிறது...' : 'Start WhatsApp Alerts'}</span>
              </button>
            </div>

            {/* Privacy Guarantee */}
            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
              <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
              <span>எந்தவித விளம்பர ஸ்பேமும் இல்லை. உங்கள் எண் 100% பாதுகாப்பானது.</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
