'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Laptop, Tablet, Smartphone, X, Sparkles, Check, ExternalLink,
  Palette, Layers, Type, Lock, ShieldCheck, Save, Loader2,
  QrCode, Globe, Copy, ChevronDown, CheckCircle2
} from 'lucide-react';
import TemplateRenderer from './TemplateRenderer';
import SeekerIDCard from '@/components/id-card/SeekerIDCard';
import SeekerPublicProfileModal from '@/components/payment/SeekerPublicProfileModal';
import {
  buildSeekerPortfolioSite,
  CANDIDATE_TEMPLATES,
  CANDIDATE_THEME_PRESETS,
  BANNER_GRADIENT_PRESETS,
  type SeekerAdapterInput
} from '@/lib/portfolio/seekerPortfolioAdapter';
import type { PortfolioSite, PortfolioTheme } from '@/lib/types/portfolio';
import { SEEKER_PUBLIC_PROFILE_FEE_INR } from '@/lib/constants';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export type DeviceMode = 'laptop' | 'tablet' | 'mobile';

interface CandidatePortfolioLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialProfile: SeekerAdapterInput;
  onPortfolioPublished?: () => void;
}

const DEVICE_SPECS: Record<DeviceMode, { name: string; icon: any; width: string; height: string; label: string }> = {
  laptop: {
    name: 'Desktop / Laptop',
    icon: Laptop,
    width: 'w-full max-w-[1240px]',
    height: 'h-[75vh]',
    label: '1240px × 800px',
  },
  tablet: {
    name: 'Tablet (iPad)',
    icon: Tablet,
    width: 'w-[768px]',
    height: 'h-[78vh]',
    label: '768px × 1024px',
  },
  mobile: {
    name: 'Mobile Phone',
    icon: Smartphone,
    width: 'w-[375px]',
    height: 'h-[78vh]',
    label: '375px × 812px',
  },
};

export default function CandidatePortfolioLiveModal({
  isOpen,
  onClose,
  userId,
  initialProfile,
  onPortfolioPublished,
}: CandidatePortfolioLiveModalProps) {
  const toast = useToast();

  const [device, setDevice] = useState<DeviceMode>('laptop');
  const [activeView, setActiveView] = useState<'portfolio' | 'idcard'>('portfolio');
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialProfile.templateId || 'seeker-modern-pro');
  const [selectedTheme, setSelectedTheme] = useState<Partial<PortfolioTheme>>({
    primaryColor: initialProfile.theme?.primaryColor || CANDIDATE_THEME_PRESETS[0].primary,
    secondaryColor: initialProfile.theme?.secondaryColor || CANDIDATE_THEME_PRESETS[0].secondary,
    fontFamily: initialProfile.theme?.fontFamily || 'Inter',
    headingFont: initialProfile.theme?.headingFont || 'Poppins',
  });
  const [selectedCover, setSelectedCover] = useState<string>(initialProfile.coverImage || BANNER_GRADIENT_PRESETS[0].url);

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isPublic, setIsPublic] = useState(Boolean(initialProfile.isPortfolioPublic));
  const [savingTheme, setSavingTheme] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync with remote settings on open
  useEffect(() => {
    if (!isOpen || !userId) return;
    setIsPublic(Boolean(initialProfile.isPortfolioPublic));
    async function fetchSavedSettings() {
      try {
        const siteDoc = await getDoc(doc(db, 'portfolioSites', `site-${userId}`));
        if (siteDoc.exists()) {
          const sData = siteDoc.data() as PortfolioSite;
          if (sData.templateId) setSelectedTemplate(sData.templateId);
          if (sData.theme) {
            setSelectedTheme({
              primaryColor: sData.theme.primaryColor || CANDIDATE_THEME_PRESETS[0].primary,
              secondaryColor: sData.theme.secondaryColor || CANDIDATE_THEME_PRESETS[0].secondary,
              fontFamily: sData.theme.fontFamily || 'Inter',
              headingFont: sData.theme.headingFont || 'Poppins',
            });
          }
          if (sData.branding?.coverImage) setSelectedCover(sData.branding.coverImage);
          if (sData.status === 'published') setIsPublic(true);
        }
      } catch (e) {
        console.warn('Could not load existing portfolio site settings:', e);
      }
    }
    fetchSavedSettings();
  }, [isOpen, userId, initialProfile.isPortfolioPublic]);

  // Dynamically build the live site
  const liveSite = useMemo<PortfolioSite>(() => {
    return buildSeekerPortfolioSite({
      ...initialProfile,
      userId,
      templateId: selectedTemplate,
      theme: selectedTheme,
      coverImage: selectedCover,
      isPortfolioPublic: isPublic,
    });
  }, [initialProfile, userId, selectedTemplate, selectedTheme, selectedCover, isPublic]);

  if (!isOpen) return null;

  const currentSpec = DEVICE_SPECS[device];
  const publicUrl = `/portfolio/seeker/${userId || 'demo-seeker'}`;
  const fullPublicUrl = typeof window !== 'undefined' ? `${window.location.origin}${publicUrl}` : publicUrl;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(fullPublicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Link copied!', 'Candidate portfolio URL is in your clipboard.');
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Take a look at my verified Candidate Portfolio on THENIJOBS: ${fullPublicUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSavePreferences = async () => {
    if (!userId) return;
    setSavingTheme(true);
    try {
      // 1. Update or create portfolioSites doc
      await setDoc(doc(db, 'portfolioSites', `site-${userId}`), {
        ownerId: userId,
        ownerType: 'seeker',
        templateId: selectedTemplate,
        theme: {
          ...liveSite.theme,
          ...selectedTheme,
        },
        branding: {
          ...liveSite.branding,
          coverImage: selectedCover,
        },
        updatedAt: new Date(),
      }, { merge: true });

      // 2. Also update seekerProfiles
      await setDoc(doc(db, 'seekerProfiles', userId), {
        portfolioTemplate: selectedTemplate,
        portfolioCoverImage: selectedCover,
        updatedAt: new Date(),
      }, { merge: true });

      toast.success('Preferences saved!', 'Your template and theme customizations are preserved.');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error('Failed to save preferences');
    } finally {
      setSavingTheme(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-950/95 backdrop-blur-md animate-fade-in font-sans select-none">
      {/* ── TOP NAV & TOOLBAR ── */}
      <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-3 sm:px-6 z-20">
        {/* Title, Badge & View Switcher */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Sparkles size={18} />
          </div>

          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {initialProfile.name || 'Candidate'} — Live Preview
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                100% Real-Time Sync
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Published URL matches this preview exactly</p>
          </div>

          {/* View Switcher: Portfolio vs ID Card */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 ml-1 sm:ml-4">
            <button
              onClick={() => setActiveView('portfolio')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all ${
                activeView === 'portfolio'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe size={13} />
              <span>Portfolio</span>
            </button>
            <button
              onClick={() => setActiveView('idcard')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all ${
                activeView === 'idcard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode size={13} />
              <span>Digital ID Card</span>
            </button>
          </div>
        </div>

        {/* Device Selectors */}
        <div className="hidden md:flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
          {(['laptop', 'tablet', 'mobile'] as DeviceMode[]).map((mode) => {
            const SpecIcon = DEVICE_SPECS[mode].icon;
            const isActive = device === mode;
            return (
              <button
                key={mode}
                onClick={() => setDevice(mode)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
                title={DEVICE_SPECS[mode].label}
              >
                <SpecIcon size={14} />
                <span className="hidden lg:inline">{DEVICE_SPECS[mode].name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: Customize, Publish & Close */}
        <div className="flex items-center gap-2">
          {/* Customize Drawer Toggle */}
          {activeView === 'portfolio' && (
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                showCustomizer
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Palette size={14} />
              <span>Theme & Templates</span>
              <ChevronDown size={13} className={`transition-transform ${showCustomizer ? 'rotate-180' : ''}`} />
            </button>
          )}

          {/* Publish / Status Button */}
          {isPublic ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <CheckCircle2 size={13} /> Published
              </span>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Copy Live Public URL"
              >
                {copiedLink ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              </button>
              <button
                onClick={() => window.open(fullPublicUrl, '_blank')}
                className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Lock size={13} />
              <span>Publish (₹{SEEKER_PUBLIC_PROFILE_FEE_INR})</span>
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer ml-1"
            title="Close Preview"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* ── CUSTOMIZER SUB-TOOLBAR (Slide Down) ── */}
      {showCustomizer && activeView === 'portfolio' && (
        <div className="border-b border-slate-800 bg-slate-900/95 px-4 py-3 text-slate-200 z-10 transition-all">
          <div className="max-w-6xl mx-auto space-y-3">
            {/* Template Selector Row */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Layers size={13} /> 4 Portfolio Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {CANDIDATE_TEMPLATES.map((tpl) => {
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{tpl.name}</span>
                        {tpl.tag && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
                            {tpl.tag}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Preferences Button */}
              <button
                onClick={handleSavePreferences}
                disabled={savingTheme}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                {savingTheme ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save Design</span>
              </button>
            </div>

            {/* Colors & Fonts Row */}
            <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-800/80">
              {/* Theme Color Presets */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Palette size={13} /> Color Palette:
                </span>
                <div className="flex items-center gap-1.5">
                  {CANDIDATE_THEME_PRESETS.map((p) => {
                    const isSelected = selectedTheme.primaryColor === p.primary;
                    return (
                      <button
                        key={p.name}
                        onClick={() => setSelectedTheme({
                          ...selectedTheme,
                          primaryColor: p.primary,
                          secondaryColor: p.secondary,
                          surfaceColor: p.surface,
                        })}
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'ring-2 ring-white text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        style={{ backgroundColor: `${p.primary}25` }}
                        title={p.name}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.primary }} />
                        <span className="hidden sm:inline">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cover Banner Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400">Banner:</span>
                <div className="flex items-center gap-1.5">
                  {BANNER_GRADIENT_PRESETS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedCover(bg.url)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        selectedCover === bg.url
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {bg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Options */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Type size={13} /> Font:
                </span>
                <select
                  value={selectedTheme.fontFamily || 'Inter'}
                  onChange={(e) => setSelectedTheme({ ...selectedTheme, fontFamily: e.target.value })}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-hidden"
                >
                  <option value="Inter">Inter (Clean)</option>
                  <option value="Poppins">Poppins (Modern)</option>
                  <option value="Outfit">Outfit (Geometric)</option>
                  <option value="DM Sans">DM Sans (Creative)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SIMULATED DEVICE FRAME CONTAINER ── */}
      <main className="flex-1 overflow-auto p-2 sm:p-6 flex items-center justify-center bg-slate-950/70">
        <div
          className={`relative transition-all duration-300 ease-out shadow-2xl flex flex-col ${currentSpec.width} ${
            device === 'laptop'
              ? 'rounded-2xl border border-slate-800 bg-slate-900 shadow-blue-900/10'
              : device === 'tablet'
              ? 'rounded-[32px] border-[12px] border-slate-800 bg-slate-900 shadow-slate-900/50'
              : 'rounded-[40px] border-[14px] border-slate-900 bg-slate-950 shadow-2xl shadow-black ring-1 ring-slate-800'
          }`}
        >
          {/* Mobile Notch */}
          {device === 'mobile' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-900 rounded-b-xl z-50 flex items-center justify-center gap-1.5">
              <div className="w-12 h-1 bg-slate-800 rounded-full" />
              <div className="w-2 h-2 rounded-full bg-slate-800" />
            </div>
          )}

          {/* Browser Address Bar */}
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 rounded-t-[inherit]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex-1 mx-2 bg-slate-950/80 rounded-lg px-3 py-1 text-xs text-slate-400 font-mono flex items-center gap-2 border border-slate-800 truncate">
              <span className="text-emerald-400 font-sans">https://</span>
              <span className="truncate text-slate-200">
                thenijobs.com{publicUrl}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              {currentSpec.label}
            </span>
          </div>

          {/* Scrollable Page Body */}
          <div className={`overflow-y-auto ${currentSpec.height} rounded-b-[inherit] bg-white text-slate-900 no-scrollbar`}>
            {activeView === 'portfolio' ? (
              <TemplateRenderer site={liveSite} isPreview={true} />
            ) : (
              <div className="p-4 sm:p-8 flex items-center justify-center min-h-full bg-slate-50">
                <SeekerIDCard
                  seeker={{
                    uid: userId || 'demo',
                    name: initialProfile.name || 'Candidate',
                    profilePhotoUrl: initialProfile.photoUrl,
                    district: initialProfile.district || 'Theni',
                    state: initialProfile.state || 'Tamil Nadu',
                    skills: (initialProfile.skills || []).map(s => typeof s === 'string' ? s : s.name),
                    currentRole: initialProfile.headline || initialProfile.currentRole || 'Career Professional',
                    experience: (initialProfile.experience || []).map(e => ({ company: e.company, role: e.role })),
                    education: (initialProfile.education || []).map(e => ({ degree: e.degree, institution: e.institution })),
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile Home Bar */}
          {device === 'mobile' && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-700 rounded-full z-50 pointer-events-none" />
          )}
        </div>
      </main>

      {/* ── PAYMENT MODAL ── */}
      <SeekerPublicProfileModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        userId={userId}
        userName={initialProfile.name}
        userEmail={initialProfile.email}
        onActivated={() => {
          setIsPublic(true);
          setShowPaymentModal(false);
          toast.success('🎉 Portfolio Website is now LIVE!', 'Your candidate portfolio is verified and active for 1 year.');
          onPortfolioPublished?.();
        }}
      />
    </div>
  );
}
