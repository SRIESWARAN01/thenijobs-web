'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Camera, Upload, Building2, Phone, Mail, Globe, MapPin,
  Link2, Heart, Briefcase as LinkedinIcon, Play, Plus, Save,
  CheckCircle, AlertCircle, Shield, Smartphone, FileText,
  ImagePlus, Trash2, MessageCircle, Loader2, Clock, XCircle, Eye, ExternalLink,
  Package, Wrench, FolderGit2, User, LayoutGrid, MessageSquare, Sparkles, Lock
} from 'lucide-react';
import { TN_DISTRICTS, FounderProfile } from '@/lib/types';
import { hasFeaturePermission } from '@/lib/plans';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useUploadFile } from '@/hooks/useStorage';
import { createDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import DeviceLivePreviewModal from '@/components/ui/DeviceLivePreviewModal';
import CompanyProfileClient from '@/app/company/[slug]/CompanyProfileClient';
import CompanyProductsManager from '@/components/company/CompanyProductsManager';
import CompanyServicesManager from '@/components/company/CompanyServicesManager';
import CompanyPortfolioManager from '@/components/company/CompanyPortfolioManager';
import CompanyFounderManager from '@/components/company/CompanyFounderManager';
import CompanySectionToggler from '@/components/company/CompanySectionToggler';
import CompanyReviewsManager from '@/components/company/CompanyReviewsManager';

const DEFAULT_COMPANY = {
  name: '',
  tagline: '',
  logoUrl: '',
  coverUrl: '',
  description: '',
  establishedYear: '',
  phone: '',
  email: '',
  whatsapp: '',
  website: '',
  address: '',
  district: '',
  mapEmbedUrl: '',
  googleMapsUrl: '',
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  gallery: ['', '', '', ''],
  products: [] as any[],
  services: [] as any[],
  portfolioProjects: [] as any[],
  founder: { name: '', designation: '', bio: '', nativePlace: '', experienceYears: '', message: '', linkedinUrl: '' } as FounderProfile,
  enabledSections: {} as Record<string, boolean>,
  branches: [] as any[],
  verification: {
    mobile: false,
    email: false,
    gst: false,
    business: false } };

function calcCompletion(data: typeof DEFAULT_COMPANY): number {
  const fields = [
    data.name, data.description, data.phone, data.email,
    data.address, data.district, data.logoUrl, data.coverUrl,
    data.website, data.whatsapp, data.facebook
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export default function CompanyProfilePage() {
  const { user } = useAuth();
  
  // 1. Fetch employer's company
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const resolvedCompany = companies[0];

  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [charCount, setCharCount] = useState(0);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', district: '' });
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'products' | 'services' | 'portfolio' | 'founder' | 'reviews' | 'sections'>('basic');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();

  useEffect(() => {
    if (resolvedCompany) {
      setCompany({
        ...DEFAULT_COMPANY,
        ...resolvedCompany,
        gallery: resolvedCompany.gallery || DEFAULT_COMPANY.gallery,
        branches: resolvedCompany.branches || DEFAULT_COMPANY.branches,
        verification: resolvedCompany.verification || DEFAULT_COMPANY.verification });
      setCharCount(resolvedCompany.description?.length || 0);
    }
  }, [resolvedCompany]);

  const completion = calcCompletion(company);

  const update = (key: string, value: any) => {
    setCompany((prev) => ({ ...prev, [key]: value }));
  };

  const handleDescChange = (value: string) => {
    if (value.length <= 1000) {
      update('description', value);
      setCharCount(value.length);
    }
  };

  const addBranch = () => {
    if (newBranch.name && newBranch.address && newBranch.district) {
      setCompany((prev) => ({
        ...prev,
        branches: [...(prev.branches || []), { id: Date.now().toString(), ...newBranch }] }));
      setNewBranch({ name: '', address: '', district: '' });
      setShowBranchForm(false);
    }
  };

  const removeBranch = (id: string) => {
    setCompany((prev) => ({
      ...prev,
      branches: (prev.branches || []).filter((b) => b.id !== id) }));
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    try {
      const url = await uploadFile(file, `companies/${user.uid}/cover_${Date.now()}`);
      update('coverUrl', url);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err as Error).message);
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    try {
      const url = await uploadFile(file, `companies/${user.uid}/logo_${Date.now()}`);
      update('logoUrl', url);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err as Error).message);
    }
  };

  const handleUploadGallery = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    try {
      const url = await uploadFile(file, `companies/${user.uid}/gallery_${index}_${Date.now()}`);
      const newGallery = [...company.gallery];
      newGallery[index] = url;
      setCompany(prev => ({ ...prev, gallery: newGallery }));
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err as Error).message);
    }
  };

  const handleSave = async () => {
    if (!company.name) {
      alert('Please fill in the Company Name.');
      return;
    }
    if (!company.phone || !company.email) {
      alert('Please fill in both Phone and Email.');
      return;
    }
    if (!company.address || !company.district) {
      alert('Please fill in Address and District.');
      return;
    }
    setSaving(true);
    try {
      const docData = {
        name: company.name,
        tagline: company.tagline,
        logoUrl: company.logoUrl,
        coverUrl: company.coverUrl,
        description: company.description,
        establishedYear: company.establishedYear,
        phone: company.phone,
        email: company.email,
        whatsapp: company.whatsapp,
        website: company.website,
        address: company.address,
        district: company.district,
        mapEmbedUrl: company.mapEmbedUrl,
        googleMapsUrl: company.googleMapsUrl,
        facebook: company.facebook,
        instagram: company.instagram,
        linkedin: company.linkedin,
        youtube: company.youtube,
        gallery: company.gallery,
        products: company.products,
        services: company.services,
        portfolioProjects: company.portfolioProjects,
        founder: company.founder,
        enabledSections: company.enabledSections,
        branches: company.branches,
        verification: company.verification,
        updatedAt: new Date()
      };

      if (resolvedCompany?.id) {
        await updateDocument('companies', resolvedCompany.id, docData);
        if (resolvedCompany.verificationStatus === 'rejected') {
          alert('Profile updated! Please contact support or wait for admin to re-review your listing.');
        } else {
          alert('Company profile updated successfully!');
        }
      } else {
        await createDocument('companies', {
          ...docData,
          ownerId: user?.uid,
          verificationStatus: 'pending',
          isActive: false,
          viewCount: 0
        });
        alert('Company profile created successfully! It is currently pending admin approval.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save company profile.');
    } finally {
      setSaving(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit">
        <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-outfit">Company Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your company information, branding, and portfolio</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            <Eye size={16} />
            <span>Live Device Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {completion < 100 && (
        <div className="glass-card rounded-2xl p-4 border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                Profile {completion}% Complete
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete your profile to attract more candidates and build trust
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      )}

      {uploading && (
        <div className="glass-card rounded-2xl p-4 border border-blue-200 bg-blue-50 flex items-center gap-3">
          <Loader2 size={18} className="text-blue-600 animate-spin" />
          <span className="text-xs text-gray-300">Uploading file... {uploadProgress}%</span>
        </div>
      )}

      {/* ── Moderation status banners ─────────────────────────────────── */}
      {resolvedCompany?.verificationStatus === 'pending' && (
        <div className="glass-card rounded-2xl p-4 border border-amber-200 bg-amber-50 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Clock size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">Under Review — Pending Approval</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Your business profile has been submitted and is awaiting admin review.
              It will go live once approved. You can still update your profile here.
            </p>
          </div>
        </div>
      )}

      {resolvedCompany?.verificationStatus === 'rejected' && (
        <div className="glass-card rounded-2xl p-4 border border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <XCircle size={16} className="text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-rose-300">Profile Not Approved</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Your business profile requires changes before it can go live.
              </p>
              {resolvedCompany?.rejectionReason && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-red-100 border border-red-200">
                  <span className="text-xs text-rose-300 font-semibold">Reason: </span>
                  <span className="text-xs text-rose-200">{resolvedCompany.rejectionReason}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Update your profile and save — it will be re-submitted for admin review automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {resolvedCompany?.verificationStatus === 'verified' && (
        <div className="glass-card rounded-2xl p-3 border border-emerald-200 bg-emerald-50 flex items-center gap-3">
          <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-700 font-medium">Your business is verified and live on THENIJOBS.</p>
        </div>
      )}

      {/* Company Website Builder Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'basic', label: 'Basic Info & Branding', icon: Building2 },
          { key: 'products', label: 'Products Catalogue', icon: Package, locked: !hasFeaturePermission(resolvedCompany?.subscriptionPlan, 'productsListing') },
          { key: 'services', label: 'Services Directory', icon: Wrench, locked: !hasFeaturePermission(resolvedCompany?.subscriptionPlan, 'servicesListing') },
          { key: 'portfolio', label: 'Portfolio & Projects', icon: FolderGit2, locked: !hasFeaturePermission(resolvedCompany?.subscriptionPlan, 'portfolioProjects') },
          { key: 'founder', label: 'Founder Profile', icon: User, locked: !hasFeaturePermission(resolvedCompany?.subscriptionPlan, 'founderProfile') },
          { key: 'reviews', label: 'Reviews & Feedback', icon: MessageSquare },
          { key: 'sections', label: 'Modular Sections', icon: LayoutGrid },
        ].map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <TabIcon size={14} />
              <span>{tab.label}</span>
              {tab.locked && (
                <span className="ml-1 rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                  <Lock size={9} className="inline" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'products' && (
        <div className="glass-card rounded-2xl p-6">
          <CompanyProductsManager
            products={company.products || []}
            planSlug={resolvedCompany?.subscriptionPlan || 'free'}
            companyName={company.name || 'Company'}
            companySlug={resolvedCompany?.slug || ''}
            phone={company.phone || '9360519460'}
            whatsapp={company.whatsapp || company.phone || '9360519460'}
            district={company.district || 'Theni'}
            onChange={products => setCompany({ ...company, products })}
          />
        </div>
      )}

      {activeTab === 'services' && (
        <div className="glass-card rounded-2xl p-6">
          <CompanyServicesManager
            services={company.services || []}
            planSlug={resolvedCompany?.subscriptionPlan || 'free'}
            companyName={company.name || 'Company'}
            companySlug={resolvedCompany?.slug || ''}
            phone={company.phone || '9360519460'}
            whatsapp={company.whatsapp || company.phone || '9360519460'}
            district={company.district || 'Theni'}
            onChange={services => setCompany({ ...company, services })}
          />
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="glass-card rounded-2xl p-6">
          <CompanyPortfolioManager
            portfolioProjects={company.portfolioProjects || []}
            planSlug={resolvedCompany?.subscriptionPlan || 'free'}
            onChange={portfolioProjects => setCompany({ ...company, portfolioProjects })}
          />
        </div>
      )}

      {activeTab === 'founder' && (
        <div className="glass-card rounded-2xl p-6">
          <CompanyFounderManager
            founder={company.founder}
            planSlug={resolvedCompany?.subscriptionPlan || 'free'}
            onChange={founder => setCompany({ ...company, founder })}
          />
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="glass-card rounded-2xl p-6">
          <CompanyReviewsManager companyId={resolvedCompany?.id || ''} />
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="glass-card rounded-2xl p-6">
          <CompanySectionToggler
            enabledSections={company.enabledSections || {}}
            planSlug={resolvedCompany?.subscriptionPlan || 'free'}
            onChange={enabledSections => setCompany({ ...company, enabledSections })}
          />
        </div>
      )}

      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Logo & Cover */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Cover Banner Upload */}
            <div
              className="relative h-44 sm:h-52 bg-slate-950 border-b border-gray-100 group cursor-pointer flex items-center justify-center overflow-hidden"
              onClick={() => coverInputRef.current?.click()}
            >
              {company.coverUrl ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center blur-xs opacity-25 scale-105"
                    style={{ backgroundImage: `url(${company.coverUrl})` }}
                  />
                  <img
                    src={company.coverUrl}
                    alt="Cover Banner"
                    className="relative z-10 w-full h-full object-contain object-center"
                  />
                </>
              ) : (
                <div className="text-center text-gray-400 p-4">
                  <Upload size={24} className="mx-auto mb-1.5 opacity-60 text-white" />
                  <span className="text-xs font-semibold text-gray-200 block">Click to Upload Business Banner</span>
                  <span className="text-[10px] text-gray-400">Recommended: 1200 × 400px</span>
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadCover}
              />
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xs text-white text-xs font-bold transition-all shadow-md">
                  <Upload size={14} /> Change Cover Banner
                </button>
              </div>
            </div>

            {/* Logo Upload */}
            <div className="px-6 pb-6 -mt-12 relative z-10">
              <div className="flex items-end gap-5">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadLogo}
                  />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-emerald-100 border-4 border-white flex items-center justify-center overflow-hidden">
                    {company.logoUrl ? (
                      <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 size={32} className="text-cyan-400" />
                    )}
                  </div>
                  <button className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                  </button>
                </div>
                <div className="pb-1 flex-1">
                  <input
                    type="text"
                    placeholder="Enter Company Name *"
                    value={company.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="bg-transparent text-lg font-bold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-cyan-500 focus:outline-none w-full pb-1"
                  />
                  <input
                    type="text"
                    placeholder="Company tagline"
                    value={company.tagline}
                    onChange={(e) => update('tagline', e.target.value)}
                    className="bg-transparent text-xs text-gray-400 border-b border-transparent hover:border-gray-200 focus:border-cyan-500 focus:outline-none w-full mt-1 pb-0.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About Company */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-cyan-400" />
              About Company
            </h3>
            <div>
              <textarea
                rows={6}
                value={company.description}
                onChange={(e) => handleDescChange(e.target.value)}
                placeholder="Describe your company, what you do, your mission, and details candidates would want to know..."
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none leading-relaxed"
              />
              <div className="flex justify-end mt-1.5">
                <span className={`text-[10px] font-medium ${charCount > 900 ? 'text-amber-400' : 'text-gray-500'}`}>
                  {charCount}/1000 characters
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone size={16} className="text-cyan-400" />
              Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">Phone *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={company.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={company.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">WhatsApp</label>
                <div className="relative">
                  <MessageCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={company.whatsapp}
                    onChange={(e) => update('whatsapp', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">Website</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="url"
                    placeholder="https://www.example.com"
                    value={company.website}
                    onChange={(e) => update('website', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-cyan-400" />
              Location
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">Full Address *</label>
                <input
                  type="text"
                  placeholder="Street, Area, Building Details"
                  value={company.address}
                  onChange={(e) => update('address', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5">District *</label>
                <select
                  value={company.district}
                  onChange={(e) => update('district', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select district</option>
                  {TN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" />
              Social Media Links
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Link2 size={12} className="text-blue-400" /> Facebook
                </label>
                <input
                  type="url"
                  value={company.facebook}
                  onChange={(e) => update('facebook', e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Heart size={12} className="text-pink-400" /> Instagram
                </label>
                <input
                  type="url"
                  value={company.instagram}
                  onChange={(e) => update('instagram', e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5 flex items-center gap-1.5">
                  <LinkedinIcon size={12} className="text-blue-500" /> LinkedIn
                </label>
                <input
                  type="url"
                  value={company.linkedin}
                  onChange={(e) => update('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Play size={12} className="text-red-400" /> YouTube
                </label>
                <input
                  type="url"
                  value={company.youtube}
                  onChange={(e) => update('youtube', e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ImagePlus size={16} className="text-cyan-400" />
                Gallery
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {company.gallery.map((imgUrl, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-white/[0.03] border border-dashed border-gray-200 flex items-center justify-center group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden"
                  onClick={() => galleryInputRefs[i].current?.click()}
                >
                  <input
                    ref={galleryInputRefs[i]}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUploadGallery(e, i)}
                  />
                  {imgUrl ? (
                    <>
                      <img src={imgUrl} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={18} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload size={20} className="text-gray-600 mx-auto mb-1 group-hover:text-cyan-400 transition-colors" />
                      <p className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">Upload</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Branch Locations */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Building2 size={16} className="text-cyan-400" />
                Branch Locations
              </h3>
              <button
                onClick={() => setShowBranchForm(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <Plus size={14} /> Add Branch
              </button>
            </div>
            <div className="space-y-3">
              {company.branches?.map((branch) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-gray-100 group"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{branch.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{branch.address}</p>
                    <span className="inline-block mt-1 text-[10px] text-cyan-400 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                      {branch.district}
                    </span>
                  </div>
                  <button
                    onClick={() => removeBranch(branch.id)}
                    className="p-2 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {showBranchForm && (
                <div className="p-4 rounded-xl bg-white border border-blue-200 space-y-3">
                  <input
                    type="text"
                    placeholder="Branch name"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
                  />
                  <select
                    value={newBranch.district}
                    onChange={(e) => setNewBranch((p) => ({ ...p, district: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="">Select district</option>
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={addBranch}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowBranchForm(false)}
                      className="px-4 py-2 rounded-xl bg-white text-gray-400 text-sm font-medium hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Saving...' : 'Save Company Profile'}
          </button>
        </div>

        {/* Sidebar — Verification Status */}
        <div className="xl:col-span-1 font-outfit">
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-cyan-400" />
              Verification Status
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Mobile Verified', icon: Smartphone, verified: company.verification.mobile },
                { label: 'Email Verified', icon: Mail, verified: company.verification.email },
                { label: 'GST Verified', icon: FileText, verified: company.verification.gst },
                { label: 'Business Verified', icon: Building2, verified: company.verification.business },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      item.verified
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white/[0.02] border-gray-100'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.verified ? 'bg-emerald-100' : 'bg-white'
                      }`}
                    >
                      <Icon size={14} className={item.verified ? 'text-emerald-400' : 'text-gray-500'} />
                    </div>
                    <span className={`text-sm font-medium flex-1 ${item.verified ? 'text-emerald-300' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                    {item.verified && (
                      <CheckCircle size={16} className="text-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Trust Score */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Trust Score</span>
                <span className="text-sm font-bold text-cyan-400">
                  {Math.round(
                    ((Object.values(company.verification).filter(Boolean).length) /
                      Object.keys(company.verification).length) *
                      100
                  )}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                  style={{
                    width: `${
                      ((Object.values(company.verification).filter(Boolean).length) /
                        Object.keys(company.verification).length) *
                      100
                    }%`
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                Verification status is managed by administrators to ensure platform safety and trust.
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Live Device Portfolio Preview Modal */}
      <DeviceLivePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`${company.name || 'Company Profile'} — Live Portfolio Preview`}
        publicUrl={resolvedCompany?.slug ? `/company/${resolvedCompany.slug}` : '/company/digital-theni-solutions'}
      >
        <CompanyProfileClient company={company} jobs={[]} reviews={[]} />
      </DeviceLivePreviewModal>
    </div>
  );
}
