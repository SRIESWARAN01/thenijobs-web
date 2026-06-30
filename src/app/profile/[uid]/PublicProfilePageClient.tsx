'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Award, BadgeCheck, Briefcase, Download, GraduationCap, 
  Mail, MapPin, Phone, ShieldCheck, Star, ExternalLink, 
  Globe, Languages, Calendar, Compass, User, Sparkles
} from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';
import { useAuth } from '@/hooks/useAuth';

interface PublicProfile {
  name?: string;
  displayName?: string;
  currentRole?: string;
  qualification?: string;
  district?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  profilePhotoUrl?: string;
  photoURL?: string;
  skills?: string[];
  languages?: string[];
  education?: any[];
  experience?: any[];
  achievements?: any[];
  certifications?: any[];
  portfolio?: string[];
  portfolioLinks?: string[];
  resumeUrl?: string;
  isOpenToWork?: boolean;
  profileStrength?: number;
  role?: string;
  candidateId?: string;
  aboutMe?: string;
  completedCourses?: any[];
  gamification?: any;
}

function getText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getEntryTitle(entry: any, fallback: string) {
  return getText(entry?.degree || entry?.role || entry?.name || entry?.title, fallback);
}

function getEntrySubtitle(entry: any) {
  return getText(entry?.institution || entry?.company || entry?.organization || entry?.field || entry?.description);
}

export default function PublicProfilePageClient({ uid }: { uid: string }) {
  const { user: currentUser } = useAuth();

  // Determine if the visitor is the owner of the profile or an administrator.
  // Private collections (seekerProfiles, users) are restricted, so we only query them for authorized users to avoid console errors.
  const isAuthorized = useMemo(() => {
    return !!(
      currentUser &&
      (currentUser.uid === uid || currentUser.role === 'admin' || (currentUser as any).adminRole === true)
    );
  }, [currentUser, uid]);

  const { data: publicProfile, loading: l1 } = useDocument<PublicProfile>('publicProfiles', uid);
  const { data: seekerProfile, loading: l2 } = useDocument<PublicProfile>('seekerProfiles', isAuthorized ? uid : null);
  const { data: userProfile, loading: l3 } = useDocument<PublicProfile>('users', isAuthorized ? uid : null);

  const loading = l1 || ((!publicProfile) && l2) || ((!publicProfile && !seekerProfile) && l3);

  const profile = useMemo(() => {
    if (publicProfile) return publicProfile;
    if (seekerProfile) return seekerProfile;
    if (userProfile) return userProfile;
    return null;
  }, [publicProfile, seekerProfile, userProfile]);

  const portfolioUrls = useMemo(() => {
    const list = profile?.portfolio || profile?.portfolioLinks || [];
    return Array.isArray(list) ? list.filter(Boolean) : [];
  }, [profile?.portfolio, profile?.portfolioLinks]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030014] text-white">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-500/10 border-t-cyan-400" />
          <Sparkles className="absolute text-cyan-400 animate-pulse" size={20} />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#030014] px-6 text-center text-white relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/10 rounded-full blur-3xl -z-10" />
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
          <h1 className="text-2xl font-outfit font-black text-rose-400">Portfolio Not Available</h1>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            The requested portfolio is currently private or does not exist on the THENIJOBS network.
          </p>
          <div className="mt-6">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/20 transition-all">
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const name = profile.name || profile.displayName || 'THENIJOBS Member';
  const photoUrl = profile.photoUrl || profile.profilePhotoUrl || (profile as any).photoURL || '';
  const role = profile.currentRole || profile.qualification || profile.role || 'Job Seeker';

  return (
    <main className="relative min-h-screen bg-[#030014] px-4 py-12 text-white sm:px-6 md:py-20 overflow-hidden font-sans">
      {/* Premium background mesh gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-10 left-1/3 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] -z-10" />

      <div className="mx-auto max-w-5xl space-y-8 relative z-10">
        
        {/* ================= HERO PROFILE BANNER ================= */}
        <section className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.02] shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {/* Animated decorative gradient banner header */}
          <div className="h-44 bg-[linear-gradient(135deg,rgba(124,58,237,0.85)_0%,rgba(79,70,229,0.85)_50%,rgba(6,182,212,0.85)_100%)] relative">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
          </div>
          
          <div className="px-6 pb-8 sm:px-10">
            <div className="-mt-20 flex flex-col gap-6 sm:flex-row sm:items-end">
              {/* Profile Image with glowing border */}
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[2rem] border-4 border-[#030014] bg-slate-900 shadow-xl shadow-black/50 group">
                {photoUrl ? (
                  <Image 
                    src={photoUrl} 
                    alt={name} 
                    fill 
                    sizes="128px" 
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-950 text-4xl font-black text-indigo-300">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                {/* Visual glass sheen overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Seeker Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-outfit text-3xl font-black tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-200">
                    {name}
                  </h1>
                  
                  {profile.candidateId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 text-xs font-bold text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.1)]">
                      <ShieldCheck size={13} className="text-cyan-400 fill-cyan-400/10 shrink-0" /> Verified Member
                    </span>
                  )}
                  
                  {profile.isOpenToWork !== false && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Open to Work
                    </span>
                  )}
                </div>
                
                <p className="mt-2 text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300">
                  {role} {profile.candidateId && <span className="text-xs text-gray-500 font-mono ml-2">({profile.candidateId})</span>}
                </p>
                
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-400">
                  {profile.district && (
                    <span className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 border border-white/[0.05]">
                      <MapPin size={15} className="text-indigo-400" />
                      {profile.district}
                    </span>
                  )}
                  {profile.email && (
                    <a 
                      href={`mailto:${profile.email}`} 
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 border border-white/[0.05] hover:text-indigo-300 hover:border-indigo-500/30 transition-all"
                    >
                      <Mail size={15} className="text-indigo-400" />
                      {profile.email}
                    </a>
                  )}
                  {profile.phone && (
                    <a 
                      href={`tel:${profile.phone}`} 
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 border border-white/[0.05] hover:text-indigo-300 hover:border-indigo-500/30 transition-all"
                    >
                      <Phone size={15} className="text-indigo-400" />
                      {profile.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Digital ID Button CTA */}
              <div className="mt-6 sm:mt-0">
                <Link
                  href={`/id?uid=${uid}`}
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-3.5 text-sm font-black text-white hover:opacity-90 transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_20px_rgba(79,70,229,0.3)] border border-indigo-500/30"
                >
                  <ShieldCheck size={17} className="text-cyan-300" /> Digital ID Card
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= QUICK STATS GRID ================= */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-lg shadow-black/20 hover:border-white/[0.12] transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  {Number(profile.profileStrength || 0)}%
                </div>
                <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mt-0.5">Profile Strength</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-lg shadow-black/20 hover:border-white/[0.12] transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <BadgeCheck size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  {profile.skills?.length || 0}
                </div>
                <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mt-0.5">Skills Verified</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-lg shadow-black/20 hover:border-white/[0.12] transition-colors relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Award size={20} />
              </div>
              <div>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  {profile.certifications?.length || 0}
                </div>
                <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mt-0.5">Certificates</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MAIN CONTENT COLUMNS ================= */}
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          
          {/* LEFT SIDEBAR (Skills, Languages, Portfolios) */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Skills Card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-lg">
              <h2 className="flex items-center gap-2.5 text-lg font-outfit font-black tracking-tight text-white mb-4">
                <Star size={18} className="text-cyan-400 fill-cyan-400/10 shrink-0" />
                Technical Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <span 
                      key={skill} 
                      className="rounded-xl border border-cyan-500/15 bg-gradient-to-r from-cyan-500/5 to-indigo-500/5 px-3 py-1.5 text-xs font-semibold text-cyan-200 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* Languages Card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-lg">
              <h2 className="flex items-center gap-2.5 text-lg font-outfit font-black tracking-tight text-white mb-4">
                <Languages size={18} className="text-indigo-400 shrink-0" />
                Languages Spoken
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.languages && profile.languages.length > 0 ? (
                  profile.languages.map((lang) => (
                    <span 
                      key={lang} 
                      className="rounded-xl border border-white/[0.06] bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-gray-300"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No languages listed.</p>
                )}
              </div>
            </div>

            {/* Portfolios & External Links */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-lg">
              <h2 className="flex items-center gap-2.5 text-lg font-outfit font-black tracking-tight text-white mb-4">
                <Globe size={18} className="text-emerald-400 shrink-0" />
                Featured Portfolios
              </h2>
              <div className="space-y-3">
                {portfolioUrls.length > 0 ? (
                  portfolioUrls.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                        <ExternalLink size={14} className="text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-300 group-hover:text-emerald-300 transition-colors truncate">
                          Project Link {idx + 1}
                        </div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">
                          {link}
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No external links uploaded.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT CONTAINER (Experience & Education Timeline, Achievements & Certifications) */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* About Me */}
            {profile.aboutMe && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-lg">
                <h2 className="flex items-center gap-2.5 text-xl font-outfit font-black tracking-tight text-white mb-4">
                  <User size={18} className="text-indigo-400 shrink-0" />
                  About Me
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {profile.aboutMe}
                </p>
              </div>
            )}

            {/* Timeline: Experience */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-lg">
              <h2 className="flex items-center gap-2.5 text-xl font-outfit font-black tracking-tight text-white mb-6">
                <Briefcase size={20} className="text-cyan-400 shrink-0" />
                Work Experience
              </h2>
              
              <div className="relative border-l-2 border-white/[0.08] ml-4 pl-6 space-y-8">
                {profile.experience && profile.experience.length > 0 ? (
                  profile.experience.map((exp: any, index: number) => (
                    <div key={exp.id || index} className="relative group">
                      {/* Timeline node */}
                      <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#030014] border-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)] group-hover:scale-125 transition-transform" />
                      
                      <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 group-hover:border-white/[0.1] hover:bg-white/[0.02] transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold text-base text-white">
                            {getEntryTitle(exp, `Role ${index + 1}`)}
                          </h3>
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                            <Calendar size={11} />
                            {exp.startDate || 'Started'} — {exp.endDate || 'Present'}
                          </span>
                        </div>
                        
                        <p className="mt-1 text-sm font-medium text-indigo-300">
                          {getText(exp.company || exp.organization, 'Company')}
                        </p>
                        
                        {exp.description && (
                          <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No work experience listed yet.
                  </div>
                )}
              </div>
            </div>

            {/* Timeline: Education */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-lg">
              <h2 className="flex items-center gap-2.5 text-xl font-outfit font-black tracking-tight text-white mb-6">
                <GraduationCap size={20} className="text-indigo-400 shrink-0" />
                Education Details
              </h2>
              
              <div className="relative border-l-2 border-white/[0.08] ml-4 pl-6 space-y-8">
                {profile.education && profile.education.length > 0 ? (
                  profile.education.map((edu: any, index: number) => (
                    <div key={edu.id || index} className="relative group">
                      {/* Timeline node */}
                      <span className="absolute -left-[31px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#030014] border-2 border-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.4)] group-hover:scale-125 transition-transform" />
                      
                      <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 group-hover:border-white/[0.1] hover:bg-white/[0.02] transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-bold text-base text-white">
                            {getEntryTitle(edu, `Course ${index + 1}`)}
                          </h3>
                          {edu.year && (
                            <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                              Graduated: {edu.year}
                            </span>
                          )}
                        </div>
                        
                        <p className="mt-1 text-sm font-medium text-emerald-300">
                          {edu.institution || 'Institution'}
                        </p>
                        
                        {edu.field && (
                          <p className="mt-2 text-xs text-gray-400">
                            Major: {edu.field}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No education background listed.
                  </div>
                )}
              </div>
            </div>

            {/* Certifications & Achievements Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              
              {/* Certifications */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-lg">
                <h2 className="flex items-center gap-2.5 text-lg font-outfit font-black tracking-tight text-white mb-4">
                  <Award size={18} className="text-cyan-400 shrink-0" />
                  Certifications
                </h2>
                <div className="space-y-3">
                  {/* Academy Completed Courses */}
                  {profile.completedCourses && profile.completedCourses.length > 0 && (
                    profile.completedCourses.map((c: any) => (
                      <div key={c.courseId} className="rounded-xl bg-violet-600/5 border border-violet-500/15 p-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-all" />
                        <div className="font-bold text-sm text-violet-300">✓ {c.courseName}</div>
                        <div className="text-[10px] text-gray-500 mt-1">THENIJOBS Academy • Completed</div>
                        {c.certificateId && (
                          <a
                            href={`/academy/certificate/${c.certificateId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-violet-400 mt-2 hover:underline font-bold uppercase tracking-wider"
                          >
                            View Verified Credential →
                          </a>
                        )}
                      </div>
                    ))
                  )}

                  {profile.certifications && profile.certifications.length > 0 ? (
                    profile.certifications.map((cert: any, idx: number) => (
                      <div key={cert.id || idx} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
                        <div className="font-bold text-sm text-gray-200">{getEntryTitle(cert, `Certificate ${idx + 1}`)}</div>
                        <div className="text-xs text-gray-400 mt-1">{cert.organization || 'Organization'}</div>
                        {cert.date && <div className="text-[10px] text-gray-500 mt-0.5">{cert.date}</div>}
                        {cert.link && (
                          <a 
                            href={cert.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-cyan-300 mt-2 hover:underline"
                          >
                            Verify Credential <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    (!profile.completedCourses || profile.completedCourses.length === 0) && (
                      <p className="text-sm text-gray-500 py-2">No certificates uploaded.</p>
                    )
                  )}
                </div>
              </div>

              {/* Achievements & Academy Badges */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-lg shadow-black/20 backdrop-blur-lg">
                <h2 className="flex items-center gap-2.5 text-lg font-outfit font-black tracking-tight text-white mb-4">
                  <Star size={18} className="text-amber-400 shrink-0" />
                  Achievements & Badges
                </h2>
                <div className="space-y-3">
                  {/* Academy Badges */}
                  {profile.gamification?.badges && profile.gamification.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
                      {profile.gamification.badges.map((b: any) => (
                        <div key={b.id} className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs" title={b.description}>
                          <span className="text-sm">{b.icon || '🏅'}</span>
                          <span className="font-bold text-amber-300 text-[10px]">{b.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {profile.achievements && profile.achievements.length > 0 ? (
                    profile.achievements.map((ach: any, idx: number) => (
                      <div key={ach.id || idx} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 flex gap-2">
                        <div className="text-amber-400 shrink-0 mt-0.5">🏆</div>
                        <div>
                          <div className="font-bold text-sm text-gray-200">{getEntryTitle(ach, `Award ${idx + 1}`)}</div>
                          {getEntrySubtitle(ach) && <div className="text-xs text-gray-400 mt-1">{getEntrySubtitle(ach)}</div>}
                        </div>
                      </div>
                    ))
                  ) : (
                    (!profile.gamification?.badges || profile.gamification.badges.length === 0) && (
                      <p className="text-sm text-gray-500 py-2">No achievements listed yet.</p>
                    )
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ================= RESUME DOWNLOAD ACTION ================= */}
        {profile.resumeUrl && (
          <section className="flex justify-center pt-8">
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4.5 text-base font-black text-white hover:opacity-90 hover:scale-[1.02] transition-all shadow-[0_8px_24px_rgba(16,185,129,0.3)] border border-emerald-500/25"
            >
              <Download size={18} /> Download Full Resume
            </a>
          </section>
        )}

      </div>
    </main>
  );
}
