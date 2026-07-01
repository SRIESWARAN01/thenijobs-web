'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Laptop, Tablet, Smartphone, Globe, Save, Loader2,
  Lock, Sparkles, Crown, ImagePlus, Check, ChevronRight,
  SlidersHorizontal, Paintbrush, Layers, Type, CreditCard, Eye
} from 'lucide-react';

import { useRequireAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useToast } from '@/hooks/useToast';
import { where } from 'firebase/firestore';

import { getCompanyActivePlan, getPlanRank } from '@/lib/subscriptions';
import { updateDocument } from '@/lib/firebase/firestoreService';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import UpgradePlanDialog from '@/components/portal/UpgradePlanDialog';
import { CustomTemplateWrapper } from '@/components/company/CustomTemplates';

interface Customization {
  websiteTheme: 'classic-blue' | 'emerald-growth' | 'royal-purple' | 'sunset-amber' | 'royal-gold';
  websiteTemplate: 'classic-directory' | 'modern-portfolio' | 'ecommerce-storefront' | 'service-booking';
  customPrimaryColor: string;
  fontFamily: 'Inter' | 'Roboto' | 'Outfit' | 'Playfair Display' | 'Poppins';
  buttonStyle: 'rounded' | 'square' | 'pill';
  cardStyle: 'flat' | 'elevated' | 'glass';
  borderRadius: string;
  enableDarkMode: boolean;
  enableAnimations: boolean;
  sectionsVisible: {
    products: boolean;
    services: boolean;
    reviews: boolean;
    gallery: boolean;
    team: boolean;
    faq: boolean;
  };
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

  // Load company's listings for preview context
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
      products: true,
      services: true,
      reviews: true,
      gallery: true,
      team: true,
      faq: true,
    }
  });

  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('laptop');

  // Gating modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTargetPlan, setUpgradeTargetPlan] = useState<'premium' | 'enterprise'>('premium');

  // Image Upload states
  const [showCropper, setShowCropper] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'cover' | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
          products: company.sectionsVisible?.products !== false,
          services: company.sectionsVisible?.services !== false,
          reviews: company.sectionsVisible?.reviews !== false,
          gallery: company.sectionsVisible?.gallery !== false,
          team: company.sectionsVisible?.team !== false,
          faq: company.sectionsVisible?.faq !== false,
        }
      });
    }
  }, [company]);

  if (authLoading || companyLoading) {
    return (
      <div className="min-h-screen bg-[#070714] text-white flex flex-col items-center justify-center font-outfit">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading customizer dashboard...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
          <Globe size={40} className="mx-auto text-purple-400 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold">No Company Profile Found</h2>
          <p className="mt-2 text-sm text-gray-400">
            Please register your company profile first in order to build your customized website.
          </p>
          <button
            onClick={() => router.push('/business/company-profile')}
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-purple-600 px-6 text-xs font-bold text-white hover:bg-purple-700 transition-all active:scale-95 shadow-md"
          >
            Create Company Profile
          </button>
        </div>
      </div>
    );
  }

  const activePlan = getCompanyActivePlan(company);
  const planRank = getPlanRank(activePlan);

  // Layout restrictions check helper
  const handleSelectTheme = (theme: 'classic-blue' | 'emerald-growth' | 'royal-purple' | 'sunset-amber' | 'royal-gold') => {
    if (theme === 'sunset-amber' && planRank < 2) {
      setUpgradeTargetPlan('premium');
      setShowUpgradeModal(true);
      return;
    }
    if (theme === 'royal-gold' && planRank < 3) {
      setUpgradeTargetPlan('enterprise');
      setShowUpgradeModal(true);
      return;
    }
    setCustomization(prev => ({ ...prev, websiteTheme: theme }));
  };

  const handleSelectTemplate = (template: 'classic-directory' | 'modern-portfolio' | 'ecommerce-storefront' | 'service-booking') => {
    if ((template === 'modern-portfolio' || template === 'ecommerce-storefront') && planRank < 2) {
      setUpgradeTargetPlan('premium');
      setShowUpgradeModal(true);
      return;
    }
    if (template === 'service-booking' && planRank < 3) {
      setUpgradeTargetPlan('enterprise');
      setShowUpgradeModal(true);
      return;
    }
    setCustomization(prev => ({ ...prev, websiteTemplate: template }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument('companies', company.id, {
        websiteTheme: customization.websiteTheme,
        websiteTemplate: customization.websiteTemplate,
        customPrimaryColor: customization.customPrimaryColor,
        fontFamily: customization.fontFamily,
        buttonStyle: customization.buttonStyle,
        cardStyle: customization.cardStyle,
        borderRadius: customization.borderRadius,
        enableDarkMode: customization.enableDarkMode,
        enableAnimations: customization.enableAnimations,
        sectionsVisible: customization.sectionsVisible,
        updatedAt: new Date()
      });
      
      toast({
        title: 'Settings Saved',
        description: 'Your changes have been published to your public company website!',
        variant: 'success'
      });
    } catch (err) {
      console.error('Failed to save website customization:', err);
      toast({
        title: 'Save Failed',
        description: 'Failed to update website appearance settings.',
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
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

  // Preview sizing
  const previewWidthClass = {
    desktop: 'w-full h-full',
    laptop: 'max-w-[1024px] h-[75vh] border-x border-b border-white/10 rounded-b-2xl',
    tablet: 'max-w-[768px] h-[75vh] border-x border-b border-white/10 rounded-b-2xl',
    mobile: 'max-w-[390px] h-[70vh] border border-white/10 rounded-2xl'
  }[previewMode];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#070714] text-white font-sans overflow-x-hidden">
      {/* ── Left Sidebar Settings Panel ── */}
      <div className="w-full lg:w-[420px] shrink-0 border-r border-white/[0.08] bg-[#0a0a1a] flex flex-col justify-between max-h-screen overflow-y-auto no-scrollbar">
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h1 className="text-lg font-black font-outfit text-white tracking-wide">Website Customizer</h1>
              <p className="text-[10px] text-gray-500 font-semibold mt-0.5">Customize your brand appearance</p>
            </div>
            <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full uppercase">
              {activePlan} Tier
            </span>
          </div>

          {/* Upload Assets Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <ImagePlus size={14} /> Brand Materials
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Logo upload */}
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={logoInputRef}
                  className="hidden"
                  onChange={(e) => handleUploadImage(e, 'logo')}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full p-4 rounded-xl border border-dashed border-white/10 hover:border-purple-500/40 bg-white/[0.02] hover:bg-white/[0.04] text-center text-xs space-y-1.5 transition-all"
                >
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className="w-10 h-10 rounded-full mx-auto object-cover border border-white/10" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-400">
                      <ImagePlus size={18} />
                    </div>
                  )}
                  <span className="block font-bold text-[10px] text-gray-300">Company Logo</span>
                </button>
              </div>

              {/* Cover Banner upload */}
              <div className="space-y-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={coverInputRef}
                  className="hidden"
                  onChange={(e) => handleUploadImage(e, 'cover')}
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full p-4 rounded-xl border border-dashed border-white/10 hover:border-purple-500/40 bg-white/[0.02] hover:bg-white/[0.04] text-center text-xs space-y-1.5 transition-all"
                >
                  {company.coverImageUrl || company.coverUrl ? (
                    <img src={company.coverImageUrl || company.coverUrl} alt="Cover" className="w-14 h-8 rounded mx-auto object-cover border border-white/10" />
                  ) : (
                    <div className="w-14 h-8 rounded bg-white/5 flex items-center justify-center mx-auto text-gray-400">
                      <ImagePlus size={18} />
                    </div>
                  )}
                  <span className="block font-bold text-[10px] text-gray-300">Cover Banner</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preset Color Themes */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Paintbrush size={14} /> Color Themes
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'classic-blue', label: 'Classic Blue', primary: '#2563EB', plan: 'Free' },
                { id: 'emerald-growth', label: 'Emerald Growth', primary: '#10B981', plan: 'Free' },
                { id: 'royal-purple', label: 'Royal Purple', primary: '#7C3AED', plan: 'Free' },
                { id: 'sunset-amber', label: 'Sunset Amber', primary: '#F59E0B', plan: 'Premium' },
                { id: 'royal-gold', label: 'Royal Gold', primary: '#D4AF37', plan: 'Enterprise' }
              ].map((theme) => {
                const isSelected = customization.websiteTheme === theme.id;
                const isLocked = theme.plan === 'Premium' ? planRank < 2 : theme.plan === 'Enterprise' ? planRank < 3 : false;
                
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleSelectTheme(theme.id as any)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                      isSelected
                        ? 'bg-purple-600/10 border-purple-500 shadow-md shadow-purple-500/5'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-bold text-white truncate max-w-[80%]">{theme.label}</span>
                      {isLocked ? (
                        <Lock size={10} className="text-amber-500 shrink-0" />
                      ) : isSelected && (
                        <Check size={11} className="text-purple-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-4 h-4 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: theme.primary }} />
                      <span className="text-[8px] text-gray-500 font-bold uppercase">{theme.plan}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Primary Color */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-gray-400">Override Primary Color (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customization.customPrimaryColor || '#7C3AED'}
                  onChange={(e) => setCustomization(prev => ({ ...prev, customPrimaryColor: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer overflow-hidden shrink-0"
                />
                <input
                  type="text"
                  placeholder="#7C3AED"
                  value={customization.customPrimaryColor}
                  onChange={(e) => setCustomization(prev => ({ ...prev, customPrimaryColor: e.target.value }))}
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder:text-gray-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Website Templates */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Layers size={14} /> Website Layouts
            </h2>
            <div className="space-y-2">
              {[
                { id: 'classic-directory', label: 'Classic Directory', desc: 'Cover, Info, Products/Services listings, Maps and Reviews.', plan: 'Free' },
                { id: 'modern-portfolio', label: 'Modern Portfolio', desc: 'Hero view, counters, parallax sections, dark mode, testimonials.', plan: 'Premium' },
                { id: 'ecommerce-storefront', label: 'E-Commerce Storefront', desc: 'Shopping grid filters, product search, quick view & WA ordering.', plan: 'Premium' },
                { id: 'service-booking', label: 'Service Booking Portal', desc: 'Interactive appointment scheduler, pricing matrices, team view.', plan: 'Enterprise' }
              ].map((tpl) => {
                const isSelected = customization.websiteTemplate === tpl.id;
                const isLocked = tpl.plan === 'Premium' ? planRank < 2 : tpl.plan === 'Enterprise' ? planRank < 3 : false;

                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id as any)}
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

          {/* Typography Settings */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Type size={14} /> Typography & Styling
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400">Font Family</label>
                <select
                  value={customization.fontFamily}
                  onChange={(e) => setCustomization(prev => ({ ...prev, fontFamily: e.target.value as any }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Playfair Display">Playfair Display</option>
                  <option value="Poppins">Poppins</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400">Border Radius</label>
                <select
                  value={customization.borderRadius}
                  onChange={(e) => setCustomization(prev => ({ ...prev, borderRadius: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="0px">Square (0px)</option>
                  <option value="4px">Extra Small (4px)</option>
                  <option value="8px">Small (8px)</option>
                  <option value="12px">Medium (12px)</option>
                  <option value="16px">Large (16px)</option>
                  <option value="24px">Extra Large (24px)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400">Button Corner</label>
                <select
                  value={customization.buttonStyle}
                  onChange={(e) => setCustomization(prev => ({ ...prev, buttonStyle: e.target.value as any }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="rounded">Same as border</option>
                  <option value="square">Sharp Square</option>
                  <option value="pill">Rounded Pill</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400">Card Layer</label>
                <select
                  value={customization.cardStyle}
                  onChange={(e) => setCustomization(prev => ({ ...prev, cardStyle: e.target.value as any }))}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none"
                >
                  <option value="flat">Flat outline</option>
                  <option value="elevated">Soft Shadow</option>
                  <option value="glass">Blur Glassmorphism</option>
                </select>
              </div>
            </div>

            {/* Dark mode & Animations */}
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer flex-1 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5">
                <input
                  type="checkbox"
                  checked={customization.enableDarkMode}
                  onChange={(e) => setCustomization(prev => ({ ...prev, enableDarkMode: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-purple-500 rounded border-white/10 bg-transparent"
                />
                <span className="text-[10px] font-bold text-gray-300 select-none">Dark Mode</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer flex-1 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5">
                <input
                  type="checkbox"
                  checked={customization.enableAnimations}
                  onChange={(e) => setCustomization(prev => ({ ...prev, enableAnimations: e.target.checked }))}
                  className="w-3.5 h-3.5 accent-purple-500 rounded border-white/10 bg-transparent"
                />
                <span className="text-[10px] font-bold text-gray-300 select-none">Animations</span>
              </label>
            </div>
          </div>

          {/* Visible Sections Checklist */}
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <SlidersHorizontal size={14} /> Visible Sections
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              {[
                { key: 'products', label: 'Products Catalogue' },
                { key: 'services', label: 'Services Showcase' },
                { key: 'reviews', label: 'Reviews Section' },
                { key: 'gallery', label: 'Photo Gallery' },
                { key: 'team', label: 'Team Profile' },
                { key: 'faq', label: 'FAQs List' }
              ].map((sec) => (
                <label key={sec.key} className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customization.sectionsVisible[sec.key as keyof typeof customization.sectionsVisible]}
                    onChange={(e) => setCustomization(prev => ({
                      ...prev,
                      sectionsVisible: {
                        ...prev.sectionsVisible,
                        [sec.key]: e.target.checked
                      }
                    }))}
                    className="w-3.5 h-3.5 accent-purple-500"
                  />
                  <span className="text-[10px] text-gray-300 select-none">{sec.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Action Publish Bar */}
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
            Publish Website
          </button>
        </div>
      </div>

      {/* ── Right Live Preview Container ── */}
      <div className="flex-1 bg-[#05050f] p-4 sm:p-6 flex flex-col items-center justify-center min-w-0">
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-purple-400" />
            <span className="text-xs font-bold text-gray-400 font-outfit uppercase tracking-wider">Live Preview</span>
          </div>

          {/* View size selector */}
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

        {/* Responsive Canvas Frame wrapper */}
        <div className={`w-full bg-[#111124] border border-white/[0.08] shadow-2xl relative overflow-y-auto no-scrollbar smooth-transition flex flex-col items-center justify-start ${previewWidthClass}`}>
          {/* Mock Browser Header for responsive layout frames */}
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

          {/* Render Customized Live Preview Component */}
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

      {/* Stakeholder dialogs */}
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
        aspectRatio={cropType === 'logo' ? 1 : 4}
        cropWidth={cropType === 'logo' ? 400 : 1200}
        cropHeight={cropType === 'logo' ? 400 : 300}
        isCircular={cropType === 'logo'}
        title={cropType === 'logo' ? 'Crop Company Logo' : 'Crop Cover Banner'}
        uploadPath={user?.uid && cropType ? (cropType === 'logo' ? `companies/${user.uid}/logo_${Date.now()}` : `companies/${user.uid}/cover_${Date.now()}`) : undefined}
        onUploadComplete={async (url) => {
          try {
            const updateField = cropType === 'logo' ? { logoUrl: url } : { coverImageUrl: url, coverUrl: url };
            
            // Persist crop complete storage URL directly to Firestore!
            await updateDocument('companies', company.id, {
              ...updateField,
              updatedAt: new Date()
            });

            // Set state locally for preview
            if (cropType === 'logo') {
              company.logoUrl = url;
            } else {
              company.coverImageUrl = url;
              company.coverUrl = url;
            }
            
            toast({
              title: 'Upload Successful',
              description: `${cropType === 'logo' ? 'Logo' : 'Cover banner'} updated successfully!`,
              variant: 'success'
            });
          } catch (err) {
            console.error('Error saving uploaded asset url:', err);
            toast({
              title: 'Upload Failed',
              description: 'Failed to save the cropped image url to company document.',
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
