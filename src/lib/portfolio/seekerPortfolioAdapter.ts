import type {
  PortfolioSite,
  PortfolioSection,
  PortfolioTheme,
  SeekerHeroData,
  SeekerSkillItem,
  SeekerExperienceItem,
  SeekerEducationItem,
  SeekerProjectItem,
  SeekerCertificationItem,
  SeekerAchievementItem,
  ContactSectionData,
} from '@/lib/types/portfolio';

export const DEFAULT_THEME: PortfolioTheme = {
  primaryColor: '#2563EB',
  secondaryColor: '#059669',
  backgroundColor: '#FFFFFF',
  surfaceColor: '#F8FAFC',
  textColor: '#111827',
  textMutedColor: '#6B7280',
  accentColor: '#D97706',
  buttonStyle: 'rounded',
  borderRadius: 'medium',
  fontFamily: 'Inter',
  headingFont: 'Poppins',
  headerStyle: 'solid',
  footerStyle: 'simple',
  animation: 'subtle',
};

export interface SeekerAdapterInput {
  userId?: string;
  name?: string;
  headline?: string;
  currentRole?: string;
  bio?: string;
  email?: string;
  phone?: string;
  address?: string;
  district?: string;
  state?: string;
  photoUrl?: string;
  resumeUrl?: string;
  workMode?: string;
  noticePeriod?: string;
  joiningAvailability?: string;
  expectedSalary?: string;
  isOpenToWork?: boolean;
  isPortfolioPublic?: boolean;
  customUrl?: string;
  templateId?: string;
  theme?: Partial<PortfolioTheme>;
  coverImage?: string;
  skills?: any[];
  languages?: any[];
  education?: any[];
  experience?: any[];
  projects?: any[];
  certifications?: any[];
  achievements?: any[];
  portfolioLinks?: string[];
  privacySettings?: {
    hidePhone?: boolean;
    hideEmail?: boolean;
    hideAddress?: boolean;
    hideResume?: boolean;
    hideContact?: boolean;
  };
}

export const CANDIDATE_TEMPLATES = [
  {
    id: 'seeker-modern-pro',
    name: 'Modern Pro',
    tag: 'Recommended',
    tagline: 'Professional card-grid layout with vibrant hero banner & badge showcase',
    accentColor: '#059669',
  },
  {
    id: 'seeker-creative',
    name: 'Creative Bento',
    tag: 'Creative & Tech',
    tagline: 'Split gradient hero, bento category cards, interactive skill progress rings',
    accentColor: '#8B5CF6',
  },
  {
    id: 'seeker-executive',
    name: 'Executive Dark',
    tag: 'Corporate & Lead',
    tagline: 'Corporate two-column structure with dark hero & sticky career snapshot',
    accentColor: '#1E3A8A',
  },
  {
    id: 'seeker-minimal',
    name: 'Minimal Resume',
    tag: 'ATS Clean',
    tagline: 'Clean distraction-free chronological resume format designed for recruiters',
    accentColor: '#0F172A',
  },
];

export const CANDIDATE_THEME_PRESETS: { name: string; primary: string; secondary: string; bg: string; surface: string; text: string; muted: string }[] = [
  {
    name: 'Emerald Pro',
    primary: '#059669',
    secondary: '#0D9488',
    bg: '#FFFFFF',
    surface: '#F0FDF4',
    text: '#0F172A',
    muted: '#64748B',
  },
  {
    name: 'Royal Blue',
    primary: '#2563EB',
    secondary: '#0284C7',
    bg: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    muted: '#64748B',
  },
  {
    name: 'Deep Violet',
    primary: '#7C3AED',
    secondary: '#C026D3',
    bg: '#FFFFFF',
    surface: '#FAF5FF',
    text: '#1E1B4B',
    muted: '#6B7280',
  },
  {
    name: 'Sunset Coral',
    primary: '#E11D48',
    secondary: '#F97316',
    bg: '#FFFFFF',
    surface: '#FFF1F2',
    text: '#1E1B4B',
    muted: '#64748B',
  },
  {
    name: 'Cyber Slate',
    primary: '#0284C7',
    secondary: '#6366F1',
    bg: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    muted: '#94A3B8',
  },
  {
    name: 'Luxury Amber',
    primary: '#D97706',
    secondary: '#B45309',
    bg: '#FFFFFF',
    surface: '#FFFBEB',
    text: '#1C1917',
    muted: '#78716C',
  },
];

export const BANNER_GRADIENT_PRESETS = [
  { id: 'grad-emerald', name: 'Emerald Gradient', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1600&q=80' },
  { id: 'grad-blue', name: 'Royal Indigo', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1600&q=80' },
  { id: 'grad-purple', name: 'Violet Aurora', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1600&q=80' },
  { id: 'grad-dark', name: 'Dark Executive', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80' },
];

/**
 * Builds a 100% compliant PortfolioSite representation from real-time Seeker Profile inputs.
 */
export function buildSeekerPortfolioSite(input: SeekerAdapterInput): PortfolioSite {
  const uid = input.userId || 'demo-seeker';
  const name = input.name || 'Candidate Portfolio';
  const role = input.headline || input.currentRole || 'Career Professional';
  const location = input.district ? `${input.district}, Tamil Nadu` : (input.address || 'Theni, Tamil Nadu');
  const avatar = input.photoUrl || '';
  const cover = input.coverImage || BANNER_GRADIENT_PRESETS[0].url;
  const templateId = input.templateId || 'seeker-modern-pro';

  // Format skills
  const skillsList: SeekerSkillItem[] = (input.skills || []).map((s, idx) => {
    if (typeof s === 'string') {
      return {
        id: `sk-${idx}`,
        name: s,
        category: idx % 3 === 0 ? 'technical' : idx % 3 === 1 ? 'tools' : 'soft',
        level: 85,
        levelLabel: 'Proficient',
      };
    }
    return {
      id: s.id || `sk-${idx}`,
      name: s.name || 'Skill',
      category: s.category || 'technical',
      level: typeof s.level === 'number' ? s.level : 85,
      levelLabel: s.levelLabel || 'Advanced',
    };
  });

  // Format experience
  const experienceList: SeekerExperienceItem[] = (input.experience || []).map((e, idx) => ({
    id: e.id || `exp-${idx}`,
    company: e.company || 'Company',
    role: e.role || 'Designation',
    startDate: e.startDate || '2023',
    endDate: e.endDate || 'Present',
    isCurrent: !e.endDate || e.endDate.toLowerCase() === 'present',
    location: e.location || location,
    description: e.description || '',
    achievements: Array.isArray(e.achievements) ? e.achievements : undefined,
  }));

  // Format education
  const educationList: SeekerEducationItem[] = (input.education || []).map((edu, idx) => ({
    id: edu.id || `edu-${idx}`,
    institution: edu.institution || 'Institution',
    degree: edu.degree || 'Degree',
    field: edu.field || '',
    year: edu.year || '',
    percentage: edu.percentage || undefined,
  }));

  // Format projects
  const projectsList: SeekerProjectItem[] = (input.projects || []).map((p, idx) => ({
    id: p.id || `proj-${idx}`,
    title: p.title || `Featured Project ${idx + 1}`,
    category: p.category || 'General',
    description: p.description || '',
    techStack: Array.isArray(p.techStack)
      ? p.techStack
      : typeof p.technologies === 'string'
      ? p.technologies.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [],
    liveUrl: p.liveUrl || '',
    githubUrl: p.githubUrl || '',
    imageUrl: p.imageUrl || undefined,
    featured: true,
  }));

  // Format certifications
  const certsList: SeekerCertificationItem[] = (input.certifications || []).map((c, idx) => ({
    id: c.id || `cert-${idx}`,
    name: c.name || 'Professional Certification',
    issuer: c.organization || c.issuer || 'Certification Authority',
    issueDate: c.date || c.issueDate || '2024',
    credentialUrl: c.link || c.credentialUrl || '',
  }));

  // Format achievements
  const achievementsList: SeekerAchievementItem[] = (input.achievements || []).map((a, idx) => ({
    id: a.id || `ach-${idx}`,
    title: a.title || 'Career Milestone',
    organization: a.organization || undefined,
    date: a.date || undefined,
    description: a.description || undefined,
  }));

  const expYears = experienceList.length > 0 ? `${experienceList.length}+ Years` : 'Fresher';
  const availability = input.noticePeriod || input.joiningAvailability || 'Immediate Joiner';

  // Build Sections
  const sections: PortfolioSection[] = [
    {
      id: 'sec-hero',
      type: 'hero',
      title: 'Hero Banner',
      visible: true,
      order: 0,
      data: {
        name,
        title: role,
        tagline: input.bio || 'Dedicated professional striving for excellence and impactful contributions.',
        location,
        avatarUrl: avatar,
        coverUrl: cover,
        isOpenToWork: input.isOpenToWork !== false,
        experienceYears: expYears,
        joiningAvailability: availability,
        whatsapp: !input.privacySettings?.hidePhone ? (input.phone || '') : '',
        phone: !input.privacySettings?.hidePhone ? (input.phone || '') : '',
        email: !input.privacySettings?.hideEmail ? (input.email || '') : '',
        resumeUrl: !input.privacySettings?.hideResume ? (input.resumeUrl || '') : '',
      } as SeekerHeroData,
    },
    {
      id: 'sec-about',
      type: 'about',
      title: 'About Me',
      visible: true,
      order: 1,
      data: {
        content: input.bio || `${name} is an experienced and driven ${role} based in ${location}. Committed to delivering high-quality work, continuous learning, and driving meaningful organizational results.`,
        highlights: [
          { value: expYears, label: 'Work Experience' },
          { value: `${skillsList.length || 4}+`, label: 'Core Skills' },
          { value: '100%', label: 'Commitment' },
          { value: 'Verified', label: 'THENIJOBS Profile' },
        ],
      },
    },
    {
      id: 'sec-skills',
      type: 'skills',
      title: 'Skills & Capabilities',
      visible: skillsList.length > 0,
      order: 2,
      data: {
        skills: skillsList.length > 0 ? skillsList : [
          { id: 's1', name: 'Communication & Teamwork', category: 'soft', level: 90, levelLabel: 'Expert' },
          { id: 's2', name: 'Problem Solving & Critical Thinking', category: 'soft', level: 85, levelLabel: 'Advanced' },
          { id: 's3', name: 'Time Management', category: 'soft', level: 85, levelLabel: 'Advanced' },
        ],
      },
    },
    {
      id: 'sec-experience',
      type: 'experience',
      title: 'Professional Experience',
      visible: experienceList.length > 0,
      order: 3,
      data: {
        experience: experienceList,
      },
    },
    {
      id: 'sec-projects',
      type: 'projects',
      title: 'Projects & Work Portfolio',
      visible: projectsList.length > 0,
      order: 4,
      data: {
        projects: projectsList,
      },
    },
    {
      id: 'sec-education',
      type: 'education',
      title: 'Education & Qualifications',
      visible: educationList.length > 0,
      order: 5,
      data: {
        education: educationList,
      },
    },
    {
      id: 'sec-certifications',
      type: 'certifications',
      title: 'Licenses & Certifications',
      visible: certsList.length > 0,
      order: 6,
      data: {
        certifications: certsList,
      },
    },
    {
      id: 'sec-achievements',
      type: 'achievements',
      title: 'Honors & Achievements',
      visible: achievementsList.length > 0,
      order: 7,
      data: {
        achievements: achievementsList,
      },
    },
    {
      id: 'sec-contact',
      type: 'contact',
      title: 'Contact Information',
      visible: true,
      order: 8,
      data: {
        email: !input.privacySettings?.hideEmail ? input.email : '',
        phone: !input.privacySettings?.hidePhone ? input.phone : '',
        address: !input.privacySettings?.hideAddress ? location : '',
        whatsapp: !input.privacySettings?.hidePhone ? input.phone : '',
        socialLinks: (input.portfolioLinks || []).map((url, i) => ({
          platform: url.includes('github') ? 'GitHub' : url.includes('linkedin') ? 'LinkedIn' : url.includes('twitter') ? 'Twitter' : `Link ${i + 1}`,
          url,
        })),
      } as ContactSectionData,
    },
  ];

  const defaultThemePreset = CANDIDATE_THEME_PRESETS[0];

  const theme: PortfolioTheme = {
    ...DEFAULT_THEME,
    primaryColor: input.theme?.primaryColor || defaultThemePreset.primary,
    secondaryColor: input.theme?.secondaryColor || defaultThemePreset.secondary,
    backgroundColor: input.theme?.backgroundColor || defaultThemePreset.bg,
    surfaceColor: input.theme?.surfaceColor || defaultThemePreset.surface,
    textColor: input.theme?.textColor || defaultThemePreset.text,
    textMutedColor: input.theme?.textMutedColor || defaultThemePreset.muted,
    fontFamily: input.theme?.fontFamily || 'Inter',
    headingFont: input.theme?.headingFont || 'Poppins',
    borderRadius: input.theme?.borderRadius || 'large',
  };

  const customSlug = input.customUrl || (name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `seeker-${uid.slice(0, 6)}`);

  return {
    id: `site-${uid}`,
    ownerId: uid,
    ownerType: 'seeker',
    templateId,
    status: input.isPortfolioPublic ? 'published' : 'draft',
    visibility: input.isPortfolioPublic ? 'public' : 'private',
    googleIndex: Boolean(input.isPortfolioPublic),
    customUrl: customSlug,
    theniJobsId: `TNJ-S-${uid.slice(0, 6).toUpperCase()}`,
    planSlug: input.isPortfolioPublic ? 'standard' : 'free',
    theme,
    branding: {
      logo: avatar,
      favicon: '/icon.png',
      coverImage: cover,
      companyName: name,
      tagline: role,
    },
    sections,
    seo: {
      title: `${name} — Professional Portfolio | THENIJOBS`,
      description: `${name} (${role}) verified professional portfolio and resume in ${location}.`,
      keywords: [name, role, 'Theni', 'Tamil Nadu', 'Portfolio', 'Resume'],
      ogImage: avatar || cover,
      canonicalUrl: `https://www.thenijobs.com/job-seeker/${customSlug}`,
      structuredDataType: 'Person',
    },
    analytics: {
      totalViews: 0,
      uniqueVisitors: 0,
      enquiries: 0,
      lastViewedAt: null,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: input.isPortfolioPublic ? new Date() : null,
    firstApprovedAt: input.isPortfolioPublic ? new Date() : null,
  };
}
