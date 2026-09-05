'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Globe, Eye, EyeOff, Save, Sparkles, Monitor, Laptop, Tablet,
  Smartphone, Plus, Trash2, Edit3, Palette, Type, Layout,
  Settings2, ArrowLeft, Loader2, Check, Copy, ExternalLink,
  ChevronDown, ChevronUp, GripVertical, Download, Phone,
  MessageCircle, Mail, MapPin, Briefcase, GraduationCap, Award,
  FolderGit2, ShieldCheck, Share2, Search, QrCode, RefreshCw,
  Sliders, User, CheckCircle2, Lock, Star, Play, Code2
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import type {
  PortfolioSite, PortfolioSection, PortfolioTheme,
  SeekerHeroData, SeekerSkillItem, SeekerExperienceItem,
  SeekerEducationItem, SeekerProjectItem, SeekerCertificationItem,
  TestimonialItem, ContactSectionData
} from '@/lib/types/portfolio';
import { DEFAULT_THEME, FONT_OPTIONS, DEVICE_SIZES } from '@/lib/types/portfolio';
import SeekerPortfolioRenderer from './templates/SeekerPortfolioRenderer';

// Preset Google Sites-style color themes
const THEME_PRESETS = [
  {
    name: 'Emerald Pro',
    primary: '#059669',
    secondary: '#0D9488',
    bg: '#FFFFFF',
    surface: '#F0FDF4',
    text: '#0F172A',
    muted: '#64748B',
  },
  {
    name: 'Royal Blue',
    primary: '#2563EB',
    secondary: '#0284C7',
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    muted: '#64748B',
  },
  {
    name: 'Cyber Slate (Dark)',
    primary: '#38BDF8',
    secondary: '#818CF8',
    bg: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    muted: '#94A3B8',
  },
  {
    name: 'Sunset Coral',
    primary: '#E11D48',
    secondary: '#F97316',
    bg: '#FFFFFF',
    surface: '#FFF1F2',
    text: '#1E293B',
    muted: '#64748B',
  },
  {
    name: 'Deep Violet',
    primary: '#7C3AED',
    secondary: '#C026D3',
    bg: '#FFFFFF',
    surface: '#FAF5FF',
    text: '#1E1B4B',
    muted: '#6B7280',
  },
  {
    name: 'Luxury Amber',
    primary: '#D97706',
    secondary: '#B45309',
    bg: '#FFFFFF',
    surface: '#FFFBEB',
    text: '#1C1917',
    muted: '#78716C',
  },
  {
    name: 'Modern Teal',
    primary: '#0D9488',
    secondary: '#2563EB',
    bg: '#FFFFFF',
    surface: '#F0FDFA',
    text: '#134E4A',
    muted: '#64748B',
  },
  {
    name: 'Clean Minimal',
    primary: '#1E293B',
    secondary: '#475569',
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    muted: '#64748B',
  },
];

type EditorTab = 'blocks' | 'design' | 'seo' | 'publish';

export default function SeekerSiteEditor() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [site, setSite] = useState<PortfolioSite | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('blocks');
  const [activeBlockTab, setActiveBlockTab] = useState<'hero' | 'about' | 'skills' | 'experience' | 'education' | 'projects' | 'certifications' | 'contact'>('hero');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Load or initialize Seeker Portfolio
  useEffect(() => {
    if (!user?.uid) return;

    async function loadSeekerSite() {
      try {
        setLoading(true);
        const qSite = query(
          collection(db, 'portfolioSites'),
          where('ownerId', '==', user?.uid),
          limit(1)
        );
        const snap = await getDocs(qSite);

        if (!snap.empty) {
          const docData = snap.docs[0].data() as PortfolioSite;
          setSite({ ...docData, id: snap.docs[0].id });
        } else {

          // Initialize new Seeker site with profile data
          const profRef = doc(db, 'seekerProfiles', user?.uid || '');
          const profSnap = await getDoc(profRef);
          const prof = profSnap.exists() ? profSnap.data() : {};

          const defaultSlug = (user?.displayName || user?.email?.split('@')[0] || 'seeker')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-');

          const newSite: PortfolioSite = {
            id: `site-${user?.uid}`,
            ownerId: user?.uid || '',
            ownerType: 'seeker',
            templateId: 'seeker-modern-pro',
            status: 'draft',
            visibility: 'public',
            googleIndex: true,
            customUrl: defaultSlug,
            theniJobsId: `TJ-S-${(user?.uid || '').slice(0, 5).toUpperCase()}`,
            planSlug: 'free',
            theme: {
              ...DEFAULT_THEME,
              primaryColor: '#059669',
              secondaryColor: '#0D9488',
              surfaceColor: '#F0FDF4',
              headingFont: 'Poppins',
              fontFamily: 'Inter',
            },
            branding: {
              logo: prof.photoUrl || prof.profilePhotoUrl || '',
              favicon: '/icon.png',
              coverImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80',
              companyName: prof.name || user?.displayName || 'Job Seeker',
              tagline: prof.currentRole || 'Career Professional',
            },
            sections: [
              {
                id: 'sec-hero',
                type: 'hero',
                title: 'Header & Bio Banner',
                visible: true,
                order: 0,
                data: {
                  name: prof.name || user?.displayName || 'Your Name',
                  title: prof.currentRole || 'Your Role / Profession',
                  tagline: prof.careerObjective || 'Dedicated professional striving for excellence.',
                  location: prof.district ? `${prof.district}, Tamil Nadu` : 'Theni, Tamil Nadu',
                  avatarUrl: prof.photoUrl || prof.profilePhotoUrl || '',
                  coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80',
                  isOpenToWork: true,
                  experienceYears: prof.experience?.length ? `${prof.experience.length}+ Years` : 'Fresher / Experienced',
                  joiningAvailability: prof.joiningAvailability || 'Immediate Joiner',
                  whatsapp: prof.phone || '9360519460',
                  phone: prof.phone || '9360519460',
                  email: user?.email || '',
                  resumeUrl: prof.resumeUrl || '',
                } as SeekerHeroData,
              },
              {
                id: 'sec-about',
                type: 'about',
                title: 'About Me',
                visible: true,
                order: 1,
                data: {
                  content: prof.aboutMe || prof.careerObjective || 'Motivated professional with a strong track record of learning and applying skills to deliver exceptional value in modern workplaces.',
                  highlights: [
                    { value: prof.experience?.length ? `${prof.experience.length}+` : '1+', label: 'Years Experience' },
                    { value: prof.skills?.length ? `${prof.skills.length}+` : '5+', label: 'Core Skills' },
                    { value: '100%', label: 'Commitment' },
                    { value: 'Verified', label: 'TheniJobs Profile' },
                  ],
                },
              },
              {
                id: 'sec-skills',
                type: 'skills',
                title: 'Skills & Expertise',
                visible: true,
                order: 2,
                data: {
                  skills: Array.isArray(prof.skills)
                    ? prof.skills.map((s: any, idx: number) => ({
                        id: `skill-${idx}`,
                        name: typeof s === 'string' ? s : s.name,
                        category: 'technical',
                        level: typeof s === 'object' && s.level ? 85 : 80,
                        levelLabel: 'Advanced',
                        verified: true,
                      }))
                    : [
                        { id: 's-1', name: 'Communication & Leadership', category: 'soft', level: 90, levelLabel: 'Expert', verified: true },
                        { id: 's-2', name: 'Problem Solving', category: 'soft', level: 85, levelLabel: 'Advanced', verified: true },
                      ],
                },
              },
              {
                id: 'sec-experience',
                type: 'experience',
                title: 'Work Experience',
                visible: true,
                order: 3,
                data: {
                  experience: Array.isArray(prof.experience) && prof.experience.length > 0
                    ? prof.experience.map((e: any, idx: number) => ({
                        id: `exp-${idx}`,
                        company: e.company || 'Company',
                        role: e.role || 'Role',
                        startDate: e.startDate || '2023',
                        endDate: e.endDate || 'Present',
                        isCurrent: !e.endDate || e.endDate === 'Present',
                        location: e.location || 'Tamil Nadu',
                        description: e.description || '',
                      }))
                    : [],
                },
              },
              {
                id: 'sec-projects',
                type: 'projects',
                title: 'Projects & Portfolio',
                visible: true,
                order: 4,
                data: {
                  projects: [
                    {
                      id: 'p-1',
                      title: 'Professional Showcase Project',
                      category: 'Featured',
                      description: 'Comprehensive project showcasing domain expertise, strategic planning, and successful execution.',
                      techStack: ['Domain Expertise', 'Strategy', 'Execution'],
                      liveUrl: '',
                      githubUrl: '',
                    },
                  ],
                },
              },
              {
                id: 'sec-education',
                type: 'education',
                title: 'Education',
                visible: true,
                order: 5,
                data: {
                  education: Array.isArray(prof.education) && prof.education.length > 0
                    ? prof.education.map((edu: any, idx: number) => ({
                        id: `edu-${idx}`,
                        institution: edu.institution || 'University / College',
                        degree: edu.degree || 'Degree',
                        field: edu.field || '',
                        year: edu.year || '2024',
                        score: edu.percentage ? `${edu.percentage}%` : '',
                      }))
                    : [],
                },
              },
              {
                id: 'sec-certs',
                type: 'certifications',
                title: 'Certifications',
                visible: true,
                order: 6,
                data: {
                  certifications: Array.isArray(prof.certifications) && prof.certifications.length > 0
                    ? prof.certifications.map((c: any, idx: number) => ({
                        id: `cert-${idx}`,
                        name: c.name || 'Certification',
                        issuer: c.organization || 'Issuing Authority',
                        issueDate: c.date || '2024',
                        credentialUrl: c.link || '',
                      }))
                    : [],
                },
              },
              {
                id: 'sec-contact',
                type: 'contact',
                title: 'Contact & Hire',
                visible: true,
                order: 7,
                data: {
                  socialLinks: [
                    { platform: 'WhatsApp', url: `https://wa.me/${(prof.phone || '9360519460').replace(/\D/g, '')}` },
                    { platform: 'Email', url: `mailto:${user?.email || ''}` },
                  ],
                },
              },
            ],
            seo: {
              title: `${prof.name || 'Professional'} — Portfolio & Resume | THENIJOBS`,
              description: `Verified portfolio and resume of ${prof.name || 'Job Seeker'} in ${prof.district || 'Theni'}, Tamil Nadu. View skills, experience, and contact for hiring.`,
              keywords: [
                prof.currentRole || 'Job Seeker',
                'Portfolio',
                'Resume',
                prof.district || 'Theni',
                'Tamil Nadu',
              ],
              ogImage: prof.photoUrl || '/og-image.jpg',
              canonicalUrl: `https://thenijobs.com/portfolio/${defaultSlug}`,
              structuredDataType: 'Person',
            },
            analytics: {
              totalViews: 0,
              uniqueVisitors: 0,
              enquiries: 0,
              lastViewedAt: null,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            publishedAt: null,
          };

          setSite(newSite);
          // Persist initial draft
          await setDoc(doc(db, 'portfolioSites', newSite.id), newSite);
        }
      } catch (err: any) {
        console.error('Error loading seeker portfolio:', err);
        toast.error('Failed to load portfolio site: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSeekerSite();
  }, [user]);

  // Update field helper
  const updateField = useCallback((path: string, value: any) => {
    setSite(prev => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let cur = clone;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!cur[keys[i]]) cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return clone;
    });
    setIsDirty(true);
  }, []);

  // Update Section Data helper
  const updateSectionData = useCallback((type: string, dataUpdater: (prevData: any) => any) => {
    setSite(prev => {
      if (!prev) return prev;
      const sections = prev.sections.map(sec => {
        if (sec.type === type) {
          return {
            ...sec,
            data: dataUpdater(sec.data || {}),
          };
        }
        return sec;
      });
      return { ...prev, sections };
    });
    setIsDirty(true);
  }, []);

  // Save changes to Firestore
  const handleSave = async () => {
    if (!site?.id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'portfolioSites', site.id), {
        sections: site.sections,
        theme: site.theme,
        branding: site.branding,
        seo: site.seo,
        googleIndex: site.googleIndex,
        customUrl: site.customUrl,
        updatedAt: new Date(),
      });
      setIsDirty(false);
      toast.success('Portfolio changes saved successfully!');
    } catch (err: any) {
      console.error('Error saving portfolio:', err);
      toast.error('Failed to save changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Publish / Unpublish Toggle
  const handlePublishToggle = async () => {
    if (!site?.id) return;
    setPublishing(true);
    try {
      const nextStatus = site.status === 'published' ? 'draft' : 'published';
      const isNowPub = nextStatus === 'published';

      await updateDoc(doc(db, 'portfolioSites', site.id), {
        status: nextStatus,
        visibility: isNowPub ? 'public' : 'private',
        publishedAt: isNowPub ? new Date() : null,
        updatedAt: new Date(),
      });

      setSite(prev => prev ? {
        ...prev,
        status: nextStatus,
        visibility: isNowPub ? 'public' : 'private',
        publishedAt: isNowPub ? new Date() : null,
      } : null);

      if (isNowPub) {
        toast.success('🎉 Portfolio Website is now LIVE!', `Your website is published at thenijobs.com/portfolio/${site.customUrl}`);
      } else {
        toast.info('Portfolio set to Draft mode.');
      }
    } catch (err: any) {
      toast.error('Publish error: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  // 1-Click Sync from Seeker Profile
  const handleSyncFromProfile = async () => {
    if (!user?.uid || !site) return;
    setSyncing(true);
    try {
      const profRef = doc(db, 'seekerProfiles', user.uid);
      const profSnap = await getDoc(profRef);
      if (!profSnap.exists()) {
        toast.warning('No profile data found to sync.');
        return;
      }
      const prof = profSnap.data();

      updateSectionData('hero', prev => ({
        ...prev,
        name: prof.name || prev.name,
        title: prof.currentRole || prev.title,
        tagline: prof.careerObjective || prev.tagline,
        location: prof.district ? `${prof.district}, Tamil Nadu` : prev.location,
        avatarUrl: prof.photoUrl || prof.profilePhotoUrl || prev.avatarUrl,
        whatsapp: prof.phone || prev.whatsapp,
        phone: prof.phone || prev.phone,
        resumeUrl: prof.resumeUrl || prev.resumeUrl,
      }));

      updateSectionData('about', prev => ({
        ...prev,
        content: prof.aboutMe || prof.careerObjective || prev.content,
      }));

      if (Array.isArray(prof.skills) && prof.skills.length > 0) {
        updateSectionData('skills', () => ({
          skills: prof.skills.map((s: any, idx: number) => ({
            id: `skill-${idx}`,
            name: typeof s === 'string' ? s : s.name,
            category: 'technical',
            level: typeof s === 'object' && s.level ? 85 : 80,
            levelLabel: 'Advanced',
            verified: true,
          })),
        }));
      }

      if (Array.isArray(prof.experience) && prof.experience.length > 0) {
        updateSectionData('experience', () => ({
          experience: prof.experience.map((e: any, idx: number) => ({
            id: `exp-${idx}`,
            company: e.company || 'Company',
            role: e.role || 'Role',
            startDate: e.startDate || '2023',
            endDate: e.endDate || 'Present',
            isCurrent: !e.endDate || e.endDate === 'Present',
            location: e.location || 'Tamil Nadu',
            description: e.description || '',
          })),
        }));
      }

      if (Array.isArray(prof.education) && prof.education.length > 0) {
        updateSectionData('education', () => ({
          education: prof.education.map((edu: any, idx: number) => ({
            id: `edu-${idx}`,
            institution: edu.institution || 'University / College',
            degree: edu.degree || 'Degree',
            field: edu.field || '',
            year: edu.year || '2024',
            score: edu.percentage ? `${edu.percentage}%` : '',
          })),
        }));
      }

      toast.success('Successfully synced all details from your TheniJobs Profile!');
      setIsDirty(true);
    } catch (err: any) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const portfolioUrl = site?.customUrl ? `https://thenijobs.com/portfolio/${site.customUrl}` : '';

  const handleCopyUrl = () => {
    if (portfolioUrl) {
      navigator.clipboard.writeText(portfolioUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast.success('Portfolio URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-slate-600">Loading Google Sites Portfolio Studio...</p>
      </div>
    );
  }

  if (!site) return null;

  const heroData = site.sections.find(s => s.type === 'hero')?.data || {};
  const aboutData = site.sections.find(s => s.type === 'about')?.data || {};
  const skillsList: SeekerSkillItem[] = site.sections.find(s => s.type === 'skills')?.data?.skills || [];
  const experienceList: SeekerExperienceItem[] = site.sections.find(s => s.type === 'experience')?.data?.experience || [];
  const educationList: SeekerEducationItem[] = site.sections.find(s => s.type === 'education')?.data?.education || [];
  const projectsList: SeekerProjectItem[] = site.sections.find(s => s.type === 'projects')?.data?.projects || [];
  const certsList: SeekerCertificationItem[] = site.sections.find(s => s.type === 'certifications')?.data?.certifications || [];

  return (
    <div className="space-y-4" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── TOP HEADER / ACTION BAR ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
            <Globe size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Job Seeker Portfolio Studio
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${
                site.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${site.status === 'published' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {site.status === 'published' ? 'LIVE & INDEXED' : 'DRAFT MODE'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Customize elements, themes, background colors, and Google search SEO settings
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncFromProfile}
            disabled={syncing}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all"
            title="Import all data from your existing TheniJobs profile"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            Sync from Profile
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1.5 transition-all shadow-xs"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            {isDirty ? 'Save Changes' : 'Saved'}
          </button>

          <button
            onClick={handlePublishToggle}
            disabled={publishing}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              site.status === 'published'
                ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {publishing ? <Loader2 size={13} className="animate-spin" /> : site.status === 'published' ? <><EyeOff size={13} /> Unpublish</> : <><Globe size={13} /> Publish to Google</>}
          </button>

          {site.status === 'published' && (
            <a
              href={portfolioUrl}
              target="_blank"
              rel="noopener"
              className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1"
              title="Open public website in new tab"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>

      {/* ── LIVE URL & QUICK SHARE STRIP (WHEN PUBLISHED) ── */}
      {site.status === 'published' && (
        <div className="bg-emerald-500/10 border border-emerald-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Globe size={15} className="text-emerald-700 shrink-0" />
            <span className="text-slate-600 font-medium">Your Portfolio URL:</span>
            <a href={portfolioUrl} target="_blank" rel="noopener" className="font-mono font-bold text-emerald-800 hover:underline truncate">
              {portfolioUrl}
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyUrl}
              className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-50 flex items-center gap-1 transition-all"
            >
              {copiedUrl ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              {copiedUrl ? 'Copied' : 'Copy URL'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out my official digital portfolio on THENIJOBS: ${portfolioUrl}`)}`}
              target="_blank"
              rel="noopener"
              className="px-2.5 py-1 rounded-lg bg-[#25D366] text-white font-bold flex items-center gap-1 hover:opacity-90 shadow-2xs"
            >
              <MessageCircle size={12} /> Share on WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ── STUDIO TABS NAVIGATION ── */}
      <div className="flex items-center justify-between border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-1">
          {([
            { id: 'blocks' as EditorTab, label: 'Blocks & Content', icon: Layout },
            { id: 'design' as EditorTab, label: 'Themes & Colors', icon: Palette },
            { id: 'seo' as EditorTab, label: 'Google Search & SEO', icon: Search, badge: 'Google SERP' },
            { id: 'publish' as EditorTab, label: 'Plan & Publishing', icon: ShieldCheck },
          ]).map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} className={active ? 'text-emerald-600' : ''} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Device Preview Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {([
            { key: 'desktop', icon: Monitor, label: 'Desktop' },
            { key: 'laptop', icon: Laptop, label: 'Laptop' },
            { key: 'tablet', icon: Tablet, label: 'Tablet' },
            { key: 'mobile', icon: Smartphone, label: 'Mobile' },
          ] as const).map(d => {
            const Icon = d.icon;
            const active = previewDevice === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setPreviewDevice(d.key)}
                className={`p-1.5 rounded-lg transition-all ${
                  active ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title={d.label}
              >
                <Icon size={14} />
              </button>
            );
          })}
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
              showLivePreview ? 'bg-emerald-100 text-emerald-800' : 'text-slate-500'
            }`}
          >
            {showLivePreview ? 'Preview On' : 'Preview Off'}
          </button>
        </div>
      </div>

      {/* ── WORKSPACE CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT CONFIGURATION PANEL (5 COLS IF PREVIEW ON) ── */}
        <div className={`${showLivePreview ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-4`}>

          {/* ════ TAB 1: BLOCKS & CONTENT ════ */}
          {activeTab === 'blocks' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-5">
              {/* Block Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100">
                {([
                  { id: 'hero', label: 'Header/Bio', icon: User },
                  { id: 'about', label: 'About', icon: Sparkles },
                  { id: 'skills', label: 'Skills', icon: Code2 },
                  { id: 'experience', label: 'Experience', icon: Briefcase },
                  { id: 'education', label: 'Education', icon: GraduationCap },
                  { id: 'projects', label: 'Projects', icon: FolderGit2 },
                  { id: 'certifications', label: 'Certs', icon: Award },
                  { id: 'contact', label: 'Contact', icon: Mail },
                ] as const).map(b => {
                  const Icon = b.icon;
                  const active = activeBlockTab === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setActiveBlockTab(b.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all ${
                        active ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Icon size={12} /> {b.label}
                    </button>
                  );
                })}
              </div>

              {/* ── HERO / HEADER BLOCK ── */}
              {activeBlockTab === 'hero' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Hero Banner & Profile Header
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-full-name" className="text-xs font-bold text-slate-700">Full Name</label>
                      <input id="portfolio-seekersiteeditor-full-name"
                        type="text"
                        value={heroData.name || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, name: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="e.g. Anand Kumar"
                      />
                    </div>
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-professional-title-role" className="text-xs font-bold text-slate-700">Professional Title / Role</label>
                      <input id="portfolio-seekersiteeditor-professional-title-role"
                        type="text"
                        value={heroData.title || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, title: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="e.g. Senior Digital Marketing Specialist"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="portfolio-seekersiteeditor-growth-slogan-personal-tagline" className="text-xs font-bold text-slate-700">Growth Slogan / Personal Tagline</label>
                    <input id="portfolio-seekersiteeditor-growth-slogan-personal-tagline"
                      type="text"
                      value={heroData.tagline || ''}
                      onChange={e => updateSectionData('hero', prev => ({ ...prev, tagline: e.target.value }))}
                      className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                      placeholder="e.g. Driving revenue growth through high-converting ROI campaigns."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-location-city" className="text-xs font-bold text-slate-700">Location / City</label>
                      <input id="portfolio-seekersiteeditor-location-city"
                        type="text"
                        value={heroData.location || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, location: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="Theni, Tamil Nadu"
                      />
                    </div>
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-years-experience" className="text-xs font-bold text-slate-700">Years Experience</label>
                      <input id="portfolio-seekersiteeditor-years-experience"
                        type="text"
                        value={heroData.experienceYears || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, experienceYears: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="e.g. 3+ Years"
                      />
                    </div>
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-availability-status" className="text-xs font-bold text-slate-700">Availability Status</label>
                      <input id="portfolio-seekersiteeditor-availability-status"
                        type="text"
                        value={heroData.joiningAvailability || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, joiningAvailability: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="Immediate Joiner"
                      />
                    </div>
                  </div>

                  {/* Image URLs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-profile-photo-avatar-url" className="text-xs font-bold text-slate-700">Profile Photo / Avatar URL</label>
                      <input id="portfolio-seekersiteeditor-profile-photo-avatar-url"
                        type="text"
                        value={heroData.avatarUrl || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, avatarUrl: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-cover-banner-image-url" className="text-xs font-bold text-slate-700">Cover Banner Image URL</label>
                      <input id="portfolio-seekersiteeditor-cover-banner-image-url"
                        type="text"
                        value={heroData.coverUrl || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, coverUrl: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Contact Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-whatsapp-number" className="text-xs font-bold text-slate-700">WhatsApp Number</label>
                      <input id="portfolio-seekersiteeditor-whatsapp-number"
                        type="text"
                        value={heroData.whatsapp || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, whatsapp: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="9360519460"
                      />
                    </div>
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-phone-for-calls" className="text-xs font-bold text-slate-700">Phone for Calls</label>
                      <input id="portfolio-seekersiteeditor-phone-for-calls"
                        type="text"
                        value={heroData.phone || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="9360519460"
                      />
                    </div>
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-resume-cv-link" className="text-xs font-bold text-slate-700">Resume / CV Link</label>
                      <input id="portfolio-seekersiteeditor-resume-cv-link"
                        type="text"
                        value={heroData.resumeUrl || ''}
                        onChange={e => updateSectionData('hero', prev => ({ ...prev, resumeUrl: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={heroData.isOpenToWork !== false}
                      onChange={e => updateSectionData('hero', prev => ({ ...prev, isOpenToWork: e.target.checked }))}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>Display "🟢 Open to Work" badge on portfolio</span>
                  </label>
                </div>
              )}

              {/* ── ABOUT ME BLOCK ── */}
              {activeBlockTab === 'about' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Professional Summary & Bio
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-slate-700">About Me Description</label>
                    <textarea id="portfolio-seekersiteeditor-updatesectiondata-hero-prev-classname-ro"
                      rows={5}
                      value={aboutData.content || ''}
                      onChange={e => updateSectionData('about', prev => ({ ...prev, content: e.target.value }))}
                      className="w-full mt-1 px-3 py-2.5 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                      placeholder="Write your background, skills, and value proposition..."
                    />
                  </div>
                </div>
              )}

              {/* ── SKILLS BLOCK ── */}
              {activeBlockTab === 'skills' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Skills & Proficiency Levels
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newSkill: SeekerSkillItem = {
                          id: `skill-${Date.now()}`,
                          name: 'New Skill',
                          category: 'technical',
                          level: 80,
                          levelLabel: 'Advanced',
                          verified: true,
                        };
                        updateSectionData('skills', prev => ({
                          skills: [...(prev.skills || []), newSkill],
                        }));
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Skill
                    </button>
                  </div>

                  <div className="space-y-3">
                    {skillsList.map((skill, idx) => (
                      <div key={skill.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={skill.name}
                            onChange={e => {
                              const updated = [...skillsList];
                              updated[idx].name = e.target.value;
                              updateSectionData('skills', () => ({ skills: updated }));
                            }}
                            className="text-base sm:text-xs font-bold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1"
                            aria-label="Skill Name (e.g. SEO Optimization)" placeholder="Skill Name (e.g. SEO Optimization)"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = skillsList.filter(s => s.id !== skill.id);
                              updateSectionData('skills', () => ({ skills: updated }));
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-medium text-slate-500">Proficiency ({skill.level || 80}%):</span>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            value={skill.level || 80}
                            onChange={e => {
                              const updated = [...skillsList];
                              updated[idx].level = Number(e.target.value);
                              updateSectionData('skills', () => ({ skills: updated }));
                            }}
                            className="flex-1 accent-emerald-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── WORK EXPERIENCE BLOCK ── */}
              {activeBlockTab === 'experience' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Work Experience Timeline
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newExp: SeekerExperienceItem = {
                          id: `exp-${Date.now()}`,
                          company: 'Company Name',
                          role: 'Job Role',
                          startDate: '2023',
                          endDate: 'Present',
                          isCurrent: true,
                          location: 'Theni, Tamil Nadu',
                          description: 'Key achievements and responsibilities.',
                        };
                        updateSectionData('experience', prev => ({
                          experience: [...(prev.experience || []), newExp],
                        }));
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Experience
                    </button>
                  </div>

                  <div className="space-y-3">
                    {experienceList.map((exp, idx) => (
                      <div key={exp.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={exp.role}
                            onChange={e => {
                              const updated = [...experienceList];
                              updated[idx].role = e.target.value;
                              updateSectionData('experience', () => ({ experience: updated }));
                            }}
                            className="text-base sm:text-xs font-bold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1"
                            aria-label="Job Title / Role" placeholder="Job Title / Role"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = experienceList.filter(e => e.id !== exp.id);
                              updateSectionData('experience', () => ({ experience: updated }));
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={exp.company}
                            onChange={e => {
                              const updated = [...experienceList];
                              updated[idx].company = e.target.value;
                              updateSectionData('experience', () => ({ experience: updated }));
                            }}
                            className="text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                            aria-label="Company Name" placeholder="Company Name"
                          />
                          <input
                            type="text"
                            value={`${exp.startDate} - ${exp.endDate}`}
                            onChange={e => {
                              const parts = e.target.value.split('-');
                              const updated = [...experienceList];
                              updated[idx].startDate = parts[0]?.trim() || '';
                              updated[idx].endDate = parts[1]?.trim() || 'Present';
                              updateSectionData('experience', () => ({ experience: updated }));
                            }}
                            className="text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                            aria-label="e.g. 2022 - Present" placeholder="e.g. 2022 - Present"
                          />
                        </div>

                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={e => {
                            const updated = [...experienceList];
                            updated[idx].description = e.target.value;
                            updateSectionData('experience', () => ({ experience: updated }));
                          }}
                          className="w-full text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                          aria-label="Responsibilities and achievements" placeholder="Responsibilities and achievements..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PROJECTS BLOCK ── */}
              {activeBlockTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Projects & Portfolio Showcase
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newProj: SeekerProjectItem = {
                          id: `proj-${Date.now()}`,
                          title: 'New Project Title',
                          category: 'Web / Marketing',
                          description: 'Description of the project scope and impact.',
                          techStack: ['Skill 1', 'Tool 2'],
                          liveUrl: '',
                          githubUrl: '',
                        };
                        updateSectionData('projects', prev => ({
                          projects: [...(prev.projects || []), newProj],
                        }));
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Project
                    </button>
                  </div>

                  <div className="space-y-3">
                    {projectsList.map((proj, idx) => (
                      <div key={proj.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={proj.title}
                            onChange={e => {
                              const updated = [...projectsList];
                              updated[idx].title = e.target.value;
                              updateSectionData('projects', () => ({ projects: updated }));
                            }}
                            className="text-base sm:text-xs font-bold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1"
                            aria-label="Project Title" placeholder="Project Title"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = projectsList.filter(p => p.id !== proj.id);
                              updateSectionData('projects', () => ({ projects: updated }));
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={e => {
                            const updated = [...projectsList];
                            updated[idx].description = e.target.value;
                            updateSectionData('projects', () => ({ projects: updated }));
                          }}
                          className="w-full text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                          aria-label="Project details & outcomes" placeholder="Project details & outcomes..."
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={proj.liveUrl || ''}
                            onChange={e => {
                              const updated = [...projectsList];
                              updated[idx].liveUrl = e.target.value;
                              updateSectionData('projects', () => ({ projects: updated }));
                            }}
                            className="text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                            aria-label="Live Preview URL (https://)" placeholder="Live Preview URL (https://...)"
                          />
                          <input
                            type="text"
                            value={proj.imageUrl || ''}
                            onChange={e => {
                              const updated = [...projectsList];
                              updated[idx].imageUrl = e.target.value;
                              updateSectionData('projects', () => ({ projects: updated }));
                            }}
                            className="text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                            aria-label="Screenshot Image URL" placeholder="Screenshot Image URL"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── EDUCATION BLOCK ── */}
              {activeBlockTab === 'education' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Education & Degrees
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newEdu: SeekerEducationItem = {
                          id: `edu-${Date.now()}`,
                          institution: 'College / University',
                          degree: 'Degree',
                          field: 'Field of Study',
                          year: '2024',
                        };
                        updateSectionData('education', prev => ({
                          education: [...(prev.education || []), newEdu],
                        }));
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Education
                    </button>
                  </div>

                  <div className="space-y-3">
                    {educationList.map((edu, idx) => (
                      <div key={edu.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={e => {
                              const updated = [...educationList];
                              updated[idx].degree = e.target.value;
                              updateSectionData('education', () => ({ education: updated }));
                            }}
                            className="text-base sm:text-xs font-bold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1"
                            aria-label="Degree (e.g. B.Tech / MBA / B.Sc)" placeholder="Degree (e.g. B.Tech / MBA / B.Sc)"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = educationList.filter(e => e.id !== edu.id);
                              updateSectionData('education', () => ({ education: updated }));
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={e => {
                              const updated = [...educationList];
                              updated[idx].institution = e.target.value;
                              updateSectionData('education', () => ({ education: updated }));
                            }}
                            className="text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                            aria-label="Institution Name" placeholder="Institution Name"
                          />
                          <input
                            type="text"
                            value={edu.year}
                            onChange={e => {
                              const updated = [...educationList];
                              updated[idx].year = e.target.value;
                              updateSectionData('education', () => ({ education: updated }));
                            }}
                            className="text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                            aria-label="Graduation Year" placeholder="Graduation Year"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CERTIFICATIONS BLOCK ── */}
              {activeBlockTab === 'certifications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Certificates & Licenses
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newCert: SeekerCertificationItem = {
                          id: `cert-${Date.now()}`,
                          name: 'Certificate Name',
                          issuer: 'Issuing Body',
                          issueDate: '2024',
                          credentialUrl: '',
                        };
                        updateSectionData('certifications', prev => ({
                          certifications: [...(prev.certifications || []), newCert],
                        }));
                      }}
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={13} /> Add Certificate
                    </button>
                  </div>

                  <div className="space-y-3">
                    {certsList.map((cert, idx) => (
                      <div key={cert.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={cert.name}
                            onChange={e => {
                              const updated = [...certsList];
                              updated[idx].name = e.target.value;
                              updateSectionData('certifications', () => ({ certifications: updated }));
                            }}
                            className="text-base sm:text-xs font-bold bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1"
                            aria-label="Certificate Title" placeholder="Certificate Title"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = certsList.filter(c => c.id !== cert.id);
                              updateSectionData('certifications', () => ({ certifications: updated }));
                            }}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={e => {
                              const updated = [...certsList];
                              updated[idx].issuer = e.target.value;
                              updateSectionData('certifications', () => ({ certifications: updated }));
                            }}
                            className="text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                            aria-label="Issuer (e.g. Google, IBM)" placeholder="Issuer (e.g. Google, IBM)"
                          />
                          <input
                            type="text"
                            value={cert.credentialUrl || ''}
                            onChange={e => {
                              const updated = [...certsList];
                              updated[idx].credentialUrl = e.target.value;
                              updateSectionData('certifications', () => ({ certifications: updated }));
                            }}
                            className="text-base sm:text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                            aria-label="Verification Link (https://)" placeholder="Verification Link (https://...)"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CONTACT BLOCK ── */}
              {activeBlockTab === 'contact' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Contact & Social Profile Links
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-linkedin-profile-url" className="font-bold text-slate-700">LinkedIn Profile URL</label>
                      <input id="portfolio-seekersiteeditor-linkedin-profile-url"
                        type="text"
                        value={site.sections.find(s => s.type === 'contact')?.data?.socialLinks?.find((l: any) => l.platform === 'LinkedIn')?.url || ''}
                        onChange={e => {
                          const links = site.sections.find(s => s.type === 'contact')?.data?.socialLinks || [];
                          const next = links.filter((l: any) => l.platform !== 'LinkedIn');
                          if (e.target.value) next.push({ platform: 'LinkedIn', url: e.target.value });
                          updateSectionData('contact', prev => ({ ...prev, socialLinks: next }));
                        }}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                    <div>
                      <label htmlFor="portfolio-seekersiteeditor-github-profile-url" className="font-bold text-slate-700">GitHub Profile URL</label>
                      <input id="portfolio-seekersiteeditor-github-profile-url"
                        type="text"
                        value={site.sections.find(s => s.type === 'contact')?.data?.socialLinks?.find((l: any) => l.platform === 'GitHub')?.url || ''}
                        onChange={e => {
                          const links = site.sections.find(s => s.type === 'contact')?.data?.socialLinks || [];
                          const next = links.filter((l: any) => l.platform !== 'GitHub');
                          if (e.target.value) next.push({ platform: 'GitHub', url: e.target.value });
                          updateSectionData('contact', prev => ({ ...prev, socialLinks: next }));
                        }}
                        className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200"
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 2: THEMES & DESIGN ════ */}
          {activeTab === 'design' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-6">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Preset Color Themes
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {THEME_PRESETS.map((preset, idx) => {
                    const isSelected = site.theme.primaryColor === preset.primary && site.theme.backgroundColor === preset.bg;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          updateField('theme.primaryColor', preset.primary);
                          updateField('theme.secondaryColor', preset.secondary);
                          updateField('theme.backgroundColor', preset.bg);
                          updateField('theme.surfaceColor', preset.surface);
                          updateField('theme.textColor', preset.text);
                          updateField('theme.textMutedColor', preset.muted);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          isSelected ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-4 h-4 rounded-full" style={{ background: preset.primary }} />
                          <div className="w-4 h-4 rounded-full" style={{ background: preset.secondary }} />
                          <div className="w-4 h-4 rounded-full border" style={{ background: preset.surface }} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 block truncate">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Custom Colors & Backgrounds
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="portfolio-seekersiteeditor-primary-brand-color-updatefield-theme-pr" className="text-xs font-bold text-slate-700">Primary Brand Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={site.theme.primaryColor || '#059669'}
                        onChange={e => updateField('theme.primaryColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={site.theme.primaryColor || '#059669'}
                        onChange={e => updateField('theme.primaryColor', e.target.value)}
                        className="w-full text-base sm:text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Background Color</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={site.theme.backgroundColor || '#FFFFFF'}
                        onChange={e => updateField('theme.backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <input
                        type="text"
                        value={site.theme.backgroundColor || '#FFFFFF'}
                        onChange={e => updateField('theme.backgroundColor', e.target.value)}
                        className="w-full text-base sm:text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Typography */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Google Fonts & Typography
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Heading Font</label>
                    <select id="portfolio-seekersiteeditor-primary-brand-color-updatefield-theme-pr"
                      value={site.theme.headingFont || 'Poppins'}
                      onChange={e => updateField('theme.headingFont', e.target.value)}
                      className="w-full mt-1 text-base sm:text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label} ({f.category})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="portfolio-seekersiteeditor-body-font" className="text-xs font-bold text-slate-700">Body Font</label>
                    <select id="portfolio-seekersiteeditor-body-font"
                      value={site.theme.fontFamily || 'Inter'}
                      onChange={e => updateField('theme.fontFamily', e.target.value)}
                      className="w-full mt-1 text-base sm:text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label} ({f.category})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Corner Styles */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Corner Style (Border Radius)
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'small', 'medium', 'large'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => updateField('theme.borderRadius', r)}
                      className={`p-2 text-xs font-bold capitalize rounded-xl border transition-all ${
                        site.theme.borderRadius === r ? 'bg-emerald-600 text-white' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 3: GOOGLE SEO & SERP SNIPPET PREVIEW ════ */}
          {activeTab === 'seo' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-6">

              {/* Google Search Engine Index Toggle */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search size={18} className="text-blue-600" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Google Search Engine Indexing</h3>
                      <p className="text-[11px] text-slate-500">Show this portfolio in Google & search engine results</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={site.googleIndex !== false}
                      onChange={e => updateField('googleIndex', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
                <p className="text-[10px] text-blue-700 font-semibold">
                  {site.googleIndex !== false
                    ? '🟢 Google will crawl and index your portfolio, Schema.org Person metadata & search snippet.'
                    : '⚪ Portfolio will be hidden from search engines (noindex tag enabled).'}
                </p>
              </div>

              {/* Custom SEO URL Slug */}
              <div>
                <label className="text-xs font-bold text-slate-700">Custom SEO URL Slug</label>
                <div className="flex items-center mt-1">
                  <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs text-slate-500 font-mono">
                    thenijobs.com/portfolio/
                  </span>
                  <input
                    type="text"
                    value={site.customUrl || ''}
                    onChange={e => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                      updateField('customUrl', clean);
                      updateField('seo.canonicalUrl', `https://thenijobs.com/portfolio/${clean}`);
                    }}
                    className="flex-1 px-3 py-2 text-base sm:text-xs font-mono font-bold rounded-r-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                    aria-label="your-name" placeholder="your-name"
                  />
                </div>
              </div>

              {/* SEO Title */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-bold text-slate-700">Google Search Result Title</label>
                  <span className="text-[10px] text-slate-400">{(site.seo?.title || '').length}/60 chars</span>
                </div>
                <input
                  type="text"
                  value={site.seo?.title || ''}
                  onChange={e => updateField('seo.title', e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  aria-label="e.g. Anand Kumar - Senior Digital Marketer in Theni | Portfolio & Resume" placeholder="e.g. Anand Kumar - Senior Digital Marketer in Theni | Portfolio & Resume"
                />
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-bold text-slate-700">Google Meta Description Snippet</label>
                  <span className="text-[10px] text-slate-400">{(site.seo?.description || '').length}/160 chars</span>
                </div>
                <textarea
                  rows={3}
                  value={site.seo?.description || ''}
                  onChange={e => updateField('seo.description', e.target.value)}
                  className="w-full px-3 py-2 text-base sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                  aria-label="e.g. Verified digital marketing professional with 3+ years experience in SEO, PPC & Social Media in Theni, Tamil Nadu. View projects & hire directly." placeholder="e.g. Verified digital marketing professional with 3+ years experience in SEO, PPC & Social Media in Theni, Tamil Nadu. View projects & hire directly."
                />
              </div>

              {/* ── REAL-TIME GOOGLE SEARCH SNIPPET PREVIEW (SERP CARD) ── */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                  <Search size={14} className="text-blue-600" />
                  <span>Google Search Result Snippet Preview</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  This is exactly how your profile snippet will appear to recruiters searching on Google:
                </p>

                {/* Google SERP Card Box */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 font-sans">
                  {/* Google Breadcrumb URL */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                      TJ
                    </div>
                    <div className="leading-none truncate text-[12px]">
                      <span className="text-slate-800 font-medium">THENIJOBS</span>
                      <span className="text-slate-400 font-mono text-[11px] block truncate">
                        https://thenijobs.com › portfolio › {site.customUrl || 'anand-kumar'}
                      </span>
                    </div>
                  </div>

                  {/* Google Title */}
                  <h4 className="text-[15px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                    {site.seo?.title || `${heroData.name || 'Your Name'} — Official Portfolio & Resume | THENIJOBS`}
                  </h4>

                  {/* Snippet Description */}
                  <p className="text-[12px] text-[#4d5156] leading-relaxed line-clamp-2">
                    {site.seo?.description || `Explore the verified professional portfolio, skills, experience, and projects of ${heroData.name || 'Job Seeker'} in ${heroData.location || 'Theni'}, Tamil Nadu on THENIJOBS.`}
                  </p>

                  {/* Google Rich Attributes Pill */}
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-[#70757a]">
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star size={11} className="fill-amber-500 text-amber-500" /> 5.0 (Verified)
                    </span>
                    <span>• {heroData.location || 'Theni, TN'}</span>
                    <span>• {heroData.experienceYears || 'Experienced'}</span>
                  </div>
                </div>
              </div>

              {/* Social Card Preview */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                  <Share2 size={14} className="text-emerald-600" />
                  <span>WhatsApp & LinkedIn Sharing Preview</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  {heroData.avatarUrl ? (
                    <img src={heroData.avatarUrl} alt="Preview" className="w-14 h-14 rounded-xl object-cover border shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                      TJ
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {site.seo?.title || `${heroData.name || 'Anand Kumar'} — Portfolio`}
                    </p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {site.seo?.description || 'View interactive resume and projects on THENIJOBS.'}
                    </p>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold block truncate">
                      thenijobs.com/portfolio/{site.customUrl}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 4: PLAN & PUBLISHING ════ */}
          {activeTab === 'publish' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-6">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Standard Annual Plan & Google Publishing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Basic Free Plan */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700">Basic Seeker</span>
                      <span className="text-xs font-black text-slate-900">Free</span>
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1">
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600" /> Standard Portfolio Website</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600" /> Shareable Direct Link</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600" /> Resume & WhatsApp Connect</li>
                    </ul>
                  </div>

                  {/* Standard Verified Annual Plan */}
                  <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 space-y-2 relative overflow-hidden">
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white">
                      RECOMMENDED
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-900">Standard Pro</span>
                      <span className="text-xs font-black text-emerald-700">₹499 / Year</span>
                    </div>
                    <ul className="text-[11px] text-emerald-950 space-y-1">
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600" /> Google Search Engine Indexing</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600" /> Verified Candidate Badge ⭐</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600" /> Priority in Recruiter Talent Search</li>
                      <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-600" /> Unlimited Projects & Custom Colors</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Publish Action Box */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Globe size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {site.status === 'published' ? '🟢 Your Portfolio is Live to the World' : '🟡 Your Portfolio is Currently in Draft'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {site.status === 'published'
                    ? `Accessible at thenijobs.com/portfolio/${site.customUrl}. Google search crawlers can discover your skills.`
                    : 'Publish your website to make it publicly viewable by top employers and HR recruiters in Tamil Nadu.'}
                </p>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handlePublishToggle}
                    disabled={publishing}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
                      site.status === 'published' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {publishing ? <Loader2 size={13} className="animate-spin inline mr-1" /> : null}
                    {site.status === 'published' ? 'Switch to Draft Mode' : '🚀 Publish Portfolio Now'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT INTERACTIVE LIVE DEVICE PREVIEW PANE ── */}
        {showLivePreview && (
          <div className="lg:col-span-7 sticky top-20 bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-800 space-y-3">
            {/* Device Bar Header */}
            <div className="flex items-center justify-between text-white/80 text-xs px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[11px] text-white/50 ml-2">
                  thenijobs.com/portfolio/{site.customUrl}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Live Preview • {previewDevice}
                </span>
              </div>
            </div>

            {/* Preview Viewport Container */}
            <div className="flex justify-center overflow-x-auto py-1">
              <div
                className="bg-white rounded-2xl overflow-y-auto transition-all shadow-2xl border border-white/20"
                style={{
                  width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '768px' : previewDevice === 'laptop' ? '1024px' : '100%',
                  maxHeight: '750px',
                  minHeight: '550px',
                }}
              >
                <SeekerPortfolioRenderer site={site} isPreview={true} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
