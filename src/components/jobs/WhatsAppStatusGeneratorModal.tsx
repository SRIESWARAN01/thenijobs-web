'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Smartphone, MessageCircle, Download, Copy, Check,
  Sparkles, Loader2, Share2, ExternalLink, QrCode, AlertCircle
} from 'lucide-react';
import type { GeneratedPoster, PosterData } from '@/lib/poster/types';
import {
  generateWhatsAppStatusStory,
  triggerWhatsAppStatusShare,
  normalizeJobToPosterData
} from '@/lib/poster/whatsappStoryGenerator';

interface WhatsAppStatusGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: any;
  company?: any;
}

export default function WhatsAppStatusGeneratorModal({
  isOpen,
  onClose,
  job,
  company
}: WhatsAppStatusGeneratorModalProps) {
  const [loading, setLoading] = useState(true);
  const [poster, setPoster] = useState<GeneratedPoster | null>(null);
  const [posterData, setPosterData] = useState<PosterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !job) {
      setPoster(null);
      setError(null);
      setShareFeedback(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setShareFeedback(null);

    generateWhatsAppStatusStory(job, company)
      .then(({ poster: genPoster, posterData: data }) => {
        if (!isCancelled) {
          setPoster(genPoster);
          setPosterData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate WhatsApp Status Story:', err);
        if (!isCancelled) {
          setError('Failed to generate WhatsApp Status Story poster. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, job, company]);

  if (!isOpen) return null;

  const handleShareToWhatsApp = async () => {
    if (!poster || !posterData) return;
    setSharing(true);
    setShareFeedback(null);

    try {
      const res = await triggerWhatsAppStatusShare(poster, posterData);
      if (res.success) {
        setShareFeedback(
          res.method === 'native_file_share'
            ? '✅ WhatsApp opened! Select "My Status" (என் ஸ்டேட்டஸ்) to set the flyer.'
            : '✅ 9:16 Story downloaded & WhatsApp opened! Attach the flyer to your status.'
        );
      } else if (res.message) {
        setShareFeedback(res.message);
      }
    } catch (err: any) {
      console.error('Share error:', err);
      setShareFeedback('Could not open WhatsApp share sheet automatically. Use Download PNG button below.');
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (!poster || !posterData) return;
    const filename = `THENIJOBS_WhatsApp_Status_${posterData.title.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30)}.png`;
    const link = document.createElement('a');
    link.href = poster.dataUrlPng;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (!posterData) return;
    navigator.clipboard.writeText(posterData.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-emerald-500/20 my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  வாட்ஸ்அப் ஸ்டேட்டஸ் போஸ்டர் (9:16)
                </h3>
                <span className="bg-emerald-400/30 text-emerald-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-300/30">
                  1-Tap Viral
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                9:16 WhatsApp Status &amp; Instagram Story Generator (1080×1920)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 size={36} className="text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-gray-900">
                உயர் தர 9:16 ஸ்டேட்டஸ் போஸ்டர் உருவாகிறது...
              </p>
              <p className="text-xs text-gray-500 max-w-xs">
                Rendering 1080×1920 high-contrast Tamil card with &quot;ஆட்கள் தேவை&quot;, salary, location &amp; QR code.
              </p>
            </div>
          ) : error ? (
            <div className="py-12 px-4 text-center">
              <AlertCircle size={40} className="text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900">{error}</p>
              <button
                onClick={() => onClose()}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* 9:16 Phone Mockup Preview */}
              <div className="sm:col-span-5 flex justify-center">
                <div className="relative w-[190px] h-[338px] rounded-[28px] p-2 bg-slate-900 shadow-2xl border-4 border-slate-800 ring-1 ring-emerald-500/30 overflow-hidden flex flex-col items-center group">
                  {/* Speaker Pill */}
                  <div className="absolute top-2.5 z-20 w-14 h-3 bg-slate-800 rounded-full" />
                  {/* Canvas Image Container */}
                  <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-950 relative flex items-center justify-center">
                    {poster?.dataUrlPng && (
                      <img
                        src={poster.dataUrlPng}
                        alt="9:16 WhatsApp Status Poster"
                        className="w-full h-full object-cover rounded-[20px]"
                      />
                    )}
                    <div className="absolute bottom-1 inset-x-1 py-1 bg-black/60 backdrop-blur-xs rounded-lg text-center text-[9px] text-white font-mono">
                      1080 × 1920 • 9:16
                    </div>
                  </div>
                </div>
              </div>

              {/* Information & Feature Summary */}
              <div className="sm:col-span-7 space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                      ஸ்டேட்டஸ் சிறப்பம்சங்கள் (Features)
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="truncate">
                      📢 <strong className="text-rose-700 font-bold">&quot;ஆட்கள் தேவை&quot;</strong> தமிழ் தலைப்பு
                    </p>
                    <p className="truncate">
                      💰 <strong>சம்பளம்:</strong> {posterData?.salaryText}
                    </p>
                    <p className="truncate">
                      📍 <strong>பணி இடம்:</strong> {posterData?.location}
                    </p>
                    <p className="truncate">
                      📞 <strong>தொடர்பு:</strong> {posterData?.contactPhone || 'ஆன்லைன் விண்ணப்பம்'}
                    </p>
                    <p className="truncate">
                      📷 <strong>QR Code:</strong> நேரடி விண்ணப்பத்திற்கு
                    </p>
                  </div>
                </div>

                {/* Virality Tip Box */}
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-[11px] text-emerald-900 leading-relaxed">
                  💡 <strong>90%+ உள்ளூர் வேலைவாய்ப்புகள்</strong> வாட்ஸ்அப் ஸ்டேட்டஸ் மூலமே இளைஞர்களை சென்றடைகிறது. உங்கள் ஸ்டேட்டஸில் வைத்து மற்றவர்களுக்கும் உதவுங்கள்!
                </div>

                {shareFeedback && (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                    {shareFeedback}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!loading && poster && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {/* Primary 1-Tap WhatsApp Button */}
              <button
                onClick={handleShareToWhatsApp}
                disabled={sharing}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                {sharing ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <MessageCircle size={18} className="fill-current text-white" />
                )}
                <span>1-Tap WhatsApp Status (வாட்ஸ்அப் ஸ்டேட்டஸ் வைக்க)</span>
              </button>

              {/* Secondary Download & Copy Options */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleDownload}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download size={14} /> Download 9:16 PNG
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  <span>{copied ? 'Link Copied!' : 'Copy Job Link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
