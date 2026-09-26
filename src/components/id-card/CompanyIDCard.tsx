'use client';

import { useState, useRef, useCallback } from 'react';
import {
  MapPin, Phone, Globe, MessageCircle, Building2, Mail, Briefcase,
  Download, Share2, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, User,
  FileImage
} from 'lucide-react';
import QRCode from 'qrcode';
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

/**
 * Safely converts an image URL into a base64 Data URL to prevent canvas tainting.
 * If CORS prevents loading, returns null so the exporter falls back safely to SVG/letter initial.
 */
async function getSafeDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Second attempt via Image element with crossOrigin anonymous
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
}

export default function CompanyIDCard({ company }: CompanyIDCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const cardRef = useRef<HTMLDivElement>(null);
  const exportFrontRef = useRef<HTMLDivElement>(null);
  const exportBackRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  
  // Dedicated state for pre-rendered safe assets during export
  const [exportAssets, setExportAssets] = useState<{
    logo: string | null;
    brandLogo: string | null;
    qr: string | null;
  }>({ logo: null, brandLogo: null, qr: null });

  const companyId = `TNJ-C-${company.id.slice(0, 8).toUpperCase()}`;
  const portfolioUrl = `${BASE_URL}/company/${company.slug || slugifyCompany(company.name || company.id)}`;
  const isVerified = company.verificationStatus === 'verified';
  const initial = company.name?.[0]?.toUpperCase() || 'C';
  const growthSlogan = getCompanyGrowthSlogan(company);
  const contactName = company.contactPerson || company.ownerName || 'Representative';
  const cleanPhone = (company.phone || '').replace(/[^0-9+]/g, '');
  const cleanWa = (company.whatsapp || company.phone || '').replace(/[^0-9]/g, '');
  const topServices = (company.services || [])
    .map((s: any) => (typeof s === 'string' ? s : s?.name))
    .filter(Boolean)
    .slice(0, 3);

  const handleDownload = useCallback(async (format: 'png' | 'jpeg' = 'png') => {
    if (downloading) return;
    setDownloading(true);
    setExportFormat(format);

    try {
      // 1. Preload remote logo and QR code into safe, non-tainted Base64 data URLs
      const [safeLogo, safeBrandLogo, qrDataUrl] = await Promise.all([
        company.logoUrl ? getSafeDataUrl(company.logoUrl) : Promise.resolve(null),
        getSafeDataUrl('/logo.png'),
        QRCode.toDataURL(portfolioUrl, {
          width: 260,
          margin: 1,
          color: { dark: '#0F172A', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        }).catch(() => null),
      ]);

      setExportAssets({
        logo: safeLogo,
        brandLogo: safeBrandLogo || '/logo.png',
        qr: qrDataUrl,
      });

      // 2. Allow React state to flush and ensure fonts are loaded
      await new Promise(r => setTimeout(r, 120));
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready.catch(() => {});
      }

      if (!exportFrontRef.current || !exportBackRef.current) {
        throw new Error('Export container not ready. Please try again.');
      }

      // 3. Render flat 2D export nodes using html2canvas (zero 3D transform conflicts)
      const html2canvas = (await import('html2canvas')).default;

      const [frontCanvas, backCanvas] = await Promise.all([
        html2canvas(exportFrontRef.current, {
          scale: 3,
          backgroundColor: null,
          useCORS: true,
          allowTaint: false,
          logging: false,
        }),
        html2canvas(exportBackRef.current, {
          scale: 3,
          backgroundColor: null,
          useCORS: true,
          allowTaint: false,
          logging: false,
        }),
      ]);

      // 4. Combine both sides vertically with a sleek dark aesthetic slate
      const combined = document.createElement('canvas');
      combined.width = frontCanvas.width;
      combined.height = frontCanvas.height + backCanvas.height + 40;
      const ctx = combined.getContext('2d');
      if (!ctx) throw new Error('Could not initialize 2D canvas context.');

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, combined.width, combined.height);
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, frontCanvas.height + 40);

      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const dataUrl = combined.toDataURL(mimeType, 0.95);

      if (!dataUrl || dataUrl.length < 1000 || dataUrl === 'data:,') {
        throw new Error('Canvas export produced empty image data.');
      }

      // 5. Sanitize meaningful filename
      const cleanSlug = (company.slug || slugifyCompany(company.name || 'company'))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const filename = `${cleanSlug || 'company'}-visiting-card.${ext}`;

      // 6. Trigger download
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Visiting Card (${ext.toUpperCase()}) exported successfully!`);
    } catch (err: any) {
      console.error('[CompanyIDCard Export Error]', err);
      const msg = err?.message || '';
      if (msg.includes('Tainted') || msg.includes('SecurityError')) {
        toast.error('Browser blocked image export due to security restrictions.');
      } else if (msg.includes('Fetch') || msg.includes('network')) {
        toast.error('Image loading failed. Please check connection and try again.');
      } else {
        toast.error('Failed to export visiting card image. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  }, [company, portfolioUrl, downloading, toast]);

  const handleShareWhatsApp = () => {
    const text = `📇 *${company.name}* - Digital Visiting Card\n📍 ${company.district || 'Theni'}, Tamil Nadu\n💬 "${growthSlogan}"\n\n🌐 View our${isVerified ? ' verified' : ''} profile, catalog & openings on THENIJOBS:\n${portfolioUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-md mx-auto font-outfit">
      {/* Interactive 3D Flip Card Container (For on-screen visual interaction) */}
      <div
        className="w-full flex justify-center cursor-pointer select-none"
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped(!flipped)}
        role="button"
        tabIndex={0}
        aria-label="Click to flip digital visiting card"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setFlipped(!flipped); }}
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
              {/* Top Row: Subtle THENIJOBS Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  <div className="w-4 h-4 rounded-md bg-white p-0.5 flex items-center justify-center shadow-xs">
                    <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[9px] font-bold text-blue-100 tracking-wide">
                    {isVerified ? 'Verified Partner · THENIJOBS' : 'Digital Visiting Card · THENIJOBS'}
                  </span>
                </div>

                <span className="text-[9px] font-mono font-bold bg-black/25 px-2.5 py-0.5 rounded-full border border-white/15 text-blue-200">
                  {companyId}
                </span>
              </div>

              {/* Main Center: Prominent Company Logo & Trade Identity */}
              <div className="flex items-center gap-3.5 my-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border-2 border-white/40 overflow-hidden">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" crossOrigin="anonymous" />
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

      {/* Export & Sharing Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2 w-full max-w-sm">
        <button
          type="button"
          onClick={() => handleDownload('png')}
          disabled={downloading}
          className="flex-1 min-w-[130px] py-2.5 px-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <Download size={14} />
          <span>{downloading && exportFormat === 'png' ? 'Exporting…' : 'Download PNG'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleDownload('jpeg')}
          disabled={downloading}
          className="py-2.5 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <FileImage size={14} />
          <span>{downloading && exportFormat === 'jpeg' ? 'Exporting…' : 'Download JPG'}</span>
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="py-2.5 px-3.5 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          style={{ background: '#25D366' }}
        >
          <MessageCircle size={14} />
          <span>Share</span>
        </button>
      </div>

      {/* ─── HIDDEN OFF-SCREEN 2D EXPORT TEMPLATE (Flat DOM, CORS-Safe, Zero 3D Transforms) ─── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '400px',
          pointerEvents: 'none',
          zIndex: -999,
          opacity: 1,
        }}
      >
        {/* Front Side Export Template */}
        <div
          ref={exportFrontRef}
          style={{
            width: '400px',
            height: '250px',
            borderRadius: '24px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #2563EB 100%)',
            color: '#FFFFFF',
            padding: '20px',
            boxSizing: 'border-box',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#FFFFFF', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={exportAssets.brandLogo || '/logo.png'} alt="THENIJOBS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#DBEAFE', letterSpacing: '0.5px' }}>
                {isVerified ? 'Verified Partner · THENIJOBS' : 'Digital Visiting Card · THENIJOBS'}
              </span>
            </div>
            <span style={{ fontSize: '9px', fontFamily: 'monospace', fontWeight: 'bold', background: 'rgba(0,0,0,0.25)', padding: '2px 10px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', color: '#BFDBFE' }}>
              {companyId}
            </span>
          </div>

          {/* Center Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: 'auto 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#FFFFFF', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.4)', overflow: 'hidden' }}>
              {exportAssets.logo ? (
                <img src={exportAssets.logo} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '12px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 900, fontSize: '24px' }}>
                  {initial}
                </div>
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
                {company.name}
              </h2>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#BFDBFE', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {company.category || 'Local Business & Enterprise'}
              </p>
              <p style={{ fontSize: '10px', color: '#DBEAFE', fontStyle: 'italic', margin: '4px 0 0 0', lineHeight: 1.3, opacity: 0.9 }}>
                &ldquo;{growthSlogan}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#BFDBFE', marginTop: '4px', fontWeight: 500 }}>
                <span>👤 {contactName}</span>
                <span>•</span>
                <span>📍 {company.district || 'Theni'}</span>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: '10px', color: '#DBEAFE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {company.phone && <span>📞 {company.phone}</span>}
              {company.website && <span style={{ color: '#BFDBFE' }}>🌐 {company.website.replace(/^https?:\/\//, '')}</span>}
            </div>
            <span style={{ fontSize: '9px', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '999px' }}>
              Official Card
            </span>
          </div>
        </div>

        {/* Back Side Export Template */}
        <div
          ref={exportBackRef}
          style={{
            width: '400px',
            height: '250px',
            borderRadius: '24px',
            overflow: 'hidden',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#0F172A',
            padding: '20px',
            boxSizing: 'border-box',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            gap: '14px',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '20px',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', minWidth: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px', border: '1px solid #BFDBFE' }}>
                  {initial}
                </div>
                <h3 style={{ fontSize: '13px', fontWeight: 900, color: '#0F172A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {company.name}
                </h3>
              </div>
              <p style={{ fontSize: '10px', color: '#64748B', fontWeight: 500, margin: '2px 0 0 0' }}>
                {company.address || `${company.district || 'Theni'}, Tamil Nadu`}
              </p>
            </div>

            <div style={{ margin: 'auto 0' }}>
              {topServices.length > 0 ? (
                <div>
                  <span style={{ fontSize: '9px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
                    Key Services &amp; Products:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {topServices.map(s => (
                      <span key={s} style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '10px', color: '#475569', fontStyle: 'italic', background: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid #E2E8F0', margin: 0 }}>
                  &ldquo;{growthSlogan}&rdquo;
                </p>
              )}

              <div style={{ fontSize: '10px', color: '#475569', fontWeight: 500, marginTop: '6px', lineHeight: 1.4 }}>
                {company.email && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {company.email}</div>}
                {company.whatsapp && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>💬 WA: {company.whatsapp}</div>}
              </div>
            </div>

            <p style={{ fontSize: '9px', color: '#1D4ED8', fontWeight: 700, margin: 0 }}>
              Scan QR for live catalog &amp; job openings →
            </p>
          </div>

          {/* QR Code Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', flexShrink: 0 }}>
            {exportAssets.qr ? (
              <img src={exportAssets.qr} alt="Scan QR" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#64748B' }}>
                QR Code
              </div>
            )}
            <span style={{ fontSize: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: '#64748B', marginTop: '4px' }}>
              {companyId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
