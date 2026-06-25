'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  User, Phone, Mail, MapPin, Camera, Briefcase, GraduationCap,
  Plus, X, Check, Save,
  Globe, Award, Star, Zap,
  CheckCircle, Circle, Languages, ExternalLink, Loader2
} from 'lucide-react';
import { THENI_LAUNCH_LOCATIONS } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useUploadFile } from '@/hooks/useStorage';
import { db } from '@/lib/firebase/config';
import { setDoc, doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { buildPublicSeekerProfile } from '@/lib/publicProfile';
import { ImageCropperModal } from '@/components/ui/ImageCropperModal';


/** Skill suggestions for tag input */
const SKILL_SUGGESTIONS = [
  'Driving License', 'Tractor Driving', 'Tally', 'Excel', 'GST Filing',
  'English Speaking', 'Communication', 'Team Work', 'Agriculture', 'Computer',
  'Accounting', 'Sales', 'Marketing', 'Welding', 'Electrical', 'Plumbing',
  'AutoCAD', 'Data Entry', 'Customer Service', 'Machine Operation'
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

type TabKey = 'personal' | 'education' | 'experience' | 'skills' | 'languages' | 'certifications' | 'portfolio' | 'projects';

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
  website: ''
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

  const [newSkill, setNewSkill] = useState('');
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
        website: remoteProfile.website || ''
      });
      setEducation(remoteProfile.education || []);
      setExperience(remoteProfile.experience || []);
      setSkills(remoteProfile.skills || []);
      setLanguages(remoteProfile.languages || []);
      setCertifications(remoteProfile.certifications || []);
      setPortfolio(remoteProfile.portfolio || []);
      setProjects(remoteProfile.projects || []);
    } else if (user) {
      setProfile(p => ({
        ...p,
        name: user.displayName || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
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
  ];
  const profileStrength = Math.round((strengthItems.filter(i => i.done).length / strengthItems.length) * 100);

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
        portfolio,
        projects,
        profileStrength,
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

      alert('Profile saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile details.');
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
    { key: 'portfolio', label: 'Portfolio', icon: Globe },
    { key: 'projects', label: 'Projects', icon: Briefcase },
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
            {/* Add Skill */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSkill()}
                placeholder="Type a skill and press Enter..."
                className="search-input flex-1 px-3 py-2.5 text-sm bg-[#0e0e22]"
              />
              <button onClick={addSkill} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                <Plus size={15} />
              </button>
            </div>
            {/* Suggestions */}
            <p className="text-xs text-gray-500 mb-2">Suggested skills:</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                <button
                  key={s}
                  onClick={() => setSkills(p => [...p, s])}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:border-emerald-500/30 hover:text-emerald-400 transition-all bg-[#0e0e22]"
                >
                  + {s}
                </button>
              ))}
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
        onCropComplete={async (croppedFile) => {
          try {
            if (!user?.uid) return;
            const url = await uploadFile(croppedFile, `seekers/${user.uid}/avatar_${Date.now()}`);
            setProfile(p => ({ ...p, photoUrl: url }));
          } catch (err) {
            console.error(err);
            alert('Upload failed: ' + (err as Error).message);
          }
        }}
      />
    </div>
  );
}
