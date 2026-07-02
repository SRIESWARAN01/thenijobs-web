'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Camera, Upload, Building2, Phone, Mail, Globe, MapPin,
  Link2, Heart, Briefcase as LinkedinIcon, Play, Plus, Save,
  CheckCircle, AlertCircle, Shield, FileText,
  ImagePlus, Trash2, MessageCircle, Loader2,
  Lock, Sparkles, Crown, Laptop, Tablet, Smartphone, Check, TrendingUp,
  Calendar, Clock, ArrowRight, Award, Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { useUploadFile } from '@/hooks/useStorage';
import { createDocument, getAvailableCompanySlug, updateDocument } from '@/lib/firebase/firestoreService';
import { where } from 'firebase/firestore';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';
import { normalizePlanSlug, selectBestSubscription, getPlanRank } from '@/lib/subscriptions';
import CompanyProfileClient from '@/app/company/[slug]/CompanyProfileClient';
import { useLocations } from '@/hooks/useLocations';
import UpgradePlanDialog from '@/components/portal/UpgradePlanDialog';
import { getCompanyPortfolioPath, normalizeExternalUrl } from '@/lib/companyPortfolio';

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
  district: '',
  state: '',
  establishedYear: '',
  workingHours: '',
  googleMapsLink: '',
  googleMapsEmbedUrl: '',
  facebook: '',
  instagram: '',
  linkedin: '',
  youtube: '',
  twitter: '',
  experience: '',
  gallery: ['', '', '', ''],
  branches: [] as any[],
  team: [] as any[],
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
  gstNumber: '',
  businessRegNumber: '',
  verificationDocUrl: '',
  verificationDocName: '',
  
  // Enterprise Plan Sections
  ceoPhotoUrl: '',
  ceoName: '',
  ceoMessage: '',
  aboutFounder: '',
  companyStory: '',
  vision: '',
  mission: '',
  coreValues: '',
  timeline: [] as any[],
  achievements: '',
  awardsCertificates: [] as string[],
  clients: [] as string[],
  partners: [] as string[],
  careerSectionText: '',
  careerEmail: '',
  csrActivities: '',
  
  // Publish Status
  isPublished: false,
  publishedAt: null as any,
  
  // Advanced SEO settings
  seoKeywords: '',
  canonicalUrl: '',
  socialShareImage: '',
  ogTitle: '',
  ogDescription: '',
  slug: '',
  portfolioPath: '',
  updatedAt: null as any,
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
  const { states, getDistricts, getAreas } = useLocations();
  
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

  const [activeFormTab, setActiveFormTab] = useState<'info' | 'branding' | 'seo' | 'verification' | 'enterprise'>('info');

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop' | 'seo'>('desktop');

  const [company, setCompany] = useState(DEFAULT_COMPANY);
  const [charCount, setCharCount] = useState(0);
  const [newBranch, setNewBranch] = useState({ name: '', address: '', district: '', location: '' });
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', bio: '', photoUrl: '' });
  const [showTeamForm, setShowTeamForm] = useState(false);
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
  const [cropType, setCropType] = useState<'logo' | 'cover' | 'gallery' | 'ceo' | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [galleryCropIndex, setGalleryCropIndex] = useState<number | null>(null);

  // Auto save states and refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Background company profile auto-creation for new business owners
  useEffect(() => {
    if (!companyLoading && user?.uid && companies.length === 0 && !isCreatingDraft) {
      setIsCreatingDraft(true);
      const createDraft = async () => {
        const name = user.displayName || 'My Business';
        const slug = await getAvailableCompanySlug(name);
        const docData = {
          ...DEFAULT_COMPANY,
          ownerId: user.uid,
          name,
          slug,
          portfolioPath: getCompanyPortfolioPath({ slug }),
          verificationStatus: 'pending',
          isActive: false,
          isFeatured: false,
          isPremium: false,
          viewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await createDocument('companies', docData);
      };
      createDraft().catch((err) => {
        console.error('Failed to auto-create company draft:', err);
        setIsCreatingDraft(false);
      });
    }
  }, [companyLoading, user?.uid, user?.displayName, companies.length, isCreatingDraft]);

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

  useEffect(() => {
    if (states.length === 0) return;

    setCompany((current) => {
      const nextState = current.state && states.includes(current.state) ? current.state : states[0];
      const districts = getDistricts(nextState);
      const nextDistrict = current.district && districts.includes(current.district)
        ? current.district
        : (districts[0] || '');
      const areas = getAreas(nextState, nextDistrict);
      const nextLocation = current.location && areas.includes(current.location) ? current.location : '';

      if (
        nextState === current.state &&
        nextDistrict === current.district &&
        nextLocation === current.location
      ) {
        return current;
      }

      return {
        ...current,
        state: nextState,
        district: nextDistrict,
        location: nextLocation,
      };
    });

    setNewBranch((current) => {
      const nextState = company.state && states.includes(company.state) ? company.state : states[0];
      const districts = getDistricts(nextState);
      const nextDistrict = current.district && districts.includes(current.district)
        ? current.district
        : (districts[0] || '');
      const areas = getAreas(nextState, nextDistrict);
      const nextLocation = current.location && areas.includes(current.location) ? current.location : '';
      if (nextDistrict === current.district && nextLocation === current.location) return current;
      return { ...current, district: nextDistrict, location: nextLocation };
    });
  }, [states, getDistricts, getAreas, company.state]);

  const completion = calcCompletion(company);

  const triggerAutoSave = (updatedCompanyData: typeof DEFAULT_COMPANY) => {
    if (!resolvedCompany?.id) return;
    setAutoSaveStatus('saving');
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const docData = {
          name: updatedCompanyData.name,
          slug: updatedCompanyData.slug || '',
          tagline: updatedCompanyData.tagline,
          logoUrl: updatedCompanyData.logoUrl,
          coverUrl: updatedCompanyData.coverUrl,
          description: updatedCompanyData.description,
          phone: updatedCompanyData.phone,
          email: updatedCompanyData.email,
          whatsapp: updatedCompanyData.whatsapp,
          website: normalizeExternalUrl(updatedCompanyData.website),
          address: updatedCompanyData.address,
          location: updatedCompanyData.location,
          district: updatedCompanyData.district,
          state: updatedCompanyData.state || 'Tamil Nadu',
          establishedYear: updatedCompanyData.establishedYear || '',
          workingHours: updatedCompanyData.workingHours || '',
          googleMapsLink: updatedCompanyData.googleMapsLink || '',
          googleMapsEmbedUrl: updatedCompanyData.googleMapsEmbedUrl || '',
          facebook: normalizeExternalUrl(updatedCompanyData.facebook),
          instagram: normalizeExternalUrl(updatedCompanyData.instagram),
          linkedin: normalizeExternalUrl(updatedCompanyData.linkedin),
          youtube: normalizeExternalUrl(updatedCompanyData.youtube),
          twitter: normalizeExternalUrl(updatedCompanyData.twitter),
          experience: updatedCompanyData.experience || '',
          gallery: updatedCompanyData.gallery,
          branches: updatedCompanyData.branches,
          team: updatedCompanyData.team || [],
          customTheme: updatedCompanyData.customTheme || 'classic_blue',
          websiteTemplate: updatedCompanyData.websiteTemplate || 'classic',
          customMetaTitle: updatedCompanyData.customMetaTitle || '',
          customMetaDescription: updatedCompanyData.customMetaDescription || '',
          googleAnalyticsId: updatedCompanyData.googleAnalyticsId || '',
          facebookPixelId: updatedCompanyData.facebookPixelId || '',
          whatsappMessageTemplate: updatedCompanyData.whatsappMessageTemplate || '',
          customCtaLabel: updatedCompanyData.customCtaLabel || '',
          customCtaUrl: updatedCompanyData.customCtaUrl || '',
          hideBranding: updatedCompanyData.hideBranding || false,
          gstNumber: updatedCompanyData.gstNumber || '',
          businessRegNumber: updatedCompanyData.businessRegNumber || '',
          verificationDocUrl: updatedCompanyData.verificationDocUrl || '',
          verificationDocName: updatedCompanyData.verificationDocName || '',
          
          // Enterprise & Founder
          ceoPhotoUrl: updatedCompanyData.ceoPhotoUrl || '',
          ceoName: updatedCompanyData.ceoName || '',
          ceoMessage: updatedCompanyData.ceoMessage || '',
          aboutFounder: updatedCompanyData.aboutFounder || '',
          companyStory: updatedCompanyData.companyStory || '',
          vision: updatedCompanyData.vision || '',
          mission: updatedCompanyData.mission || '',
          coreValues: updatedCompanyData.coreValues || '',
          timeline: updatedCompanyData.timeline || [],
          achievements: updatedCompanyData.achievements || '',
          awardsCertificates: updatedCompanyData.awardsCertificates || [],
          clients: updatedCompanyData.clients || [],
          partners: updatedCompanyData.partners || [],
          careerSectionText: updatedCompanyData.careerSectionText || '',
          careerEmail: updatedCompanyData.careerEmail || '',
          csrActivities: updatedCompanyData.csrActivities || '',
          
          // Publish Status
          isPublished: updatedCompanyData.isPublished || false,
          publishedAt: updatedCompanyData.publishedAt || null,
          
          // Advanced SEO settings
          seoKeywords: updatedCompanyData.seoKeywords || '',
          canonicalUrl: updatedCompanyData.canonicalUrl || '',
          socialShareImage: updatedCompanyData.socialShareImage || '',
          ogTitle: updatedCompanyData.ogTitle || '',
          ogDescription: updatedCompanyData.ogDescription || '',

          updatedAt: new Date()
        };
        await updateDocument('companies', resolvedCompany.id, docData);
        setAutoSaveStatus('saved');
        setTimeout(() => {
          setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 2000);
      } catch (err) {
        console.error('Background auto-save failed:', err);
        setAutoSaveStatus('error');
      }
    }, 1500);
  };

  const update = (key: string, value: any) => {
    setCompany((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && (!prev.slug || prev.slug === (prev.name ? prev.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : ''))) {
        next.slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
      triggerAutoSave(next);
      return next;
    });
  };

  const handleDescChange = (value: string) => {
    if (value.length <= 1000) {
      setCompany((prev) => {
        const next = { ...prev, description: value };
        triggerAutoSave(next);
        return next;
      });
      setCharCount(value.length);
    }
  };

  const addBranch = () => {
    if (newBranch.name && newBranch.address && newBranch.location) {
      setCompany((prev) => {
        const next = {
          ...prev,
          branches: [...(prev.branches || []), { id: Date.now().toString(), ...newBranch }],
        };
        triggerAutoSave(next);
        return next;
      });
      setNewBranch({ name: '', address: '', district: company.district, location: '' });
      setShowBranchForm(false);
    }
  };

  const removeBranch = (id: string) => {
    setCompany((prev) => {
      const next = {
        ...prev,
        branches: (prev.branches || []).filter((b) => b.id !== id),
      };
      triggerAutoSave(next);
      return next;
    });
  };

  const addTeamMember = () => {
    if (newMember.name && newMember.role) {
      setCompany((prev) => {
        const next = {
          ...prev,
          team: [...(prev.team || []), { id: Date.now().toString(), ...newMember }],
        };
        triggerAutoSave(next);
        return next;
      });
      setNewMember({ name: '', role: '', bio: '', photoUrl: '' });
      setShowTeamForm(false);
    } else {
      alert('Please fill in at least Name and Role for the team member.');
    }
  };

  const removeTeamMember = (id: string) => {
    setCompany((prev) => {
      const next = {
        ...prev,
        team: (prev.team || []).filter((m: any) => m.id !== id),
      };
      triggerAutoSave(next);
      return next;
    });
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

  const handleUploadCeoPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropType('ceo');
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
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    setSaving(true);
    try {
      const slug = await getAvailableCompanySlug(company.slug || company.name, resolvedCompany?.id);
      const docData = {
        name: company.name,
        tagline: company.tagline,
        logoUrl: company.logoUrl,
        coverUrl: company.coverUrl,
        description: company.description,
        phone: company.phone,
        email: company.email,
        whatsapp: company.whatsapp,
        website: normalizeExternalUrl(company.website),
        address: company.address,
        location: company.location,
        district: company.district,
        state: company.state,
        slug,
        portfolioPath: getCompanyPortfolioPath({ slug }),
        facebook: normalizeExternalUrl(company.facebook),
        instagram: normalizeExternalUrl(company.instagram),
        linkedin: normalizeExternalUrl(company.linkedin),
        youtube: normalizeExternalUrl(company.youtube),
        twitter: normalizeExternalUrl(company.twitter),
        experience: company.experience || '',
        gallery: company.gallery,
        branches: company.branches,
        team: company.team || [],
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
        gstNumber: company.gstNumber || '',
        businessRegNumber: company.businessRegNumber || '',
        verificationDocUrl: company.verificationDocUrl || '',
        verificationDocName: company.verificationDocName || '',
        
        // Enterprise & Founder
        ceoPhotoUrl: company.ceoPhotoUrl || '',
        ceoName: company.ceoName || '',
        ceoMessage: company.ceoMessage || '',
        aboutFounder: company.aboutFounder || '',
        companyStory: company.companyStory || '',
        vision: company.vision || '',
        mission: company.mission || '',
        coreValues: company.coreValues || '',
        timeline: company.timeline || [],
        achievements: company.achievements || '',
        awardsCertificates: company.awardsCertificates || [],
        clients: company.clients || [],
        partners: company.partners || [],
        careerSectionText: company.careerSectionText || '',
        careerEmail: company.careerEmail || '',
        csrActivities: company.csrActivities || '',
        
        // Publish Status
        isPublished: company.isPublished || false,
        publishedAt: company.publishedAt || null,
        
        // Advanced SEO settings
        seoKeywords: company.seoKeywords || '',
        canonicalUrl: company.canonicalUrl || '',
        socialShareImage: company.socialShareImage || '',
        ogTitle: company.ogTitle || '',
        ogDescription: company.ogDescription || '',

        updatedAt: new Date()
      };

      if (resolvedCompany?.id) {
        await updateDocument('companies', resolvedCompany.id, docData);
        setCompany((current) => ({ ...current, slug, portfolioPath: getCompanyPortfolioPath({ slug }) }));
        alert('Company profile updated successfully!');
      } else {
        const companyId = await createDocument('companies', {
          ...docData,
          ownerId: user?.uid,
          verificationStatus: 'pending',
          isActive: false,
          isFeatured: false,
          isPremium: false,
          viewCount: 0
        });
        setCompany((current) => ({ ...current, id: companyId, slug, portfolioPath: getCompanyPortfolioPath({ slug }) } as any));
        alert('Company profile created successfully! It is currently pending admin approval.');
      }
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to save company profile.');
      setAutoSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!company.name) {
      alert('Please fill in the Company Name.');
      return;
    }
    setSaving(true);
    try {
      const slug = await getAvailableCompanySlug(company.slug || company.name, resolvedCompany?.id);
      const updatedCompanyData = {
        ...company,
        slug,
        portfolioPath: getCompanyPortfolioPath({ slug }),
        isPublished: true,
        publishedAt: new Date(),
      };
      setCompany(updatedCompanyData);

      const docData = {
        name: updatedCompanyData.name,
        slug: updatedCompanyData.slug || '',
        tagline: updatedCompanyData.tagline,
        logoUrl: updatedCompanyData.logoUrl,
        coverUrl: updatedCompanyData.coverUrl,
        description: updatedCompanyData.description,
        phone: updatedCompanyData.phone,
        email: updatedCompanyData.email,
        whatsapp: updatedCompanyData.whatsapp,
        website: normalizeExternalUrl(updatedCompanyData.website),
        address: updatedCompanyData.address,
        location: updatedCompanyData.location,
        district: updatedCompanyData.district,
        state: updatedCompanyData.state,
        portfolioPath: getCompanyPortfolioPath({ slug }),
        facebook: normalizeExternalUrl(updatedCompanyData.facebook),
        instagram: normalizeExternalUrl(updatedCompanyData.instagram),
        linkedin: normalizeExternalUrl(updatedCompanyData.linkedin),
        youtube: normalizeExternalUrl(updatedCompanyData.youtube),
        twitter: normalizeExternalUrl(updatedCompanyData.twitter),
        experience: updatedCompanyData.experience || '',
        gallery: updatedCompanyData.gallery,
        branches: updatedCompanyData.branches,
        team: updatedCompanyData.team || [],
        verification: updatedCompanyData.verification,
        customTheme: updatedCompanyData.customTheme || 'classic_blue',
        websiteTemplate: updatedCompanyData.websiteTemplate || 'classic',
        customMetaTitle: updatedCompanyData.customMetaTitle || '',
        customMetaDescription: updatedCompanyData.customMetaDescription || '',
        googleAnalyticsId: updatedCompanyData.googleAnalyticsId || '',
        facebookPixelId: updatedCompanyData.facebookPixelId || '',
        whatsappMessageTemplate: updatedCompanyData.whatsappMessageTemplate || '',
        customCtaLabel: updatedCompanyData.customCtaLabel || '',
        customCtaUrl: updatedCompanyData.customCtaUrl || '',
        hideBranding: updatedCompanyData.hideBranding || false,
        gstNumber: updatedCompanyData.gstNumber || '',
        businessRegNumber: updatedCompanyData.businessRegNumber || '',
        verificationDocUrl: updatedCompanyData.verificationDocUrl || '',
        verificationDocName: updatedCompanyData.verificationDocName || '',
        
        // Enterprise & Founder
        ceoPhotoUrl: updatedCompanyData.ceoPhotoUrl || '',
        ceoName: updatedCompanyData.ceoName || '',
        ceoMessage: updatedCompanyData.ceoMessage || '',
        aboutFounder: updatedCompanyData.aboutFounder || '',
        companyStory: updatedCompanyData.companyStory || '',
        vision: updatedCompanyData.vision || '',
        mission: updatedCompanyData.mission || '',
        coreValues: updatedCompanyData.coreValues || '',
        timeline: updatedCompanyData.timeline || [],
        achievements: updatedCompanyData.achievements || '',
        awardsCertificates: updatedCompanyData.awardsCertificates || [],
        clients: updatedCompanyData.clients || [],
        partners: updatedCompanyData.partners || [],
        careerSectionText: updatedCompanyData.careerSectionText || '',
        careerEmail: updatedCompanyData.careerEmail || '',
        csrActivities: updatedCompanyData.csrActivities || '',
        
        // Publish Status
        isPublished: true,
        publishedAt: new Date(),
        
        // Advanced SEO settings
        seoKeywords: updatedCompanyData.seoKeywords || '',
        canonicalUrl: updatedCompanyData.canonicalUrl || '',
        socialShareImage: updatedCompanyData.socialShareImage || '',
        ogTitle: updatedCompanyData.ogTitle || '',
        ogDescription: updatedCompanyData.ogDescription || '',

        updatedAt: new Date()
      };

      if (resolvedCompany?.id) {
        await updateDocument('companies', resolvedCompany.id, docData);
        alert('Your Business Portfolio has been successfully published! It is now live.');
      } else {
        alert('Failed to publish. Please check if your profile basic details are filled.');
      }
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to publish company profile.');
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
      <div className="flex justify-between items-center flex-wrap gap-4 p-6 bg-slate-900/40 border border-white/5 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white font-outfit">Company Profile</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              company.isPublished 
                ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-400' 
                : 'bg-white/5 border border-white/10 text-gray-400'
            }`}>
              {company.isPublished ? '✓ Published' : 'Draft'}
            </span>
            {company.isPublished && company.slug && (
              <a
                href={getCompanyPortfolioPath(company)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 font-bold hover:underline ml-2"
              >
                View Live Page ↗
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your company information, dynamic design templates, and SEO mapping.
          </p>
          {company.updatedAt && (
            <p className="text-[10px] text-gray-500">
              Last Saved: {new Date(company.updatedAt.seconds ? company.updatedAt.seconds * 1000 : company.updatedAt).toLocaleString('en-IN')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {autoSaveStatus !== 'idle' && (
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              autoSaveStatus === 'saving' 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                : autoSaveStatus === 'saved' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {autoSaveStatus === 'saving' && <Loader2 size={12} className="animate-spin" />}
              {autoSaveStatus === 'saving' ? 'Saving changes...' : autoSaveStatus === 'saved' ? 'Saved Successfully' : 'Save Error'}
            </div>
          )}
          
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-bold text-gray-300 transition-colors cursor-pointer"
          >
            <Globe size={14} /> Preview Website
          </button>
          
          <button
            onClick={handlePublish}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-550 text-xs font-bold text-white shadow-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            <CheckCircle size={14} /> {saving ? 'Publishing...' : 'Publish Website'}
          </button>
        </div>
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
          { id: 'verification', label: 'Verification Docs', Icon: Shield },
          { id: 'enterprise', label: 'Corporate & Leadership', Icon: Crown },
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
                    placeholder="https://company.com"
                    value={company.website}
                    onChange={(e) => update('website', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Established Year</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="e.g. 2018"
                    value={company.establishedYear || ''}
                    onChange={(e) => update('establishedYear', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Experience (Years)</label>
                <div className="relative">
                  <Award size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="e.g. 5+ Years"
                    value={company.experience || ''}
                    onChange={(e) => update('experience', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Working Hours</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM - 6:00 PM"
                    value={company.workingHours || ''}
                    onChange={(e) => update('workingHours', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Google Maps Link</label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    value={company.googleMapsLink || ''}
                    onChange={(e) => update('googleMapsLink', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5">Google Maps Embed URL (Optional)</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    value={company.googleMapsEmbedUrl || ''}
                    onChange={(e) => update('googleMapsEmbedUrl', e.target.value)}
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
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">State *</label>
                  <select
                    value={company.state || 'Tamil Nadu'}
                    onChange={(e) => {
                      update('state', e.target.value);
                      const dists = getDistricts(e.target.value);
                      const defaultDist = dists[0] || '';
                      update('district', defaultDist);
                      const areas = getAreas(e.target.value, defaultDist);
                      update('location', areas[0] || '');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all cursor-pointer"
                  >
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">District *</label>
                  <select
                    value={company.district}
                    onChange={(e) => {
                      update('district', e.target.value);
                      const areas = getAreas(company.state || 'Tamil Nadu', e.target.value);
                      update('location', areas[0] || '');
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select district</option>
                    {getDistricts(company.state || 'Tamil Nadu').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1.5">Area / Village *</label>
                  <select
                    value={company.location}
                    onChange={(e) => update('location', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select area</option>
                    {getAreas(company.state || 'Tamil Nadu', company.district).map(a => <option key={a} value={a}>{a}</option>)}
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
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-1.5 flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400">𝕏</span> Twitter / X
                </label>
                <input
                  type="url"
                  value={company.twitter || ''}
                  onChange={(e) => update('twitter', e.target.value)}
                  placeholder="https://twitter.com/..."
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select
                      value={newBranch.district}
                      onChange={(e) => {
                        const areas = getAreas(company.state || states[0] || '', e.target.value);
                        setNewBranch((p) => ({
                          ...p,
                          district: e.target.value,
                          location: areas[0] || '',
                        }));
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                    >
                      <option value="">Select district</option>
                      {getDistricts(company.state || states[0] || '').map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                    <select
                      value={newBranch.location}
                      onChange={(e) => setNewBranch((p) => ({ ...p, location: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:border-cyan-500/40 outline-none transition-all"
                    >
                      <option value="">Select area</option>
                      {getAreas(company.state || states[0] || '', newBranch.district).map((area) => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>
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

          {/* Management & Team Members */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users size={16} className="text-cyan-400" />
                Management & Team Members
              </h3>
              <button
                type="button"
                onClick={() => setShowTeamForm(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer bg-transparent border-0"
              >
                <Plus size={14} /> Add Team Member
              </button>
            </div>
            
            <div className="space-y-3">
              {(company.team || []).length === 0 ? (
                <p className="text-xs text-gray-500 italic">No team members added yet. Default team members will show on your profile unless custom members are added.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(company.team || []).map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 border border-white/10 text-cyan-400 font-bold text-sm">
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{member.name}</p>
                          <p className="text-xs text-cyan-400 font-medium">{member.role}</p>
                          {member.bio && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{member.bio}</p>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTeamMember(member.id)}
                        className="p-2 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-transparent border-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showTeamForm && (
                <div className="p-4 rounded-xl bg-white/[0.04] border border-cyan-500/20 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium block mb-1">Member Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. S. Eswaran"
                        value={newMember.name}
                        onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder:text-gray-650 focus:border-cyan-500/40 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-medium block mb-1">Role / Designation *</label>
                      <input
                        type="text"
                        placeholder="e.g. Chief Executive Officer"
                        value={newMember.role}
                        onChange={(e) => setNewMember((p) => ({ ...p, role: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder:text-gray-650 focus:border-cyan-500/40 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium block mb-1">Short Biography (Optional)</label>
                    <textarea
                      placeholder="e.g. 12+ years experience in operations and strategy."
                      rows={2}
                      value={newMember.bio}
                      onChange={(e) => setNewMember((p) => ({ ...p, bio: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder:text-gray-655 focus:border-cyan-500/40 outline-none transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-medium block mb-1">Photo URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/photo.png"
                      value={newMember.photoUrl}
                      onChange={(e) => setNewMember((p) => ({ ...p, photoUrl: e.target.value }))}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-sm text-white placeholder:text-gray-655 focus:border-cyan-500/40 outline-none transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addTeamMember}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer border-0"
                    >
                      Add Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTeamForm(false)}
                      className="px-4 py-2 rounded-xl bg-white/[0.06] text-gray-400 text-xs font-medium hover:text-white transition-colors cursor-pointer border-0"
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
                    { id: 'royal_purple', label: 'Royal Purple', desc: 'Creative violet & pink gradient', tier: 'basic', bg: 'bg-[#0f0720]', border: 'border-purple-500/30' },                    { id: 'sunset_amber', label: 'Sunset Amber (Premium)', desc: 'Amber glow effect', tier: 'premium', bg: 'bg-[#150a02]', border: 'border-amber-500/30' },
                    { id: 'royal_gold', label: 'Royal Gold (Premium)', desc: 'Prestigious yellow-gold details', tier: 'premium', bg: 'bg-[#0d0a02]', border: 'border-yellow-500/35' },
                  ].map((themeOpt) => {
                    const isLocked = getPlanRank(themeOpt.tier) > getPlanRank(currentPlan);
                    const isSelected = company.customTheme === themeOpt.id;
 
                     return (
                       <div
                         key={themeOpt.id}
                         onClick={() => {
                            if (isLocked) {
                              setIsUpgradeOpen(true);
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
                     const isLocked = getPlanRank(tempOpt.tier) > getPlanRank(currentPlan);
                     const isSelected = company.websiteTemplate === tempOpt.id;
 
                     return (
                       <div
                         key={tempOpt.id}
                         onClick={() => {
                            if (isLocked) {
                              setIsUpgradeOpen(true);
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
                 {getPlanRank(currentPlan) < 1 && (
                   <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-4">
                     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2">
                       <Lock size={18} />
                     </div>
                     <h4 className="text-sm font-bold text-white font-outfit">Custom CTA is a Standard/Premium Feature</h4>
                     <p className="text-[11px] text-gray-400 mt-1 max-w-xs">Upgrade your account to add a custom action button to your public micro-website.</p>
                     <button
                       onClick={() => setIsUpgradeOpen(true)}
                       className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                     >
                       Unlock Feature <Sparkles size={11} />
                     </button>
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
                 {getPlanRank(currentPlan) < 2 && (
                   <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-4">
                     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2">
                       <Lock size={18} />
                     </div>
                     <h4 className="text-sm font-bold text-white font-outfit">White-labeled Branding is a Premium Feature</h4>
                     <p className="text-[11px] text-gray-400 mt-1 max-w-xs">Upgrade to Premium to remove the &quot;Powered by THENIJOBS&quot; badge from your website footer.</p>
                     <button
                       onClick={() => setIsUpgradeOpen(true)}
                       className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                     >
                       Upgrade Plan <Sparkles size={11} />
                     </button>
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
                  {getPlanRank(currentPlan) < 1 && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2">
                        <Lock size={18} />
                      </div>
                      <h4 className="text-sm font-bold text-white font-outfit">SEO customization is a Standard/Premium Feature</h4>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-xs">Upgrade your account to customize the title and description indexed by search engines like Google.</p>
                      <button
                        onClick={() => setIsUpgradeOpen(true)}
                        className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Unlock Feature <Sparkles size={11} />
                      </button>
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe size={16} className="text-cyan-400" />
                    SEO Customization
                  </h3>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
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
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">SEO Meta Keywords</label>
                        <input
                          type="text"
                          placeholder="e.g. biryani, hotel, restaurants in theni, food delivery"
                          value={company.seoKeywords || ''}
                          onChange={(e) => update('seoKeywords', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                        />
                      </div>
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
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">Canonical URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://yourdomain.com"
                          value={company.canonicalUrl || ''}
                          onChange={(e) => update('canonicalUrl', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">Social Share Image URL</label>
                        <input
                          type="url"
                          placeholder="e.g. https://yourdomain.com/social-preview.jpg"
                          value={company.socialShareImage || ''}
                          onChange={(e) => update('socialShareImage', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">Open Graph (Facebook) Title</label>
                        <input
                          type="text"
                          placeholder="Open Graph custom title"
                          value={company.ogTitle || ''}
                          onChange={(e) => update('ogTitle', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">Open Graph (Facebook) Description</label>
                        <input
                          type="text"
                          placeholder="Open Graph custom description"
                          value={company.ogDescription || ''}
                          onChange={(e) => update('ogDescription', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
 
               {/* Marketing Analytics & Pixels */}
               <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                 {getPlanRank(currentPlan) < 2 && (
                   <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-4">
                     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2">
                       <Lock size={18} />
                     </div>
                     <h4 className="text-sm font-bold text-white font-outfit">Marketing integrations are a Premium Feature</h4>
                     <p className="text-[11px] text-gray-400 mt-1 max-w-xs">Upgrade to Premium to track client visits using Facebook Pixel and Google Analytics.</p>
                     <button
                       onClick={() => setIsUpgradeOpen(true)}
                       className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                     >
                       Unlock Feature <Sparkles size={11} />
                     </button>
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
                 {getPlanRank(currentPlan) < 1 && (
                   <div className="absolute inset-0 bg-black/70 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-4">
                     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2">
                       <Lock size={18} />
                     </div>
                     <h4 className="text-sm font-bold text-white font-outfit">WhatsApp template customization is locked</h4>
                     <p className="text-[11px] text-gray-400 mt-1 max-w-xs">Upgrade your account to customize the default message sent when customers click your WhatsApp button.</p>
                     <button
                       onClick={() => setIsUpgradeOpen(true)}
                       className="mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                     >
                       Unlock Feature <Sparkles size={11} />
                     </button>
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
 
            {/* BUSINESS VERIFICATION DOCUMENTS TAB */}
            {activeFormTab === 'verification' && (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-cyan-400" />
                    GST & Registration Details
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1.5">GST Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 33AAAAA1111A1Z1"
                        value={company.gstNumber || ''}
                        onChange={(e) => update('gstNumber', e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1.5">Business Registration Number / PAN</label>
                      <input
                        type="text"
                        placeholder="e.g. AAABC1111A"
                        value={company.businessRegNumber || ''}
                        onChange={(e) => update('businessRegNumber', e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
 
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-cyan-400" />
                    Verification Document Upload
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Upload a scanned image or PDF copy of your registration certificate, GST receipt, incorporation certificate, or license.
                    Our administrators will review the submitted document to verify your business listing.
                  </p>
 
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-gray-300 hover:bg-white/[0.08] hover:text-white cursor-pointer transition-all">
                        <Upload size={14} />
                        Select Verification Document (PDF, Max 3MB)
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !user?.uid) return;

                            if (file.type !== 'application/pdf') {
                              alert('Only PDF documents are allowed.');
                              return;
                            }

                            if (file.size > 3 * 1024 * 1024) {
                              alert('Maximum file size allowed is 3MB.');
                              return;
                            }

                            try {
                              const url = await uploadFile(file, `verification/${resolvedCompany?.id || user.uid}/doc_${Date.now()}`, {
                                allowedTypes: ['application/pdf'],
                                maxSizeBytes: 3 * 1024 * 1024
                              });
                              setCompany(prev => {
                                const next = {
                                  ...prev,
                                  verificationDocUrl: url,
                                  verificationDocName: file.name
                                };
                                triggerAutoSave(next);
                                return next;
                              });
                              alert('Verification document uploaded successfully! Press Save to commit all changes.');
                            } catch (err: any) {
                              console.error(err);
                              alert(err?.message || 'Failed to upload document.');
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {company.verificationDocUrl && (
                        <a
                          href={company.verificationDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1.5"
                        >
                          <CheckCircle size={14} className="text-emerald-400" />
                          View Uploaded Document ({company.verificationDocName || 'File'})
                        </a>
                      )}
                    </div>
                    {!company.verificationDocUrl && (
                      <p className="text-[10px] text-yellow-500/80">No verification document has been uploaded yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ENTREPRENEURSHIP & ENTERPRISE PLAN TAB */}
            {activeFormTab === 'enterprise' && (
              <div className="space-y-6">
                {/* CEO / Founder Profile */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden min-h-[220px]">

                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Crown size={16} className="text-cyan-400" />
                    CEO / Founder Biography & Profile
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="sm:col-span-1 space-y-3">
                      <label className="text-xs text-gray-400 font-medium block">CEO / Founder Photo</label>
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] group flex flex-col items-center justify-center">
                        {company.ceoPhotoUrl ? (
                          <img src={company.ceoPhotoUrl} alt="CEO" className="object-cover w-full h-full" />
                        ) : (
                          <Building2 size={24} className="text-gray-600" />
                        )}
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition-opacity">
                          <Upload size={16} className="text-white" />
                          <span className="text-[10px] text-white font-bold text-center px-1">Upload CEO Photo</span>
                          <input type="file" accept="image/*" onChange={handleUploadCeoPhoto} className="hidden" />
                        </label>
                      </div>
                    </div>
                    <div className="sm:col-span-2 space-y-4">
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">CEO / Founder Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. K. Sivaraj M.B.A."
                          value={company.ceoName || ''}
                          onChange={(e) => update('ceoName', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">CEO / Founder Message</label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Welcome to our corporate page. We believe in providing premium services..."
                          value={company.ceoMessage || ''}
                          onChange={(e) => update('ceoMessage', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs text-gray-400 font-medium block mb-1.5">About the Founder</label>
                    <textarea
                      rows={3}
                      placeholder="Detail the founder's academic milestones, business journey, and values..."
                      value={company.aboutFounder || ''}
                      onChange={(e) => update('aboutFounder', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Company Story & Strategy */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-cyan-400" />
                    Company Story, Vision & Core Values
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1.5">Company Story & History</label>
                      <textarea
                        rows={4}
                        placeholder="Share your business origin story, how it started, milestones and achievements over the years..."
                        value={company.companyStory || ''}
                        onChange={(e) => update('companyStory', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">Our Vision</label>
                        <textarea
                          rows={3}
                          placeholder="Our vision is to revolutionize..."
                          value={company.vision || ''}
                          onChange={(e) => update('vision', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">Our Mission</label>
                        <textarea
                          rows={3}
                          placeholder="Our mission is to deliver high-quality..."
                          value={company.mission || ''}
                          onChange={(e) => update('mission', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1.5">Core Values (Comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Quality, Integrity, Innovation, Customer First"
                        value={company.coreValues || ''}
                        onChange={(e) => update('coreValues', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Milestones / Timeline */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden min-h-[220px]">

                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-400" />
                    Company History Milestones Timeline
                  </h3>
                  <div className="space-y-4">
                    {/* Add Milestone form */}
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                      <p className="text-xs font-bold text-gray-300">Add History Milestone</p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <input
                          id="timeline_year"
                          type="text"
                          placeholder="Year (e.g. 2018)"
                          className="px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                        />
                        <input
                          id="timeline_title"
                          type="text"
                          placeholder="Milestone Title"
                          className="sm:col-span-2 px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                        />
                      </div>
                      <textarea
                        id="timeline_desc"
                        rows={2}
                        placeholder="Brief details about the milestone..."
                        className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const yearInput = document.getElementById('timeline_year') as HTMLInputElement;
                          const titleInput = document.getElementById('timeline_title') as HTMLInputElement;
                          const descInput = document.getElementById('timeline_desc') as HTMLTextAreaElement;
                          if (yearInput?.value && titleInput?.value) {
                            const newEvent = {
                              id: Date.now().toString(),
                              year: yearInput.value.trim(),
                              title: titleInput.value.trim(),
                              description: descInput?.value.trim() || ''
                            };
                            update('timeline', [...(company.timeline || []), newEvent]);
                            yearInput.value = '';
                            titleInput.value = '';
                            if (descInput) descInput.value = '';
                          } else {
                            alert('Please fill out both Year and Title.');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-[10px] font-bold text-white flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus size={10} /> Add Milestone
                      </button>
                    </div>

                    {/* Milestones list */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(company.timeline || []).map((t: any) => (
                        <div key={t.id || t.year} className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/5 rounded-xl gap-4">
                          <div className="text-xs">
                            <span className="font-bold text-cyan-400 font-mono mr-2">[{t.year}]</span>
                            <span className="font-semibold text-white">{t.title}</span>
                            {t.description && <p className="text-[10px] text-gray-500 mt-0.5">{t.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              update('timeline', (company.timeline || []).filter((x: any) => x.id !== t.id));
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Achievements, CSR & Careers Section */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <LinkedinIcon size={16} className="text-cyan-400" />
                    Achievements, CSR & Careers Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-400 font-medium block mb-1.5">Awards, Accreditations & Achievements</label>
                      <textarea
                        rows={2}
                        placeholder="Describe key awards, certifications, or major company achievements..."
                        value={company.achievements || ''}
                        onChange={(e) => update('achievements', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                      />
                    </div>
                    
                    <div className="relative">

                      <label className="text-xs text-gray-400 font-medium block mb-1.5">Corporate Social Responsibility (CSR) Activities</label>
                      <textarea
                        rows={2}
                        placeholder="Detail company charity work, environment protection measures, community welfare, etc..."
                        value={company.csrActivities || ''}
                        onChange={(e) => update('csrActivities', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">Custom Careers Section Introduction Text</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Join our professional family. We offer competitive salaries, health benefits..."
                          value={company.careerSectionText || ''}
                          onChange={(e) => update('careerSectionText', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium block mb-1.5">Careers Contact Email</label>
                        <input
                          type="email"
                          placeholder="e.g. careers@yourcompany.com"
                          value={company.careerEmail || ''}
                          onChange={(e) => update('careerEmail', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/40 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stakeholder Logos: Clients & Partners (URL lists) */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Link2 size={16} className="text-cyan-400" />
                    Corporate Partners & Clients Logotypes
                  </h3>
                  <div className="space-y-4">
                    {/* Add Client / Partner input */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
                        <p className="text-xs font-bold text-gray-300">Add Client Logo (URL Link)</p>
                        <div className="flex gap-2">
                          <input
                            id="new_client_logo"
                            type="text"
                            placeholder="https://example.com/client-logo.png"
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('new_client_logo') as HTMLInputElement;
                              if (input?.value) {
                                update('clients', [...(company.clients || []), input.value.trim()]);
                                input.value = '';
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-[10px] font-bold text-white cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto mt-2">
                          {(company.clients || []).map((url: string, idx: number) => (
                            <div key={idx} className="relative group/logo w-10 h-10 border border-white/10 rounded-lg overflow-hidden bg-white/5">
                              <img src={url} alt="client logo" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => update('clients', (company.clients || []).filter((_: any, i: number) => i !== idx))}
                                className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity text-[8px] font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3 relative overflow-hidden">

                        <p className="text-xs font-bold text-gray-300">Add Partner Logo (URL Link)</p>
                        <div className="flex gap-2">
                          <input
                            id="new_partner_logo"
                            type="text"
                            placeholder="https://example.com/partner-logo.png"
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('new_partner_logo') as HTMLInputElement;
                              if (input?.value) {
                                update('partners', [...(company.partners || []), input.value.trim()]);
                                input.value = '';
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-[10px] font-bold text-white cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex gap-2 flex-wrap max-h-24 overflow-y-auto mt-2">
                          {(company.partners || []).map((url: string, idx: number) => (
                            <div key={idx} className="relative group/logo w-10 h-10 border border-white/10 rounded-lg overflow-hidden bg-white/5">
                              <img src={url} alt="partner logo" className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => update('partners', (company.partners || []).filter((_: any, i: number) => i !== idx))}
                                className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity text-[8px] font-bold cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
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

          {/* Sidebar — Verification Status & Upgrades */}
          <div className="xl:col-span-1 font-outfit space-y-6 sticky top-24">
            {/* Subscription / Plan Upgrade Card */}
            <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#0c051a] via-[#12082b] to-[#180a3a] p-6 shadow-[0_8px_32px_rgba(139,92,246,0.15)] flex flex-col gap-4">
              {/* Decorative Glow */}
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl" />
              
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 shrink-0">
                  <Crown size={20} />
                </div>
                <div>
                  <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider block">Current Plan</span>
                  <span className="text-base font-black text-white capitalize">{currentPlan} Plan</span>
                </div>
              </div>

              {currentPlan === 'free' ? (
                <>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    You are currently using the limited Free Profile. Unlock advanced branding, custom designs, SEO keywords, and click tracking.
                  </p>
                  <div className="space-y-2 mt-1">
                    {[
                      'Add custom Action Buttons (CTA)',
                      'Choose premium design themes & templates',
                      'SEO Customization for Google Search',
                      'Remove THENIJOBS branding badge'
                    ].map((feat) => (
                      <div key={feat} className="flex items-center gap-2 text-xs text-gray-300">
                        <Check size={12} className="text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setIsUpgradeOpen(true)}
                    className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-950/40 hover:shadow-violet-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Upgrade Profile <Sparkles size={13} />
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Thank you for supporting THENIJOBS! You have unlocked premium branding and advanced features.
                  </p>
                  {currentPlan !== 'enterprise' && (
                    <button
                      onClick={() => setIsUpgradeOpen(true)}
                      className="w-full mt-2 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Upgrade Plan <ArrowRight size={13} />
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="glass-card rounded-2xl p-6">
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

      {/* Live Responsive Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-fade-in font-outfit">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/90 backdrop-blur-md">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Globe size={18} className="text-cyan-400" />
                Live Breakpoint Preview: <span className="text-cyan-400 capitalize">{company.name || 'Your Company'}</span>
              </h2>
              <p className="text-[10px] text-gray-400">See how your website templates render across devices and search engines.</p>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2 bg-slate-950/50 p-1 border border-white/10 rounded-2xl">
              {[
                { mode: 'desktop', Icon: Laptop, label: 'Desktop (100%)' },
                { mode: 'tablet', Icon: Tablet, label: 'Tablet (768px)' },
                { mode: 'mobile', Icon: Smartphone, label: 'Mobile (375px)' },
                { mode: 'seo', Icon: Globe, label: 'Google Search & Social' }
              ].map((item) => {
                const Icon = item.Icon;
                const active = previewMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    onClick={() => setPreviewMode(item.mode as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={item.label}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{item.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsPreviewOpen(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center items-start bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/15 via-slate-950 to-slate-950">
            {previewMode === 'seo' ? (
              <div className="w-full max-w-2xl space-y-6 animate-fade-in-up">
                {/* Google Search Mockup */}
                <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/30">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-4">Google Search Result Snippet</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px] font-bold">Ad</span>
                      <span>https://thenijobs.com › company › {company.slug || 'slug'}</span>
                    </div>
                    <h3 className="text-xl text-blue-400 hover:underline cursor-pointer font-medium leading-tight">
                      {company.customMetaTitle || company.name || 'Company Name | Theni Jobs'}
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed font-sans mt-1">
                      {company.customMetaDescription || company.description || 'Discover company updates, open jobs, founder stories, and portfolios on Theni Jobs.'}
                    </p>
                  </div>
                </div>

                {/* Social Card Mockup */}
                <div className="glass-card rounded-2xl p-6 border border-white/5 bg-slate-900/30">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-4">Facebook & Social Feed Preview</span>
                  <div className="max-w-md border border-white/10 rounded-2xl overflow-hidden bg-slate-950/80">
                    <div className="aspect-[1.91/1] w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                      {company.socialShareImage || company.coverUrl || company.logoUrl ? (
                        <img 
                          src={company.socialShareImage || company.coverUrl || company.logoUrl} 
                          alt="Social share" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-gray-600">
                          <ImagePlus size={36} />
                          <span className="text-[10px] mt-2 font-bold uppercase">No Custom Social Preview Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 bg-slate-900/60 space-y-1">
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider block font-bold font-mono">thenijobs.com</span>
                      <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">
                        {company.ogTitle || company.customMetaTitle || company.name || 'Company Title'}
                      </h4>
                      <p className="text-[10px] text-gray-400 leading-normal line-clamp-2">
                        {company.ogDescription || company.customMetaDescription || company.description || 'Description details...'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className={`transition-all duration-300 ease-out bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col ${
                  previewMode === 'mobile' 
                    ? 'w-[375px] h-[750px] border-[10px] border-slate-800 rounded-[36px] ring-2 ring-white/10' 
                    : previewMode === 'tablet' 
                    ? 'w-[768px] h-[950px] border-[10px] border-slate-800 rounded-[36px] ring-2 ring-white/10' 
                    : 'w-full min-h-[90vh] border border-white/10 rounded-2xl'
                }`}
              >
                {/* Device Status Bar Mockup */}
                {(previewMode === 'mobile' || previewMode === 'tablet') && (
                  <div className="h-6 bg-slate-900 flex justify-between items-center px-6 text-[10px] text-gray-400 font-mono flex-shrink-0">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span>5G</span>
                      <div className="w-5 h-2.5 border border-gray-400/50 rounded-sm p-px flex items-center">
                        <div className="w-full h-full bg-gray-400 rounded-2xs" />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Page content scrollable inside device mockup */}
                <div className="flex-1 overflow-y-auto">
                  <CompanyProfileClient 
                    company={company} 
                    jobs={[]} 
                    reviews={[]} 
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

       <UpgradePlanDialog
         open={isUpgradeOpen}
         onOpenChange={setIsUpgradeOpen}
         currentPlan={currentPlan as any}
         audience="employer"
         companyId={resolvedCompany?.id}
         userName={user?.displayName}
         userEmail={user?.email}
         userPhone={user?.phone}
       />

       <ImageCropperModal
         open={showCropper}
         onClose={() => {
           setShowCropper(false);
           setCropFile(null);
           setCropType(null);
           setGalleryCropIndex(null);
         }}
         file={cropFile}
         aspectRatio={cropType === 'logo' || cropType === 'ceo' ? 1 : cropType === 'cover' ? 4 : 4/3}
         cropWidth={cropType === 'logo' || cropType === 'ceo' ? 400 : cropType === 'cover' ? 1200 : 800}
         cropHeight={cropType === 'logo' || cropType === 'ceo' ? 400 : cropType === 'cover' ? 300 : 600}
         isCircular={cropType === 'logo' || cropType === 'ceo'}
         title={
           cropType === 'logo'
             ? 'Crop Company Logo'
             : cropType === 'cover'
             ? 'Crop Cover Banner'
             : cropType === 'ceo'
             ? 'Crop CEO/Founder Photo'
             : 'Crop Gallery Image'
         }
         uploadPath={user?.uid && cropType ? (cropType === 'logo' ? `companies/${user.uid}/logo_${Date.now()}` : cropType === 'cover' ? `companies/${user.uid}/cover_${Date.now()}` : cropType === 'ceo' ? `companies/${user.uid}/ceo_${Date.now()}` : `companies/${user.uid}/gallery_${galleryCropIndex}_${Date.now()}`) : undefined}
         onUploadComplete={async (url) => {
           try {
             const nextCompany = { ...company };
             if (cropType === 'logo') {
               nextCompany.logoUrl = url;
             } else if (cropType === 'cover') {
               nextCompany.coverUrl = url;
             } else if (cropType === 'ceo') {
               nextCompany.ceoPhotoUrl = url;
             } else if (cropType === 'gallery' && galleryCropIndex !== null) {
               const newGallery = [...company.gallery];
               newGallery[newGallery.length > galleryCropIndex ? galleryCropIndex : 0] = url;
               nextCompany.gallery = newGallery;
             }
             
             // Set local state
             setCompany(nextCompany);
 
             // Persist immediately to Firestore!
             if (resolvedCompany?.id) {
               setAutoSaveStatus('saving');
               await updateDocument('companies', resolvedCompany.id, {
                 logoUrl: nextCompany.logoUrl,
                 coverUrl: nextCompany.coverUrl,
                 ceoPhotoUrl: nextCompany.ceoPhotoUrl,
                 gallery: nextCompany.gallery,
                 updatedAt: new Date()
               });
               setAutoSaveStatus('saved');
               setTimeout(() => setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
             }
           } catch (err) {
             console.error(err);
             setAutoSaveStatus('error');
           } finally {
             setGalleryCropIndex(null);
           }
         }}
       />
    </div>
  );
}
