'use client';

import { useState } from 'react';
import {
  MapPin, Briefcase, GraduationCap, Award, Globe, Mail, Phone,
  ExternalLink, Download, MessageCircle, Star, Sparkles, Code2,
  FolderGit2, CheckCircle2, ShieldCheck, Play, UserCheck, Eye,
  Share2, Copy, Check, ChevronRight, Calendar, ArrowRight, Heart,
  FileText
} from 'lucide-react';

import type {
  PortfolioSite, SeekerHeroData, SeekerSkillItem,
  SeekerExperienceItem, SeekerEducationItem, SeekerProjectItem,
  SeekerCertificationItem, TestimonialItem, ContactSectionData
} from '@/lib/types/portfolio';

interface Props {
  site: PortfolioSite;
  isPreview?: boolean;
}

export default function SeekerPortfolioRenderer({ site, isPreview }: Props) {
  const { theme, branding, sections, seo } = site;
  const [copied, setCopied] = useState(false);
  const [activeProjectCategory, setActiveProjectCategory] = useState('All');

  // Font and color styling
  const font = theme?.fontFamily || 'Inter';
  const headingFont = theme?.headingFont || 'Poppins';
  const primary = theme?.primaryColor || '#2563EB';
  const secondary = theme?.secondaryColor || '#059669';
  const bg = theme?.backgroundColor || '#FFFFFF';
  const surface = theme?.surfaceColor || '#F8FAFC';
  const text = theme?.textColor || '#111827';
  const muted = theme?.textMutedColor || '#6B7280';
  const radius = theme?.borderRadius === 'full' ? '9999px' : theme?.borderRadius === 'large' ? '18px' : theme?.borderRadius === 'small' ? '6px' : '12px';

  // Section helper
  const getSection = (type: string) => sections.find(s => s.type === type && s.visible);

  const heroSection = getSection('hero');
  const aboutSection = getSection('about');
  const skillsSection = getSection('skills');
  const experienceSection = getSection('experience');
  const educationSection = getSection('education');
  const projectsSection = getSection('projects');
  const certsSection = getSection('certifications');
  const achievementsSection = getSection('achievements');
  const videoSection = getSection('video');
  const testimonialsSection = getSection('testimonials');
  const contactSection = getSection('contact');
  const customSection = getSection('custom');

  // Data unwrappers
  const heroData: Partial<SeekerHeroData> = heroSection?.data || {};
  const aboutData = aboutSection?.data || {};
  const skillsList: SeekerSkillItem[] = skillsSection?.data?.skills || [];
  const experienceList: SeekerExperienceItem[] = experienceSection?.data?.experience || [];
  const educationList: SeekerEducationItem[] = educationSection?.data?.education || [];
  const projectsList: SeekerProjectItem[] = projectsSection?.data?.projects || [];
  const certsList: SeekerCertificationItem[] = certsSection?.data?.certifications || [];
  const achievementsList = achievementsSection?.data?.achievements || [];
  const testimonialsList: TestimonialItem[] = testimonialsSection?.data?.testimonials || [];
  const contactData: Partial<ContactSectionData> = contactSection?.data || {};

  const name = heroData.name || branding?.companyName || 'Professional Seeker';
  const title = heroData.title || branding?.tagline || 'Career Professional';
  const location = heroData.location || 'Theni, Tamil Nadu';
  const avatarUrl = heroData.avatarUrl || branding?.logo;
  const coverUrl = heroData.coverUrl || branding?.coverImage;
  const isOpenToWork = heroData.isOpenToWork !== false;

  // Filter projects by category
  const projectCategories = ['All', ...Array.from(new Set(projectsList.map(p => p.category || 'General')))];
  const filteredProjects = activeProjectCategory === 'All'
    ? projectsList
    : projectsList.filter(p => (p.category || 'General') === activeProjectCategory);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        fontFamily: `'${font}', sans-serif`,
        background: bg,
        color: text
      }}
    >
      {/* ── TOP NAVIGATION BAR ── */}
      <nav
        className="sticky top-0 z-40 backdrop-blur-md border-b transition-all"
        style={{
          background: `${bg}EE`,
          borderColor: `${muted}20`
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-10 h-10 rounded-full object-cover border-2 shadow-xs"
                style={{ borderColor: primary }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shadow-xs"
                style={{ background: primary }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm leading-none" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                  {name}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white flex items-center gap-0.5"
                  style={{ background: secondary }}
                >
                  <ShieldCheck size={10} /> Verified
                </span>
              </div>
              <p className="text-[11px] truncate max-w-[200px] sm:max-w-[300px]" style={{ color: muted }}>
                {title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {heroData.whatsapp && (
              <a
                href={`https://wa.me/${heroData.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${name}, I viewed your portfolio website on THENIJOBS and would like to connect with you regarding job opportunities.`)}`}
                target="_blank"
                rel="noopener"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs"
                style={{ background: '#25D366' }}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
            {heroData.resumeUrl && (
              <a
                href={heroData.resumeUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:opacity-90"
                style={{ background: primary, borderRadius: radius }}
              >
                <Download size={13} /> Resume
              </a>
            )}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border text-xs font-semibold hover:bg-black/5 transition-all flex items-center gap-1"
              style={{ borderColor: `${muted}30`, color: muted }}
              title="Share portfolio link"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO BANNER SECTION ── */}
      {heroSection && (
        <header className="relative overflow-hidden">
          {/* Cover Photo */}
          <div
            className="h-44 sm:h-64 w-full relative bg-gradient-to-r overflow-hidden"
            style={{
              backgroundImage: coverUrl ? `url(${coverUrl})` : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
          </div>

          {/* Profile Details Container */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar + Main Title */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white shadow-xl bg-white"
                      style={{ borderRadius: radius }}
                    />
                  ) : (
                    <div
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black text-white"
                      style={{ background: primary, borderRadius: radius }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isOpenToWork && (
                    <div className="absolute -bottom-2 sm:bottom-1 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-md border-2 border-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Open to Work
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h1
                    className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight"
                    style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}
                  >
                    {name}
                  </h1>
                  <p className="text-sm sm:text-base font-semibold" style={{ color: primary }}>
                    {title}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs pt-1" style={{ color: muted }}>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-rose-500" /> {location}
                    </span>
                    {heroData.experienceYears && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={13} style={{ color: primary }} /> {heroData.experienceYears} Experience
                      </span>
                    )}
                    {heroData.joiningAvailability && (
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-amber-500" /> {heroData.joiningAvailability}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap">
                {heroData.whatsapp && (
                  <a
                    href={`https://wa.me/${heroData.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${name}, I saw your portfolio on THENIJOBS and would like to invite you for an interview.`)}`}
                    target="_blank"
                    rel="noopener"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all"
                    style={{ background: '#25D366', borderRadius: radius }}
                  >
                    <MessageCircle size={15} /> Message on WhatsApp
                  </a>
                )}
                {heroData.phone && (
                  <a
                    href={`tel:${heroData.phone}`}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all hover:bg-black/5"
                    style={{ borderColor: primary, color: primary, borderRadius: radius }}
                  >
                    <Phone size={14} /> Call Now
                  </a>
                )}
                {heroData.resumeUrl && (
                  <a
                    href={heroData.resumeUrl}
                    target="_blank"
                    rel="noopener"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-md hover:scale-[1.02] transition-all"
                    style={{ background: primary, borderRadius: radius }}
                  >
                    <Download size={14} /> Download CV
                  </a>
                )}
              </div>
            </div>

            {heroData.tagline && (
              <div
                className="p-4 rounded-2xl border my-4 text-xs sm:text-sm font-medium leading-relaxed"
                style={{ background: surface, borderColor: `${muted}20`, color: text }}
              >
                💡 <span className="font-semibold text-slate-700">{heroData.tagline}</span>
              </div>
            )}
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT SECTIONS ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">

        {/* ── ABOUT ME ── */}
        {aboutSection && aboutData.content && (
          <section id="about" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <Sparkles size={20} style={{ color: primary }} />
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {aboutSection.title || 'About Me'}
              </h2>
            </div>
            <div
              className="p-6 rounded-3xl border shadow-xs space-y-4"
              style={{ background: surface, borderColor: `${muted}15`, borderRadius: radius }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: text }}>
                {aboutData.content}
              </p>
              {aboutData.highlights && Array.isArray(aboutData.highlights) && aboutData.highlights.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t" style={{ borderColor: `${muted}15` }}>
                  {aboutData.highlights.map((h: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-slate-100 text-center shadow-2xs">
                      <span className="block text-lg font-black" style={{ color: primary }}>{h.value}</span>
                      <span className="text-[11px] font-medium" style={{ color: muted }}>{h.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── SKILLS & EXPERTISE ── */}
        {skillsSection && skillsList.length > 0 && (
          <section id="skills" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <Code2 size={20} style={{ color: primary }} />
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {skillsSection.title || 'Skills & Core Competencies'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillsList.map((skill) => (
                <div
                  key={skill.id}
                  className="p-4 rounded-2xl border shadow-xs transition-all hover:shadow-md"
                  style={{ background: surface, borderColor: `${muted}15`, borderRadius: radius }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold" style={{ color: text }}>{skill.name}</span>
                      {skill.verified && (
                        <span title="Verified Skill" className="inline-flex items-center">
                          <ShieldCheck size={13} className="text-blue-600" />
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full" style={{ background: `${primary}15`, color: primary }}>
                      {skill.levelLabel || (skill.level >= 80 ? 'Expert' : skill.level >= 60 ? 'Advanced' : 'Intermediate')}
                    </span>
                  </div>
                  {skill.level !== undefined && (
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${skill.level}%`,
                          background: `linear-gradient(90deg, ${primary}, ${secondary})`
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── WORK EXPERIENCE TIMELINE ── */}
        {experienceSection && experienceList.length > 0 && (
          <section id="experience" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <Briefcase size={20} style={{ color: primary }} />
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {experienceSection.title || 'Career & Work Experience'}
              </h2>
            </div>
            <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {experienceList.map((exp) => (
                <div
                  key={exp.id}
                  className="relative pl-10 group"
                >
                  <div
                    className="absolute left-2.5 top-3 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs"
                    style={{ background: primary }}
                  />
                  <div
                    className="p-5 rounded-2xl border shadow-xs hover:shadow-md transition-all space-y-2"
                    style={{ background: surface, borderColor: `${muted}15`, borderRadius: radius }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="text-sm sm:text-base font-bold" style={{ color: text }}>
                        {exp.role} <span className="font-medium" style={{ color: primary }}>@ {exp.company}</span>
                      </h3>
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white border border-slate-100 self-start sm:self-auto" style={{ color: muted }}>
                        {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate || 'N/A'}
                      </span>
                    </div>
                    {exp.location && (
                      <p className="text-[11px] flex items-center gap-1" style={{ color: muted }}>
                        <MapPin size={11} /> {exp.location} {exp.employmentType && `• ${exp.employmentType}`}
                      </p>
                    )}
                    {exp.description && (
                      <p className="text-xs leading-relaxed" style={{ color: text }}>
                        {exp.description}
                      </p>
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="space-y-1 pt-1">
                        {exp.achievements.map((ach, idx) => (
                          <li key={idx} className="text-[11px] flex items-start gap-1.5" style={{ color: text }}>
                            <CheckCircle2 size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── PROJECTS & PORTFOLIO GRID ── */}
        {projectsSection && projectsList.length > 0 && (
          <section id="projects" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <div className="flex items-center gap-2">
                <FolderGit2 size={20} style={{ color: primary }} />
                <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                  {projectsSection.title || 'Featured Projects & Portfolio'}
                </h2>
              </div>
              {projectCategories.length > 2 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {projectCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveProjectCategory(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        activeProjectCategory === cat
                          ? 'text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      style={{
                        background: activeProjectCategory === cat ? primary : undefined
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="border rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
                  style={{ background: surface, borderColor: `${muted}15`, borderRadius: radius }}
                >
                  <div>
                    {/* Project Screenshot / Thumbnail */}
                    <div className="h-44 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center">
                      {proj.imageUrl ? (
                        <>
                          <div
                            className="absolute inset-0 bg-cover bg-center blur-xs opacity-30 scale-105"
                            style={{ backgroundImage: `url(${proj.imageUrl})` }}
                          />
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="relative z-10 w-full h-full object-contain object-center p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                        </>
                      ) : (
                        <div className="text-center text-slate-400 p-4">
                          <FolderGit2 size={36} className="mx-auto opacity-50 mb-1" />
                          <span className="text-[10px] font-semibold">Project Showcase</span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 z-20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950/80 text-white backdrop-blur-md">
                        {proj.category || 'Project'}
                      </span>
                    </div>

                    {/* Project Info */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-sm sm:text-base font-bold leading-snug" style={{ color: text }}>
                        {proj.title}
                      </h3>
                      {proj.description && (
                        <p className="text-xs leading-relaxed line-clamp-3" style={{ color: muted }}>
                          {proj.description}
                        </p>
                      )}

                      {/* Tech Stack Chips */}
                      {proj.techStack && proj.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {proj.techStack.map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-slate-200/80"
                              style={{ color: primary }}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Project Links Footer */}
                  <div className="p-4 pt-0 flex items-center gap-2 border-t border-slate-100 mt-2">
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noopener"
                        className="flex-1 py-2 rounded-xl text-center text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-xs hover:opacity-95 transition-all"
                        style={{ background: primary, borderRadius: radius }}
                      >
                        <ExternalLink size={13} /> Live Preview
                      </a>
                    )}
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noopener"
                        className="px-3 py-2 rounded-xl border text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 transition-all"
                        style={{ borderColor: `${muted}30`, color: text, borderRadius: radius }}
                        title="View Source Code"
                      >
                        <FolderGit2 size={14} /> Code
                      </a>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── EDUCATION ── */}
        {educationSection && educationList.length > 0 && (
          <section id="education" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <GraduationCap size={20} style={{ color: primary }} />
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {educationSection.title || 'Education & Qualifications'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {educationList.map((edu) => (
                <div
                  key={edu.id}
                  className="p-5 rounded-2xl border shadow-xs space-y-1.5"
                  style={{ background: surface, borderColor: `${muted}15`, borderRadius: radius }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold" style={{ color: text }}>
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-100 shrink-0" style={{ color: muted }}>
                      {edu.year}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: primary }}>
                    {edu.institution}
                  </p>
                  {edu.score && (
                    <p className="text-[11px]" style={{ color: muted }}>
                      Grade / Score: <span className="font-bold text-slate-800">{edu.score}</span>
                    </p>
                  )}
                  {edu.description && (
                    <p className="text-xs text-slate-600 pt-1 leading-relaxed">
                      {edu.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CERTIFICATIONS & LICENSES ── */}
        {certsSection && certsList.length > 0 && (
          <section id="certifications" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <Award size={20} style={{ color: primary }} />
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {certsSection.title || 'Certifications & Honors'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certsList.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-2xl border shadow-xs space-y-2 flex flex-col justify-between"
                  style={{ background: surface, borderColor: `${muted}15`, borderRadius: radius }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Award size={16} style={{ color: primary }} />
                      <span className="text-[10px] font-semibold" style={{ color: muted }}>{cert.issueDate}</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold" style={{ color: text }}>{cert.name}</h3>
                    <p className="text-xs font-medium" style={{ color: primary }}>{cert.issuer}</p>
                    {cert.credentialId && (
                      <p className="text-[10px] font-mono mt-1" style={{ color: muted }}>ID: {cert.credentialId}</p>
                    )}
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener"
                      className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1 pt-2 border-t border-slate-100"
                    >
                      Verify Credential <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── VIDEO INTRO / PITCH ── */}
        {videoSection && videoSection.data?.videoUrl && (
          <section id="video-pitch" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <Play size={20} style={{ color: primary }} />
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {videoSection.title || 'Video Elevator Pitch'}
              </h2>
            </div>
            <div className="aspect-video w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-md border border-slate-200">
              <iframe
                src={videoSection.data.videoUrl}
                title="Video Pitch"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* ── TESTIMONIALS & RECOMMENDATIONS ── */}
        {testimonialsSection && testimonialsList.length > 0 && (
          <section id="testimonials" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <Star size={20} className="fill-amber-400 text-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {testimonialsSection.title || 'Recommendations & References'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testimonialsList.map((test) => (
                <div
                  key={test.id}
                  className="p-5 rounded-2xl border shadow-xs space-y-3"
                  style={{ background: surface, borderColor: `${muted}15`, borderRadius: radius }}
                >
                  <p className="text-xs sm:text-sm italic leading-relaxed" style={{ color: text }}>
                    "{test.content}"
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: `${muted}15` }}>
                    {test.photo ? (
                      <img src={test.photo} alt={test.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs" style={{ background: primary }}>
                        {test.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xs font-bold" style={{ color: text }}>{test.name}</h3>
                      <p className="text-[11px]" style={{ color: muted }}>{test.role} {test.company && `@ ${test.company}`}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CONTACT & CALL TO ACTION ── */}
        {contactSection && (
          <section id="contact" className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: `${muted}20` }}>
              <Mail size={20} style={{ color: primary }} />
              <h2 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {contactSection.title || 'Get In Touch'}
              </h2>
            </div>
            <div
              className="p-6 sm:p-8 rounded-3xl border shadow-xs space-y-6"
              style={{ background: surface, borderColor: `${muted}15`, borderRadius: radius }}
            >
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h3 className="text-lg font-extrabold" style={{ color: text }}>
                  Interested in hiring or discussing opportunities?
                </h3>
                <p className="text-xs sm:text-sm" style={{ color: muted }}>
                  Feel free to contact me directly via WhatsApp, phone, or email. I am available for interviews.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {heroData.whatsapp && (
                  <a
                    href={`https://wa.me/${heroData.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${name}, I am interested in discussing a job opportunity with you.`)}`}
                    target="_blank"
                    rel="noopener"
                    className="p-3.5 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] transition-all text-center"
                    style={{ background: '#25D366' }}
                  >
                    <MessageCircle size={16} /> WhatsApp Message
                  </a>
                )}
                {heroData.phone && (
                  <a
                    href={`tel:${heroData.phone}`}
                    className="p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 hover:bg-black/5 transition-all text-center"
                    style={{ borderColor: primary, color: primary }}
                  >
                    <Phone size={15} /> {heroData.phone}
                  </a>
                )}
                {heroData.email && (
                  <a
                    href={`mailto:${heroData.email}`}
                    className="p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 hover:bg-black/5 transition-all text-center truncate"
                    style={{ borderColor: `${muted}30`, color: text }}
                  >
                    <Mail size={15} /> Send Email
                  </a>
                )}
              </div>

              {/* Social Links */}
              {contactData.socialLinks && contactData.socialLinks.length > 0 && (
                <div className="flex items-center justify-center gap-3 pt-4 border-t" style={{ borderColor: `${muted}15` }}>
                  {contactData.socialLinks.map((soc, idx) => (
                    <a
                      key={idx}
                      href={soc.url}
                      target="_blank"
                      rel="noopener"
                      className="p-2.5 rounded-xl border hover:bg-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                      style={{ borderColor: `${muted}30`, color: text }}
                    >
                      <Globe size={13} /> {soc.platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t py-8 mt-16 text-center text-xs" style={{ borderColor: `${muted}20`, color: muted }}>
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} {name} • Built & Verified on <a href="https://thenijobs.com" className="font-bold text-blue-600 hover:underline">THENIJOBS</a></p>
          <p className="text-[10px] text-slate-400">Official Digital Portfolio & Interactive Resume</p>
        </div>
      </footer>
    </div>
  );
}
