'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User, Phone, Mail, MapPin, Camera, Briefcase, GraduationCap,
  Plus, X, Check, Save, Globe, Award, Link as Star, Zap,
  CheckCircle, Circle, Languages, ExternalLink, Loader2, Eye
} from 'lucide-react';
import { TN_DISTRICTS } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useUploadFile } from '@/hooks/useStorage';
import { db } from '@/lib/firebase/config';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import DeviceLivePreviewModal from '@/components/ui/DeviceLivePreviewModal';
import SeekerPortfolioClient from '@/app/portfolio/seeker/[id]/SeekerPortfolioClient';
import { useToast } from '@/contexts/ToastContext';

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

type TabKey = 'personal' | 'education' | 'experience' | 'skills' | 'languages' | 'certifications' | 'portfolio';

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
  isPortfolioPublic: false,
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
  const [languages, setLanguages] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>([]);

  const [newSkill, setNewSkill] = useState('');
  const [newPortfolioLink, setNewPortfolioLink] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [saving, setSaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const toast = useToast();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, progress: uploadProgress, loading: uploading } = useUploadFile();

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
        isPortfolioPublic: remoteProfile.isPortfolioPublic === true,
        photoUrl: remoteProfile.photoUrl || ''
      });
      setEducation(remoteProfile.education || []);
      setExperience(remoteProfile.experience || []);
      setSkills(remoteProfile.skills || []);
      setLanguages(remoteProfile.languages || []);
      setCertifications(remoteProfile.certifications || []);
      setPortfolio(remoteProfile.portfolio || []);
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

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    try {
      const url = await uploadFile(file, `seekers/${user.uid}/avatar_${Date.now()}`);
      setProfile(p => ({ ...p, photoUrl: url }));
    } catch (err) {
      console.error(err);
      toast.error('Upload failed', (err as Error).message);
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
      const profileData = {
        ...profile,
        education,
        experience,
        skills,
        languages,
        certifications,
        portfolio,
        profileStrength,
        updatedAt: serverTimestamp()
      };

      // Write to seekerProfiles
      await setDoc(doc(db, 'seekerProfiles', user.uid), profileData, { merge: true });

      // Sync key details back to users collection
      await setDoc(doc(db, 'users', user.uid), {
        displayName: profile.name,
        email: profile.email,
        phone: profile.phone,
        district: profile.district,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success('Profile saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save profile details.');
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
  ];

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading your profile...</p>
      </div>
    );
  }

  const initials = profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AS';

  const inputCls = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-400 transition-all";
  const labelCls = "text-xs font-semibold text-gray-500 block mb-1.5";
  const cardCls = "p-4 rounded-xl border border-gray-100 bg-gray-50 relative group";
  const addBtnCls = "flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all";

  return (
    <div className="space-y-5 max-w-4xl mx-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Uploading progress notification */}
      {uploading && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <Loader2 size={18} className="text-emerald-500 animate-spin" />
          <span className="text-xs text-gray-600 font-medium">Uploading avatar... {uploadProgress}%</span>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0 self-center sm:self-start">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold text-white overflow-hidden shadow-sm bg-emerald-600">
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <button onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Camera size={14} />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleUploadAvatar} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>{profile.name || 'Set Your Name'}</h1>
                <p className="text-sm font-medium mt-0.5" style={{ color: '#10B981' }}>{profile.currentRole || 'Specify Current Role'}</p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <MapPin size={11} /> {profile.district || 'Select district'}, Tamil Nadu
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all text-xs font-semibold"
                >
                  <Eye size={13} />
                  <span>Live Preview</span>
                </button>
                <label htmlFor="seeker-profile-open-to-work-setprofile-p-classname-w-10" className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500 font-medium">Open to Work</span>
                  <div onClick={() => setProfile(p => ({ ...p, isOpenToWork: !p.isOpenToWork }))}
                    className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${profile.isOpenToWork ? '' : 'bg-gray-200'}`}
                    style={profile.isOpenToWork ? { background: '#10B981' } : {}}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${profile.isOpenToWork ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
                {profile.isOpenToWork && (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border" style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>● Open to Work</span>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500 font-medium">Public Portfolio Page</span>
                  <div onClick={() => setProfile(p => ({ ...p, isPortfolioPublic: !p.isPortfolioPublic }))}
                    className={`w-10 h-6 rounded-full relative transition-all cursor-pointer ${profile.isPortfolioPublic ? '' : 'bg-gray-200'}`}
                    style={profile.isPortfolioPublic ? { background: '#2563EB' } : {}}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-all ${profile.isPortfolioPublic ? 'left-5' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 max-w-md">
              {profile.isPortfolioPublic
                ? 'Your portfolio is public — anyone with the link can view it at thenijobs.com/portfolio/seeker/…'
                : 'Your portfolio is private by default. Turn this on to make it viewable by anyone with the link.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Phone size={11} /> {profile.phone || 'No phone'}</span>
              <span className="flex items-center gap-1"><Mail size={11} /> {profile.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Strength */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Zap size={14} style={{ color: '#10B981' }} /> Profile Strength
          </h2>
          <span className="text-sm font-bold" style={{ color: profileStrength >= 80 ? '#059669' : profileStrength >= 60 ? '#D97706' : '#DC2626' }}>
            {profileStrength}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${profileStrength}%`, background: '#10B981' }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {strengthItems.map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs">
              {item.done
                ? <CheckCircle size={13} style={{ color: '#059669' }} className="shrink-0" />
                : <Circle size={13} className="text-gray-300 shrink-0" />}
              <span className={item.done ? 'text-gray-700 font-medium' : 'text-slate-500'}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto no-scrollbar w-fit max-w-full">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`} style={isActive ? { color: '#059669' } : {}}>
              <Icon size={13} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
        {/* Personal Details */}
        {activeTab === 'personal' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-5">
              <User size={14} style={{ color: '#059669' }} /> Personal Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name', type: 'text' },
                { key: 'dob', label: 'Date of Birth', type: 'date' },
                { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
                { key: 'phone', label: 'Phone Number', type: 'tel' },
                { key: 'email', label: 'Email Address', type: 'email' },
                { key: 'currentRole', label: 'Current Role', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className={labelCls}>{field.label}</label>
                  {field.type === 'select' ? (
                    <select value={(profile as any)[field.key]} onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))} className={inputCls}>
                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={field.type} value={(profile as any)[field.key]} onChange={e => setProfile(p => ({ ...p, [field.key]: e.target.value }))} className={inputCls} />
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className={labelCls}>Address</label>
                <input id="seeker-profile-open-to-work-setprofile-p-classname-w-10" type="text" value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label htmlFor="seeker-profile-district" className={labelCls}>District</label>
                <select id="seeker-profile-district" value={profile.district} onChange={e => setProfile(p => ({ ...p, district: e.target.value }))} className={inputCls}>
                  <option value="">Select district</option>
                  {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Education */}
        {activeTab === 'education' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><GraduationCap size={14} style={{ color: '#059669' }} /> Education</h2>
              <button onClick={addEducation} className={addBtnCls} style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}><Plus size={12} /> Add Education</button>
            </div>
            <div className="space-y-3">
              {education.map(edu => (
                <div key={edu.id} className={cardCls}>
                  <button onClick={() => removeEducation(edu.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><X size={14} /></button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label htmlFor="seeker-profile-institution" className={labelCls}>Institution</label><input id="seeker-profile-institution" type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} className={inputCls} placeholder="Institution name" /></div>
                    <div><label htmlFor="seeker-profile-degree" className={labelCls}>Degree</label><input id="seeker-profile-degree" type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} className={inputCls} placeholder="Degree" /></div>
                    <div><label htmlFor="seeker-profile-field-of-study" className={labelCls}>Field of Study</label><input id="seeker-profile-field-of-study" type="text" value={edu.field} onChange={e => updateEducation(edu.id, 'field', e.target.value)} className={inputCls} placeholder="Field of study" /></div>
                    <div><label htmlFor="seeker-profile-year" className={labelCls}>Year</label><input id="seeker-profile-year" type="text" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} className={inputCls} placeholder="Year" /></div>
                  </div>
                </div>
              ))}
              {education.length === 0 && <div className="text-center py-10 text-gray-400 text-sm"><GraduationCap size={28} className="mx-auto mb-2 text-gray-200" />No education entries yet.</div>}
            </div>
          </div>
        )}

        {/* Experience */}
        {activeTab === 'experience' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Briefcase size={14} style={{ color: '#059669' }} /> Work Experience</h2>
              <button onClick={addExperience} className={addBtnCls} style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}><Plus size={12} /> Add Experience</button>
            </div>
            <div className="space-y-3">
              {experience.map(exp => (
                <div key={exp.id} className={cardCls}>
                  <button onClick={() => removeExperience(exp.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><X size={14} /></button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label htmlFor="seeker-profile-company" className={labelCls}>Company</label><input id="seeker-profile-company" type="text" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} className={inputCls} placeholder="Company name" /></div>
                    <div><label htmlFor="seeker-profile-role-title" className={labelCls}>Role / Title</label><input id="seeker-profile-role-title" type="text" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} className={inputCls} placeholder="Role or title" /></div>
                    <div><label htmlFor="seeker-profile-start-date" className={labelCls}>Start Date</label><input id="seeker-profile-start-date" type="text" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} className={inputCls} placeholder="YYYY-MM" /></div>
                    <div><label htmlFor="seeker-profile-end-date" className={labelCls}>End Date</label><input id="seeker-profile-end-date" type="text" value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} className={inputCls} placeholder="Present or 2024-05" /></div>
                    <div className="sm:col-span-2"><label htmlFor="seeker-profile-description" className={labelCls}>Description</label><textarea id="seeker-profile-description" rows={2} value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} className={inputCls + " resize-none"} placeholder="Describe responsibilities..." /></div>
                  </div>
                </div>
              ))}
              {experience.length === 0 && <div className="text-center py-10 text-gray-400 text-sm"><Briefcase size={28} className="mx-auto mb-2 text-gray-200" />No experience entries yet.</div>}
            </div>
          </div>
        )}

        {/* Skills */}
        {activeTab === 'skills' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4"><Star size={14} style={{ color: '#059669' }} /> Skills</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((s, i) => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold" style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
                  {s}<button onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} aria-label="Type a skill and press Enter" placeholder="Type a skill and press Enter..." className={inputCls + " flex-1"} />
              <button onClick={addSkill} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all" style={{ background: '#10B981' }}><Plus size={15} /></button>
            </div>
            <p className="text-xs text-slate-600 font-medium mb-2">Suggested:</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter(s => !skills.includes(s)).slice(0, 8).map(s => (
                <button key={s} onClick={() => setSkills(p => [...p, s])} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all">+ {s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {activeTab === 'languages' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4"><Languages size={14} style={{ color: '#059669' }} /> Languages</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANGUAGE_OPTIONS.map(lang => {
                const isSel = languages.includes(lang);
                return (
                  <label htmlFor="seeker-profile-setlanguages-p-issel-p-filter-l-l-lang-p" key={lang} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${ isSel ? '' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                    style={isSel ? { background: '#ECFDF5', borderColor: '#A7F3D0' } : {}}>
                    <input type="checkbox" checked={isSel} onChange={() => setLanguages(p => isSel ? p.filter(l => l !== lang) : [...p, lang])} className="hidden" />
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all`} style={isSel ? { background: '#10B981', borderColor: '#10B981' } : { borderColor: '#D1D5DB' }}>
                      {isSel && <Check size={11} className="text-white" />}
                    </div>
                    <span className={`text-sm font-medium ${isSel ? '' : 'text-gray-600'}`} style={isSel ? { color: '#059669' } : {}}>{lang}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Certifications */}
        {activeTab === 'certifications' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Award size={14} style={{ color: '#059669' }} /> Certifications</h2>
              <button onClick={addCertification} className={addBtnCls} style={{ background: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}><Plus size={12} /> Add Certification</button>
            </div>
            <div className="space-y-3">
              {certifications.map(cert => (
                <div key={cert.id} className={cardCls}>
                  <button onClick={() => removeCertification(cert.id)} className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><X size={14} /></button>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className={labelCls}>Certification Name</label><input id="seeker-profile-setlanguages-p-issel-p-filter-l-l-lang-p" type="text" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} className={inputCls} placeholder="Certification name" /></div>
                    <div><label htmlFor="seeker-profile-organization" className={labelCls}>Organization</label><input id="seeker-profile-organization" type="text" value={cert.organization} onChange={e => updateCertification(cert.id, 'organization', e.target.value)} className={inputCls} placeholder="Issuing organization" /></div>
                    <div><label htmlFor="seeker-profile-date" className={labelCls}>Date</label><input id="seeker-profile-date" type="month" value={cert.date} onChange={e => updateCertification(cert.id, 'date', e.target.value)} className={inputCls} /></div>
                    <div><label htmlFor="seeker-profile-certificate-link-optional" className={labelCls}>Certificate Link (Optional)</label><input id="seeker-profile-certificate-link-optional" type="url" value={cert.link} onChange={e => updateCertification(cert.id, 'link', e.target.value)} className={inputCls} placeholder="https://..." /></div>
                  </div>
                </div>
              ))}
              {certifications.length === 0 && <div className="text-center py-10 text-gray-400 text-sm"><Award size={28} className="mx-auto mb-2 text-gray-200" />No certifications yet.</div>}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {activeTab === 'portfolio' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4"><Globe size={14} style={{ color: '#059669' }} /> Portfolio & Links</h2>
            <div className="space-y-2.5 mb-4">
              {portfolio.map((link, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
                    <ExternalLink size={14} style={{ color: '#2563EB' }} />
                  </div>
                  <span className="flex-1 text-sm text-blue-600 truncate font-medium">{link}</span>
                  <button onClick={() => setPortfolio(p => p.filter((_, i) => i !== idx))} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"><X size={13} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="url" value={newPortfolioLink} onChange={e => setNewPortfolioLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPortfolioLink()} aria-label="Add portfolio URL" placeholder="Add portfolio URL..." className={inputCls + " flex-1"} />
              <button onClick={addPortfolioLink} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all" style={{ background: '#10B981' }}><Plus size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={() => setShowPreviewModal(true)}
          className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-base hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <Eye size={18} />
          <span>Live Device Preview</span>
        </button>

        <button onClick={handleSaveProfile} disabled={saving}
          className="flex-1 w-full py-4 rounded-2xl text-white font-bold text-base bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-sm cursor-pointer">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Profile'}
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
            currentRole: profile.currentRole,
            isOpenToWork: profile.isOpenToWork,
            isPortfolioPublic: profile.isPortfolioPublic,
            photoUrl: profile.photoUrl,
            profilePhotoUrl: profile.photoUrl,
            gender: profile.gender,
            dob: profile.dob,
            skills: skills,
            languages: languages,
            education: education,
            experience: experience,
            certifications: certifications,
            workSamples: portfolio.map((url, i) => ({ id: i.toString(), title: `Portfolio Link ${i + 1}`, type: 'link', url })),
          }}
        />
      </DeviceLivePreviewModal>
    </div>
  );
}
