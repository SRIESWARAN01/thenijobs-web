'use client';

import { useState, useRef, useCallback } from 'react';
import { MapPin, Phone, User, GraduationCap, Award, Briefcase } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

interface SeekerIDCardProps {
  seeker: {
    uid: string;
    name: string;
    phone?: string;
    email?: string;
    profilePhotoUrl?: string;
    district?: string;
    state?: string;
    address?: string;
    skills?: string[];
    currentRole?: string;
    experience?: { company: string; role: string }[];
    education?: { degree: string; institution: string }[];
  };
}

const BASE_URL = 'https://thenijobs.com';

export default function SeekerIDCard({ seeker }: SeekerIDCardProps) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const seekerId = `TNJ-S-${seeker.uid.slice(0, 8).toUpperCase()}`;
  const portfolioUrl = `${BASE_URL}/portfolio/seeker/${seeker.uid}`;
  const topSkills = (seeker.skills || []).slice(0, 5);
  const initial = seeker.name?.[0]?.toUpperCase() || 'S';
  const currentRole = seeker.currentRole
    || seeker.experience?.[0]?.role
    || 'Job Seeker';

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import('html2canvas')).default;

    const wasFlipped = flipped;

    // Capture front
    setFlipped(false);
    await new Promise(r => setTimeout(r, 400));
    const frontCanvas = await html2canvas(cardRef.current, {
      scale: 3, backgroundColor: null, useCORS: true,
    });

    // Capture back
    setFlipped(true);
    await new Promise(r => setTimeout(r, 400));
    const backCanvas = await html2canvas(cardRef.current, {
      scale: 3, backgroundColor: null, useCORS: true,
    });

    // Combine
    const combined = document.createElement('canvas');
    combined.width = frontCanvas.width;
    combined.height = frontCanvas.height + backCanvas.height + 40;
    const ctx = combined.getContext('2d')!;
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, combined.width, combined.height);
    ctx.drawImage(frontCanvas, 0, 0);
    ctx.drawImage(backCanvas, 0, frontCanvas.height + 40);

    const link = document.createElement('a');
    link.download = `${seeker.name.toLowerCase().replace(/\s+/g, '-')}-id-card.png`;
    link.href = combined.toDataURL('image/png');
    link.click();

    setFlipped(wasFlipped);
  }, [seeker.name, flipped]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card */}
      <div
        className="cursor-pointer"
        style={{ perspective: '1200px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          ref={cardRef}
          className="relative transition-transform duration-700"
          style={{
            width: 380, height: 240,
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          {/* ─── FRONT ─── */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)',
              }}
            />
            <div className="relative h-full p-5 flex flex-col justify-between text-white">
              {/* Top */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="THENIJOBS" className="h-6 w-auto object-contain bg-white/90 rounded p-0.5" />
                  <span className="text-xs font-semibold opacity-80" style={{ fontFamily: "'Poppins', sans-serif" }}>THENIJOBS</span>
                </div>
                <span className="text-[9px] font-mono bg-white/15 px-2 py-0.5 rounded-full">{seekerId}</span>
              </div>

              {/* Middle */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {seeker.profilePhotoUrl ? (
                    <img src={seeker.profilePhotoUrl} alt={seeker.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">{initial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {seeker.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-100 mt-0.5">
                    <Briefcase size={10} />
                    <span>{currentRole}</span>
                  </div>
                  {seeker.district && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-200 mt-1">
                      <MapPin size={10} />
                      <span>{seeker.district}, {seeker.state || 'Tamil Nadu'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom */}
              <div className="flex items-center justify-between">
                {seeker.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                    <Phone size={10} />
                    <span>{seeker.phone}</span>
                  </div>
                )}
                <span className="text-[9px] text-emerald-200 ml-auto">Job Seeker ID Card</span>
              </div>
            </div>
          </div>

          {/* ─── BACK ─── */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
            }}
          >
            <div className="h-full p-5 flex gap-4">
              {/* Left */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div className="flex items-center gap-1.5">
                  <img src="/logo.png" alt="THENIJOBS" className="h-5 w-auto object-contain" />
                  <span className="text-[9px] font-bold text-gray-600">THENIJOBS SEEKER ID</span>
                </div>

                <div className="space-y-2">
                  {seeker.address && (
                    <div className="flex items-start gap-2">
                      <MapPin size={11} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-[10px] text-gray-600 leading-relaxed line-clamp-2">{seeker.address}</span>
                    </div>
                  )}

                  {topSkills.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Award size={11} className="text-gray-400 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {topSkills.map(s => (
                          <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {seeker.education?.[0] && (
                    <div className="flex items-center gap-2">
                      <GraduationCap size={11} className="text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-600 truncate">
                        {seeker.education[0].degree} — {seeker.education[0].institution}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[8px] text-gray-400">Scan QR to view portfolio →</p>
              </div>

              {/* Right: QR */}
              <div className="flex flex-col items-center justify-center gap-2 shrink-0">
                <QRCodeGenerator url={portfolioUrl} size={110} darkColor="#059669" lightColor="#FFFFFF" />
                <span className="text-[8px] font-mono text-gray-400">{seekerId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        {flipped ? 'Showing back side' : 'Showing front side'} · Click card to flip
      </p>

      <button
        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-all"
        style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
      >
        <User size={16} />
        Download ID Card (PNG)
      </button>
    </div>
  );
}
