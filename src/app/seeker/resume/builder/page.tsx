'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User, GraduationCap, Briefcase, Star, Eye, ChevronLeft, ChevronRight, Check, FileText, Sparkles,
  Mail, Phone, MapPin, ArrowLeft, Palette, Loader2, Download, RefreshCw, Zap, Award, Printer,
  CheckCircle2, Plus, Trash2, Globe, BookmarkCheck, LayoutTemplate
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
  { key: 'certifications', label: 'Certificates', icon: Award },
  { key: 'preview', label: 'Preview & PDF', icon: Eye },
];

const TEMPLATES = [
  { id: 'professional', name: 'Professional ATS', desc: 'Clean corporate layout, recruiter & ATS favorite', color: 'from-blue-600 to-indigo-600' },
  { id: 'modern', name: 'Modern Executive', desc: 'Distinct header accents & structured competency blocks', color: 'from-emerald-600 to-teal-600' },
  { id: 'simple', name: 'Classic Minimalist', desc: 'High-contrast monochrome typography, timeless simplicity', color: 'from-slate-800 to-gray-900' },
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
      careerObjective: `To secure a challenging role in ${data.currentRole || 'my domain'} where I can contribute my expertise and drive measurable organizational results.`,
      website: data.website || '',
      linkedin: data.linkedin || '',
    });

    if (data.currentRole && !targetRole) {
      setTargetRole(data.currentRole);
    }

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
      toast.success('Successfully synced all details from your THENIJOBS profile!');
    } else {
      toast.warning('No profile data found. Please enter details manually.');
    }
  };

  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  const goNext = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].key);
  };

  const goPrev = () => {
    const idx = STEPS.findIndex(s => s.key === currentStep);
    if (idx > 0) setCurrentStep(STEPS[idx - 1].key);
  };

  /** AI ATS Resume Optimization (Google Gemini via /api/ai) */
  const handleAIFullGeneration = async () => {
    if (!targetRole.trim() && !personal.summary) {
      toast.warning('Please enter a Target Job Role or Subject (e.g. Accountant, Digital Marketer, Civil Engineer).');
      return;
    }

    setAiGenerating(true);
    const target = targetRole.trim() || 'Professional';
    toast.info('✨ Google Gemini AI is crafting your ATS-optimized resume content...');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'resume_optimize',
          prompt: `Create complete, highly quantifiable, ATS-friendly resume content in JSON for a "${target}" located in ${personal.district || 'Theni'}, Tamil Nadu.
Current Skills: ${skills.join(', ')}
Current Experience: ${experience.map(e => `${e.role} at ${e.company}`).join('; ')}

Return strictly valid JSON with format:
{
  "summary": "2-3 concise ATS power sentences with action verbs and quantifiable impact",
  "careerObjective": "Strong forward-looking objective aligned to ${target}",
  "skills": ["Skill1", "Skill2", "Skill3", "Skill4", "Skill5", "Skill6"],
  "experience": [
    {
      "role": "${target}",
      "company": "Enterprise / Organization",
      "duration": "2023 – Present",
      "description": "• Implemented process improvements increasing efficiency by 25%\\n• Managed client communications and delivery with 98% satisfaction\\n• Coordinated cross-functional workflows adhering to quality standards"
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
        toast.success('✨ Resume successfully optimized with Google Gemini AI!');
      } else {
        // Fallback local enhancement if API error
        setPersonal(p => ({
          ...p,
          summary: `Results-driven ${target} based in ${p.district || 'Theni'}, Tamil Nadu. Proven track record of operational excellence, team collaboration, and achieving performance milestones.`,
          careerObjective: `To leverage my domain expertise in ${target} to deliver high-quality outcomes and support organizational growth.`
        }));
        if (skills.length === 0) {
          setSkills([target, 'Problem Solving', 'Team Leadership', 'Communication', 'Time Management', 'Process Optimization']);
        }
        toast.success('Resume enhanced with standard ATS phrasing!');
      }
    } catch (err) {
      console.error(err);
      toast.warning('AI service error. Applied local ATS template phrasing.');
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

  /** Direct Vector jsPDF Engine Fallback (Zero DOM dependency, 100% Reliable on all browsers) */
  const generateVectorPDF = () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = 20;
    const margin = 18;
    const pageWidth = 210;
    const maxLineWidth = pageWidth - margin * 2;

    // Header Name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(17, 24, 39);
    pdf.text((personal.name || 'CANDIDATE NAME').toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 6;

    // Target Role
    if (targetRole || profileDoc?.currentRole) {
      pdf.setFontSize(11);
      pdf.setTextColor(37, 99, 235);
      pdf.text(targetRole || profileDoc?.currentRole, pageWidth / 2, y, { align: 'center' });
      y += 5;
    }

    // Contact Details
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    const contacts = [personal.email, personal.phone, personal.district ? `${personal.district}, TN` : ''].filter(Boolean).join('   •   ');
    pdf.text(contacts, pageWidth / 2, y, { align: 'center' });
    y += 5;

    // Divider Line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;

    const addSectionHeader = (title: string) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(17, 24, 39);
      pdf.text(title.toUpperCase(), margin, y);
      y += 2;
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 6;
    };

    // Summary
    if (personal.summary) {
      addSectionHeader('Professional Summary');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(40, 40, 40);
      const splitSummary = pdf.splitTextToSize(personal.summary, maxLineWidth);
      pdf.text(splitSummary, margin, y);
      y += splitSummary.length * 4.5 + 5;
    }

    // Skills
    if (skills.length > 0) {
      addSectionHeader('Core Competencies & Skills');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(40, 40, 40);
      const skillsText = skills.join('   •   ');
      const splitSkills = pdf.splitTextToSize(skillsText, maxLineWidth);
      pdf.text(splitSkills, margin, y);
      y += splitSkills.length * 4.5 + 5;
    }

    // Experience
    const validExp = experience.filter(e => e.company || e.role);
    if (validExp.length > 0) {
      addSectionHeader('Work Experience');
      validExp.forEach(exp => {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(17, 24, 39);
        pdf.text(exp.role || 'Role', margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(exp.duration || '', pageWidth - margin, y, { align: 'right' });
        y += 4;
        pdf.setTextColor(37, 99, 235);
        pdf.text(exp.company || 'Company', margin, y);
        y += 5;
        if (exp.description) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(50, 50, 50);
          const splitDesc = pdf.splitTextToSize(exp.description, maxLineWidth);
          pdf.text(splitDesc, margin, y);
          y += splitDesc.length * 4.2 + 4;
        }
      });
    }

    // Education
    const validEdu = education.filter(e => e.degree || e.institution);
    if (validEdu.length > 0) {
      if (y > 250) { pdf.addPage(); y = 20; }
      addSectionHeader('Education & Qualifications');
      validEdu.forEach(edu => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(17, 24, 39);
        pdf.text(`${edu.degree} ${edu.field ? 'in ' + edu.field : ''}`, margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(edu.year || '', pageWidth - margin, y, { align: 'right' });
        y += 4;
        pdf.setTextColor(60, 60, 60);
        pdf.text(`${edu.institution} ${edu.grade ? '(' + edu.grade + ')' : ''}`, margin, y);
        y += 6;
      });
    }

    const fileName = `${(personal.name || 'Candidate').replace(/\s+/g, '_')}_THENIJOBS_Resume.pdf`;
    pdf.save(fileName);
    toast.success('🎉 Direct Vector PDF Downloaded Successfully!');
  };

  /** Multi-Layer PDF Download Engine (Canvas Raster + Vector PDF Fallback + Native Print) */
  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    toast.info('Generating high-resolution ATS PDF...');

    try {
      if (!resumeRef.current) {
        generateVectorPDF();
        return;
      }

      const element = resumeRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('printable-resume');
          if (clonedElement) {
            clonedElement.style.width = '794px';
            clonedElement.style.maxWidth = '794px';
            clonedElement.style.minHeight = '1123px';
            clonedElement.style.margin = '0 auto';
            clonedElement.style.padding = '36px';
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.border = 'none';
            clonedElement.style.borderRadius = '0';
          }
        },
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

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;
      }

      const fileName = `${(personal.name || 'Candidate').replace(/\s+/g, '_')}_THENIJOBS_Resume.pdf`;
      pdf.save(fileName);
      toast.success('🎉 PDF Resume Downloaded Successfully!');
    } catch (canvasErr) {
      console.warn('Canvas PDF encountered an error, falling back to Vector PDF engine:', canvasErr);
      try {
        generateVectorPDF();
      } catch (vectorErr) {
        console.error('Vector PDF fallback failed, running native print:', vectorErr);
        window.print();
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto font-outfit text-gray-900 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/seeker/resume" className="p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:text-gray-900 transition-all shadow-xs">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              Professional Resume Builder <Sparkles size={18} className="text-blue-600" />
            </h1>
            <p className="text-xs text-gray-500">Auto-filled from Profile • AI Optimization • 1-Click ATS PDF Export</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSyncProfile}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-gray-300 text-gray-800 text-xs font-bold hover:bg-gray-50 transition-all shadow-xs cursor-pointer"
            title="Re-read Name, Education, Experience from your Profile"
          >
            <RefreshCw size={13} className="text-blue-600" /> Re-sync Profile
          </button>
        </div>
      </div>

      {/* Profile Auto-fill Banner */}
      {autoFilled && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 text-emerald-900 font-semibold">
            <BookmarkCheck size={18} className="text-emerald-600 shrink-0" />
            <span>Profile details auto-loaded! You can edit any field manually or click <strong>AI Optimize Resume</strong>.</span>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            ✅ Synced from My Profile
          </span>
        </div>
      )}

      {/* AI Quick Generator Box */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 shadow-lg border border-blue-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/40 text-[10px] font-black uppercase tracking-wider text-blue-200">
                Google Gemini AI
              </span>
              <span className="text-xs text-blue-200 font-medium">ATS High Match Engine</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">AI Optimize Resume for Target Role</h2>
            <p className="text-xs text-blue-200/80">Enter your target designation to automatically generate quantified bullet points, ATS keywords &amp; summary.</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              aria-label="e.g. Digital Marketing, React Developer, Accountant" placeholder="e.g. Digital Marketing, React Developer, Accountant..."
              className="px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-base sm:text-xs text-white placeholder-blue-200/60 focus:outline-none focus:bg-white/20 w-full sm:w-64 font-medium"
            />
            <button
              onClick={handleAIFullGeneration}
              disabled={aiGenerating}
              className="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
            >
              {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              {aiGenerating ? 'Optimizing...' : 'AI Optimize'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps Bar */}
      <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-xs">
        <div className="flex items-center justify-between">
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
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                }`}>
                  {isDone ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className={`text-[10px] sm:text-xs font-bold transition-all text-center ${
                  isActive ? 'text-blue-600' : isDone ? 'text-blue-900' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Selector Bar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LayoutTemplate size={14} className="text-blue-600" /> Select Resume Layout Style
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                selectedTemplate === t.id
                  ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-gray-900">{t.name}</span>
                <p className="text-[11px] text-gray-500 mt-0.5">{t.desc}</p>
              </div>
              <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${t.color} mt-3`} />
            </div>
          ))}
        </div>
      </div>

      {/* Form Wizard & Live Document Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* Left Form Section (3 cols on XL) */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-xs">
            {/* 1. Personal Info Step */}
            {currentStep === 'personal' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                  <User size={16} className="text-blue-600" /> Personal &amp; Contact Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="seeker-resume-builder-full-name" className="text-xs font-bold text-gray-700 mb-1 block">Full Name *</label>
                    <input id="seeker-resume-builder-full-name"
                      type="text"
                      value={personal.name}
                      onChange={e => setPersonal({ ...personal, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 font-medium"
                      placeholder="e.g. Muthu Kumar S"
                    />
                  </div>
                  <div>
                    <label htmlFor="seeker-resume-builder-email-address" className="text-xs font-bold text-gray-700 mb-1 block">Email Address *</label>
                    <input id="seeker-resume-builder-email-address"
                      type="email"
                      value={personal.email}
                      onChange={e => setPersonal({ ...personal, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 font-medium"
                      placeholder="muthu@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="seeker-resume-builder-phone-number" className="text-xs font-bold text-gray-700 mb-1 block">Phone Number *</label>
                    <input id="seeker-resume-builder-phone-number"
                      type="text"
                      value={personal.phone}
                      onChange={e => setPersonal({ ...personal, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 font-medium"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label htmlFor="seeker-resume-builder-district-location" className="text-xs font-bold text-gray-700 mb-1 block">District / Location</label>
                    <input id="seeker-resume-builder-district-location"
                      type="text"
                      value={personal.district}
                      onChange={e => setPersonal({ ...personal, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 font-medium"
                      placeholder="Theni, Periyakulam, Cumbum..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="seeker-resume-builder-full-address" className="text-xs font-bold text-gray-700 mb-1 block">Full Address</label>
                    <input id="seeker-resume-builder-full-address"
                      type="text"
                      value={personal.address}
                      onChange={e => setPersonal({ ...personal, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 font-medium"
                      placeholder="North Street, Theni District, Tamil Nadu"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="seeker-resume-builder-professional-summary" className="text-xs font-bold text-gray-700 mb-1 block">Professional Summary</label>
                    <textarea id="seeker-resume-builder-professional-summary"
                      rows={3}
                      value={personal.summary}
                      onChange={e => setPersonal({ ...personal, summary: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 font-medium resize-none leading-relaxed"
                      placeholder="Experienced professional with domain expertise..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Education Step */}
            {currentStep === 'education' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <GraduationCap size={16} className="text-blue-600" /> Educational Qualifications
                  </h2>
                  <button
                    onClick={() => setEducation(e => [...e, { id: Date.now().toString(), institution: '', degree: '', field: '', year: '', grade: '' }])}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add Degree
                  </button>
                </div>
                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 relative space-y-3">
                      {education.length > 1 && (
                        <button
                          onClick={() => setEducation(e => e.filter(x => x.id !== edu.id))}
                          className="absolute top-3 right-3 text-slate-500 hover:text-red-600 font-bold p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="seeker-resume-builder-degree-course" className="text-xs font-bold text-gray-700 mb-1 block">Degree / Course</label>
                          <input id="seeker-resume-builder-degree-course"
                            type="text"
                            value={edu.degree}
                            onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, degree: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                            placeholder="e.g. B.Com / B.E / MBA / 12th"
                          />
                        </div>
                        <div>
                          <label htmlFor="seeker-resume-builder-specialization-major" className="text-xs font-bold text-gray-700 mb-1 block">Specialization / Major</label>
                          <input id="seeker-resume-builder-specialization-major"
                            type="text"
                            value={edu.field}
                            onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, field: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                            placeholder="e.g. Computer Science / Finance"
                          />
                        </div>
                        <div>
                          <label htmlFor="seeker-resume-builder-college-school-name" className="text-xs font-bold text-gray-700 mb-1 block">College / School Name</label>
                          <input id="seeker-resume-builder-college-school-name"
                            type="text"
                            value={edu.institution}
                            onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, institution: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                            placeholder="e.g. CPA College, Bodinayakanur"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="seeker-resume-builder-year" className="text-xs font-bold text-gray-700 mb-1 block">Year</label>
                            <input id="seeker-resume-builder-year"
                              type="text"
                              value={edu.year}
                              onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, year: e.target.value } : x))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                              placeholder="2023"
                            />
                          </div>
                          <div>
                            <label htmlFor="seeker-resume-builder-grade" className="text-xs font-bold text-gray-700 mb-1 block">Grade / %</label>
                            <input id="seeker-resume-builder-grade"
                              type="text"
                              value={edu.grade}
                              onChange={e => setEducation(prev => prev.map(x => x.id === edu.id ? { ...x, grade: e.target.value } : x))}
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                              placeholder="82%"
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
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Briefcase size={16} className="text-blue-600" /> Work Experience &amp; Internships
                  </h2>
                  <button
                    onClick={() => setExperience(e => [...e, { id: Date.now().toString(), company: '', role: '', duration: '', description: '' }])}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add Role
                  </button>
                </div>
                <div className="space-y-4">
                  {experience.map((exp) => (
                    <div key={exp.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 relative space-y-3">
                      {experience.length > 1 && (
                        <button
                          onClick={() => setExperience(e => e.filter(x => x.id !== exp.id))}
                          className="absolute top-3 right-3 text-slate-500 hover:text-red-600 font-bold p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="seeker-resume-builder-company-business-name" className="text-xs font-bold text-gray-700 mb-1 block">Company / Business Name</label>
                          <input id="seeker-resume-builder-company-business-name"
                            type="text"
                            value={exp.company}
                            onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                            placeholder="e.g. Cardamom Exports, Theni"
                          />
                        </div>
                        <div>
                          <label htmlFor="seeker-resume-builder-job-role-designation" className="text-xs font-bold text-gray-700 mb-1 block">Job Role / Designation</label>
                          <input id="seeker-resume-builder-job-role-designation"
                            type="text"
                            value={exp.role}
                            onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, role: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                            placeholder="e.g. Accounts Executive / Marketing"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="seeker-resume-builder-duration" className="text-xs font-bold text-gray-700 mb-1 block">Duration</label>
                          <input id="seeker-resume-builder-duration"
                            type="text"
                            value={exp.duration}
                            onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, duration: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                            placeholder="e.g. 2022 – Present (2 Years)"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="seeker-resume-builder-key-responsibilities-and-bullet-points" className="text-xs font-bold text-gray-700 mb-1 block">Key Responsibilities &amp; Bullet Points</label>
                          <textarea id="seeker-resume-builder-key-responsibilities-and-bullet-points"
                            rows={3}
                            value={exp.description}
                            onChange={e => setExperience(prev => prev.map(x => x.id === exp.id ? { ...x, description: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900 resize-none leading-relaxed"
                            placeholder="• Managed daily invoicing and customer accounts&#10;• Generated weekly performance reports for management"
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
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Star size={16} className="text-blue-600" /> Key Skills &amp; Competencies
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((s, i) => (
                    <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold shadow-xs">
                      {s}
                      <button onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))} className="hover:text-red-600 font-bold ml-1 cursor-pointer">✕</button>
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
                    aria-label="Type a skill (e.g., Tally Prime, React.js, Sales Management, MS Excel)" placeholder="Type a skill (e.g., Tally Prime, React.js, Sales Management, MS Excel)..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                  <button onClick={addSkill} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer">
                    Add Skill
                  </button>
                </div>
              </div>
            )}

            {/* 5. Certifications Step */}
            {currentStep === 'certifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Award size={16} className="text-blue-600" /> Certifications &amp; Courses
                  </h2>
                  <button
                    onClick={() => setCertifications(c => [...c, { id: Date.now().toString(), name: '', issuer: '', year: '' }])}
                    className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} /> Add Certificate
                  </button>
                </div>
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 relative space-y-3">
                      {certifications.length > 1 && (
                        <button
                          onClick={() => setCertifications(c => c.filter(x => x.id !== cert.id))}
                          className="absolute top-3 right-3 text-slate-500 hover:text-red-600 font-bold p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label htmlFor="seeker-resume-builder-certificate-course-title" className="text-xs font-bold text-gray-700 mb-1 block">Certificate / Course Title</label>
                          <input id="seeker-resume-builder-certificate-course-title"
                            type="text"
                            value={cert.name}
                            onChange={e => setCertifications(prev => prev.map(x => x.id === cert.id ? { ...x, name: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                            placeholder="e.g. Certified Tally Professional / Digital Marketing"
                          />
                        </div>
                        <div>
                          <label htmlFor="seeker-resume-builder-year-2" className="text-xs font-bold text-gray-700 mb-1 block">Year</label>
                          <input id="seeker-resume-builder-year-2"
                            type="text"
                            value={cert.year}
                            onChange={e => setCertifications(prev => prev.map(x => x.id === cert.id ? { ...x, year: e.target.value } : x))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-base sm:text-xs text-gray-900"
                            placeholder="2024"
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
                  <Eye size={16} className="text-blue-600" /> Export &amp; Download Options
                </h2>
                <p className="text-xs text-gray-600">Your resume is ready! You can download an instant high-resolution PDF or save it directly to your THENIJOBS seeker account.</p>

                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPdf}
                    className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {downloadingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="p-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer size={15} /> Print / Save PDF
                  </button>

                  <button
                    onClick={handleSaveResume}
                    disabled={saving}
                    className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
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
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                stepIndex === 0 ? 'text-slate-500 cursor-not-allowed opacity-50' : 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 cursor-pointer shadow-xs'
              }`}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            {stepIndex < STEPS.length - 1 && (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right Live Printable Preview Panel (2 cols on XL) */}
        <div className="xl:col-span-2">
          <div className="bg-gray-100 rounded-3xl p-4 sticky top-20 border border-gray-200">
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
              className="bg-white rounded-2xl p-6 min-h-[580px] shadow-sm text-gray-900 border border-gray-300 font-sans text-xs"
            >
              {/* Header */}
              <div className={`text-center border-b-2 pb-3 mb-3 ${selectedTemplate === 'modern' ? 'border-emerald-600' : selectedTemplate === 'simple' ? 'border-gray-900' : 'border-blue-600'}`}>
                <h1 className="text-lg font-black tracking-tight text-gray-900 uppercase">
                  {personal.name || 'CANDIDATE NAME'}
                </h1>
                {(targetRole || profileDoc?.currentRole) && (
                  <p className={`text-[11px] font-bold mt-0.5 ${selectedTemplate === 'modern' ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {targetRole || profileDoc?.currentRole}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2.5 mt-1.5 text-[10px] font-medium text-gray-700 flex-wrap">
                  {personal.email && <span>{personal.email}</span>}
                  {personal.phone && <span>• {personal.phone}</span>}
                  {personal.district && <span>• {personal.district}, TN</span>}
                </div>
              </div>

              {/* Summary */}
              {personal.summary && (
                <div className="mb-3">
                  <h4 className={`text-[10px] font-black uppercase tracking-wider border-b pb-0.5 mb-1 ${selectedTemplate === 'modern' ? 'text-emerald-800 border-emerald-200' : 'text-gray-900 border-gray-200'}`}>
                    Professional Summary
                  </h4>
                  <p className="text-[10px] text-gray-800 leading-normal">{personal.summary}</p>
                </div>
              )}

              {/* Career Objective */}
              {personal.careerObjective && (
                <div className="mb-3">
                  <h4 className={`text-[10px] font-black uppercase tracking-wider border-b pb-0.5 mb-1 ${selectedTemplate === 'modern' ? 'text-emerald-800 border-emerald-200' : 'text-gray-900 border-gray-200'}`}>
                    Career Objective
                  </h4>
                  <p className="text-[10px] text-gray-800 leading-normal">{personal.careerObjective}</p>
                </div>
              )}

              {/* Education */}
              {education.some(e => e.degree || e.institution) && (
                <div className="mb-3">
                  <h4 className={`text-[10px] font-black uppercase tracking-wider border-b pb-0.5 mb-1 ${selectedTemplate === 'modern' ? 'text-emerald-800 border-emerald-200' : 'text-gray-900 border-gray-200'}`}>
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
                  <h4 className={`text-[10px] font-black uppercase tracking-wider border-b pb-0.5 mb-1 ${selectedTemplate === 'modern' ? 'text-emerald-800 border-emerald-200' : 'text-gray-900 border-gray-200'}`}>
                    Work Experience
                  </h4>
                  {experience.filter(e => e.company || e.role).map(exp => (
                    <div key={exp.id} className="mb-2">
                      <div className="flex justify-between items-start">
                        <p className="text-[10px] font-bold text-gray-900">{exp.role} — <span className="font-semibold text-blue-800">{exp.company}</span></p>
                        <span className="text-[9px] font-semibold text-gray-600">{exp.duration}</span>
                      </div>
                      {exp.description && (
                        <p className="text-[9px] text-gray-700 whitespace-pre-line mt-0.5 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div className="mb-3">
                  <h4 className={`text-[10px] font-black uppercase tracking-wider border-b pb-0.5 mb-1 ${selectedTemplate === 'modern' ? 'text-emerald-800 border-emerald-200' : 'text-gray-900 border-gray-200'}`}>
                    Core Skills &amp; Competencies
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {skills.map(skill => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-900 rounded font-semibold text-[9px]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {certifications.some(c => c.name) && (
                <div>
                  <h4 className={`text-[10px] font-black uppercase tracking-wider border-b pb-0.5 mb-1 ${selectedTemplate === 'modern' ? 'text-emerald-800 border-emerald-200' : 'text-gray-900 border-gray-200'}`}>
                    Certifications
                  </h4>
                  {certifications.filter(c => c.name).map(cert => (
                    <div key={cert.id} className="flex justify-between text-[9px] text-gray-800 mb-0.5">
                      <span className="font-bold">{cert.name}</span>
                      <span className="text-gray-600">{cert.year}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Action Button below preview */}
            <div className="mt-3">
              <button
                onClick={handleDownloadPDF}
                disabled={downloadingPdf}
                className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all disabled:opacity-50"
              >
                {downloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Download High-Res PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
