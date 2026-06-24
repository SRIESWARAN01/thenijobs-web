'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { BadgeCheck, MapPin, QrCode, ShieldCheck, Download, Crown, Lock, Info, Sparkles, Check } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';

interface PublicProfile {
  name?: string;
  displayName?: string;
  currentRole?: string;
  qualification?: string;
  district?: string;
  photoUrl?: string;
  profilePhotoUrl?: string;
  photoURL?: string;
  skills?: string[];
  profileStrength?: number;
  isOpenToWork?: boolean;
  candidateId?: string;
  experience?: any[];
  premiumUntil?: any;
  isPremium?: boolean;
  updatedAt?: any;
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

export default function DigitalIdCardPageClient({ uid }: { uid: string }) {
  const [exporting, setExporting] = useState<string | null>(null);
  
  // Cascading fallback: publicProfiles → seekerProfiles → users
  const { data: publicProfile, loading: l1 } = useDocument<PublicProfile>('publicProfiles', uid);
  const { data: seekerProfile, loading: l2 } = useDocument<PublicProfile>('seekerProfiles', uid);
  const { data: userProfile, loading: l3 } = useDocument<PublicProfile>('users', uid);

  const loading = l1 || ((!publicProfile) && l2) || ((!publicProfile && !seekerProfile) && l3);

  const profile = useMemo(() => {
    if (publicProfile) return publicProfile;
    if (seekerProfile) return seekerProfile;
    if (userProfile) return userProfile;
    return null;
  }, [publicProfile, seekerProfile, userProfile]);

  const portfolioUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/profile/${uid}`;
    return `${window.location.origin}/profile/${encodeURIComponent(uid)}`;
  }, [uid]);

  const experienceText = useMemo(() => {
    const expList = profile?.experience || seekerProfile?.experience || [];
    if (!expList || expList.length === 0) return 'Fresh Graduate';
    let totalMonths = 0;
    expList.forEach((exp: any) => {
      if (!exp.startDate) return;
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
      if (!isNaN(diffMonths)) totalMonths += diffMonths;
    });
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (years === 0) {
      return totalMonths > 0 ? `${totalMonths} months` : 'Fresher';
    }
    return `${years} ${years === 1 ? 'Year' : 'Years'}${months > 0 ? ` ${months} ${months === 1 ? 'mo' : 'mos'}` : ''}`;
  }, [profile?.experience, seekerProfile?.experience]);

  const validTill = useMemo(() => {
    const dateVal = profile?.premiumUntil || seekerProfile?.premiumUntil;
    if (dateVal) {
      const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    // Default valid till date (e.g., 1 year from update)
    const updateVal = profile?.updatedAt || seekerProfile?.updatedAt;
    const baseDate = updateVal ? (updateVal.toDate ? updateVal.toDate() : new Date(updateVal)) : new Date();
    const expiry = new Date(baseDate);
    expiry.setFullYear(expiry.getFullYear() + 1);
    return expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }, [profile?.premiumUntil, profile?.updatedAt, seekerProfile?.premiumUntil, seekerProfile?.updatedAt]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070714] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070714] px-6 text-center text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
          <Info size={40} className="mx-auto text-amber-400 mb-4 animate-bounce" />
          <h1 className="text-xl font-bold tracking-tight">Digital ID not available</h1>
          <p className="mt-2 text-sm text-gray-400">Complete the profile first to generate this card.</p>
        </div>
      </main>
    );
  }

  const name = profile.name || profile.displayName || 'THENIJOBS Member';
  const role = profile.currentRole || profile.qualification || 'Job Seeker';
  const photoUrl = profile.photoUrl || profile.profilePhotoUrl || profile.photoURL || '';
  const isVerified = !!profile.candidateId;
  const uniqueId = profile.candidateId || `TNI-${uid.slice(0, 8).toUpperCase()}`;
  const isPremium = profile.isPremium !== false; // Display Premium styling
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(portfolioUrl)}`;
  
  const downloadPng = async (side: 'front' | 'back') => {
    setExporting(side === 'front' ? 'png-front' : 'png-back');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = document.getElementById(side === 'front' ? 'id-card-front' : 'id-card-back');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 3, // High quality
        useCORS: true,
        backgroundColor: null, // Transparent background
        logging: false
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${name.replace(/\s+/g, '_')}_ID_${side.toUpperCase()}.png`;
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
      
      const frontElement = document.getElementById('id-card-front');
      const backElement = document.getElementById('id-card-back');
      if (!frontElement || !backElement) return;
      
      // Capture front
      const canvasFront = await html2canvas(frontElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false
      });
      const imgFront = canvasFront.toDataURL('image/png');
      
      // Capture back
      const canvasBack = await html2canvas(backElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false
      });
      const imgBack = canvasBack.toDataURL('image/png');
      
      // Create PDF - A4 size (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add titles
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text('THENIJOBS Digital ID Card', 105, 30, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // slate-500
      pdf.text(`Verified Member Profile ID: ${uniqueId}`, 105, 38, { align: 'center' });
      pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 43, { align: 'center' });
      
      // Card dimensions on PDF
      const cardWidth = 120;
      const cardHeight = 76; // (460/290 = ~1.58 -> 120 / 1.58 = 76)
      const x = 45; // Center card (210 - 120) / 2 = 45
      
      // Draw Front Card
      pdf.addImage(imgFront, 'PNG', x, 60, cardWidth, cardHeight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text('FRONT SIDE', 105, 142, { align: 'center' });
      
      // Draw Back Card
      pdf.addImage(imgBack, 'PNG', x, 155, cardWidth, cardHeight);
      pdf.text('BACK SIDE / VERIFICATION', 105, 237, { align: 'center' });
      
      // Add footer notes
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text('Scan the QR code on the back of the card to verify this profile.', 105, 265, { align: 'center' });
      pdf.text('This is a verified document issued by thenijobs.in hiring platform.', 105, 270, { align: 'center' });
      
      pdf.save(`${name.replace(/\s+/g, '_')}_Digital_ID.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF document. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const shareWhatsApp = async () => {
    setExporting('share');
    const shareText = `Check out my verified professional Digital ID Card on THENIJOBS: ${portfolioUrl}`;
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const frontElement = document.getElementById('id-card-front');
      
      if (frontElement && navigator.share && navigator.canShare) {
        const canvas = await html2canvas(frontElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
          logging: false
        });
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
            return;
          }
          
          const file = new File([blob], `${name.replace(/\s+/g, '_')}_ID.png`, { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'THENIJOBS Digital ID Card',
              text: shareText
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
      `}</style>

      <div className="mx-auto max-w-5xl space-y-8">
        <header className="text-center space-y-2 no-print">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Crown size={14} className="animate-pulse" /> Premium Digital ID Card Enabled
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            THENIJOBS Digital ID Card
          </h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Scan to instantly access verified private credentials and professional portfolio.
          </p>
        </header>

        <div id="id-card-print-area" className="grid gap-8 lg:grid-cols-2 justify-center">
          {/* Card Front */}
          <section id="id-card-front" className="id-card-section w-full max-w-[460px] min-h-[290px] rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0e1224] via-[#111832] to-[#1e2a4a] shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:border-emerald-500/30">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Top Bar */}
            <div className="flex items-center justify-between z-10">
              <div className="flex flex-col border-l-2 border-emerald-500 pl-2">
                <span className="text-[10px] tracking-[0.2em] font-black text-emerald-400 uppercase">THENIJOBS</span>
                <span className="text-xs font-extrabold tracking-wide text-white uppercase flex items-center gap-1">
                  VERIFIED PROFESSIONAL
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isPremium && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                    <Crown size={10} /> Premium
                  </span>
                )}
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-slate-300 border border-white/5">
                  ID CARD
                </span>
              </div>
            </div>

            {/* Middle Section: Photo & Info */}
            <div className="my-5 flex gap-5 items-center z-10">
              {/* Photo Area */}
              <div className="relative">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-white/15 bg-slate-900/50 shadow-lg flex-shrink-0">
                  {photoUrl ? (
                    <Image src={photoUrl} alt={name} fill sizes="96px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black bg-gradient-to-br from-slate-800 to-slate-950 text-emerald-400 uppercase">
                      {name.slice(0, 1)}
                    </div>
                  )}
                </div>
                {/* Verified Badge overlay */}
                {isVerified && (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1 border-2 border-[#111832] shadow-md">
                    <BadgeCheck size={16} className="fill-current text-white" />
                  </div>
                )}
              </div>

              {/* Seeker Basic Info */}
              <div className="min-w-0 flex-1">
                <h2 className="font-outfit text-xl font-black text-white leading-tight truncate flex items-center gap-1.5">
                  {name}
                </h2>
                <p className="text-xs font-semibold text-emerald-400 truncate mt-0.5">{role}</p>
                
                {/* Micro NFC Smart chip graphic */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border border-amber-600/30 p-0.5 flex flex-col justify-between overflow-hidden shadow-inner">
                    <div className="flex justify-between h-full w-full opacity-60">
                      <div className="border-r border-amber-700/40 w-1/3 h-full"></div>
                      <div className="border-r border-amber-700/40 w-1/3 h-full"></div>
                      <div className="w-1/3 h-full"></div>
                    </div>
                  </div>
                  <div className="font-mono text-sm tracking-wider font-bold text-slate-300">
                    {uniqueId.split('-')[0] + ' - ' + uniqueId.split('-').slice(1).join(' ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Details Footer Grid */}
            <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-3 text-left z-10">
              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Location</span>
                <span className="text-[11px] font-bold text-white block truncate">{profile.district || 'Tamil Nadu'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Experience</span>
                <span className="text-[11px] font-bold text-white block truncate">{experienceText}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Membership</span>
                <span className="text-[11px] font-bold text-amber-300 block truncate flex items-center gap-0.5">
                  {isPremium ? 'Premium' : 'Standard'}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase block font-bold">Valid Till</span>
                <span className="text-[11px] font-bold text-white block truncate">{validTill}</span>
              </div>
            </div>

            {/* Core Confirmation Note */}
            <div className="mt-3 text-[9px] text-slate-400/80 border-t border-white/5 pt-2 text-center italic z-10">
              This card confirms that the candidate is a verified member of the THENIJOBS platform.
            </div>
          </section>

          {/* Card Back */}
          <section id="id-card-back" className="id-card-section w-full max-w-[460px] min-h-[290px] rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b0c15] via-[#101328] to-[#171c3c] shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:border-blue-500/30">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Top bar back side */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-[0.1em] text-emerald-400">QR VERIFICATION</span>
              </div>
              <span className="text-[9px] font-extrabold text-blue-300 tracking-wider">THENIJOBS.IN</span>
            </div>

            {/* Back Side Grid Content */}
            <div className="my-3 grid grid-cols-12 gap-4 items-center z-10">
              {/* QR Code Left Column */}
              <div className="col-span-5 flex flex-col items-center justify-center text-center">
                <div className="relative bg-white p-2 rounded-xl border border-white/10 shadow-lg">
                  <Image src={qrUrl} alt="Portfolio QR code" width={100} height={100} className="w-[100px] h-[100px]" />
                </div>
                <span className="mt-1.5 inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[8px] font-bold text-emerald-400 uppercase">
                  <QrCode size={8} /> SCAN TO VERIFY
                </span>
              </div>

              {/* Lists Right Column */}
              <div className="col-span-7 space-y-2.5 text-left leading-tight">
                {/* Private Portfolio Features */}
                <div>
                  <h3 className="text-[10px] font-black tracking-wider text-emerald-400 uppercase">
                    Private Portfolio Features
                  </h3>
                  <ul className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8.5px] text-slate-300 font-semibold">
                    <li className="flex items-center gap-1">📸 Photo & Summary</li>
                    <li className="flex items-center gap-1">🛠️ Skills & Expertise</li>
                    <li className="flex items-center gap-1">💼 Experience Details</li>
                    <li className="flex items-center gap-1">🎓 Education Details</li>
                    <li className="flex items-center gap-1">🏆 Certifications</li>
                    <li className="flex items-center gap-1">📄 Resume Download</li>
                    <li className="flex items-center gap-1">✉️ Contact Option</li>
                  </ul>
                </div>

                {/* Premium Benefits */}
                <div>
                  <h3 className="text-[10px] font-black tracking-wider text-amber-400 uppercase">
                    Premium Benefits
                  </h3>
                  <ul className="mt-1 grid grid-cols-1 gap-0.5 text-[8px] text-slate-300 font-semibold">
                    <li className="flex items-center gap-1 text-[8px]">✨ Verified Candidate Identity & QR Verification</li>
                    <li className="flex items-center gap-1 text-[8px]">✨ Private Digital Portfolio with Resume Download</li>
                    <li className="flex items-center gap-1 text-[8px]">✨ Anti-Fake Candidate Protection</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Privacy Protection Callout */}
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-2 text-left z-10">
              <h4 className="text-[9px] font-black tracking-wide text-blue-300 uppercase flex items-center gap-1">
                <Lock size={10} className="text-blue-300" /> Privacy Protection
              </h4>
              <p className="mt-0.5 text-[8px] text-slate-400 leading-normal">
                Portfolio is hidden from search engines. Accessible only via QR or direct private link. Contact details are restricted to verified employers only.
              </p>
            </div>

            {/* Footer Brand Info */}
            <div className="mt-3 border-t border-white/5 pt-2 flex items-center justify-between text-[8px] text-slate-400/80 z-10 font-bold">
              <div>
                <span className="text-slate-300 font-extrabold uppercase">THENIJOBS</span> — TN&apos;s Hiring Platform
              </div>
              <div className="flex gap-2">
                <span>thenijobs.in</span>
                <span>support@thenijobs.in</span>
              </div>
            </div>
          </section>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col items-center gap-6 no-print max-w-2xl mx-auto w-full">
          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* PNG Downloads */}
            <button
              disabled={exporting !== null}
              onClick={() => downloadPng('front')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-emerald-500/35 hover:bg-emerald-500/5 px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === 'png-front' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Download size={16} className="text-emerald-400" />
              )}
              Download Front Card (PNG)
            </button>

            <button
              disabled={exporting !== null}
              onClick={() => downloadPng('back')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-blue-500/35 hover:bg-blue-500/5 px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === 'png-back' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Download size={16} className="text-blue-400" />
              )}
              Download Back Card (PNG)
            </button>

            {/* PDF Export */}
            <button
              disabled={exporting !== null}
              onClick={downloadPdf}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-rose-500/35 hover:bg-rose-500/5 px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === 'pdf' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Download size={16} className="text-rose-400" />
              )}
              Download PDF Document
            </button>

            {/* WhatsApp Share */}
            <button
              disabled={exporting !== null}
              onClick={shareWhatsApp}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 px-4 py-3.5 text-sm font-extrabold text-emerald-300 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting === 'share' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
              ) : (
                <WhatsAppIcon />
              )}
              Share on WhatsApp
            </button>
          </div>

          {/* Browser standard print fallback */}
          <button
            disabled={exporting !== null}
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 hover:border-white/20 w-full py-4 text-sm font-bold text-slate-300 hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🖨️ Open Print & Save Dialog
          </button>

          {!isVerified ? (
            <p className="text-xs text-amber-400 font-semibold text-center">
              ⚠️ Complete your profile to 80% or more to verify your Candidate ID Card! (Current: {Number(profile.profileStrength || 0)}%)
            </p>
          ) : (
            <p className="text-xs text-emerald-400 font-semibold text-center flex items-center gap-1">
              <Check size={14} /> This profile is verified with Candidate ID: {uniqueId}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
