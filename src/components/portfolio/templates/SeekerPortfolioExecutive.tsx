'use client';

import { useState } from 'react';
import {
  MapPin, Mail, Phone, ExternalLink, Download, Check, Share2,
  Briefcase, GraduationCap, Award, Calendar, ArrowUpRight,
} from 'lucide-react';
import type {
  PortfolioSite, SeekerHeroData, SeekerSkillItem,
  SeekerExperienceItem, SeekerEducationItem, SeekerProjectItem,
  SeekerCertificationItem, ContactSectionData
} from '@/lib/types/portfolio';
import { safeExternalUrl } from '@/lib/safeUrl';

interface Props {
  site: PortfolioSite;
  isPreview?: boolean;
}

/**
 * seeker-executive — dark corporate header, two-column body with a sticky "at a glance"
 * sidebar (contact, availability, quick stats) beside the main content column. Card-based
 * sections rather than the plain vertical flow of seeker-modern-pro/seeker-minimal, aimed
 * at Management/MBA-style profiles where leadership and experience carry more weight than
 * a skills-bar list. Reuses the identical section data contract — no new fields.
 */
export default function SeekerPortfolioExecutive({ site }: Props) {
  const { theme, branding, sections } = site;
  const [copied, setCopied] = useState(false);

  const font = theme?.fontFamily || 'Inter';
  const headingFont = theme?.headingFont || 'Poppins';
  const primary = theme?.primaryColor || '#1E3A8A';
  const secondary = theme?.secondaryColor || '#B45309';
  const muted = theme?.textMutedColor || '#64748B';
  const text = theme?.textColor || '#0F172A';
  const surface = theme?.surfaceColor || '#F8FAFC';

  const getSection = (type: string) => sections.find(s => s.type === type && s.visible);

  const heroSection = getSection('hero');
  const aboutSection = getSection('about');
  const skillsSection = getSection('skills');
  const experienceSection = getSection('experience');
  const educationSection = getSection('education');
  const projectsSection = getSection('projects');
  const certsSection = getSection('certifications');
  const contactSection = getSection('contact');

  const heroData: Partial<SeekerHeroData> = heroSection?.data || {};
  const aboutData = aboutSection?.data || {};
  const skillsList: SeekerSkillItem[] = skillsSection?.data?.skills || [];
  const experienceList: SeekerExperienceItem[] = experienceSection?.data?.experience || [];
  const educationList: SeekerEducationItem[] = educationSection?.data?.education || [];
  const projectsList: SeekerProjectItem[] = projectsSection?.data?.projects || [];
  const certsList: SeekerCertificationItem[] = certsSection?.data?.certifications || [];
  const contactData: Partial<ContactSectionData> = contactSection?.data || {};

  const name = heroData.name || branding?.companyName || 'Professional Seeker';
  const title = heroData.title || branding?.tagline || 'Career Professional';
  const location = heroData.location || 'Theni, Tamil Nadu';
  const avatarUrl = heroData.avatarUrl || branding?.logo;
  const isOpenToWork = heroData.isOpenToWork !== false;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl border p-6 ${className}`} style={{ borderColor: `${muted}20`, background: '#FFFFFF' }}>
      {children}
    </div>
  );

  const CardTitle = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
    <h2
      className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-4"
      style={{ fontFamily: `'${headingFont}', sans-serif`, color: primary }}
    >
      <Icon size={16} /> {children}
    </h2>
  );

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: surface, color: text }} className="min-h-screen">

      {/* ── Header ── */}
      <header className="text-white" style={{ background: `linear-gradient(135deg, ${primary}, #0B1220)` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-wrap items-center gap-6">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white/10 shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center font-black text-3xl shrink-0 bg-white/10 border-4 border-white/10">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight" style={{ fontFamily: `'${headingFont}', sans-serif` }}>
              {name}
            </h1>
            <p className="text-sm sm:text-base mt-1 text-white/70">{title}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-white/60">
              <span className="flex items-center gap-1"><MapPin size={12} />{location}</span>
              {isOpenToWork && (
                <span className="flex items-center gap-1.5 font-semibold px-2.5 py-0.5 rounded-full" style={{ background: `${secondary}30`, color: '#FCD34D' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FCD34D' }} /> Open to work
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {heroData.resumeUrl && (
              <a
                href={safeExternalUrl(heroData.resumeUrl)}
                target="_blank" rel="noopener"
                className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl text-white"
                style={{ background: secondary }}
              >
                <Download size={13} /> Resume
              </a>
            )}
            <button onClick={handleShare} className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-all" title="Copy portfolio link">
              {copied ? <Check size={14} /> : <Share2 size={14} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-6">
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: muted }}>At a glance</h3>
            <div className="space-y-2.5 text-sm">
              {heroData.email && (
                <a href={`mailto:${heroData.email}`} className="flex items-center gap-2 hover:underline" style={{ color: text }}>
                  <Mail size={14} style={{ color: primary }} /> <span className="truncate">{heroData.email}</span>
                </a>
              )}
              {heroData.phone && (
                <a href={`tel:${heroData.phone}`} className="flex items-center gap-2 hover:underline" style={{ color: text }}>
                  <Phone size={14} style={{ color: primary }} /> {heroData.phone}
                </a>
              )}
              {heroData.joiningAvailability && (
                <p className="flex items-center gap-2" style={{ color: muted }}>
                  <Calendar size={14} style={{ color: primary }} /> {heroData.joiningAvailability}
                </p>
              )}
              {heroData.experienceYears && (
                <p className="flex items-center gap-2" style={{ color: muted }}>
                  <Briefcase size={14} style={{ color: primary }} /> {heroData.experienceYears}
                </p>
              )}
            </div>
          </Card>

          {skillsSection && skillsList.length > 0 && (
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: muted }}>Core strengths</h3>
              <div className="flex flex-wrap gap-1.5">
                {skillsList.map(s => (
                  <span key={s.id} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: `${primary}10`, color: primary }}>
                    {s.name}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {contactData.socialLinks && contactData.socialLinks.length > 0 && (
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: muted }}>Connect</h3>
              <div className="flex flex-col gap-2">
                {contactData.socialLinks.map((soc, i) => (
                  <a key={i} href={safeExternalUrl(soc.url)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold flex items-center gap-1.5" style={{ color: primary }}>
                    {soc.platform} <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {aboutSection && aboutData.content && (
            <Card>
              <CardTitle icon={Briefcase}>Profile</CardTitle>
              <p className="text-sm leading-relaxed" style={{ color: text }}>{aboutData.content}</p>
            </Card>
          )}

          {experienceSection && experienceList.length > 0 && (
            <Card>
              <CardTitle icon={Briefcase}>Experience</CardTitle>
              <div className="space-y-5">
                {experienceList.map(exp => (
                  <div key={exp.id} className="pb-5 border-b last:border-0 last:pb-0" style={{ borderColor: `${muted}15` }}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <h3 className="text-sm font-bold">{exp.role} · <span style={{ color: primary }}>{exp.company}</span></h3>
                      <span className="text-[11px] shrink-0" style={{ color: muted }}>
                        {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                      </span>
                    </div>
                    {exp.location && <p className="text-[11px] mt-0.5" style={{ color: muted }}>{exp.location}</p>}
                    {exp.description && <p className="text-xs mt-2 leading-relaxed" style={{ color: text }}>{exp.description}</p>}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.achievements.map((ach, idx) => (
                          <li key={idx} className="text-xs flex items-start gap-1.5" style={{ color: muted }}>
                            <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: secondary }} /> {ach}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {educationSection && educationList.length > 0 && (
            <Card>
              <CardTitle icon={GraduationCap}>Education</CardTitle>
              <div className="space-y-3">
                {educationList.map(edu => (
                  <div key={edu.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <div>
                      <h3 className="text-sm font-bold">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</h3>
                      <p className="text-xs" style={{ color: muted }}>{edu.institution}</p>
                    </div>
                    <span className="text-[11px] shrink-0" style={{ color: muted }}>{edu.year}{edu.score ? ` · ${edu.score}` : ''}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {projectsSection && projectsList.length > 0 && (
            <Card>
              <CardTitle icon={Briefcase}>Selected work</CardTitle>
              <div className="grid sm:grid-cols-2 gap-4">
                {projectsList.map(p => (
                  <div key={p.id} className="rounded-xl p-4" style={{ background: surface }}>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold">{p.title}</h3>
                      {p.liveUrl && (
                        <a href={safeExternalUrl(p.liveUrl)} target="_blank" rel="noopener noreferrer" style={{ color: primary }}>
                          <ArrowUpRight size={12} />
                        </a>
                      )}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: muted }}>{p.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {certsSection && certsList.length > 0 && (
            <Card>
              <CardTitle icon={Award}>Certifications</CardTitle>
              <div className="grid sm:grid-cols-2 gap-3">
                {certsList.map(c => (
                  <a
                    key={c.id}
                    href={safeExternalUrl(c.credentialUrl)}
                    target={c.credentialUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl p-3 border"
                    style={{ borderColor: `${muted}20` }}
                  >
                    <Award size={16} style={{ color: secondary }} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{c.name}</p>
                      <p className="text-[11px]" style={{ color: muted }}>{c.issuer} · {c.issueDate}</p>
                    </div>
                    {c.credentialUrl && <ExternalLink size={12} className="ml-auto shrink-0" style={{ color: muted }} />}
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <footer className="text-center py-6 text-[11px]" style={{ color: muted }}>
        Built on <a href="https://thenijobs.com" className="font-semibold underline">THENIJOBS</a>
      </footer>
    </div>
  );
}
