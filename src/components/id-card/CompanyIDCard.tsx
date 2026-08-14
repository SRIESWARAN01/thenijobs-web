'use client';

import { useState, useRef, useCallback } from 'react';
import { MapPin, Phone, Globe, MessageCircle, Building2, Mail, Briefcase } from 'lucide-react';
import QRCodeGenerator from './QRCodeGenerator';

interface CompanyIDCardProps {
  company: {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    phone: string;
    whatsapp?: string;
    email: string;
    website?: string;
    address: string;
    district: string;
    state: string;
    logoUrl?: string;
    verificationStatus?: string;
  };
}

const BASE_URL = 'https://thenijobs.com';

export default function CompanyIDCard({ company }: CompanyIDCardProps) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const companyId = `TNJ-C-${company.id.slice(0, 8).toUpperCase()}`;
  const portfolioUrl = `${BASE_URL}/company/${company.slug}`;
  const shortDesc = company.description?.length > 80
    ? company.description.slice(0, 77) + '...'
    : company.description || '';

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import('html2canvas')).default;

    // Capture both sides
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

    // Combine into one image (front on top, back below)
    const combined = document.createElement('canvas');
    combined.width = frontCanvas.width;
    combined.height = frontCanvas.height + backCanvas.height + 40;
    const ctx = combined.getContext('2d')!;
    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(0, 0, combined.width, combined.height);
    ctx.drawImage(frontCanvas, 0, 0);
    ctx.drawImage(backCanvas, 0, frontCanvas.height + 40);

    const link = document.createElement('a');
    link.download = `${company.slug}-id-card.png`;
    link.href = combined.toDataURL('image/png');
    link.click();

    setFlipped(wasFlipped);
  }, [company.slug, flipped]);

  const initial = company.name?.[0]?.toUpperCase() || 'C';

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card Container */}
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
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
            }}
          >
            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 25% 75%, white 0%, transparent 50%), radial-gradient(circle at 75% 25%, white 0%, transparent 50%)',
              }}
            />

            <div className="relative h-full p-5 flex flex-col justify-between text-white">
              {/* Top: Brand */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">T</div>
                  <span className="text-xs font-semibold opacity-80" style={{ fontFamily: "'Poppins', sans-serif" }}>THENIJOBS</span>
                </div>
                <span className="text-[9px] font-mono bg-white/15 px-2 py-0.5 rounded-full">{companyId}</span>
              </div>

              {/* Middle: Company info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <span className="text-2xl font-bold">{initial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                    {company.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-blue-100 mt-0.5">
                    <Briefcase size={10} />
                    <span>{company.category}</span>
                  </div>
                  <p className="text-[10px] text-blue-200 mt-1 line-clamp-2 leading-relaxed">{shortDesc}</p>
                </div>
              </div>

              {/* Bottom: Contact */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-blue-100">
                  <Phone size={10} />
                  <span>{company.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-blue-100">
                  <MapPin size={10} />
                  <span>{company.district}</span>
                </div>
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
              {/* Left: Details */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                {/* Brand */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[8px] font-bold">T</div>
                  <span className="text-[9px] font-bold text-gray-400">THENIJOBS COMPANY ID</span>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={11} className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-[10px] text-gray-600 leading-relaxed">{company.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={11} className="text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-600">{company.phone}</span>
                  </div>
                  {company.whatsapp && (
                    <div className="flex items-center gap-2">
                      <MessageCircle size={11} className="text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-600">{company.whatsapp}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail size={11} className="text-gray-400 shrink-0" />
                    <span className="text-[10px] text-gray-600 truncate">{company.email}</span>
                  </div>
                  {company.website && (
                    <div className="flex items-center gap-2">
                      <Globe size={11} className="text-gray-400 shrink-0" />
                      <span className="text-[10px] text-blue-600 truncate">{company.website}</span>
                    </div>
                  )}
                </div>

                {/* Scan instruction */}
                <p className="text-[8px] text-gray-400">Scan QR to view company portfolio →</p>
              </div>

              {/* Right: QR Code */}
              <div className="flex flex-col items-center justify-center gap-2 shrink-0">
                <QRCodeGenerator url={portfolioUrl} size={110} darkColor="#1E3A8A" lightColor="#FFFFFF" />
                <span className="text-[8px] font-mono text-gray-400">{companyId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flip hint */}
      <p className="text-xs text-gray-400">
        {flipped ? 'Showing back side' : 'Showing front side'} · Click card to flip
      </p>

      {/* Download Button */}
      <button
        onClick={(e) => { e.stopPropagation(); handleDownload(); }}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-all"
        style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
      >
        <Building2 size={16} />
        Download ID Card (PNG)
      </button>
    </div>
  );
}
