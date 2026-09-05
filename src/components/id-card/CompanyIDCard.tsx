'use client';

import { useState, useRef, useCallback } from 'react';
import {
  MapPin, Phone, Globe, MessageCircle, Building2, Mail, Briefcase,
  Download, Share2, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, User
} from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import { getCompanyGrowthSlogan } from '@/lib/branding/slogans';
import { useToast } from '@/contexts/ToastContext';
import { slugifyCompany } from '@/lib/companySlug';

export interface CompanyIDCardProps {
  company: {
    id: string;
    name: string;
    slug: string;
    category?: string;
    tagline?: string;
    description?: string;
    ownerName?: string;
    contactPerson?: string;
    designation?: string;
    phone: string;
    whatsapp?: string;
    email: string;
    website?: string;
    address?: string;
    district?: string;
    state?: string;
    logoUrl?: string;
    services?: string[];
    verificationStatus?: string;
  };
}

const BASE_URL = 'https://thenijobs.com';

export default function CompanyIDCard({ company }: CompanyIDCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  
  const companyId = `TNJ-C-${company.id.slice(0, 8).toUpperCase()}`;
  const portfolioUrl = `${BASE_URL}/company/${company.slug || slugifyCompany(company.name || company.id)}`;
  const initial = company.name?.[0]?.toUpperCase() || 'C';
  const growthSlogan = getCompanyGrowthSlogan(company);
  const contactName = company.contactPerson || company.ownerName || 'Representative';
  const cleanPhone = (company.phone || '').replace(/[^0-9+]/g, '');
  const cleanWa = (company.whatsapp || company.phone || '').replace(/[^0-9]/g, '');
  const topServices = (company.services || []).slice(0, 3);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;

      // Capture both sides
      const wasFlipped = flipped;

      // Front
      setFlipped(false);
      await new Promise(r => setTimeout(r, 450));
      const frontCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });

      // Back
      setFlipped(true);
      await new Promise(r => setTimeout(r, 450));
      const backCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });

      // Combine vertically with dark background
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
      toast.success('Visiting Card downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export visiting card image');
    } finally {
      setDownloading(false);
    }
  }, [company.slug, flipped, downloading, toast]);

  const handleShareWhatsApp = () => {
    const text = `📇 *${company.name}* - Official Digital Visiting Card\n📍 ${company.district || 'Theni'}, Tamil Nadu\n💬 "${growthSlogan}"\n\n🌐 View our verified profile, catalog & openings on THENIJOBS:\n${portfolioUrl}`;
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
          className="relative transition-transform duration-700 w-full max-w-[360px] sm:max-w-[400px] h-[230px] sm:h-[250px] rounded-3xl"
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
            <div className="relative h-full p-4 sm:p-5 flex flex-col justify-between text-white">
              {/* Top Row: Subtle THENIJOBS Verified Partner Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  <div className="w-4 h-4 rounded-md bg-white p-0.5 flex items-center justify-center shadow-xs">
                    <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[9px] font-bold text-blue-100 tracking-wide">Verified Partner · THENIJOBS</span>
                </div>

                <span className="text-[9px] font-mono font-bold bg-black/25 px-2.5 py-0.5 rounded-full border border-white/15 text-blue-200">
                  {companyId}
                </span>
              </div>

              {/* Main Center: Prominent Company Logo & Trade Identity */}
              <div className="flex items-center gap-3.5 my-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border-2 border-white/40 overflow-hidden">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-inner">
                      {initial}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-white truncate leading-tight tracking-tight">
                    {company.name}
                  </h2>
                  <p className="text-[11px] font-extrabold text-blue-200 uppercase tracking-wider mt-0.5 truncate">
                    {company.category || 'Local Business & Enterprise'}
                  </p>
                  
                  {/* Dynamic Motivational Business Growth Slogan */}
                  <p className="text-[10px] text-blue-100 italic font-medium mt-1 leading-snug line-clamp-1 opacity-90">
                    &ldquo;{growthSlogan}&rdquo;
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-blue-200 mt-1 font-medium">
                    <span className="flex items-center gap-0.5">
                      <User size={10} className="text-blue-300" /> {contactName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin size={10} className="text-blue-300" /> {company.district || 'Theni'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer: Direct Contact & Website */}
              <div className="flex items-center justify-between pt-2 border-t border-white/15 text-[10px] text-blue-100 font-medium">
                <div className="flex items-center gap-3 truncate">
                  {company.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={10} className="text-blue-300" /> {company.phone}
                    </span>
                  )}
                  {company.website && (
                    <span className="flex items-center gap-1 truncate text-blue-200">
                      <Globe size={10} className="text-blue-300 shrink-0" /> {company.website.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                </div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  Flip Card 🔄
                </span>
              </div>
            </div>
          </div>

          {/* ─── BACK SIDE: QR Code & Live Catalogue Pass ─── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="h-full p-4 sm:p-5 flex gap-3.5 items-center justify-between text-gray-900">
              {/* Left Column: Business Details & Services */}
              <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[10px] border border-blue-200">
                      {initial}
                    </div>
                    <h3 className="text-xs font-black text-gray-900 truncate">{company.name}</h3>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">{company.address || `${company.district || 'Theni'}, Tamil Nadu`}</p>
                </div>

                <div className="space-y-1.5 my-auto">
                  {topServices.length > 0 ? (
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                        Key Services &amp; Products:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {topServices.map(s => (
                          <span key={s} className="text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-600 italic bg-gray-50 p-2 rounded-xl border border-gray-100 line-clamp-2">
                      &ldquo;{growthSlogan}&rdquo;
                    </p>
                  )}

                  <div className="text-[10px] text-gray-600 font-medium space-y-0.5 pt-0.5">
                    {company.email && <p className="truncate">✉️ {company.email}</p>}
                    {company.whatsapp && <p className="truncate">💬 WA: {company.whatsapp}</p>}
                  </div>
                </div>

                <p className="text-[9px] text-blue-700 font-bold">
                  Scan QR for live catalog &amp; job openings →
                </p>
              </div>

              {/* Right Column: Sharp QR Code Generator */}
              <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gray-50 border border-gray-200 shrink-0 shadow-2xs">
                <QRCodeGenerator url={portfolioUrl} size={90} darkColor="#0F172A" lightColor="#FFFFFF" />
                <span className="text-[8px] font-mono font-bold text-gray-500 mt-1">{companyId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
        <RefreshCw size={12} /> {flipped ? 'Viewing Back (Scan QR)' : 'Viewing Front (Visiting Card)'} · Click card to flip
      </p>

      {/* Instant Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-sm">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>{downloading ? 'Exporting...' : 'Download Card (PNG)'}</span>
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="py-2.5 px-4 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          style={{ background: '#25D366' }}
        >
          <MessageCircle size={14} />
          <span>Share WhatsApp</span>
        </button>
      </div>
    </div>
  );
}
