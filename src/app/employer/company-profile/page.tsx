'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Camera, Upload, Building2, Phone, Mail, Globe, MapPin,
  Link2, Heart, Briefcase as LinkedinIcon, Play, Plus, Save,
  CheckCircle, AlertCircle, Shield, FileText,
  ImagePlus, Trash2, MessageCircle, Loader2,
  Lock, Sparkles
} from 'lucide-react';
import { LAUNCH_DISTRICT, THENI_LAUNCH_LOCATIONS } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useUploadFile } from '@/hooks/useStorage';
import { createDocument, updateDocument } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { normalizePlanSlug, selectBestSubscription } from '@/lib/subscriptions';

const DEFAULT_COMPANY = {
  name: '',
  tagline: '',
  logoUrl: '',
  coverUrl: '',
  description: '',
  phone: '',
  email: '',
  whatsapp: '',
  website: '',
  address: '',
  location: '',
  district: LAUNCH_DISTRICT,
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  gallery: ['', '', '', ''],
  branches: [] as any[],
  verification: {
    email: false,
    gst: false,
    business: false,
  },
  customTheme: 'classic_blue',
  websiteTemplate: 'classic',
  customMetaTitle: '',
  customMetaDescription: '',
  googleAnalyticsId: '',
  facebookPixelId: '',
  whatsappMessageTemplate: '',
  customCtaLabel: '',
  customCtaUrl: '',
  hideBranding: false,
};

function calcCompletion(data: typeof DEFAULT_COMPANY): number {
  const fields = [
    data.name, data.description, data.phone, data.email,
    data.address, data.location, data.district, data.logoUrl, data.coverUrl,
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

  // Fetch subscriptions
  const { data: subscriptions } = useCollection<any>('subscriptions', [
    where('companyId', '==', resolvedCompany?.id || '')
  ], { skip: !resolvedCompany?.id });

  const activeSubscription = selectBestSubscription(subscriptions);
  const currentPlan = normalizePlanSlug(activeSubscription?.plan || resolvedCompany?.subscriptionPlan || (resolvedCompany?.isPremium ? 'premium' : 'free'));

  const [activeFormTab, setActiveFormTab] = useState<'info' | 'branding' | 'seo'>('info');

  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [charCount, setCharCount] = useState(0);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', district: LAUNCH_DISTRICT, location: '' });
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();

  // Cropper states
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropType, setCropType] = useState<'logo' | 'cover' | 'gallery' | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [galleryCropIndex, setGalleryCropIndex] = useState<number | null>(null);

  useEffect(() => {
    if (resolvedCompany) {
      setCompany({
        ...DEFAULT_COMPANY,
        ...resolvedCompany,
        gallery: resolvedCompany.gallery || DEFAULT_COMPANY.gallery,
        branches: resolvedCompany.branches || DEFAULT_COMPANY.branches,
        verification: {
          email: resolvedCompany.verification?.email || false,
          gst: resolvedCompany.verification?.gst || false,
          business: resolvedCompany.verification?.business || false,
        },
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
    if (newBranch.name && newBranch.address && newBranch.location) {
      setCompany((prev) => ({
        ...prev,
        branches: [...(prev.branches || []), { id: Date.now().toString(), ...newBranch }],
      }));
      setNewBranch({ name: '', address: '', district: LAUNCH_DISTRICT, location: '' });
      setShowBranchForm(false);
    }
  };

  const removeBranch = (id: string) => {
    setCompany((prev) => ({
      ...prev,
      branches: (prev.branches || []).filter((b) => b.id !== id),
    }));
  };

  const handleUploadCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropType('cover');
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropType('logo');
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  const handleUploadGallery = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropType('gallery');
    setGalleryCropIndex(index);
    setShowCropper(true);
    if (e.target) e.target.value = '';
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
    if (!company.address || !company.location) {
      alert('Please fill in Address and Area / Town.');
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
        phone: company.phone,
        email: company.email,
        whatsapp: company.whatsapp,
        website: company.website,
        address: company.address,
        location: company.location,
        district: company.district,
        facebook: company.facebook,
        instagram: company.instagram,
        linkedin: company.linkedin,
        youtube: company.youtube,
        gallery: company.gallery,
        branches: company.branches,
        verification: company.verification,
        customTheme: company.customTheme || 'classic_blue',
        websiteTemplate: company.websiteTemplate || 'classic',
        customMetaTitle: company.customMetaTitle || '',
        customMetaDescription: company.customMetaDescription || '',
        googleAnalyticsId: company.googleAnalyticsId || '',
        facebookPixelId: company.facebookPixelId || '',
        whatsappMessageTemplate: company.whatsappMessageTemplate || '',
        customCtaLabel: company.customCtaLabel || '',
        customCtaUrl: company.customCtaUrl || '',
        hideBranding: company.hideBranding || false,
        updatedAt: new Date()
      };

      if (resolvedCompany?.id) {
        await updateDocument('companies', resolvedCompany.id, docData);
        alert('Company profile updated successfully!');
      } else {
        await createDocument('companies', {
          ...docData,
          ownerId: user?.uid,
          verificationStatus: 'pending',
          isActive: false,
          isFeatured: false,
          isPremium: false,
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
        <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Company Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your company information and branding</p>
      </div>

      {/* Profile Completion Banner */}
      {completion < 100 && (
        <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                Profile {completion}% Complete
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Complete your profile to attract more candidates and build trust
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      )}

      {uploading && (
        <div className="glass-card rounded-2xl p-4 border border-cyan-500/20 bg-cyan-500/5 flex items-center gap-3">
          <Loader2 size={18} className="text-cyan-400 animate-spin" />
          <span className="text-xs text-gray-300">Uploading file... {uploadProgress}%</span>
        </div>
      )}

      {/* Form Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        {[
          { id: 'info', label: 'Basic Info', Icon: Building2 },
          { id: 'branding', label: 'Branding & Design', Icon: Camera },
          { id: 'seo', label: 'SEO & Marketing', Icon: Globe },
        ].map((t) => {
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveFormTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all cursor-pointer ${
                activeFormTab === t.id
                  ? 'border-cyan-500 text-cyan-400 bg-white/[0.02]'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {activeFormTab === 'info' && (
            <>
          {/* Logo & Cover */}
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Cover Banner Upload */}
            <div
              className="relative h-40 bg-gradient-to-r from-cyan-900/30 to-emerald-900/30 border-b border-white/[0.06] group cursor-pointer"
              onClick={() => coverInputRef.current?.click()}
              style={{
                backgroundImage: company.coverUrl ? `url(${company.coverUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadCover}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-sm text-white/70 text-sm font-medium hover:bg-black/60 hover:text-white transition-all">
                  <Upload size={16} />
                  Upload Cover Banner
                </button>
              </div>
              <div className="absolute bottom-2 right-3 text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded">
                Recommended: 1200 × 300px
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
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-cyan-600/30 to-emerald-600/30 border-4 border-[#0d0d20] flex items-center justify-center overflow-hidden">
                    {company.logoUrl ? (
                      <Image src={company.logoUrl} alt="Logo" fill sizes="96px" className="object-cover" />
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
                    className="bg-transparent text-lg font-bold text-white border-b border-transparent hover:border-white/10 focus:border-cyan-500 focus:outline-none w-full pb-1"
                  />
                  <input
                    type="text"
                    placeholder="Company Tagline (e.g. Empowering Local Talent)"
                    value={company.tagline}
                    onChange={(e) => update('tagline', e.target.value)}
                    className="bg-transparent text-xs text-gray-400 border-b border-transparent hover:border-white/10 focus:border-cyan-500 focus:outline-none w-full mt-1 pb-0.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* About Company */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={16} className="text-cyan-400" />
              About Company
            </h3>
            <div>
              <textarea
                rows={6}
                value={company.description}
                onChange={(e) => handleDescChange(e.target.value)}
                placeholder="Describe your company, what you do, your mission, and details candidates would want to know..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 focus:bg-white/[0.06] outline-none transition-all resize-none leading-relaxed"
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
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Phone size={16} className="text-cyan-400" />
              Contact Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Phone *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={company.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={company.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">WhatsApp</label>
                <div className="relative">
                  <MessageCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={company.whatsapp}
                    onChange={(e) => update('whatsapp', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Website</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="url"
                    placeholder="https://www.example.com"
                    value={company.website}
                    onChange={(e) => update('website', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-cyan-400" />
              Location
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Full Address *</label>
                <input
                  type="text"
                  placeholder="Street, Area, Building Details"
                  value={company.address}
                  onChange={(e) => update('address', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">District</label>
                  <input
                    type="text"
                    value={company.district}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-gray-300 outline-none opacity-80"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Area / Town *</label>
                  <select
                    value={company.location}
                    onChange={(e) => update('location', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                  >
                    <option value="">Select area</option>
                    {THENI_LAUNCH_LOCATIONS.map((area) => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" />
              Social Media Links
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Link2 size={12} className="text-blue-400" /> Facebook
                </label>
                <input
                  type="url"
                  value={company.facebook}
                  onChange={(e) => update('facebook', e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Heart size={12} className="text-pink-400" /> Instagram
                </label>
                <input
                  type="url"
                  value={company.instagram}
                  onChange={(e) => update('instagram', e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <LinkedinIcon size={12} className="text-blue-500" /> LinkedIn
                </label>
                <input
                  type="url"
                  value={company.linkedin}
                  onChange={(e) => update('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <Play size={12} className="text-red-400" /> YouTube
                </label>
                <input
                  type="url"
                  value={company.youtube}
                  onChange={(e) => update('youtube', e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ImagePlus size={16} className="text-cyan-400" />
                Gallery
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {company.gallery.map((imgUrl, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center group hover:border-cyan-500/30 transition-all cursor-pointer relative overflow-hidden"
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
                      <Image src={imgUrl} alt={`Gallery ${i}`} fill sizes="(max-width: 640px) 50vw, 160px" className="object-cover" />
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
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
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
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] group"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{branch.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{branch.address}</p>
                    <span className="inline-block mt-1 text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-medium">
                      {branch.location || branch.district}
                    </span>
                  </div>
                  <button
                    onClick={() => removeBranch(branch.id)}
                    className="p-2 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {showBranchForm && (
                <div className="p-4 rounded-xl bg-white/[0.04] border border-cyan-500/20 space-y-3">
                  <input
                    type="text"
                    placeholder="Branch Name (e.g. Cumbum Branch)"
                    value={newBranch.name}
                    onChange={(e) => setNewBranch((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={newBranch.address}
                    onChange={(e) => setNewBranch((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                  <select
                    value={newBranch.location}
                    onChange={(e) => setNewBranch((p) => ({ ...p, location: e.target.value, district: LAUNCH_DISTRICT }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                  >
                    <option value="">Select area</option>
                    {THENI_LAUNCH_LOCATIONS.map((d) => (
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
                      className="px-4 py-2 rounded-xl bg-white/[0.06] text-gray-400 text-sm font-medium hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {/* BRANDING TAB */}
          {activeFormTab === 'branding' && (
            <div className="space-y-6">
              {/* Preset Themes */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Camera size={16} className="text-cyan-400" />
                  Preset Color Themes
                </h3>
                <p className="text-xs text-gray-500 mb-4">Select the primary design language for your public website.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'classic_blue', label: 'Classic Blue', desc: 'Professional corporate blue style', tier: 'free', bg: 'bg-[#0a1128]', border: 'border-blue-500/30' },
                    { id: 'emerald_growth', label: 'Emerald Growth', desc: 'Fresh green growth accent', tier: 'basic', bg: 'bg-[#05160e]', border: 'border-emerald-500/30' },
                    { id: 'royal_purple', label: 'Royal Purple', desc: 'Creative violet & pink gradient', tier: 'basic', bg: 'bg-[#0f0720]', border: 'border-purple-500/30' },
                    { id: 'sunset_amber', label: 'Sunset Amber (Premium)', desc: 'Amber glow effect', tier: 'premium', bg: 'bg-[#150a02]', border: 'border-amber-500/30' },
                    { id: 'royal_gold', label: 'Royal Gold (Premium)', desc: 'Prestigious yellow-gold details', tier: 'premium', bg: 'bg-[#0d0a02]', border: 'border-yellow-500/35' },
                  ].map((themeOpt) => {
                    const isLocked = (themeOpt.tier === 'basic' && currentPlan === 'free') || 
                                     (themeOpt.tier === 'premium' && currentPlan !== 'premium');
                    const isSelected = company.customTheme === themeOpt.id;

                    return (
                      <div
                        key={themeOpt.id}
                        onClick={() => {
                          if (isLocked) {
                            alert(`Please upgrade your subscription plan to unlock the ${themeOpt.label}.`);
                            return;
                          }
                          update('customTheme', themeOpt.id);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${themeOpt.bg} ${
                          isSelected
                            ? 'border-cyan-500 ring-1 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : themeOpt.border
                        } ${isLocked ? 'opacity-50 hover:opacity-60' : 'hover:border-white/20'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-bold text-white block">{themeOpt.label}</span>
                            <span className="text-xs text-gray-400 block mt-1">{themeOpt.desc}</span>
                          </div>
                          {isLocked && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                              <Lock size={10} className="w-3 h-3 text-amber-400" /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Website Templates */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Building2 size={16} className="text-cyan-400" />
                  Website Templates
                </h3>
                <p className="text-xs text-gray-500 mb-4">Choose how your public company page layout is structured.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'classic', label: 'Classic Directory', desc: 'Standard tabbed view of profile and info', tier: 'free' },
                    { id: 'modern', label: 'Modern Portfolio', desc: 'Clean SaaS-like portfolio view with neon accents', tier: 'basic' },
                    { id: 'e_commerce', label: 'E-Commerce Storefront', desc: 'Highlights product catalog grid at the top', tier: 'premium' },
                    { id: 'service_booking', label: 'Service Booking Portal', desc: 'Highlights services lists with booking forms', tier: 'premium' },
                  ].map((tempOpt) => {
                    const isLocked = (tempOpt.tier === 'basic' && currentPlan === 'free') || 
                                     (tempOpt.tier === 'premium' && currentPlan !== 'premium');
                    const isSelected = company.websiteTemplate === tempOpt.id;

                    return (
                      <div
                        key={tempOpt.id}
                        onClick={() => {
                          if (isLocked) {
                            alert(`Please upgrade your subscription plan to unlock the ${tempOpt.label} template.`);
                            return;
                          }
                          update('websiteTemplate', tempOpt.id);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all bg-white/[0.02] ${
                          isSelected
                            ? 'border-cyan-500 ring-1 ring-cyan-500/30'
                            : 'border-white/[0.06]'
                        } ${isLocked ? 'opacity-50 font-medium' : 'hover:border-white/10'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-bold text-white block">{tempOpt.label}</span>
                            <span className="text-xs text-gray-400 block mt-1">{tempOpt.desc}</span>
                          </div>
                          {isLocked && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                              <Lock size={10} className="w-3 h-3 text-amber-400" /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Action (CTA) Button */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                {currentPlan === 'free' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                    <Lock size={24} className="text-amber-400 mb-2" />
                    <h4 className="text-sm font-bold text-white">Custom CTA is a Standard/Premium Feature</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">Upgrade your account to add a custom action button to your public micro-website.</p>
                  </div>
                )}
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe size={16} className="text-cyan-400" />
                  Custom Action Button (CTA)
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1.5">Button Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Book Appointment, Visit Shop"
                      value={company.customCtaLabel || ''}
                      onChange={(e) => update('customCtaLabel', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1.5">Button Link URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={company.customCtaUrl || ''}
                      onChange={(e) => update('customCtaUrl', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Hide Platform Branding */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                {currentPlan !== 'premium' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                    <Lock size={24} className="text-amber-400 mb-2" />
                    <h4 className="text-sm font-bold text-white">White-labeled Branding is a Premium Feature</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">Upgrade to Premium to remove the &quot;Powered by THENIJOBS&quot; badge from your website footer.</p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="hideBranding"
                    checked={company.hideBranding || false}
                    onChange={(e) => update('hideBranding', e.target.checked)}
                    className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.04] text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <label htmlFor="hideBranding" className="text-sm font-semibold text-white cursor-pointer select-none">
                    Hide platform branding footer badge
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SEO & MARKETING TAB */}
          {activeFormTab === 'seo' && (
            <div className="space-y-6">
              {/* Custom SEO Meta Tags */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                {currentPlan === 'free' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                    <Lock size={24} className="text-amber-400 mb-2" />
                    <h4 className="text-sm font-bold text-white">SEO customization is a Standard/Premium Feature</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">Upgrade your account to customize the title and description indexed by search engines like Google.</p>
                  </div>
                )}
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe size={16} className="text-cyan-400" />
                  SEO Customization
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1.5">Meta Title (Indexed by Google)</label>
                    <input
                      type="text"
                      placeholder="e.g. Best Biryani in Theni | Hotel Salem Ananda"
                      value={company.customMetaTitle || ''}
                      onChange={(e) => update('customMetaTitle', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1.5">Meta Description</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Hotel Salem Ananda offers premium traditional Biryani and South Indian foods in Theni district. Visit us or order online."
                      value={company.customMetaDescription || ''}
                      onChange={(e) => update('customMetaDescription', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Marketing Analytics & Pixels */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                {currentPlan !== 'premium' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                    <Lock size={24} className="text-amber-400 mb-2" />
                    <h4 className="text-sm font-bold text-white">Marketing integrations are a Premium Feature</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">Upgrade to Premium to track client visits using Facebook Pixel and Google Analytics.</p>
                  </div>
                )}
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-cyan-400" />
                  Analytics & Ad Tracking
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1.5">Google Analytics Tracking ID</label>
                    <input
                      type="text"
                      placeholder="G-XXXXXXXXXX"
                      value={company.googleAnalyticsId || ''}
                      onChange={(e) => update('googleAnalyticsId', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1.5">Facebook Pixel ID</label>
                    <input
                      type="text"
                      placeholder="123456789012345"
                      value={company.facebookPixelId || ''}
                      onChange={(e) => update('facebookPixelId', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Chat Pre-fill Template */}
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                {currentPlan === 'free' && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                    <Lock size={24} className="text-amber-400 mb-2" />
                    <h4 className="text-sm font-bold text-white">WhatsApp template customization is locked</h4>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">Upgrade your account to customize the default message sent when customers click your WhatsApp button.</p>
                  </div>
                )}
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircle size={16} className="text-cyan-400" />
                  WhatsApp Click-to-Chat Pre-fill Message
                </h3>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Custom Pre-fill Message</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Hello! I visited your website on THENIJOBS and would like to ask about..."
                    value={company.whatsappMessageTemplate || ''}
                    onChange={(e) => update('whatsappMessageTemplate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          )}

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
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Shield size={16} className="text-cyan-400" />
              Verification Status
            </h3>
            <div className="space-y-3">
              {[
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
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.verified ? 'bg-emerald-500/10' : 'bg-white/[0.04]'
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
            <div className="mt-5 pt-4 border-t border-white/[0.06]">
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
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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

      <ImageCropperModal
        open={showCropper}
        onClose={() => {
          setShowCropper(false);
          setCropFile(null);
          setCropType(null);
          setGalleryCropIndex(null);
        }}
        file={cropFile}
        aspectRatio={cropType === 'logo' ? 1 : cropType === 'cover' ? 4 : 4/3}
        cropWidth={cropType === 'logo' ? 400 : cropType === 'cover' ? 1200 : 800}
        cropHeight={cropType === 'logo' ? 400 : cropType === 'cover' ? 300 : 600}
        isCircular={cropType === 'logo'}
        title={
          cropType === 'logo'
            ? 'Crop Company Logo'
            : cropType === 'cover'
            ? 'Crop Cover Banner'
            : 'Crop Gallery Image'
        }
        onCropComplete={async (croppedFile) => {
          try {
            if (!user?.uid) return;
            const uploadPath = cropType === 'logo'
              ? `companies/${user.uid}/logo_${Date.now()}`
              : cropType === 'cover'
              ? `companies/${user.uid}/cover_${Date.now()}`
              : `companies/${user.uid}/gallery_${galleryCropIndex}_${Date.now()}`;
            
            const url = await uploadFile(croppedFile, uploadPath);
            if (cropType === 'logo') {
              update('logoUrl', url);
            } else if (cropType === 'cover') {
              update('coverUrl', url);
            } else if (cropType === 'gallery' && galleryCropIndex !== null) {
              const newGallery = [...company.gallery];
              newGallery[galleryCropIndex] = url;
              update('gallery', newGallery);
            }
          } catch (err) {
            console.error(err);
            alert('Upload failed: ' + (err as Error).message);
          } finally {
            setGalleryCropIndex(null);
          }
        }}
      />
    </div>
  );
}
