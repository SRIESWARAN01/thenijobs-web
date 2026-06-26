'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, Phone, Mail, MapPin, Camera, Briefcase, GraduationCap,
  Plus, X, Check, Save,
  Globe, Award, Star, Zap,
  CheckCircle, Circle, Languages, ExternalLink, Loader2, Bell
} from 'lucide-react';
import { THENI_LAUNCH_LOCATIONS } from '@/lib/types';
import { JOB_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useUploadFile } from '@/hooks/useStorage';
import { db } from '@/lib/firebase/config';
import { setDoc, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { buildPublicSeekerProfile } from '@/lib/publicProfile';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';


/** Skill categories and recommendations */
const SKILL_CATEGORIES = [
  {
    name: 'Driving & Transport',
    skills: [
      'Driving License (LMV)',
      'Two Wheeler Driving',
      'Four Wheeler Driving',
      'Heavy Vehicle Driving',
      'Delivery Management',
      'Route Planning',
      'Vehicle Maintenance'
    ]
  },
  {
    name: '💰 Accounting & Finance',
    skills: [
      'Tally ERP',
      'Tally Prime',
      'GST Filing',
      'Income Tax Filing',
      'Accounting',
      'Bookkeeping',
      'Payroll Processing',
      'Financial Reporting',
      'Banking Operations',
      'Auditing',
      'Taxation',
      'Budget Management',
      'Accounts Receivable',
      'Accounts Payable'
    ]
  },
  {
    name: '💻 Computer Skills',
    skills: [
      'MS Word',
      'MS Excel',
      'MS PowerPoint',
      'MS Office',
      'Google Sheets',
      'Google Docs',
      'Data Entry',
      'Typing (English)',
      'Typing (Tamil)',
      'Internet Browsing',
      'Email Management',
      'PDF Editing',
      'Computer Hardware',
      'Computer Networking'
    ]
  },
  {
    name: '📊 Office Administration',
    skills: [
      'Office Management',
      'Documentation',
      'File Management',
      'Record Keeping',
      'Calendar Management',
      'Meeting Coordination',
      'Reception Handling',
      'Administrative Support'
    ]
  },
  {
    name: '📞 Customer Service',
    skills: [
      'Customer Support',
      'Customer Relationship Management (CRM)',
      'Call Handling',
      'Telecalling',
      'Help Desk Support',
      'Complaint Resolution',
      'Client Communication'
    ]
  },
  {
    name: '🗣️ Communication Skills',
    skills: [
      'English Speaking',
      'Tamil Speaking',
      'Hindi Speaking',
      'Public Speaking',
      'Verbal Communication',
      'Written Communication',
      'Presentation Skills',
      'Negotiation Skills'
    ]
  },
  {
    name: '👥 Soft Skills',
    skills: [
      'Team Work',
      'Leadership',
      'Problem Solving',
      'Time Management',
      'Critical Thinking',
      'Decision Making',
      'Adaptability',
      'Creativity',
      'Multitasking',
      'Self Motivation',
      'Work Ethics',
      'Conflict Resolution'
    ]
  },
  {
    name: '🏭 Manufacturing & Production',
    skills: [
      'Machine Operation',
      'Quality Control',
      'Production Planning',
      'Assembly Line Work',
      'CNC Operation',
      'Welding',
      'Fabrication',
      'Packaging',
      'Inventory Control'
    ]
  },
  {
    name: '🛒 Sales & Marketing',
    skills: [
      'Sales Management',
      'Retail Sales',
      'Field Sales',
      'Digital Marketing',
      'Social Media Marketing',
      'SEO',
      'Lead Generation',
      'Business Development',
      'Market Research',
      'Branding'
    ]
  },
  {
    name: '🏗️ Technical Skills',
    skills: [
      'Electrical Maintenance',
      'Mechanical Maintenance',
      'AutoCAD',
      'PLC Programming',
      'HVAC Systems',
      'Solar Installation',
      'Electronics Repair',
      'Mobile Repairing'
    ]
  },
  {
    name: '👨‍🍳 Hospitality & Service',
    skills: [
      'Cooking',
      'Food Preparation',
      'Housekeeping',
      'Hotel Management',
      'Front Office Operations',
      'Restaurant Service',
      'Catering Management'
    ]
  },
  {
    name: '🏥 Healthcare',
    skills: [
      'Nursing Assistance',
      'Patient Care',
      'Medical Coding',
      'Medical Billing',
      'Pharmacy Assistance',
      'Laboratory Assistance'
    ]
  },
  {
    name: '📦 Logistics & Warehouse',
    skills: [
      'Inventory Management',
      'Warehouse Operations',
      'Supply Chain Management',
      'Forklift Operation',
      'Stock Management',
      'Dispatch Management'
    ]
  },
  {
    name: '👷 Construction',
    skills: [
      'Masonry',
      'Carpentry',
      'Plumbing',
      'Painting',
      'Electrical Wiring',
      'Site Supervision',
      'Civil Construction'
    ]
  },
  {
    name: '👨‍💻 IT & Software',
    skills: [
      'Flutter Development',
      'Android Development',
      'Web Development',
      'Firebase',
      'HTML',
      'CSS',
      'JavaScript',
      'React',
      'Node.js',
      'Python',
      'Java',
      'PHP',
      'SQL',
      'UI/UX Design',
      'Graphic Design'
    ]
  }
];

const LANGUAGE_OPTIONS = ['Tamil', 'English', 'Hindi', 'Telugu', 'Malayalam', 'Kannada', 'Urdu', 'Sanskrit', 'French'];

interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  year: string;
}

interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface AchievementEntry {
  id: string;
  name: string;
  description: string;
}

interface CertificationEntry {
  id: string;
  name: string;
  organization: string;
  date: string;
  link: string;
}

interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  technologies: string;
  url: string;
}

type TabKey = 'personal' | 'education' | 'experience' | 'skills' | 'languages' | 'certifications' | 'portfolio' | 'projects' | 'achievements' | 'preferences';

const DEFAULT_PROFILE = {
  name: '',
  dob: '',
  gender: 'Male',
  phone: '',
  email: '',
  address: '',
  district: '',
  currentRole: '',
  isOpenToWork: true,
  photoUrl: '',
  expectedSalary: '',
  linkedin: '',
  website: '',
  aboutMe: ''
};

export default function SeekerProfilePage() {
  const { user } = useAuth();
  
  // 1. Fetch profile from Firestore
  const { data: remoteProfile, loading: profileLoading } = useDocument<any>('seekerProfiles', user?.uid);

  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementEntry[]>([]);
  const [preferences, setPreferences] = useState({
    categories: [] as string[],
    locations: [] as string[],
    jobTypes: [] as string[],
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
  });

  const [newSkill, setNewSkill] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Auto save states and refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [saving, setSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();

  // Cropper states
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);

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
        district: remoteProfile.district || '',
        currentRole: remoteProfile.currentRole || '',
        isOpenToWork: remoteProfile.isOpenToWork !== false,
        photoUrl: remoteProfile.photoUrl || '',
        expectedSalary: remoteProfile.expectedSalary || '',
        linkedin: remoteProfile.linkedin || '',
        website: remoteProfile.website || '',
        aboutMe: remoteProfile.aboutMe || ''
      });
      setEducation(remoteProfile.education || []);
      setExperience(remoteProfile.experience || []);
      setSkills(remoteProfile.skills || []);
      setLanguages(remoteProfile.languages || []);
      setCertifications(remoteProfile.certifications || []);
      setPortfolio(remoteProfile.portfolio || []);
      setProjects(remoteProfile.projects || []);
      setAchievements(remoteProfile.achievements || []);
      setPreferences(remoteProfile.preferences || {
        categories: [],
        locations: [],
        jobTypes: [],
        experienceLevel: '',
        salaryMin: '',
        salaryMax: '',
      });
      setTimeout(() => {
        isLoaded.current = true;
      }, 500);
    } else if (user) {
      setProfile(p => ({
        ...p,
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
      setPreferences({
        categories: [],
        locations: [],
        jobTypes: [],
        experienceLevel: '',
        salaryMin: '',
        salaryMax: '',
      });
      setTimeout(() => {
        isLoaded.current = true;
      }, 500);
    }
  }, [remoteProfile, user]);

  // ── Profile Strength ──
  const strengthItems = [
    { label: 'Photo uploaded', done: !!profile.photoUrl },
    { label: 'Contact details', done: !!profile.phone && !!profile.email },
    { label: 'Education added', done: education.length > 0 },
    { label: 'Experience added', done: experience.length > 0 },
    { label: 'Skills added', done: skills.length >= 3 },
    { label: 'Languages selected', done: languages.length > 0 },
    { label: 'Certifications', done: certifications.length > 0 },
    { label: 'Portfolio links', done: portfolio.length > 0 },
    { label: 'About Me summary', done: !!profile.aboutMe },
    { label: 'Achievements listed', done: achievements.length > 0 },
  ];
  const profileStrength = Math.round((strengthItems.filter(i => i.done).length / strengthItems.length) * 100);

  // Debounced auto-save effect for Job Seeker Profile
  useEffect(() => {
    if (!isLoaded.current || !user?.uid) return;

    setAutoSaveStatus('saving');
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const profileData = {
          name: profile.name,
          dob: profile.dob,
          gender: profile.gender,
          phone: profile.phone,
          email: profile.email,
          address: profile.address,
          district: profile.district,
          currentRole: profile.currentRole,
          isOpenToWork: profile.isOpenToWork,
          photoUrl: profile.photoUrl || '',
          expectedSalary: profile.expectedSalary,
          linkedin: profile.linkedin,
          website: profile.website,
          aboutMe: profile.aboutMe,
          education,
          experience,
          skills,
          languages,
          certifications,
          achievements,
          portfolio,
          projects,
          profileStrength,
          preferences,
          updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, 'seekerProfiles', user.uid), profileData, { merge: true });

        // Sync to publicProfiles
        await setDoc(doc(db, 'publicProfiles', user.uid), {
          ...buildPublicSeekerProfile(user.uid, profileData, user),
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Sync key details back to users collection
        await setDoc(doc(db, 'users', user.uid), {
          displayName: profile.name,
          email: profile.email,
          phone: profile.phone,
          district: profile.district,
          photoURL: profile.photoUrl || '',
          updatedAt: serverTimestamp()
        }, { merge: true });

        setAutoSaveStatus('saved');
        setTimeout(() => {
          setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
        }, 2000);
      } catch (err) {
        console.error('Background auto-save failed:', err);
        setAutoSaveStatus('error');
      }
    }, 1500);

    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [
    profile, education, experience, skills, languages,
    certifications, achievements, portfolio, projects, profileStrength, preferences, user?.uid
  ]);

  // ── Handlers ──
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(s => [...s, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const addEducation = () => {
    setEducation(e => [...e, { id: Date.now().toString(), institution: '', degree: '', field: '', year: '' }]);
  };

  const removeEducation = (id: string) => {
    setEducation(e => e.filter(item => item.id !== id));
  };

  const updateEducation = (id: string, key: keyof EducationEntry, value: string) => {
    setEducation(e => e.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addProject = () => {
    setProjects(p => [...p, { id: Date.now().toString(), title: '', description: '', technologies: '', url: '' }]);
  };

  const removeProject = (id: string) => {
    setProjects(p => p.filter(item => item.id !== id));
  };

  const updateProject = (id: string, key: keyof ProjectEntry, value: string) => {
    setProjects(p => p.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addExperience = () => {
    setExperience(e => [...e, { id: Date.now().toString(), company: '', role: '', startDate: '', endDate: '', description: '' }]);
  };

  const removeExperience = (id: string) => {
    setExperience(e => e.filter(item => item.id !== id));
  };

  const updateExperience = (id: string, key: keyof ExperienceEntry, value: string) => {
    setExperience(e => e.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addCertification = () => {
    setCertifications(c => [...c, { id: Date.now().toString(), name: '', organization: '', date: '', link: '' }]);
  };

  const removeCertification = (id: string) => {
    setCertifications(c => c.filter(item => item.id !== id));
  };

  const updateCertification = (id: string, key: keyof CertificationEntry, value: string) => {
    setCertifications(c => c.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addAchievement = () => {
    setAchievements(a => [...a, { id: Date.now().toString(), name: '', description: '' }]);
  };

  const removeAchievement = (id: string) => {
    setAchievements(a => a.filter(item => item.id !== id));
  };

  const updateAchievement = (id: string, key: keyof AchievementEntry, value: string) => {
    setAchievements(a => a.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addPortfolioLink = () => {
    if (newPortfolioLink.trim()) {
      setPortfolio(p => [...p, newPortfolioLink.trim()]);
      setNewPortfolioLink('');
    }
  };

  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setShowCropper(true);
    if (e.target) e.target.value = '';
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    if (!profile.name || !profile.email || !profile.phone) {
      alert('Please fill in Name, Email, and Phone number.');
      return;
    }
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaving(true);
    try {
      let candidateId = remoteProfile?.candidateId || null;

      if (profileStrength >= 80 && !candidateId) {
        try {
          const counterRef = doc(db, 'counters', 'seekerIds');
          const generatedId = await runTransaction(db, async (transaction) => {
            const counterSnap = await transaction.get(counterRef);
            let nextNum = 1;
            if (counterSnap.exists()) {
              nextNum = (counterSnap.data().currentId || 0) + 1;
            }
            const paddedNum = String(nextNum).padStart(6, '0');
            const newId = `TJ-${paddedNum}`;
            
            transaction.set(counterRef, { currentId: nextNum }, { merge: true });
            return newId;
          });
          candidateId = generatedId;
        } catch (txErr) {
          console.error('Failed to generate candidate ID:', txErr);
        }
      }

      const profileData = {
        ...profile,
        education,
        experience,
        skills,
        languages,
        certifications,
        achievements,
        portfolio,
        projects,
        profileStrength,
        preferences,
        updatedAt: serverTimestamp(),
        ...(candidateId ? { candidateId } : {})
      };

      // Write to seekerProfiles
      await setDoc(doc(db, 'seekerProfiles', user.uid), profileData, { merge: true });

      await setDoc(doc(db, 'publicProfiles', user.uid), {
        ...buildPublicSeekerProfile(user.uid, profileData, user),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Sync key details back to users collection
      await setDoc(doc(db, 'users', user.uid), {
        displayName: profile.name,
        email: profile.email,
        phone: profile.phone,
        district: profile.district,
        photoURL: profile.photoUrl || '',
        updatedAt: serverTimestamp(),
        ...(candidateId ? { candidateId } : {})
      }, { merge: true });

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
      alert('Profile saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile details.');
      setAutoSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'personal', label: 'Personal', icon: User },
    { key: 'education', label: 'Education', icon: GraduationCap },
    { key: 'experience', label: 'Experience', icon: Briefcase },
    { key: 'skills', label: 'Skills', icon: Star },
    { key: 'languages', label: 'Languages', icon: Languages },
    { key: 'certifications', label: 'Certifications', icon: Award },
    { key: 'achievements', label: 'Achievements', icon: Star },
    { key: 'portfolio', label: 'Portfolio', icon: Globe },
    { key: 'projects', label: 'Projects', icon: Briefcase },
    { key: 'preferences', label: 'Job Preferences', icon: Bell },
  ];

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-outfit text-white">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading your profile...</p>
      </div>
    );
  }

  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AS';

  return (
    <div className="animate-fade-in-up space-y-6 max-w-4xl mx-auto font-outfit text-white">
      {/* Auto saving progress notification */}
      {autoSaveStatus !== 'idle' && (
        <div className={`glass-card rounded-2xl p-4 border flex items-center gap-3 transition-all ${
          autoSaveStatus === 'saving' 
            ? 'border-amber-500/20 bg-amber-500/5 text-amber-450' 
            : autoSaveStatus === 'saved' 
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
            : 'border-rose-500/20 bg-rose-500/5 text-rose-450'
        }`}>
          {autoSaveStatus === 'saving' ? (
            <Loader2 size={18} className="animate-spin text-amber-400" />
          ) : autoSaveStatus === 'saved' ? (
            <CheckCircle size={18} className="text-emerald-400" />
          ) : (
            <CheckCircle size={18} className="text-rose-400" />
          )}
          <span className="text-xs font-semibold">
            {autoSaveStatus === 'saving' ? 'Saving changes in background...' : autoSaveStatus === 'saved' ? 'Saved Successfully' : 'Background Save Error'}
          </span>
        </div>
      )}

      {/* Uploading progress notification */}
      {uploading && (
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
          <Loader2 size={18} className="text-emerald-400 animate-spin" />
          <span className="text-xs text-gray-300">Uploading avatar... {uploadProgress}%</span>
        </div>
      )}

      {/* ═══ Profile Header ═══ */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0 self-center sm:self-start">
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
              {profile.photoUrl ? (
                <Image src={profile.photoUrl} alt="Avatar" fill sizes="96px" className="object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl bg-violet-600 border-2 border-[#0a0a1a] flex items-center justify-center hover:bg-violet-500 transition-colors"
            >
              <Camera size={14} className="text-white" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-outfit font-bold text-white">{profile.name || 'Set Your Name'}</h1>
                <p className="text-emerald-400 text-sm font-medium">{profile.currentRole || 'Specify Current Role'}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                  <MapPin size={11} /> {profile.district || 'Select district'}, Tamil Nadu
                </div>
              </div>
              {/* Open to Work Toggle */}
              <div className="flex flex-col items-start sm:items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-400">Open to Work</span>
                  <div
                    onClick={() => setProfile(p => ({ ...p, isOpenToWork: !p.isOpenToWork }))}
                    className={`w-10 h-[22px] rounded-full relative transition-all cursor-pointer ${profile.isOpenToWork ? 'bg-emerald-500' : 'bg-white/20'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all ${profile.isOpenToWork ? 'left-[22px]' : 'left-[3px]'}`} />
                  </div>
                </label>
                {profile.isOpenToWork && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold">
                    ● Open to Work
                  </span>
                )}
              </div>
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Phone size={11} /> {profile.phone || 'No phone number'}</span>
              <span className="flex items-center gap-1"><Mail size={11} /> {profile.email}</span>
            </div>
            {user?.uid && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/profile?uid=${user.uid}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/[0.08]"
                >
                  <ExternalLink size={13} /> Portfolio
                </Link>
                <Link
                  href={`/id?uid=${user.uid}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/15"
                >
                  <CheckCircle size={13} /> Digital ID
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Profile Strength ═══ */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <Zap size={15} className="text-emerald-400" /> Profile Strength
          </h2>
          <span className={`text-sm font-bold ${profileStrength >= 80 ? 'text-emerald-400' : profileStrength >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
            {profileStrength}%
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
            style={{ width: `${profileStrength}%` }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {strengthItems.map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs">
              {item.done ? (
                <CheckCircle size={13} className="text-emerald-400 shrink-0" />
              ) : (
                <Circle size={13} className="text-gray-600 shrink-0" />
              )}
              <span className={item.done ? 'text-gray-300' : 'text-gray-600'}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:bg-white/[0.06] hover:text-gray-300'
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══ Tab Content ═══ */}
      <div className="glass-card rounded-2xl p-5">
        {/* ── Personal Details ── */}
        {activeTab === 'personal' && (
          <div>
            <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-5">
              <User size={15} className="text-emerald-400" /> Personal Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text' },
                { key: 'dob', label: 'Date of Birth', type: 'date' },
                { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                { key: 'phone', label: 'Phone Number', type: 'tel' },
                { key: 'email', label: 'Email Address', type: 'email' },
                { key: 'currentRole', label: 'Current Role', type: 'text' },
                { key: 'expectedSalary', label: 'Expected Salary (Monthly in ₹)', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-gray-400 block mb-1.5">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={(profile as any)[field.key]}
                      onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                      className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                    >
                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={(profile as any)[field.key]}
                      onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))}
                      className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                    />
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 block mb-1.5">Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                  className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Area / Town</label>
                <select
                  value={profile.district}
                  onChange={e => setProfile(p => ({ ...p, district: e.target.value }))}
                  className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                >
                  <option value="">Select area</option>
                  {THENI_LAUNCH_LOCATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-400 block mb-1.5">About Me</label>
                <textarea
                  rows={4}
                  value={profile.aboutMe || ''}
                  onChange={e => setProfile(p => ({ ...p, aboutMe: e.target.value }))}
                  placeholder="Tell employers about your goals, professional summary, and background..."
                  className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Education ── */}
        {activeTab === 'education' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <GraduationCap size={15} className="text-emerald-400" /> Education
              </h2>
              <button onClick={addEducation} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-all">
                <Plus size={12} /> Add Education
              </button>
            </div>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative group">
                  <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Institution</label>
                      <input type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="Institution name" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Degree</label>
                      <input type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. B.Sc, 12th Standard" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Field of Study</label>
                      <input type="text" value={edu.field} onChange={e => updateEducation(edu.id, 'field', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. Computer Science" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Year</label>
                      <input type="text" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. 2020" />
                    </div>
                  </div>
                </div>
              ))}
              {education.length === 0 && (
                <div className="text-center py-10 text-gray-600 text-sm">
                  <GraduationCap size={32} className="mx-auto mb-2 opacity-40" />
                  No education entries yet. Click &quot;Add Education&quot; to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Experience ── */}
        {activeTab === 'experience' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Briefcase size={15} className="text-emerald-400" /> Work Experience
              </h2>
              <button onClick={addExperience} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 transition-all">
                <Plus size={12} /> Add Experience
              </button>
            </div>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative group">
                  <button onClick={() => removeExperience(exp.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Company</label>
                      <input type="text" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="Company name" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Role / Title</label>
                      <input type="text" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. Web Developer" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                      <input type="text" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. 2022-06" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">End Date</label>
                      <input type="text" value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="Present or 2024-05" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Description</label>
                      <textarea rows={2} value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22] resize-none" placeholder="Describe your responsibilities..." />
                    </div>
                  </div>
                </div>
              ))}
              {experience.length === 0 && (
                <div className="text-center py-10 text-gray-600 text-sm">
                  <Briefcase size={32} className="mx-auto mb-2 opacity-40" />
                  No experience entries yet. Click &quot;Add Experience&quot; to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Skills ── */}
        {activeTab === 'skills' && (
          <div>
            <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-5">
              <Star size={15} className="text-emerald-400" /> Skills
            </h2>
            {/* Current Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-sm font-medium">
                  {s}
                  <button onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))} className="hover:text-rose-400 transition-colors"><X size={11} /></button>
                </span>
              ))}
            </div>

            {/* Add Skill with Autocomplete and Categories Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={e => {
                    setNewSkill(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                      setShowDropdown(false);
                    }
                  }}
                  placeholder="Search skills (e.g. driving, tally, Excel) or type to add custom..."
                  className="search-input flex-1 px-3 py-2.5 text-sm bg-[#0e0e22]"
                />
                <button onClick={() => { addSkill(); setShowDropdown(false); }} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  <Plus size={15} />
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-[#0d0d21] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto p-3 space-y-2 backdrop-blur-xl">
                  {newSkill.trim() ? (
                    (() => {
                      const query = newSkill.toLowerCase().trim();
                      const filtered: { skill: string; category: string }[] = [];
                      SKILL_CATEGORIES.forEach(cat => {
                        cat.skills.forEach(s => {
                          if (s.toLowerCase().includes(query)) {
                            filtered.push({ skill: s, category: cat.name });
                          }
                        });
                      });

                      const exactMatch = filtered.some(item => item.skill.toLowerCase() === query);

                      return (
                        <div className="space-y-1">
                          {filtered.length > 0 ? (
                            filtered.map(item => {
                              const isAdded = skills.includes(item.skill);
                              return (
                                <button
                                  key={item.skill}
                                  onClick={() => {
                                    if (!isAdded) {
                                      setSkills(p => [...p, item.skill]);
                                    }
                                    setNewSkill('');
                                    setShowDropdown(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                                    isAdded
                                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                      : 'hover:bg-white/5 text-gray-300'
                                  }`}
                                >
                                  <div>
                                    <span className="font-medium text-white">{item.skill}</span>
                                    <span className="text-[10px] text-gray-500 block">{item.category}</span>
                                  </div>
                                  {isAdded ? <Check size={12} className="text-emerald-400" /> : <Plus size={12} className="text-gray-500" />}
                                </button>
                              );
                            })
                          ) : (
                            <div className="text-center py-4 text-xs text-gray-500">
                              No matching skills found in recommendations.
                            </div>
                          )}

                          {!exactMatch && (
                            <button
                              onClick={() => {
                                addSkill();
                                setShowDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left text-emerald-400 hover:bg-emerald-500/10 transition-all font-semibold border border-dashed border-emerald-500/30 mt-2"
                            >
                              <Plus size={12} /> Add custom skill: &quot;{newSkill.trim()}&quot;
                            </button>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 px-1 mb-2 uppercase tracking-wider font-semibold">Recommended Skill Categories</p>
                      {SKILL_CATEGORIES.map(cat => {
                        const isExpanded = activeCategory === cat.name;
                        const addedCount = cat.skills.filter(s => skills.includes(s)).length;
                        return (
                          <div key={cat.name} className="border-b border-white/[0.04] last:border-0 pb-1">
                            <button
                              type="button"
                              onClick={() => setActiveCategory(isExpanded ? null : cat.name)}
                              className="w-full flex items-center justify-between py-2 px-2 rounded-xl hover:bg-white/[0.02] text-xs text-gray-300 font-medium text-left transition-colors"
                            >
                              <span>{cat.name}</span>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                {addedCount > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/10">
                                    {addedCount} added
                                  </span>
                                )}
                                <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="grid grid-cols-2 gap-1.5 p-2 mt-1 bg-white/[0.01] rounded-xl border border-white/[0.03]">
                                {cat.skills.map(s => {
                                  const isAdded = skills.includes(s);
                                  return (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => {
                                        if (!isAdded) {
                                          setSkills(p => [...p, s]);
                                        } else {
                                          setSkills(p => p.filter(item => item !== s));
                                        }
                                      }}
                                      className={`flex items-center justify-between p-2 rounded-lg text-[11px] text-left transition-all ${
                                        isAdded
                                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium'
                                          : 'bg-[#0a0a1a]/50 text-gray-400 hover:text-white hover:bg-white/5 border border-white/[0.04]'
                                      }`}
                                    >
                                      <span className="truncate pr-1">{s}</span>
                                      {isAdded ? (
                                        <Check size={10} className="text-emerald-400 shrink-0" />
                                      ) : (
                                        <Plus size={10} className="text-gray-500 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Languages ── */}
        {activeTab === 'languages' && (
          <div>
            <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-5">
              <Languages size={15} className="text-emerald-400" /> Languages
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANGUAGE_OPTIONS.map(lang => {
                const isSelected = languages.includes(lang);
                return (
                  <label
                    key={lang}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:border-white/[0.12]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setLanguages(prev =>
                          isSelected ? prev.filter(l => l !== lang) : [...prev, lang]
                        );
                      }}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium">{lang}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Certifications ── */}
        {activeTab === 'certifications' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Award size={15} className="text-emerald-400" /> Certifications
              </h2>
              <button onClick={addCertification} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-all">
                <Plus size={12} /> Add Certification
              </button>
            </div>
            <div className="space-y-4">
              {certifications.map(cert => (
                <div key={cert.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative group">
                  <button onClick={() => removeCertification(cert.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Certification Name</label>
                      <input type="text" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. Google Analytics" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Organization</label>
                      <input type="text" value={cert.organization} onChange={e => updateCertification(cert.id, 'organization', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. Google" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Date</label>
                      <input type="month" value={cert.date} onChange={e => updateCertification(cert.id, 'date', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Certificate Link (Optional)</label>
                      <input type="url" value={cert.link} onChange={e => updateCertification(cert.id, 'link', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
              {certifications.length === 0 && (
                <div className="text-center py-10 text-gray-600 text-sm">
                  <Award size={32} className="mx-auto mb-2 opacity-40" />
                  No certifications yet. Add your professional certifications.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Achievements ── */}
        {activeTab === 'achievements' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Star size={15} className="text-emerald-400" /> Achievements & Awards
              </h2>
              <button onClick={addAchievement} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-all">
                <Plus size={12} /> Add Achievement
              </button>
            </div>
            <div className="space-y-4">
              {achievements.map(ach => (
                <div key={ach.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative group">
                  <button onClick={() => removeAchievement(ach.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Achievement Title *</label>
                      <input type="text" required value={ach.name} onChange={e => updateAchievement(ach.id, 'name', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. Employee of the Month, 1st Place in Theni Hackathon" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Description / Organization</label>
                      <input type="text" value={ach.description} onChange={e => updateAchievement(ach.id, 'description', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. Awarded by ABC Technologies, recognition for outstanding sales growth" />
                    </div>
                  </div>
                </div>
              ))}
              {achievements.length === 0 && (
                <div className="text-center py-10 text-gray-600 text-sm">
                  <Star size={32} className="mx-auto mb-2 opacity-40 text-amber-400" />
                  No achievements listed yet. Click &quot;Add Achievement&quot; to show off your awards.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Portfolio ── */}
        {activeTab === 'portfolio' && (
          <div>
            <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-5">
              <Globe size={15} className="text-emerald-400" /> Portfolio & Links
            </h2>
            <div className="space-y-3 mb-4">
              {portfolio.map((link, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] group">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                    <ExternalLink size={15} className="text-cyan-400" />
                  </div>
                  <span className="flex-1 text-sm text-cyan-300 truncate">{link}</span>
                  <button
                    onClick={() => setPortfolio(p => p.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
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
                placeholder="Add portfolio URL..."
                className="search-input flex-1 px-3 py-2.5 text-sm bg-[#0e0e22]"
              />
              <button onClick={addPortfolioLink} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                <Plus size={15} />
              </button>
            </div>

            {/* LinkedIn & Personal Website Inputs */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/[0.06] mb-6">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">LinkedIn Profile Link</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={profile.linkedin || ''}
                  onChange={e => setProfile(p => ({ ...p, linkedin: e.target.value }))}
                  className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Personal Website / Portfolio Link</label>
                <input
                  type="url"
                  placeholder="https://mywebsite.com"
                  value={profile.website || ''}
                  onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                  className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Projects ── */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                <Briefcase size={15} className="text-emerald-400" /> Projects
              </h2>
              <button onClick={addProject} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-all">
                <Plus size={12} /> Add Project
              </button>
            </div>
            <div className="space-y-4">
              {projects.map(proj => (
                <div key={proj.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative group">
                  <button onClick={() => removeProject(proj.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Project Title</label>
                      <input type="text" value={proj.title} onChange={e => updateProject(proj.id, 'title', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="e.g. E-Commerce Website" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Project URL (Optional)</label>
                      <input type="url" value={proj.url} onChange={e => updateProject(proj.id, 'url', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="https://..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Technologies Used (e.g. React, Firebase)</label>
                      <input type="text" value={proj.technologies} onChange={e => updateProject(proj.id, 'technologies', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="React, Node.js, TailwindCSS" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500 block mb-1">Description</label>
                      <textarea rows={2} value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22] resize-none" placeholder="Describe what you built..." />
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-10 text-gray-600 text-sm">
                  <Briefcase size={32} className="mx-auto mb-2 opacity-40" />
                  No projects added yet. Click &quot;Add Project&quot; to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Job Preferences ── */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-5">
              <Bell size={15} className="text-emerald-400" /> Job Preferences
            </h2>
            
            {/* Preferred Job Categories */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 block">Preferred Job Categories</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {JOB_CATEGORIES.map((cat) => {
                  const isChecked = preferences.categories?.includes(cat);
                  return (
                    <label key={cat} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const list = preferences.categories || [];
                          const next = e.target.checked 
                            ? [...list, cat] 
                            : list.filter(c => c !== cat);
                          setPreferences(p => ({ ...p, categories: next }));
                        }}
                        className="hidden"
                      />
                      {isChecked ? <CheckCircle size={14} className="text-emerald-400 shrink-0" /> : <Circle size={14} className="text-gray-600 shrink-0" />}
                      <span className="truncate">{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Preferred Locations */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 block">Preferred Locations (Towns in Theni)</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {THENI_LAUNCH_LOCATIONS.map((loc) => {
                  const isChecked = preferences.locations?.includes(loc);
                  return (
                    <label key={loc} className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isChecked 
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
                        : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
                    }`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const list = preferences.locations || [];
                          const next = e.target.checked 
                            ? [...list, loc] 
                            : list.filter(l => l !== loc);
                          setPreferences(p => ({ ...p, locations: next }));
                        }}
                        className="hidden"
                      />
                      {isChecked ? <CheckCircle size={14} className="text-cyan-400 shrink-0" /> : <Circle size={14} className="text-gray-600 shrink-0" />}
                      <span>{loc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Job Types */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-gray-400 block">Preferred Employment Types</label>
                <div className="space-y-2">
                  {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map((type) => {
                    const isChecked = preferences.jobTypes?.includes(type);
                    return (
                      <label key={type} className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' 
                          : 'bg-white/[0.02] border-white/[0.06] text-gray-400 hover:bg-white/[0.04]'
                      }`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const list = preferences.jobTypes || [];
                            const next = e.target.checked 
                              ? [...list, type] 
                              : list.filter(t => t !== type);
                            setPreferences(p => ({ ...p, jobTypes: next }));
                          }}
                          className="hidden"
                        />
                        {isChecked ? <CheckCircle size={14} className="text-violet-400 shrink-0" /> : <Circle size={14} className="text-gray-600 shrink-0" />}
                        <span>{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Experience Level & Salary Range */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 block">Preferred Experience Level</label>
                  <select
                    value={preferences.experienceLevel || ''}
                    onChange={(e) => setPreferences(p => ({ ...p, experienceLevel: e.target.value }))}
                    className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                  >
                    <option value="">Select Experience Level</option>
                    <option value="Fresher">Fresher (No Experience)</option>
                    <option value="1-2 Years">1-2 Years</option>
                    <option value="3-5 Years">3-5 Years</option>
                    <option value="5-10 Years">5-10 Years</option>
                    <option value="10+ Years">10+ Years</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 block">Expected Monthly Salary Range (₹)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        placeholder="Min Salary"
                        value={preferences.salaryMin || ''}
                        onChange={(e) => setPreferences(p => ({ ...p, salaryMin: e.target.value }))}
                        className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        placeholder="Max Salary"
                        value={preferences.salaryMax || ''}
                        onChange={(e) => setPreferences(p => ({ ...p, salaryMax: e.target.value }))}
                        className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Save Button ═══ */}
      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 size={18} className="animate-spin text-white" /> : <Save size={18} />}
        {saving ? 'Saving Profile...' : 'Save Profile'}
      </button>

      <ImageCropperModal
        open={showCropper}
        onClose={() => {
          setShowCropper(false);
          setCropFile(null);
        }}
        file={cropFile}
        aspectRatio={1}
        cropWidth={400}
        cropHeight={400}
        isCircular={true}
        title="Crop Profile Picture"
        uploadPath={user?.uid ? `seekers/${user.uid}/avatar_${Date.now()}` : undefined}
        onUploadComplete={async (url) => {
          try {
            if (!user?.uid) return;
            setProfile(p => ({ ...p, photoUrl: url }));

            // Save immediately to Firestore so it is stored permanently without requiring a full save profile click
            await setDoc(doc(db, 'seekerProfiles', user.uid), {
              photoUrl: url,
              updatedAt: serverTimestamp()
            }, { merge: true });

            await setDoc(doc(db, 'users', user.uid), {
              photoURL: url,
              updatedAt: serverTimestamp()
            }, { merge: true });

            const updatedProfileData = {
              name: profile.name,
              dob: profile.dob,
              gender: profile.gender,
              phone: profile.phone,
              email: profile.email,
              address: profile.address,
              district: profile.district,
              currentRole: profile.currentRole,
              isOpenToWork: profile.isOpenToWork,
              photoUrl: url,
              expectedSalary: profile.expectedSalary,
              linkedin: profile.linkedin,
              website: profile.website,
              education,
              experience,
              skills,
              languages,
              certifications,
              achievements,
              portfolio,
              projects,
              profileStrength,
              preferences
            };

            await setDoc(doc(db, 'publicProfiles', user.uid), {
              ...buildPublicSeekerProfile(user.uid, updatedProfileData, user),
              updatedAt: serverTimestamp()
            }, { merge: true });

            alert('Profile picture uploaded and saved successfully!');
          } catch (err) {
            console.error(err);
            alert('Upload failed: ' + (err as Error).message);
          }
        }}
      />
    </div>
  );
}
