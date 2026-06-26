'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Share2, X, Copy, Check, QrCode,
  MessageCircle, ExternalLink
} from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/ui/BrandIcons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
}

export default function ShareModal({ isOpen, onClose, url, title, description }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  // Generate QR code on canvas (simple grid-based QR using a lightweight approach)
  useEffect(() => {
    if (!showQR || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR placeholder — will display URL text on a styled card
    // For a real QR code, we'd use a library. Here we generate a scannable QR using the API
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=0a0a1a&color=ffffff`;
    
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 200;
      canvas.height = 200;
      ctx.drawImage(img, 0, 0, 200, 200);
    };
    img.src = qrImageUrl;
  }, [showQR, url]);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description || title);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={18} />,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20',
      href: `https://wa.me/?text=${encodedTitle}%0A${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: <FacebookIcon className="w-[18px] h-[18px]" />,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'LinkedIn',
      icon: <ExternalLink size={18} />,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/20 hover:bg-sky-500/20',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'X (Twitter)',
      icon: <span className="text-sm font-black">𝕏</span>,
      color: 'bg-white/5 text-white border-white/10 hover:bg-white/10',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#0c0c20] border border-white/[0.08] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Share2 size={16} className="text-cyan-400" /> Share Portfolio
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((opt) => (
              <a
                key={opt.name}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold transition-all ${opt.color}`}
              >
                {opt.icon}
                {opt.name}
              </a>
            ))}
          </div>

          {/* Copy Link */}
          <div className="flex gap-2">
            <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-400 truncate font-mono">
              {url}
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.1]'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* QR Code Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowQR(!showQR)}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider"
            >
              <QrCode size={12} />
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            {showQR && (
              <div className="mt-3 flex justify-center">
                <div className="bg-white rounded-2xl p-3">
                  <canvas ref={canvasRef} width={200} height={200} className="rounded-lg" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
