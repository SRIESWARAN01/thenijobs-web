'use client';

import { useState } from 'react';
import {
  MapPin, Mail, Phone, ExternalLink, Download, Check,
  Share2, Calendar, ArrowUpRight,
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
 * seeker-minimal — single-column, resume-style layout. No cover-photo hero, no card
 * chrome around sections: content and typography carry the page. A vertical timeline
 * rule ties experience and education together instead of separate boxed cards. Built
 * for a dense, content-forward read rather than a marketing-style landing page —
 * the shape a technical/academic portfolio wants, distinct from seeker-modern-pro's
 * banner-led layout, reusing the identical section data contract.
 */
export default function SeekerPortfolioMinimal({ site }: Props) {
  const { theme, branding, sections } = site;
  const [copied, setCopied] = useState(false);

  const font = theme?.fontFamily || 'Inter';
  const headingFont = theme?.headingFont || 'Poppins';
  const primary = theme?.primaryColor || '#111827';
  const muted = theme?.textMutedColor || '#6B7280';
  const text = theme?.textColor || '#111827';
  const bg = theme?.backgroundColor || '#FFFFFF';

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

  const skillsByCategory = skillsList.reduce<Record<string, SeekerSkillItem[]>>((acc, s) => {
    const cat = s.category || 'technical';
    (acc[cat] ||= []).push(s);
    return acc;
  }, {});

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <section id={id} className="py-8 border-t" style={{ borderColor: `${muted}20` }}>
      <h2
        className="text-xs font-bold uppercase tracking-[0.15em] mb-5"
        style={{ fontFamily: `'${headingFont}', sans-serif`, color: primary }}
      >
        {title}
      </h2>
      {children}
    </section>
  );

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: text }} className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 sm:px-8">

        {/* ── Header ── */}
        <header className="pt-14 pb-8 flex items-start gap-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-full object-cover shrink-0" />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg text-white shrink-0"
              style={{ background: primary }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: `'${headingFont}', sans-serif` }}>
              {name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: muted }}>{title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs" style={{ color: muted }}>
              <span className="flex items-center gap-1"><MapPin size={11} />{location}</span>
              {isOpenToWork && (
                <span className="flex items-center gap-1 font-semibold" style={{ color: '#059669' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#059669' }} /> Open to work
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleShare}
            className="shrink-0 p-2 rounded-lg border text-xs"
            style={{ borderColor: `${muted}30`, color: muted }}
            title="Copy portfolio link"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
          </button>
        </header>

        {/* ── Quick contact row ── */}
        <div className="flex flex-wrap gap-2 pb-6">
          {heroData.email && (
            <a href={`mailto:${heroData.email}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: `${muted}30`, color: text }}>
              <Mail size={12} /> {heroData.email}
            </a>
          )}
          {heroData.phone && (
            <a href={`tel:${heroData.phone}`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: `${muted}30`, color: text }}>
              <Phone size={12} /> {heroData.phone}
            </a>
          )}
          {heroData.resumeUrl && (
            <a
              href={safeExternalUrl(heroData.resumeUrl)}
              target="_blank" rel="noopener"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-semibold text-white"
              style={{ background: primary }}
            >
              <Download size={12} /> Resume
            </a>
          )}
        </div>

        {/* ── About ── */}
        {aboutSection && aboutData.content && (
          <Section id="about" title="About">
            <p className="text-sm leading-relaxed" style={{ color: text }}>{aboutData.content}</p>
          </Section>
        )}

        {/* ── Experience (vertical timeline) ── */}
        {experienceSection && experienceList.length > 0 && (
          <Section id="experience" title="Experience">
            <div className="space-y-6">
              {experienceList.map((exp, i) => (
                <div key={exp.id} className="relative pl-5" style={{ borderLeft: i === experienceList.length - 1 ? 'none' : `1px solid ${muted}25` }}>
                  <span className="absolute -left-[3.5px] top-1.5 w-[7px] h-[7px] rounded-full" style={{ background: primary }} />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <h3 className="text-sm font-bold">{exp.role}</h3>
                    <span className="text-[11px]" style={{ color: muted }}>
                      {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <p className="text-xs font-medium mt-0.5" style={{ color: primary }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                  {exp.description && <p className="text-xs mt-1.5 leading-relaxed" style={{ color: muted }}>{exp.description}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Education ── */}
        {educationSection && educationList.length > 0 && (
          <Section id="education" title="Education">
            <div className="space-y-4">
              {educationList.map(edu => (
                <div key={edu.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <div>
                    <h3 className="text-sm font-bold">{edu.degree}{edu.field ? `, ${edu.field}` : ''}</h3>
                    <p className="text-xs" style={{ color: muted }}>{edu.institution}</p>
                  </div>
                  <span className="text-[11px] shrink-0" style={{ color: muted }}>{edu.year}{edu.score ? ` · ${edu.score}` : ''}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Skills (pills, grouped) ── */}
        {skillsSection && skillsList.length > 0 && (
          <Section id="skills" title="Skills">
            <div className="space-y-3">
              {Object.entries(skillsByCategory).map(([cat, items]) => (
                <div key={cat} className="flex flex-wrap gap-1.5">
                  {items.map(s => (
                    <span
                      key={s.id}
                      className="text-xs px-2.5 py-1 rounded-md border"
                      style={{ borderColor: `${muted}25`, color: text }}
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Projects ── */}
        {projectsSection && projectsList.length > 0 && (
          <Section id="projects" title="Projects">
            <div className="space-y-5">
              {projectsList.map(p => (
                <div key={p.id}>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold">{p.title}</h3>
                    {p.liveUrl && (
                      <a href={safeExternalUrl(p.liveUrl)} target="_blank" rel="noopener noreferrer" style={{ color: primary }}>
                        <ArrowUpRight size={13} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: muted }}>{p.description}</p>
                  {p.techStack?.length > 0 && (
                    <p className="text-[11px] mt-1.5" style={{ color: primary }}>{p.techStack.join(' · ')}</p>
                  )}
                  <div className="flex gap-3 mt-1.5">
                    {p.liveUrl && <a href={safeExternalUrl(p.liveUrl)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold underline" style={{ color: text }}>Live</a>}
                    {p.githubUrl && <a href={safeExternalUrl(p.githubUrl)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold underline" style={{ color: text }}>Code</a>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Certifications ── */}
        {certsSection && certsList.length > 0 && (
          <Section id="certifications" title="Certifications">
            <div className="space-y-2.5">
              {certsList.map(c => (
                <div key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <a
                    href={safeExternalUrl(c.credentialUrl)}
                    target={c.credentialUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="text-sm font-semibold flex items-center gap-1"
                    style={{ color: c.credentialUrl ? primary : text }}
                  >
                    {c.name}
                    {c.credentialUrl && <ExternalLink size={11} />}
                  </a>
                  <span className="text-[11px]" style={{ color: muted }}>{c.issuer} · {c.issueDate}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Contact footer ── */}
        <footer className="py-10 border-t mt-2" style={{ borderColor: `${muted}20` }}>
          <div className="flex flex-wrap gap-4">
            {(contactData.socialLinks || []).map((soc, i) => (
              <a key={i} href={safeExternalUrl(soc.url)} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold underline" style={{ color: primary }}>
                {soc.platform}
              </a>
            ))}
          </div>
          <p className="text-[11px] mt-6" style={{ color: muted }}>
            <Calendar size={10} className="inline mb-0.5 mr-1" />
            Built on <a href="https://thenijobs.com" className="font-semibold underline">THENIJOBS</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
