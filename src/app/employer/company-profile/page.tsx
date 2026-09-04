'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Camera, Upload, Building2, Phone, Mail, Globe, MapPin,
  Link2, Heart, Briefcase as LinkedinIcon, Play, Plus, Save,
  CheckCircle, AlertCircle, Shield, Smartphone, FileText,
  ImagePlus, Trash2, MessageCircle, Loader2, Clock, XCircle, Eye, ExternalLink,
  Package, Wrench, FolderGit2, User, LayoutGrid, MessageSquare, Sparkles, Lock,
  ChevronRight, ArrowRight
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
    business: false
  }
};

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
        verification: resolvedCompany.verification || DEFAULT_COMPANY.verification
      });
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
        branches: [...(prev.branches || []), { id: Date.now().toString(), ...newBranch }]
      }));
      setNewBranch({ name: '', address: '', district: '' });
      setShowBranchForm(false);
    }
  };

  const removeBranch = (id: string) => {
    setCompany((prev) => ({
      ...prev,
      branches: (prev.branches || []).filter((b) => b.id !== id)
    }));
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
        <p className="text-sm font-semibold text-gray-600">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up font-outfit pb-24 sm:pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">Company Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage your company branding, products, services, and branches</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-all shadow-xs cursor-pointer"
          >
            <Eye size={15} />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Profile Completion Banner */}
      {completion < 100 && (
        <div className="rounded-3xl p-4 sm:p-5 border border-amber-200 bg-amber-50/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle size={18} className="text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                Profile {completion}% Complete
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5">
                Complete your details to build trust with applicants and customers
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      )}

      {uploading && (
        <div className="rounded-2xl p-3.5 border border-blue-200 bg-blue-50 flex items-center gap-3 shadow-xs animate-pulse">
          <Loader2 size={18} className="text-blue-600 animate-spin" />
          <span className="text-xs font-semibold text-blue-900">Uploading file... {uploadProgress}%</span>
        </div>
      )}

      {/* ── Moderation status banners ─────────────────────────────────── */}
      {resolvedCompany?.verificationStatus === 'pending' && (
        <div className="rounded-3xl p-4 sm:p-5 border border-amber-200 bg-amber-50/90 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <Clock size={16} className="text-amber-700" />
          </div>
          <div className="text-xs sm:text-sm">
            <p className="font-bold text-amber-950">Under Review — Pending Approval</p>
            <p className="text-amber-800 mt-0.5 text-xs leading-relaxed">
              Your business profile has been submitted and is awaiting admin verification. You can continue updating your details here.
            </p>
          </div>
        </div>
      )}

      {resolvedCompany?.verificationStatus === 'rejected' && (
        <div className="rounded-3xl p-4 sm:p-5 border border-red-200 bg-red-50/90 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <XCircle size={16} className="text-red-700" />
            </div>
            <div className="flex-1 min-w-0 text-xs sm:text-sm">
              <p className="font-bold text-red-950">Profile Requires Revision</p>
              <p className="text-red-800 mt-0.5 text-xs">
                Your business profile requires changes before it can go live.
              </p>
              {resolvedCompany?.rejectionReason && (
                <div className="mt-2 p-3 rounded-2xl bg-white border border-red-200">
                  <span className="text-xs text-red-900 font-bold">Reason: </span>
                  <span className="text-xs text-red-800">{resolvedCompany.rejectionReason}</span>
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-2">
                Update your profile below and click Save — it will be re-submitted for admin review automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {resolvedCompany?.verificationStatus === 'verified' && (
        <div className="rounded-2xl p-3.5 border border-emerald-200 bg-emerald-50/80 flex items-center gap-2.5 shadow-xs">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <p className="text-xs text-emerald-800 font-bold">Your business is verified and live on THENIJOBS.</p>
        </div>
      )}

      {/* Company Website Builder Navigation Tabs (Touch Scrollable) */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
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
              className={`flex items-center gap-1.5 px-3.5 py-2.5 sm:px-4 text-xs font-bold rounded-2xl whitespace-nowrap transition-all shrink-0 cursor-pointer active:scale-95 ${isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-white border border-slate-200'
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
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs">
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
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs">
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
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs">
          <CompanyPortfolioManager
            portfolioProjects={company.portfolioProjects || []}
            planSlug={resolvedCompany?.subscriptionPlan || 'free'}
            onChange={portfolioProjects => setCompany({ ...company, portfolioProjects })}
          />
        </div>
      )}

      {activeTab === 'founder' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs">
          <CompanyFounderManager
            founder={company.founder}
            planSlug={resolvedCompany?.subscriptionPlan || 'free'}
            onChange={founder => setCompany({ ...company, founder })}
          />
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs">
          <CompanyReviewsManager companyId={resolvedCompany?.id || ''} />
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs">
          <CompanySectionToggler
            enabledSections={company.enabledSections || {}}
            planSlug={resolvedCompany?.subscriptionPlan || 'free'}
            onChange={enabledSections => setCompany({ ...company, enabledSections })}
          />
        </div>
      )}

      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
          {/* Main Form Area */}
          <div className="xl:col-span-2 space-y-5 sm:space-y-6">
            {/* Logo & Cover Card */}
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
              {/* Cover Banner Upload */}
              <div
                className="relative h-36 sm:h-48 md:h-56 bg-slate-950 border-b border-gray-100 group cursor-pointer flex items-center justify-center overflow-hidden"
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
                  <div className="text-center text-slate-500 p-4">
                    <Upload size={24} className="mx-auto mb-1.5 opacity-60 text-white" />
                    <span className="text-xs font-semibold text-gray-200 block">Click to Upload Business Banner</span>
                    <span className="text-[10px] text-slate-500">Recommended: 1200 × 400px</span>
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
                  <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/60 backdrop-blur-xs text-white text-xs font-bold transition-all shadow-md">
                    <Upload size={14} /> Change Cover Banner
                  </button>
                </div>
              </div>

              {/* Logo Upload & Title Details */}
              <div className="p-4 sm:p-6 -mt-10 sm:-mt-12 relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 sm:gap-5 text-center sm:text-left">
                  <div
                    className="relative group cursor-pointer shrink-0"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadLogo}
                    />
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 size={32} className="text-blue-600" />
                      )}
                    </div>
                    <button className="absolute inset-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera size={20} className="text-white" />
                    </button>
                  </div>

                  <div className="w-full sm:flex-1 pb-1">
                    <input
                      type="text"
                      placeholder="Enter Business Name *"
                      value={company.name}
                      onChange={(e) => update('name', e.target.value)}
                      className="text-base sm:text-xl font-black text-gray-900 bg-gray-50/60 sm:bg-transparent rounded-xl sm:rounded-none px-3 py-2 sm:p-0 border sm:border-0 border-gray-200 sm:border-b sm:border-transparent hover:border-gray-300 focus:border-blue-600 focus:outline-none w-full text-center sm:text-left"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Leading Spices & Agro Manufacturer in Theni"
                      value={company.tagline}
                      onChange={(e) => update('tagline', e.target.value)}
                      className="text-xs text-gray-500 bg-gray-50/40 sm:bg-transparent rounded-xl sm:rounded-none px-3 py-1.5 sm:p-0 border sm:border-0 border-gray-200 sm:border-b sm:border-transparent hover:border-gray-300 focus:border-blue-600 focus:outline-none w-full mt-1.5 text-center sm:text-left font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* About Company */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> About Business
              </h3>
              <div>
                <textarea
                  rows={5}
                  value={company.description}
                  onChange={(e) => handleDescChange(e.target.value)}
                  placeholder="Describe your company, products, work culture, services, and career opportunities..."
                  className="w-full p-3.5 rounded-2xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none transition-all resize-none leading-relaxed font-medium"
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-[10px] font-bold ${charCount > 900 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {charCount}/1000 characters
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Phone size={16} className="text-blue-600" /> Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Primary Calling Phone *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="+91 93605 19460"
                      value={company.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Official Email *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      placeholder="contact@company.com"
                      value={company.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">WhatsApp Number</label>
                  <div className="relative">
                    <MessageCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input
                      type="tel"
                      placeholder="+91 70948 26886"
                      value={company.whatsapp}
                      onChange={(e) => update('whatsapp', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Company Website URL</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      placeholder="https://www.example.com"
                      value={company.website}
                      onChange={(e) => update('website', e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" /> Location &amp; Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-700 font-bold block mb-1">Full Door Address *</label>
                  <input
                    type="text"
                    placeholder="Door No, Street Name, Area, Landmark, Pincode"
                    value={company.address}
                    onChange={(e) => update('address', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">District / Region *</label>
                  <select
                    value={company.district}
                    onChange={(e) => update('district', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 focus:border-blue-600 outline-none font-medium"
                  >
                    <option value="">Select district</option>
                    {TN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1">Established Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2018"
                    value={company.establishedYear}
                    onChange={(e) => update('establishedYear', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Globe size={16} className="text-blue-600" /> Social Media Links
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1 flex items-center gap-1.5">
                    <Link2 size={13} className="text-blue-600" /> Facebook
                  </label>
                  <input
                    type="url"
                    value={company.facebook}
                    onChange={(e) => update('facebook', e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1 flex items-center gap-1.5">
                    <Heart size={13} className="text-pink-600" /> Instagram
                  </label>
                  <input
                    type="url"
                    value={company.instagram}
                    onChange={(e) => update('instagram', e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1 flex items-center gap-1.5">
                    <LinkedinIcon size={13} className="text-blue-700" /> LinkedIn
                  </label>
                  <input
                    type="url"
                    value={company.linkedin}
                    onChange={(e) => update('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 font-bold block mb-1 flex items-center gap-1.5">
                    <Play size={13} className="text-red-600" /> YouTube
                  </label>
                  <input
                    type="url"
                    value={company.youtube}
                    onChange={(e) => update('youtube', e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm text-gray-900 placeholder:text-slate-500 focus:border-blue-600 outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ImagePlus size={16} className="text-blue-600" /> Photo Gallery
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {company.gallery.map((imgUrl, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center group transition-all cursor-pointer relative overflow-hidden"
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
                      <div className="text-center p-2">
                        <Upload size={18} className="text-gray-400 mx-auto mb-1 group-hover:text-blue-600 transition-colors" />
                        <p className="text-[10px] font-bold text-gray-500">Photo {i + 1}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Branch Locations */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" /> Branch Locations
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBranchForm(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Add Branch
                </button>
              </div>

              <div className="space-y-2.5">
                {company.branches?.map((branch) => (
                  <div
                    key={branch.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{branch.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{branch.address}</p>
                      <span className="inline-block mt-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                        {branch.district}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBranch(branch.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {showBranchForm && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 animate-fade-in">
                    <input
                      type="text"
                      placeholder="Branch name (e.g. Cumbum Branch)"
                      value={newBranch.name}
                      onChange={(e) => setNewBranch((p) => ({ ...p, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    />
                    <input
                      type="text"
                      placeholder="Branch address"
                      value={newBranch.address}
                      onChange={(e) => setNewBranch((p) => ({ ...p, address: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    />
                    <select
                      value={newBranch.district}
                      onChange={(e) => setNewBranch((p) => ({ ...p, district: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 font-medium outline-none focus:border-blue-600"
                    >
                      <option value="">Select district</option>
                      {TN_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addBranch}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
                      >
                        Add Branch
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBranchForm(false)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar — Verification Status */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs sticky top-24 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Shield size={16} className="text-blue-600" /> Verification Status
              </h3>
              <div className="space-y-2.5">
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
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${item.verified
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-500'
                          }`}
                      >
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-bold flex-1">
                        {item.label}
                      </span>
                      {item.verified && (
                        <CheckCircle size={15} className="text-emerald-600" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Trust Score */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600">Trust Score</span>
                  <span className="text-xs font-black text-blue-700">
                    {Math.round(
                      ((Object.values(company.verification).filter(Boolean).length) /
                        Object.keys(company.verification).length) *
                      100
                    )}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                    style={{
                      width: `${((Object.values(company.verification).filter(Boolean).length) /
                          Object.keys(company.verification).length) *
                        100
                        }%`
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Verification status is managed by administrators to ensure platform safety and genuine employer trust.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Action Bar for Mobile View */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 flex items-center gap-2 shadow-lg">
        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="flex-1 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <Eye size={15} /> Preview
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-[2] py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          <span>{saving ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>

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
