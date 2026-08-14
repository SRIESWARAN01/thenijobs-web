'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  User, GraduationCap, Briefcase, Star, Eye, ChevronLeft, ChevronRight, Check, FileText, Sparkles,
  Mail, Phone, MapPin, ArrowLeft, Palette, Loader2, Download, RefreshCw, Zap, Award
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { setDoc, doc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { requestAIService } from '@/lib/ai/aiClient';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Step = 'personal' | 'education' | 'experience' | 'skills' | 'preview';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  summary: string;
  careerObjective?: string;
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
  { key: 'preview', label: 'Preview & Download', icon: Eye },
];

const TEMPLATES = [
  { id: 'professional', name: 'Professional ATS', desc: 'Clean corporate layout', color: 'from-emerald-500 to-cyan-500' },
  { id: 'modern', name: 'Modern Executive', desc: 'Creative header & accent', color: 'from-violet-500 to-purple-500' },
  { id: 'simple', name: 'Minimalist Clean', desc: 'Sleek standard formatting', color: 'from-cyan-500 to-blue-500' },
];

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const resumeRef = useRef<HTMLDivElement>(null);

  const { data: profileDoc } = useDocument<any>('seekerProfiles', user?.uid);

  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState('');

  const [personal, setPersonal] = useState<PersonalInfo>({
    name: '', email: '', phone: '', address: '', district: 'Theni', summary: '', careerObjective: ''
  });

  const [education, setEducation] = useState<EduEntry[]>([
    { id: '1', institution: '', degree: '', field: '', year: '' },
  ]);

  const [experience, setExperience] = useState<ExpEntry[]>([
    { id: '1', company: '', role: '', duration: '', description: '' },
  ]);

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [projects, setProjects] = useState<string[]>([]);

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
        summary: profileDoc.summary || `Motivated ${profileDoc.currentRole || 'Job Seeker'} based in ${profileDoc.district || 'Theni'}, Tamil Nadu.`,
        careerObjective: `Seeking a challenging role in ${profileDoc.currentRole || 'my domain'} to leverage technical & interpersonal skills.`
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
          duration: exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : '1 Year',
          description: exp.description || ''
        })));
      }
      setSkills(profileDoc.skills || []);
      toast.success('Auto-filled from profile!');
    } else {
      toast.warning('Please complete your profile details first to auto-fill.');
    }
  };

  /** AI Full Resume Generation (3 Credits / ₹15 Flow) */
  const handleAIFullGeneration = async () => {
    if (!targetRole.trim()) {
      toast.warning('Please enter your Target Job Role (e.g., Accountant, React Developer, Sales Executive)');
      return;
    }

    setAiGenerating(true);
    try {
      const res = await requestAIService({
        feature: 'full_resume_generation',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: {
          name: personal.name || profileDoc?.name || 'Candidate',
          email: personal.email || profileDoc?.email || '',
          phone: personal.phone || profileDoc?.phone || '',
          district: personal.district || 'Theni',
          targetRole,
          skills: skills.length > 0 ? skills : profileDoc?.skills || ['Communication', 'Problem Solving'],
        },
      });

      if (res.success && res.data) {
        const data = res.data;
        if (data.personal) {
          setPersonal(p => ({
            ...p,
            summary: data.personal.summary || p.summary,
            careerObjective: data.careerObjective || p.careerObjective,
          }));
        }
        if (data.education && Array.isArray(data.education)) {
          setEducation(data.education);
        }
        if (data.experience && Array.isArray(data.experience)) {
          setExperience(data.experience);
        }
        if (data.skills && Array.isArray(data.skills)) {
          setSkills(data.skills);
        }
        toast.success('AI Resume content generated successfully! (3 AI Credits deducted)');
      } else {
        toast.error(res.error || 'AI Generation failed. Please try again.');
      }
    } catch (err) {
      toast.error('AI Service is temporarily unavailable');
    } finally {
      setAiGenerating(false);
    }
  };

  /** AI Resume Summary Improvement (2 Credits) */
  const handleAISummaryImprove = async () => {
    if (!personal.summary && !targetRole) {
      toast.warning('Please enter a target role or summary first.');
      return;
    }
    setAiGenerating(true);
    try {
      const res = await requestAIService({
        feature: 'resume_improvement',
        userId: user?.uid,
        userRole: 'SEEKER',
        payload: { resumeData: { personal, targetRole, skills } },
      });

      if (res.success && res.data?.improvedSummary) {
        setPersonal(p => ({ ...p, summary: res.data.improvedSummary }));
        toast.success('Summary enhanced with AI!');
      } else {
        toast.error(res.error || 'AI Improvement failed.');
      }
    } catch (err) {
      toast.error('AI service temporarily unavailable');
    } finally {
      setAiGenerating(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(s => [...s, newSkill.trim()]);
      setNewSkill('');
    }
  };

  /** Save resume details into user Firestore profile */
  const handleSaveResume = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const resumeData = {
        id: Date.now().toString(),
        name: `${personal.name.replace(/\s+/g, '_') || 'Resume'}_ATS.pdf`,
        uploadDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        size: 'ATS Standard',
        isDefault: false,
        format: 'PDF',
        content: { personal, education, experience, skills, template: selectedTemplate }
      };

      await setDoc(doc(db, 'seekerProfiles', user.uid), {
        resumes: arrayUnion(resumeData)
      }, { merge: true });

      toast.success('Resume saved successfully!');
      router.push('/seeker/resume');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  /** Export ATS PDF Download */
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    toast.info('Preparing high-quality ATS PDF download...');
    try {
      const canvas = await html2canvas(resumeRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${personal.name || 'Resume'}_THENIJOBS.pdf`);
      toast.success('PDF Resume Downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Could not generate PDF. Please try again.');
    }
  };

  /** Export ATS DOCX Download */
  const handleDownloadDOCX = () => {
    try {
      const docContent = `
THENIJOBS ATS RESUME
=====================

${personal.name.toUpperCase()}
Email: ${personal.email} | Phone: ${personal.phone} | Location: ${personal.address}, ${personal.district}

PROFESSIONAL SUMMARY
--------------------
${personal.summary || 'N/A'}

CAREER OBJECTIVE
----------------
${personal.careerObjective || 'N/A'}

EDUCATION
---------
${education.map(e => `${e.degree} in ${e.field} — ${e.institution} (${e.year})`).join('\n')}

WORK EXPERIENCE
---------------
${experience.map(e => `${e.role} — ${e.company} (${e.duration})\nKey Responsibilities: ${e.description}`).join('\n\n')}

SKILLS
------
${skills.join(', ')}

Generated via THENIJOBS AI Resume Builder
      `.trim();

      const blob = new Blob([docContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${personal.name || 'Resume'}_THENIJOBS.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('DOCX Resume Downloaded!');
    } catch (err) {
      toast.error('Failed to generate DOCX file');
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6 max-w-6xl mx-auto font-outfit text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/seeker/resume" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-900 transition-all shadow-xs">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-outfit font-bold text-gray-900 flex items-center gap-2">
              AI Resume Builder <Sparkles size={16} className="text-emerald-500" />
            </h1>
            <p className="text-xs text-gray-500">ATS-Optimized Resumes • ₹15 per AI Generation (3 Credits)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={autoFillFromProfile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-all"
          >
            <Sparkles size={14} className="text-emerald-600" /> Auto-fill from Profile
          </button>
        </div>
      </div>

      {/* AI Quick Generator Header Box */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-700/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Groq AI Powered
              </span>
              <span className="text-xs text-emerald-200 font-medium">Cost: 3 AI Credits (₹15)</span>
            </div>
            <h2 className="text-base font-bold text-white">Generate Complete Resume using AI</h2>
            <p className="text-xs text-emerald-100/80">Enter your target role and let AI draft your professional ATS summary, work experience bullets, & skills.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Accountant / React Developer"
              className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-emerald-200/60 focus:outline-none focus:bg-white/20 w-full sm:w-64"
            />
            <button
              onClick={handleAIFullGeneration}
              disabled={aiGenerating}
              className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 disabled:opacity-50"
            >
              {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {aiGenerating ? 'Generating...' : 'AI Generate Resume'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.key === currentStep;
            const isDone = idx < stepIndex;
            return (
              <button
                key={step.key}
                onClick={() => setCurrentStep(step.key)}
                className="flex flex-col items-center gap-1 group flex-1"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : isDone
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${isActive ? 'text-emerald-700' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Form Panel */}
        <div className="xl:col-span-3 space-y-6">
          {/* Template Selection */}
          {currentStep === 'personal' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
                <Palette size={15} className="text-emerald-600" /> Choose ATS Template Format
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      selectedTemplate === t.id
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${t.color} opacity-40 mb-2`} />
                    <p className={`text-xs font-bold ${selectedTemplate === t.id ? 'text-emerald-800' : 'text-gray-700'}`}>{t.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            {/* Personal Info Step */}
            {currentStep === 'personal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <User size={15} className="text-emerald-600" /> Personal Information
                  </h2>
                  <button
                    onClick={handleAISummaryImprove}
                    disabled={aiGenerating}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition-all"
                  >
                    <Sparkles size={12} /> AI Improve Summary
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Full Name</label>
                    <input type="text" value={personal.name} onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))} className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none" placeholder="Your Name" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Email</label>
                    <input type="email" value={personal.email} onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))} className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Phone</label>
                    <input type="tel" value={personal.phone} onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))} className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none" placeholder="+91 94876 53210" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Address</label>
                    <input type="text" value={personal.address} onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))} className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none" placeholder="Periyakulam Road" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">District</label>
                    <input type="text" value={personal.district} onChange={e => setPersonal(p => ({ ...p, district: e.target.value }))} className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none" placeholder="Theni" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Career Objective</label>
                    <input type="text" value={personal.careerObjective} onChange={e => setPersonal(p => ({ ...p, careerObjective: e.target.value }))} className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none" placeholder="Brief career objective..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Professional Summary</label>
                    <textarea rows={3} value={personal.summary} onChange={e => setPersonal(p => ({ ...p, summary: e.target.value }))} className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-emerald-500 outline-none resize-none" placeholder="Write or generate your professional summary..." />
                  </div>
                </div>
              </div>
            )}

            {/* Education Step */}
            {currentStep === 'education' && (
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <GraduationCap size={15} className="text-emerald-600" /> Education
                  </h2>
                  <button onClick={() => setEducation(e => [...e, { id: Date.now().toString(), institution: '', degree: '', field: '', year: '' }])} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    + Add Education
                  </button>
                </div>
                <div className="space-y-4">
                  {education.map(edu => (
                    <div key={edu.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative space-y-3">
                      {education.length > 1 && (
                        <button onClick={() => setEducation(e => e.filter(x => x.id !== edu.id))} className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 font-bold text-xs">✕</button>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-gray-700 mb-1 block">Degree</label><input type="text" value={edu.degree} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, degree: e.target.value } : x))} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900" placeholder="B.Com / B.E." /></div>
                        <div><label className="text-xs font-bold text-gray-700 mb-1 block">Field / Major</label><input type="text" value={edu.field} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, field: e.target.value } : x))} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900" placeholder="Commerce / CS" /></div>
                        <div><label className="text-xs font-bold text-gray-700 mb-1 block">Institution</label><input type="text" value={edu.institution} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, institution: e.target.value } : x))} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900" placeholder="College / University" /></div>
                        <div><label className="text-xs font-bold text-gray-700 mb-1 block">Passing Year</label><input type="text" value={edu.year} onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, year: e.target.value } : x))} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900" placeholder="2022" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Step */}
            {currentStep === 'experience' && (
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Briefcase size={15} className="text-emerald-600" /> Work Experience
                  </h2>
                  <button onClick={() => setExperience(e => [...e, { id: Date.now().toString(), company: '', role: '', duration: '', description: '' }])} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    + Add Experience
                  </button>
                </div>
                <div className="space-y-4">
                  {experience.map(exp => (
                    <div key={exp.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative space-y-3">
                      {experience.length > 1 && (
                        <button onClick={() => setExperience(e => e.filter(x => x.id !== exp.id))} className="absolute top-2 right-2 text-gray-400 hover:text-rose-600 font-bold text-xs">✕</button>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-gray-700 mb-1 block">Company</label><input type="text" value={exp.company} onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900" placeholder="Company Name" /></div>
                        <div><label className="text-xs font-bold text-gray-700 mb-1 block">Job Role</label><input type="text" value={exp.role} onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, role: e.target.value } : x))} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900" placeholder="Accounts Manager" /></div>
                        <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-700 mb-1 block">Duration</label><input type="text" value={exp.duration} onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, duration: e.target.value } : x))} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900" placeholder="2021 – Present" /></div>
                        <div className="sm:col-span-2"><label className="text-xs font-bold text-gray-700 mb-1 block">Responsibilities & Achievements</label><textarea rows={2} value={exp.description} onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, description: e.target.value } : x))} className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 resize-none" placeholder="Bullet points detailing achievements..." /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Step */}
            {currentStep === 'skills' && (
              <div>
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <Star size={15} className="text-emerald-600" /> Key Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((s, i) => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold">
                      {s}
                      <button onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))} className="hover:text-rose-600 font-bold">✕</button>
                    </span>
                  ))}
                  {skills.length === 0 && <p className="text-xs text-gray-500">No skills added yet</p>}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSkill()} placeholder="Type a skill (e.g., Tally Prime, React, GST Return)..." className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none" />
                  <button onClick={addSkill} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors">Add Skill</button>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {currentStep === 'preview' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Eye size={15} className="text-emerald-600" /> Preview, Save & Download Options
                </h2>
                <p className="text-xs text-gray-600">Save your resume to your THENIJOBS seeker profile or download instant ATS PDF / DOCX formats.</p>

                <div className="grid sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <Download size={14} /> Download PDF
                  </button>
                  <button
                    onClick={handleDownloadDOCX}
                    className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <FileText size={14} /> Download DOCX
                  </button>
                  <button
                    onClick={handleSaveResume}
                    disabled={saving}
                    className="p-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {saving ? 'Saving...' : 'Save to Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={stepIndex === 0}
              className={`flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                stepIndex === 0 ? 'text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {stepIndex < STEPS.length - 1 && (
              <button
                onClick={goNext}
                className="flex items-center gap-1 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Live Printable Preview Panel */}
        <div className="xl:col-span-2">
          <div className="bg-gray-100 rounded-2xl p-4 sticky top-24 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <Eye size={14} className="text-emerald-600" /> Live Resume Document
              </h3>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                ATS Standard Printable
              </span>
            </div>

            {/* Printable Container */}
            <div ref={resumeRef} className="bg-white rounded-xl p-6 min-h-[550px] shadow-sm text-gray-900 border border-gray-200 font-sans text-xs">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-3">
                <h1 className="text-lg font-black tracking-tight text-gray-900 uppercase">
                  {personal.name || 'CANDIDATE NAME'}
                </h1>
                {targetRole && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-0.5">{targetRole}</p>
                )}
                <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] font-medium text-gray-600 flex-wrap">
                  {personal.email && <span>{personal.email}</span>}
                  {personal.phone && <span>• {personal.phone}</span>}
                  {personal.district && <span>• {personal.district}, TN</span>}
                </div>
              </div>

              {/* Summary */}
              {personal.summary && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Professional Summary
                  </h4>
                  <p className="text-[10px] text-gray-700 leading-normal">{personal.summary}</p>
                </div>
              )}

              {/* Career Objective */}
              {personal.careerObjective && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Career Objective
                  </h4>
                  <p className="text-[10px] text-gray-700 leading-normal">{personal.careerObjective}</p>
                </div>
              )}

              {/* Education */}
              {education.some(e => e.degree || e.institution) && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Education
                  </h4>
                  {education.filter(e => e.degree || e.institution).map(edu => (
                    <div key={edu.id} className="mb-1.5 flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                        <p className="text-[9px] text-gray-600">{edu.institution}</p>
                      </div>
                      <span className="text-[9px] font-semibold text-gray-500">{edu.year}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {experience.some(e => e.company || e.role) && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Experience
                  </h4>
                  {experience.filter(e => e.company || e.role).map(exp => (
                    <div key={exp.id} className="mb-2">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold text-gray-900">{exp.role} — <span className="font-semibold text-emerald-800">{exp.company}</span></p>
                        <span className="text-[9px] font-semibold text-gray-500">{exp.duration}</span>
                      </div>
                      {exp.description && <p className="text-[9.5px] text-gray-700 mt-0.5 leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Technical & Interpersonal Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {skills.map(s => (
                      <span key={s} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty placeholder state */}
              {!personal.name && education.every(e => !e.institution) && experience.every(e => !e.company) && skills.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
                  <FileText size={36} />
                  <p className="text-xs font-bold text-gray-600">Your ATS Resume Preview will render here</p>
                  <p className="text-[10px]">Fill the form or click &quot;AI Generate Resume&quot; above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
