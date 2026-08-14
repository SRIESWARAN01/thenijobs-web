'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe, Eye, Edit3, Palette, ExternalLink, Loader2, Plus, Lock,
  Sparkles, QrCode, Copy, Check, Share2, ArrowUpRight, UserCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { PORTFOLIO_TEMPLATES } from '@/lib/constants';
import { getTemplatesForPlan } from '@/lib/plans';
import type { PortfolioSite } from '@/lib/types/portfolio';
import { PLAN_BADGES } from '@/lib/types/portfolio';

export default function SeekerPortfolioPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: profile, loading: profLoading } = useDocument<any>('seekerProfiles', user?.uid);

  const { data: sites, loading: siteLoading } = useCollection<any>('portfolioSites', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const site = sites?.[0] as PortfolioSite | undefined;

  const planSlug = 'free'; // Seekers get free portfolio access
  const isLoading = profLoading || siteLoading;

  const siteUrl = site?.customUrl ? `https://thenijobs.com/portfolio/${site.customUrl}` : '';
  const currentTemplate = PORTFOLIO_TEMPLATES.find(t => t.id === site?.templateId);
  const badge = PLAN_BADGES[0];

  const handleCopy = () => {
    if (siteUrl) {
      navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 size={28} className="animate-spin text-blue-500" />
        <p className="text-sm text-gray-500">Loading portfolio website...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            My Portfolio Website
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create a stunning digital portfolio to showcase your skills & experience to employers</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
            <UserCheck size={13} /> Job Seeker Portfolio
          </span>
        </div>
      </div>

      {/* Website Status Card */}
      {site ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: site.status === 'published' ? '#F0FDF4' : '#FFF7ED' }}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${site.status === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {site.status === 'published' ? '🟢 Portfolio Live' : '🟡 Draft Mode'}
                </p>
                <p className="text-[10px] text-gray-500">
                  Template: {currentTemplate?.name || 'Selected'}
                </p>
              </div>
            </div>
            {site.status === 'published' && siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-emerald-700 transition-all">
                <ExternalLink size={12} /> View Portfolio
              </a>
            )}
          </div>

          {siteUrl && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
              <Globe size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500 flex-1 truncate font-mono">{siteUrl}</span>
              <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            </div>
          )}

          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <Link href="/employer/website/editor" className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold text-center hover:bg-blue-700 flex items-center justify-center gap-1.5">
              <Edit3 size={14} /> Edit Portfolio
            </Link>
            <Link href="/employer/website/templates" className="py-3 px-5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1.5">
              <Palette size={14} /> Templates
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Globe size={28} className="text-blue-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Build Your Portfolio Website
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Stand out to top recruiters in Theni with an interactive resume and digital portfolio website.
          </p>
          <Link href="/employer/website/templates" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all">
            <Plus size={16} /> Select Template & Build
          </Link>
        </div>
      )}
    </div>
  );
}
