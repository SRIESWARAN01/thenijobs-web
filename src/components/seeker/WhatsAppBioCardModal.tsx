'use client';

import React, { useState, useEffect } from 'react';
import {
  X, MessageCircle, Download, Copy, Check,
  Sparkles, Loader2, Share2, ExternalLink, ShieldCheck, Smartphone
} from 'lucide-react';
import type { GeneratedPoster } from '@/lib/poster/types';
import {
  generateSeekerWhatsAppBioCard,
  shareSeekerBioCard,
  formatSeekerWhatsAppBioShareText,
  type SeekerBioData
} from '@/lib/poster/seekerBioCardGenerator';

interface WhatsAppBioCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: SeekerBioData;
  uid?: string;
}

export default function WhatsAppBioCardModal({
  isOpen,
  onClose,
  profile,
  uid = 'SEEKER'
}: WhatsAppBioCardModalProps) {
  const [loading, setLoading] = useState(true);
  const [poster, setPoster] = useState<GeneratedPoster | null>(null);
  const [profileUrl, setProfileUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPoster(null);
      setError(null);
      setFeedback(null);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setFeedback(null);

    generateSeekerWhatsAppBioCard(profile, uid)
      .then(({ poster: genPoster, profileUrl: url }) => {
        if (!isCancelled) {
          setPoster(genPoster);
          setProfileUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate WhatsApp Bio Card:', err);
        if (!isCancelled) {
          setError('Failed to generate WhatsApp Story Bio Card. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, profile, uid]);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!poster) return;
    setSharing(true);
    setFeedback(null);

    try {
      const res = await shareSeekerBioCard(poster, profile, uid);
      if (res.success) {
        setFeedback(
          res.method === 'native_file_share'
            ? '✅ WhatsApp opened! Select "My Status" (என் ஸ்டேட்டஸ்) to post your Bio Card.'
            : '✅ 9:16 Bio Card downloaded! Attach the image to your WhatsApp Status.'
        );
      } else if (res.message) {
        setFeedback(res.message);
      }
    } catch (err) {
      console.error('Share error:', err);
      setFeedback('Could not open share menu automatically. Please use Download PNG button below.');
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (!poster) return;
    const candidateName = (profile.name || profile.displayName || 'Job_Seeker').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `THENIJOBS_WhatsApp_BioCard_${candidateName}.png`;
    const link = document.createElement('a');
    link.href = poster.dataUrlPng;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFeedback('✅ 9:16 Bio Card PNG (1080×1920) downloaded successfully!');
  };

  const handleCopyText = async () => {
    const text = formatSeekerWhatsAppBioShareText(profile, profileUrl);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      setFeedback('✅ Bio text and profile link copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs font-outfit">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[94vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-gray-200 animate-fade-in space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>3.1 9:16 Story Card</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                WhatsApp Status Bio Card (வாட்ஸ்அப் பயோ அட்டை)
              </h2>
              <p className="text-xs text-gray-500">
                Share your skills &amp; availability with family, friends &amp; shop owners
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-slate-500 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-fade-in">
            <Check size={14} className="text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-900">
            {error}
          </div>
        )}

        {/* Preview Container */}
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-2 sm:p-3 overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Loader2 className="w-9 h-9 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-300 font-bold">9:16 பயோ அட்டை உருவாகிறது...</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Rendering 1080×1920 high-contrast card with skills, education, taluk preferences &amp; QR code.
              </p>
            </div>
          ) : poster ? (
            <div className="w-full flex flex-col items-center">
              <div className="relative max-w-[260px] sm:max-w-[280px] rounded-xl overflow-hidden shadow-2xl border-2 border-emerald-500/40">
                <img
                  src={poster.dataUrlPng}
                  alt="WhatsApp Status Bio Card Preview"
                  className="w-full h-auto object-contain block"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                  1080 × 1920 • 9:16
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Primary 1-Click WhatsApp Status Action Button */}
        <button
          type="button"
          disabled={loading || sharing || !poster}
          onClick={handleShare}
          className="w-full py-3.5 px-4 rounded-2xl text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          style={{ background: '#25D366' }}
        >
          {sharing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>WhatsApp திறக்கிறது...</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>வாட்ஸ்அப் ஸ்டேட்டஸில் பகிர்க (Share to WhatsApp Status)</span>
            </>
          )}
        </button>

        {/* Secondary Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!poster}
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download size={14} className="text-blue-600" />
            <span>Download PNG (1080×1920)</span>
          </button>

          <button
            type="button"
            disabled={!poster}
            onClick={handleCopyText}
            className="py-2.5 px-3 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-gray-600" />
                <span>Copy Bio Text</span>
              </>
            )}
          </button>
        </div>

        {/* Live Public Profile Link */}
        {profileUrl && (
          <div className="pt-1 text-center">
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              <span>View Live Seeker Portfolio Page</span>
              <ExternalLink size={11} />
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
