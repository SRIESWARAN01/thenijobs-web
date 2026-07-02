'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User, GraduationCap, Briefcase, Star, Eye,
  ChevronLeft, ChevronRight, Check, FileText, Sparkles,
  Mail, Phone, MapPin, ArrowLeft, Palette, Loader2, Download, Printer, ExternalLink,
  CheckCircle, Circle, Zap, Link2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { db } from '@/lib/firebase/config';
import { setDoc, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const TEMPLATES = [
  { id: 'professional', name: 'Professional', desc: 'Clean corporate layout', color: 'from-emerald-500 to-cyan-500' },
  { id: 'modern', name: 'Modern', desc: 'Creative layout with sidebar', color: 'from-violet-500 to-purple-500' },
  { id: 'simple', name: 'Simple', desc: 'Minimalist and elegant', color: 'from-cyan-500 to-blue-500' },
];

export default function ResumeBuilderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch seeker profile (Single source of truth)
  const { data: profile, loading: profileLoading } = useDocument<any>('seekerProfiles', user?.uid);

  const [selectedTemplate, setSelectedTemplate] = useState('professional');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Auto save states and refs
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [profileUrl, setProfileUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && user?.uid) {
      setProfileUrl(`${window.location.origin}/profile/${user.uid}`);
    }
  }, [user?.uid]);

  const qrCodeUrl = profileUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(profileUrl)}` : '';

  // Initialize template choice from profile if saved
  useEffect(() => {
    if (profile?.resumeTemplate) {
      setSelectedTemplate(profile.resumeTemplate);
    }
  }, [profile?.resumeTemplate]);

  const handleAutoSaveTemplate = async (templateId: string) => {
    if (!user?.uid) return;
    setAutoSaveStatus('saving');
    try {
      await setDoc(doc(db, 'seekerProfiles', user.uid), {
        resumeTemplate: templateId,
        updatedAt: new Date()
      }, { merge: true });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
    } catch (err) {
      console.error('Template selection auto-save failed:', err);
      setAutoSaveStatus('error');
    }
  };

  const handleSaveTemplateSelection = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'seekerProfiles', user.uid), {
        resumeTemplate: selectedTemplate,
        updatedAt: new Date()
      }, { merge: true });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000);
      alert('Preferred template layout saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save template selection');
      setAutoSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!profile) return;
    setExporting(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default || jsPDFModule;

      const element = previewRef.current;
      if (!element) return;

      // Temporary print adjustments for high quality A4 print capture
      const originalStyle = element.style.cssText;
      element.style.width = '794px'; // 794px width is equivalent to A4 width at 96 DPI
      element.style.minHeight = '1123px'; // A4 height
      element.style.color = '#111827'; // Dark gray color

      const canvas = await html2canvas(element, {
        scale: 2, // 2x resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Revert styles
      element.style.cssText = originalStyle;

      const fileName = `${(profile.name || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      alert('Failed to export PDF. Please try printing via browser (Ctrl+P) instead.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] font-outfit text-white">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading your profile data...</p>
      </div>
    );
  }

  // Graceful handling of incomplete profiles
  const hasProfileData = profile && profile.name;
  if (!hasProfileData) {
    return (
      <div className="max-w-md mx-auto py-16 text-center font-outfit text-white space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto shadow-lg">
          <User size={28} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Profile Data Missing</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Resume Builder creates your resume automatically from your Profile details. Please fill in your name, contact information, education, and skills in your Profile first.
          </p>
        </div>
        <Link
          href="/seeker/profile"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
        >
          Complete Profile Now
        </Link>
      </div>
    );
  }

  const education = profile.education || [];
  const experience = profile.experience || [];
  const skills = profile.skills || [];
  const certifications = profile.certifications || [];
  const projects = profile.projects || [];
  const languages = profile.languages || [];
  const achievements = profile.achievements || [];
  const portfolio = profile.portfolio || [];
  const summary = profile.aboutMe || profile.summary || '';
  const initials = profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const photoUrl = profile.photoUrl || profile.profilePhotoUrl || profile.photoURL || '';

  const strengthItems = [
    { label: 'Photo uploaded', done: !!(profile.photoUrl || profile.profilePhotoUrl) },
    { label: 'Contact details', done: !!profile.phone && !!profile.email },
    { label: 'Education added', done: education.length > 0 },
    { label: 'Experience added', done: experience.length > 0 },
    { label: 'Skills added', done: skills.length >= 3 },
    { label: 'Languages selected', done: languages.length > 0 },
    { label: 'Certifications', done: certifications.length > 0 },
    { label: 'Portfolio links', done: portfolio.length > 0 },
    { label: 'About Me summary', done: !!summary },
    { label: 'Achievements listed', done: achievements.length > 0 },
  ];
  const profileStrength = Math.round((strengthItems.filter(i => i.done).length / strengthItems.length) * 100);


  return (
    <div className="animate-fade-in-up space-y-6 max-w-6xl mx-auto font-outfit text-white">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/seeker/resume" className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-outfit font-bold text-white">Auto-Fill Resume Builder</h1>
            <p className="text-sm text-gray-400">Single source of truth: Profile Data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveTemplateSelection}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold hover:bg-white/[0.08] transition-all"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Palette size={14} />}
            Save Layout Preference
          </button>
          <Link
            href="/seeker/profile"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
          >
            <Sparkles size={14} /> Update Profile Data
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Column: Template Selection & Controls */}
        <div className="xl:col-span-2 space-y-6">
          {/* Profile Strength Checklist */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Zap size={15} className="text-emerald-400" /> Profile Strength
              </h3>
              <span className={`text-sm font-bold ${profileStrength >= 90 ? 'text-emerald-400' : profileStrength >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                {profileStrength}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
                style={{ width: `${profileStrength}%` }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
              {strengthItems.map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  {item.done ? (
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Circle size={14} className="text-gray-500 shrink-0" />
                  )}
                  <span className={item.done ? 'text-gray-300' : 'text-gray-500'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Template Choices */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Palette size={15} className="text-emerald-400" /> Choose Template
              </h3>
              {autoSaveStatus !== 'idle' && (
                <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                  autoSaveStatus === 'saving' 
                    ? 'text-amber-400' 
                    : autoSaveStatus === 'saved' 
                    ? 'text-emerald-400' 
                    : 'text-rose-455'
                }`}>
                  {autoSaveStatus === 'saving' && <Loader2 size={10} className="animate-spin" />}
                  {autoSaveStatus === 'saving' ? 'Saving...' : autoSaveStatus === 'saved' ? 'Saved' : 'Error'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    handleAutoSaveTemplate(t.id);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedTemplate === t.id
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${t.color} opacity-20 mb-2`} />
                  <p className={`text-xs font-medium ${selectedTemplate === t.id ? 'text-emerald-400' : 'text-gray-300'}`}>{t.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export Panel */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-white text-sm mb-3">Export Options</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={exporting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Download Resume PDF
              </button>
              <button
                onClick={handlePrint}
                className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-300 hover:bg-white/[0.08] text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Print / Export via Browser
              </button>
              <button
                onClick={handleCopyShareLink}
                className="w-full py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {copied ? <Check size={16} /> : <Link2 size={16} />}
                {copied ? 'Link Copied!' : 'Copy Shareable Profile Link'}
              </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2 leading-relaxed">
              * The download option renders the resume as a high-resolution document directly in your browser.
            </p>
          </div>
        </div>

        {/* Right Column: Live Resume Preview */}
        <div className="xl:col-span-3">
          <div className="glass-card rounded-2xl p-2 md:p-4 bg-[#111124] border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Eye size={12} /> Live Preview</span>
              <span className="capitalize">{selectedTemplate} Layout</span>
            </div>

            {/* Print Container Sheet */}
            <div
              ref={previewRef}
              id="resume-preview-card"
              className="bg-white rounded-xl p-6 sm:p-8 text-gray-900 shadow-xl overflow-hidden leading-relaxed"
              style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
            >
              {/* ────────────────────────────────────────────────────────── */}
              {/* LAYOUT 1: PROFESSIONAL                                      */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedTemplate === 'professional' && (
                <div className="space-y-6 text-xs text-gray-800">
                  {/* Name and Header */}
                  <div className="border-b border-gray-200 pb-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{profile.name}</h2>
                        {profile.currentRole && <p className="text-xs font-semibold text-emerald-600 mt-1 uppercase tracking-wider">{profile.currentRole}</p>}
                        <div className="flex items-center gap-x-3 gap-y-1 mt-3 text-[10px] text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><Mail size={10} /> {profile.email}</span>
                          <span className="flex items-center gap-1"><Phone size={10} /> {profile.phone}</span>
                          {profile.address && <span className="flex items-center gap-1"><MapPin size={10} /> {profile.address}, {profile.district}</span>}
                        </div>
                        <div className="flex items-center gap-x-3 gap-y-1 mt-1 text-[10px] text-gray-400 flex-wrap">
                          {(profile.dob || profile.seekerDob) && <span>DOB: {profile.dob || profile.seekerDob}</span>}
                          {((profile.dob || profile.seekerDob) && (profile.gender || profile.seekerGender)) && <span>·</span>}
                          {(profile.gender || profile.seekerGender) && <span className="capitalize">Gender: {profile.gender || profile.seekerGender}</span>}
                        </div>
                      </div>
                      {photoUrl && (
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                          <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        </div>
                      )}
                    </div>
                    {/* Social/Portfolio Links */}
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-emerald-600 font-semibold flex-wrap">
                      {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">LinkedIn <ExternalLink size={8} /></a>}
                      {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">Portfolio <ExternalLink size={8} /></a>}
                      {portfolio.map((link: string, idx: number) => (
                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-0.5">
                          Link {idx + 1} <ExternalLink size={8} />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {summary && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">Professional Summary</h3>
                      <p className="text-[11px] leading-relaxed text-gray-700">{summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {experience.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">Work History</h3>
                      {experience.map((exp: any, idx: number) => (
                        <div key={exp.id || idx} className="space-y-1">
                          <div className="flex justify-between font-semibold text-gray-900 text-[11px]">
                            <span>{exp.role} — {exp.company}</span>
                            <span className="text-gray-500 font-normal">{exp.startDate} - {exp.endDate}</span>
                          </div>
                          {exp.description && <p className="text-[10px] text-gray-500 leading-normal">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {projects.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">Key Projects</h3>
                      {projects.map((proj: any, idx: number) => (
                        <div key={proj.id || idx} className="space-y-1">
                          <div className="flex justify-between font-semibold text-gray-900 text-[11px]">
                            <span>{proj.title}</span>
                            {proj.url && <a href={proj.url} className="text-emerald-600 font-normal text-[10px] hover:underline">Link</a>}
                          </div>
                          {proj.technologies && <p className="text-[10px] font-medium text-gray-500">Technologies: {proj.technologies}</p>}
                          {proj.description && <p className="text-[10px] text-gray-500 leading-normal">{proj.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {education.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">Education</h3>
                      {education.map((edu: any, idx: number) => (
                        <div key={edu.id || idx} className="flex justify-between text-[11px]">
                          <div>
                            <span className="font-semibold text-gray-900">{edu.degree} in {edu.field}</span>
                            <span className="text-gray-500"> · {edu.institution}</span>
                          </div>
                          <span className="text-gray-500">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills, Certifications & Languages */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {skills.length > 0 && (
                      <div className="space-y-1.5 col-span-1">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {skills.map((s: string) => (
                            <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {certifications.length > 0 && (
                      <div className="space-y-1.5 col-span-1">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">Certifications</h4>
                        <ul className="list-disc list-inside text-[9px] text-gray-500 space-y-0.5">
                          {certifications.map((c: any, idx: number) => (
                            <li key={c.id || idx} className="truncate">{c.name} ({c.organization})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {languages.length > 0 && (
                      <div className="space-y-1.5 col-span-1">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">Languages</h4>
                        <div className="flex flex-wrap gap-1">
                          {languages.map((l: string) => (
                            <span key={l} className="text-[8px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{l}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Achievements */}
                  {achievements.length > 0 && (
                    <div className="space-y-2 pt-3">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">Achievements</h3>
                      <div className="space-y-2">
                        {achievements.map((ach: any, idx: number) => (
                          <div key={ach.id || idx} className="space-y-1">
                            <p className="font-semibold text-gray-900 text-[11px]">{ach.name}</p>
                            {ach.description && <p className="text-[10px] text-gray-500 leading-normal">{ach.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Digital Member ID Card & QR Code */}
                  <div className="pt-6 border-t border-gray-200 mt-6 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-8">
                      {/* Mini Digital ID Card */}
                      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-[#0e1224] to-[#1e2a4a] text-white p-4 shadow-md flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl overflow-hidden border border-white/20 bg-slate-900/50 relative flex-shrink-0">
                            {photoUrl ? (
                              <img src={photoUrl} alt={profile.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-black bg-gradient-to-br from-slate-800 to-slate-950 text-emerald-400 uppercase">
                                {initials}
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <span className="text-[7px] tracking-[0.2em] font-black text-emerald-400 uppercase block leading-none">THENIJOBS</span>
                            <h4 className="text-xs font-black text-white leading-tight truncate">{profile.name}</h4>
                            <p className="text-[8px] font-semibold text-emerald-400 leading-normal">{profile.currentRole || 'Job Seeker'}</p>
                            <p className="text-[8px] font-mono font-bold text-slate-300 mt-0.5 leading-none">
                              {profile.candidateId || `TNI-${user?.uid?.slice(0, 8).toUpperCase()}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[8px] text-slate-400 space-y-0.5 border-l border-white/10 pl-3">
                          <p><span className="font-semibold text-slate-500 uppercase">Location:</span> {profile.district || 'Tamil Nadu'}</p>
                          <p><span className="font-semibold text-slate-500 uppercase">Member:</span> Verified</p>
                          <p><span className="font-semibold text-slate-500 uppercase">Status:</span> Active</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4 flex flex-col items-center justify-center text-center pl-2">
                      <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm inline-block">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="Verify Profile QR" className="w-12 h-12" crossOrigin="anonymous" />}
                      </div>
                      <span className="text-[7px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Scan to Verify Profile</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* LAYOUT 2: MODERN                                           */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedTemplate === 'modern' && (
                <div className="grid grid-cols-3 gap-6 text-xs text-gray-800 min-h-[500px]">
                  {/* Left Column (Sidebar-style, col-span-1) */}
                  <div className="col-span-1 bg-slate-50 p-4 rounded-xl space-y-5 border border-slate-100 flex flex-col justify-between">
                    <div className="space-y-5">
                      {/* Name & Photo Initials */}
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-3 shadow overflow-hidden">
                          {photoUrl ? (
                            <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" />
                          ) : (
                            initials
                          )}
                        </div>
                        <h2 className="text-sm font-bold text-slate-900">{profile.name}</h2>
                        {profile.currentRole && <p className="text-[10px] text-indigo-600 font-medium uppercase mt-0.5">{profile.currentRole}</p>}
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 border-t border-slate-200 pt-4">
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Contact</h4>
                        <div className="space-y-1.5 text-[9px] text-slate-500 word-break">
                          <p className="flex items-center gap-1.5"><Mail size={9} /> {profile.email}</p>
                          <p className="flex items-center gap-1.5"><Phone size={9} /> {profile.phone}</p>
                          {profile.address && <p className="flex items-center gap-1.5"><MapPin size={9} /> {profile.district}</p>}
                          {profile.linkedin && (
                            <p className="flex items-center gap-1.5">
                              <ExternalLink size={9} className="text-indigo-600" />
                              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600 truncate max-w-[120px]">LinkedIn</a>
                            </p>
                          )}
                          {profile.website && (
                            <p className="flex items-center gap-1.5">
                              <ExternalLink size={9} className="text-indigo-600" />
                              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600 truncate max-w-[120px]">Portfolio</a>
                            </p>
                          )}
                          {portfolio.map((link: string, idx: number) => (
                            <p key={idx} className="flex items-center gap-1.5">
                              <ExternalLink size={9} className="text-indigo-600" />
                              <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline text-indigo-600 truncate max-w-[120px]">
                                Link {idx + 1}
                              </a>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Personal Info */}
                      {((profile.dob || profile.seekerDob) || (profile.gender || profile.seekerGender)) && (
                        <div className="space-y-2 border-t border-slate-200 pt-4">
                          <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Personal</h4>
                          <div className="space-y-1 text-[9px] text-slate-500">
                            {(profile.dob || profile.seekerDob) && <p>DOB: {profile.dob || profile.seekerDob}</p>}
                            {(profile.gender || profile.seekerGender) && <p className="capitalize">Gender: {profile.gender || profile.seekerGender}</p>}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div className="space-y-2 border-t border-slate-200 pt-4">
                          <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Skills</h4>
                          <div className="flex flex-wrap gap-1">
                            {skills.map((s: string) => (
                              <span key={s} className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Languages */}
                      {languages.length > 0 && (
                        <div className="space-y-2 border-t border-slate-200 pt-4">
                          <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Languages</h4>
                          <p className="text-[9px] text-slate-500">{languages.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column (col-span-2) */}
                  <div className="col-span-2 space-y-5">
                    {/* Summary */}
                    {summary && (
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b-2 border-indigo-500 pb-1">Profile</h3>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{summary}</p>
                      </div>
                    )}

                    {/* Experience */}
                    {experience.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b-2 border-indigo-500 pb-1">Experience</h3>
                        {experience.map((exp: any, idx: number) => (
                          <div key={exp.id || idx} className="space-y-0.5">
                            <p className="font-semibold text-slate-900 text-[10px]">{exp.role} at {exp.company}</p>
                            <p className="text-[8px] text-slate-500">{exp.startDate} – {exp.endDate}</p>
                            {exp.description && <p className="text-[9px] text-slate-500 leading-normal mt-1">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Projects */}
                    {projects.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b-2 border-indigo-500 pb-1">Projects</h3>
                        {projects.map((proj: any, idx: number) => (
                          <div key={proj.id || idx} className="space-y-0.5">
                            <div className="flex justify-between font-semibold text-slate-900 text-[10px]">
                              <span>{proj.title}</span>
                              {proj.url && <a href={proj.url} className="text-indigo-600 text-[8px] hover:underline">Link</a>}
                            </div>
                            {proj.technologies && <p className="text-[8px] text-slate-500">Tech: {proj.technologies}</p>}
                            {proj.description && <p className="text-[9px] text-slate-500 leading-normal mt-1">{proj.description}</p>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Certifications */}
                    {certifications.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b-2 border-indigo-500 pb-1">Certifications</h3>
                        <ul className="list-disc list-inside text-[9px] text-slate-500 space-y-0.5">
                          {certifications.map((c: any, idx: number) => (
                            <li key={c.id || idx}>{c.name} ({c.organization})</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b-2 border-indigo-500 pb-1">Education</h3>
                        {education.map((edu: any, idx: number) => (
                          <div key={edu.id || idx} className="space-y-0.5">
                            <p className="font-semibold text-slate-900 text-[10px]">{edu.degree} in {edu.field}</p>
                            <p className="text-[9px] text-slate-500">{edu.institution} · {edu.year}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Achievements */}
                    {achievements.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b-2 border-indigo-500 pb-1">Achievements</h3>
                        <div className="space-y-1.5">
                          {achievements.map((ach: any, idx: number) => (
                            <div key={ach.id || idx} className="space-y-0.5">
                              <p className="font-semibold text-slate-900 text-[10px]">{ach.name}</p>
                              {ach.description && <p className="text-[9px] text-slate-500 leading-normal">{ach.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Digital Member ID Card & QR Code */}
                  <div className="col-span-3 pt-5 border-t border-slate-200 mt-5 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-8">
                      {/* Mini Digital ID Card */}
                      <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-[#0e1224] to-[#1e2a4a] text-white p-4 shadow-md flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl overflow-hidden border border-white/20 bg-slate-900/50 relative flex-shrink-0">
                            {photoUrl ? (
                              <img src={photoUrl} alt={profile.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-black bg-gradient-to-br from-slate-800 to-slate-950 text-indigo-400 uppercase">
                                {initials}
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <span className="text-[7px] tracking-[0.2em] font-black text-indigo-400 uppercase block leading-none">THENIJOBS</span>
                            <h4 className="text-xs font-black text-white leading-tight truncate">{profile.name}</h4>
                            <p className="text-[8px] font-semibold text-indigo-400 leading-normal">{profile.currentRole || 'Job Seeker'}</p>
                            <p className="text-[8px] font-mono font-bold text-slate-300 mt-0.5 leading-none">
                              {profile.candidateId || `TNI-${user?.uid?.slice(0, 8).toUpperCase()}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[8px] text-slate-400 space-y-0.5 border-l border-white/10 pl-3 text-left">
                          <p><span className="font-semibold text-slate-500 uppercase">Location:</span> {profile.district || 'Tamil Nadu'}</p>
                          <p><span className="font-semibold text-slate-500 uppercase">Member:</span> Verified</p>
                          <p><span className="font-semibold text-slate-500 uppercase">Status:</span> Active</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4 flex flex-col items-center justify-center text-center pl-2">
                      <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm inline-block">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="Verify Profile QR" className="w-12 h-12" crossOrigin="anonymous" />}
                      </div>
                      <span className="text-[7px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Scan to Verify Profile</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────── */}
              {/* LAYOUT 3: SIMPLE                                           */}
              {/* ────────────────────────────────────────────────────────── */}
              {selectedTemplate === 'simple' && (
                <div className="space-y-5 text-xs text-gray-800 font-sans">
                  {/* Minimalist Header */}
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4 gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                      {profile.currentRole && <p className="text-xs text-gray-500 mt-0.5">{profile.currentRole}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-[9px] text-gray-500 space-y-0.5">
                        <p>{profile.email}</p>
                        <p>{profile.phone}</p>
                        {profile.address && <p>{profile.district}</p>}
                      </div>
                      {photoUrl && (
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                          <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Details */}
                  {((profile.dob || profile.seekerDob) || (profile.gender || profile.seekerGender)) && (
                    <div className="text-[10px] text-gray-500 border-b border-gray-100 pb-2 flex gap-4">
                      {(profile.dob || profile.seekerDob) && <span>DOB: {profile.dob || profile.seekerDob}</span>}
                      {(profile.gender || profile.seekerGender) && <span className="capitalize">Gender: {profile.gender || profile.seekerGender}</span>}
                    </div>
                  )}

                  {/* Social & Portfolio Links */}
                  {(profile.linkedin || profile.website || portfolio.length > 0) && (
                    <div className="text-[10px] text-gray-500 border-b border-gray-100 pb-2 flex gap-4 flex-wrap">
                      {profile.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-0.5 font-medium">
                          LinkedIn <ExternalLink size={8} />
                        </a>
                      )}
                      {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-0.5 font-medium">
                          Portfolio <ExternalLink size={8} />
                        </a>
                      )}
                      {portfolio.map((link: string, idx: number) => (
                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-0.5 font-medium">
                          Link {idx + 1} <ExternalLink size={8} />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Summary */}
                  {summary && (
                    <p className="text-[10px] leading-relaxed italic text-gray-500 font-serif">{summary}</p>
                  )}

                  {/* Experience */}
                  {experience.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Experience</h3>
                      <div className="space-y-3">
                        {experience.map((exp: any, idx: number) => (
                          <div key={exp.id || idx} className="grid grid-cols-4 gap-2">
                            <span className="col-span-1 text-[9px] text-gray-500">{exp.startDate} - {exp.endDate}</span>
                            <div className="col-span-3 space-y-1">
                              <p className="font-bold text-gray-900 text-[10px]">{exp.role} — {exp.company}</p>
                              {exp.description && <p className="text-[9px] text-gray-500 leading-normal">{exp.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {education.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Education</h3>
                      <div className="space-y-2">
                        {education.map((edu: any, idx: number) => (
                          <div key={edu.id || idx} className="grid grid-cols-4 gap-2">
                            <span className="col-span-1 text-[9px] text-gray-500">{edu.year}</span>
                            <div className="col-span-3">
                              <p className="font-bold text-gray-900 text-[10px]">{edu.degree} · {edu.field}</p>
                              <p className="text-[9px] text-gray-500">{edu.institution}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Projects</h3>
                      <div className="space-y-2">
                        {projects.map((proj: any, idx: number) => (
                          <div key={proj.id || idx} className="grid grid-cols-4 gap-2">
                            <span className="col-span-1 text-[9px] text-gray-500">
                              {proj.url ? (
                                <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-0.5">
                                  Link <ExternalLink size={8} />
                                </a>
                              ) : (
                                'Project'
                              )}
                            </span>
                            <div className="col-span-3 space-y-0.5">
                              <p className="font-bold text-gray-900 text-[10px]">{proj.title}</p>
                              {proj.technologies && <p className="text-[8px] text-gray-400">Technologies: {proj.technologies}</p>}
                              {proj.description && <p className="text-[9px] text-gray-500 leading-normal">{proj.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Skills</h3>
                      <p className="text-[9px] text-gray-500 leading-relaxed">{skills.join(', ')}</p>
                    </div>
                  )}

                  {/* Languages */}
                  {languages.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Languages</h3>
                      <p className="text-[9px] text-gray-500 leading-relaxed">{languages.join(', ')}</p>
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Certifications</h3>
                      <ul className="list-disc list-inside text-[9px] text-gray-500 space-y-0.5">
                        {certifications.map((c: any, idx: number) => (
                          <li key={c.id || idx}>{c.name} ({c.organization})</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Achievements */}
                  {achievements.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">Achievements</h3>
                      <div className="space-y-2">
                        {achievements.map((ach: any, idx: number) => (
                          <div key={ach.id || idx} className="grid grid-cols-4 gap-2">
                            <span className="col-span-1 text-[9px] text-gray-500">Award / Key</span>
                            <div className="col-span-3 space-y-0.5">
                              <p className="font-bold text-gray-900 text-[10px]">{ach.name}</p>
                              {ach.description && <p className="text-[9px] text-gray-500 leading-normal">{ach.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Digital Member ID Card & QR Code */}
                  <div className="pt-5 border-t border-gray-100 mt-5 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-8">
                      {/* Mini Digital ID Card */}
                      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-[#0e1224] to-[#1e2a4a] text-white p-4 shadow-md flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl overflow-hidden border border-white/20 bg-slate-900/50 relative flex-shrink-0">
                            {photoUrl ? (
                              <img src={photoUrl} alt={profile.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-black bg-gradient-to-br from-slate-800 to-slate-950 text-emerald-400 uppercase">
                                {initials}
                              </div>
                            )}
                          </div>
                          <div className="text-left">
                            <span className="text-[7px] tracking-[0.2em] font-black text-emerald-400 uppercase block leading-none">THENIJOBS</span>
                            <h4 className="text-xs font-black text-white leading-tight truncate">{profile.name}</h4>
                            <p className="text-[8px] font-semibold text-emerald-400 leading-normal">{profile.currentRole || 'Job Seeker'}</p>
                            <p className="text-[8px] font-mono font-bold text-slate-300 mt-0.5 leading-none">
                              {profile.candidateId || `TNI-${user?.uid?.slice(0, 8).toUpperCase()}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-[8px] text-slate-400 space-y-0.5 border-l border-white/10 pl-3 text-left">
                          <p><span className="font-semibold text-slate-500 uppercase">Location:</span> {profile.district || 'Tamil Nadu'}</p>
                          <p><span className="font-semibold text-slate-500 uppercase">Member:</span> Verified</p>
                          <p><span className="font-semibold text-slate-500 uppercase">Status:</span> Active</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4 flex flex-col items-center justify-center text-center pl-2">
                      <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm inline-block">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="Verify Profile QR" className="w-12 h-12" crossOrigin="anonymous" />}
                      </div>
                      <span className="text-[7px] font-bold text-gray-500 mt-1 uppercase tracking-wider">Scan to Verify Profile</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
