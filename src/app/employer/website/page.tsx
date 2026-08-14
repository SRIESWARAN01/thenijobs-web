'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe, Eye, Edit3, Palette, Settings2, ExternalLink,
  Loader2, Plus, Lock, Sparkles, BarChart3, QrCode,
  Monitor, Laptop, Tablet, Smartphone, Share2, Copy, Check,
  ArrowUpRight, Zap, Shield, Crown, Diamond
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection, useDocument } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { PORTFOLIO_TEMPLATES, TEMPLATE_PLAN_ACCESS } from '@/lib/constants';
import { getTemplatesForPlan, canAccessTemplate } from '@/lib/plans';
import type { PortfolioSite } from '@/lib/types/portfolio';
import { PLAN_BADGES } from '@/lib/types/portfolio';

export default function EmployerWebsitePage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Fetch company
  const { data: companies, loading: compLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies?.[0];

  // Fetch portfolio site
  const { data: sites, loading: siteLoading } = useCollection<any>('portfolioSites', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const site = sites?.[0] as PortfolioSite | undefined;

  const planSlug = company?.planSlug || 'free';
  const isLoading = compLoading || siteLoading;

  const siteUrl = site?.customUrl ? `https://thenijobs.com/portfolio/${site.customUrl}` : '';
  const currentTemplate = PORTFOLIO_TEMPLATES.find(t => t.id === site?.templateId);
  const availableTemplates = getTemplatesForPlan(planSlug);
  const badge = PLAN_BADGES.find(b => b.plan === planSlug) || PLAN_BADGES[0];

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
        <p className="text-sm text-gray-500">Loading website settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            My Website
          </h1>
          <p className="text-sm text-gray-500 mt-1">Build and manage your company portfolio website</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: badge.bgColor, color: badge.color, border: `1px solid ${badge.borderColor}` }}>
            {badge.emoji} {badge.label}
          </span>
        </div>
      </div>

      {/* Website Status Card */}
      {site ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Status Bar */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: site.status === 'published' ? '#F0FDF4' : '#FFF7ED' }}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${site.status === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {site.status === 'published' ? '🟢 Website Live' : '🟡 Draft Mode'}
                </p>
                <p className="text-[10px] text-gray-500">
                  Template: {currentTemplate?.name || 'Not selected'} • {site.visibility === 'public' ? 'Public' : 'Private'}
                </p>
              </div>
            </div>
            {site.status === 'published' && siteUrl && (
              <a href={siteUrl} target="_blank" rel="noopener" className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-emerald-700 transition-all">
                <ExternalLink size={12} /> Visit Site
              </a>
            )}
          </div>

          {/* URL */}
          {siteUrl && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
              <Globe size={14} className="text-gray-400" />
              <span className="text-xs text-gray-500 flex-1 truncate font-mono">{siteUrl}</span>
              <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
                <Share2 size={14} />
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-5 py-4 border-t border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/employer/website/editor" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-center group">
                <Edit3 size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700">Edit Website</span>
              </Link>
              <Link href="/employer/website/templates" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-all text-center group">
                <Palette size={20} className="text-violet-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700">Templates</span>
              </Link>
              <Link href="/employer/website/settings" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-center group">
                <Settings2 size={20} className="text-gray-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700">Settings</span>
              </Link>
              <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all text-center group">
                <QrCode size={20} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-gray-700">QR Code</span>
              </button>
            </div>
          </div>

          {/* Analytics Summary */}
          {site.analytics && (
            <div className="px-5 py-4 border-t border-gray-100 grid grid-cols-3 gap-4">
              {[
                { label: 'Total Views', value: site.analytics.totalViews || 0, icon: Eye, color: '#2563EB' },
                { label: 'Unique Visitors', value: site.analytics.uniqueVisitors || 0, icon: BarChart3, color: '#7C3AED' },
                { label: 'Enquiries', value: site.analytics.enquiries || 0, icon: Sparkles, color: '#059669' },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center">
                    <Icon size={16} style={{ color: stat.color }} className="mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[10px] text-gray-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* No Site — Create Card */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Globe size={28} className="text-blue-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Create Your Website
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Build a professional portfolio website for your business. Choose from {availableTemplates.length} templates available in your plan.
          </p>
          <Link href="/employer/website/templates" className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all">
            <Plus size={16} /> Choose Template & Start
          </Link>
        </div>
      )}

      {/* Template Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Available Templates</h3>
          <Link href="/employer/website/templates" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
            View All <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PORTFOLIO_TEMPLATES.slice(0, 5).map(tmpl => {
            const isAccessible = canAccessTemplate(planSlug, tmpl.id);
            const isCurrent = site?.templateId === tmpl.id;
            return (
              <div key={tmpl.id} className={`relative border overflow-hidden transition-all ${isCurrent ? 'border-blue-400 ring-2 ring-blue-100' : isAccessible ? 'border-gray-100 hover:border-gray-200 hover:shadow-md' : 'border-gray-100 opacity-60'}`} style={{ borderRadius: '12px' }}>
                {/* Preview Thumbnail */}
                <div className="h-24 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tmpl.plan === 'free' ? '#EFF6FF' : tmpl.plan === 'standard' ? '#F0FDF4' : tmpl.plan === 'premium' ? '#FEF3C7' : '#F5F3FF'}, #FFF)` }}>
                  <Globe size={20} className="text-gray-300" />
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] font-bold text-gray-900 truncate">{tmpl.name}</p>
                  <p className="text-[9px] text-gray-500">{tmpl.bestFor}</p>
                </div>
                {!isAccessible && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="text-center">
                      <Lock size={14} className="mx-auto text-gray-400" />
                      <p className="text-[9px] font-bold text-gray-500 mt-1">{tmpl.plan.toUpperCase()}</p>
                    </div>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-blue-600 text-[8px] font-bold text-white">ACTIVE</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Features by Plan */}
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl border border-blue-100 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Zap size={16} className="text-blue-600" /> Unlock More Features
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { plan: 'Free', templates: 3, icon: Shield, color: '#6B7280', sections: 7 },
            { plan: 'Standard', templates: 6, icon: Crown, color: '#0F766E', sections: 11 },
            { plan: 'Premium', templates: 11, icon: Sparkles, color: '#D97706', sections: 19 },
            { plan: 'Enterprise', templates: 15, icon: Diamond, color: '#7C3AED', sections: 26 },
          ].map(tier => {
            const Icon = tier.icon;
            const isActive = planSlug === tier.plan.toLowerCase();
            return (
              <div key={tier.plan} className={`p-3 rounded-xl bg-white border ${isActive ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100'}`}>
                <Icon size={16} style={{ color: tier.color }} className="mb-1.5" />
                <p className="text-xs font-bold text-gray-900">{tier.plan}</p>
                <p className="text-[10px] text-gray-500">{tier.templates} templates</p>
                <p className="text-[10px] text-gray-500">{tier.sections} sections</p>
                {isActive && <span className="text-[8px] font-bold text-blue-600 mt-1 block">CURRENT</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
