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
  socialPostLimit: number; // posts per month
  prioritySupport: boolean;
  seoBoost: boolean;
  featuredListing: boolean;
  digitalCard: boolean;
  analyticsAccess: 'basic' | 'advanced' | 'premium';
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
      { label: 'Post up to 2 Jobs', included: true, limit: '2 active jobs' },
      { label: 'Basic Analytics', included: true },
      { label: 'Digital Business Card', included: true },
      { label: 'Customer Reviews', included: true },
      { label: 'Social Feed Posts', included: true, limit: '3 posts/month' },
      { label: 'Priority Support', included: false },
      { label: 'Featured Listing', included: false },
      { label: 'SEO Boost', included: false },
      { label: 'Product Catalog', included: false },
    ],
    jobLimit: 2,
    productLimit: 0,
    serviceLimit: 3,
    galleryLimit: 4,
    socialPostLimit: 3,
    prioritySupport: false,
    seoBoost: false,
    featuredListing: false,
    digitalCard: true,
    analyticsAccess: 'basic',
    badge: 'none',
  },
  {
    slug: 'basic',
    name: 'Basic',
    nameTA: 'அடிப்படை',
    tagline: 'Perfect for growing businesses',
    icon: '⚡',
    color: '#3b82f6',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
    pricing: { monthly: 499, quarterly: 1347, yearly: 4491 },
    features: [
      { label: 'Business Profile Page', included: true },
      { label: 'Post up to 10 Jobs', included: true, limit: '10 active jobs' },
      { label: 'Advanced Analytics', included: true },
      { label: 'Digital Business Card', included: true },
      { label: 'Customer Reviews', included: true },
      { label: 'Social Feed Posts', included: true, limit: '15 posts/month' },
      { label: 'Product Catalog', included: true, limit: '20 products' },
      { label: 'Service Listings', included: true, limit: '10 services' },
      { label: 'Priority Support', included: false },
      { label: 'Featured Listing', included: false },
      { label: 'SEO Boost', included: false },
    ],
    jobLimit: 10,
    productLimit: 20,
    serviceLimit: 10,
    galleryLimit: 12,
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
    pricing: { monthly: 999, quarterly: 2697, yearly: 8991 },
    features: [
      { label: 'Business Profile Page', included: true },
      { label: 'Post up to 50 Jobs', included: true, limit: '50 active jobs' },
      { label: 'Premium Analytics Dashboard', included: true },
      { label: 'Digital Business Card', included: true },
      { label: 'Customer Reviews', included: true },
      { label: 'Unlimited Social Feed Posts', included: true },
      { label: 'Product Catalog', included: true, limit: '100 products' },
      { label: 'Service Listings', included: true, limit: '50 services' },
      { label: 'Priority Support', included: true },
      { label: 'Featured Listing', included: true },
      { label: 'SEO Boost', included: true },
    ],
    jobLimit: 50,
    productLimit: 100,
    serviceLimit: 50,
    galleryLimit: 30,
    socialPostLimit: -1, // unlimited
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
    pricing: { monthly: 2499, quarterly: 6747, yearly: 22491 },
    features: [
      { label: 'Business Profile Page', included: true },
      { label: 'Unlimited Job Postings', included: true },
      { label: 'Enterprise Analytics & Reports', included: true },
      { label: 'Digital Business Card', included: true },
      { label: 'Customer Reviews', included: true },
      { label: 'Unlimited Social Feed Posts', included: true },
      { label: 'Unlimited Product Catalog', included: true },
      { label: 'Unlimited Service Listings', included: true },
      { label: 'Dedicated Priority Support', included: true },
      { label: 'Featured + Promoted Listing', included: true },
      { label: 'Maximum SEO Boost', included: true },
      { label: 'API Access', included: true },
    ],
    jobLimit: -1, // unlimited
    productLimit: -1,
    serviceLimit: -1,
    galleryLimit: -1,
    socialPostLimit: -1,
    prioritySupport: true,
    seoBoost: true,
    featuredListing: true,
    digitalCard: true,
    analyticsAccess: 'premium',
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
