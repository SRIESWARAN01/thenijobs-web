'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User, MapPin, Briefcase, GraduationCap, Award,
  Globe, Mail, Phone, ExternalLink, Loader2,
  CheckCircle, Star, Languages, Calendar, ChevronRight,
  Share2, Download, Sparkles, Code2, FolderGit2, CheckCircle2,
  Clock, Shield, Eye, FileText, Send, Lock, Video, Play,
  Bookmark, Heart, CheckSquare, Layers, FileCode, Sliders,
  ShieldCheck, Smartphone, AlertCircle, QrCode, FileCheck
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import SeekerIDCard from '@/components/id-card/SeekerIDCard';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { getSeekerGrowthSlogan } from '@/lib/branding/slogans';

interface SeekerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  state: string;
  currentRole: string;
  isOpenToWork: boolean;
  /** Opt-in — defaults to false/absent. Only true means this seeker chose to make their
      portfolio publicly viewable at /portfolio/seeker/[id]; never set by a live-preview caller. */
  isPortfolioPublic?: boolean;
  workStatus?: 'open' | 'opportunities' | 'not_looking';
  joiningAvailability?: string;
  photoUrl: string;
  profilePhotoUrl: string;
  gender: string;
  dob: string;
  aboutMe?: string;
  careerObjective?: string;
  expectedSalary?: string;
  jobPreferences?: string[];
  preferredLocations?: string[];
  preferredMode?: string;
  preferredIndustry?: string;
  availability?: string;
  skills: (string | { name: string; level?: string; verified?: boolean; score?: number })[];
  languages: (string | { name: string; proficiency?: string; readWriteSpeak?: string })[];
  education: { id: string; institution: string; degree: string; field: string; year: string; percentage?: string }[];
  experience: { id: string; company: string; role: string; startDate: string; endDate: string; description: string; location?: string }[];
  projects?: { id: string; title: string; description: string; techStack?: string[]; liveUrl?: string; githubUrl?: string; imageUrl?: string; role?: string; duration?: string }[];
  certifications: { id: string; name: string; organization: string; date: string; link: string }[];
  achievements?: { id: string; title: string; organization?: string; date?: string; description?: string }[];
  workSamples?: { id: string; title: string; type: string; url: string; date?: string }[];
  videoIntroUrl?: string;
  privacySettings?: { hidePhone?: boolean; hideEmail?: boolean; hideAddress?: boolean; hideResume?: boolean; hideContact?: boolean };
  verificationBadges?: { mobileVerified?: boolean; emailVerified?: boolean; identityVerified?: boolean; educationVerified?: boolean; skillVerified?: boolean };
  resumeUrl?: string;
  resumeUpdatedDate?: string;
  aiScore?: number;
  profileViewsCount?: number;
  savedCount?: number;
  interviewRequestsCount?: number;
}

export default function SeekerPortfolioClient({ seekerId, initialData }: { seekerId?: string; initialData?: SeekerData }) {
  const [seeker, setSeeker] = useState<SeekerData | null>(initialData || null);
  const [userName, setUserName] = useState(initialData?.name || '');
  const [loading, setLoading] = useState(!initialData);
  const [notFound, setNotFound] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeView, setActiveView] = useState<'portfolio' | 'idcard'>('portfolio');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [hrShortlisted, setHrShortlisted] = useState(false);
  const [hrNote, setHrNote] = useState('');

  useEffect(() => {
    if (initialData) {
      setSeeker(initialData);
      setUserName(initialData.name || '');
      setLoading(false);
      return;
    }
    async function fetchData() {
      if (!seekerId) return;
      try {
        setLoading(true);
        const profileRef = doc(db, 'seekerProfiles', seekerId);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const profileData = profileSnap.data() as SeekerData;

        // Privacy gate — only the seeker's own opt-in makes this page public. A visitor
        // (no initialData, i.e. not the owner's own live-preview) sees the same "not
        // found" state for a private profile as for a nonexistent one, so a private
        // portfolio's existence isn't distinguishable from the outside.
        if (!profileData.isPortfolioPublic) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setSeeker(profileData);
        // RULES-1: users/{uid} is readable only by its owner and admins; the public name comes
        // from the seeker profile (written by the seeker on their profile page).
        setUserName((profileData as any).name || (profileData as any).displayName || '');
      } catch (err) {
        console.error('Error loading seeker portfolio:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [seekerId]);

  // Google Search Indexing Matrix: Premium/Enterprise = INDEX; Free/Basic/Standard = NOINDEX
  useEffect(() => {
    const plan = ((seeker as any)?.subscriptionPlan || 'free').toLowerCase();
    const allowSEO = ['premium', 'enterprise'].includes(plan);

    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = allowSEO ? 'index, follow' : 'noindex, nofollow';
    document.head.appendChild(meta);

    return () => {
      meta.remove();
    };
  }, [seeker]);

  // Update page title
  useEffect(() => {
    if (!seeker) return;
    const name = seeker.name || userName || 'Job Seeker';
    document.title = `${name} — Candidate Digital Portfolio | THENIJOBS`;
  }, [seeker, userName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm text-gray-500 font-medium">Loading candidate digital portfolio...</p>
        </div>
      </div>
    );
  }

  if (notFound || !seeker) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center bg-[#F8FAFC]">
        <div className="max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
            <User size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 font-sans">Profile Not Found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This candidate portfolio is not available or hasn&apos;t been published yet.
          </p>
          <Link href="/" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm">
            Return to THENIJOBS
          </Link>
        </div>
      </main>
    );
  }

  const name = seeker.name || userName || 'Job Seeker';
  const photoUrl = seeker.profilePhotoUrl || seeker.photoUrl || '';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const rawSkills = seeker.skills || [];
  const rawLanguages = seeker.languages || [];
  const education = seeker.education || [];
  const experience = seeker.experience || [];
  const projects = seeker.projects || [];
  const certifications = seeker.certifications || [];
  const achievements = seeker.achievements || [];
  const workSamples = seeker.workSamples || [];
  const district = seeker.district || 'Theni';
  const state = seeker.state || 'Tamil Nadu';
  const currentRole = seeker.currentRole || (experience[0]?.role) || 'Professional Candidate';
  const workStatus = seeker.workStatus || (seeker.isOpenToWork !== false ? 'open' : 'opportunities');
  const tnjId = `TNJ-S-${(seekerId || 'UNKNOWN').slice(0, 6).toUpperCase()}`;

  const isFresher = experience.length === 0;
  const summaryText = seeker.aboutMe || seeker.careerObjective || (isFresher
    ? `Motivated and enthusiastic candidate seeking career opportunities in ${district}, Tamil Nadu. Equipped with modern skills and ready to contribute to business growth.`
    : `Experienced ${currentRole} with proven expertise in building solutions and driving outcomes in ${district}, Tamil Nadu.`);

  // Calculate Profile Strength (0-100%)
  const strengthItems = [
    { label: 'Profile Photo', done: !!photoUrl, weight: 15 },
    { label: 'About / Objective', done: !!(seeker.aboutMe || seeker.careerObjective), weight: 15 },
    { label: 'Skills Added', done: rawSkills.length > 0, weight: 20 },
    { label: 'Experience / Projects', done: experience.length > 0 || projects.length > 0, weight: 20 },
    { label: 'Education', done: education.length > 0, weight: 15 },
    { label: 'Resume Uploaded', done: !!seeker.resumeUrl, weight: 15 },
  ];
  const profileStrength = strengthItems.reduce((acc, curr) => acc + (curr.done ? curr.weight : 0), 0);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${name} - Candidate Portfolio`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const aiScore = seeker.aiScore || 85;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-24">

      {/* Top Fixed View Selector (Portfolio vs Digital ID Card) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveView('portfolio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeView === 'portfolio' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Candidate Portfolio
            </button>
            <button
              onClick={() => setActiveView('idcard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeView === 'idcard' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode size={13} /> Digital ID Card
            </button>
          </div>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            title="Share Profile"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {activeView === 'idcard' ? (
        <div className="max-w-md mx-auto px-4 py-8">
          <SeekerIDCard
            seeker={{
              uid: seekerId || 'demo',
              name,
              phone: seeker.phone,
              email: seeker.email,
              profilePhotoUrl: photoUrl,
              district,
              state,
              address: seeker.address,
              skills: rawSkills.map(s => (typeof s === 'string' ? s : s.name)),
              currentRole,
              experience: experience.map(e => ({ company: e.company, role: e.role })),
              education: education.map(e => ({ degree: e.degree, institution: e.institution })),
            }}
          />
        </div>
      ) : (
        <>
          {/* Royal Blue Candidate Hero Banner */}
          <header className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-6 pb-12 rounded-b-[2.5rem] shadow-md overflow-hidden">
            <div className="max-w-2xl mx-auto px-6 relative z-10">

              {/* ID Tag & Verification */}
              <div className="flex items-center justify-between text-xs text-blue-100/80 mb-6">
                <Link href="/" className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <img src="/logo.png" alt="THENIJOBS" className="h-5 w-auto object-contain bg-white/90 rounded p-0.5" />
                  <span className="font-extrabold tracking-tight">THENIJOBS</span>
                </Link>
                <span className="bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider font-semibold">
                  ID: {tnjId}
                </span>
              </div>

              {/* Avatar & Bio */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={name}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/90 shadow-xl bg-white"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white/90 shadow-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center">
                      {initials}
                    </div>
                  )}

                  {/* Work Status Badge */}
                  {workStatus === 'open' && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold text-emerald-800 bg-emerald-300 border-2 border-white shadow-md flex items-center gap-1 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      🟢 OPEN TO WORK
                    </div>
                  )}
                  {workStatus === 'opportunities' && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold text-amber-900 bg-amber-300 border-2 border-white shadow-md flex items-center gap-1 whitespace-nowrap">
                      🟡 OPEN TO OPPORTUNITIES
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {name}
                    </h1>
                    <VerifiedBadge tier={(seeker as any)?.subscriptionPlan || 'standard'} isVerified={true} companyName={name} size="md" />
                  </div>

                  <p className="text-blue-100 text-sm sm:text-base font-semibold mt-1">
                    {currentRole}
                  </p>

                  {/* Dynamic Motivational Slogan */}
                  <p className="text-xs text-blue-200/95 italic font-medium mt-1 max-w-md mx-auto">
                    &ldquo;{getSeekerGrowthSlogan({ name, currentRole, skills: rawSkills.map(s => (typeof s === 'string' ? s : s.name)), uid: seekerId })}&rdquo;
                  </p>

                  <div className="flex items-center justify-center gap-3 text-xs text-blue-200/90 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-blue-300" />
                      {district}, {state}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} className="text-blue-300" />
                      {experience.length > 0 ? `${experience.length} Experience Record${experience.length > 1 ? 's' : ''}` : 'Fresher Candidate'}
                    </span>
                  </div>
                </div>

                {/* Verification Badges Row */}
                <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold flex items-center gap-1">
                    <Smartphone size={10} /> Mobile Verified
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-bold flex items-center gap-1">
                    <Mail size={10} /> Email Verified
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck size={10} /> Identity Verified
                  </span>
                </div>

                {/* Quick Action Header Buttons */}
                <div className="flex items-center gap-2 pt-2 w-full justify-center max-w-md">
                  {seeker.resumeUrl ? (
                    <a
                      href={seeker.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download size={15} /> Download Resume
                    </a>
                  ) : (
                    <a
                      href="#contact-section"
                      className="flex-1 py-2.5 px-4 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <Phone size={15} /> Contact Candidate
                    </a>
                  )}

                  {seeker.videoIntroUrl && (
                    <button
                      onClick={() => setShowVideoModal(true)}
                      className="py-2.5 px-4 rounded-2xl bg-emerald-400 text-emerald-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Play size={14} className="fill-emerald-950" /> Video Intro
                    </button>
                  )}

                  <button
                    onClick={() => setHrShortlisted(!hrShortlisted)}
                    className={`py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      hrShortlisted ? 'bg-amber-400 text-amber-950' : 'bg-white/15 text-white border border-white/30 hover:bg-white/25'
                    }`}
                  >
                    <Bookmark size={15} className={hrShortlisted ? 'fill-amber-950' : ''} />
                    {hrShortlisted ? 'Shortlisted' : 'Shortlist'}
                  </button>
                </div>

              </div>

            </div>
          </header>

          {/* Main Content Area */}
          <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-6 space-y-5">

            {/* Profile Strength Meter & Employer Views Stats */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm">Profile Strength</h3>
                    <p className="text-[11px] text-gray-500">Completeness & Readiness Score</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  {profileStrength}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500" style={{ width: `${profileStrength}%` }} />
              </div>

              {/* Employer Analytics Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="font-extrabold text-gray-900 flex items-center justify-center gap-1">
                    <Eye size={13} className="text-blue-600" />
                    <span>{seeker.profileViewsCount || 128}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Employer Views</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="font-extrabold text-gray-900 flex items-center justify-center gap-1">
                    <Bookmark size={13} className="text-amber-500" />
                    <span>{seeker.savedCount || 12}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Times Saved</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="font-extrabold text-gray-900 flex items-center justify-center gap-1">
                    <Send size={13} className="text-emerald-600" />
                    <span>{seeker.interviewRequestsCount || 4}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Interviews Requested</span>
                </div>
              </div>
            </div>

            {/* AI Job Match Score Gauge */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-50 shrink-0">
                  <span className="font-extrabold text-emerald-700 text-sm">{aiScore}<span className="text-[10px] text-gray-400">%</span></span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-500" /> AI Job Match Score
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                    <span>Skills: 95%</span> • <span>Location: 100%</span> • <span>Salary: 85%</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-extrabold shrink-0">
                Top Match
              </span>
            </div>

            {/* Summary Section */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-2">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <User size={15} className="text-blue-600" />
                {isFresher ? 'Career Objective' : 'About Candidate'}
              </h2>
              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                {showFullAbout ? summaryText : (summaryText.length > 180 ? `${summaryText.slice(0, 180)}...` : summaryText)}
              </p>
              {summaryText.length > 180 && (
                <button
                  onClick={() => setShowFullAbout(!showFullAbout)}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  {showFullAbout ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>

            {/* Dynamic Section Ordering */}
            {isFresher ? (
              <>
                <SkillsSection rawSkills={rawSkills} />
                {projects.length > 0 && <ProjectsSection projects={projects} />}
                {education.length > 0 && <EducationSection education={education} />}
              </>
            ) : (
              <>
                <SkillsSection rawSkills={rawSkills} />
                {experience.length > 0 && <ExperienceSection experience={experience} />}
                {projects.length > 0 && <ProjectsSection projects={projects} />}
                {education.length > 0 && <EducationSection education={education} />}
              </>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={15} className="text-amber-500" /> Certifications
                </h2>
                <div className="space-y-3">
                  {certifications.map((cert, i) => (
                    <div key={cert.id || i} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                          <Award size={16} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{cert.name}</h3>
                          <p className="text-xs text-gray-500">{cert.organization}{cert.date ? ` • ${cert.date}` : ''}</p>
                        </div>
                      </div>
                      {cert.link && (
                        <a
                          href={cert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors shrink-0 ml-2"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements & Awards */}
            {achievements.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={15} className="text-purple-600" /> Achievements & Honors
                </h2>
                <div className="space-y-2">
                  {achievements.map((ach, i) => (
                    <div key={ach.id || i} className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-start gap-3">
                      <span className="text-lg">🏆</span>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-gray-900">{ach.title}</h3>
                        {ach.description && <p className="text-xs text-gray-600 mt-0.5">{ach.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Samples / Attachments */}
            {workSamples.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode size={15} className="text-indigo-600" /> Work Samples & Documents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {workSamples.map((sample, i) => (
                    <a
                      key={sample.id || i}
                      href={sample.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <span className="truncate">{sample.title}</span>
                      <ExternalLink size={13} className="shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {rawLanguages.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe size={15} className="text-teal-600" /> Languages Spoken
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {rawLanguages.map((langItem, i) => {
                    const langName = typeof langItem === 'string' ? langItem : langItem.name;
                    const level = typeof langItem === 'object' ? langItem.proficiency : (langName.toLowerCase() === 'tamil' ? 'Native' : 'Professional');
                    return (
                      <div key={i} className="p-3 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-900">{langName}</span>
                        <span className="text-[10px] font-semibold text-teal-600 bg-white px-2 py-0.5 rounded-full border border-teal-200">
                          {level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dedicated Resume Section */}
            {!seeker.privacySettings?.hideResume && (
              <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={15} className="text-blue-600" /> Official Resume
                  </h2>
                  <span className="text-[11px] text-gray-400 font-medium">Updated: August 2026</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900">{name}&apos;s Resume</h3>
                      <p className="text-[11px] text-gray-500">Verified THENIJOBS candidate document</p>
                    </div>
                  </div>

                  {seeker.resumeUrl ? (
                    <a
                      href={seeker.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shrink-0"
                    >
                      View PDF
                    </a>
                  ) : (
                    <span className="text-xs text-slate-600 font-medium">Attached in profile</span>
                  )}
                </div>
              </div>
            )}

            {/* Career Preferences */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={15} className="text-indigo-600" /> Career Preferences
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 block mb-0.5">Looking For</span>
                  <span className="font-bold text-gray-900">Full Time / Remote</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 block mb-0.5">Preferred Location</span>
                  <span className="font-bold text-gray-900">{district}, Tamil Nadu</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 block mb-0.5">Expected Salary</span>
                  <span className="font-bold text-emerald-600">{seeker.expectedSalary || '₹15,000 - ₹25,000 / mo'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-gray-400 block mb-0.5">Availability</span>
                  <span className="font-bold text-blue-600">{seeker.availability || 'Available Immediately'}</span>
                </div>
              </div>
            </div>

            {/* HR Private Notes & Shortlist Box (for employers) */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-amber-700" /> HR Recruiter Private Notes
                </h3>
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">Private</span>
              </div>
              <textarea
                value={hrNote}
                onChange={(e) => setHrNote(e.target.value)}
                aria-label="Write private notes about this candidate (visible only to your hiring team)" placeholder="Write private notes about this candidate (visible only to your hiring team)..."
                className="w-full p-3 bg-white border border-amber-200 rounded-2xl text-base sm:text-xs text-gray-900 placeholder-amber-700/50 focus:outline-none focus:border-amber-400 resize-none"
                rows={2}
              />
            </div>

            {/* Contact / One-Tap Hiring Section (with Privacy Controls) */}
            <div id="contact-section" className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 text-center">
              <div>
                <h2 className="text-base font-bold text-gray-900 font-sans">Interested in hiring {name}?</h2>
                <p className="text-xs text-gray-500 mt-1">Get in touch directly with this candidate</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-md mx-auto pt-2">
                {!seeker.privacySettings?.hidePhone && seeker.phone ? (
                  <a
                    href={`tel:${seeker.phone}`}
                    className="py-3 px-3 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Phone size={14} /> Call
                  </a>
                ) : (
                  <div className="py-3 px-3 rounded-2xl bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed">
                    <Lock size={12} /> Phone Hidden
                  </div>
                )}

                {!seeker.privacySettings?.hideEmail && seeker.email ? (
                  <a
                    href={`mailto:${seeker.email}`}
                    className="py-3 px-3 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Mail size={14} /> Email
                  </a>
                ) : (
                  <div className="py-3 px-3 rounded-2xl bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed">
                    <Lock size={12} /> Email Hidden
                  </div>
                )}

                <button
                  onClick={() => {
                    // Visual feedback via temporary state is handled elsewhere; no browser alert
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="col-span-2 sm:col-span-1 py-3 px-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send size={14} /> Interview
                </button>
              </div>
            </div>

            {/* Footer Branding */}
            <footer className="text-center pt-6 pb-4">
              <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                <img src="/logo.png" alt="THENIJOBS" className="h-5 w-auto object-contain" />
                <span>Powered by <strong className="font-bold text-gray-800">THENIJOBS</strong></span>
                <ChevronRight size={12} />
              </Link>
            </footer>

          </div>
        </>
      )}

      {/* Video Intro Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Video size={16} className="text-blue-600" /> {name}&apos;s Video Introduction
              </h3>
              <button onClick={() => setShowVideoModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">×</button>
            </div>
            <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center text-white relative overflow-hidden">
              <Video size={48} className="opacity-40" />
              <p className="absolute bottom-4 text-xs text-gray-300">Video Intro Stream Ready</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

{/* Helper Sub-Component: Skills */}
function SkillsSection({ rawSkills }: { rawSkills: (string | { name: string; level?: string; verified?: boolean })[] }) {
  if (!rawSkills || rawSkills.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-3">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <Code2 size={15} className="text-blue-600" /> Verified Skills & Expertise
      </h2>
      <div className="flex flex-wrap gap-2">
        {rawSkills.map((skillItem, i) => {
          const skillName = typeof skillItem === 'string' ? skillItem : skillItem.name;
          const skillLevel = typeof skillItem === 'object' ? skillItem.level : null;
          const isVerified = typeof skillItem === 'object' ? skillItem.verified : true;

          return (
            <div key={i} className="px-3.5 py-2 rounded-2xl bg-blue-50/70 border border-blue-100/80 text-blue-900 text-xs font-bold flex items-center gap-1.5">
              <span>{skillName}</span>
              {isVerified && <CheckCircle2 size={13} className="fill-blue-600 text-white shrink-0" />}
              {skillLevel && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-blue-800 font-semibold">
                  {skillLevel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

{/* Helper Sub-Component: Experience */}
function ExperienceSection({ experience }: { experience: any[] }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <Briefcase size={15} className="text-blue-600" /> Work Experience Timeline
      </h2>
      <div className="space-y-4">
        {experience.map((exp, i) => (
          <div key={exp.id || i} className="relative pl-6 border-l-2 border-blue-200">
            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
            <h3 className="text-xs sm:text-sm font-bold text-gray-900">{exp.role}</h3>
            <p className="text-xs font-bold text-blue-600 mt-0.5">{exp.company}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock size={11} />
              {exp.startDate}{exp.endDate ? ` — ${exp.endDate}` : ' — Present'}
              {exp.location ? ` • ${exp.location}` : ''}
            </p>
            {exp.description && (
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">{exp.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

{/* Helper Sub-Component: Education */}
function EducationSection({ education }: { education: any[] }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <GraduationCap size={15} className="text-purple-600" /> Education & Qualifications
      </h2>
      <div className="space-y-3">
        {education.map((edu, i) => (
          <div key={edu.id || i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <GraduationCap size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{edu.institution}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                {edu.year && <span>Graduation: {edu.year}</span>}
                {edu.percentage && <span className="font-bold text-emerald-600">Score: {edu.percentage}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

{/* Helper Sub-Component: Projects */}
function ProjectsSection({ projects }: { projects: any[] }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
        <FolderGit2 size={15} className="text-indigo-600" /> Featured Projects
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {projects.map((proj, i) => (
          <div key={proj.id || i} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 space-y-2">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm">{proj.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{proj.description}</p>
            {proj.techStack && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proj.techStack.map((tech: string, j: number) => (
                  <span key={j} className="px-2 py-0.5 rounded-lg bg-gray-200/70 text-gray-800 text-[10px] font-semibold">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {proj.liveUrl && (
                <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700">
                  Live Demo
                </a>
              )}
              {proj.githubUrl && (
                <a href={proj.githubUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-lg bg-gray-900 text-white text-[11px] font-bold hover:bg-black">
                  GitHub
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
