'use client';

import React, { useState } from 'react';
import {
  MessageCircle, Sparkles, X, Check, MapPin, Briefcase,
  BellRing, User, Phone, ArrowRight, ShieldCheck, CheckCircle2, Loader2, Bot
} from 'lucide-react';
import { THENI_TALUKS, POPULAR_JOB_CATEGORIES, sanitizeWhatsAppPhone, SITE_CONTACT } from '@/lib/constants';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';

export default function FloatingWhatsAppJobAlert() {
  const { user } = useAuth();
  const toast = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [candidateName, setCandidateName] = useState(user?.displayName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '');
  const [selectedTaluks, setSelectedTaluks] = useState<string[]>(['theni', 'periyakulam', 'cumbum']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['retail_sales', 'accounts', 'office_admin']);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = mobileNumber.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      toast.warning('தயவுசெய்து சரியான 10 இலக்க வாட்ஸ்அப் மொபைல் எண்ணை உள்ளிடவும்.');
      return;
    }

    setSubmitting(true);
    try {
      const sanitized = sanitizeWhatsAppPhone(digits);
      await addDoc(collection(db, 'jobAlerts'), {
        userId: user?.uid || `guest_${Date.now()}`,
        name: candidateName.trim() || 'Candidate',
        candidateName: candidateName.trim() || 'Candidate',
        phone: sanitized,
        whatsappNumber: sanitized,
        userEmail: user?.email || '',
        selectedTaluks,
        selectedCategories,
        taluks: selectedTaluks,
        categories: selectedCategories,
        source: 'floating_ai_job_alert',
        isActive: true,
        status: 'active',
        whatsappEnabled: true,
        channelNotificationEnabled: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubscribed(true);
      toast.success('🎉 வாட்ஸ்அப் வேலைவாய்ப்பு எச்சரிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது!');
    } catch (err: any) {
      console.error('[FloatingWhatsAppJobAlert] Submit error:', err);
      toast.error('பதிவு செய்வதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ─── Floating AI-Assistant Style Trigger Button (Prominent on Mobile) ─── */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setSubscribed(false);
          }}
          className="group relative flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer overflow-hidden border border-emerald-300/40"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)',
          }}
          aria-label="Get WhatsApp Job Alerts"
        >
          {/* Subtle Ambient Pulse Ring */}
          <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-30 group-hover:opacity-60 blur-sm animate-pulse -z-10" />

          {/* AI Sparkle Icon Badge */}
          <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
            <Bot size={14} className="text-white animate-bounce" />
          </div>

          <div className="flex flex-col text-left leading-tight">
            <span className="text-[10px] sm:text-[11px] font-medium text-emerald-100 flex items-center gap-1">
              <Sparkles size={10} className="text-amber-300" />
              AI Job Assistant
            </span>
            <span className="text-xs sm:text-sm font-extrabold tracking-tight">
              WhatsApp Job Alert
            </span>
          </div>

          <div className="w-7 h-7 rounded-full bg-white text-emerald-700 flex items-center justify-center shrink-0 shadow-xs ml-1">
            <MessageCircle size={16} fill="currentColor" />
          </div>
        </button>
      </div>

      {/* ─── Dedicated WhatsApp Job Alert Modal ─── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs font-sans overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl border border-emerald-100 relative my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-5 sm:p-6 text-white relative rounded-t-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064E3B 100%)',
              }}
            >
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                    <MessageCircle size={26} />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/25 border border-emerald-300/30 text-[10px] font-extrabold text-emerald-100 tracking-wider uppercase mb-1">
                      <Sparkles size={11} className="text-amber-300" />
                      Instant WhatsApp Alert • இலவச சேவை
                    </div>
                    <h3 className="text-lg sm:text-xl font-black">
                      Get Job Alert on WhatsApp
                    </h3>
                    <p className="text-xs text-emerald-100/90 mt-0.5">
                      தேனி மாவட்ட புதிய வேலைவாய்ப்பு தகவல்கள் உடனுக்குடன் உங்கள் வாட்ஸ்அப்பில்!
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5">
              {subscribed ? (
                <div className="text-center py-6 space-y-4 animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900">
                      Alert Activated Successfully! 🎉
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto mt-1 leading-relaxed">
                      உங்கள் வாட்ஸ்அப் எண் <strong>{mobileNumber}</strong> பதிவு செய்யப்பட்டது. தேர்வு செய்யப்பட்ட பிரிவுகளுக்கான புதிய வேலைவாய்ப்புகள் பகிரப்படும்.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-xs space-y-2">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      Official THENIJOBS WhatsApp Community
                    </div>
                    <p className="text-emerald-800 text-[11px] leading-relaxed">
                      1-கிளிக் மூலம் எங்கள் அதிகாரப்பூர்வ வாட்ஸ்அப் சேனலில் இணைந்து தினசரி வேலைவாய்ப்பு அறிவிப்புகளை நேரடியாகப் பெறுங்கள்.
                    </p>
                    <a
                      href={`https://wa.me/${SITE_CONTACT.whatsapp}?text=${encodeURIComponent(
                        `வணக்கம்! நான் THENIJOBS WhatsApp Job Alert-ல் பதிவு செய்துள்ளேன். புதிய வேலைவாய்ப்புகளை எனக்கு பகிரவும்.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm cursor-pointer"
                      style={{ background: '#25D366' }}
                    >
                      <MessageCircle size={16} />
                      Open THENIJOBS in WhatsApp
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors"
                  >
                    Done / நிறைவு
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Candidate Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Your Name / உங்கள் பெயர் <span className="text-gray-400 font-normal">(விருப்பத்தேர்வு)</span>
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="எ.கா: சரவணன் (Saravanan)"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  {/* WhatsApp Mobile Number Input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-1.5">
                      WhatsApp Mobile Number / வாட்ஸ்அப் எண் <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs flex items-center gap-1">
                        <Phone size={13} className="text-emerald-600" />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="10 இலக்க மொபைல் எண் (9876543210)"
                        className="w-full pl-16 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-mono font-bold text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      🔒 உங்கள் எண் பாதுகாப்பாக வைக்கப்படும். வேலைவாய்ப்பு எச்சரிக்கைகள் மட்டுமே அனுப்பப்படும்.
                    </p>
                  </div>

                  {/* Preferred Locations / Theni Taluks */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-emerald-600" />
                        Preferred Locations / விரும்பும் பகுதிகள்
                      </span>
                      <span className="text-[10px] font-normal text-gray-500">
                        ({selectedTaluks.length} தேர்வு செய்யப்பட்டது)
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 rounded-xl bg-gray-50 border border-gray-100">
                      {THENI_TALUKS.map((t) => {
                        const isSel = selectedTaluks.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTaluk(t.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isSel
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
                            }`}
                          >
                            {isSel && <Check size={10} />}
                            <span>{t.name}</span>
                            <span className="text-[9px] opacity-80">({t.tamilName})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Job Categories */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Briefcase size={12} className="text-emerald-600" />
                        Preferred Job Categories / வேலைப்பிரிவுகள்
                      </span>
                      <span className="text-[10px] font-normal text-gray-500">
                        ({selectedCategories.length} தேர்வு செய்யப்பட்டது)
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl bg-gray-50 border border-gray-100">
                      {POPULAR_JOB_CATEGORIES.map((c) => {
                        const isSel = selectedCategories.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleCategory(c.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isSel
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300'
                            }`}
                          >
                            {isSel && <Check size={10} />}
                            <span>{c.name}</span>
                            <span className="text-[9px] opacity-80">({c.tamilName})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:opacity-95 active:scale-98 cursor-pointer disabled:opacity-50 mt-2"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>பதிவு செய்யப்படுகிறது...</span>
                      </>
                    ) : (
                      <>
                        <BellRing size={16} />
                        <span>Get Job Alert on WhatsApp / எச்சரிக்கையைத் தொடங்குக</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
