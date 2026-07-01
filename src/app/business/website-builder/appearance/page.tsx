'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Laptop, Tablet, Smartphone, Globe, Save, Loader2,
  Lock, Sparkles, Crown, ImagePlus, Check, ChevronRight,
  SlidersHorizontal, Paintbrush, Layers, Type, CreditCard, Eye,
  ArrowUp, ArrowDown, Sparkle, BrainCircuit, BarChart3, HelpCircle,
  ShieldCheck, Accessibility, Settings, HeartHandshake, Phone, MessageCircle, Mail
} from 'lucide-react';

import { useRequireAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/useToast';
import { where } from 'firebase/firestore';

import { getCompanyActivePlan, getPlanRank } from '@/lib/subscriptions';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import UpgradePlanDialog from '@/components/portal/UpgradePlanDialog';
import { CustomTemplateWrapper, PRESET_THEMES } from '@/components/company/CustomTemplates';

interface Customization {
  websiteTheme: string;
  websiteTemplate: string;
  customPrimaryColor: string;
  fontFamily: string;
  buttonStyle: 'rounded' | 'square' | 'pill';
  cardStyle: 'flat' | 'elevated' | 'glass';
  borderRadius: string;
  enableDarkMode: boolean;
  enableAnimations: boolean;
  sectionsVisible: Record<string, boolean>;
  homepageSectionsOrder: string[];
  // Typography overrides
  fontSize: string;
  headingSize: string;
  lineHeight: string;
  letterSpacing: string;
  fontWeight: string;
  uppercaseToggle: boolean;
  // Header options
  stickyHeader: boolean;
  transparentHeader: boolean;
  logoPosition: 'left' | 'center' | 'right';
  menuPosition: 'left' | 'center' | 'right';
  showHeaderSearch: boolean;
  showHeaderWhatsApp: boolean;
  showHeaderCall: boolean;
  showHeaderLanguage: boolean;
  showHeaderThemeSwitch: boolean;
  showHeaderLogin: boolean;
  // Footer options
  footerAbout: boolean;
  footerHours: boolean;
  footerLinks: boolean;
  footerProducts: boolean;
  footerServices: boolean;
  footerMap: boolean;
  footerSocials: boolean;
  footerNewsletter: boolean;
  footerPrivacyLinks: boolean;
}

export default function WebsiteBuilderAppearancePage() {
  const { user, loading: authLoading } = useRequireAuth([
    'business', 'business_owner', 'employer', 'supplier', 'service_provider', 'entrepreneur'
  ], '/login');
  
  const { toast } = useToast();
  const router = useRouter();

  // Load user's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies?.[0] || null;

  // Load company data for preview context
  const { data: products } = useCollection<any>('products', [
    where('companyId', '==', company?.id || ''),
    where('isActive', '==', true)
  ], { skip: !company?.id });

  const { data: services } = useCollection<any>('services', [
    where('providerId', '==', company?.ownerId || ''),
    where('status', '==', 'active')
  ], { skip: !company?.ownerId });

  const { data: reviews } = useCollection<any>('reviews', [
    where('companyId', '==', company?.id || ''),
    where('status', '==', 'approved')
  ], { skip: !company?.id });

  const { data: jobs } = useCollection<any>('jobs', [
    where('companyId', '==', company?.id || ''),
    where('isActive', '==', true)
  ], { skip: !company?.id });

  // Customization state
  const [customization, setCustomization] = useState<Customization>({
    websiteTheme: 'classic-blue',
    websiteTemplate: 'classic-directory',
    customPrimaryColor: '',
    fontFamily: 'Inter',
    buttonStyle: 'rounded',
    cardStyle: 'flat',
    borderRadius: '12px',
    enableDarkMode: false,
    enableAnimations: true,
    sectionsVisible: {
      hero: true,
      about: true,
      stats: true,
      services: true,
      products: true,
      jobs: true,
      gallery: true,
      reviews: true,
      faq: true,
      booking: true,
      team: true,
      contact: true,
    },
    homepageSectionsOrder: ['hero', 'about', 'stats', 'services', 'products', 'jobs', 'gallery', 'reviews', 'faq', 'booking', 'team', 'contact'],
    fontSize: '14px',
    headingSize: '32px',
    lineHeight: '1.6',
    letterSpacing: 'normal',
    fontWeight: 'normal',
    uppercaseToggle: false,
    stickyHeader: true,
    transparentHeader: false,
    logoPosition: 'left',
    menuPosition: 'right',
    showHeaderSearch: true,
    showHeaderWhatsApp: true,
    showHeaderCall: true,
    showHeaderLanguage: false,
    showHeaderThemeSwitch: false,
    showHeaderLogin: false,
    footerAbout: true,
    footerHours: true,
    footerLinks: true,
    footerProducts: true,
    footerServices: true,
    footerMap: true,
    footerSocials: true,
    footerNewsletter: false,
    footerPrivacyLinks: true,
  });

  const [activeTab, setActiveTab] = useState<'branding' | 'themes' | 'templates' | 'typography' | 'header' | 'footer' | 'homepage' | 'seo' | 'ai' | 'analytics'>('branding');
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('laptop');
  const [mobileView, setMobileView] = useState<'settings' | 'preview'>('settings');

  // Gating modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<'premium' | 'enterprise'>('premium');

  // Image Upload states
  const [showCropper, setShowCropper] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'cover' | 'mobile-banner' | 'favicon' | 'invoice-logo' | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const mobileBannerInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const invoiceLogoInputRef = useRef<HTMLInputElement>(null);

  // Sync state from loaded company document
  useEffect(() => {
    if (company) {
      setCustomization({
        websiteTheme: company.websiteTheme || 'classic-blue',
        websiteTemplate: company.websiteTemplate || 'classic-directory',
        customPrimaryColor: company.customPrimaryColor || '',
        fontFamily: company.fontFamily || 'Inter',
        buttonStyle: company.buttonStyle || 'rounded',
        cardStyle: company.cardStyle || 'flat',
        borderRadius: company.borderRadius || '12px',
        enableDarkMode: company.enableDarkMode || false,
        enableAnimations: company.enableAnimations !== false,
        sectionsVisible: {
          hero: company.sectionsVisible?.hero !== false,
          about: company.sectionsVisible?.about !== false,
          stats: company.sectionsVisible?.stats !== false,
          services: company.sectionsVisible?.services !== false,
          products: company.sectionsVisible?.products !== false,
          jobs: company.sectionsVisible?.jobs !== false,
          gallery: company.sectionsVisible?.gallery !== false,
          reviews: company.sectionsVisible?.reviews !== false,
          faq: company.sectionsVisible?.faq !== false,
          booking: company.sectionsVisible?.booking !== false,
          team: company.sectionsVisible?.team !== false,
          contact: company.sectionsVisible?.contact !== false,
        },
        homepageSectionsOrder: company.homepageSectionsOrder || ['hero', 'about', 'stats', 'services', 'products', 'jobs', 'gallery', 'reviews', 'faq', 'booking', 'team', 'contact'],
        fontSize: company.fontSize || '14px',
        headingSize: company.headingSize || '32px',
        lineHeight: company.lineHeight || '1.6',
        letterSpacing: company.letterSpacing || 'normal',
        fontWeight: company.fontWeight || 'normal',
        uppercaseToggle: !!company.uppercaseToggle,
        stickyHeader: company.stickyHeader !== false,
        transparentHeader: !!company.transparentHeader,
        logoPosition: company.logoPosition || 'left',
        menuPosition: company.menuPosition || 'right',
        showHeaderSearch: company.showHeaderSearch !== false,
        showHeaderWhatsApp: company.showHeaderWhatsApp !== false,
        showHeaderCall: company.showHeaderCall !== false,
        showHeaderLanguage: !!company.showHeaderLanguage,
        showHeaderThemeSwitch: !!company.showHeaderThemeSwitch,
        showHeaderLogin: !!company.showHeaderLogin,
        footerAbout: company.footerAbout !== false,
        footerHours: company.footerHours !== false,
        footerLinks: company.footerLinks !== false,
        footerProducts: company.footerProducts !== false,
        footerServices: company.footerServices !== false,
        footerMap: company.footerMap !== false,
        footerSocials: company.footerSocials !== false,
        footerNewsletter: !!company.footerNewsletter,
        footerPrivacyLinks: company.footerPrivacyLinks !== false,
      });
    }
  }, [company]);

  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#070714] text-white flex flex-col items-center justify-center font-outfit">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading Enterprise customizer...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
          <Globe size={40} className="mx-auto text-purple-400 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold">No Company Profile</h2>
          <p className="mt-2 text-sm text-gray-400">
            Please register your company profile first to customize the appearance.
          </p>
          <button
            onClick={() => router.push('/business/company-profile')}
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-purple-600 px-6 text-xs font-bold text-white hover:bg-purple-700 transition-all shadow-md"
          >
            Create Profile Now
          </button>
        </div>
      </div>
    );
  }

  const activePlan = getCompanyActivePlan(company);
  const planRank = getPlanRank(activePlan);

  // Restriction mappings
  const themePlanRestriction: Record<string, number> = {
    'classic-blue': 0, 'emerald-growth': 0, 'royal-purple': 0,
    'sunset-amber': 2, 'ocean-cyan': 2, 'ruby-red': 2, 'midnight-dark': 2, 'forest-green': 2,
    'royal-gold': 3, 'modern-gray': 3, 'rose-pink': 3, 'indigo': 3
  };

  const templatePlanRestriction: Record<string, number> = {
    'classic-directory': 0,
    'corporate': 2, 'startup': 2, 'portfolio': 2, 'agency': 2, 'construction': 2, 'agriculture': 2,
    'hospital': 3, 'education': 3, 'restaurant': 3, 'ecommerce-storefront': 3, 'service-booking': 3, 'real-estate': 3
  };

  const handleSelectTheme = (theme: string) => {
    const requiredRank = themePlanRestriction[theme] || 0;
    if (planRank < requiredRank) {
      setUpgradeTargetPlan(requiredRank === 3 ? 'enterprise' : 'premium');
      setShowUpgradeModal(true);
      return;
    }
    setCustomization(prev => ({ ...prev, websiteTheme: theme }));
  };

  const handleSelectTemplate = (template: string) => {
    const requiredRank = templatePlanRestriction[template] || 0;
    if (planRank < requiredRank) {
      setUpgradeTargetPlan(requiredRank === 3 ? 'enterprise' : 'premium');
      setShowUpgradeModal(true);
      return;
    }
    setCustomization(prev => ({ ...prev, websiteTemplate: template }));
  };

  // Reorder Sections Logic
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...customization.homepageSectionsOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;

    // Swap elements
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    setCustomization(prev => ({ ...prev, homepageSectionsOrder: newOrder }));
  };

  // AI assist generation helpers
  const handleAIGenerateText = (field: string) => {
    if (planRank < 3) {
      setUpgradeTargetPlan('enterprise');
      setShowUpgradeModal(true);
      return;
    }

    toast({
      title: 'AI Generator Running',
      description: 'Creating professional marketing text using THENIJOBS AI model...',
      variant: 'info'
    });

    setTimeout(() => {
      if (field === 'description') {
        const aiText = `${company.name} is a leading brand in the ${company.category} sector based in ${company.district}. Committed to excellence, integrity, and verified customer success, we offer state-of-the-art catalog products and services designed for scalability.`;
        company.description = aiText;
        toast({ title: 'AI Copied', description: 'Updated company description with professional copy.', variant: 'success' });
      } else if (field === 'seo') {
        company.customMetaTitle = `${company.name} | Verified ${company.category} in ${company.district}`;
        company.customMetaDescription = `Explore ${company.name}'s verified portfolio, active job listings, booking schedules, and product catalogues in Theni district.`;
        toast({ title: 'AI Copied', description: 'Updated SEO meta titles and descriptions.', variant: 'success' });
      }
    }, 1500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument('companies', company.id, {
        ...customization,
        updatedAt: new Date()
      });
      
      toast({
        title: 'Settings Published',
        description: 'Your Enterprise Customization settings are now live!',
        variant: 'success'
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Save Failed',
        description: 'Failed to update configurations.',
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'mobile-banner' | 'favicon' | 'invoice-logo') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setCropFile(files[0]);
      setCropType(type);
      setShowCropper(true);
    }
  };

  const processedCompanyPreview = {
    ...company,
    products: products || [],
    services: services || [],
    reviews: reviews || [],
    galleryImages: company.galleryImages || company.gallery || [],
  };

  const previewWidthClass = {
    desktop: 'w-full h-full',
    laptop: 'max-w-[1024px] h-[75vh] border-x border-b border-white/10 rounded-b-2xl',
    tablet: 'max-w-[768px] h-[75vh] border-x border-b border-white/10 rounded-b-2xl',
    mobile: 'max-w-[390px] h-[70vh] border border-white/10 rounded-2xl'
  }[previewMode];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#070714] text-white font-sans overflow-x-hidden">
      {/* Mobile Settings vs Preview Toggle Header */}
      <div className="lg:hidden w-full flex bg-[#0c0c1e] border-b border-white/10 shrink-0 sticky top-0 z-30">
        <button
          type="button"
          onClick={() => setMobileView('settings')}
          className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
            mobileView === 'settings'
              ? 'border-purple-500 text-white bg-white/[0.02]'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Customize Settings
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all ${
            mobileView === 'preview'
              ? 'border-purple-500 text-white bg-white/[0.02]'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* ── Left customizer sidebar tabs list ── */}
      <div className={`w-full lg:w-[480px] shrink-0 border-r border-white/[0.08] bg-[#0a0a1a] flex flex-col justify-between max-h-screen overflow-y-auto no-scrollbar ${mobileView === 'settings' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div>
              <h1 className="text-base font-black font-outfit text-white flex items-center gap-1.5">
                <Globe size={18} className="text-purple-400" /> Site Builder v2.0
              </h1>
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider block mt-0.5">
                Manage branding, seo, and widgets
              </span>
            </div>
            <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full uppercase">
              {activePlan}
            </span>
          </div>

          {/* Builder module Tabs */}
          <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar bg-[#080816]/60 sticky top-0 z-10 shrink-0">
            {[
              { id: 'branding', label: 'Branding' },
              { id: 'themes', label: 'Themes' },
              { id: 'templates', label: 'Templates' },
              { id: 'typography', label: 'Typography' },
              { id: 'header', label: 'Header' },
              { id: 'footer', label: 'Footer' },
              { id: 'homepage', label: 'Homepage' },
              { id: 'seo', label: 'SEO' },
              { id: 'ai', label: 'AI Copywriter' },
              { id: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4 text-[10px] font-extrabold uppercase whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-white bg-white/[0.02]'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content area */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* BRANDING TAB */}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <ImagePlus size={14} /> Logo & Assets Uploads
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Light Mode Logo */}
                  <div className="space-y-1.5">
                    <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleUploadImage(e, 'logo')} />
                    <label className="text-[10px] font-bold text-gray-400">Primary Brand Logo</label>
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center gap-2">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} className="w-10 h-10 object-cover rounded-full" />
                      ) : (
                        <ImagePlus size={18} className="text-gray-500" />
                      )}
                      <span className="text-[9px] font-bold text-gray-300">Logo</span>
                    </button>
                  </div>

                  {/* Cover Banner */}
                  <div className="space-y-1.5">
                    <input type="file" ref={coverInputRef} className="hidden" onChange={(e) => handleUploadImage(e, 'cover')} />
                    <label className="text-[10px] font-bold text-gray-400">Cover Banner</label>
                    <button type="button" onClick={() => coverInputRef.current?.click()} className="w-full py-4 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center gap-2">
                      {company.coverImageUrl || company.coverUrl ? (
                        <img src={company.coverImageUrl || company.coverUrl} className="w-14 h-8 object-cover rounded" />
                      ) : (
                        <ImagePlus size={18} className="text-gray-500" />
                      )}
                      <span className="text-[9px] font-bold text-gray-300">Banner</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Favicon */}
                  <div className="space-y-1.5">
                    <input type="file" ref={faviconInputRef} className="hidden" onChange={(e) => handleUploadImage(e, 'favicon')} />
                    <label className="text-[10px] font-bold text-gray-400">Site Favicon (Enterprise)</label>
                    <button type="button" onClick={() => planRank >= 3 ? faviconInputRef.current?.click() : handleSelectTemplate('hospital')} className="w-full py-4 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center gap-2">
                      <ImagePlus size={18} className={planRank >= 3 ? 'text-gray-500' : 'text-amber-500'} />
                      <span className="text-[9px] font-bold text-gray-300 flex items-center gap-1">
                        Favicon {planRank < 3 && <Lock size={8} className="text-amber-500" />}
                      </span>
                    </button>
                  </div>

                  {/* PDF Watermark logo */}
                  <div className="space-y-1.5">
                    <input type="file" ref={invoiceLogoInputRef} className="hidden" onChange={(e) => handleUploadImage(e, 'invoice-logo')} />
                    <label className="text-[10px] font-bold text-gray-400">PDF Watermark Logo</label>
                    <button type="button" onClick={() => planRank >= 3 ? invoiceLogoInputRef.current?.click() : handleSelectTemplate('hospital')} className="w-full py-4 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] flex flex-col items-center justify-center gap-2">
                      <ImagePlus size={18} className={planRank >= 3 ? 'text-gray-500' : 'text-amber-500'} />
                      <span className="text-[9px] font-bold text-gray-300 flex items-center gap-1">
                        PDF Logo {planRank < 3 && <Lock size={8} className="text-amber-500" />}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* THEMES TAB */}
            {activeTab === 'themes' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Paintbrush size={14} /> Choose Preset Color Theme
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(PRESET_THEMES).map(([id, t]) => {
                    const isSelected = customization.websiteTheme === id;
                    const requiredRank = themePlanRestriction[id] || 0;
                    const isLocked = planRank < requiredRank;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectTheme(id)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                          isSelected
                            ? 'bg-purple-600/10 border-purple-500'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-bold text-white truncate max-w-[80%]">{t.name}</span>
                          {isLocked ? (
                            <Lock size={10} className="text-amber-500 shrink-0" />
                          ) : isSelected && (
                            <Check size={11} className="text-purple-400 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="w-4 h-4 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: t.primary }} />
                          <span className="text-[8px] text-gray-500 font-bold uppercase">
                            {requiredRank === 0 ? 'Free' : requiredRank === 2 ? 'Premium' : 'Enterprise'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Override */}
                <div className="space-y-1.5 pt-4 border-t border-white/5">
                  <label className="text-[10px] font-bold text-gray-400">Override Primary Accent Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customization.customPrimaryColor || '#7C3AED'}
                      onChange={(e) => setCustomization(prev => ({ ...prev, customPrimaryColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      placeholder="#7C3AED"
                      value={customization.customPrimaryColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, customPrimaryColor: e.target.value }))}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Layers size={14} /> Web Templates
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'classic-directory', label: 'Classic Directory', desc: 'Cover, stats, catalogue listings, reviews and location.', plan: 'Free' },
                    { id: 'corporate', label: 'Corporate Profile', desc: 'Timelines, clean grid rows, and statistics.', plan: 'Premium' },
                    { id: 'startup', label: 'Startup SaaS', desc: 'Call to Actions, features descriptions, and pricing tiers.', plan: 'Premium' },
                    { id: 'portfolio', label: 'Creative Portfolio', desc: 'Works showcases, founder introduction, and testimonials.', plan: 'Premium' },
                    { id: 'agency', label: 'Marketing Agency', desc: 'Portfolios sliders, partners, client logo grids.', plan: 'Premium' },
                    { id: 'construction', label: 'Construction & Builders', desc: 'Earthy design layouts, project sheets, and before/after comparisons.', plan: 'Premium' },
                    { id: 'agriculture', label: 'Agriculture Farms', desc: 'Bio organic products lists, fresh gallery displays.', plan: 'Premium' },
                    { id: 'hospital', label: 'Hospital Clinic Portal', desc: 'Doctors staff grids, scheduler booking forms, health rates tables.', plan: 'Enterprise' },
                    { id: 'education', label: 'Educational Academy', desc: 'Courses directories, faculty bios, academic calendars.', plan: 'Enterprise' },
                    { id: 'restaurant', label: 'Restaurant & Dining', desc: 'Menu directories, whatsapp food ordering carts, seat booking.', plan: 'Enterprise' },
                    { id: 'ecommerce-storefront', label: 'E-Commerce Catalogs', desc: 'Dynamic categories filter, catalogs quick view drawers, cart order.', plan: 'Enterprise' },
                    { id: 'service-booking', label: 'Appointments booking', desc: 'Interactive slots schedulers, rates sheets, team bio cards.', plan: 'Enterprise' },
                    { id: 'real-estate', label: 'Real Estate Listings', desc: 'Property details catalogs (bedrooms, size, maps location).', plan: 'Enterprise' }
                  ].map((tpl) => {
                    const isSelected = customization.websiteTemplate === tpl.id;
                    const requiredRank = templatePlanRestriction[tpl.id] || 0;
                    const isLocked = planRank < requiredRank;

                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl.id)}
                        className={`w-full p-4 rounded-xl border text-left flex gap-3 items-center transition-all ${
                          isSelected
                            ? 'bg-purple-600/10 border-purple-500 shadow-md'
                            : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{tpl.label}</span>
                            <span className="text-[8px] font-black text-purple-400 uppercase bg-purple-500/10 px-1.5 py-0.5 rounded">
                              {tpl.plan}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 font-medium mt-1 leading-relaxed">{tpl.desc}</p>
                        </div>
                        {isLocked ? (
                          <Lock size={12} className="text-amber-500 shrink-0" />
                        ) : isSelected && (
                          <Check size={14} className="text-purple-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TYPOGRAPHY TAB */}
            {activeTab === 'typography' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Type size={14} /> Typography Parameters
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Font Family</label>
                    <select
                      value={customization.fontFamily}
                      onChange={(e) => setCustomization(prev => ({ ...prev, fontFamily: e.target.value as any }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none font-semibold"
                    >
                      <option value="Poppins">Poppins</option>
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Nunito">Nunito</option>
                      <option value="Lato">Lato</option>
                      <option value="Montserrat">Montserrat</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Card Layer Style</label>
                    <select
                      value={customization.cardStyle}
                      onChange={(e) => setCustomization(prev => ({ ...prev, cardStyle: e.target.value as any }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none font-semibold"
                    >
                      <option value="flat">Flat outlines</option>
                      <option value="elevated">Soft Shadows</option>
                      <option value="glass">Glassmorphism blur</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Body Font Size</label>
                    <select
                      value={customization.fontSize}
                      onChange={(e) => setCustomization(prev => ({ ...prev, fontSize: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="12px">Small (12px)</option>
                      <option value="14px">Normal (14px)</option>
                      <option value="16px">Large (16px)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Heading Size</label>
                    <select
                      value={customization.headingSize}
                      onChange={(e) => setCustomization(prev => ({ ...prev, headingSize: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="28px">Small (28px)</option>
                      <option value="32px">Medium (32px)</option>
                      <option value="40px">Large (40px)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Button Edges</label>
                    <select
                      value={customization.buttonStyle}
                      onChange={(e) => setCustomization(prev => ({ ...prev, buttonStyle: e.target.value as any }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="rounded">Same as border radius</option>
                      <option value="square">Sharp Square</option>
                      <option value="pill">Pill Rounded</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Border Radius</label>
                    <select
                      value={customization.borderRadius}
                      onChange={(e) => setCustomization(prev => ({ ...prev, borderRadius: e.target.value }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="0px">0px (Sharp)</option>
                      <option value="8px">8px (Standard)</option>
                      <option value="12px">12px (Smooth)</option>
                      <option value="16px">16px (Extra Smooth)</option>
                      <option value="24px">24px (Rounded)</option>
                    </select>
                  </div>
                </div>

                {/* Uppercase toggle */}
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer flex-1 py-2.5 px-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={customization.uppercaseToggle}
                      onChange={(e) => setCustomization(prev => ({ ...prev, uppercaseToggle: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-purple-500"
                    />
                    <span className="text-[10px] font-bold text-gray-300">Force Uppercase Headings</span>
                  </label>
                </div>
              </div>
            )}

            {/* HEADER TAB */}
            {activeTab === 'header' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <SlidersHorizontal size={14} /> Navigation Header Options
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 py-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customization.stickyHeader}
                      onChange={(e) => setCustomization(prev => ({ ...prev, stickyHeader: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-purple-500"
                    />
                    <span className="text-[10px] font-bold text-gray-300">Sticky Header</span>
                  </label>

                  <label className="flex items-center gap-2 py-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customization.transparentHeader}
                      onChange={(e) => setCustomization(prev => ({ ...prev, transparentHeader: e.target.checked }))}
                      className="w-3.5 h-3.5 accent-purple-500"
                    />
                    <span className="text-[10px] font-bold text-gray-300">Transparent Hero</span>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Logo Alignment</label>
                    <select
                      value={customization.logoPosition}
                      onChange={(e) => setCustomization(prev => ({ ...prev, logoPosition: e.target.value as any }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="left">Left Align</option>
                      <option value="center">Center Align</option>
                      <option value="right">Right Align</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400">Menu Alignment</label>
                    <select
                      value={customization.menuPosition}
                      onChange={(e) => setCustomization(prev => ({ ...prev, menuPosition: e.target.value as any }))}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="left">Left Align</option>
                      <option value="center">Center Align</option>
                      <option value="right">Right Align</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-bold text-gray-400 block border-b border-white/5 pb-1">Action Button Toggles</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'showHeaderWhatsApp', label: 'WhatsApp CTA' },
                      { key: 'showHeaderCall', label: 'Phone Call CTA' },
                      { key: 'showHeaderSearch', label: 'Search Bar' },
                      { key: 'showHeaderLogin', label: 'Client Sign In' }
                    ].map((btn) => (
                      <label key={btn.key} className="flex items-center gap-2 py-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!customization[btn.key as keyof Customization]}
                          onChange={(e) => setCustomization(prev => ({ ...prev, [btn.key]: e.target.checked }))}
                          className="w-3.5 h-3.5 accent-purple-500"
                        />
                        <span className="text-[10px] font-bold text-gray-300">{btn.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER TAB */}
            {activeTab === 'footer' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <SlidersHorizontal size={14} /> Footer Builder Options
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                  {[
                    { key: 'footerAbout', label: 'About Column' },
                    { key: 'footerHours', label: 'Hours Schedule' },
                    { key: 'footerLinks', label: 'Quick Links' },
                    { key: 'footerMap', label: 'Google Maps' },
                    { key: 'footerSocials', label: 'Social Channels' },
                    { key: 'footerPrivacyLinks', label: 'Terms & Privacy' }
                  ].map((foo) => (
                    <label key={foo.key} className="flex items-center gap-2 py-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!customization[foo.key as keyof Customization]}
                        onChange={(e) => setCustomization(prev => ({ ...prev, [foo.key]: e.target.checked }))}
                        className="w-3.5 h-3.5 accent-purple-500"
                      />
                      <span className="text-[10px] text-gray-300">{foo.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* HOMEPAGE SECTIONS ORDER TAB */}
            {activeTab === 'homepage' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <SlidersHorizontal size={14} /> Reorder Homepage Sections
                </h3>

                <div className="space-y-2.5">
                  {customization.homepageSectionsOrder.map((sectionKey, idx) => {
                    const isVisible = customization.sectionsVisible[sectionKey] !== false;
                    
                    return (
                      <div
                        key={sectionKey}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isVisible 
                            ? 'bg-white/[0.02] border-white/10' 
                            : 'bg-white/[0.01] border-white/5 opacity-55'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={(e) => setCustomization(prev => ({
                              ...prev,
                              sectionsVisible: {
                                ...prev.sectionsVisible,
                                [sectionKey]: e.target.checked
                              }
                            }))}
                            className="w-3.5 h-3.5 accent-purple-500 shrink-0"
                          />
                          <span className="text-xs font-bold text-white capitalize truncate">{sectionKey}</span>
                        </div>

                        {/* Reordering buttons */}
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSection(idx, 'up')}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === customization.homepageSectionsOrder.length - 1}
                            onClick={() => handleMoveSection(idx, 'down')}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SEO TAB */}
            {activeTab === 'seo' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Globe size={14} /> Search Engine Optimization
                </h3>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Custom SEO Title Override</label>
                    <input
                      type="text"
                      placeholder={company.name}
                      value={company.customMetaTitle || ''}
                      onChange={(e) => {
                        company.customMetaTitle = e.target.value;
                      }}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">Custom SEO Meta Description</label>
                    <textarea
                      rows={3}
                      placeholder="Enter description..."
                      value={company.customMetaDescription || ''}
                      onChange={(e) => {
                        company.customMetaDescription = e.target.value;
                      }}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-xs text-white outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400">SEO Keywords (Comma Separated)</label>
                    <input
                      type="text"
                      placeholder="jobs, business, manufacturer"
                      value={company.seoKeywords || ''}
                      onChange={(e) => {
                        company.seoKeywords = e.target.value;
                      }}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI TAB */}
            {activeTab === 'ai' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <BrainCircuit size={14} /> AI Copywriter Assistants
                </h3>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Let THENIJOBS AI generate marketing copy, keywords structures, and alt texts for your products and services instantly.
                </p>

                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAIGenerateText('description')}
                    className="w-full p-4 rounded-xl border border-white/10 bg-gradient-to-r from-purple-900/40 via-indigo-900/20 to-transparent text-left flex justify-between items-center hover:border-purple-500/30"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">Generate Company Story</span>
                      <span className="text-[9px] text-gray-400 mt-0.5 block">AI generates an overview description</span>
                    </div>
                    <Sparkles size={14} className="text-purple-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAIGenerateText('seo')}
                    className="w-full p-4 rounded-xl border border-white/10 bg-gradient-to-r from-purple-900/40 via-indigo-900/20 to-transparent text-left flex justify-between items-center hover:border-purple-500/30"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">Generate SEO Meta Description</span>
                      <span className="text-[9px] text-gray-400 mt-0.5 block">AI generates meta title, descriptions</span>
                    </div>
                    <Sparkles size={14} className="text-purple-400" />
                  </button>
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-fade-up">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <BarChart3 size={14} /> Performance & Traffic Sources
                </h3>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="theme-card-custom p-4">
                    <span className="text-lg font-black text-purple-400">{company.visitCount || '450'}</span>
                    <p className="text-[9px] font-extrabold uppercase text-gray-500 tracking-wider">Visitors</p>
                  </div>
                  <div className="theme-card-custom p-4">
                    <span className="text-lg font-black text-purple-400">{reviews?.length || 0}</span>
                    <p className="text-[9px] font-extrabold uppercase text-gray-500 tracking-wider">Leads Submitted</p>
                  </div>
                </div>

                {/* SVG Mock Analytics Chart */}
                <div className="theme-card-custom p-4 space-y-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Traffic Analysis (Monthly Clicks)</h4>
                  <svg viewBox="0 0 100 40" className="w-full h-32 overflow-visible">
                    {/* Mock Graph Paths */}
                    <path
                      d="M 5,35 Q 20,15 35,28 T 65,8 T 95,5"
                      fill="none"
                      stroke="url(#purpleGlow)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="purpleGlow" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7C3AED" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                    
                    {/* Dots */}
                    <circle cx="5" cy="35" r="1.5" fill="#7C3AED" />
                    <circle cx="35" cy="28" r="1.5" fill="#7C3AED" />
                    <circle cx="65" cy="8" r="1.5" fill="#EC4899" />
                    <circle cx="95" cy="5" r="1.5" fill="#EC4899" />
                  </svg>
                  <div className="flex justify-between text-[9px] text-gray-600 font-bold uppercase">
                    <span>March</span>
                    <span>April</span>
                    <span>May</span>
                    <span>June</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Publish CTA */}
        <div className="p-6 border-t border-white/[0.08] bg-[#0c0c1e]/60 backdrop-blur-md flex gap-3 sticky bottom-0 z-20">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="flex-1 py-3 text-xs font-bold uppercase tracking-wider theme-btn-primary flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Publish Custom Website
          </button>
        </div>
      </div>

      {/* ── Right Responsive Live Preview Window ── */}
      <div className={`flex-1 bg-[#05050f] p-4 sm:p-6 flex flex-col items-center justify-center min-w-0 ${mobileView === 'preview' ? 'flex' : 'hidden lg:flex'}`}>
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-purple-400" />
            <span className="text-xs font-bold text-gray-400 font-outfit uppercase tracking-wider">Live Preview canvas</span>
          </div>

          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
            {[
              { mode: 'desktop', icon: Globe },
              { mode: 'laptop', icon: Laptop },
              { mode: 'tablet', icon: Tablet },
              { mode: 'mobile', icon: Smartphone }
            ].map((btn) => {
              const Icon = btn.icon;
              const isActive = previewMode === btn.mode;
              return (
                <button
                  key={btn.mode}
                  type="button"
                  title={`${btn.mode} Preview`}
                  onClick={() => setPreviewMode(btn.mode as any)}
                  className={`p-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        </div>

        <div className={`w-full bg-[#111124] border border-white/[0.08] shadow-2xl relative overflow-y-auto no-scrollbar smooth-transition flex flex-col items-center justify-start ${previewWidthClass}`}>
          {previewMode !== 'mobile' && (
            <div className="w-full h-8 bg-[#0c0c1e] border-b border-white/[0.08] flex items-center px-4 gap-1.5 shrink-0 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="flex-1 max-w-sm mx-auto h-5 bg-white/5 border border-white/10 rounded text-[9px] text-gray-400 flex items-center px-3 truncate">
                thenijobs.com/company/{company.slug || company.id}
              </div>
            </div>
          )}

          <div className="w-full flex-1 overflow-y-auto">
            <CustomTemplateWrapper
              company={processedCompanyPreview}
              jobs={jobs || []}
              reviews={reviews || []}
              customization={customization}
              isPreview={true}
            />
          </div>
        </div>
      </div>

      {/* dialog modals */}
      <UpgradePlanDialog
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentPlan={activePlan}
        audience="business"
        companyId={company.id}
        initialPlan={upgradeTargetPlan}
      />

      <ImageCropperModal
        open={showCropper}
        onClose={() => {
          setShowCropper(false);
          setCropFile(null);
          setCropType(null);
        }}
        file={cropFile}
        aspectRatio={cropType === 'logo' || cropType === 'favicon' || cropType === 'invoice-logo' ? 1 : 4}
        cropWidth={cropType === 'logo' || cropType === 'favicon' || cropType === 'invoice-logo' ? 400 : 1200}
        cropHeight={cropType === 'logo' || cropType === 'favicon' || cropType === 'invoice-logo' ? 400 : 300}
        isCircular={cropType === 'logo' || cropType === 'favicon'}
        title={`Crop Brand Asset: ${cropType}`}
        uploadPath={user?.uid && cropType ? `companies/${user.uid}/${cropType}_${Date.now()}` : undefined}
        onUploadComplete={async (url) => {
          try {
            let updateField = {};
            if (cropType === 'logo') {
              updateField = { logoUrl: url };
              company.logoUrl = url;
            } else if (cropType === 'cover') {
              updateField = { coverImageUrl: url, coverUrl: url };
              company.coverImageUrl = url;
              company.coverUrl = url;
            } else {
              updateField = { [cropType + 'Url']: url };
              company[cropType + 'Url'] = url;
            }
            
            await updateDocument('companies', company.id, {
              ...updateField,
              updatedAt: new Date()
            });
            
            toast({
              title: 'Asset Uploaded',
              description: 'Image asset updated successfully!',
              variant: 'success'
            });
          } catch (err) {
            console.error(err);
            toast({
              title: 'Upload Failed',
              description: 'Failed to record the uploaded image URL.',
              variant: 'error'
            });
          } finally {
            setShowCropper(false);
            setCropFile(null);
            setCropType(null);
          }
        }}
      />
    </div>
  );
}
