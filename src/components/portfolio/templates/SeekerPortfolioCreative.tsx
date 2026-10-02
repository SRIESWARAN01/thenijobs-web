'use client';

import { useState } from 'react';
import {
  MapPin, Mail, Phone, ExternalLink, Download, Check,
  Share2, Calendar, ArrowUpRight, Palette, Code2, Sparkles,
  Briefcase, GraduationCap, Award, Globe, Star, Heart,
} from 'lucide-react';
import type {
  PortfolioSite, SeekerHeroData, SeekerSkillItem,
  SeekerExperienceItem, SeekerEducationItem, SeekerProjectItem,
  SeekerCertificationItem, ContactSectionData,
  SeekerAchievementItem, CustomSectionEntry
} from '@/lib/types/portfolio';
import { safeExternalUrl } from '@/lib/safeUrl';

interface Props {
  site: PortfolioSite;
  isPreview?: boolean;
}

/**
 * seeker-creative — a vibrant, bento-grid-inspired portfolio layout aimed at designers,
 * developers, and creatives. Features a split hero with gradient accent, card-based bento
 * sections for skills (with animated progress rings), masonry-style project cards with
 * hover reveals, and colorful category tags. Distinct from seeker-minimal (single-column
 * text-forward) and seeker-executive (dark corporate two-column sidebar).
 */
export default function SeekerPortfolioCreative({ site }: Props) {
  const { theme, branding, sections } = site;
  const [copied, setCopied] = useState(false);

  const font = theme?.fontFamily || 'DM Sans';
  const headingFont = theme?.headingFont || 'Outfit';
  const primary = theme?.primaryColor || '#8B5CF6';
  const secondary = theme?.secondaryColor || '#EC4899';
  const muted = theme?.textMutedColor || '#64748B';
  const text = theme?.textColor || '#0F172A';
  const bg = theme?.backgroundColor || '#FAFAFA';
  const surface = theme?.surfaceColor || '#FFFFFF';
  const r = '20px';
  const grad = `linear-gradient(135deg, ${primary}, ${secondary})`;

  const getSection = (type: string) => sections.find(s => s.type === type && s.visible);

  const heroSection = getSection('hero');
  const aboutSection = getSection('about');
  const skillsSection = getSection('skills');
  const experienceSection = getSection('experience');
  const educationSection = getSection('education');
  const projectsSection = getSection('projects');
  const certsSection = getSection('certifications');
  const achievementsSection = getSection('achievements');
  const contactSection = getSection('contact');
  const customSections = sections.filter(s => s.type === 'custom' && s.visible);

  const heroData: Partial<SeekerHeroData> = heroSection?.data || {};
  const aboutData = aboutSection?.data || {};
  const skillsList: SeekerSkillItem[] = skillsSection?.data?.skills || [];
  const experienceList: SeekerExperienceItem[] = experienceSection?.data?.experience || [];
  const educationList: SeekerEducationItem[] = educationSection?.data?.education || [];
  const projectsList: SeekerProjectItem[] = projectsSection?.data?.projects || [];
  const certsList: SeekerCertificationItem[] = certsSection?.data?.certifications || [];
  const achievementsList: SeekerAchievementItem[] = achievementsSection?.data?.achievements || [];
  const contactData: Partial<ContactSectionData> = contactSection?.data || {};

  const name = heroData.name || branding?.companyName || 'Creative Professional';
  const title = heroData.title || branding?.tagline || 'Designer & Developer';
  const location = heroData.location || 'Theni, Tamil Nadu';
  const avatarUrl = heroData.avatarUrl || branding?.logo;
  const isOpenToWork = heroData.isOpenToWork !== false;

  const skillsByCategory = skillsList.reduce<Record<string, SeekerSkillItem[]>>((acc, s) => {
    const cat = s.category || 'technical';
    (acc[cat] ||= []).push(s);
    return acc;
  }, {});

  const categoryIcons: Record<string, string> = {
    technical: '💻', soft: '🤝', tools: '🛠️', languages: '🌐',
  };
  const categoryColors: Record<string, string> = {
    technical: primary, soft: secondary, tools: '#F59E0B', languages: '#10B981',
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Build ordered content blocks
  const orderedSections = [
    aboutSection, skillsSection, experienceSection, educationSection,
    projectsSection, certsSection, achievementsSection, ...customSections
  ].filter(Boolean).sort((a, b) => (a!.order ?? 99) - (b!.order ?? 99));

  const renderSection = (section: any) => {
    switch (section.type) {
      case 'about': return aboutData.content ? aboutBlock : null;
      case 'skills': return skillsList.length > 0 ? skillsBlock : null;
      case 'experience': return experienceList.length > 0 ? experienceBlock : null;
      case 'education': return educationList.length > 0 ? educationBlock : null;
      case 'projects': return projectsList.length > 0 ? projectsBlock : null;
      case 'certifications': return certsList.length > 0 ? certificationsBlock : null;
      case 'achievements': return achievementsList.length > 0 ? achievementsBlock : null;
      case 'custom': return customBlock(section);
      default: return null;
    }
  };

  // ═══ SECTION BLOCKS ═══

  const aboutBlock = (
    <section id="about" className="py-10">
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: `'${headingFont}'`, color: text }}>
        <Sparkles size={16} className="inline mr-2" style={{ color: primary }} />About Me
      </h2>
      <div className="p-6 border" style={{ borderRadius: r, background: surface, borderColor: `${muted}15` }}>
        <p className="text-sm leading-[1.9]" style={{ color: muted }}>{aboutData.content}</p>
      </div>
    </section>
  );

  const skillsBlock = (
    <section id="skills" className="py-10">
      <h2 className="text-lg font-bold mb-6" style={{ fontFamily: `'${headingFont}'`, color: text }}>
        <Code2 size={16} className="inline mr-2" style={{ color: primary }} />Skills & Expertise
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(skillsByCategory).map(([cat, items]) => (
          <div key={cat} className="p-5 border" style={{ borderRadius: r, background: surface, borderColor: `${muted}15` }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{categoryIcons[cat] || '📌'}</span>
              <h3 className="text-xs font-bold uppercase tracking-[2px]" style={{ color: categoryColors[cat] || primary }}>
                {cat === 'technical' ? 'Technical' : cat === 'soft' ? 'Soft Skills' : cat === 'tools' ? 'Tools' : 'Languages'}
              </h3>
            </div>
            <div className="space-y-2.5">
              {items.map(s => (
                <div key={s.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: text }}>{s.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: categoryColors[cat] || primary }}>{s.level}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: `${muted}15` }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.level}%`, background: `linear-gradient(90deg, ${categoryColors[cat] || primary}, ${secondary})` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const experienceBlock = (
    <section id="experience" className="py-10">
      <h2 className="text-lg font-bold mb-6" style={{ fontFamily: `'${headingFont}'`, color: text }}>
        <Briefcase size={16} className="inline mr-2" style={{ color: primary }} />Experience
      </h2>
      <div className="space-y-4">
        {experienceList.map(exp => (
          <div key={exp.id} className="p-5 border hover:shadow-lg transition-all" style={{ borderRadius: r, background: surface, borderColor: `${muted}15` }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold" style={{ color: text }}>{exp.role}</h3>
                <p className="text-xs font-semibold mt-0.5" style={{ color: primary }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
              </div>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: `${primary}10`, color: primary }}>
                {exp.startDate} — {exp.isCurrent ? 'Present' : exp.endDate}
              </span>
            </div>
            {exp.description && <p className="text-xs mt-3 leading-relaxed" style={{ color: muted }}>{exp.description}</p>}
            {exp.achievements && exp.achievements.length > 0 && (
              <ul className="mt-2 space-y-1">{exp.achievements.map((a, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: muted }}>
                  <Star size={10} className="flex-shrink-0 mt-0.5" style={{ color: secondary }} />{a}
                </li>
              ))}</ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  const educationBlock = (
    <section id="education" className="py-10">
      <h2 className="text-lg font-bold mb-6" style={{ fontFamily: `'${headingFont}'`, color: text }}>
        <GraduationCap size={16} className="inline mr-2" style={{ color: primary }} />Education
      </h2>
      <div className="space-y-3">
        {educationList.map(edu => (
          <div key={edu.id} className="p-5 border" style={{ borderRadius: r, background: surface, borderColor: `${muted}15` }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold" style={{ color: text }}>{edu.degree}{edu.field ? `, ${edu.field}` : ''}</h3>
                <p className="text-xs mt-0.5" style={{ color: primary }}>{edu.institution}</p>
              </div>
              <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ background: `${primary}10`, color: primary }}>
                {edu.year}{edu.score ? ` · ${edu.score}` : ''}
              </span>
            </div>
            {edu.description && <p className="text-xs mt-2" style={{ color: muted }}>{edu.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );

  const projectsBlock = (
    <section id="projects" className="py-10">
      <h2 className="text-lg font-bold mb-6" style={{ fontFamily: `'${headingFont}'`, color: text }}>
        <Palette size={16} className="inline mr-2" style={{ color: primary }} />Projects & Work
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projectsList.map(p => (
          <div key={p.id} className="border overflow-hidden group hover:shadow-xl transition-all" style={{ borderRadius: r, background: surface, borderColor: `${muted}15` }}>
            {p.imageUrl && (
              <div className="relative overflow-hidden h-44">
                <img src={p.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="flex gap-2">
                    {p.liveUrl && <a href={safeExternalUrl(p.liveUrl)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-[10px] font-bold text-white rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center gap-1"><Globe size={10} /> Live</a>}
                    {p.githubUrl && <a href={safeExternalUrl(p.githubUrl)} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-[10px] font-bold text-white rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center gap-1"><Code2 size={10} /> Code</a>}
                  </div>
                </div>
              </div>
            )}
            <div className="p-5">
              {p.featured && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: `${secondary}15`, color: secondary }}>⭐ Featured</span>}
              <h3 className="text-sm font-bold mt-1" style={{ color: text }}>{p.title}</h3>
              <p className="text-xs mt-1 line-clamp-2" style={{ color: muted }}>{p.description}</p>
              {p.techStack?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.techStack.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${primary}10`, color: primary }}>{t}</span>)}
                </div>
              )}
              {!p.imageUrl && (
                <div className="flex gap-2 mt-3">
                  {p.liveUrl && <a href={safeExternalUrl(p.liveUrl)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold flex items-center gap-1" style={{ color: primary }}><Globe size={11} /> Live</a>}
                  {p.githubUrl && <a href={safeExternalUrl(p.githubUrl)} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold flex items-center gap-1" style={{ color: primary }}><Code2 size={11} /> Code</a>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const certificationsBlock = (
    <section id="certifications" className="py-10">
      <h2 className="text-lg font-bold mb-6" style={{ fontFamily: `'${headingFont}'`, color: text }}>
        <Award size={16} className="inline mr-2" style={{ color: primary }} />Certifications
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {certsList.map(c => (
          <a key={c.id} href={safeExternalUrl(c.credentialUrl) || undefined} target={c.credentialUrl ? '_blank' : undefined} rel="noopener noreferrer"
            className="p-4 border flex items-center gap-3 hover:shadow-md transition-all" style={{ borderRadius: r, background: surface, borderColor: `${muted}15` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: grad }}>
              <Award size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-bold" style={{ color: text }}>{c.name}</h3>
              <p className="text-[10px]" style={{ color: muted }}>{c.issuer} · {c.issueDate}</p>
            </div>
            {c.credentialUrl && <ArrowUpRight size={13} className="ml-auto flex-shrink-0" style={{ color: primary }} />}
          </a>
        ))}
      </div>
    </section>
  );

  const achievementsBlock = (
    <section id="achievements" className="py-10">
      <h2 className="text-lg font-bold mb-6" style={{ fontFamily: `'${headingFont}'`, color: text }}>
        <Star size={16} className="inline mr-2" style={{ color: primary }} />Achievements
      </h2>
      <div className="space-y-3">
        {achievementsList.map(a => (
          <div key={a.id} className="p-4 border flex items-start gap-3" style={{ borderRadius: r, background: surface, borderColor: `${muted}15` }}>
            <span className="text-base">🏆</span>
            <div>
              <h3 className="text-xs font-bold" style={{ color: text }}>{a.title}</h3>
              {a.organization && <p className="text-[10px]" style={{ color: primary }}>{a.organization}{a.date ? ` · ${a.date}` : ''}</p>}
              {a.description && <p className="text-[10px] mt-1" style={{ color: muted }}>{a.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const customBlock = (section: any) => {
    const entries: CustomSectionEntry[] = section.data?.entries || [];
    if (entries.length === 0) return null;
    return (
      <section key={section.id} id={`custom-${section.id}`} className="py-10">
        <h2 className="text-lg font-bold mb-6" style={{ fontFamily: `'${headingFont}'`, color: text }}>{section.title}</h2>
        <div className="space-y-3">
          {entries.map(e => (
            <div key={e.id} className="p-4 border" style={{ borderRadius: r, background: surface, borderColor: `${muted}15` }}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-bold" style={{ color: text }}>{e.title}</h3>
                {e.date && <span className="text-[10px] flex-shrink-0" style={{ color: muted }}>{e.date}</span>}
              </div>
              {e.description && <p className="text-[10px] mt-1" style={{ color: muted }}>{e.description}</p>}
              {e.link && <a href={safeExternalUrl(e.link)} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold flex items-center gap-1 mt-1" style={{ color: primary }}><ArrowUpRight size={10} /> View</a>}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: text }} className="min-h-screen">
      {/* ═══ CREATIVE HERO — Split gradient + avatar ═══ */}
      <section className="relative overflow-hidden">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 h-72" style={{ background: grad }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>
        {heroData.coverUrl && <div className="absolute inset-0 h-72 opacity-20" style={{ backgroundImage: `url(${heroData.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-10">
          {/* Avatar */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-28 h-28 rounded-3xl object-cover border-4 shadow-2xl" style={{ borderColor: bg }} />
              ) : (
                <div className="w-28 h-28 rounded-3xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl border-4" style={{ background: grad, borderColor: bg }}>{name[0]}</div>
              )}
              {isOpenToWork && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 text-[9px] font-bold text-white rounded-full shadow-md whitespace-nowrap" style={{ background: '#10B981' }}>
                  Open to Work
                </span>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div className="text-center mt-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: `'${headingFont}'`, color: text }}>{name}</h1>
            <p className="text-sm font-medium mt-1" style={{ color: primary }}>{title}</p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs" style={{ color: muted }}>
              <span className="flex items-center gap-1"><MapPin size={12} /> {location}</span>
              {heroData.experienceYears && <span className="flex items-center gap-1"><Briefcase size={12} /> {heroData.experienceYears} exp</span>}
              {heroData.joiningAvailability && <span className="flex items-center gap-1"><Calendar size={12} /> {heroData.joiningAvailability}</span>}
            </div>
            {heroData.tagline && <p className="text-xs mt-3 max-w-md mx-auto" style={{ color: muted }}>{heroData.tagline}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {heroData.resumeUrl && (
              <a href={heroData.resumeUrl} target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg hover:shadow-xl transition-all"
                style={{ borderRadius: '12px', background: grad }}>
                <Download size={13} /> Download Resume
              </a>
            )}
            {(heroData.email || contactData.email) && (
              <a href={`mailto:${heroData.email || contactData.email}`}
                className="px-5 py-2.5 text-xs font-bold border flex items-center gap-1.5 hover:shadow-md transition-all"
                style={{ borderRadius: '12px', borderColor: `${muted}25`, color: text }}>
                <Mail size={13} /> Email Me
              </a>
            )}
            {heroData.whatsapp && (
              <a href={`https://wa.me/${heroData.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                className="px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1.5 hover:shadow-md transition-all"
                style={{ borderRadius: '12px', background: '#25D366' }}>
                WhatsApp
              </a>
            )}
            <button onClick={handleShare}
              className="px-4 py-2.5 text-xs font-bold border flex items-center gap-1.5 hover:shadow-md transition-all"
              style={{ borderRadius: '12px', borderColor: `${muted}25`, color: text }}>
              {copied ? <><Check size={13} /> Copied!</> : <><Share2 size={13} /> Share</>}
            </button>
          </div>
        </div>
      </section>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="max-w-4xl mx-auto px-6 pb-16">
        {orderedSections.map(section => (
          <div key={section!.id}>{renderSection(section)}</div>
        ))}
      </main>

      {/* ═══ CONTACT FOOTER ═══ */}
      {contactSection && (contactData.phone || contactData.email || contactData.address) && (
        <section className="py-12 border-t" style={{ borderColor: `${muted}15` }}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: `'${headingFont}'` }}>Let&apos;s Connect</h2>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: muted }}>
              {contactData.phone && <a href={`tel:${contactData.phone}`} className="flex items-center gap-1 hover:opacity-70"><Phone size={12} style={{ color: primary }} /> {contactData.phone}</a>}
              {contactData.email && <a href={`mailto:${contactData.email}`} className="flex items-center gap-1 hover:opacity-70"><Mail size={12} style={{ color: primary }} /> {contactData.email}</a>}
              {contactData.address && <span className="flex items-center gap-1"><MapPin size={12} style={{ color: primary }} /> {contactData.address}</span>}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-6 text-center text-[10px]" style={{ color: `${muted}80` }}>
        Powered by <a href="https://thenijobs.com" className="font-bold" style={{ color: primary }}>THENIJOBS</a>
      </footer>
    </div>
  );
}
