// ============================================================
// THENIJOBS — Portfolio Website Builder Types
// ============================================================

// ===== TEMPLATE DEFINITIONS =====

export type PlanTier = 'free' | 'standard' | 'premium' | 'enterprise';

export interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  plan: PlanTier;
  bestFor: string;
  thumbnail: string;  // path to preview image
  category: 'business' | 'product' | 'service' | 'creative' | 'enterprise' | 'career';
  sections: SectionType[];  // default sections for this template
  features: string[];
}

// ===== SECTION TYPES =====

export type SectionType =
  | 'hero'
  | 'about'
  | 'services'
  | 'products'
  | 'team'
  | 'gallery'
  | 'testimonials'
  | 'projects'
  | 'careers'
  | 'contact'
  | 'faq'
  | 'timeline'
  | 'achievements'
  | 'clients'
  | 'news'
  | 'custom'
  | 'leadership'
  | 'ceo-message'
  | 'branches'
  | 'awards'
  | 'portfolio-grid'
  | 'case-studies'
  | 'video'
  | 'social-links'
  | 'working-hours'
  | 'location-map';

export interface PortfolioSection {
  id: string;
  type: SectionType;
  title: string;
  visible: boolean;
  order: number;
  data: Record<string, any>;
  /** Plan required to use this section */
  requiredPlan?: PlanTier;
}

// ===== SECTION DATA TYPES =====

export interface HeroSectionData {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage: string;
  backgroundVideo?: string;
  overlayOpacity: number;
  style: 'centered' | 'left-aligned' | 'split' | 'fullscreen';
}

export interface AboutSectionData {
  content: string;
  image: string;
  founded: string;
  employees: string;
  industry: string;
  mission: string;
  vision: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  price?: string;
  ctaText: string;
  ctaLink: string;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  originalPrice?: string;
  category: string;
  inStock: boolean;
  whatsappLink: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  socialLinks: { platform: string; url: string }[];
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  photo: string;
  content: string;
  rating: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  client: string;
  year: string;
  link?: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  category: string;
}

export interface CareerOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  link: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  icon: string;
}

export interface AchievementItem {
  id: string;
  number: string;
  label: string;
  icon: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  logo: string;
  url?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  link: string;
}

export interface ContactSectionData {
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  googleMapsEmbed: string;
  showForm: boolean;
  socialLinks: { platform: string; url: string }[];
}

export interface WorkingHoursData {
  schedule: { day: string; hours: string; closed: boolean }[];
}

// ===== THEME =====

export interface PortfolioTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textMutedColor: string;
  accentColor: string;
  buttonStyle: 'rounded' | 'pill' | 'square';
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full';
  fontFamily: string;
  headingFont: string;
  headerStyle: 'solid' | 'transparent' | 'gradient';
  footerStyle: 'simple' | 'detailed' | 'minimal';
  animation: 'none' | 'subtle' | 'moderate' | 'dynamic';
}

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

// ===== BRANDING =====

export interface PortfolioBranding {
  logo: string;
  favicon: string;
  coverImage: string;
  companyName: string;
  tagline: string;
}

// ===== SEO =====

export interface PortfolioSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  canonicalUrl: string;
  structuredDataType: 'LocalBusiness' | 'Organization' | 'Person';
}

// ===== ANALYTICS =====

export interface PortfolioAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  enquiries: number;
  lastViewedAt: any;
}

// ===== PORTFOLIO SITE (Main Document) =====

export type PortfolioStatus = 'draft' | 'published' | 'unpublished';
export type PortfolioVisibility = 'public' | 'private';
export type PortfolioOwnerType = 'company' | 'seeker';

export interface PortfolioSite {
  id: string;
  ownerId: string;
  ownerType: PortfolioOwnerType;
  companyId?: string;

  // Template
  templateId: string;
  status: PortfolioStatus;
  visibility: PortfolioVisibility;
  googleIndex: boolean;

  // Identity
  customUrl: string;  // username-based slug
  theniJobsId: string;  // TJ-C-00001

  // Plan
  planSlug: string;

  // Content
  theme: PortfolioTheme;
  branding: PortfolioBranding;
  sections: PortfolioSection[];
  seo: PortfolioSEO;

  // Analytics
  analytics: PortfolioAnalytics;

  // Timestamps
  createdAt: any;
  updatedAt: any;
  publishedAt: any | null;
}

// ===== VERSION HISTORY =====

export interface PortfolioVersion {
  id: string;
  siteId: string;
  version: number;
  snapshot: Omit<PortfolioSite, 'id' | 'analytics' | 'createdAt'>;
  changedBy: string;
  changeNote: string;
  createdAt: any;
}

// ===== EDITOR STATE =====

export interface EditorState {
  selectedSectionId: string | null;
  previewDevice: 'desktop' | 'laptop' | 'tablet' | 'mobile';
  isDirty: boolean;
  isSaving: boolean;
  isPublishing: boolean;
  showPreview: boolean;
  showAI: boolean;
  dragActive: boolean;
}

export const DEFAULT_EDITOR_STATE: EditorState = {
  selectedSectionId: null,
  previewDevice: 'desktop',
  isDirty: false,
  isSaving: false,
  isPublishing: false,
  showPreview: false,
  showAI: false,
  dragActive: false,
};

// ===== DEVICE PREVIEW SIZES =====

export const DEVICE_SIZES = {
  desktop: { width: 1440, height: 900, label: 'Desktop', icon: 'Monitor' },
  laptop: { width: 1024, height: 768, label: 'Laptop', icon: 'Laptop' },
  tablet: { width: 768, height: 1024, label: 'Tablet', icon: 'Tablet' },
  mobile: { width: 375, height: 812, label: 'Mobile', icon: 'Smartphone' },
} as const;

// ===== PLAN BADGE DEFINITIONS =====

export interface PlanBadgeDef {
  plan: PlanTier;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  emoji: string;
}

export const PLAN_BADGES: PlanBadgeDef[] = [
  { plan: 'free', label: 'Basic', icon: 'Shield', color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB', emoji: '🛡️' },
  { plan: 'standard', label: 'Silver Verified', icon: 'Award', color: '#6B7280', bgColor: '#F1F5F9', borderColor: '#94A3B8', emoji: '🥈' },
  { plan: 'premium', label: 'Gold Verified', icon: 'Star', color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FCD34D', emoji: '⭐' },
  { plan: 'enterprise', label: 'Platinum Elite', icon: 'Diamond', color: '#7C3AED', bgColor: '#F5F3FF', borderColor: '#C4B5FD', emoji: '💎' },
];

// ===== FONT OPTIONS =====

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter', category: 'Sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'Sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'Sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', category: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'Sans-serif' },
  { value: 'Outfit', label: 'Outfit', category: 'Sans-serif' },
  { value: 'DM Sans', label: 'DM Sans', category: 'Sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
  { value: 'Source Serif Pro', label: 'Source Serif Pro', category: 'Serif' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'Monospace' },
];
