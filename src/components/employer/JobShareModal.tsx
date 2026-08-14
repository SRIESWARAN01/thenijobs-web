'use client';

import { useState } from 'react';
import {
  X, Copy, Check, Share2, MessageCircle, QrCode,
  ExternalLink
} from 'lucide-react';

const FacebookIcon = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedinIcon = ({ size = 15, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
import QRCode from 'qrcode';

interface JobShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    companyName: string;
    district?: string;
    location?: string;
    salaryMin?: number;
    salaryMax?: number;
    salary?: string;
    status?: string;
    jobType?: string;
  };
}

export default function JobShareModal({ isOpen, onClose, job }: JobShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  const jobUrl = `https://thenijobs.com/jobs/${job.id}`;

  const salary = job.salaryMin && job.salaryMax
    ? `₹${Number(job.salaryMin).toLocaleString('en-IN')}–₹${Number(job.salaryMax).toLocaleString('en-IN')}`
    : job.salary || '';

  const shareText = [
    `🔵 ${job.title}`,
    `🏢 ${job.companyName}`,
    job.district ? `📍 ${job.district}` : '',
    salary ? `💰 ${salary}` : '',
    `🕐 ${job.jobType || 'Full Time'}`,
    '',
    'Apply on THENIJOBS 👇',
    jobUrl,
  ].filter(Boolean).join('\n');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(jobUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job.title} – ${job.companyName}`,
          text: shareText,
          url: jobUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleShowQR = async () => {
    if (!qrDataUrl) {
      const url = await QRCode.toDataURL(jobUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#111827', light: '#FFFFFF' },
      });
      setQrDataUrl(url);
    }
    setShowQR(true);
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`, '_blank');
  };

  const handleLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`, '_blank');
  };

  const isPendingOrClosed = job.status && !['active'].includes(job.status);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Share Job</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all tap-target-auto">
            <X size={16} />
          </button>
        </div>

        {/* Job Preview Card */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-900">{job.title}</h4>
          <p className="text-xs text-gray-600 mt-0.5">{job.companyName}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {job.district && (
              <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                📍 {job.district}
              </span>
            )}
            {salary && (
              <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                💰 {salary}
              </span>
            )}
          </div>
        </div>

        {isPendingOrClosed && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100">
            <p className="text-xs text-amber-700 font-medium">
              ⚠️ This job is {job.status}. Only approved/live jobs can be shared publicly.
            </p>
          </div>
        )}

        {/* Share Actions */}
        <div className="p-5 space-y-2">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            disabled={!!isPendingOrClosed}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={18} className="text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">WhatsApp</p>
              <p className="text-[10px] text-gray-500">Share directly on WhatsApp</p>
            </div>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              {copied ? <Check size={18} className="text-blue-600" /> : <Copy size={18} className="text-blue-600" />}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">{copied ? 'Link Copied!' : 'Copy Link'}</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[250px]">{jobUrl}</p>
            </div>
          </button>

          {/* Native Share */}
          {'share' in navigator && (
            <button
              onClick={handleNativeShare}
              disabled={!!isPendingOrClosed}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-violet-50 hover:border-violet-200 transition-all disabled:opacity-40"
            >
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <ExternalLink size={18} className="text-violet-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Share</p>
                <p className="text-[10px] text-gray-500">Use device share menu</p>
              </div>
            </button>
          )}

          {/* QR Code */}
          <button
            onClick={handleShowQR}
            disabled={!!isPendingOrClosed}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all disabled:opacity-40"
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <QrCode size={18} className="text-gray-700" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">QR Code</p>
              <p className="text-[10px] text-gray-500">Generate scannable QR code</p>
            </div>
          </button>

          {/* Social - row */}
          <div className="flex gap-2 pt-2">
            <button onClick={handleFacebook} disabled={!!isPendingOrClosed}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-100 text-sm font-medium text-gray-600 hover:bg-blue-50 transition-all disabled:opacity-40 tap-target-auto">
              <FacebookIcon size={15} className="text-blue-600" /> Facebook
            </button>
            <button onClick={handleLinkedIn} disabled={!!isPendingOrClosed}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-100 text-sm font-medium text-gray-600 hover:bg-blue-50 transition-all disabled:opacity-40 tap-target-auto">
              <LinkedinIcon size={15} className="text-blue-700" /> LinkedIn
            </button>
          </div>
        </div>

        {/* QR Code Display */}
        {showQR && qrDataUrl && (
          <div className="px-5 pb-5">
            <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center gap-2 border border-gray-100">
              <img src={qrDataUrl} alt="Job QR Code" className="w-48 h-48 rounded-lg" />
              <p className="text-[10px] text-gray-500 text-center">Scan to view job on THENIJOBS</p>
              <a href={qrDataUrl} download={`job-${job.id}-qr.png`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                Download QR
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
