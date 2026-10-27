'use client';

import React, { useState } from 'react';
import {
  X, MessageCircle, Calendar, Clock, MapPin, CheckSquare,
  Square, ShieldCheck, Send, Phone, User, ExternalLink
} from 'lucide-react';
import { sanitizeWhatsAppPhone } from '@/lib/constants';

export interface WhatsAppInterviewPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidatePhone?: string;
  jobTitle: string;
  companyName: string;
  companyAddress?: string;
  companyMapsUrl?: string;
  companyContactPhone?: string;
  onConfirmSend?: (details: {
    interviewDate: string;
    interviewTime: string;
    interviewLocation: string;
    mapsUrl: string;
    contactPerson: string;
    contactPhone: string;
    checklist: string[];
    formattedMessage: string;
  }) => Promise<void> | void;
}

export default function WhatsAppInterviewPassModal({
  isOpen,
  onClose,
  candidateName,
  candidatePhone = '',
  jobTitle,
  companyName,
  companyAddress = 'Theni Main Road, Theni, Tamil Nadu',
  companyMapsUrl = '',
  companyContactPhone = '',
  onConfirmSend,
}: WhatsAppInterviewPassModalProps) {
  // Tomorrow's default date string (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [interviewDate, setInterviewDate] = useState(defaultDateStr);
  const [interviewTime, setInterviewTime] = useState('10:30 AM');
  const [interviewLocation, setInterviewLocation] = useState(companyAddress);
  const [mapsUrl, setMapsUrl] = useState(
    companyMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(companyAddress || companyName + ' Theni')}`
  );
  const [contactPerson, setContactPerson] = useState('HR Manager / Store In-Charge');
  const [contactPhone, setContactPhone] = useState(companyContactPhone || '9360519460');
  const [sending, setSending] = useState(false);

  // Document checklist items
  const [requireAadhaar, setRequireAadhaar] = useState(true);
  const [requireBiodata, setRequireBiodata] = useState(true);
  const [requireEducation, setRequireEducation] = useState(true);
  const [requireExperience, setRequireExperience] = useState(false);
  const [requirePhotos, setRequirePhotos] = useState(true);

  if (!isOpen) return null;

  // Format Date for display (e.g. 29 Oct 2026)
  const formattedDisplayDate = new Date(interviewDate).toLocaleDateString('ta-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Build documents list
  const docChecklist: string[] = [];
  if (requireAadhaar) docChecklist.push('✅ ஆதார் அட்டை அசல் & நகல் (Aadhaar Card Original & Copy)');
  if (requireBiodata) docChecklist.push('✅ பயோ-டேட்டா / ரெஸ்யூம் (Bio-Data / Resume Printed)');
  if (requireEducation) docChecklist.push('✅ கல்விச் சான்றிதழ்கள் (Educational Marksheets)');
  if (requirePhotos) docChecklist.push('✅ பாஸ்போர்ட் சைஸ் போட்டோ 2 (Passport Size Photos x2)');
  if (requireExperience) docChecklist.push('✅ முந்தைய அனுபவச் சான்றிதழ் (Relieving / Experience Letter)');

  // Build Authoritative Tamil + English WhatsApp Pass message
  const formattedMessage = `🎟️ *THENIJOBS — நேர்காணல் அனுமதி அட்டை (Interview Call Pass)*
══════════════════════════════
வணக்கம் *${candidateName}*!

*${companyName}* நிறுவனத்தில் நீங்கள் விண்ணப்பித்த *"${jobTitle}"* பணிக்கான நேர்காணல் நாள் மற்றும் நேரம் உறுதி செய்யப்பட்டுள்ளது.

📅 *நேர்காணல் நாள்:* ${formattedDisplayDate}
⏰ *நேரம்:* ${interviewTime}
🏢 *நிறுவனம்:* ${companyName}
📍 *இடம் / கடை முகவரி:* ${interviewLocation}
🗺️ *Google Maps வழித்தடம்:* ${mapsUrl}
👤 *தொடர்புக்கு:* ${contactPerson} (${contactPhone})

📋 *கொண்டுவர வேண்டிய ஆவணங்கள்:*
${docChecklist.join('\n')}

⚠️ *முக்கிய குறிப்பு:*
தயவுசெய்து நீங்கள் இந்த நேர்காணலுக்கு வருவதற்கு முன் இந்த மெசேஜிற்கு *"உறுதிசெய்கிறேன் (Confirmed)"* என பதிலளிக்கவும். உங்களுக்கு ஏதேனும் சந்தேகம் இருந்தால் மேற்கண்ட எண்ணில் தொடர்பு கொள்ளவும்.

வாழ்த்துகள்!
*${companyName}* Recruitment Team
🌐 Verified by THENIJOBS (www.thenijobs.com)`;

  const handleSend = async () => {
    try {
      setSending(true);
      if (onConfirmSend) {
        await onConfirmSend({
          interviewDate,
          interviewTime,
          interviewLocation,
          mapsUrl,
          contactPerson,
          contactPhone,
          checklist: docChecklist,
          formattedMessage,
        });
      }

      // Format WhatsApp deep link
      const targetPhone = sanitizeWhatsAppPhone(candidatePhone);
      const encodedMsg = encodeURIComponent(formattedMessage);
      const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMsg}`;

      window.open(whatsappUrl, '_blank');
      onClose();
    } catch (err) {
      console.error('Error sending interview pass:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-outfit">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-gray-200 animate-fade-in space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>1-Click Official Pass</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                Send WhatsApp Interview Pass (நேர்காணல் அட்டை)
              </h2>
              <p className="text-xs text-gray-500">
                Candidate: <strong className="text-blue-700">{candidateName}</strong> for <strong className="text-gray-900">{jobTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-slate-500 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Configuration Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Interview Date */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" /> Interview Date / நாள்
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Interview Time Slot */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> Time Slot / நேரம்
            </label>
            <select
              value={interviewTime}
              onChange={(e) => setInterviewTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="10:00 AM">10:00 AM (காலை)</option>
              <option value="10:30 AM">10:30 AM (காலை)</option>
              <option value="11:00 AM">11:00 AM (காலை)</option>
              <option value="11:30 AM">11:30 AM (காலை)</option>
              <option value="12:00 PM">12:00 PM (நண்பகல்)</option>
              <option value="02:30 PM">02:30 PM (மதியம்)</option>
              <option value="03:30 PM">03:30 PM (மாலை)</option>
              <option value="04:30 PM">04:30 PM (மாலை)</option>
              <option value="05:30 PM">05:30 PM (மாலை)</option>
            </select>
          </div>

          {/* Contact Person */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" /> Contact Person / தொடர்பு நபர்
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Manager Mr. Murugan"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-600" /> Contact Mobile Number
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Location & Google Maps Directions Link */}
        <div className="space-y-2">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Shop / Office Location (முகவரி)
            </label>
            <input
              type="text"
              value={interviewLocation}
              onChange={(e) => setInterviewLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1 flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Google Maps Pin URL
            </label>
            <input
              type="url"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-300 text-xs font-mono text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Documents Checklist */}
        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
          <label className="text-xs font-bold text-gray-800 block mb-2">
            Required Documents Checklist / கொண்டுவர வேண்டிய ஆவணங்கள்:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
            <button
              type="button"
              onClick={() => setRequireAadhaar(!requireAadhaar)}
              className="flex items-center gap-2 text-left hover:text-emerald-700"
            >
              {requireAadhaar ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
              <span>Aadhaar Card (ஆதார் அட்டை)</span>
            </button>
            <button
              type="button"
              onClick={() => setRequireBiodata(!requireBiodata)}
              className="flex items-center gap-2 text-left hover:text-emerald-700"
            >
              {requireBiodata ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
              <span>Bio-Data / Resume Copy</span>
            </button>
            <button
              type="button"
              onClick={() => setRequireEducation(!requireEducation)}
              className="flex items-center gap-2 text-left hover:text-emerald-700"
            >
              {requireEducation ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
              <span>Education Marksheets (கல்விச் சான்றிதழ்)</span>
            </button>
            <button
              type="button"
              onClick={() => setRequirePhotos(!requirePhotos)}
              className="flex items-center gap-2 text-left hover:text-emerald-700"
            >
              {requirePhotos ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
              <span>2 Passport Photos (புகைப்படம்)</span>
            </button>
            <button
              type="button"
              onClick={() => setRequireExperience(!requireExperience)}
              className="flex items-center gap-2 text-left hover:text-emerald-700"
            >
              {requireExperience ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
              <span>Experience Letter (அனுபவச் சான்றிதழ்)</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Live Preview Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
            <span>WhatsApp Message Preview (வாட்ஸ்அப் முன்னோட்டம்):</span>
            <span className="text-[11px] font-normal text-emerald-600">Bilingual Tamil &amp; English</span>
          </label>
          <div className="p-3 bg-emerald-950/90 text-emerald-100 rounded-2xl text-[11px] font-mono leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto border border-emerald-800 shadow-inner">
            {formattedMessage}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1eb857] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Interview Call Pass to WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
}
