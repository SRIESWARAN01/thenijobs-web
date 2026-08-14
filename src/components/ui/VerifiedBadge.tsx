'use client';

import { useState } from 'react';
import { Check, Sparkles, ShieldCheck, Award, Star, Shield, Info } from 'lucide-react';

export type PlanTier = 'free' | 'basic' | 'standard' | 'premium' | 'enterprise';

interface VerifiedBadgeProps {
  tier?: PlanTier | string;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  companyName?: string;
  verifiedDate?: string;
  className?: string;
}

export default function VerifiedBadge({
  tier = 'free',
  isVerified = true,
  size = 'md',
  showLabel = true,
  companyName,
  verifiedDate = 'August 2026',
  className = '',
}: VerifiedBadgeProps) {
  const [showModal, setShowModal] = useState(false);
  const plan = (tier || 'free').toLowerCase() as PlanTier;

  // Icon Sizes
  const sizeMap = {
    sm: { badge: 'w-4 h-4', icon: 10, text: 'text-[10px]' },
    md: { badge: 'w-5 h-5', icon: 12, text: 'text-xs' },
    lg: { badge: 'w-6 h-6', icon: 14, text: 'text-sm' },
    xl: { badge: 'w-8 h-8', icon: 18, text: 'text-base' },
  };
  const currentSize = sizeMap[size] || sizeMap.md;

  if (!isVerified && plan === 'free') {
    return null;
  }

  // 1. Basic (🟢 Forest Green Single Ring)
  if (plan === 'basic') {
    return (
      <>
        <button
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold transition-all hover:bg-emerald-100 ${className}`}
          title="THENIJOBS Verified — Identity Verified"
        >
          <div className={`${currentSize.badge} rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-emerald-300`}>
            <Check size={currentSize.icon} strokeWidth={3} />
          </div>
          {showLabel && <span className={`${currentSize.text} font-bold text-emerald-800`}>✓ Verified</span>}
        </button>

        {showModal && (
          <VerificationModal
            plan="basic"
            title="THENIJOBS Verified"
            subtitle="Identity Verified"
            color="emerald"
            companyName={companyName}
            verifiedDate={verifiedDate}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // 2. Standard (🟢 Emerald + Teal Double Ring)
  if (plan === 'standard') {
    return (
      <>
        <button
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-300 text-teal-900 font-bold transition-all hover:bg-teal-100 shadow-xs ${className}`}
          title="THENIJOBS Authorized — Verified & Authorized Profile"
        >
          <div className={`${currentSize.badge} rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shrink-0 ring-2 ring-teal-300 shadow-sm relative`}>
            <Check size={currentSize.icon} strokeWidth={3} />
          </div>
          {showLabel && <span className={`${currentSize.text} font-bold text-teal-900`}>✓ Authorized</span>}
        </button>

        {showModal && (
          <VerificationModal
            plan="standard"
            title="THENIJOBS Authorized"
            subtitle="Verified & Authorized Profile"
            color="teal"
            companyName={companyName}
            verifiedDate={verifiedDate}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // 3. Premium (🟡 Gold + Amber Double Ring + Sparkle)
  if (plan === 'premium') {
    return (
      <>
        <button
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 font-extrabold border border-amber-300 shadow-sm transition-all hover:brightness-105 ${className}`}
          title="THENIJOBS Premium — Premium Verified Profile"
        >
          <div className={`${currentSize.badge} rounded-full bg-amber-950 text-amber-300 flex items-center justify-center shrink-0 ring-2 ring-amber-300 shadow-sm relative`}>
            <Sparkles size={currentSize.icon} className="fill-amber-300" />
          </div>
          {showLabel && <span className={`${currentSize.text} font-extrabold text-amber-950`}>★ Premium Verified</span>}
        </button>

        {showModal && (
          <VerificationModal
            plan="premium"
            title="THENIJOBS Premium"
            subtitle="Premium Verified Profile"
            color="amber"
            companyName={companyName}
            verifiedDate={verifiedDate}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // 4. Enterprise (🔵 Royal + Electric Blue Advanced Double Ring + Micro Glow)
  if (plan === 'enterprise') {
    return (
      <>
        <button
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white font-extrabold border border-blue-400 shadow-md transition-all hover:brightness-110 ${className}`}
          title="THENIJOBS Enterprise — Enterprise Authorized Business"
        >
          <div className={`${currentSize.badge} rounded-full bg-white text-blue-700 flex items-center justify-center shrink-0 ring-2 ring-blue-300 shadow-sm`}>
            <ShieldCheck size={currentSize.icon} strokeWidth={2.5} />
          </div>
          {showLabel && <span className={`${currentSize.text} font-extrabold text-white tracking-wide`}>◆ Enterprise Authorized</span>}
        </button>

        {showModal && (
          <VerificationModal
            plan="enterprise"
            title="THENIJOBS Enterprise"
            subtitle="Enterprise Authorized Business"
            color="blue"
            companyName={companyName}
            verifiedDate={verifiedDate}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // Fallback Basic Verified
  return (
    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
      <Check size={14} strokeWidth={3} /> Verified
    </span>
  );
}

{/* Verification Card Modal */}
function VerificationModal({
  plan,
  title,
  subtitle,
  color,
  companyName,
  verifiedDate,
  onClose,
}: {
  plan: string;
  title: string;
  subtitle: string;
  color: 'emerald' | 'teal' | 'amber' | 'blue';
  companyName?: string;
  verifiedDate: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl font-sans border border-gray-100 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Bar */}
        <div className={`h-2 absolute top-0 left-0 right-0 ${
          color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-indigo-700' :
          color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
          color === 'teal' ? 'bg-gradient-to-r from-teal-600 to-emerald-500' :
          'bg-emerald-600'
        }`} />

        {/* Large Badge Icon */}
        <div className="pt-2">
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white shadow-lg ${
            color === 'blue' ? 'bg-gradient-to-tr from-blue-700 to-indigo-800 ring-4 ring-blue-100' :
            color === 'amber' ? 'bg-gradient-to-tr from-amber-500 to-yellow-500 text-amber-950 ring-4 ring-amber-100' :
            color === 'teal' ? 'bg-gradient-to-tr from-teal-600 to-emerald-500 ring-4 ring-teal-100' :
            'bg-emerald-600 ring-4 ring-emerald-100'
          }`}>
            {color === 'amber' ? (
              <Sparkles size={32} className="fill-amber-950" />
            ) : color === 'blue' ? (
              <ShieldCheck size={36} />
            ) : (
              <Check size={36} strokeWidth={3} />
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 font-sans">{title}</h3>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">{subtitle}</p>
          {companyName && (
            <div className="mt-2 text-sm font-extrabold text-gray-900 bg-gray-50 py-1.5 px-3 rounded-xl border border-gray-100">
              {companyName}
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="text-left bg-gray-50 rounded-2xl p-3.5 space-y-2 text-xs border border-gray-100">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Check size={14} className="text-emerald-600 shrink-0" strokeWidth={3} />
            <span>Identity & Document Verified</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <Check size={14} className="text-emerald-600 shrink-0" strokeWidth={3} />
            <span>THENIJOBS Admin Approved</span>
          </div>
          {['premium', 'enterprise'].includes(plan) && (
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <Check size={14} className="text-emerald-600 shrink-0" strokeWidth={3} />
              <span>Priority Business Listing Active</span>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-medium">
          <span>Authorized by THENIJOBS</span>
          <span>Verified: {verifiedDate}</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-black transition-colors"
        >
          Close Authorization Card
        </button>
      </div>
    </div>
  );
}
