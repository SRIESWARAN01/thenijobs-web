// ============================================================
// THENIJOBS — Application-wide Constants
// ============================================================

import type { SubscriptionPlan } from '@/lib/types';

// ===== OFFICIAL CONTACT NUMBERS & DETAILS =====
export const SITE_CONTACT = {
  phone1: '+91 93605 19460',
  phone1Raw: '+919360519460',
  phone2: '+91 70948 26886',
  phone2Raw: '+917094826886',
  whatsapp: '919360519460',
  whatsappUrl: 'https://wa.me/919360519460',
  email: 'info@thenijobs.com',
  supportEmail: 'support@thenijobs.com',
  addressLine1: 'North Street, A.M. Patty',
  addressLine2: 'Uthamapalayam, Theni District, Tamil Nadu - 625533, India',
  fullAddress: 'North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu, India.',
  address: 'North Street, A.M. Patty, Uthamapalayam, Theni District, Tamil Nadu, India.',
  location: 'Theni, Tamil Nadu, India',
};

// ===== DESIGNATED RETAINED ADMIN & PRODUCTION COMPANIES =====
export const DESIGNATED_RETAINED_ADMIN_UID = 'xNM3lkvzQ5fcgVVZirlC6kkyoSE2';
export const DESIGNATED_RETAINED_ADMIN_EMAIL = 'srieswaran22@gmail.com';

export const RETAINED_PRODUCTION_COMPANIES = [
  { id: 'vMQgOwNd2fZ4Nm8870Dw', name: 'AGS IT Solutions' },
  { id: 'ik3pWBDVVUR3Sb51knwK', name: 'Agrimore' },
  { id: '7K95afmwXMddFJo8PeRB', name: 'M K Security Solutions & Electronics' },
  { id: 'VG1PwPzKXofu1fLxLIpk', name: 'SVR Heritage Hall' },
  { id: 'SDv5CaYdxKRWOXl4ej84', name: 'Chennai Bakes' },
  { id: 'mWWNVrCGounWsmXdaRGL', name: 'Sarvesh Super Market' },
  { id: 'oKDQpFZ3bx9C4S0Z0ti9', name: 'Apex Scholar Publication' },
  { id: 'u9sYSAG9YoGrept1FbSe', name: 'Suruliraj Chemicals' },
] as const;

// ===== 7 THENI TALUKS & LOCAL AREAS =====
export const THENI_TALUKS = [
  { id: 'theni', name: 'Theni', tamilName: 'தேனி', popularTowns: ['Theni', 'Allinagaram', 'Veerapandi'] },
  { id: 'periyakulam', name: 'Periyakulam', tamilName: 'பெரியகுளம்', popularTowns: ['Periyakulam', 'Vadugapatti', 'Devadanapatti'] },
  { id: 'cumbum', name: 'Cumbum', tamilName: 'கம்பம்', popularTowns: ['Cumbum', 'Gudalur', 'Kamayagoundanpatti'] },
  { id: 'bodinayakanur', name: 'Bodinayakanur', tamilName: 'போடிநாயக்கனூர்', popularTowns: ['Bodi', 'Bodinayakanur', 'Kurangani'] },
  { id: 'uthamapalayam', name: 'Uthamapalayam', tamilName: 'உத்தமபாளையம்', popularTowns: ['Uthamapalayam', 'Kombai', 'Pannaipuram'] },
  { id: 'andipatti', name: 'Andipatti', tamilName: 'ஆண்டிபட்டி', popularTowns: ['Andipatti', 'Kadamalaikundu', 'Myladumparai'] },
  { id: 'chinnamanur', name: 'Chinnamanur', tamilName: 'சின்னமனூர்', popularTowns: ['Chinnamanur', 'Markayankottai', 'Oveepuram'] },
] as const;

// ===== POPULAR JOB CATEGORIES FOR LOCAL ALERTS =====
export const POPULAR_JOB_CATEGORIES = [
  { id: 'retail_sales', name: 'Retail & Field Sales', tamilName: 'விற்பனை & சேல்ஸ்' },
  { id: 'accounts', name: 'Accounts & Tally GST', tamilName: 'கணக்காளர் & டாலி' },
  { id: 'office_admin', name: 'Office, Typing & Computer', tamilName: 'அலுவலகம் & கணினி' },
  { id: 'software_it', name: 'Software & Web Dev', tamilName: 'மென்பொருள் & ஐடி' },
  { id: 'hospital_medical', name: 'Hospital, Nurse & Pharma', tamilName: 'மருத்துவம் & நர்சிங்' },
  { id: 'teaching', name: 'Teaching & Faculty', tamilName: 'ஆசிரியர் & பயிற்சி' },
  { id: 'hotel_food', name: 'Hotel, Chef & Service', tamilName: 'ஹோட்டல் & சர்வீஸ்' },
  { id: 'driver_logistics', name: 'Driver & Delivery', tamilName: 'டிரைவர் & டெலிவரி' },
  { id: 'agriculture_factory', name: 'Agriculture & Mills', tamilName: 'விவசாயம் & ஆலை' },
] as const;

/**
 * Sanitizes any raw phone number into a clean international WhatsApp number for India.
 * Handles '+91', spaces, hyphens, and leading zeros.
 */
export function sanitizeWhatsAppPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return '919360519460';
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  if (digits.length === 10) {
    return '91' + digits;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits.length >= 10 ? digits : '919360519460';
}

// ===== SEEKER PUBLIC PROFILE FEE (SEEKERPRIVACY-1) =====
// A one-year fee to make a job seeker's portfolio publicly viewable at
// /portfolio/seeker/[id] -- distinct from SUBSCRIPTION_PLANS (those are
// employer/company plans) and distinct from AI-CONNECT-1's own ₹50 AI-key
// connection fee (two separate ₹50 products, per the owner's 2026-09-07 decision).
export const SEEKER_PUBLIC_PROFILE_FEE_INR = 50;

// AI-CONNECT-1: a ONE-TIME THENIJOBS connection fee for a job seeker to connect their own
// OpenAI/Gemini API key (D-AI-ACCESS, owner, 2026-09-07) -- distinct from
// SEEKER_PUBLIC_PROFILE_FEE_INR above (a recurring yearly charge for a different product) despite
// sharing the same ₹50 amount, and distinct from actual provider usage cost (billed by
// OpenAI/Gemini directly to the seeker's own account, never THENIJOBS). Paying once grants the
// connection right permanently -- src/app/api/ai/connections/disconnect/route.ts deliberately
// preserves this entitlement, so reconnecting a replacement key later never re-bills.
export const AI_CONNECTION_FEE_INR = 50;

// ===== URGENT HIRING 48-HOUR SPOTLIGHT BADGE =====
// Employers/hospitals can spotlight an urgent requirement for 48 hours for a micro-fee of ₹99 or ₹149 (Super Spotlight).
export const URGENT_HIRING_BADGE_FEE_INR = 99;
export const URGENT_HIRING_SUPER_FEE_INR = 149;
export const URGENT_HIRING_FEES = {
  STANDARD_48H: 99,
  SUPER_SPOTLIGHT_48H: 149,
} as const;
export const VALID_URGENT_FEES = [99, 149] as const;
export const URGENT_HIRING_DURATION_HOURS = 48;

/**
 * Checks if a job has an active 48-hour urgent spotlight.
 */
export function isJobUrgent(job: { isUrgent?: boolean; urgentUntil?: any } | null | undefined): boolean {
  if (!job || !job.isUrgent) return false;
  if (!job.urgentUntil) return true;
  const expiry = job.urgentUntil instanceof Date
    ? job.urgentUntil.getTime()
    : typeof job.urgentUntil === 'string' || typeof job.urgentUntil === 'number'
    ? new Date(job.urgentUntil).getTime()
    : job.urgentUntil.seconds
    ? job.urgentUntil.seconds * 1000
    : 0;
  return expiry > Date.now();
}

/**
 * Returns human-readable remaining time for urgent spotlight.
 */
export function getUrgentRemainingTime(job: { urgentUntil?: any } | null | undefined): string {
  if (!job?.urgentUntil) return 'Active';
  const expiry = job.urgentUntil instanceof Date
    ? job.urgentUntil.getTime()
    : typeof job.urgentUntil === 'string' || typeof job.urgentUntil === 'number'
    ? new Date(job.urgentUntil).getTime()
    : job.urgentUntil.seconds
    ? job.urgentUntil.seconds * 1000
    : 0;
  const diffMs = expiry - Date.now();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m left`;
  return `${mins}m left`;
}

// ===== VILLAGE AMBASSADOR & REFERRAL COMMISSIONS =====
export const AMBASSADOR_COMMISSIONS: Record<string, number> = {
  basic: 150,       // ₹150 for ₹999 Basic plan
  standard: 350,    // ₹350 for ₹1,800 Standard plan
  premium: 700,     // ₹700 for ₹3,500 Premium plan
  enterprise: 1000, // ₹1,000 for ₹5,000 Enterprise plan
};

export const getAmbassadorCommission = (planSlug: string | undefined): number => {
  if (!planSlug) return 0;
  return AMBASSADOR_COMMISSIONS[planSlug.toLowerCase()] || 0;
};

// ===== SUBSCRIPTION PLANS (ANNUAL PRICING STRATEGY — 4 TIERS) =====
export const ALL_VALID_PLAN_PRICES: Record<string, number> = {
  basic: 999,
  standard: 1800,
  premium: 3500,
  enterprise: 5000,
  seeker_pro: 199,
  'seeker-premium': 199,
};

// Authoritative representation of unlimited quotas.
// -1 indicates unlimited capacity (never an arbitrary numerical cap like 999 or 9999).
export const UNLIMITED_LIMIT = -1;

export function isUnlimited(val: number | undefined | null): boolean {
  return val === UNLIMITED_LIMIT || val === Infinity;
}

export function isWithinLimit(current: number, limit: number): boolean {
  if (isUnlimited(limit)) return true;
  return current < limit;
}

export function getRemainingQuota(current: number, limit: number): number {
  if (isUnlimited(limit)) return Infinity;
  return Math.max(0, limit - current);
}

export function formatLimit(limit: number, singular = '', plural = ''): string {
  if (isUnlimited(limit)) return 'Unlimited';
  return `${limit}${plural ? ' ' + (limit === 1 ? singular : plural) : ''}`;
}

export interface PlanLimits {
  activeJobs: number;
  jobAlerts: number;
  products: number;
  services: number;
  galleryImages: number;
  videos: number;
  templates: number;
  themes: number;
  branches: number;
  staffIds: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    activeJobs: 1,
    jobAlerts: 1,
    products: 0,
    services: 0,
    galleryImages: 2,
    videos: 0,
    templates: 1,
    themes: 1,
    branches: 0,
    staffIds: 0,
  },
  basic: {
    activeJobs: 5,
    jobAlerts: 5,
    products: 0,
    services: 0,
    galleryImages: 6,
    videos: 0,
    templates: 1,
    themes: 1,
    branches: 0,
    staffIds: 0,
  },
  standard: {
    activeJobs: 10, // Confirmed 10 active jobs limit
    jobAlerts: 10,
    products: 20,
    services: 10,
    galleryImages: 10,
    videos: 2,
    templates: 5,
    themes: 5,
    branches: 3,
    staffIds: 0,
  },
  premium: {
    activeJobs: 50,
    jobAlerts: 50,
    products: 100,
    services: 50,
    galleryImages: 50,
    videos: 10,
    templates: 15,
    themes: 15,
    branches: 20,
    staffIds: 25,
  },
  enterprise: {
    activeJobs: UNLIMITED_LIMIT,
    jobAlerts: UNLIMITED_LIMIT,
    products: UNLIMITED_LIMIT,
    services: UNLIMITED_LIMIT,
    galleryImages: UNLIMITED_LIMIT,
    videos: UNLIMITED_LIMIT,
    templates: UNLIMITED_LIMIT,
    themes: UNLIMITED_LIMIT,
    branches: UNLIMITED_LIMIT,
    staffIds: UNLIMITED_LIMIT,
  },
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_basic',
    name: 'Basic',
    slug: 'basic',
    price: 999,
    monthlyEquivalent: 83,
    dailyEquivalent: 2.74,
    period: 'year',
    features: [
      'Company Profile & Digital ID Card',
      'View Jobs & Business Listings',
      'Apply for Standard Jobs',
      '5 Active Job Postings',
      '5 Job Alerts',
      '6 Gallery Images',
      '1 Website Template & Basic Theme',
      'QR Code & Public Profile URL',
      'Basic WhatsApp Enquiry',
      'Google Maps & Contact Form',
      'Lead Management',
      'Basic SEO & Schema',
      'Basic Verification Badge',
    ],
    notIncluded: [
      'Product & Service Catalogue',
      'Gallery Videos & Photo Albums',
      'Customer Reviews & Ratings',
      'Branch & Staff Management',
    ],
    recommended: false,
    bestFor: 'New Users & Startups',
    icon: 'Shield',
    badge: '🟢 Basic Verified',
  },
  {
    id: 'plan_standard',
    name: 'Standard',
    slug: 'standard',
    price: 1800,
    monthlyEquivalent: 150,
    dailyEquivalent: 4.93,
    period: 'year',
    badge: '🥈 Silver Verified',
    features: [
      'Everything in Basic',
      '10 Active Job Postings',
      '10 Job Alerts',
      'Product Catalogue: 20 Products',
      'Service Listings: 10 Services',
      '10 Gallery Images & 2 Videos',
      '5 Templates & 5 Color Themes',
      'Custom Cover Banner',
      'Premium Digital Visiting Card',
      '3 Branches',
      'Click-to-Call & FAQ Section',
      'Photo Albums & Review Photos',
      'Enhanced SEO & Custom Meta Tags',
      'View Counters for Profile, Jobs, and Business',
      'Business Announcements & Offers',
      'Silver Verification Badge',
    ],
    notIncluded: [
      'Video Banner',
      'Staff ID Cards (25+)',
      'Dynamic QR Code',
      'Featured Search Priority',
    ],
    recommended: false,
    bestFor: 'Local Shops & Growing Businesses',
    icon: 'Star',
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    slug: 'premium',
    price: 3500,
    monthlyEquivalent: 292,
    dailyEquivalent: 9.59,
    period: 'year',
    badge: '⭐ MOST POPULAR',
    features: [
      'Everything in Standard',
      '50 Active Job Postings',
      '50 Job Alerts',
      'Product Catalogue: 100 Products',
      'Service Listings: 50 Services',
      '50 Gallery Images & 10 Videos',
      '15 Premium Templates & 15 Themes',
      'Video Banner',
      'Premium+ Digital Card',
      '25 Staff IDs',
      '20 Branches',
      'Awards & Certifications Showcase',
      'Dynamic QR Code',
      'Gold Verification Badge',
      'Featured Search Priority',
    ],
    notIncluded: [
      'Unlimited Jobs, Products & Services',
      'AI Company Assistant / Chatbot',
      'AI SEO Content & AI Generated Meta Tags',
      'Enterprise Careers Portal',
    ],
    recommended: true,
    bestFor: 'Established Companies',
    icon: 'Crown',
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    price: 5000,
    monthlyEquivalent: 417,
    dailyEquivalent: 13.69,
    period: 'year',
    badge: '💎 ENTERPRISE',
    features: [
      'Everything in Premium',
      'Unlimited Jobs, Products & Services',
      'Unlimited Gallery, Videos & Albums',
      'Unlimited Templates & Themes',
      'Advanced Branding & Custom Colors/Fonts',
      'Enterprise Digital Card',
      'Unlimited Staff IDs',
      'AI Company Assistant / Chatbot',
      'AI SEO Content & AI Generated Meta Tags',
      'Enterprise Careers Portal',
      'CEO Message & Interactive Timeline',
      'Partner Logo Showcase',
      'Platinum Corporate Badge',
      'Homepage Featured Placement',
      'Top Search Priority',
    ],
    notIncluded: [],
    recommended: false,
    bestFor: 'Large Enterprises & Factories',
    icon: 'Building2',
  },
];

// ===== PLAN FEATURE ACCESS MATRIX =====
export const PLAN_FEATURE_MATRIX = {
  free: {
    activeJobsLimit: 1,
    portfolioType: 'none',
    digitalIdCard: false,
    qrCode: false,
    reviews: false,
    productsListing: false,
    servicesListing: false,
    portfolioProjects: false,
    founderProfile: false,
    teamShowcase: false,
    customSections: false,
    featuredCompany: false,
    candidateSearch: 'none',
    resumeViewing: false,
    interviewManagement: false,
    leadManagement: false,
    advancedAnalytics: false,
    seoLevel: 'none',
    multiUserHr: false,
    branchManagement: false,
    customBranding: false,
    prioritySupport: false,
  },
  basic: {
    activeJobsLimit: 5,
    portfolioType: 'basic',
    digitalIdCard: true,
    qrCode: true,
    reviews: false,
    productsListing: false,
    servicesListing: false,
    portfolioProjects: false,
    founderProfile: false,
    teamShowcase: false,
    customSections: false,
    featuredCompany: false,
    candidateSearch: 'none',
    resumeViewing: false,
    interviewManagement: false,
    leadManagement: true,
    advancedAnalytics: false,
    seoLevel: 'basic',
    multiUserHr: false,
    branchManagement: false,
    customBranding: false,
    prioritySupport: false,
  },
  standard: {
    activeJobsLimit: 10,
    portfolioType: 'full',
    digitalIdCard: true,
    qrCode: true,
    reviews: true,
    productsListing: true,
    servicesListing: true,
    portfolioProjects: true,
    founderProfile: true,
    teamShowcase: true,
    customSections: true,
    featuredCompany: false,
    candidateSearch: 'basic',
    resumeViewing: true,
    interviewManagement: true,
    leadManagement: true,
    advancedAnalytics: false,
    seoLevel: 'enhanced',
    multiUserHr: false,
    branchManagement: true,
    customBranding: false,
    prioritySupport: true,
  },
  premium: {
    activeJobsLimit: 50,
    portfolioType: 'premium',
    digitalIdCard: true,
    qrCode: true,
    reviews: true,
    productsListing: true,
    servicesListing: true,
    portfolioProjects: true,
    founderProfile: true,
    teamShowcase: true,
    customSections: true,
    featuredCompany: true,
    candidateSearch: 'advanced',
    resumeViewing: true,
    interviewManagement: true,
    leadManagement: true,
    advancedAnalytics: true,
    seoLevel: 'advanced',
    multiUserHr: true,
    branchManagement: true,
    customBranding: false,
    prioritySupport: true,
  },
  enterprise: {
    activeJobsLimit: UNLIMITED_LIMIT,
    portfolioType: 'custom',
    digitalIdCard: true,
    qrCode: true,
    reviews: true,
    productsListing: true,
    servicesListing: true,
    portfolioProjects: true,
    founderProfile: true,
    teamShowcase: true,
    customSections: true,
    featuredCompany: true,
    candidateSearch: 'advanced',
    resumeViewing: true,
    interviewManagement: true,
    leadManagement: true,
    advancedAnalytics: true,
    seoLevel: 'ai',
    multiUserHr: true,
    branchManagement: true,
    customBranding: true,
    prioritySupport: true,
  },
} as const;

// ===== AUTHORITATIVE 20-ROW FEATURE ACCESS MATRIX =====
export type FeatureAccessType =
  | 'Not available'
  | 'Available'
  | 'Limited quantity'
  | 'Unlimited'
  | 'Premium feature'
  | 'Enterprise feature';

export interface FeatureMatrixItem {
  value: string;
  accessType: FeatureAccessType;
}

export interface FeatureMatrixRow {
  id: string;
  feature: string;
  category: 'Core Resources & Postings' | 'Digital Identity & Branding' | 'Marketing & Leads' | 'Enterprise & AI';
  basic: FeatureMatrixItem;
  standard: FeatureMatrixItem;
  premium: FeatureMatrixItem;
  enterprise: FeatureMatrixItem;
}

export const FEATURE_ACCESS_MATRIX_20_ROWS: FeatureMatrixRow[] = [
  // 1. Core Resources & Postings
  {
    id: 'jobs',
    feature: 'Active Job Postings',
    category: 'Core Resources & Postings',
    basic: { value: '5 Active Jobs', accessType: 'Limited quantity' },
    standard: { value: '10 Active Jobs', accessType: 'Limited quantity' },
    premium: { value: '50 Active Jobs', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited Active Postings', accessType: 'Unlimited' },
  },
  {
    id: 'jobAlerts',
    feature: 'Job Alerts',
    category: 'Core Resources & Postings',
    basic: { value: '5 Job Alerts', accessType: 'Limited quantity' },
    standard: { value: '10 Job Alerts', accessType: 'Limited quantity' },
    premium: { value: '50 Job Alerts', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited Job Alerts', accessType: 'Unlimited' },
  },
  {
    id: 'products',
    feature: 'Product Catalogue',
    category: 'Core Resources & Postings',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: '20 Products', accessType: 'Limited quantity' },
    premium: { value: '100 Products', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited Products', accessType: 'Unlimited' },
  },
  {
    id: 'services',
    feature: 'Service Listings',
    category: 'Core Resources & Postings',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: '10 Services', accessType: 'Limited quantity' },
    premium: { value: '50 Services', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited Services', accessType: 'Unlimited' },
  },
  {
    id: 'galleryImages',
    feature: 'Gallery Images',
    category: 'Core Resources & Postings',
    basic: { value: '6 Images', accessType: 'Limited quantity' },
    standard: { value: '10 Images', accessType: 'Limited quantity' },
    premium: { value: '50 Images', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited Images', accessType: 'Unlimited' },
  },
  {
    id: 'videos',
    feature: 'Gallery Videos',
    category: 'Core Resources & Postings',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: '2 Videos', accessType: 'Limited quantity' },
    premium: { value: '10 Videos', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited Videos', accessType: 'Unlimited' },
  },
  {
    id: 'templates',
    feature: 'Website Templates',
    category: 'Core Resources & Postings',
    basic: { value: '1 Template', accessType: 'Limited quantity' },
    standard: { value: '5 Templates', accessType: 'Limited quantity' },
    premium: { value: '15 Templates', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited (All 16)', accessType: 'Unlimited' },
  },
  {
    id: 'themes',
    feature: 'Color Themes',
    category: 'Core Resources & Postings',
    basic: { value: '1 Basic Theme', accessType: 'Limited quantity' },
    standard: { value: '5 Color Themes', accessType: 'Limited quantity' },
    premium: { value: '15 Color Themes', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited & Custom Palette', accessType: 'Unlimited' },
  },
  {
    id: 'branches',
    feature: 'Branch Locations',
    category: 'Core Resources & Postings',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: '3 Branches', accessType: 'Limited quantity' },
    premium: { value: '20 Branches', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited Branches', accessType: 'Unlimited' },
  },
  {
    id: 'staffIds',
    feature: 'Staff Digital IDs',
    category: 'Core Resources & Postings',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: 'Not Included', accessType: 'Not available' },
    premium: { value: '25 Staff IDs', accessType: 'Limited quantity' },
    enterprise: { value: 'Unlimited Staff IDs', accessType: 'Unlimited' },
  },

  // 2. Digital Identity & Branding
  {
    id: 'digitalIdCard',
    feature: 'Company Digital ID Card',
    category: 'Digital Identity & Branding',
    basic: { value: 'Standard Digital ID', accessType: 'Available' },
    standard: { value: 'Premium Visiting Card', accessType: 'Available' },
    premium: { value: 'Premium+ Visiting Card', accessType: 'Premium feature' },
    enterprise: { value: 'Enterprise Digital Card', accessType: 'Enterprise feature' },
  },
  {
    id: 'qrCode',
    feature: 'QR Code & Profile URL',
    category: 'Digital Identity & Branding',
    basic: { value: 'Public QR Code & Link', accessType: 'Available' },
    standard: { value: 'Static QR & Standee Ready', accessType: 'Available' },
    premium: { value: 'Dynamic QR Code Showcase', accessType: 'Premium feature' },
    enterprise: { value: 'Enterprise Dynamic QR', accessType: 'Enterprise feature' },
  },
  {
    id: 'seo',
    feature: 'SEO & Schema Markup',
    category: 'Digital Identity & Branding',
    basic: { value: 'Basic SEO & Schema', accessType: 'Available' },
    standard: { value: 'Enhanced SEO & Custom Meta', accessType: 'Available' },
    premium: { value: 'Custom Meta Tags & OpenGraph', accessType: 'Premium feature' },
    enterprise: { value: 'AI SEO Content & Meta Generation', accessType: 'Enterprise feature' },
  },

  // 3. Marketing & Leads
  {
    id: 'whatsappEnquiry',
    feature: 'WhatsApp Enquiry & Call',
    category: 'Marketing & Leads',
    basic: { value: 'Basic WhatsApp Enquiry', accessType: 'Available' },
    standard: { value: 'Direct Click-to-Chat & Call', accessType: 'Available' },
    premium: { value: 'Priority Lead Routing', accessType: 'Available' },
    enterprise: { value: 'Automated WhatsApp Dispatch', accessType: 'Available' },
  },
  {
    id: 'leadManagement',
    feature: 'Lead Management & Enquiries',
    category: 'Marketing & Leads',
    basic: { value: 'Lead Management Dashboard', accessType: 'Available' },
    standard: { value: 'Leads & Interview Scheduling', accessType: 'Available' },
    premium: { value: 'Advanced Lead Tracking & Analytics', accessType: 'Available' },
    enterprise: { value: 'Full CRM & Careers Portal Leads', accessType: 'Enterprise feature' },
  },
  {
    id: 'searchPriority',
    feature: 'Search Priority',
    category: 'Marketing & Leads',
    basic: { value: 'Standard Search Listing', accessType: 'Not available' },
    standard: { value: 'Silver Verified Search Ranking', accessType: 'Available' },
    premium: { value: 'Featured Search Priority', accessType: 'Premium feature' },
    enterprise: { value: 'Top Search Priority (#1)', accessType: 'Enterprise feature' },
  },

  // 4. Enterprise & AI
  {
    id: 'aiCompanyAssistant',
    feature: 'AI Company Assistant / Chatbot',
    category: 'Enterprise & AI',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: 'Not Included', accessType: 'Not available' },
    premium: { value: 'Not Included', accessType: 'Not available' },
    enterprise: { value: 'AI Company Assistant / Chatbot', accessType: 'Enterprise feature' },
  },
  {
    id: 'aiSeoContent',
    feature: 'AI SEO Content & Meta Tags',
    category: 'Enterprise & AI',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: 'Not Included', accessType: 'Not available' },
    premium: { value: 'Not Included', accessType: 'Not available' },
    enterprise: { value: 'AI Generated SEO Meta & Copy', accessType: 'Enterprise feature' },
  },
  {
    id: 'careersPortal',
    feature: 'Enterprise Careers Portal',
    category: 'Enterprise & AI',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: 'Not Included', accessType: 'Not available' },
    premium: { value: 'Not Included', accessType: 'Not available' },
    enterprise: { value: 'Dedicated Enterprise Careers Hub', accessType: 'Enterprise feature' },
  },
  {
    id: 'homepageFeaturedPlacement',
    feature: 'Homepage Featured Placement',
    category: 'Enterprise & AI',
    basic: { value: 'Not Included', accessType: 'Not available' },
    standard: { value: 'Not Included', accessType: 'Not available' },
    premium: { value: 'Not Included', accessType: 'Not available' },
    enterprise: { value: 'Homepage Featured Showcase', accessType: 'Enterprise feature' },
  },
];

// ===== JOB CATEGORIES =====
export const JOB_CATEGORIES = [
  'IT & Software',
  'Healthcare',
  'Education',
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Retail',
  'Finance',
  'Hospitality',
  'Transportation',
  'Textile',
  'Automobile',
  'Real Estate',
  'Media',
  'Government',
  'BPO',
  'Sales & Marketing',
  'Accounting',
  'Legal',
  'HR',
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];

// ===== SKILLS =====
export const SKILLS = [
  // Tech
  'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Node.js',
  'SQL', 'MongoDB', 'AWS', 'HTML/CSS', 'Flutter', 'Android', 'iOS',
  'Data Entry', 'MS Office', 'Tally', 'AutoCAD',
  // Professional
  'Communication', 'Leadership', 'Teamwork', 'Problem Solving',
  'Time Management', 'Customer Service', 'Sales', 'Negotiation',
  'Accounting', 'Marketing', 'Content Writing', 'Graphic Design',
  // Trades
  'Welding', 'Electrical', 'Plumbing', 'Carpentry', 'Driving',
  'Machine Operation', 'Quality Control', 'Packaging',
  // Tamil Nadu specific
  'Tamil Typing', 'English Typing', 'Tailoring', 'Embroidery',
  'Agriculture Management', 'Silk Weaving', 'Logistics',
] as const;

// ===== EXPERIENCE LEVELS =====
export const EXPERIENCE_LEVELS = [
  'Fresher',
  '1-2 Years',
  '3-5 Years',
  '5-10 Years',
  '10+ Years',
] as const;

export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];

// ===== SALARY RANGES (INR per month) =====
export const SALARY_RANGES = [
  { label: '₹5,000 – ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 – ₹15,000', min: 10000, max: 15000 },
  { label: '₹15,000 – ₹20,000', min: 15000, max: 20000 },
  { label: '₹20,000 – ₹30,000', min: 20000, max: 30000 },
  { label: '₹30,000 – ₹50,000', min: 30000, max: 50000 },
  { label: '₹50,000 – ₹75,000', min: 50000, max: 75000 },
  { label: '₹75,000 – ₹1,00,000', min: 75000, max: 100000 },
  { label: '₹1,00,000+', min: 100000, max: 999999 },
] as const;

// ===== APPLICATION STATUS CONFIG =====
export const APPLICATION_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  applied: {
    label: 'Applied',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: 'Send',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    icon: 'Star',
  },
  interview_scheduled: {
    label: 'Interview Scheduled',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: 'Calendar',
  },
  selected: {
    label: 'Selected',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    icon: 'CheckCircle',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: 'XCircle',
  },
};

// ===== LEAD STATUS CONFIG =====
export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  contacted: { label: 'Contacted', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  qualified: { label: 'Qualified', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  converted: { label: 'Converted', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  lost: { label: 'Lost', color: 'text-red-700 bg-red-50 border-red-200' },
};

// ===== NAVIGATION ITEMS =====

export interface NavItem {
  label: string;
  tamilLabel: string;
  icon: string;
  href: string;
}

/** Admin dashboard sidebar navigation */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/admin/dashboard' },
  { label: 'Users', tamilLabel: 'பயனர்கள்', icon: 'Users', href: '/admin/users' },
  { label: 'Companies', tamilLabel: 'நிறுவனங்கள்', icon: 'Building2', href: '/admin/companies' },
  { label: 'Jobs', tamilLabel: 'வேலைகள்', icon: 'Briefcase', href: '/admin/jobs' },
  { label: 'Applications', tamilLabel: 'விண்ணப்பங்கள்', icon: 'FileText', href: '/admin/applications' },
  { label: 'Leads', tamilLabel: 'லீட்கள்', icon: 'Target', href: '/admin/leads' },
  { label: 'Services', tamilLabel: 'சேவைகள்', icon: 'Wrench', href: '/admin/services' },
  { label: 'Subscriptions', tamilLabel: 'சந்தாக்கள்', icon: 'CreditCard', href: '/admin/subscriptions' },
  { label: 'Advertisements', tamilLabel: 'விளம்பரங்கள்', icon: 'Megaphone', href: '/admin/advertisements' },
  { label: 'Franchises', tamilLabel: 'பிராஞ்சைஸ்', icon: 'MapPin', href: '/admin/franchises' },
  { label: 'Ambassadors', tamilLabel: 'அம்பாசிடர்கள்', icon: 'Award', href: '/admin/ambassadors' },
  { label: 'Support Tickets', tamilLabel: 'ஆதரவு டிக்கெட்', icon: 'LifeBuoy', href: '/admin/support' },
  { label: 'Analytics', tamilLabel: 'பகுப்பாய்வு', icon: 'BarChart3', href: '/admin/analytics' },
  { label: 'Activity Log', tamilLabel: 'செயல்பாடு பதிவு', icon: 'ScrollText', href: '/admin/activity' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/admin/settings' },
];

/** Employer dashboard sidebar navigation */
export const EMPLOYER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/employer/dashboard' },
  { label: 'Post Job', tamilLabel: 'வேலை பதிவிடு', icon: 'PlusCircle', href: '/employer/post-job' },
  { label: 'My Jobs', tamilLabel: 'எனது வேலைகள்', icon: 'Briefcase', href: '/employer/jobs' },
  { label: 'Applications', tamilLabel: 'விண்ணப்பங்கள்', icon: 'FileText', href: '/employer/applications' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: 'Video', href: '/employer/interviews' },
  { label: 'Candidates', tamilLabel: 'விண்ணப்பதாரர்கள்', icon: 'Users', href: '/employer/candidates' },
  { label: 'Company Profile', tamilLabel: 'நிறுவன விவரம்', icon: 'Building2', href: '/employer/company' },
  { label: 'Leads', tamilLabel: 'லீட்கள்', icon: 'Target', href: '/employer/leads' },
  { label: 'Messages', tamilLabel: 'செய்திகள்', icon: 'MessageSquare', href: '/employer/messages' },
  { label: 'Subscription', tamilLabel: 'சந்தா', icon: 'CreditCard', href: '/employer/subscription' },
  { label: 'Analytics', tamilLabel: 'பகுப்பாய்வு', icon: 'BarChart3', href: '/employer/analytics' },
  { label: 'My Website', tamilLabel: 'எனது இணையதளம்', icon: 'Globe', href: '/employer/website' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/employer/settings' },
];

/** Job seeker dashboard sidebar navigation */
export const SEEKER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்ட்', icon: 'LayoutDashboard', href: '/seeker/dashboard' },
  { label: 'My Profile', tamilLabel: 'எனது சுயவிவரம்', icon: 'UserCircle', href: '/seeker/profile' },
  { label: 'Search Jobs', tamilLabel: 'வேலை தேடு', icon: 'Search', href: '/jobs' },
  { label: 'My Applications', tamilLabel: 'எனது விண்ணப்பங்கள்', icon: 'FileText', href: '/seeker/applications' },
  { label: 'Saved Jobs', tamilLabel: 'சேமித்த வேலைகள்', icon: 'Bookmark', href: '/seeker/saved' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: 'Video', href: '/seeker/interviews' },
  { label: 'Messages', tamilLabel: 'செய்திகள்', icon: 'MessageSquare', href: '/seeker/messages' },
  { label: 'Notifications', tamilLabel: 'அறிவிப்புகள்', icon: 'Bell', href: '/seeker/notifications' },
  { label: 'My Portfolio', tamilLabel: 'எனது போர்ட்ஃபோலியோ', icon: 'Globe', href: '/seeker/website' },
  { label: 'Subscription', tamilLabel: 'சந்தா', icon: 'CreditCard', href: '/seeker/subscription' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/seeker/settings' },
];

// ===== PORTFOLIO TEMPLATES (15) =====

import type { PortfolioTemplate, SectionType, PlanTier } from '@/lib/types/portfolio';

export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  // ── FREE (3) ────────────────────────────────────────
  {
    id: 'classic-business', name: 'Classic Business', plan: 'free',
    description: 'Clean, professional layout for local businesses. Logo, about, services, contact, and gallery.',
    bestFor: 'Local Business', thumbnail: '/templates/classic-business.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'gallery', 'contact', 'location-map', 'social-links'],
    features: ['Basic hero', 'About section', 'Services list', 'Contact info', 'Gallery (6 images)', 'WhatsApp & Call', 'Google Maps'],
  },
  {
    id: 'clean-corporate', name: 'Clean Corporate', plan: 'free',
    description: 'Minimal corporate layout with hero section and social links. Mobile responsive.',
    bestFor: 'Companies', thumbnail: '/templates/clean-corporate.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'contact', 'social-links'],
    features: ['Hero section', 'Company about', 'Services', 'Contact details', 'Social links', 'Mobile responsive'],
  },
  {
    id: 'modern-services', name: 'Modern Services', plan: 'free',
    description: 'Service-focused template with service cards, images, and enquiry buttons.',
    bestFor: 'Service Business', thumbnail: '/templates/modern-services.jpg',
    category: 'service',
    sections: ['hero', 'about', 'services', 'gallery', 'contact', 'social-links'],
    features: ['Service cards', 'Service images', 'WhatsApp enquiry', 'Call button', 'Company profile', 'Contact section'],
  },

  // ── STANDARD (3) ────────────────────────────────────
  {
    id: 'professional-company', name: 'Professional Company', plan: 'standard',
    description: 'Professional hero, products, testimonials, Google Maps, and custom colours.',
    bestFor: 'SMEs', thumbnail: '/templates/professional-company.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'products', 'gallery', 'testimonials', 'contact', 'location-map', 'social-links'],
    features: ['Professional hero', 'Products & Services', 'Gallery', 'Testimonials', 'Google Maps', 'Custom colours', 'Better SEO'],
  },
  {
    id: 'business-showcase', name: 'Business Showcase', plan: 'standard',
    description: 'Product and service focused with featured items, categories, and reviews.',
    bestFor: 'Products + Services', thumbnail: '/templates/business-showcase.jpg',
    category: 'product',
    sections: ['hero', 'about', 'products', 'services', 'gallery', 'testimonials', 'contact', 'social-links'],
    features: ['Featured products', 'Product categories', 'Service cards', 'Reviews', 'Gallery', 'WhatsApp order'],
  },
  {
    id: 'local-business-pro', name: 'Local Business Pro', plan: 'standard',
    description: 'Optimized for local market visibility with working hours, directions, and local SEO.',
    bestFor: 'Local/District Businesses', thumbnail: '/templates/local-business-pro.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'products', 'working-hours', 'gallery', 'testimonials', 'location-map', 'contact', 'social-links'],
    features: ['Business info', 'Working hours', 'Google Maps + Directions', 'Products & Services', 'Customer reviews', 'Local SEO'],
  },

  // ── PREMIUM (5) ─────────────────────────────────────
  {
    id: 'corporate-premium', name: 'Corporate Premium', plan: 'premium',
    description: 'Advanced corporate website with team, projects, careers, and animations.',
    bestFor: 'Established Companies', thumbnail: '/templates/corporate-premium.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'products', 'team', 'testimonials', 'projects', 'gallery', 'careers', 'contact', 'social-links'],
    features: ['Advanced hero', 'Team section', 'Projects showcase', 'Careers page', 'Advanced SEO', 'Custom sections', 'Animations'],
  },
  {
    id: 'product-marketplace', name: 'Product Marketplace', plan: 'premium',
    description: 'Full product catalogue with search, categories, and WhatsApp ordering.',
    bestFor: 'Product Sellers', thumbnail: '/templates/product-marketplace.jpg',
    category: 'product',
    sections: ['hero', 'about', 'products', 'gallery', 'testimonials', 'faq', 'contact', 'social-links'],
    features: ['Product catalogue', 'Categories & search', 'Product details', 'WhatsApp order', 'Related products', 'Company profile'],
  },
  {
    id: 'service-marketplace', name: 'Service Marketplace', plan: 'premium',
    description: 'Service catalogue with pricing, enquiry forms, and testimonials.',
    bestFor: 'Service Providers', thumbnail: '/templates/service-marketplace.jpg',
    category: 'service',
    sections: ['hero', 'about', 'services', 'testimonials', 'faq', 'gallery', 'contact', 'social-links'],
    features: ['Service catalogue', 'Categories', 'Service pricing', 'Enquiry forms', 'Testimonials', 'Related services'],
  },
  {
    id: 'executive-company', name: 'Executive Company', plan: 'premium',
    description: 'Professional firm website with leadership, achievements, and client showcase.',
    bestFor: 'Professional Firms', thumbnail: '/templates/executive-company.jpg',
    category: 'business',
    sections: ['hero', 'about', 'leadership', 'team', 'services', 'projects', 'achievements', 'testimonials', 'clients', 'careers', 'contact'],
    features: ['Executive hero', 'Leadership section', 'Achievements', 'Client showcase', 'Projects', 'Careers', 'Advanced SEO'],
  },
  {
    id: 'creative-business', name: 'Creative Business', plan: 'premium',
    description: 'Modern visual design with portfolio grid, case studies, and dynamic animations.',
    bestFor: 'Creative/Digital Companies', thumbnail: '/templates/creative-business.jpg',
    category: 'creative',
    sections: ['hero', 'about', 'portfolio-grid', 'services', 'case-studies', 'gallery', 'team', 'testimonials', 'video', 'contact', 'social-links'],
    features: ['Modern visual hero', 'Portfolio grid', 'Case studies', 'Video section', 'Dynamic animations', 'Custom branding'],
  },
  {
    id: 'modern-business', name: 'Modern Business', plan: 'premium',
    description: 'Split hero with quick-stats, bento-grid services, and a working-hours schedule for a contemporary, SaaS-style feel.',
    bestFor: 'Modern/Growing Companies', thumbnail: '/templates/modern-business.jpg',
    category: 'business',
    sections: ['hero', 'about', 'services', 'products', 'team', 'testimonials', 'working-hours', 'gallery', 'contact'],
    features: ['Split hero + quick stats', 'Bento-grid services', 'Team avatars', 'Working hours schedule', 'Sticky mobile CTA'],
  },

  // ── ENTERPRISE (4) ──────────────────────────────────
  {
    id: 'enterprise-corporate', name: 'Enterprise Corporate', plan: 'enterprise',
    description: 'Full-featured corporate website with news updates and every major content section.',
    bestFor: 'Large Companies', thumbnail: '/templates/enterprise-corporate.jpg',
    category: 'enterprise',
    sections: ['hero', 'about', 'services', 'products', 'projects', 'team', 'leadership', 'careers', 'testimonials', 'clients', 'gallery', 'news', 'contact'],
    features: ['All premium features', 'News/Updates'],
  },
  {
    id: 'luxury-brand', name: 'Luxury Brand', plan: 'enterprise',
    description: 'Premium full-screen design with luxury animations and brand-first experience.',
    bestFor: 'Premium Brands', thumbnail: '/templates/luxury-brand.jpg',
    category: 'enterprise',
    sections: ['hero', 'about', 'products', 'gallery', 'testimonials', 'team', 'achievements', 'timeline', 'contact'],
    features: ['Full-screen hero', 'Premium animations', 'Brand story', 'Collections', 'Custom typography', 'Advanced colour system'],
  },
  {
    id: 'business-careers', name: 'Business + Careers', plan: 'enterprise',
    description: 'Corporate website with integrated careers portal, job listings, and company culture.',
    bestFor: 'Companies Hiring', thumbnail: '/templates/business-careers.jpg',
    category: 'career',
    sections: ['hero', 'about', 'services', 'products', 'careers', 'team', 'testimonials', 'gallery', 'contact'],
    features: ['Company profile', 'Job listings', 'Careers page', 'Company culture', 'Apply button', 'Benefits section'],
  },
  {
    id: 'ultimate-business-pro', name: 'Ultimate Business Pro', plan: 'enterprise',
    description: 'The ultimate business website with every section, AI assistance, and full customization.',
    bestFor: 'Full-featured Company', thumbnail: '/templates/ultimate-business-pro.jpg',
    category: 'enterprise',
    sections: ['hero', 'about', 'services', 'products', 'portfolio-grid', 'projects', 'team', 'leadership', 'ceo-message', 'careers', 'testimonials', 'clients', 'achievements', 'timeline', 'awards', 'gallery', 'video', 'news', 'faq', 'branches', 'contact', 'social-links'],
    features: ['All sections', 'AI content assistance', 'Advanced customization', 'Custom sections', 'Premium animations', 'Advanced branding'],
  },
];

// ===== PORTFOLIO SECTION DEFINITIONS =====

export interface PortfolioSectionDef {
  type: SectionType;
  label: string;
  tamilLabel: string;
  icon: string;
  description: string;
  requiredPlan: PlanTier;
}

export const PORTFOLIO_SECTION_DEFS: PortfolioSectionDef[] = [
  { type: 'hero', label: 'Hero Banner', tamilLabel: 'ஹீரோ பேனர்', icon: 'Image', description: 'Full-width banner with headline', requiredPlan: 'free' },
  { type: 'about', label: 'About', tamilLabel: 'எங்களைப் பற்றி', icon: 'Info', description: 'Company/person about section', requiredPlan: 'free' },
  { type: 'services', label: 'Services', tamilLabel: 'சேவைகள்', icon: 'Briefcase', description: 'Service cards with details', requiredPlan: 'free' },
  { type: 'contact', label: 'Contact', tamilLabel: 'தொடர்புகொள்ள', icon: 'Phone', description: 'Contact info, form, map', requiredPlan: 'free' },
  { type: 'gallery', label: 'Gallery', tamilLabel: 'கேலரி', icon: 'ImageIcon', description: 'Photo gallery', requiredPlan: 'free' },
  { type: 'social-links', label: 'Social Links', tamilLabel: 'சமூக இணைப்புகள்', icon: 'Share2', description: 'Social media links', requiredPlan: 'free' },
  { type: 'location-map', label: 'Location Map', tamilLabel: 'இருப்பிட வரைபடம்', icon: 'MapPin', description: 'Google Maps embed', requiredPlan: 'free' },
  { type: 'products', label: 'Products', tamilLabel: 'பொருட்கள்', icon: 'Package', description: 'Product catalogue cards', requiredPlan: 'standard' },
  { type: 'testimonials', label: 'Testimonials', tamilLabel: 'சான்றுகள்', icon: 'Quote', description: 'Customer reviews', requiredPlan: 'standard' },
  { type: 'working-hours', label: 'Working Hours', tamilLabel: 'வேலை நேரம்', icon: 'Clock', description: 'Business hours schedule', requiredPlan: 'standard' },
  { type: 'faq', label: 'FAQ', tamilLabel: 'கேள்விகள்', icon: 'HelpCircle', description: 'Frequently asked questions', requiredPlan: 'standard' },
  { type: 'team', label: 'Team', tamilLabel: 'குழு', icon: 'Users', description: 'Team member showcase', requiredPlan: 'premium' },
  { type: 'projects', label: 'Projects', tamilLabel: 'திட்டங்கள்', icon: 'FolderOpen', description: 'Project portfolio', requiredPlan: 'premium' },
  { type: 'careers', label: 'Careers', tamilLabel: 'வேலை வாய்ப்புகள்', icon: 'Briefcase', description: 'Job openings', requiredPlan: 'premium' },
  { type: 'achievements', label: 'Achievements', tamilLabel: 'சாதனைகள்', icon: 'Award', description: 'Stats & achievements', requiredPlan: 'premium' },
  { type: 'clients', label: 'Clients', tamilLabel: 'வாடிக்கையாளர்கள்', icon: 'Building2', description: 'Client logo showcase', requiredPlan: 'premium' },
  { type: 'video', label: 'Video', tamilLabel: 'வீடியோ', icon: 'Video', description: 'Video embed section', requiredPlan: 'premium' },
  { type: 'portfolio-grid', label: 'Portfolio Grid', tamilLabel: 'படைப்புகள்', icon: 'Grid', description: 'Visual portfolio grid', requiredPlan: 'premium' },
  { type: 'case-studies', label: 'Case Studies', tamilLabel: 'வழக்கு ஆய்வுகள்', icon: 'FileSearch', description: 'Detailed case studies', requiredPlan: 'premium' },
  { type: 'leadership', label: 'Leadership', tamilLabel: 'தலைமை', icon: 'Crown', description: 'Leadership profiles', requiredPlan: 'enterprise' },
  { type: 'ceo-message', label: 'CEO Message', tamilLabel: 'CEO செய்தி', icon: 'MessageCircle', description: 'CEO/founder message', requiredPlan: 'enterprise' },
  { type: 'timeline', label: 'Timeline', tamilLabel: 'காலவரிசை', icon: 'Clock', description: 'Company history timeline', requiredPlan: 'enterprise' },
  { type: 'news', label: 'News & Updates', tamilLabel: 'செய்திகள்', icon: 'Newspaper', description: 'Company news', requiredPlan: 'enterprise' },
  { type: 'awards', label: 'Awards', tamilLabel: 'விருதுகள்', icon: 'Trophy', description: 'Awards & certifications', requiredPlan: 'enterprise' },
  { type: 'branches', label: 'Branches', tamilLabel: 'கிளைகள்', icon: 'Building', description: 'Branch locations', requiredPlan: 'enterprise' },
  { type: 'custom', label: 'Custom Section', tamilLabel: 'தனிப்பயன்', icon: 'Plus', description: 'Free-form custom section', requiredPlan: 'enterprise' },
];

// ===== TEMPLATE-PLAN ACCESS =====

export const TEMPLATE_PLAN_ACCESS: Record<PlanTier, string[]> = {
  free: ['classic-business'],
  basic: ['classic-business'],
  standard: ['classic-business', 'clean-corporate', 'modern-services', 'professional-company', 'business-showcase', 'local-business-pro'],
  premium: ['classic-business', 'clean-corporate', 'modern-services', 'professional-company', 'business-showcase', 'local-business-pro', 'corporate-premium', 'product-marketplace', 'service-marketplace', 'executive-company', 'creative-business', 'modern-business'],
  enterprise: PORTFOLIO_TEMPLATES.map(t => t.id), // all templates
};

