'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Shield, Building2, UserCheck, MapPin, Phone, Mail, Globe, CheckCircle } from 'lucide-react';
import PlanBadge from './PlanBadge';

interface TheniJobsIdCardProps {
  name: string;
  theniJobsId: string;
  registrationNumber?: string;
  roleOrTagline?: string;
  photoUrl?: string;
  logoUrl?: string;
  plan?: string;
  district?: string;
  phone?: string;
  email?: string;
  portfolioUrl?: string;
  userType?: 'company' | 'seeker';
}

export default function TheniJobsIdCard({
  name,
  theniJobsId,
  registrationNumber,
  roleOrTagline,
  photoUrl,
  logoUrl,
  plan = 'free',
  district = 'Theni',
  phone,
  email,
  portfolioUrl,
  userType = 'company',
}: TheniJobsIdCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const targetUrl = portfolioUrl || `https://thenijobs.com/verify/${theniJobsId}`;
    QRCode.toDataURL(targetUrl, { width: 150, margin: 1 })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error(err));
  }, [portfolioUrl, theniJobsId]);

  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-6"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Bar: THENIJOBS Branding & Plan Badge */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs">
            TJ
          </div>
          <div>
            <p className="text-xs font-black tracking-wider uppercase text-blue-400">THENIJOBS</p>
            <p className="text-[8px] text-gray-400 uppercase tracking-widest">Verified Digital ID Card</p>
          </div>
        </div>
        <PlanBadge plan={plan} size="sm" />
      </div>

      {/* Main Body */}
      <div className="flex items-start gap-4 mb-4">
        {/* Photo / Logo */}
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-700 border-2 border-blue-400/50 shadow-md">
            {photoUrl || logoUrl ? (
              <img src={photoUrl || logoUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white bg-blue-600">
                {name?.[0] || 'U'}
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-blue-500 text-white">
            <CheckCircle size={12} className="fill-blue-500 stroke-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {name}
          </h3>
          {roleOrTagline && (
            <p className="text-xs text-blue-300 truncate mt-0.5">{roleOrTagline}</p>
          )}
          <div className="mt-2 space-y-0.5">
            <p className="text-[10px] text-gray-400 font-mono">
              ID: <span className="font-bold text-white">{theniJobsId || 'TJ-C-00000'}</span>
            </p>
            {registrationNumber && (
              <p className="text-[9px] text-gray-400 font-mono">
                REG: <span className="text-gray-300">{registrationNumber}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-white/5 border border-white/10 mb-4 text-[10px]">
        {district && (
          <div className="flex items-center gap-1.5 text-gray-300">
            <MapPin size={11} className="text-blue-400 flex-shrink-0" />
            <span className="truncate">{district}, Tamil Nadu</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-1.5 text-gray-300">
            <Phone size={11} className="text-emerald-400 flex-shrink-0" />
            <span className="truncate">{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-1.5 text-gray-300 col-span-2">
            <Mail size={11} className="text-amber-400 flex-shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
      </div>

      {/* Footer: QR Code & Verify Stamp */}
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <div className="text-[8px] text-gray-400 space-y-0.5">
          <p className="text-gray-300 font-semibold">Official Platform Identity</p>
          <p>Scan QR code to verify authenticity</p>
          <p className="text-blue-400">thenijobs.com</p>
        </div>
        {qrCodeUrl && (
          <div className="p-1 bg-white rounded-lg shadow-md">
            <img src={qrCodeUrl} alt="QR Code" className="w-12 h-12 rounded" />
          </div>
        )}
      </div>
    </div>
  );
}
