'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User, GraduationCap, Briefcase, Star, Eye,
  ChevronLeft, ChevronRight, Check, FileText, Sparkles,
  Mail, Phone, MapPin, ArrowLeft, Palette, Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { setDoc, doc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type Step = 'personal' | 'education' | 'experience' | 'skills' | 'preview';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  summary: string;
}

interface EduEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  year: string;
}

interface ExpEntry {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'skills', label: 'Skills', icon: Star },
  { key: 'preview', label: 'Preview', icon: Eye },
];

const TEMPLATES = [
  { id: 'professional', name: 'Professional', desc: 'Clean corporate layout', color: 'from-emerald-500 to-cyan-500' },
  { id: 'modern', name: 'Modern', desc: 'Creative with sidebar', color: 'from-violet-500 to-purple-500' },
  { id: 'simple', name: 'Simple', desc: 'Minimal and elegant', color: 'from-cyan-500 to-blue-500' },
];

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Fetch profile to allow auto-fill
  const { data: profileDoc } = useDocument<any>('seekerProfiles', user?.uid);

  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [saving, setSaving] = useState(false);

  const [personal, setPersonal] = useState<PersonalInfo>({
    name: '', email: '', phone: '', address: '', district: 'Theni',
    summary: '',
  });

  const [education, setEducation] = useState<EduEntry[]>([
    { id: '1', institution: '', degree: '', field: '', year: '' },
  ]);

  const [experience, setExperience] = useState<ExpEntry[]>([
    { id: '1', company: '', role: '', duration: '', description: '' },
  ]);

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);
  const progressPercent = ((stepIndex + 1) / STEPS.length) * 100;

  const goNext = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
  };

  const goPrev = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].key);
  };

  const autoFillFromProfile = () => {
    if (profileDoc) {
      setPersonal({
        name: profileDoc.name || '',
        email: profileDoc.email || '',
        phone: profileDoc.phone || '',
        address: profileDoc.address || '',
        district: profileDoc.district || 'Theni',
        summary: profileDoc.summary || `Motivated ${profileDoc.currentRole || 'Job Seeker'} with experience building professional skills. Based in ${profileDoc.district || 'Theni'}, Tamil Nadu.`
      });
      if (profileDoc.education && profileDoc.education.length > 0) {
        setEducation(profileDoc.education.map((edu: any) => ({
          id: edu.id || Date.now().toString(),
          institution: edu.institution || '',
          degree: edu.degree || '',
          field: edu.field || '',
          year: edu.year || ''
        })));
      }
      if (profileDoc.experience && profileDoc.experience.length > 0) {
        setExperience(profileDoc.experience.map((exp: any) => ({
          id: exp.id || Date.now().toString(),
          company: exp.company || '',
          role: exp.role || '',
          duration: exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : '',
          description: exp.description || ''
        })));
      }
      setSkills(profileDoc.skills || []);
    } else {
      alert('Please fill in your profile page first to use auto-fill.');
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(s => [...s, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleSaveResume = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const resumeData = {
        id: Date.now().toString(),
        name: `${personal.name.replace(/\s+/g, '_') || 'Resume'}_Builder.pdf`,
        uploadDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        size: 'Built Online',
        isDefault: false,
        format: 'PDF',
        url: '#', // In production, this would render a PDF and upload to Storage
        content: {
          personal,
          education,
          experience,
          skills,
          template: selectedTemplate
        }
      };

      // Append to the resumes array inside seekerProfiles
      await setDoc(doc(db, 'seekerProfiles', user.uid), {
        resumes: arrayUnion(resumeData)
      }, { merge: true });

      alert('Resume saved successfully in your profile!');
      router.push('/seeker/resume');
    } catch (err) {
      console.error(err);
      alert('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6 max-w-6xl mx-auto font-outfit text-white">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/seeker/resume" className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-outfit font-bold text-white">Resume Builder</h1>
            <p className="text-sm text-gray-400">Create a professional resume step by step</p>
          </div>
        </div>
        <button
          onClick={autoFillFromProfile}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
        >
          <Sparkles size={14} /> Auto-fill from Profile
        </button>
      </div>

      {/* Progress Bar */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.key === currentStep;
            const isDone = idx < stepIndex;
            return (
              <button
                key={step.key}
                onClick={() => setCurrentStep(step.key)}
                className="flex flex-col items-center gap-1.5 group flex-1"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 border border-emerald-500/30'
                    : isDone
                      ? 'bg-emerald-500/10 border border-emerald-500/15'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                }`}>
                  {isDone ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-gray-500'} />
                  )}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${isActive ? 'text-emerald-400' : isDone ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-505"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Form Panel */}
        <div className="xl:col-span-3 space-y-6">
          {/* Template Selection */}
          {currentStep === 'personal' && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-4">
                <Palette size={15} className="text-emerald-400" /> Choose Template
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedTemplate === t.id
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${t.color} opacity-30 mb-2`} />
                    <p className={`text-xs font-medium ${selectedTemplate === t.id ? 'text-emerald-400' : 'text-gray-300'}`}>{t.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="glass-card rounded-2xl p-5">
            {/* Personal Info Step */}
            {currentStep === 'personal' && (
              <div>
                <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-5">
                  <User size={15} className="text-emerald-400" /> Personal Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 block mb-1.5">Full Name</label>
                    <input type="text" value={personal.name} onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))} className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]" placeholder="Alagar Swamy" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Email</label>
                    <input type="email" value={personal.email} onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Phone</label>
                    <input type="tel" value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]" placeholder="+91 94876 53210" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">Address</label>
                    <input type="text" value={personal.address} onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))} className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]" placeholder="Gandhi Nagar, Periyakulam" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1.5">District</label>
                    <input type="text" value={personal.district} onChange={e => setPersonal(p => ({ ...p, district: e.target.value }))} className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22]" placeholder="Theni" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 block mb-1.5">Professional Summary</label>
                    <textarea rows={3} value={personal.summary} onChange={e => setPersonal(p => ({ ...p, summary: e.target.value }))} className="search-input w-full px-3 py-2.5 text-sm bg-[#0e0e22] resize-none" placeholder="Write a brief professional summary..." />
                  </div>
                </div>
              </div>
            )}

            {/* Education Step */}
            {currentStep === 'education' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                    <GraduationCap size={15} className="text-emerald-400" /> Education
                  </h2>
                  <button onClick={() => setEducation(e => [...e, { id: Date.now().toString(), institution: '', degree: '', field: '', year: '' }])} className="text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    + Add
                  </button>
                </div>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative group">
                      {education.length > 1 && (
                        <button onClick={() => setEducation(e => e.filter(x => x.id !== edu.id))} className="absolute top-2 right-2 p-1 rounded text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className="text-xs text-gray-500 mb-1 block">Institution</label><input type="text" value={edu.institution} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, institution: e.target.value } : x))} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="College name" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Degree</label><input type="text" value={edu.degree} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, degree: e.target.value } : x))} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="B.Sc" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Field</label><input type="text" value={edu.field} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, field: e.target.value } : x))} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="Computer Science" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Year</label><input type="text" value={edu.year} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, year: e.target.value } : x))} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="2020" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Step */}
            {currentStep === 'experience' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-white text-sm flex items-center gap-2">
                    <Briefcase size={15} className="text-emerald-400" /> Work Experience
                  </h2>
                  <button onClick={() => setExperience(e => [...e, { id: Date.now().toString(), company: '', role: '', duration: '', description: '' }])} className="text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    + Add
                  </button>
                </div>
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] relative group">
                      {experience.length > 1 && (
                        <button onClick={() => setExperience(e => e.filter(x => x.id !== exp.id))} className="absolute top-2 right-2 p-1 rounded text-gray-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className="text-xs text-gray-500 mb-1 block">Company</label><input type="text" value={exp.company} onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="Company name" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Role</label><input type="text" value={exp.role} onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, role: e.target.value } : x))} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="Job title" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Duration</label><input type="text" value={exp.duration} onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, duration: e.target.value } : x))} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="2022 – Present" /></div>
                        <div><label className="text-xs text-gray-500 mb-1 block">Description</label><input type="text" value={exp.description} onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, description: e.target.value } : x))} className="search-input w-full px-3 py-2 text-sm bg-[#0e0e22]" placeholder="Key responsibilities" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Step */}
            {currentStep === 'skills' && (
              <div>
                <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-5">
                  <Star size={15} className="text-emerald-400" /> Skills
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((s, i) => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-sm font-medium">
                      {s}
                      <button onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))} className="hover:text-rose-400 transition-colors">✕</button>
                    </span>
                  ))}
                  {skills.length === 0 && <p className="text-xs text-gray-600">No skills added yet</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Type a skill..." className="search-input flex-1 px-3 py-2.5 text-sm bg-[#0e0e22]" />
                  <button onClick={addSkill} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">Add</button>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {currentStep === 'preview' && (
              <div>
                <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-5">
                  <Eye size={15} className="text-emerald-400" /> Preview & Save
                </h2>
                <p className="text-xs text-gray-500 mb-4">Save your compiled resume details to your seeker dashboard profile</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveResume}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin text-white" /> : <Check size={16} />}
                    {saving ? 'Saving...' : 'Save & Publish'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-300 hover:bg-white/[0.08] text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <FileText size={16} /> Print / Export PDF
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={stepIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                stepIndex === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'bg-white/[0.04] border border-white/[0.06] text-gray-300 hover:bg-white/[0.08]'
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {stepIndex < STEPS.length - 1 && (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="xl:col-span-2">
          <div className="glass-card rounded-2xl p-5 sticky top-24">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 mb-4">
              <Eye size={15} className="text-cyan-400" /> Live Preview
            </h3>
            {/* Simulated Resume Preview */}
            <div id="resume-preview-card" className="bg-white rounded-xl p-5 min-h-[500px] text-gray-900">
              {/* Name */}
              <div className="text-center border-b border-gray-200 pb-3 mb-3">
                <h2 className="text-lg font-bold text-gray-900">
                  {personal.name || 'Your Name'}
                </h2>
                <div className="flex items-center justify-center gap-3 mt-1 text-[10px] text-gray-500 flex-wrap">
                  {personal.email && <span className="flex items-center gap-0.5"><Mail size={8} /> {personal.email}</span>}
                  {personal.phone && <span className="flex items-center gap-0.5"><Phone size={8} /> {personal.phone}</span>}
                  {personal.district && <span className="flex items-center gap-0.5"><MapPin size={8} /> {personal.district}</span>}
                </div>
              </div>

              {/* Summary */}
              {personal.summary && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Summary</h4>
                  <p className="text-[9px] text-gray-600 leading-relaxed">{personal.summary}</p>
                </div>
              )}

              {/* Education */}
              {education.some(e => e.institution) && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Education</h4>
                  {education.filter(e => e.institution).map(edu => (
                    <div key={edu.id} className="mb-1.5">
                      <p className="text-[9px] font-semibold text-gray-800">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                      <p className="text-[8px] text-gray-500">{edu.institution} {edu.year && `• ${edu.year}`}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {experience.some(e => e.company) && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Experience</h4>
                  {experience.filter(e => e.company).map(exp => (
                    <div key={exp.id} className="mb-1.5">
                      <p className="text-[9px] font-semibold text-gray-800">{exp.role} — {exp.company}</p>
                      <p className="text-[8px] text-gray-500">{exp.duration}</p>
                      {exp.description && <p className="text-[8px] text-gray-600 mt-0.5">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {skills.map(s => (
                      <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!personal.name && education.every(e => !e.institution) && experience.every(e => !e.company) && skills.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-300">
                  <FileText size={32} className="mb-2" />
                  <p className="text-xs">Fill in the form to see your resume preview</p>
                  <p className="text-[10px] text-gray-400 mt-1">or click &quot;Auto-fill from Profile&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
