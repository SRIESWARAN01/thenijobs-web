'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User, Phone, Mail, MapPin, Camera, Briefcase, GraduationCap,
  Plus, X, Check, Save, Globe, Award, Sparkles, Zap,
  CheckCircle, Circle, Languages, ExternalLink, Loader2, Eye,
  FolderGit2, Shield, Settings, Sliders, ArrowRight, Wand2, FileText, CheckCircle2
} from 'lucide-react';
import { TN_DISTRICTS } from '@/lib/types';
import { SEEKER_PUBLIC_PROFILE_FEE_INR } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useUploadFile, useDeleteFile } from '@/hooks/useStorage';
import { optimizeImageForUpload } from '@/lib/storage/imageOptimizer';
import { db } from '@/lib/firebase/config';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import DeviceLivePreviewModal from '@/components/ui/DeviceLivePreviewModal';
import SeekerPortfolioClient from '@/app/portfolio/seeker/[id]/SeekerPortfolioClient';
import SeekerPublicProfileModal from '@/components/payment/SeekerPublicProfileModal';
import { useToast } from '@/contexts/ToastContext';
import { Switch } from '@/components/dashboard';

/** Skill suggestions for tag input */
const SKILL_SUGGESTIONS = [
  'Tally Prime', 'MS Excel', 'GST Filing', 'Accounts Executive', 'Billing',
  'Python', 'JavaScript', 'React', 'HTML / CSS', 'SQL',
  'Sales & Marketing', 'Customer Service', 'AutoCAD', 'Computer Operations',
  'Graphic Design', 'Logistics', 'Driving', 'Electrical Wiring', 'Mechanical'
];

const LANGUAGE_OPTIONS = ['Tamil', 'English', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'Urdu', 'French'];

const THENI_LOCALITIES = [
  'Theni', 'Periyakulam', 'Bodinayakanur', 'Cumbum', 'Chinnamanur',
  'Uthamapalayam', 'Andipatti', 'Madurai', 'Dindigul', 'Anywhere in Tamil Nadu'
];

const WORK_MODES = [
  { value: 'onsite', label: 'On-site (Office / Facility)' },
  { value: 'hybrid', label: 'Hybrid (Office + Remote)' },
  { value: 'remote', label: '100% Remote / Work from Home' },
];

const NOTICE_PERIODS = [
  'Immediate (Available Now)',
  '15 Days',
  '1 Month (30 Days)',
  '2 Months (60 Days)',
  'Currently Serving Notice'
];

const BIO_TEMPLATES = [
  {
    role: 'Accounts & Finance',
    headline: 'B.Com Graduate | Accounts & GST Specialist | Tally Prime | Theni',
    bio: 'Commerce graduate with solid practical experience in bookkeeping, Tally Prime, GST filing, and advanced MS Excel. Seeking an Accounts Executive or Finance role in Theni and surrounding districts.'
  },
  {
    role: 'Web & Software Developer',
    headline: 'Web Developer | React | Next.js | TypeScript | Node.js | SQL',
    bio: 'Passionate software and web developer skilled in building responsive web applications with React, Next.js, and modern APIs. Focused on clean code, performance, and user-centric digital experiences.'
  },
  {
    role: 'Sales, Retail & Marketing',
    headline: 'Sales Executive | Business Development | Customer Relations | Theni',
    bio: 'Results-driven sales and customer support specialist with experience in lead conversion, local market outreach, and client relationship management across retail and distribution sectors.'
  },
  {
    role: 'Office Admin & Operations',
    headline: 'Office Administrator | Data Entry Specialist | MS Office | Operations',
    bio: 'Organized administrative professional proficient in office management, documentation, fast typing, and coordinating day-to-day operations with high attention to detail.'
  },
  {
    role: 'Fresher Graduate',
    headline: 'Motivated Graduate | Quick Learner | Ready to Excel | Theni',
    bio: 'Enthusiastic and proactive graduate with strong analytical and communication skills. Eager to launch a career in a growth-oriented company and contribute fresh energy and dedication.'
  }
];

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  year: string;
  percentage?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  description: string;
}

export interface ProjectEntry {
  id: string;
  title: string;
  role: string;
  technologies: string;
  description: string;
  liveUrl?: string;
  githubUrl?: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  organization: string;
  date: string;
  link: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  organization: string;
  year: string;
  description: string;
}

export interface SkillItem {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Technical' | 'Business' | 'Tools' | 'General';
}

type TabKey =
  | 'personal'
  | 'bio'
  | 'preferences'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'portfolio'
  | 'privacy';

const DEFAULT_PROFILE = {
  name: '',
  dob: '',
  gender: 'Male',
  phone: '',
  email: '',
  address: '',
  district: 'Theni',
  currentRole: '',
  headline: '',
  bio: '',
  isOpenToWork: true,
  expectedSalary: '₹15,000 - ₹25,000 / month',
  workMode: 'onsite',
  noticePeriod: 'Immediate (Available Now)',
  preferredLocations: ['Theni'],
  targetRoles: '',
  isPortfolioPublic: false,
  privacySettings: {
    hidePhone: true,
    hideEmail: true,
    hideResume: false,
    profileVisibility: 'employers_only' as 'public' | 'employers_only' | 'private'
  },
  photoUrl: ''
};

export default function SeekerProfilePage() {
  const { user } = useAuth();
  
  // 1. Fetch profile from Firestore
  const { data: remoteProfile, loading: profileLoading } = useDocument<any>('seekerProfiles', user?.uid);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsWithLevels, setSkillsWithLevels] = useState<SkillItem[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [hasResume, setHasResume] = useState(false);
  const [publicProfilePaidUntil, setPublicProfilePaidUntil] = useState<number | null>(null);
  const [showPublicProfileModal, setShowPublicProfileModal] = useState(false);

  const [newSkill, setNewSkill] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [newSkillCat, setNewSkillCat] = useState<'Technical' | 'Business' | 'Tools' | 'General'>('Technical');
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [saving, setSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const toast = useToast();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();
  const { deleteFile } = useDeleteFile();

  // Populate data when fetched
  useEffect(() => {
    if (remoteProfile) {
      setProfile({
        name: remoteProfile.name || '',
        dob: remoteProfile.dob || '',
        gender: remoteProfile.gender || 'Male',
        phone: remoteProfile.phone || '',
        email: remoteProfile.email || '',
        address: remoteProfile.address || '',
        district: remoteProfile.district || 'Theni',
        currentRole: remoteProfile.currentRole || '',
        headline: remoteProfile.headline || remoteProfile.professionalHeadline || '',
        bio: remoteProfile.bio || remoteProfile.aboutMe || '',
        isOpenToWork: remoteProfile.isOpenToWork !== false,
        expectedSalary: remoteProfile.expectedSalary || '₹15,000 - ₹25,000 / month',
        workMode: remoteProfile.workMode || remoteProfile.preferredMode || 'onsite',
        noticePeriod: remoteProfile.noticePeriod || remoteProfile.availability || 'Immediate (Available Now)',
        preferredLocations: remoteProfile.preferredLocations || ['Theni'],
        targetRoles: remoteProfile.targetRoles || '',
        isPortfolioPublic: remoteProfile.isPortfolioPublic === true,
        privacySettings: {
          hidePhone: remoteProfile.privacySettings?.hidePhone !== false,
          hideEmail: remoteProfile.privacySettings?.hideEmail !== false,
          hideResume: remoteProfile.privacySettings?.hideResume === true,
          profileVisibility: remoteProfile.privacySettings?.profileVisibility || 'employers_only'
        },
        photoUrl: remoteProfile.photoUrl || ''
      });
      setEducation(remoteProfile.education || []);
      setExperience(remoteProfile.experience || []);
      setSkills(remoteProfile.skills || []);
      setSkillsWithLevels(remoteProfile.skillsWithLevels || (remoteProfile.skills || []).map((s: string) => ({
        name: s,
        level: 'Intermediate',
        category: 'General'
      })));
      setProjects(remoteProfile.projects || []);
      setAchievements(remoteProfile.achievements || []);
      setLanguages(remoteProfile.languages || []);
      setCertifications(remoteProfile.certifications || []);
      setPortfolio(remoteProfile.portfolio || []);
      setHasResume((remoteProfile.resumes || []).length > 0);
      setPublicProfilePaidUntil(remoteProfile.publicProfilePaidUntil?.toMillis?.() ?? null);
    } else if (user) {
      setProfile(p => ({
        ...p,
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [remoteProfile, user]);

  // ── Actionable Profile Strength Meter ──
  const strengthChecks = [
    { key: 'name', label: 'Name & Contact Details', done: !!profile.name && !!profile.phone && !!profile.email, tab: 'personal' as TabKey, boost: '+10%' },
    { key: 'photo', label: 'Professional Photo', done: !!profile.photoUrl, tab: 'personal' as TabKey, boost: '+10%' },
    { key: 'headline', label: 'Professional Headline', done: !!profile.headline, tab: 'bio' as TabKey, boost: '+10%' },
    { key: 'bio', label: 'Professional Bio / About', done: !!profile.bio && profile.bio.length >= 25, tab: 'bio' as TabKey, boost: '+10%' },
    { key: 'preferences', label: 'Career Preferences & Open to Work', done: !!profile.expectedSalary && !!profile.workMode, tab: 'preferences' as TabKey, boost: '+10%' },
    { key: 'skills', label: 'Skills & Proficiency (3+)', done: skills.length >= 3, tab: 'skills' as TabKey, boost: '+10%' },
    { key: 'experience', label: 'Work Experience / Fresher record', done: experience.length > 0 || profile.currentRole.toLowerCase().includes('fresher'), tab: 'experience' as TabKey, boost: '+10%' },
    { key: 'education', label: 'Education & Academics', done: education.length > 0, tab: 'education' as TabKey, boost: '+10%' },
    { key: 'projects', label: 'Projects Showcase', done: projects.length > 0, tab: 'projects' as TabKey, boost: '+10%' },
    { key: 'certifications', label: 'Certifications / Awards', done: certifications.length > 0, tab: 'certifications' as TabKey, boost: '+10%' },
  ];

  const completedChecksCount = strengthChecks.filter(c => c.done).length;
  const profileStrength = Math.round((completedChecksCount / strengthChecks.length) * 100);
  const pendingChecks = strengthChecks.filter(c => !c.done);

  // ── Handlers ──
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills(s => [...s, trimmed]);
    }
    if (!skillsWithLevels.some(item => item.name.toLowerCase() === trimmed.toLowerCase())) {
      setSkillsWithLevels(prev => [
        ...prev,
        { name: trimmed, level: newSkillLevel, category: newSkillCat }
      ]);
    }
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    const skillToRemove = skills[index];
    setSkills(s => s.filter((_, idx) => idx !== index));
    if (skillToRemove) {
      setSkillsWithLevels(prev => prev.filter(item => item.name.toLowerCase() !== skillToRemove.toLowerCase()));
    }
  };

  const updateSkillLevel = (skillName: string, level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setSkillsWithLevels(prev => prev.map(s => s.name === skillName ? { ...s, level } : s));
  };

  const addEducation = () => {
    setEducation(e => [...e, { id: Date.now().toString(), institution: '', degree: '', field: '', year: '', percentage: '' }]);
  };
  const removeEducation = (id: string) => setEducation(e => e.filter(item => item.id !== id));
  const updateEducation = (id: string, key: keyof EducationEntry, value: string) => {
    setEducation(e => e.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addExperience = () => {
    setExperience(e => [...e, { id: Date.now().toString(), company: '', role: '', startDate: '', endDate: '', isCurrent: false, description: '' }]);
  };
  const removeExperience = (id: string) => setExperience(e => e.filter(item => item.id !== id));
  const updateExperience = (id: string, key: keyof ExperienceEntry, value: any) => {
    setExperience(e => e.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addProject = () => {
    setProjects(p => [...p, { id: Date.now().toString(), title: '', role: '', technologies: '', description: '', liveUrl: '', githubUrl: '' }]);
  };
  const removeProject = (id: string) => setProjects(p => p.filter(item => item.id !== id));
  const updateProject = (id: string, key: keyof ProjectEntry, value: string) => {
    setProjects(p => p.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addCertification = () => {
    setCertifications(c => [...c, { id: Date.now().toString(), name: '', organization: '', date: '', link: '' }]);
  };
  const removeCertification = (id: string) => setCertifications(c => c.filter(item => item.id !== id));
  const updateCertification = (id: string, key: keyof CertificationEntry, value: string) => {
    setCertifications(c => c.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addAchievement = () => {
    setAchievements(a => [...a, { id: Date.now().toString(), title: '', organization: '', year: '', description: '' }]);
  };
  const removeAchievement = (id: string) => setAchievements(a => a.filter(item => item.id !== id));
  const updateAchievement = (id: string, key: keyof AchievementEntry, value: string) => {
    setAchievements(a => a.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addPortfolioLink = () => {
    if (newPortfolioLink.trim()) {
      setPortfolio(p => [...p, newPortfolioLink.trim()]);
      setNewPortfolioLink('');
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    const previousUrl = profile.photoUrl;
    try {
      const optimizedFile = await optimizeImageForUpload(file, {
        maxWidth: 600,
        maxHeight: 600,
        quality: 0.85,
        maxInputBytes: 5 * 1024 * 1024,
        label: 'Profile photo'
      });

      const url = await uploadFile(optimizedFile, `users/${user.uid}/profile/avatar_${Date.now()}.webp`);
      setProfile(p => ({ ...p, photoUrl: url }));
      toast.success('Profile photo updated successfully!');

      if (previousUrl && previousUrl !== url) {
        deleteFile(previousUrl).catch(err => console.warn('Failed to delete previous avatar:', err));
      }
    } catch (err) {
      console.error(err);
      toast.error('Upload failed', (err as Error).message);
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    if (!profile.name || !profile.email || !profile.phone) {
      toast.warning('Please fill in Name, Email, and Phone number.');
      return;
    }

    setSaving(true);
    try {
      // Exclude isPortfolioPublic to preserve server payment gate
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isPortfolioPublic: _isPortfolioPublic, ...profileWithoutPublicFlag } = profile;
      
      const profileData = {
        ...profileWithoutPublicFlag,
        aboutMe: profile.bio, // Sync for portfolio compatibility
        professionalHeadline: profile.headline,
        education,
        experience,
        skills,
        skillsWithLevels,
        projects,
        achievements,
        languages,
        certifications,
        portfolio,
        profileStrength,
        updatedAt: serverTimestamp()
      };

      // Write to seekerProfiles
      await setDoc(doc(db, 'seekerProfiles', user.uid), profileData, { merge: true });

      // Sync key identity details back to users collection
      await setDoc(doc(db, 'users', user.uid), {
        displayName: profile.name,
        email: profile.email,
        phone: profile.phone,
        district: profile.district,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success('Professional Career Profile saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  const hasValidPublicPayment = !!publicProfilePaidUntil && publicProfilePaidUntil > Date.now();

  const handleTogglePublicProfile = async (next: boolean) => {
    if (!user?.uid) return;

    if (!next) {
      setProfile(p => ({ ...p, isPortfolioPublic: false }));
      try {
        await setDoc(doc(db, 'seekerProfiles', user.uid), { isPortfolioPublic: false }, { merge: true });
      } catch (err) {
        console.error('Error turning off public profile:', err);
        toast.error('Failed to update your profile visibility.');
      }
      return;
    }

    if (hasValidPublicPayment) {
      setProfile(p => ({ ...p, isPortfolioPublic: true }));
      try {
        await setDoc(doc(db, 'seekerProfiles', user.uid), { isPortfolioPublic: true }, { merge: true });
      } catch (err) {
        console.error('Error turning on public profile:', err);
        toast.error('Failed to update your profile visibility.');
      }
      return;
    }

    setShowPublicProfileModal(true);
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType; badge?: string }[] = [
    { key: 'personal', label: 'Identity', icon: User },
    { key: 'bio', label: 'Bio & Headline', icon: Sparkles, badge: !profile.headline ? 'New' : undefined },
    { key: 'preferences', label: 'Open to Work', icon: Briefcase },
    { key: 'skills', label: 'Skills & Levels', icon: Award },
    { key: 'experience', label: 'Career History', icon: Briefcase },
    { key: 'education', label: 'Education', icon: GraduationCap },
    { key: 'projects', label: 'Projects', icon: FolderGit2, badge: projects.length ? `${projects.length}` : 'Vital' },
    { key: 'certifications', label: 'Certifications', icon: Award },
    { key: 'portfolio', label: 'Portfolio Links', icon: Globe },
    { key: 'privacy', label: 'Privacy', icon: Shield },
  ];

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 font-outfit">
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading your career profile...</p>
      </div>
    );
  }

  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'TNJ';

  const inputCls = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all";
  const labelCls = "text-xs font-bold text-gray-700 block mb-1.5";
  const cardCls = "p-4 rounded-2xl border border-gray-100 bg-gray-50 relative group transition-all hover:border-gray-200";
  const addBtnCls = "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer";

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-outfit">
      {/* Uploading progress notification */}
      {uploading && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <Loader2 size={18} className="text-emerald-500 animate-spin" />
          <span className="text-xs text-gray-600 font-medium">Uploading avatar... {uploadProgress}%</span>
        </div>
      )}

      {/* Hero Master Career Profile Card */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar with status ring */}
          <div className="relative shrink-0 self-center sm:self-start">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-md bg-gradient-to-br from-emerald-600 to-teal-700 ring-4 ring-emerald-50">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              title="Change Photo"
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md cursor-pointer"
            >
              <Camera size={14} />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
          </div>

          {/* Master Info & Badges */}
          <div className="flex-1 min-w-0 w-full space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{profile.name || 'Set Candidate Name'}</h1>
                  {profile.isOpenToWork && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> OPEN TO WORK
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                  {profile.headline || profile.currentRole || 'Add your professional headline below'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={12} className="text-emerald-600" /> {profile.district || 'Theni'}, Tamil Nadu
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Phone size={12} className="text-gray-400" /> {profile.phone || 'Phone not set'}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Mail size={12} className="text-gray-400" /> {profile.email}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Eye size={13} />
                  <span>Preview Portfolio</span>
                </button>
              </div>
            </div>

            {/* Quick Career Preferences summary */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
              <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 font-medium">
                🎯 {profile.workMode === 'onsite' ? 'On-site Job' : profile.workMode === 'hybrid' ? 'Hybrid Job' : 'Remote Job'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 font-medium">
                ⏱ {profile.noticePeriod}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 font-bold">
                💰 Expected: {profile.expectedSalary}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Profile Strength Card (+10% Checklist) */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Zap size={16} className="text-emerald-500" /> Profile Strength &amp; Discoverability
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Complete each section to maximize employer search discovery and 1-click job match accuracy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600">{profileStrength}%</span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {profileStrength >= 80 ? 'Job Ready ✓' : profileStrength >= 50 ? 'Good Start' : 'Needs Work'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 to-teal-500"
            style={{ width: `${profileStrength}%` }}
          />
        </div>

        {/* Actionable checklist items */}
        {pendingChecks.length > 0 ? (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-700 mb-2">Recommended Next Actions to Boost Your Profile:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pendingChecks.slice(0, 4).map(check => (
                <button
                  key={check.key}
                  type="button"
                  onClick={() => setActiveTab(check.tab)}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 transition-all text-left text-xs group cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-medium text-gray-800">
                    <Circle size={12} className="text-emerald-400 shrink-0" />
                    <span>{check.label}</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-600 text-white group-hover:scale-105 transition-transform">
                    {check.boost}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 rounded-2xl flex items-center gap-2 border border-emerald-100">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-900 font-semibold">
              All core career profile items are 100% complete! Your profile is actively prioritized in Employer Talent Search.
            </p>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex gap-1.5 p-1.5 bg-gray-100/90 rounded-2xl overflow-x-auto no-scrollbar w-full">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm min-h-[380px]">
        {/* 1. Identity & Personal Details */}
        {activeTab === 'personal' && (
          <div className="space-y-5">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <User size={16} className="text-emerald-600" /> Personal Identity &amp; Contact
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Basic contact information used for job applications and verified communication.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. Eswaran P"
                />
              </div>

              <div>
                <label className={labelCls}>Primary Phone Number *</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className={labelCls}>Email Address *</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. candidate@example.com"
                />
              </div>

              <div>
                <label className={labelCls}>Date of Birth</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Gender</label>
                <select
                  value={profile.gender}
                  onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                  className={inputCls}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className={labelCls}>District (Tamil Nadu) *</label>
                <select
                  value={profile.district}
                  onChange={e => setProfile(p => ({ ...p, district: e.target.value }))}
                  className={inputCls}
                >
                  {TN_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Address / Locality in Theni</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                  className={inputCls}
                  placeholder="Door No, Street Name, Town / Village (e.g. Cumbum Road, Theni)"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Professional Bio & Headline */}
        {activeTab === 'bio' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-600" /> Professional Headline &amp; Bio Builder
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Your headline and bio appear prominently in Employer Search, Digital ID, and your Portfolio.
              </p>
            </div>

            {/* Quick Templates */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Wand2 size={13} className="text-emerald-700" /> 1-Click Bio &amp; Headline Presets:
                </p>
                <span className="text-[10px] text-emerald-700 font-semibold">Click to apply</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BIO_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.role}
                    type="button"
                    onClick={() => {
                      setProfile(p => ({
                        ...p,
                        headline: tmpl.headline,
                        bio: tmpl.bio
                      }));
                      toast.success(`Applied ${tmpl.role} template!`);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-semibold hover:bg-emerald-600 hover:text-white transition-all shadow-xs cursor-pointer"
                  >
                    + {tmpl.role}
                  </button>
                ))}
              </div>
            </div>

            {/* Headline Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Professional Headline *</label>
                <span className="text-[11px] text-gray-400 font-mono">Appears under your name</span>
              </div>
              <input
                type="text"
                value={profile.headline}
                onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))}
                className={inputCls}
                placeholder="e.g. B.Com Graduate | Accounts &amp; Finance | Tally Prime | GST | Theni"
              />
            </div>

            {/* Bio Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={labelCls}>About Me / Professional Bio *</label>
                <span className="text-[11px] text-gray-400">{profile.bio.length} chars</span>
              </div>
              <textarea
                rows={5}
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                className={inputCls + " resize-none leading-relaxed"}
                placeholder="Write a brief career summary describing your expertise, years of experience, core tools/trades, and the specific opportunities you are seeking in Theni..."
              />
            </div>
          </div>
        )}

        {/* 3. Open to Work & Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Briefcase size={16} className="text-emerald-600" /> Open to Work &amp; Career Preferences
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Control your employment availability and salary/location expectations visible to recruiters.
              </p>
            </div>

            {/* Open to Work Switch Card */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Actively Open to Work
                </p>
                <p className="text-xs text-emerald-800">
                  When enabled, verified employers in Theni can invite you directly for interviews.
                </p>
              </div>
              <Switch
                checked={profile.isOpenToWork}
                onChange={next => setProfile(p => ({ ...p, isOpenToWork: next }))}
                label="Open to work"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Target Job Roles / Title</label>
                <input
                  type="text"
                  value={profile.targetRoles}
                  onChange={e => setProfile(p => ({ ...p, targetRoles: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. Accounts Executive, Billing Clerk, React Developer"
                />
              </div>

              <div>
                <label className={labelCls}>Expected Monthly Salary (₹)</label>
                <input
                  type="text"
                  value={profile.expectedSalary}
                  onChange={e => setProfile(p => ({ ...p, expectedSalary: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. ₹15,000 - ₹25,000 / month"
                />
              </div>

              <div>
                <label className={labelCls}>Notice Period / Availability</label>
                <select
                  value={profile.noticePeriod}
                  onChange={e => setProfile(p => ({ ...p, noticePeriod: e.target.value }))}
                  className={inputCls}
                >
                  {NOTICE_PERIODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Preferred Work Mode</label>
                <select
                  value={profile.workMode}
                  onChange={e => setProfile(p => ({ ...p, workMode: e.target.value }))}
                  className={inputCls}
                >
                  {WORK_MODES.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Preferred Locations / Taluks in Theni District</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {THENI_LOCALITIES.map(loc => {
                    const isSelected = profile.preferredLocations.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setProfile(p => ({
                            ...p,
                            preferredLocations: isSelected
                              ? p.preferredLocations.filter(l => l !== loc)
                              : [...p.preferredLocations, loc]
                          }));
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {loc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Skills & Levels */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Award size={16} className="text-emerald-600" /> Skills Profile &amp; Proficiency Levels
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Categorize your hard &amp; soft skills with proficiency levels (Beginner, Intermediate, Advanced).
              </p>
            </div>

            {/* Add Skill Box */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Skill Name</label>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    placeholder="e.g. Tally Prime, React, GST, Python, Excel..."
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Proficiency Level</label>
                  <select
                    value={newSkillLevel}
                    onChange={e => setNewSkillLevel(e.target.value as any)}
                    className={inputCls}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Category</label>
                  <select
                    value={newSkillCat}
                    onChange={e => setNewSkillCat(e.target.value as any)}
                    className={inputCls}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Business">Business / Finance</option>
                    <option value="Tools">Tools &amp; Software</option>
                    <option value="General">General / Soft Skills</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus size={14} /> Add Skill to Profile
                </button>
              </div>
            </div>

            {/* Current Skills with Levels */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-700">Your Added Skills ({skills.length}):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {skills.map((s, i) => {
                  const item = skillsWithLevels.find(swl => swl.name.toLowerCase() === s.toLowerCase());
                  const level = item?.level || 'Intermediate';
                  const cat = item?.category || 'General';

                  return (
                    <div
                      key={s}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white shadow-xs"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{s}</p>
                        <span className="text-[10px] text-gray-400 font-medium">{cat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={level}
                          onChange={e => updateSkillLevel(s, e.target.value as any)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSkill(i)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skill Suggestions */}
            <div>
              <p className="text-xs text-gray-500 font-bold mb-2">Quick Add Suggestions for Theni District:</p>
              <div className="flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 10).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSkills(p => [...p, s]);
                      setSkillsWithLevels(prev => [...prev, { name: s, level: 'Intermediate', category: 'General' }]);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. Career History & Experience */}
        {activeTab === 'experience' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase size={16} className="text-emerald-600" /> Career History &amp; Employment
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Chronological record of companies, roles, and responsibilities.</p>
              </div>
              <button
                type="button"
                onClick={addExperience}
                className={addBtnCls}
                style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}
              >
                <Plus size={13} /> Add Position
              </button>
            </div>

            <div className="space-y-4">
              {experience.map(exp => (
                <div key={exp.id} className={cardCls}>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3 pr-6">
                    <div>
                      <label className={labelCls}>Company / Employer Name</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. ABC Textiles / Tech Solutions"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Job Role / Designation</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={e => updateExperience(exp.id, 'role', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Senior Accounts Executive"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={e => updateExperience(exp.id, 'startDate', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>End Date (Leave blank if currently working)</label>
                      <input
                        type="month"
                        value={exp.endDate}
                        onChange={e => updateExperience(exp.id, 'endDate', e.target.value)}
                        className={inputCls}
                        placeholder="Present"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Role Summary &amp; Key Accomplishments</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                        className={inputCls + " resize-none"}
                        placeholder="Describe your daily responsibilities, tools handled, and key achievements..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {experience.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl p-6">
                  <Briefcase size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-600">No career history entries added yet.</p>
                  <p className="mt-1">Freshers can showcase their internships, academic projects, or volunteer work.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Education */}
        {activeTab === 'education' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <GraduationCap size={16} className="text-emerald-600" /> Education &amp; Academic Qualifications
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Degrees, diplomas, HSC, or vocational training credentials.</p>
              </div>
              <button
                type="button"
                onClick={addEducation}
                className={addBtnCls}
                style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}
              >
                <Plus size={13} /> Add Qualification
              </button>
            </div>

            <div className="space-y-4">
              {education.map(edu => (
                <div key={edu.id} className={cardCls}>
                  <button
                    type="button"
                    onClick={() => removeEducation(edu.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3 pr-6">
                    <div>
                      <label className={labelCls}>Institution / College / School</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={e => updateEducation(edu.id, 'institution', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. CPA College of Arts &amp; Science, Bodinayakanur"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Degree / Diploma / Standard</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. B.Com, B.Sc Computer Science, ITI"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Field of Study / Specialization</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={e => updateEducation(edu.id, 'field', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Accounts &amp; Finance, Software"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Passing Year</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={e => updateEducation(edu.id, 'year', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. 2024"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {education.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl p-6">
                  <GraduationCap size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-600">No education entries added yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Projects Showcase (Essential for Freshers) */}
        {activeTab === 'projects' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FolderGit2 size={16} className="text-emerald-600" /> Projects Showcase
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Demonstrate practical work, code samples, client work, or college projects.
                </p>
              </div>
              <button
                type="button"
                onClick={addProject}
                className={addBtnCls}
                style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}
              >
                <Plus size={13} /> Add Project
              </button>
            </div>

            <div className="space-y-4">
              {projects.map(prj => (
                <div key={prj.id} className={cardCls}>
                  <button
                    type="button"
                    onClick={() => removeProject(prj.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3 pr-6">
                    <div>
                      <label className={labelCls}>Project Title *</label>
                      <input
                        type="text"
                        value={prj.title}
                        onChange={e => updateProject(prj.id, 'title', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. GST Billing Software / Web Portal"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Your Role</label>
                      <input
                        type="text"
                        value={prj.role}
                        onChange={e => updateProject(prj.id, 'role', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Lead Developer / Accountant"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Technologies &amp; Tools Used</label>
                      <input
                        type="text"
                        value={prj.technologies}
                        onChange={e => updateProject(prj.id, 'technologies', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Tally Prime, Excel, React, Next.js, Firebase, Python"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Live Demo URL (Optional)</label>
                      <input
                        type="url"
                        value={prj.liveUrl}
                        onChange={e => updateProject(prj.id, 'liveUrl', e.target.value)}
                        className={inputCls}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className={labelCls}>GitHub / Source Link (Optional)</label>
                      <input
                        type="url"
                        value={prj.githubUrl}
                        onChange={e => updateProject(prj.id, 'githubUrl', e.target.value)}
                        className={inputCls}
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Description &amp; Highlights</label>
                      <textarea
                        rows={2}
                        value={prj.description}
                        onChange={e => updateProject(prj.id, 'description', e.target.value)}
                        className={inputCls + " resize-none"}
                        placeholder="Describe the problem solved, architecture, and results achieved..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl p-6">
                  <FolderGit2 size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-600">No projects added yet.</p>
                  <p className="mt-1">Adding at least 1 or 2 projects boosts fresher hiring callbacks by over 60%.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. Certifications & Achievements */}
        {activeTab === 'certifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Award size={16} className="text-emerald-600" /> Certifications &amp; Achievements
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Verified certificates, awards, and industry recognitions.</p>
              </div>
              <button
                type="button"
                onClick={addCertification}
                className={addBtnCls}
                style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}
              >
                <Plus size={13} /> Add Certificate
              </button>
            </div>

            <div className="space-y-4">
              {certifications.map(cert => (
                <div key={cert.id} className={cardCls}>
                  <button
                    type="button"
                    onClick={() => removeCertification(cert.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3 pr-6">
                    <div>
                      <label className={labelCls}>Certification Name</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={e => updateCertification(cert.id, 'name', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Tally Prime Certified Professional"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Issuing Body / Organization</label>
                      <input
                        type="text"
                        value={cert.organization}
                        onChange={e => updateCertification(cert.id, 'organization', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Tally Education / Google"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Issue Date / Year</label>
                      <input
                        type="month"
                        value={cert.date}
                        onChange={e => updateCertification(cert.id, 'date', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Certificate Link / Verification URL</label>
                      <input
                        type="url"
                        value={cert.link}
                        onChange={e => updateCertification(cert.id, 'link', e.target.value)}
                        className={inputCls}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {certifications.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl p-6">
                  <Award size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-gray-600">No certifications added yet.</p>
                </div>
              )}
            </div>

            {/* Achievements Sub-Section */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Key Career Achievements / Honors</h3>
                <button
                  type="button"
                  onClick={addAchievement}
                  className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  + Add Achievement
                </button>
              </div>

              {achievements.map(ach => (
                <div key={ach.id} className="p-3 rounded-xl border border-gray-200/80 bg-white space-y-2 relative">
                  <button
                    type="button"
                    onClick={() => removeAchievement(ach.id)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={ach.title}
                      onChange={e => updateAchievement(ach.id, 'title', e.target.value)}
                      placeholder="Achievement Title (e.g. Best Employee Award)"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={ach.organization}
                      onChange={e => updateAchievement(ach.id, 'organization', e.target.value)}
                      placeholder="Organization"
                      className={inputCls}
                    />
                    <input
                      type="text"
                      value={ach.year}
                      onChange={e => updateAchievement(ach.id, 'year', e.target.value)}
                      placeholder="Year (e.g. 2025)"
                      className={inputCls}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. Portfolio & Social Links */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Globe size={16} className="text-emerald-600" /> Portfolio Website &amp; Social Links
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Share your online presence (Personal Website, LinkedIn, GitHub, Behance, YouTube).
              </p>
            </div>

            {/* Links list */}
            <div className="space-y-2.5">
              {portfolio.map((link, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 bg-gray-50 group">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
                    <ExternalLink size={14} />
                  </div>
                  <span className="flex-1 text-xs text-blue-600 truncate font-semibold">{link}</span>
                  <button
                    type="button"
                    onClick={() => setPortfolio(p => p.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={newPortfolioLink}
                onChange={e => setNewPortfolioLink(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPortfolioLink()}
                placeholder="Paste portfolio or social link (https://...)"
                className={inputCls + " flex-1"}
              />
              <button
                type="button"
                onClick={addPortfolioLink}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 10. Privacy & Document Visibility Controls */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Shield size={16} className="text-emerald-600" /> Privacy &amp; Employer Contact Controls
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Prevent unsolicited outreach. Choose who can view your direct phone number, email, and resumes.
              </p>
            </div>

            <div className="space-y-4">
              {/* Profile Visibility */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-3">
                <label className={labelCls}>Profile Visibility Mode</label>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { value: 'public', title: 'Public (Anyone with link)', desc: 'Visible to anyone who scans your QR or has your portfolio URL.' },
                    { value: 'employers_only', title: 'Verified Employers Only', desc: 'Recommended: Only verified businesses on THENIJOBS can discover you.' },
                    { value: 'private', title: 'Private (Application Only)', desc: 'Only visible to companies when you explicitly apply to their job.' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        profile.privacySettings.profileVisibility === opt.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                          : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="profileVisibility"
                        value={opt.value}
                        checked={profile.privacySettings.profileVisibility === opt.value}
                        onChange={() => setProfile(p => ({
                          ...p,
                          privacySettings: { ...p.privacySettings, profileVisibility: opt.value as any }
                        }))}
                        className="hidden"
                      />
                      <p className="text-xs font-bold">{opt.title}</p>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal font-normal">{opt.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Direct Phone Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white">
                <div>
                  <p className="text-xs font-bold text-gray-900">Hide Direct Phone Number</p>
                  <p className="text-[11px] text-gray-500">
                    When enabled, employers must message or invite you through THENIJOBS rather than calling directly.
                  </p>
                </div>
                <Switch
                  checked={profile.privacySettings.hidePhone}
                  onChange={next => setProfile(p => ({
                    ...p,
                    privacySettings: { ...p.privacySettings, hidePhone: next }
                  }))}
                  label="Hide direct phone"
                />
              </div>

              {/* Direct Email Switch */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white">
                <div>
                  <p className="text-xs font-bold text-gray-900">Hide Direct Email Address</p>
                  <p className="text-[11px] text-gray-500">
                    Mask your email address on the public candidate portfolio website.
                  </p>
                </div>
                <Switch
                  checked={profile.privacySettings.hideEmail}
                  onChange={next => setProfile(p => ({
                    ...p,
                    privacySettings: { ...p.privacySettings, hideEmail: next }
                  }))}
                  label="Hide direct email"
                />
              </div>

              {/* Public Portfolio Page Toggle (₹50/year) */}
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Globe size={14} className="text-purple-700" /> Public Candidate Web Address (₹{SEEKER_PUBLIC_PROFILE_FEE_INR}/year)
                    </p>
                    <p className="text-[11px] text-purple-800">
                      Enables a standalone shareable website at <code className="bg-purple-100 px-1 py-0.5 rounded font-mono">thenijobs.com/portfolio/seeker/{user?.uid?.slice(0, 8) || 'id'}</code>
                    </p>
                  </div>
                  <Switch
                    checked={profile.isPortfolioPublic}
                    onChange={handleTogglePublicProfile}
                    label="Public portfolio website"
                  />
                </div>
                {hasValidPublicPayment && (
                  <p className="text-[10px] text-emerald-700 font-bold">
                    ✓ Public portfolio subscription is active until {new Date(publicProfilePaidUntil as number).toLocaleDateString('en-IN')}.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Save Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 font-bold text-sm hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Eye size={16} />
          <span>Live Device Preview</span>
        </button>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex-1 w-full py-4 rounded-2xl text-white font-bold text-base bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm cursor-pointer"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{saving ? 'Saving Changes...' : 'Save Career Profile'}</span>
        </button>
      </div>

      {/* Live Device Portfolio Preview Modal */}
      <DeviceLivePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`${profile.name || 'Job Seeker'} — Live Portfolio Preview`}
        publicUrl={user?.uid ? `/portfolio/seeker/${user.uid}` : '/portfolio/seeker/demo-seeker'}
      >
        <SeekerPortfolioClient
          initialData={{
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            district: profile.district,
            state: 'Tamil Nadu',
            currentRole: profile.headline || profile.currentRole,
            aboutMe: profile.bio,
            expectedSalary: profile.expectedSalary,
            preferredLocations: profile.preferredLocations,
            preferredMode: profile.workMode,
            availability: profile.noticePeriod,
            isOpenToWork: profile.isOpenToWork,
            isPortfolioPublic: profile.isPortfolioPublic,
            privacySettings: profile.privacySettings,
            photoUrl: profile.photoUrl,
            profilePhotoUrl: profile.photoUrl,
            gender: profile.gender,
            dob: profile.dob,
            skills: skills,
            languages: languages,
            education: education,
            experience: experience,
            projects: projects.map(p => ({
              id: p.id,
              title: p.title,
              role: p.role,
              description: p.description,
              techStack: p.technologies ? p.technologies.split(',').map(t => t.trim()) : [],
              liveUrl: p.liveUrl,
              githubUrl: p.githubUrl
            })),
            certifications: certifications,
            achievements: achievements,
            workSamples: portfolio.map((url, i) => ({ id: i.toString(), title: `Portfolio Link ${i + 1}`, type: 'link', url })),
          }}
        />
      </DeviceLivePreviewModal>

      <SeekerPublicProfileModal
        isOpen={showPublicProfileModal}
        onClose={() => setShowPublicProfileModal(false)}
        userId={user?.uid || ''}
        userName={profile.name}
        userEmail={profile.email}
        onActivated={() => {
          setProfile(p => ({ ...p, isPortfolioPublic: true }));
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          setPublicProfilePaidUntil(oneYearFromNow.getTime());
        }}
      />
    </div>
  );
}
