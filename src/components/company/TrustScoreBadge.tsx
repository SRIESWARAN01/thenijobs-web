'use client';

import { useMemo } from 'react';
import { ShieldCheck, Star, Clock, FileText, Globe, Phone, Mail, Image as ImageIcon, MapPin } from 'lucide-react';

interface TrustScoreProps {
  company: {
    verificationStatus?: string;
    logoUrl?: string;
    coverUrl?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    district?: string;
    description?: string;
    category?: string;
    socialLinks?: Record<string, string>;
    galleryImages?: string[];
    rating?: number;
    reviewsCount?: number;
    isPremium?: boolean;
    createdAt?: any;
  };
  variant?: 'badge' | 'detailed';
}

interface ScoreFactor {
  label: string;
  points: number;
  met: boolean;
  icon: any;
}

function computeTrustScore(company: TrustScoreProps['company']): {
  score: number;
  level: string;
  color: string;
  factors: ScoreFactor[];
} {
  const factors: ScoreFactor[] = [
    { label: 'Verified Status', points: 25, met: company.verificationStatus === 'verified', icon: ShieldCheck },
    { label: 'Logo Uploaded', points: 10, met: !!company.logoUrl, icon: ImageIcon },
    { label: 'Phone Number', points: 10, met: !!company.phone, icon: Phone },
    { label: 'Email Address', points: 10, met: !!company.email, icon: Mail },
    { label: 'Website Link', points: 5, met: !!company.website, icon: Globe },
    { label: 'Business Address', points: 10, met: !!(company.address || company.district), icon: MapPin },
    { label: 'Description Added', points: 10, met: !!(company.description && company.description.length > 30), icon: FileText },
    { label: 'Category Set', points: 5, met: !!company.category, icon: FileText },
    { label: 'Has Reviews', points: 10, met: !!(company.reviewsCount && company.reviewsCount > 0), icon: Star },
    { label: '6+ Months Active', points: 5, met: (() => {
      if (!company.createdAt) return false;
      const created = company.createdAt?.toDate?.() || new Date(company.createdAt);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return created < sixMonthsAgo;
    })(), icon: Clock },
  ];

  const score = factors.reduce((sum, f) => sum + (f.met ? f.points : 0), 0);

  let level = 'New';
  let color = 'text-slate-500';
  if (score >= 90) { level = 'Excellent'; color = 'text-emerald-600'; }
  else if (score >= 70) { level = 'Very Good'; color = 'text-teal-600'; }
  else if (score >= 50) { level = 'Good'; color = 'text-blue-600'; }
  else if (score >= 30) { level = 'Basic'; color = 'text-amber-600'; }

  return { score, level, color, factors };
}

/**
 * TrustScoreBadge — Shows a compact trust score badge or detailed breakdown
 */
export default function TrustScoreBadge({ company, variant = 'badge' }: TrustScoreProps) {
  const { score, level, color, factors } = useMemo(() => computeTrustScore(company), [company]);

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-slate-200 px-2.5 py-1 text-xs font-bold shadow-sm">
        <ShieldCheck size={13} className={color} />
        <span className={color}>{score}%</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-600">{level}</span>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck size={15} className={color} />
          Trust Score
        </h3>
        <span className={`text-lg font-black ${color}`}>{score}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-slate-100 mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            background: score >= 90 ? '#059669' : score >= 70 ? '#0d9488' : score >= 50 ? '#2563eb' : score >= 30 ? '#d97706' : '#64748b'
          }}
        />
      </div>

      <p className={`text-xs font-semibold mb-3 ${color}`}>{level} Trust Level</p>

      {/* Factor breakdown */}
      <div className="grid grid-cols-2 gap-1.5">
        {factors.map((factor) => {
          const Icon = factor.icon;
          return (
            <div
              key={factor.label}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold ${
                factor.met
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}
            >
              <Icon size={10} />
              <span className="truncate">{factor.label}</span>
              <span className="ml-auto font-black">{factor.met ? `+${factor.points}` : '0'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { computeTrustScore };
