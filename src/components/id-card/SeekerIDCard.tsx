'use client';

import { useState, useRef, useCallback } from 'react';
import { MapPin, Phone, User, GraduationCap, Award, Briefcase, Download, Share2, MessageCircle, RefreshCw, Mail, Globe } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';
import { getSeekerGrowthSlogan } from '@/lib/branding/slogans';
import { useToast } from '@/contexts/ToastContext';

export interface SeekerIDCardProps {
  seeker: {
    uid: string;
    name: string;
    phone?: string;
    email?: string;
    website?: string;
    profilePhotoUrl?: string;
    district?: string;
    state?: string;
    address?: string;
    skills?: string[];
    currentRole?: string;
    experience?: { company: string; role: string; duration?: string }[];
    education?: { degree: string; institution: string; year?: string }[];
  };
}

const BASE_URL = 'https://thenijobs.com';

export default function SeekerIDCard({ seeker }: SeekerIDCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const seekerId = `TNJ-S-${seeker.uid.slice(0, 8).toUpperCase()}`;
  const portfolioUrl = `${BASE_URL}/portfolio/seeker/${seeker.uid}`;
  const topSkills = (seeker.skills || []).slice(0, 4);
  const initial = seeker.name?.[0]?.toUpperCase() || 'S';
  const currentRole = seeker.currentRole || seeker.experience?.[0]?.role || 'Professional Job Seeker';
  const growthSlogan = getSeekerGrowthSlogan(seeker);
  const latestExp = seeker.experience?.[0];
  const latestEdu = seeker.education?.[0];

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const wasFlipped = flipped;

      // Capture front
      setFlipped(false);
      await new Promise(r => setTimeout(r, 450));
      const frontCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });

      // Capture back
      setFlipped(true);
      await new Promise(r => setTimeout(r, 450));
      const backCanvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });

      // Combine onto single printable canvas
      const combined = document.createElement('canvas');
      combined.width = frontCanvas.width;
      combined.height = frontCanvas.height + backCanvas.height + 40;
      const ctx = combined.getContext('2d')!;
      ctx.fillStyle = '#064E3B';
      ctx.fillRect(0, 0, combined.width, combined.height);
      ctx.drawImage(frontCanvas, 0, 0);
      ctx.drawImage(backCanvas, 0, frontCanvas.height + 40);

      const link = document.createElement('a');
      link.download = `${seeker.name.toLowerCase().replace(/\s+/g, '-')}-digital-id.png`;
      link.href = combined.toDataURL('image/png');
      link.click();

      setFlipped(wasFlipped);
      toast.success('Digital ID Card image downloaded successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to download card image');
    } finally {
      setDownloading(false);
    }
  }, [seeker.name, flipped, toast]);

  const handleDownloadPDF = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const wasFlipped = flipped;

      // Capture front
      setFlipped(false);
      await new Promise(r => setTimeout(r, 450));
      const frontCanvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null });

      // Capture back
      setFlipped(true);
      await new Promise(r => setTimeout(r, 450));
      const backCanvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null });

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('THENIJOBS — Official Digital Candidate Pass', 105, 22, { align: 'center' });
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(`Candidate: ${seeker.name} • ID: ${seekerId} • Verified Candidate`, 105, 29, { align: 'center' });

      // Embed front
      const imgFront = frontCanvas.toDataURL('image/png');
      pdf.addImage(imgFront, 'PNG', 45, 38, 120, 75);

      // Embed back
      const imgBack = backCanvas.toDataURL('image/png');
      pdf.addImage(imgBack, 'PNG', 45, 122, 120, 75);

      pdf.setFontSize(9);
      pdf.setTextColor(130);
      pdf.text('Scan QR code on back to view full live portfolio, projects, and verified resume on THENIJOBS.', 105, 208, { align: 'center' });

      pdf.save(`${seeker.name.toLowerCase().replace(/\s+/g, '-')}-id-pass.pdf`);
      setFlipped(wasFlipped);
      toast.success('Printable PDF Pass downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF pass');
    } finally {
      setDownloading(false);
    }
  }, [seeker.name, seekerId, flipped, toast]);


  const handleWhatsAppShare = () => {
    const text = `📇 *${seeker.name}* - Verified THENIJOBS Candidate Pass\n💼 *Role:* ${currentRole}\n📍 *District:* ${seeker.district || 'Theni'}, Tamil Nadu\n💬 "${growthSlogan}"\n\n🌐 View my live verified portfolio & CV:\n${portfolioUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full font-outfit">
      {/* 3D Card Container */}
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
          {/* ─── FRONT SIDE: Candidate Portfolio Pass ─── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-emerald-400/30"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #064E3B 0%, #059669 50%, #10B981 100%)',
            }}
          >
            <div className="relative h-full p-4 sm:p-5 flex flex-col justify-between text-white">
              {/* Top Header: Subtle THENIJOBS Verified Candidate Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                  <div className="w-4 h-4 rounded-md bg-white p-0.5 shadow-xs flex items-center justify-center">
                    <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-100 tracking-wide">Verified Candidate · THENIJOBS</span>
                </div>

                <span className="text-[9px] font-mono bg-black/25 px-2.5 py-0.5 rounded-full font-bold border border-white/20 text-emerald-200">
                  {seekerId}
                </span>
              </div>

              {/* Profile Main Details & Personal Growth Slogan */}
              <div className="flex items-center gap-3.5 my-auto">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                  {seeker.profilePhotoUrl ? (
                    <img src={seeker.profilePhotoUrl} alt={seeker.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl sm:text-2xl font-black text-white">{initial}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-black text-white truncate leading-tight tracking-tight">
                    {seeker.name}
                  </h2>
                  <p className="text-xs font-bold text-emerald-100 mt-0.5 truncate flex items-center gap-1">
                    <Briefcase size={12} className="shrink-0 text-emerald-200" />
                    <span>{currentRole}</span>
                  </p>

                  {/* Dynamic Motivational Personal Growth Slogan */}
                  <p className="text-[10px] text-emerald-100 italic font-medium mt-1 leading-snug line-clamp-1 opacity-90">
                    &ldquo;{growthSlogan}&rdquo;
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-emerald-200 mt-1 font-medium">
                    {seeker.district && (
                      <span className="flex items-center gap-0.5 truncate">
                        <MapPin size={10} className="text-emerald-300 shrink-0" />
                        <span>{seeker.district}, {seeker.state || 'TN'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/20 text-[10px] text-emerald-100 font-medium">
                <div className="flex items-center gap-3 truncate">
                  {seeker.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={10} className="text-emerald-300" /> {seeker.phone}
                    </span>
                  )}
                  {seeker.email && (
                    <span className="flex items-center gap-1 truncate text-emerald-200">
                      <Mail size={10} className="text-emerald-300 shrink-0" /> {seeker.email}
                    </span>
                  )}
                </div>
                <span className="text-[9px] uppercase tracking-wider font-extrabold bg-white/20 px-2 py-0.5 rounded-full shrink-0 ml-2">
                  Flip Card 🔄
                </span>
              </div>
            </div>
          </div>

          {/* ─── BACK SIDE: QR Code & Qualification Summary ─── */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="h-full p-4 sm:p-5 flex gap-3.5 items-center justify-between text-gray-900">
              {/* Left Skills & Summary */}
              <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center font-bold text-[10px] text-emerald-800">
                      {initial}
                    </div>
                    <h3 className="text-xs font-black text-gray-900 truncate">{seeker.name}</h3>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5 truncate">{currentRole}</p>
                </div>

                <div className="space-y-1.5 my-auto">
                  {topSkills.length > 0 && (
                    <div>
                      <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block mb-1">
                        Core Competencies:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {topSkills.map(s => (
                          <span key={s} className="text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {latestEdu && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-700 font-semibold truncate pt-0.5">
                      <GraduationCap size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{latestEdu.degree} — {latestEdu.institution}</span>
                    </div>
                  )}

                  {latestExp && (
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-medium truncate">
                      <Briefcase size={11} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{latestExp.role} at {latestExp.company}</span>
                    </div>
                  )}
                </div>

                <p className="text-[9px] text-emerald-700 font-bold">
                  Scan QR code for live portfolio &amp; CV →
                </p>
              </div>

              {/* Right QR */}
              <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-gray-50 border border-gray-200 shrink-0 shadow-2xs">
                <QRCodeGenerator url={portfolioUrl} size={90} darkColor="#064E3B" lightColor="#FFFFFF" />
                <span className="text-[8px] font-mono font-bold text-gray-500 mt-1">{seekerId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
        <RefreshCw size={12} /> {flipped ? 'Viewing back (QR Code)' : 'Viewing front (Profile)'} · Click card to flip
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>{downloading ? 'Generating...' : 'Print / PDF Pass'}</span>
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Download size={14} />
          <span>Image (PNG)</span>
        </button>

        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="py-2.5 px-3 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          style={{ background: '#25D366' }}
        >
          <MessageCircle size={14} />
          <span>Share</span>
        </button>
      </div>

    </div>
  );
}
