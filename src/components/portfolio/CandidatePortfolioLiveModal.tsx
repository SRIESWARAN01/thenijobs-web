'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Laptop, Tablet, Smartphone, X, Sparkles, Check, ExternalLink,
  Palette, Layers, Type, Lock, ShieldCheck, Save, Loader2,
  QrCode, Globe, Copy, ChevronDown, CheckCircle2, AlertCircle, Search, Share2
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

const USERNAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

  // Custom username state and availability checking
  const defaultSlug = (initialProfile.customUrl || initialProfile.name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `seeker-${userId.slice(0, 6)}`).toLowerCase();
  const [customUsername, setCustomUsername] = useState<string>(defaultSlug);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameFeedback, setUsernameFeedback] = useState<{ en: string; ta: string } | null>(null);
  const lastSavedUsernameRef = useRef<string>(defaultSlug);

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
          if (sData.customUrl) {
            setCustomUsername(sData.customUrl);
            lastSavedUsernameRef.current = sData.customUrl;
          }
        }
      } catch (e) {
        console.warn('Could not load existing portfolio site settings:', e);
      }
    }
    fetchSavedSettings();
  }, [isOpen, userId, initialProfile.isPortfolioPublic]);

  // Live validation of customUsername
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = customUsername.trim().toLowerCase();

    if (!trimmed) {
      setUsernameStatus('invalid');
      setUsernameFeedback({
        en: 'Username cannot be empty',
        ta: 'Username காலியாக இருக்கக்கூடாது',
      });
      return;
    }

    if (trimmed.length < 3 || trimmed.length > 35) {
      setUsernameStatus('invalid');
      setUsernameFeedback({
        en: 'Username must be between 3 and 35 characters',
        ta: 'Username 3 முதல் 35 எழுத்துக்கள் வரை இருக்க வேண்டும்',
      });
      return;
    }

    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameStatus('invalid');
      setUsernameFeedback({
        en: 'Use only lowercase letters, numbers, and single hyphens (-)',
        ta: 'சிறிய ஆங்கில எழுத்துக்கள், எண்கள் மற்றும் ஒற்றை ஹைபன்கள் (-) மட்டுமே பயன்படுத்தலாம்',
      });
      return;
    }

    // Debounced check against check-username API
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/job-seeker/check-username?username=${encodeURIComponent(trimmed)}&userId=${encodeURIComponent(userId)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus('available');
          setUsernameFeedback({
            en: data.message || 'Username is available!',
            ta: data.messageTa || 'இந்த username கிடைக்கிறது! பயன்படுத்தலாம்.',
          });
        } else {
          setUsernameStatus('taken');
          setUsernameFeedback({
            en: data.error || `Username "${trimmed}" is already taken. Please choose another username.`,
            ta: data.errorTa || `"${trimmed}" என்ற username ஏற்கெனவே பயன்பாட்டில் உள்ளது. வேறு பெயரைத் தேர்வு செய்யவும்.`,
          });
        }
      } catch (e) {
        console.warn('Failed to check username:', e);
        setUsernameStatus('idle');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customUsername, userId, isOpen]);

  // Dynamically build the live site
  const liveSite = useMemo<PortfolioSite>(() => {
    return buildSeekerPortfolioSite({
      ...initialProfile,
      userId,
      customUrl: customUsername,
      templateId: selectedTemplate,
      theme: selectedTheme,
      coverImage: selectedCover,
      isPortfolioPublic: isPublic,
    });
  }, [initialProfile, userId, customUsername, selectedTemplate, selectedTheme, selectedCover, isPublic]);

  if (!isOpen) return null;

  const currentSpec = DEVICE_SPECS[device];
  const candidateSlug = customUsername.trim().toLowerCase() || userId || 'demo-seeker';
  const publicUrl = `/job-seeker/${candidateSlug}`;
  const fullPublicUrl = typeof window !== 'undefined' ? `${window.location.origin}${publicUrl}` : `https://www.thenijobs.com${publicUrl}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(fullPublicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Link copied!', `Candidate portfolio URL copied: ${fullPublicUrl}`);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Take a look at my verified Candidate Portfolio on THENIJOBS: ${fullPublicUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSavePreferences = async () => {
    if (!userId) return;
    const cleanUsername = customUsername.trim().toLowerCase();

    if (usernameStatus === 'taken') {
      toast.error(
        usernameFeedback?.en || 'Username is already taken.',
        usernameFeedback?.ta || 'வேறு username தேர்வு செய்யவும்.'
      );
      return;
    }

    if (usernameStatus === 'invalid') {
      toast.error(
        usernameFeedback?.en || 'Invalid username format.',
        usernameFeedback?.ta || 'சரியான username உள்ளிடவும்.'
      );
      return;
    }

    setSavingTheme(true);
    try {
      // 1. Update or create portfolioSites doc
      await setDoc(doc(db, 'portfolioSites', `site-${userId}`), {
        ownerId: userId,
        ownerType: 'seeker',
        templateId: selectedTemplate,
        customUrl: cleanUsername,
        theme: {
          ...liveSite.theme,
          ...selectedTheme,
        },
        branding: {
          ...liveSite.branding,
          coverImage: selectedCover,
        },
        seo: {
          ...liveSite.seo,
          canonicalUrl: `https://www.thenijobs.com/job-seeker/${cleanUsername}`,
        },
        updatedAt: new Date(),
      }, { merge: true });

      // 2. Also update seekerProfiles
      await setDoc(doc(db, 'seekerProfiles', userId), {
        portfolioTemplate: selectedTemplate,
        portfolioCoverImage: selectedCover,
        customUrl: cleanUsername,
        updatedAt: new Date(),
      }, { merge: true });

      // 3. Claim/reserve slug in portfolioSlugs
      if (cleanUsername) {
        await setDoc(doc(db, 'portfolioSlugs', cleanUsername), {
          ownerId: userId,
          siteId: `site-${userId}`,
          updatedAt: new Date(),
        }, { merge: true });
        lastSavedUsernameRef.current = cleanUsername;
      }

      toast.success('Preferences & URL saved!', `Portfolio URL: thenijobs.com/job-seeker/${cleanUsername}`);
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
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                showCustomizer
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Palette size={14} />
              <span>Theme & URL</span>
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
                className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copy Live Public URL"
              >
                {copiedLink ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="p-2 rounded-xl border border-slate-700 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                title="Share on WhatsApp"
              >
                <Share2 size={15} />
              </button>
              <button
                onClick={() => window.open(fullPublicUrl, '_blank')}
                className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
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
        <div className="border-b border-slate-800 bg-slate-900/95 px-4 py-3 text-slate-200 z-10 transition-all max-h-[42vh] overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-3">
            {/* Custom URL & Username Row */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Globe size={13} className="text-emerald-400" />
                    <span>Candidate Profile URL / தனிப்பயன் இணைய முகவரி</span>
                  </label>
                  <span className="text-[10px] text-slate-400">thenijobs.com/job-seeker/{candidateSlug}</span>
                </div>
                <div className="flex items-center">
                  <span className="px-3 py-1.5 bg-slate-800 border border-r-0 border-slate-700 text-slate-400 text-xs font-mono rounded-l-xl select-none">
                    thenijobs.com/job-seeker/
                  </span>
                  <input
                    type="text"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="your-name"
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white font-mono text-xs rounded-r-xl focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center min-w-[200px] justify-start md:justify-end">
                {usernameStatus === 'checking' && (
                  <span className="text-slate-400 text-xs flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                    <Loader2 size={13} className="animate-spin text-blue-400" /> Checking...
                  </span>
                )}
                {usernameStatus === 'available' && (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 size={14} /> Available / பயன்படுத்தலாம்
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-xl">
                    <p className="font-bold flex items-center gap-1"><AlertCircle size={13} /> {usernameFeedback?.en}</p>
                    <p className="text-[10px] text-red-300">{usernameFeedback?.ta}</p>
                  </div>
                )}
                {usernameStatus === 'invalid' && (
                  <div className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                    <p className="font-semibold">{usernameFeedback?.en}</p>
                    <p className="text-[10px] text-amber-300">{usernameFeedback?.ta}</p>
                  </div>
                )}
              </div>
            </div>

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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                disabled={savingTheme || usernameStatus === 'taken' || usernameStatus === 'invalid'}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                {savingTheme ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save Design & URL</span>
              </button>
            </div>

            {/* Colors, Banners & Fonts Row */}
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
                        className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
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
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
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

            {/* Google Search Engine Indexing Clarification */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-950/30 p-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold text-blue-300 text-[11px] mb-0.5">
                <Search size={13} />
                <span>Google Search Discovery & Indexing Policy</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Google Search crawlers independently evaluate and decide crawling and indexing schedules. THENIJOBS automatically includes verified Schema.org Person JSON-LD and dynamic XML sitemap entries to ensure optimum search readiness. Draft and private profiles are strictly protected with <code className="text-slate-300">noindex</code> tags.
              </p>
              <p className="text-[10px] text-blue-200/90 mt-0.5">
                Google-ல் உடனடியாக index ஆகும் என்று உறுதி அளிக்க முடியாது; Google தனது crawling மற்றும் indexing முடிவுகளைத் தானே எடுக்கும்.
              </p>
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
          toast.success('🎉 Portfolio Website is now LIVE!', `Your candidate portfolio is verified and live at thenijobs.com/job-seeker/${candidateSlug}`);
          onPortfolioPublished?.();
        }}
      />
    </div>
  );
}
