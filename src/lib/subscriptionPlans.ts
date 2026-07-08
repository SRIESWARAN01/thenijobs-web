// ============================================================
// Subscription Plan Definitions for TheNiJobs Platform
// ============================================================

export type PlanSlug = 'free' | 'basic' | 'premium' | 'enterprise';
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface PlanFeature {
  label: string;
  included: boolean;
  limit?: string; // e.g. "5 jobs/month"
}

export interface SubscriptionPlan {
  slug: PlanSlug;
  name: string;
  nameTA: string; // Tamil name
  tagline: string;
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  pricing: Record<BillingCycle, number>; // INR
  features: PlanFeature[];
  jobLimit: number;       // max active jobs
  productLimit: number;   // max products in shop
  serviceLimit: number;   // max services listed
  galleryLimit: number;   // max gallery images
  videoLimit: number;     // max videos
  templateLimit: number;  // max website templates
  colorThemeLimit: number; // max color themes
  teamMemberLimit: number; // max team members on page
  branchLimit: number;    // max branch locations
  staffIdLimit: number;   // max staff ID cards
  socialPostLimit: number; // posts per month
  prioritySupport: boolean;
  seoBoost: boolean;
  featuredListing: boolean;
  digitalCard: boolean;
  analyticsAccess: 'basic' | 'advanced' | 'premium' | 'enterprise';
  badge: 'none' | 'basic' | 'premium' | 'enterprise';
}

export const BILLING_CYCLES: { value: BillingCycle; label: string; discount: string; savingsPercent: number }[] = [
  { value: 'monthly', label: 'Monthly', discount: '', savingsPercent: 0 },
  { value: 'quarterly', label: 'Quarterly', discount: 'Save 10%', savingsPercent: 10 },
  { value: 'yearly', label: 'Yearly', discount: 'Save 25%', savingsPercent: 25 },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    slug: 'free',
    name: 'Free',
    nameTA: 'இலவசம்',
    tagline: 'Get started with basic features',
    icon: '🌱',
    color: '#6b7280',
    gradientFrom: 'from-gray-500',
    gradientTo: 'to-gray-600',
    pricing: { monthly: 0, quarterly: 0, yearly: 0 },
    features: [
      { label: 'Business Profile Page', included: true },
      { label: 'Post 1 Active Job', included: true, limit: '1 active job' },
      { label: '2 Job Alerts', included: true, limit: '2 alerts' },
      { label: 'Product Catalogue (1)', included: true, limit: '1 product' },
      { label: 'Service Showcase (1)', included: true, limit: '1 service' },
      { label: '6 Gallery Images', included: true, limit: '6 images' },
      { label: 'Digital Business Card (Basic)', included: true },
      { label: 'Company Logo', included: true },
      { label: '1 Website Template & 2 Themes', included: true },
      { label: 'Basic SEO & Schema', included: true },
      { label: 'QR Code & Profile URL', included: true },
      { label: 'Basic WhatsApp Enquiry', included: true },
      { label: 'Google Maps & Contact Form', included: true },
      { label: 'Customer Reviews', included: true },
      { label: 'Basic Verification Badge', included: true },
      { label: 'Community Support', included: true },
      { label: 'Videos', included: false },
      { label: 'Click-to-Call', included: false },
      { label: 'FAQ Section', included: false },
      { label: 'Team Members', included: false },
    ],
    jobLimit: 1,
    productLimit: 1,
    serviceLimit: 1,
    galleryLimit: 6,
    videoLimit: 0,
    templateLimit: 1,
    colorThemeLimit: 2,
    teamMemberLimit: 0,
    branchLimit: 0,
    staffIdLimit: 0,
    socialPostLimit: 5,
    prioritySupport: false,
    seoBoost: false,
    featuredListing: false,
    digitalCard: true,
    analyticsAccess: 'basic',
    badge: 'none',
  },
  {
    slug: 'basic',
    name: 'Standard',
    nameTA: 'தரநிலை',
    tagline: 'Perfect for growing businesses',
    icon: '⚡',
    color: '#3b82f6',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
    pricing: { monthly: 49, quarterly: 135, yearly: 480 },
    features: [
      { label: 'Everything in Free', included: true },
      { label: '10 Active Job Postings', included: true, limit: '10 jobs' },
      { label: '10 Job Alerts', included: true, limit: '10 alerts' },
      { label: 'Product Catalog (20)', included: true, limit: '20 products' },
      { label: 'Service Listings (10)', included: true, limit: '10 services' },
      { label: '10 Gallery Images & 2 Videos', included: true, limit: '10 images / 2 videos' },
      { label: '5 Templates & 5 Themes', included: true },
      { label: 'Custom Cover Banner', included: true },
      { label: 'Premium Digital Card', included: true },
      { label: '5 Team Members & 3 Branches', included: true },
      { label: 'Click-to-Call & FAQ Section', included: true },
      { label: 'Photo Albums & Review Photos', included: true },
      { label: 'Business Brochure PDF', included: true },
      { label: 'Enhanced SEO & Custom Meta Tags', included: true },
      { label: 'Profile & Job View Counters', included: true },
      { label: 'Business Announcements & Offers', included: true },
      { label: 'Featured & Related Products', included: true },
      { label: 'Advanced WhatsApp Enquiry', included: true },
      { label: 'Silver Verified Badge', included: true },
      { label: 'Email Support', included: true },
    ],
    jobLimit: 10,
    productLimit: 20,
    serviceLimit: 10,
    galleryLimit: 10,
    videoLimit: 2,
    templateLimit: 5,
    colorThemeLimit: 5,
    teamMemberLimit: 5,
    branchLimit: 3,
    staffIdLimit: 0,
    socialPostLimit: 15,
    prioritySupport: false,
    seoBoost: false,
    featuredListing: false,
    digitalCard: true,
    analyticsAccess: 'advanced',
    badge: 'basic',
  },
  {
    slug: 'premium',
    name: 'Premium',
    nameTA: 'பிரீமியம்',
    tagline: 'Most popular for established businesses',
    icon: '👑',
    color: '#f59e0b',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    pricing: { monthly: 129, quarterly: 349, yearly: 1200 },
    features: [
      { label: 'Everything in Standard', included: true },
      { label: '50 Active Job Postings', included: true, limit: '50 jobs' },
      { label: '50 Job Alerts', included: true, limit: '50 alerts' },
      { label: 'Product Catalogue (100)', included: true, limit: '100 products' },
      { label: 'Service Listings (50)', included: true, limit: '50 services' },
      { label: '50 Gallery Images & 10 Videos', included: true, limit: '50 images / 10 videos' },
      { label: '15 Templates & 15 Themes', included: true },
      { label: 'Video Banner', included: true },
      { label: 'Premium+ Digital Card & 25 Staff IDs', included: true },
      { label: '20 Team Members & 20 Branches', included: true },
      { label: 'Awards & Certifications Showcase', included: true },
      { label: 'Clients Showcase', included: true },
      { label: 'Google Analytics & Meta Pixel', included: true },
      { label: 'Advanced Analytics & Leads Dashboard', included: true },
      { label: 'Blog Section', included: true },
      { label: 'Appointment Booking & Live Chat', included: true },
      { label: 'Company Profile PDF', included: true },
      { label: 'Dynamic QR Code', included: true },
      { label: 'Smart Auto WhatsApp Message', included: true },
      { label: 'Advanced SEO & Schema', included: true },
      { label: 'Gold Verified Badge', included: true },
      { label: 'Featured Search Priority', included: true },
      { label: 'Priority Email Support', included: true },
    ],
    jobLimit: 50,
    productLimit: 100,
    serviceLimit: 50,
    galleryLimit: 50,
    videoLimit: 10,
    templateLimit: 15,
    colorThemeLimit: 15,
    teamMemberLimit: 20,
    branchLimit: 20,
    staffIdLimit: 25,
    socialPostLimit: -1,
    prioritySupport: true,
    seoBoost: true,
    featuredListing: true,
    digitalCard: true,
    analyticsAccess: 'premium',
    badge: 'premium',
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    nameTA: 'நிறுவனம்',
    tagline: 'Unlimited power for large organizations',
    icon: '🏢',
    color: '#8b5cf6',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    pricing: { monthly: 499, quarterly: 1349, yearly: 5000 },
    features: [
      { label: 'Everything in Premium', included: true },
      { label: 'Unlimited Job Postings & Alerts', included: true },
      { label: 'Unlimited Products & Services', included: true },
      { label: 'Unlimited Gallery, Videos & Albums', included: true },
      { label: 'Unlimited Templates & Themes', included: true },
      { label: 'Advanced Branding & Custom Colors/Fonts', included: true },
      { label: 'Enterprise Digital Card & Unlimited Staff IDs', included: true },
      { label: 'Unlimited Team Members & Branches', included: true },
      { label: 'Custom Domain Support', included: true },
      { label: 'AI Company Assistant (Chatbot)', included: true },
      { label: 'AI SEO Content & AI Generated Meta Tags', included: true },
      { label: 'CRM Dashboard & Multi-Admin Access', included: true },
      { label: 'Enterprise Careers Portal', included: true },
      { label: 'Partner Logo Showcase', included: true },
      { label: 'CEO Message & Interactive Timeline', included: true },
      { label: 'Dynamic QR + Analytics', included: true },
      { label: 'Fully Customizable WhatsApp', included: true },
      { label: 'Custom Brand PDF & Brochure', included: true },
      { label: 'Live Analytics & Advanced Counters', included: true },
      { label: 'Platinum Corporate Badge', included: true },
      { label: 'Top Priority Search & Homepage Featured', included: true },
      { label: '24×7 Priority Support', included: true },
    ],
    jobLimit: -1,
    productLimit: -1,
    serviceLimit: -1,
    galleryLimit: -1,
    videoLimit: -1,
    templateLimit: -1,
    colorThemeLimit: -1,
    teamMemberLimit: -1,
    branchLimit: -1,
    staffIdLimit: -1,
    socialPostLimit: -1,
    prioritySupport: true,
    seoBoost: true,
    featuredListing: true,
    digitalCard: true,
    analyticsAccess: 'enterprise',
    badge: 'enterprise',
  },
];

/**
 * Get a plan by slug.
 */
export function getPlan(slug: PlanSlug): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.slug === slug);
}

/**
 * Get price for a specific plan and billing cycle.
 */
export function getPlanPrice(slug: PlanSlug, cycle: BillingCycle): number {
  const plan = getPlan(slug);
  return plan?.pricing[cycle] ?? 0;
}

/**
 * Format price in INR.
 */
export function formatINR(amount: number): string {
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Get monthly equivalent price for display.
 */
export function getMonthlyEquivalent(slug: PlanSlug, cycle: BillingCycle): number {
  const total = getPlanPrice(slug, cycle);
  if (total === 0) return 0;
  const months = cycle === 'monthly' ? 1 : cycle === 'quarterly' ? 3 : 12;
  return Math.round(total / months);
}

/**
 * Check if an upgrade from one plan to another is valid.
 */
export function canUpgrade(currentSlug: PlanSlug, targetSlug: PlanSlug): boolean {
  const order: PlanSlug[] = ['free', 'basic', 'premium', 'enterprise'];
  return order.indexOf(targetSlug) > order.indexOf(currentSlug);
}

/**
 * Check if a downgrade from one plan to another is valid.
 */
export function canDowngrade(currentSlug: PlanSlug, targetSlug: PlanSlug): boolean {
  const order: PlanSlug[] = ['free', 'basic', 'premium', 'enterprise'];
  return order.indexOf(targetSlug) < order.indexOf(currentSlug);
}
