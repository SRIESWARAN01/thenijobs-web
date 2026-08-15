'use client';

import { useState, useRef, useCallback } from 'react';
import {
  MapPin, Phone, Globe, MessageCircle, Building2, Mail, Briefcase,
  Download, Share2, RefreshCw, CheckCircle2, ShieldCheck, Sparkles
} from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

interface CompanyIDCardProps {
  company: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    tagline?: string;
    description?: string;
    phone: string;
    whatsapp?: string;
    email: string;
    website?: string;
    address?: string;
    district?: string;
    state?: string;
    logoUrl?: string;
    verificationStatus?: string;
  };
}

const BASE_URL = 'https://thenijobs.com';

export default function CompanyIDCard({ company }: CompanyIDCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const companyId = `TNJ-C-${company.id.slice(0, 8).toUpperCase()}`;
  const portfolioUrl = `${BASE_URL}/company/${company.slug || company.id}`;
  const initial = company.name?.[0]?.toUpperCase() || 'C';

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      // Capture both sides
      const wasFlipped = flipped;

      // Front
      setFlipped(false);
      await new Promise(r => setTimeout(r, 350));
      const frontCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });

      // Back
      setFlipped(true);
      await new Promise(r => setTimeout(r, 350));
      const backCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });

      // Combine side-by-side or stacked
      const combined = document.createElement('canvas');
      combined.width = frontCanvas.width;
      combined.height = frontCanvas.height + backCanvas.height + 40;
      const ctx = combined.getContext('2d')!;
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, combined.width, combined.height);
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, frontCanvas.height + 40);

      const link = document.createElement('a');
      link.download = `${company.slug || 'company'}-visiting-card.png`;
      link.href = combined.toDataURL('image/png');
      link.click();

      setFlipped(wasFlipped);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }, [company.slug, flipped, downloading]);

  const handleShareWhatsApp = () => {
    const text = `📇 *${company.name}* - Official Digital Business Card\n📍 ${company.district || 'Theni'}, Tamil Nadu\n🌐 View our catalog & job openings on THENIJOBS:\n${portfolioUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto font-outfit">
      {/* Interactive 3D Flip Card Container */}
      <div
        className="w-full flex justify-center cursor-pointer select-none"
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          ref={cardRef}
          className="relative transition-transform duration-700 w-full max-w-[360px] sm:max-w-[400px] h-[225px] sm:h-[245px]"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          {/* ─── FRONT SIDE: Company Visiting Card ─── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)',
            }}
          >
            {/* Elegant Background Micro Mesh */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 10% 20%, white 0%, transparent 40%), radial-gradient(circle at 90% 80%, #38BDF8 0%, transparent 50%)',
              }}
            />

            <div className="relative h-full p-4 sm:p-5 flex flex-col justify-between text-white z-10">
              {/* Top Row: Company Category & Subtle THENIJOBS Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-xs text-blue-100 uppercase tracking-wider border border-white/20 truncate max-w-[170px]">
                  {company.category || 'Business Member'}
                </span>

                {/* Discrete THENIJOBS Partner Branding */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-xs border border-white/15 text-[9px] font-bold text-blue-200">
                  <ShieldCheck size={11} className="text-emerald-400" />
                  <span>THENIJOBS Verified</span>
                </div>
              </div>

              {/* Middle Row: Prominent Company Logo & Business Name */}
              <div className="flex items-center gap-3.5 my-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-lg border-2 border-white/60 overflow-hidden">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                      {initial}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                    {company.name}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-blue-200 font-medium truncate mt-0.5">
                    {company.tagline || `${company.district || 'Theni'} · Tamil Nadu`}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-mono text-cyan-300 font-bold tracking-wider">
                    ID: {companyId}
                  </span>
                </div>
              </div>

              {/* Bottom Row: Contact info */}
              <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] text-blue-100">
                <div className="flex items-center gap-1.5 truncate">
                  <Phone size={11} className="text-emerald-400 shrink-0" />
                  <span className="truncate font-semibold">{company.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end truncate">
                  <MapPin size={11} className="text-amber-400 shrink-0" />
                  <span className="truncate font-semibold">{company.district || 'Theni'}, TN</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── BACK SIDE: QR Code & Verification Portfolio ─── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #0F172A 0%, #111827 60%, #1E293B 100%)',
            }}
          >
            <div className="relative h-full p-4 sm:p-5 flex flex-col items-center justify-between text-center text-white z-10">
              <div className="w-full flex items-center justify-between text-[9px] text-gray-400 font-mono">
                <span>OFFICIAL DIGITAL PASS</span>
                <span>{companyId}</span>
              </div>

              {/* Sharp QR Code container */}
              <div className="p-2 rounded-2xl bg-white shadow-xl flex items-center justify-center my-auto">
                <QRCodeGenerator url={portfolioUrl} size={90} />
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-black text-white">Scan to View Portfolio &amp; Openings</p>
                <p className="text-[9px] text-blue-300 font-mono truncate max-w-[280px]">
                  thenijobs.com/company/{company.slug || company.id}
                </p>
              </div>

              <div className="w-full pt-1.5 border-t border-white/10 text-[9px] text-gray-400 flex justify-between items-center">
                <span>Certified Business Profile</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={10} /> Active Partner
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Helper Note */}
      <p className="text-xs text-gray-500 text-center font-medium flex items-center gap-1.5">
        <RefreshCw size={12} className="text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Tap card above to flip front &amp; back</span>
      </p>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 w-full">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download size={14} /> {downloading ? 'Exporting PNG...' : 'Download Card'}
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="py-3 px-3 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
          style={{ background: '#25D366' }}
        >
          <Share2 size={14} /> Share on WhatsApp
        </button>
      </div>
    </div>
  );
}
