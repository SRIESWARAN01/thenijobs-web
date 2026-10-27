'use client';

import { useState, useId } from 'react';
import { X, MessageCircle, Send, CheckCircle2, User, Phone, GraduationCap, MapPin, Briefcase } from 'lucide-react';
import { sanitizeWhatsAppPhone, THENI_TALUKS } from '@/lib/constants';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { useToast } from '@/contexts/ToastContext';

interface JobDetailInfo {
  id: string;
  slug?: string;
  title: string;
  companyName: string;
  companyId: string;
  location?: string;
  district?: string;
  whatsapp?: string;
  phone?: string;
}

interface SeekerProfileInfo {
  name?: string;
  phone?: string;
  education?: string;
  experience?: string;
  taluk?: string;
}

interface Props {
  job: JobDetailInfo;
  user?: any;
  seekerProfile?: SeekerProfileInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WhatsAppDirectApplyModal({
  job,
  user,
  seekerProfile,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const toast = useToast();
  const nameId = useId();
  const phoneId = useId();
  const qualificationId = useId();
  const talukId = useId();
  const experienceId = useId();

  const [name, setName] = useState(
    seekerProfile?.name || user?.displayName || user?.name || ''
  );
  const [phone, setPhone] = useState(
    seekerProfile?.phone || user?.phoneNumber || user?.phone || ''
  );
  const [qualification, setQualification] = useState(
    seekerProfile?.education || 'Graduate'
  );
  const [taluk, setTaluk] = useState(seekerProfile?.taluk || 'Theni');
  const [experience, setExperience] = useState(
    seekerProfile?.experience || '1-2 Years'
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  // Resolve target employer WhatsApp number
  const employerPhone = sanitizeWhatsAppPhone(job.whatsapp || job.phone);

  // Candidate public profile URL
  const profileUrl = typeof window !== 'undefined' && user?.uid
    ? `${window.location.origin}/portfolio/seeker/${user.uid}`
    : '';

  // Generate clean, polite bilingual message
  const generateMessage = () => {
    return [
      `வணக்கம்! THENIJOBS வழியாக உங்கள் வேலைவாய்ப்பை பார்த்தேன்.`,
      ``,
      `📌 பணி (Role): ${job.title}`,
      `🏢 நிறுவனம் (Company): ${job.companyName}`,
      `📍 இடம் (Location): ${job.location || job.district || 'Theni'}`,
      ``,
      `👤 விண்ணப்பதாரர் பெயர்: ${name.trim() || 'Job Seeker'}`,
      `📞 தொடர்பு எண்: ${phone.trim() || 'Provided on chat'}`,
      `🎓 கல்வி / தகுதி: ${qualification}`,
      `💼 அனுபவம்: ${experience}`,
      `🏘️ வசிக்கும் ஊர்: ${taluk} தாலுகா`,
      profileUrl ? `🌐 சுயவிவரம் (Profile): ${profileUrl}` : `🌐 பதிவு: THENIJOBS தளம்`,
      ``,
      `நேர்காணல் (Interview) மற்றும் பணி விவரங்களை பகிருமாறு அன்புடன் கேட்டுக்கொள்கிறேன். நன்றி!`,
    ].join('\n');
  };

  const handleApplyViaWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('தயவுசெய்து உங்கள் பெயரை உள்ளிடவும் (Please enter your name).');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      toast.warning('தயவுசெய்து சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும்.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Record application in Firestore
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        jobTitle: job.title,
        jobSlug: job.slug || '',
        companyId: job.companyId,
        companyName: job.companyName,
        seekerId: user?.uid || `wa_guest_${Date.now()}`,
        seekerName: name.trim(),
        seekerPhone: phone.trim(),
        seekerEmail: user?.email || '',
        appliedVia: 'whatsapp',
        seekerTaluk: taluk,
        seekerQualification: qualification,
        seekerExperience: experience,
        status: 'applied',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Increment application count on the job
      try {
        const jobRef = doc(db, 'jobs', job.id);
        await updateDoc(jobRef, {
          applicationsCount: increment(1),
          updatedAt: serverTimestamp(),
        });
      } catch {
        // Job doc increment fallback
      }

      setSubmitted(true);
      toast.success('விண்ணப்பம் பதிவு செய்யப்பட்டது! WhatsApp திறக்கப்படுகிறது...');

      // 3. Open WhatsApp Web or App
      const message = generateMessage();
      const whatsappUrl = `https://wa.me/${employerPhone}?text=${encodeURIComponent(message)}`;
      
      setTimeout(() => {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        onSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('WhatsApp apply error:', err);
      toast.error('விண்ணப்பம் பதிவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl relative font-sans flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
              <MessageCircle size={22} className="fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">1-Click WhatsApp Direct Apply</h3>
              <p className="text-xs text-emerald-100 font-medium">நேரடி வாட்ஸ்அப் விண்ணப்பம்</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Job Info Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
              <Briefcase size={16} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-slate-900 text-sm truncate">{job.title}</h4>
              <p className="text-slate-600 font-medium truncate">{job.companyName} • {job.location || job.district || 'Theni'}</p>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={12} /> நேரடி முதலாளி எண் (Verified WhatsApp: +{employerPhone})
              </p>
            </div>
          </div>

          <form onSubmit={handleApplyViaWhatsApp} className="space-y-3.5">
            {/* Candidate Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={nameId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User size={12} className="text-slate-400" /> உங்கள் பெயர் (Full Name) *
                </label>
                <input
                  id={nameId}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="எ.கா. முத்துக்குமார்"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label htmlFor={phoneId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" /> வாட்ஸ்அப் எண் (Mobile) *
                </label>
                <input
                  id={phoneId}
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10 இலக்க மொபைல் எண்"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Taluk & Qualification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor={talukId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" /> வசிக்கும் தாலுகா (Taluk)
                </label>
                <select
                  id={talukId}
                  value={taluk}
                  onChange={(e) => setTaluk(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium text-slate-900"
                >
                  {THENI_TALUKS.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.tamilName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={qualificationId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <GraduationCap size={12} className="text-slate-400" /> கல்வித் தகுதி (Education)
                </label>
                <input
                  id={qualificationId}
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="10th, 12th, ITI, Diploma, Any Degree"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Experience */}
            <div>
              <label htmlFor={experienceId} className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase size={12} className="text-slate-400" /> முன் அனுபவம் (Experience)
              </label>
              <select
                id={experienceId}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-emerald-500 font-medium text-slate-900"
              >
                <option value="Fresher (புதியவர்)">Fresher (புதியவர்)</option>
                <option value="1-2 Years (வருடங்கள்)">1-2 Years (வருடங்கள்)</option>
                <option value="3-5 Years (வருடங்கள்)">3-5 Years (வருடங்கள்)</option>
                <option value="5+ Years (அனுபவம்)">5+ Years (அனுபவம்)</option>
              </select>
            </div>

            {/* Message Preview Box */}
            <div className="space-y-1 pt-1">
              <span className="font-bold text-slate-600 text-[11px]">வாட்ஸ்அப் செய்தி முன்னோட்டம் (Message Preview):</span>
              <pre className="p-3 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[10px] whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto border border-slate-800">
                {generateMessage()}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || submitted}
                className="flex-[2] py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/30 active:scale-98 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
              >
                <Send size={15} />
                <span>{submitting ? 'Connecting...' : 'Apply & Open WhatsApp'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
