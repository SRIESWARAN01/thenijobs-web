'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User, GraduationCap, Briefcase, Star, Eye, ChevronLeft, ChevronRight, Check, FileText, Sparkles,
  Mail, Phone, MapPin, ArrowLeft, Palette, Loader2, Download, RefreshCw, Zap, Award, Printer,
  CheckCircle2, Plus, Trash2, Globe, BookmarkCheck
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { setDoc, doc, arrayUnion } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Step = 'personal' | 'education' | 'experience' | 'skills' | 'certifications' | 'preview';

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  summary: string;
  careerObjective?: string;
  website?: string;
  linkedin?: string;
}

interface EduEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  year: string;
  grade?: string;
}

interface ExpEntry {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

interface CertEntry {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'skills', label: 'Skills', icon: Star },
  { key: 'certifications', label: 'Certifications', icon: Award },
  { key: 'preview', label: 'Preview & Download', icon: Eye },
];

const TEMPLATES = [
  { id: 'professional', name: 'Professional ATS', desc: 'Clean corporate layout, recruiter favorite', color: 'from-blue-600 to-indigo-600' },
  { id: 'modern', name: 'Modern Executive', desc: 'Bold header accents, distinct sections', color: 'from-emerald-600 to-teal-600' },
  { id: 'simple', name: 'Classic Minimalist', desc: 'Standard serif typography, timeless simplicity', color: 'from-slate-700 to-gray-900' },
];

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const resumeRef = useRef<HTMLDivElement>(null);

  const { data: profileDoc, loading: profileLoading } = useDocument<any>('seekerProfiles', user?.uid);

  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [saving, setSaving] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  const [personal, setPersonal] = useState<PersonalInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    district: 'Theni',
    summary: '',
    careerObjective: '',
    website: '',
    linkedin: '',
  });

  const [education, setEducation] = useState<EduEntry[]>([
    { id: '1', institution: '', degree: '', field: '', year: '', grade: '' },
  ]);

  const [experience, setExperience] = useState<ExpEntry[]>([
    { id: '1', company: '', role: '', duration: '', description: '' },
  ]);

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [certifications, setCertifications] = useState<CertEntry[]>([
    { id: '1', name: '', issuer: '', year: '' },
  ]);

  // Auto-fill from user's profile on load
  useEffect(() => {
    if (profileDoc && !autoFilled) {
      populateFromProfileData(profileDoc);
      setAutoFilled(true);
    }
  }, [profileDoc, autoFilled]);

  // Fallback to user auth object if profileDoc is empty
  useEffect(() => {
    if (user && !personal.name && !personal.email) {
      setPersonal(prev => ({
        ...prev,
        name: prev.name || user.displayName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || (user as any).phoneNumber || (user as any).phone || '',
      }));
    }
  }, [user, personal.name, personal.email]);

  const populateFromProfileData = (data: any) => {
    if (!data) return;
    setPersonal({
      name: data.name || user?.displayName || '',
      email: data.email || user?.email || '',
      phone: data.phone || (user as any)?.phoneNumber || (user as any)?.phone || '',
      address: data.address || '',
      district: data.district || 'Theni',
      summary: data.summary || data.bio || `Dedicated ${data.currentRole || 'professional'} based in ${data.district || 'Theni'}, Tamil Nadu with proven skills and passion for continuous learning.`,
      careerObjective: `To secure a challenging role in ${data.currentRole || 'my field'} where I can contribute my expertise and drive measurable business results.`,
      website: data.website || '',
      linkedin: data.linkedin || '',
    });

    if (data.education && Array.isArray(data.education) && data.education.length > 0) {
      setEducation(data.education.map((edu: any, i: number) => ({
        id: edu.id || `${Date.now()}_${i}`,
        institution: edu.institution || edu.school || edu.college || '',
        degree: edu.degree || '',
        field: edu.field || edu.major || '',
        year: edu.year || edu.passYear || '',
        grade: edu.grade || edu.percentage || '',
      })));
    }

    if (data.experience && Array.isArray(data.experience) && data.experience.length > 0) {
      setExperience(data.experience.map((exp: any, i: number) => ({
        id: exp.id || `${Date.now()}_${i}`,
        company: exp.company || exp.companyName || '',
        role: exp.role || exp.title || exp.designation || '',
        duration: exp.duration || (exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : '1 Year'),
        description: exp.description || exp.responsibilities || '',
      })));
    }

    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
      setSkills(data.skills);
    }

    if (data.certifications && Array.isArray(data.certifications) && data.certifications.length > 0) {
      setCertifications(data.certifications.map((c: any, i: number) => ({
        id: c.id || `${Date.now()}_${i}`,
        name: c.name || c.title || '',
        issuer: c.issuer || c.organization || '',
        year: c.year || '',
      })));
    }
  };

  const handleManualSyncProfile = () => {
    if (profileDoc) {
      populateFromProfileData(profileDoc);
      toast.success('Successfully re-synced all details from your THENIJOBS profile!');
    } else {
      toast.warning('No profile data found. Please enter details manually.');
    }
  };

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

  /** AI Full Resume Optimization (Google Gemini AI) */
  const handleAIFullGeneration = async () => {
    const target = targetRole.trim() || personal.name || 'General Professional';
    setAiGenerating(true);
    toast.info('AI is generating your ATS-optimized resume...');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'full_resume_generation',
          prompt: `Create a professional ATS resume for a candidate with target role: "${target}".
Current candidate data:
Name: ${personal.name || 'Candidate'}
District: ${personal.district || 'Theni'}, Tamil Nadu
Education: ${JSON.stringify(education)}
Experience: ${JSON.stringify(experience)}
Skills: ${skills.join(', ')}

Return ONLY valid JSON matching this schema:
{
  "summary": "High-impact 2-3 sentence ATS summary tailored to ${target}",
  "careerObjective": "Strong 1-2 sentence career objective",
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6", "Skill 7", "Skill 8"],
  "experience": [
    {
      "company": "Company Name or Recent Organization",
      "role": "${target}",
      "duration": "2022 - Present",
      "description": "• Spearheaded core operations achieving 25% efficiency increase.\\n• Managed end-to-end deliverables while ensuring quality standards.\\n• Collaborated with cross-functional teams to exceed goals."
    }
  ]
}`,
          userPrompt: `Generate complete professional ATS resume content for ${target}.`,
        }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const aiData = json.data;
        if (aiData.summary) {
          setPersonal(p => ({
            ...p,
            summary: aiData.summary,
            careerObjective: aiData.careerObjective || p.careerObjective,
          }));
        }
        if (aiData.skills && Array.isArray(aiData.skills) && aiData.skills.length > 0) {
          setSkills(aiData.skills);
        }
        if (aiData.experience && Array.isArray(aiData.experience) && aiData.experience.length > 0) {
          setExperience(aiData.experience.map((exp: any, i: number) => ({
            id: `${Date.now()}_${i}`,
            company: exp.company || 'Organization',
            role: exp.role || target,
            duration: exp.duration || 'Recent',
            description: exp.description || '',
          })));
        }
        toast.success('✨ Resume optimized with Google Gemini AI!');
      } else {
        // Fallback local enhancement if API error
        setPersonal(p => ({
          ...p,
          summary: `Results-driven ${target} based in ${p.district || 'Theni'}, Tamil Nadu. Proven track record of operational excellence, team leadership, and achieving performance milestones.`,
          careerObjective: `To leverage my domain expertise in ${target} to deliver high-quality outcomes and support organizational growth.`
        }));
        if (skills.length === 0) {
          setSkills([target, 'Problem Solving', 'Team Leadership', 'Communication', 'Time Management', 'Process Optimization']);
        }
        toast.success('Resume enhanced with ATS standard phrasing!');
      }
    } catch (err) {
      console.error(err);
      toast.warning('AI service error. Applied local ATS template phrasing.');
    } finally {
      setAiGenerating(false);
    }
  };

  /** AI Resume Summary Improvement */
  const handleAISummaryImprove = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'resume_summary',
          prompt: `Enhance this resume summary for ATS keywords and professional tone:
Target Role: ${targetRole || 'Professional'}
Current Summary: ${personal.summary || 'Job Seeker looking for opportunities in Theni'}
Return a JSON object with: { "improvedSummary": "Enhanced 2-3 sentence text" }`,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.improvedSummary) {
        setPersonal(p => ({ ...p, summary: data.data.improvedSummary }));
        toast.success('Summary enhanced by AI!');
      } else {
        setPersonal(p => ({
          ...p,
          summary: `Accomplished and proactive professional with extensive background in ${targetRole || 'industry operations'}. Demonstrated ability to streamline workflows, deliver on key metrics, and foster productive client relationships in ${p.district || 'Theni'}.`
        }));
        toast.success('Summary improved!');
      }
    } catch {
      toast.error('Could not connect to AI service');
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
    if (!user?.uid) {
      toast.error('Please login to save your resume.');
      return;
    }
    setSaving(true);
    try {
      const resumeData = {
        id: Date.now().toString(),
        name: `${personal.name.replace(/\s+/g, '_') || 'Resume'}_ATS.pdf`,
        uploadDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        size: 'ATS Standard',
        isDefault: false,
        format: 'PDF',
        content: {
          personal,
          education: education.filter(e => e.degree || e.institution),
          experience: experience.filter(e => e.company || e.role),
          skills,
          certifications: certifications.filter(c => c.name),
          template: selectedTemplate,
          targetRole,
        }
      };

      await setDoc(doc(db, 'seekerProfiles', user.uid), {
        resumes: arrayUnion(resumeData)
      }, { merge: true });

      toast.success('Resume saved to your THENIJOBS profile!');
      router.push('/seeker/resume');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save resume.');
    } finally {
      setSaving(false);
    }
  };

  /** Robust Dual-Mode PDF Download (Canvas PDF + Native Print) */
  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    setDownloadingPdf(true);
    toast.info('Generating high-resolution ATS PDF...');

    try {
      const element = resumeRef.current;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${(personal.name || 'Candidate').replace(/\s+/g, '_')}_THENIJOBS_Resume.pdf`;
      pdf.save(fileName);
      toast.success('🎉 PDF Resume Downloaded Successfully!');
    } catch (err) {
      console.error('Canvas PDF error, falling back to Native Print:', err);
      // Fallback: trigger clean native print dialog
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  /** Native Print Action */
  const handlePrintResume = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in-up space-y-6 max-w-6xl mx-auto font-outfit text-gray-900 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/seeker/resume" className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-gray-900 transition-all shadow-xs">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Professional Resume Builder <Sparkles size={16} className="text-blue-600" />
            </h1>
            <p className="text-xs text-gray-500">Auto-filled from Profile • AI Optimization • 1-Click ATS PDF Export</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSyncProfile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-gray-800 text-xs font-bold hover:bg-gray-50 transition-all shadow-xs"
            title="Re-read Name, Education, Experience from your Profile"
          >
            <RefreshCw size={13} className="text-blue-600" /> Re-sync Profile
          </button>
        </div>
      </div>

      {/* Profile Auto-fill Banner */}
      {autoFilled && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <BookmarkCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Profile details auto-loaded! You can edit any field or click <strong>AI Optimize</strong>.</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full">
            100% Synced
          </span>
        </div>
      )}

      {/* AI Quick Generator Box */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg border border-blue-800/40">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                Google Gemini AI
              </span>
              <span className="text-xs text-blue-200 font-medium">ATS High Match Engine</span>
            </div>
            <h2 className="text-base font-bold text-white">Optimize Resume with Target Job Role</h2>
            <p className="text-xs text-blue-100/80">Enter your target designation or field to auto-generate quantified bullets, ATS keywords &amp; summary.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Accounts Manager / React Developer / Sales"
              className="px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-blue-200/60 focus:outline-none focus:bg-white/20 w-full sm:w-64"
            />
            <button
              onClick={handleAIFullGeneration}
              disabled={aiGenerating}
              className="px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 disabled:opacity-50"
            >
              {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {aiGenerating ? 'Optimizing...' : 'AI Optimize Resume'}
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
                className="flex flex-col items-center gap-1 group flex-1 cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : isDone
                      ? 'bg-blue-100 text-blue-800 font-bold'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                  {isDone ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${isActive ? 'text-blue-700' : isDone ? 'text-gray-700' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Form Panel */}
        <div className="xl:col-span-3 space-y-6">
          {/* Template Selection */}
          {currentStep === 'personal' && (
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
                <Palette size={15} className="text-blue-600" /> Choose ATS Template Format
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedTemplate === t.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-full h-10 rounded-lg bg-gradient-to-br ${t.color} opacity-40 mb-2`} />
                    <p className={`text-xs font-bold ${selectedTemplate === t.id ? 'text-blue-800' : 'text-gray-700'}`}>{t.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step Forms */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs">
            {/* 1. Personal Info Step */}
            {currentStep === 'personal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <User size={15} className="text-blue-600" /> Personal Information
                  </h2>
                  <button
                    onClick={handleAISummaryImprove}
                    disabled={aiGenerating}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 flex items-center gap-1 transition-all"
                  >
                    <Sparkles size={12} /> AI Enhance Summary
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={personal.name}
                      onChange={e => setPersonal(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                      placeholder="Your Full Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={personal.email}
                      onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={personal.phone}
                      onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                      placeholder="+91 93605 19460"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Address / Street</label>
                    <input
                      type="text"
                      value={personal.address}
                      onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                      placeholder="e.g. North Street, Cumbum Road"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">District / City</label>
                    <input
                      type="text"
                      value={personal.district}
                      onChange={e => setPersonal(p => ({ ...p, district: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                      placeholder="Theni"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Career Objective</label>
                    <input
                      type="text"
                      value={personal.careerObjective || ''}
                      onChange={e => setPersonal(p => ({ ...p, careerObjective: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
                      placeholder="Brief career objective..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-gray-700 block mb-1">Professional Summary</label>
                    <textarea
                      rows={3}
                      value={personal.summary}
                      onChange={e => setPersonal(p => ({ ...p, summary: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-blue-500 outline-none resize-none"
                      placeholder="Write or AI generate your professional summary..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Education Step */}
            {currentStep === 'education' && (
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <GraduationCap size={15} className="text-blue-600" /> Education Background
                  </h2>
                  <button
                    onClick={() => setEducation(e => [...e, { id: Date.now().toString(), institution: '', degree: '', field: '', year: '', grade: '' }])}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Education
                  </button>
                </div>
                <div className="space-y-4">
                  {education.map((edu, idx) => (
                    <div key={edu.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative space-y-3">
                      {education.length > 1 && (
                        <button
                          onClick={() => setEducation(e => e.filter(x => x.id !== edu.id))}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 font-bold p-1"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Education #{idx + 1}</span>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Degree / Course</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, degree: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                            placeholder="e.g. B.Com, B.E., Diploma, Higher Secondary"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Field of Study / Major</label>
                          <input
                            type="text"
                            value={edu.field}
                            onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, field: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                            placeholder="e.g. Commerce, Computer Science, Mechanical"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Institution / College / School</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, institution: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                            placeholder="e.g. Theni Arts College, MKU"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-gray-700 mb-1 block">Pass Year</label>
                            <input
                              type="text"
                              value={edu.year}
                              onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, year: e.target.value } : x))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                              placeholder="2023"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-gray-700 mb-1 block">Percentage / Grade</label>
                            <input
                              type="text"
                              value={edu.grade || ''}
                              onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, grade: e.target.value } : x))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                              placeholder="78% / First Class"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Experience Step */}
            {currentStep === 'experience' && (
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Briefcase size={15} className="text-blue-600" /> Work Experience &amp; Internships
                  </h2>
                  <button
                    onClick={() => setExperience(e => [...e, { id: Date.now().toString(), company: '', role: '', duration: '', description: '' }])}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Experience
                  </button>
                </div>
                <div className="space-y-4">
                  {experience.map((exp, idx) => (
                    <div key={exp.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative space-y-3">
                      {experience.length > 1 && (
                        <button
                          onClick={() => setExperience(e => e.filter(x => x.id !== exp.id))}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 font-bold p-1"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Position #{idx + 1}</span>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Company Name</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                            placeholder="e.g. ABC Textiles / Tech Solutions"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Job Role / Designation</label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, role: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                            placeholder="e.g. Senior Accountant / Sales Officer"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Duration</label>
                          <input
                            type="text"
                            value={exp.duration}
                            onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, duration: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                            placeholder="e.g. 2022 – Present (2 Years)"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Key Responsibilities &amp; Achievements</label>
                          <textarea
                            rows={3}
                            value={exp.description}
                            onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, description: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 resize-none"
                            placeholder="• Managed daily accounting and GST filing&#10;• Coordinated customer relationships and billing"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Skills Step */}
            {currentStep === 'skills' && (
              <div>
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                  <Star size={15} className="text-blue-600" /> Key Skills &amp; Technical Expertise
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((s, i) => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold">
                      {s}
                      <button onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))} className="hover:text-red-600 font-bold ml-1">✕</button>
                    </span>
                  ))}
                  {skills.length === 0 && <p className="text-xs text-gray-500">No skills added yet. Type below to add.</p>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    placeholder="Type a skill (e.g., Tally Prime, React.js, Sales Management, MS Excel)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                  <button onClick={addSkill} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs">
                    Add Skill
                  </button>
                </div>
              </div>
            )}

            {/* 5. Certifications Step */}
            {currentStep === 'certifications' && (
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Award size={15} className="text-blue-600" /> Certifications &amp; Awards
                  </h2>
                  <button
                    onClick={() => setCertifications(c => [...c, { id: Date.now().toString(), name: '', issuer: '', year: '' }])}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Certificate
                  </button>
                </div>
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative space-y-3">
                      {certifications.length > 1 && (
                        <button
                          onClick={() => setCertifications(c => c.filter(x => x.id !== cert.id))}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 font-bold p-1"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Certificate / Course Title</label>
                          <input
                            type="text"
                            value={cert.name}
                            onChange={e => setCertifications(prev => prev.map(x => x.id === cert.id ? { ...x, name: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                            placeholder="e.g. Certified Tally Professional / AWS Practitioner"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1 block">Year</label>
                          <input
                            type="text"
                            value={cert.year}
                            onChange={e => setCertifications(prev => prev.map(x => x.id === cert.id ? { ...x, year: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900"
                            placeholder="2023"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Preview Step */}
            {currentStep === 'preview' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Eye size={15} className="text-blue-600" /> Export &amp; Download Options
                </h2>
                <p className="text-xs text-gray-600">Your resume is ready! You can download an instant high-resolution PDF or save it directly to your THENIJOBS seeker account.</p>

                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="p-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    {downloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {downloadingPdf ? 'Exporting...' : 'Download ATS PDF'}
                  </button>

                  <button
                    onClick={handlePrintResume}
                    className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-300"
                  >
                    <Printer size={14} /> Print / Save PDF
                  </button>

                  <button
                    onClick={handleSaveResume}
                    disabled={saving}
                    className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {saving ? 'Saving...' : 'Save to Profile'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Prev / Next Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={stepIndex === 0}
              className={`flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                stepIndex === 0 ? 'text-gray-400 cursor-not-allowed opacity-50' : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {stepIndex < STEPS.length - 1 && (
              <button
                onClick={goNext}
                className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right Live Printable Preview Panel */}
        <div className="xl:col-span-2">
          <div className="bg-gray-100 rounded-2xl p-4 sticky top-20 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                <Eye size={14} className="text-blue-600" /> Live Resume Document
              </h3>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                ATS Formatted
              </span>
            </div>

            {/* Printable Container */}
            <div
              ref={resumeRef}
              id="printable-resume"
              className="bg-white rounded-xl p-6 min-h-[580px] shadow-sm text-gray-900 border border-gray-300 font-sans text-xs"
            >
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3 mb-3">
                <h1 className="text-lg font-black tracking-tight text-gray-900 uppercase">
                  {personal.name || 'CANDIDATE NAME'}
                </h1>
                {(targetRole || profileDoc?.currentRole) && (
                  <p className="text-[11px] font-bold text-blue-700 mt-0.5">{targetRole || profileDoc?.currentRole}</p>
                )}
                <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] font-medium text-gray-700 flex-wrap">
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
                  <p className="text-[10px] text-gray-800 leading-normal">{personal.summary}</p>
                </div>
              )}

              {/* Career Objective */}
              {personal.careerObjective && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Career Objective
                  </h4>
                  <p className="text-[10px] text-gray-800 leading-normal">{personal.careerObjective}</p>
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
                        <p className="text-[9px] text-gray-700">{edu.institution} {edu.grade && `(${edu.grade})`}</p>
                      </div>
                      <span className="text-[9px] font-semibold text-gray-600">{edu.year}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Experience */}
              {experience.some(e => e.company || e.role) && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Work Experience
                  </h4>
                  {experience.filter(e => e.company || e.role).map(exp => (
                    <div key={exp.id} className="mb-2">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold text-gray-900">{exp.role} — <span className="font-semibold text-blue-800">{exp.company}</span></p>
                        <span className="text-[9px] font-semibold text-gray-600">{exp.duration}</span>
                      </div>
                      {exp.description && <p className="text-[9.5px] text-gray-800 mt-0.5 leading-relaxed whitespace-pre-line">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Technical &amp; Interpersonal Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {skills.map(s => (
                      <span key={s} className="text-[9px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {certifications.some(c => c.name) && (
                <div className="mb-3">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-0.5 mb-1">
                    Certifications
                  </h4>
                  {certifications.filter(c => c.name).map(cert => (
                    <div key={cert.id} className="flex justify-between text-[9.5px] mb-1">
                      <span className="font-semibold text-gray-900">{cert.name}</span>
                      <span className="text-gray-600">{cert.year}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty placeholder state */}
              {!personal.name && education.every(e => !e.institution) && experience.every(e => !e.company) && skills.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
                  <FileText size={36} />
                  <p className="text-xs font-bold text-gray-600">Your ATS Resume Preview will render here</p>
                  <p className="text-[10px]">Fill the form or click &quot;AI Optimize Resume&quot; above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
