'use client';

import { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck, MapPin, QrCode, ShieldCheck, Download,
  Crown, Lock, Info, Sparkles, Check, Phone, Mail, Building2, ExternalLink
} from 'lucide-react';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { where, limit } from 'firebase/firestore';
import { toDate, getCompanyActivePlan } from '@/lib/subscriptions';

interface CompanyData {
  id: string;
  name?: string;
  businessName?: string;
  companyName?: string;
  slug?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  category?: string;
  description?: string;
  website?: string;
  verificationStatus?: string;
  isPremium?: boolean;
  subscriptionPlan?: string;
  tagline?: string;
}

const WhatsAppIcon = () => (
  <svg
    className="w-5 h-5 fill-current"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.437.002 9.861-4.416 9.864-9.854.001-2.63-1.019-5.101-2.871-6.957C16.408 1.936 13.934 1.9 11.999 1.9 6.562 1.9 2.135 6.319 2.131 11.758c-.001 1.514.402 2.993 1.168 4.316l-.994 3.63 3.752-.984zm12.383-7.55c-.247-.123-1.464-.723-1.691-.806-.228-.083-.393-.123-.559.123-.166.247-.641.806-.784.97-.143.165-.286.185-.534.062-.247-.125-1.045-.385-1.99-1.231-.735-.656-1.232-1.467-1.376-1.714-.143-.247-.015-.38.109-.503.111-.11.247-.29.37-.435.123-.145.165-.248.248-.414.083-.165.042-.31-.02-.435-.063-.123-.559-1.345-.767-1.848-.201-.488-.406-.423-.559-.431-.144-.007-.31-.008-.475-.008-.166 0-.435.062-.663.31-.228.247-.868.847-.868 2.065 0 1.218.887 2.395.986 2.53.1.135 1.747 2.668 4.232 3.74.59.255 1.052.408 1.411.523.593.188 1.133.161 1.56.097.476-.07 1.464-.598 1.67-.176.206-.423.206-.785.145-.847-.06-.063-.227-.123-.474-.247z" />
  </svg>
);

type CardThemeName = 'luxury_gold' | 'midnight_purple' | 'mint_emerald' | 'titanium_platinum';

export default function CompanyDigitalCardPageClient({
  slug,
  initialCompany,
}: {
  slug: string;
  initialCompany: CompanyData | null;
}) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<CardThemeName>('luxury_gold');
  const [isFlipped, setIsFlipped] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [qrError, setQrError] = useState(false);

  // Extract potential ID from name-id slug structure
  const parsedId = useMemo(() => {
    if (!slug) return null;
    const lastHyphenIndex = slug.lastIndexOf('-');
    if (lastHyphenIndex !== -1) {
      const possibleId = slug.substring(lastHyphenIndex + 1);
      if (possibleId.length === 20 && /^[a-zA-Z0-9]+$/.test(possibleId)) {
        return possibleId;
      }
    }
    // If the slug itself is 20 alphanumeric characters, treat it as the ID
    if (slug.length === 20 && /^[a-zA-Z0-9]+$/.test(slug)) {
      return slug;
    }
    return null;
  }, [slug]);

  // Listen to single document if parsedId is available
  const { data: docCompany, loading: docLoading } = useDocument<any>(
    'companies',
    parsedId || undefined
  );

  // Otherwise, fallback to querying by slug
  const { data: slugCompanies, loading: slugLoading } = useCollection<any>(
    'companies',
    [where('slug', '==', slug), limit(1)],
    { skip: !!parsedId || !slug }
  );

  const company = useMemo(() => {
    if (parsedId) {
      return docCompany || initialCompany;
    }
    return slugCompanies[0] || initialCompany;
  }, [parsedId, docCompany, slugCompanies, initialCompany]);

  const dbLoading = parsedId ? docLoading : slugLoading;

  const profileUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/company/${slug}`;
    return `${window.location.origin}/company/${encodeURIComponent(slug)}`;
  }, [slug]);

  const plan = useMemo(() => {
    return getCompanyActivePlan(company);
  }, [company]);

  useEffect(() => {
    if (plan === 'enterprise') {
      setActiveTheme('titanium_platinum');
    }
  }, [plan]);

  if (dbLoading && !company) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070714] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500/30 border-t-purple-400" />
      </main>
    );
  }

  if (!company) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070714] px-6 text-center text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
          <Info size={40} className="mx-auto text-amber-400 mb-4 animate-bounce" />
          <h1 className="text-xl font-bold tracking-tight">Business card not available</h1>
          <p className="mt-2 text-sm text-gray-400">Complete the business profile first to generate this card.</p>
        </div>
      </main>
    );
  }

  const name = company.name || company.businessName || company.companyName || 'Business Partner';
  const logoUrl = company.logoUrl || '';
  const email = company.email || 'contact@business.com';
  const phone = company.phone || 'N/A';
  const category = company.category || 'Business Services';
  const district = company.district || 'Theni';
  const address = company.address || 'Theni, Tamil Nadu';
  const description = company.description || 'Verified Business Partner listing on THENIJOBS.';
  const tagline = company.tagline || 'Verified Local Partner';

  const isPremium = plan === 'premium' || plan === 'enterprise';
  const isVerified = plan !== 'free' || company.verificationStatus === 'verified';
  
  const uniqueId = `TNI-BUS-${(company.id || company.uid || 'unknown').slice(0, 8).toUpperCase()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=6&ecc=H&color=000000&bgcolor=ffffff&data=${encodeURIComponent(profileUrl)}`;
  const backupQrUrl = `https://quickchart.io/qr?size=500&margin=6&text=${encodeURIComponent(profileUrl)}`;

  const [logoBase64, setLogoBase64] = useState<string>('');
  const [qrBase64, setQrBase64] = useState<string>('');
  const [useFallbackLogo, setUseFallbackLogo] = useState<boolean>(false);

  useEffect(() => {
    const getBase64FromUrl = async (url: string): Promise<string> => {
      if (!url) return '';
      if (url.startsWith('data:')) return url;
      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Proxy returned status ${res.status}`);
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(url);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.warn('Failed to convert image to base64:', err);
        return url;
      }
    };

    const convertImages = async () => {
      if (logoUrl) {
        const base64 = await getBase64FromUrl(logoUrl);
        if (base64 && base64.startsWith('data:')) {
          setLogoBase64(base64);
          setUseFallbackLogo(false);
        } else {
          setUseFallbackLogo(true);
        }
      } else {
        setUseFallbackLogo(true);
      }
      if (qrUrl) {
        const base64 = await getBase64FromUrl(qrUrl);
        setQrBase64(base64);
      }
    };

    if (company) {
      convertImages();
    }
  }, [logoUrl, qrUrl, company]);

  // Premium themes config for visiting card background
  const themeGradients: Record<CardThemeName, {
    frontBg: string;
    backBg: string;
    accent: string;
    badge: string;
    border: string;
  }> = {
    luxury_gold: {
      frontBg: 'from-[#0e0e1e] via-[#201808] to-[#36270b] border-amber-500/30',
      backBg: 'from-[#0a0a14] via-[#1c1407] to-[#281d08] border-amber-500/30',
      accent: 'text-amber-400',
      badge: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
      border: 'border-amber-500/30'
    },
    midnight_purple: {
      frontBg: 'from-[#0e0e1e] via-[#1a0820] to-[#2c0b36] border-purple-500/30',
      backBg: 'from-[#0a0a14] via-[#14071c] to-[#200828] border-purple-500/30',
      accent: 'text-purple-400',
      badge: 'bg-purple-400/15 border-purple-400/30 text-purple-300',
      border: 'border-purple-500/30'
    },
    mint_emerald: {
      frontBg: 'from-[#0e0e1e] via-[#082017] to-[#0b3626] border-emerald-500/30',
      backBg: 'from-[#0a0a14] via-[#071c14] to-[#08281d] border-emerald-500/30',
      accent: 'text-emerald-400',
      badge: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300',
      border: 'border-emerald-500/30'
    },
    titanium_platinum: {
      frontBg: 'from-[#111116] via-[#1e1e24] to-[#2c2c35] border-slate-400/30',
      backBg: 'from-[#09090b] via-[#141418] to-[#1b1b22] border-slate-400/30',
      accent: 'text-slate-200',
      badge: 'bg-slate-500/10 border-slate-400/30 text-slate-200',
      border: 'border-slate-400/30 shadow-[0_0_15px_rgba(200,200,200,0.15)]'
    }
  };

  const currentCardTheme = themeGradients[activeTheme];

  const downloadPng = async (side: 'front' | 'back') => {
    setExporting(side === 'front' ? 'png-front' : 'png-back');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById(side === 'front' ? 'business-card-front' : 'business-card-back');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 4, // 300+ DPI at CR80 card size
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${name.replace(/\s+/g, '_')}_IDCard_${side.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Failed to generate PNG image. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const downloadPdf = async () => {
    setExporting('pdf');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const frontElement = document.getElementById('business-card-front');
      const backElement = document.getElementById('business-card-back');
      if (!frontElement || !backElement) return;

      const canvasFront = await html2canvas(frontElement, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const imgFront = canvasFront.toDataURL('image/png');

      const canvasBack = await html2canvas(backElement, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const imgBack = canvasBack.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('THENIJOBS Digital Business Card', 105, 30, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(`Verified Business ID: ${uniqueId}`, 105, 38, { align: 'center' });
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 43, { align: 'center' });

      // Card dimensions on PDF: Standard CR80 Size (85.60 mm x 53.98 mm)
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      const x = 62.2; // Center card (210 - 85.6) / 2 = 62.2

      // Draw Front Card
      pdf.addImage(imgFront, 'PNG', x, 60, cardWidth, cardHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text('FRONT SIDE', 105, 122, { align: 'center' });

      // Draw Back Card
      pdf.addImage(imgBack, 'PNG', x, 140, cardWidth, cardHeight);
      pdf.text('BACK SIDE / NETWORKING QR', 105, 202, { align: 'center' });

      // Footers
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.text('Scan the QR code to view public SEO profile and products.', 105, 230, { align: 'center' });
      pdf.text('Verified Business Listing issued by thenijobs.in.', 105, 235, { align: 'center' });

      pdf.save(`${name.replace(/\s+/g, '_')}_IDCard.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const shareWhatsApp = async () => {
    setExporting('share');
    const shareText = `Scan our Business Card to view products, services, and profile on THENIJOBS: ${profileUrl}`;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const frontElement = document.getElementById('business-card-front');

      if (frontElement && navigator.share && navigator.canShare) {
        const canvas = await html2canvas(frontElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });

        canvas.toBlob(async (blob) => {
          if (!blob) {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
            return;
          }

          const file = new File([blob], `${name.replace(/\s+/g, '_')}_BusinessCard.png`, { type: 'image/png' });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `${name} Business Card`,
              text: shareText,
            });
          } else {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
          }
        }, 'image/png');
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
      }
    } catch (error) {
      console.error('Error sharing on WhatsApp:', error);
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    } finally {
      setExporting(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#070714] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0f172a] via-[#070714] to-[#020617] px-4 py-12 text-white sm:px-6">
      <style>{`
        @media print {
          body {
            background: #070714 !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            background: transparent !important;
          }
          #id-card-print-area {
            grid-template-columns: 1fr 1fr !important;
            max-width: 100% !important;
            gap: 20px !important;
          }
          .id-card-section {
            box-shadow: none !important;
            border: 1px solid rgba(255,255,255,0.15) !important;
            background: #0f172a !important;
          }
        }
        .card-perspective {
          perspective: 1000px;
          -webkit-perspective: 1000px;
        }
        .card-transform-3d {
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
        }
        .card-backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-8">
        <header className="text-center space-y-2 no-print font-outfit">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Sparkles size={14} className="animate-pulse" /> Dynamic Visiting Card active
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Digital Business Identity Card
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Plan-based branding asset. Scan the QR code to navigate straight to the public portfolio site.
          </p>

          {/* Premium Theme Switcher for Premium card holders */}
          {isPremium && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-1 px-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Premium Card Themes:</span>
              {(['luxury_gold', 'midnight_purple', 'mint_emerald', 'titanium_platinum'] as CardThemeName[]).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTheme(t)}
                  className={`text-[9px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                    activeTheme === t
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Interactive Screen 3D Flip Card Preview (Hidden on Print) */}
        <div className="no-print flex flex-col items-center gap-6">
          <div 
            className="w-full max-w-[460px] min-h-[290px] card-perspective cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`relative w-full min-h-[290px] transition-transform duration-700 card-transform-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              
              {/* Front Side */}
              <div className="absolute inset-0 w-full h-full card-backface-hidden">
                <div
                  className={`w-full h-full min-h-[290px] rounded-[2rem] border shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden group font-outfit ${
                    plan === 'enterprise' || plan === 'premium'
                      ? `bg-gradient-to-br ${currentCardTheme.frontBg} ${currentCardTheme.border}`
                      : plan === 'basic'
                        ? 'bg-gradient-to-br from-[#0e1633] via-[#111c44] to-[#1c2e6f] border-blue-500/30'
                        : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Background elements */}
                  {plan !== 'free' && (
                    <>
                      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${
                        plan === 'enterprise' ? 'bg-slate-200/5 group-hover:bg-slate-200/10' : plan === 'premium' ? 'bg-amber-500/5 group-hover:bg-amber-500/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'
                      }`} />
                      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                    </>
                  )}

                  {/* Top Row */}
                  <div className="flex items-center justify-between z-10">
                    <div className={`flex flex-col border-l-2 pl-2 ${
                      plan === 'enterprise' ? 'border-slate-200' : plan === 'premium' ? 'border-amber-400' : plan === 'basic' ? 'border-slate-450' : 'border-slate-600'
                    }`}>
                      <span className="text-[10px] tracking-[0.2em] font-black text-slate-400 uppercase">THENIJOBS</span>
                      <span className="text-xs font-extrabold tracking-wide text-white uppercase flex items-center gap-1">
                        VERIFIED PARTNER
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan === 'enterprise' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-300 border border-white px-2.5 py-0.5 text-[9px] font-black text-slate-950 uppercase shadow-xl animate-pulse">
                          👑 PLATINUM VIP
                        </span>
                      ) : plan === 'premium' ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase shadow-lg ${currentCardTheme.badge}`}>
                          <Crown size={10} className="animate-bounce" /> 🥇 GOLD VERIFIED
                        </span>
                      ) : plan === 'basic' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-400/15 border border-slate-400/30 px-2.5 py-0.5 text-[9px] font-bold text-slate-300 uppercase">
                          🥈 SILVER VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[9px] font-bold text-blue-300 uppercase">
                          🌱 BASIC MEMBER
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Logo & Info */}
                  <div className="my-5 flex gap-5 items-center z-10 text-left">
                    <div className="relative">
                      <div className={`relative h-24 w-24 overflow-hidden rounded-2xl border bg-[#070714] shadow-lg flex-shrink-0 flex items-center justify-center ${
                        plan === 'enterprise' ? 'border-slate-300' : plan === 'premium' ? 'border-amber-400/20' : plan === 'basic' ? 'border-blue-500/20' : 'border-slate-800'
                      }`}>
                        {logoUrl && !logoError ? (
                          <img 
                            src={(!useFallbackLogo && logoBase64) ? logoBase64 : logoUrl} 
                            alt={`${name} Logo`} 
                            className="object-cover w-full h-full rounded-2xl" 
                            {...((!useFallbackLogo && logoBase64) ? { crossOrigin: "anonymous" } : {})}
                            onError={() => {
                              if (!useFallbackLogo && logoBase64) {
                                setUseFallbackLogo(true);
                              } else {
                                setLogoError(true);
                              }
                            }} 
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                            <Building2 size={36} className={plan === 'enterprise' ? 'text-slate-100' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-500'} />
                            <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest mt-1">NO LOGO</span>
                          </div>
                        )}
                      </div>
                      {isVerified && (
                        <div className={`absolute -bottom-2 -right-2 rounded-full p-1 border-2 border-[#15152d] shadow-md ${
                          plan === 'enterprise' ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950' : plan === 'premium' ? 'bg-amber-400 text-slate-950' : plan === 'basic' ? 'bg-slate-300 text-slate-950' : 'bg-blue-500 text-white'
                        }`}>
                          <BadgeCheck size={16} className="fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-black text-white leading-tight truncate">
                        {name}
                      </h2>
                      <p className={`text-xs font-semibold truncate mt-0.5 ${
                        plan === 'enterprise' ? 'text-slate-200 font-bold' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-400'
                      }`}>{category}</p>
                      <div className="mt-3 font-mono text-sm tracking-wider font-bold text-slate-350">
                        {uniqueId.split('-').slice(0, 2).join('-') + ' - ' + uniqueId.split('-')[2]}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="border-t border-white/5 pt-3 flex flex-col gap-1 z-10 text-xs text-slate-305 text-left">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Phone size={11} className={`shrink-0 ${plan === 'enterprise' ? 'text-slate-300' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="truncate">{phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail size={11} className={`shrink-0 ${plan === 'enterprise' ? 'text-slate-300' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="truncate">{email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={11} className={`shrink-0 ${plan === 'enterprise' ? 'text-slate-300' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="truncate">{address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Side */}
              <div className="absolute inset-0 w-full h-full card-backface-hidden [transform:rotateY(180deg)]">
                <div
                  className={`w-full h-full min-h-[290px] rounded-[2rem] border shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden group font-outfit ${
                    plan === 'enterprise' || plan === 'premium'
                      ? `bg-gradient-to-br ${currentCardTheme.backBg} ${currentCardTheme.border}`
                      : plan === 'basic'
                        ? 'bg-gradient-to-br from-[#0a0f24] via-[#0d1538] to-[#142252] border-blue-500/30'
                        : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Background design */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />

                  {/* Top logo header */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] tracking-[0.2em] font-black text-slate-400 block uppercase">THENIJOBS</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 block">VERIFIED LISTING</span>
                    </div>
                    <div className="h-8 w-8 overflow-hidden rounded-lg border border-white/10 bg-[#070714] flex items-center justify-center shadow-inner">
                      {logoUrl && !logoError ? (
                        <img 
                          src={(!useFallbackLogo && logoBase64) ? logoBase64 : logoUrl} 
                          alt={`${name} Logo`} 
                          className="object-cover w-full h-full rounded-lg" 
                          {...((!useFallbackLogo && logoBase64) ? { crossOrigin: "anonymous" } : {})}
                          onError={() => {
                            if (!useFallbackLogo && logoBase64) {
                              setUseFallbackLogo(true);
                            } else {
                              setLogoError(true);
                            }
                          }} 
                        />
                      ) : (
                        <Building2 size={14} className="text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Mid Section: QR Code & Summary */}
                  <div className="my-4 flex items-center gap-6 justify-between z-10 text-left">
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">About Company</p>
                      <p className="text-[11px] text-slate-350 leading-relaxed line-clamp-3">
                        {description}
                      </p>
                      {tagline && (
                        <p className="text-[10px] text-slate-500 italic truncate mt-1">&quot;{tagline}&quot;</p>
                      )}
                      <div className="pt-1 flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5">{district}</span>
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5">1 Year Validity</span>
                      </div>
                    </div>

                    {/* QR Code with Centered Logo Overlay (Premium Scan Asset) */}
                    <div className="shrink-0 flex flex-col items-center gap-1.5">
                      <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-white/15 bg-white p-2 shadow-lg flex items-center justify-center">
                        <img 
                          src={qrBase64 || (qrError ? backupQrUrl : qrUrl)} 
                          alt="QR Verification Link" 
                          className="object-contain w-full h-full" 
                          crossOrigin="anonymous" 
                          onError={() => setQrError(true)} 
                        />
                      </div>
                      <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 text-center">
                        <QrCode size={8} /> Scan to View Company Profile
                      </span>
                    </div>
                  </div>

                  {/* Footer link & Powered branding details */}
                  <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-slate-500 text-left">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1 text-slate-400 font-semibold truncate max-w-[240px]">
                        <ExternalLink size={10} />
                        <span className="truncate">{profileUrl.replace(/^https?:\/\//, '')}</span>
                      </div>
                      <span className="text-[8px] text-slate-600 block">Powered by THENIJOBS.in · Support: +91 98765 43210</span>
                    </div>
                    <span className="font-bold tracking-widest text-[8px] text-slate-600">THENIJOBS</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Toggle buttons */}
          <div className="flex gap-3 bg-white/[0.02] border border-white/10 rounded-2xl p-1 shadow-inner">
            <button
              onClick={() => setIsFlipped(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                !isFlipped
                  ? 'bg-purple-600/90 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              View Front
            </button>
            <button
              onClick={() => setIsFlipped(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                isFlipped
                  ? 'bg-purple-600/90 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              View Back
            </button>
          </div>
        </div>

        {/* Hidden Static Cards for PDF/PNG Generation and Printing */}
        <div id="id-card-print-area" className="hidden print:grid lg:grid lg:opacity-0 lg:absolute lg:-left-[9999px] lg:top-0 gap-8 justify-center">
          {/* Card Front */}
          <section
            id="business-card-front"
            className={`id-card-section w-full max-w-[460px] min-h-[290px] rounded-[2rem] border shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:border-purple-500/30 font-outfit ${
              plan === 'enterprise' || plan === 'premium'
                ? `bg-gradient-to-br ${currentCardTheme.frontBg} ${currentCardTheme.border}`
                : plan === 'basic'
                  ? 'bg-gradient-to-br from-[#0e1633] via-[#111c44] to-[#1c2e6f] border-blue-500/30'
                  : 'bg-slate-900 border-slate-800'
            }`}
          >
            {/* Background elements */}
            {plan !== 'free' && (
              <>
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-colors duration-1000 ${
                  plan === 'enterprise' ? 'bg-slate-200/5 group-hover:bg-slate-200/10' : plan === 'premium' ? 'bg-amber-500/5 group-hover:bg-amber-500/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'
                }`} />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            {/* Top Row */}
            <div className="flex items-center justify-between z-10">
              <div className={`flex flex-col border-l-2 pl-2 ${
                plan === 'enterprise' ? 'border-slate-200' : plan === 'premium' ? 'border-amber-400' : plan === 'basic' ? 'border-slate-450' : 'border-slate-600'
              }`}>
                <span className="text-[10px] tracking-[0.2em] font-black text-slate-400 uppercase">THENIJOBS</span>
                <span className="text-xs font-extrabold tracking-wide text-white uppercase flex items-center gap-1">
                  VERIFIED PARTNER
                </span>
              </div>
              <div className="flex items-center gap-2">
                {plan === 'enterprise' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-300 border border-white px-2.5 py-0.5 text-[9px] font-black text-slate-950 uppercase shadow-xl animate-pulse">
                    👑 PLATINUM VIP
                  </span>
                ) : plan === 'premium' ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase shadow-lg ${currentCardTheme.badge}`}>
                    <Crown size={10} className="animate-bounce" /> 🥇 GOLD VERIFIED
                  </span>
                ) : plan === 'basic' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-400/15 border border-slate-400/30 px-2.5 py-0.5 text-[9px] font-bold text-slate-300 uppercase">
                    🥈 SILVER VERIFIED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[9px] font-bold text-blue-300 uppercase">
                    🌱 BASIC MEMBER
                  </span>
                )}
              </div>
            </div>

            {/* Logo & Info */}
            <div className="my-5 flex gap-5 items-center z-10 text-left">
              <div className="relative">
                <div className={`relative h-24 w-24 overflow-hidden rounded-2xl border bg-[#070714] shadow-lg flex-shrink-0 flex items-center justify-center ${
                  plan === 'enterprise' ? 'border-slate-300' : plan === 'premium' ? 'border-amber-400/20' : plan === 'basic' ? 'border-blue-500/20' : 'border-slate-800'
                }`}>
                  {logoUrl && !logoError ? (
                    <img 
                      src={(!useFallbackLogo && logoBase64) ? logoBase64 : logoUrl} 
                      alt={`${name} Logo`} 
                      className="object-cover w-full h-full rounded-2xl" 
                      {...((!useFallbackLogo && logoBase64) ? { crossOrigin: "anonymous" } : {})}
                      onError={() => {
                        if (!useFallbackLogo && logoBase64) {
                          setUseFallbackLogo(true);
                        } else {
                          setLogoError(true);
                        }
                      }} 
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-2 text-center">
                      <Building2 size={36} className={plan === 'enterprise' ? 'text-slate-100' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-500'} />
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest mt-1">NO LOGO</span>
                    </div>
                  )}
                </div>
                {isVerified && (
                  <div className={`absolute -bottom-2 -right-2 rounded-full p-1 border-2 border-[#15152d] shadow-md ${
                    plan === 'enterprise' ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950' : plan === 'premium' ? 'bg-amber-400 text-slate-950' : plan === 'basic' ? 'bg-slate-300 text-slate-950' : 'bg-blue-500 text-white'
                  }`}>
                    <BadgeCheck size={16} className="fill-current" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black text-white leading-tight truncate">
                  {name}
                </h2>
                <p className={`text-xs font-semibold truncate mt-0.5 ${
                  plan === 'enterprise' ? 'text-slate-200 font-bold' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-400'
                }`}>{category}</p>
                <div className="mt-3 font-mono text-sm tracking-wider font-bold text-slate-350">
                  {uniqueId.split('-').slice(0, 2).join('-') + ' - ' + uniqueId.split('-')[2]}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="border-t border-white/5 pt-3 flex flex-col gap-1 z-10 text-xs text-slate-303 text-left">
              <div className="flex items-center gap-1.5 min-w-0">
                <Phone size={11} className={`shrink-0 ${plan === 'enterprise' ? 'text-slate-300' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate">{phone}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail size={11} className={`shrink-0 ${plan === 'enterprise' ? 'text-slate-300' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate">{email}</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin size={11} className={`shrink-0 ${plan === 'enterprise' ? 'text-slate-300' : plan === 'premium' ? currentCardTheme.accent : plan === 'basic' ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate">{address}</span>
              </div>
            </div>
          </section>

          {/* Card Back */}
          <section
            id="business-card-back"
            className={`id-card-section w-full max-w-[460px] min-h-[290px] rounded-[2rem] border shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:border-purple-500/30 font-outfit ${
              plan === 'enterprise' || plan === 'premium'
                ? `bg-gradient-to-br ${currentCardTheme.backBg} ${currentCardTheme.border}`
                : plan === 'basic'
                  ? 'bg-gradient-to-br from-[#0a0f24] via-[#0d1538] to-[#142252] border-blue-500/30'
                  : 'bg-slate-900 border-slate-800'
            }`}
          >
            {/* Background design */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />

            {/* Top logo header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] tracking-[0.2em] font-black text-slate-400 block uppercase">THENIJOBS</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 block">VERIFIED LISTING</span>
              </div>
              <div className="h-8 w-8 overflow-hidden rounded-lg border border-white/10 bg-[#070714] flex items-center justify-center shadow-inner">
                {logoUrl && !logoError ? (
                  <img 
                    src={(!useFallbackLogo && logoBase64) ? logoBase64 : logoUrl} 
                    alt={`${name} Logo`} 
                    className="object-cover w-full h-full rounded-lg" 
                    {...((!useFallbackLogo && logoBase64) ? { crossOrigin: "anonymous" } : {})}
                    onError={() => {
                      if (!useFallbackLogo && logoBase64) {
                        setUseFallbackLogo(true);
                      } else {
                        setLogoError(true);
                      }
                    }} 
                  />
                ) : (
                  <Building2 size={14} className="text-slate-400" />
                )}
              </div>
            </div>

            {/* Mid Section: QR Code & Summary */}
            <div className="my-4 flex items-center gap-6 justify-between z-10 text-left">
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-xs font-bold text-white uppercase tracking-wider">About Company</p>
                <p className="text-[11px] text-slate-350 leading-relaxed line-clamp-3">
                  {description}
                </p>
                {tagline && (
                  <p className="text-[10px] text-slate-500 italic truncate mt-1">&quot;{tagline}&quot;</p>
                )}
                <div className="pt-1 flex flex-wrap gap-1.5 text-[9px] font-bold text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5">{district}</span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5">1 Year Validity</span>
                </div>
              </div>

              {/* QR Code with Centered Logo Overlay (Premium Scan Asset) */}
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-white/15 bg-white p-2 shadow-lg flex items-center justify-center">
                  <img 
                    src={qrBase64 || (qrError ? backupQrUrl : qrUrl)} 
                    alt="QR Verification Link" 
                    className="object-contain w-full h-full" 
                    crossOrigin="anonymous" 
                    onError={() => setQrError(true)} 
                  />
                </div>
                <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 text-center">
                  <QrCode size={8} /> Scan to View Company Profile
                </span>
              </div>
            </div>

            {/* Footer link & Powered branding details */}
            <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-slate-500 text-left">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1 text-slate-400 font-semibold truncate max-w-[240px]">
                  <ExternalLink size={10} />
                  <span className="truncate">{profileUrl.replace(/^https?:\/\//, '')}</span>
                </div>
                <span className="text-[8px] text-slate-600 block">Powered by THENIJOBS.in · Support: +91 98765 43210</span>
              </div>
              <span className="font-bold tracking-widest text-[8px] text-slate-600">THENIJOBS</span>
            </div>
          </section>
        </div>

        {/* Action Buttons */}
        <div className="no-print mx-auto max-w-md bg-white/[0.02] border border-white/[0.06] rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col gap-3 font-outfit">
          <p className="text-xs text-gray-400 font-semibold text-center uppercase tracking-wider">Export Tools</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => downloadPng('front')}
              disabled={exporting !== null}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-purple-300 text-xs font-bold text-gray-200 transition-all disabled:opacity-50"
            >
              {exporting === 'png-front' ? (
                <Loader2 size={14} className="animate-spin text-purple-400" />
              ) : (
                <Download size={14} />
              )}
              Download Front PNG
            </button>
            <button
              onClick={() => downloadPng('back')}
              disabled={exporting !== null}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:text-purple-300 text-xs font-bold text-gray-200 transition-all disabled:opacity-50"
            >
              {exporting === 'png-back' ? (
                <Loader2 size={14} className="animate-spin text-purple-400" />
              ) : (
                <Download size={14} />
              )}
              Download Back PNG
            </button>
          </div>

          <button
            onClick={downloadPdf}
            disabled={exporting !== null}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            {exporting === 'pdf' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download Print PDF (A4 Sheet)
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={shareWhatsApp}
              disabled={exporting !== null}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {exporting === 'share' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <WhatsAppIcon />
              )}
              Share on WhatsApp
            </button>
            <button
              onClick={() => window.print()}
              disabled={exporting !== null}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-xs font-bold text-gray-200 transition-all disabled:opacity-50"
            >
              Print Card
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// Simple loader helper icon
const Loader2 = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={size || 14}
    height={size || 14}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
