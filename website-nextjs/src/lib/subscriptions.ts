import type { SubscriptionPlan, SubscriptionPlanSlug } from '@/lib/types';

export type VisibleSubscriptionPlanSlug = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'pending_renewal' | 'cancelled';
export type SubscriptionFeature =
  | 'basic_profile'
  | 'job_applications'
  | 'job_alerts'
  | 'resume_upload'
  | 'advanced_filters'
  | 'job_posting'
  | 'basic_analytics'
  | 'advanced_candidate_search'
  | 'direct_candidate_contact'
  | 'featured_listing'
  | 'premium_badge'
  | 'lead_dashboard'
  | 'ai_coach'
  | 'product_ecommerce'
  | 'service_marketplace'
  | 'custom_branding'
  | 'advanced_seo'
  | 'marketing_tools';

export interface YearlySubscriptionPlan extends Omit<SubscriptionPlan, 'period' | 'slug'> {
  slug: VisibleSubscriptionPlanSlug;
  period: 'year';
  displayPrice: string;
  durationLabel: string;
  statusLabel: string;
  featureKeys: SubscriptionFeature[];
  maxActiveJobs: number;
  maxJobAlerts: number;
}

export const PLAN_DURATION_DAYS = 365;
export const RENEWAL_REMINDER_DAYS = [30, 7, 1] as const;

export const YEARLY_SUBSCRIPTION_PLANS: YearlySubscriptionPlan[] = [
  {
    id: 'plan_free_yearly',
    name: 'Free Plan',
    slug: 'free',
    price: 0,
    displayPrice: '₹0',
    period: 'year',
    durationLabel: '1 year',
    statusLabel: 'Free yearly access',
    features: [
      'Create basic profile',
      'View jobs and business listings',
      'Apply to standard jobs',
      'Post 1 active job at a time',
      'Each job stays active for 30 days',
      '2 active job alerts',
      'Basic company profile submission',
    ],
    featureKeys: ['basic_profile', 'job_applications', 'job_alerts', 'job_posting'],
    notIncluded: [
      'Product listings',
      'Service catalog',
      'Custom branding/presets',
      'Advanced SEO meta settings',
      'Pixel & Google Analytics',
      'Featured placement',
      'Direct candidate contact',
      'Lead dashboard',
      'Premium badge',
    ],
    recommended: false,
    bestFor: 'New users getting started',
    icon: 'Shield',
    maxActiveJobs: 1,
    maxJobAlerts: 2,
  },
  {
    id: 'plan_basic_yearly',
    name: 'Standard Plan',
    slug: 'basic',
    price: 480,
    displayPrice: '₹480',
    period: 'year',
    durationLabel: '1 year',
    statusLabel: 'Yearly standard access',
    features: [
      'Everything in Free',
      'Up to 10 active job postings',
      '30-day validity for each job',
      'Resume upload and sharing',
      'Advanced job filters',
      '10 active job alerts',
      'Basic analytics',
      'E-Commerce (up to 20 products)',
      'Service Marketplace (up to 10 services)',
      'Customizable Design Themes (Standard)',
      'Custom SEO meta tags (title & description)',
    ],
    featureKeys: [
      'basic_profile',
      'job_applications',
      'job_alerts',
      'resume_upload',
      'advanced_filters',
      'job_posting',
      'basic_analytics',
      'product_ecommerce',
      'service_marketplace',
      'custom_branding',
      'advanced_seo',
    ],
    notIncluded: [
      'Advanced CRM & Lead dashboard',
      'Mock interviews & AI career tools',
      'Pixel & Google Analytics integrations',
      'Featured placement',
      'Direct candidate contact',
      'Premium badge',
    ],
    recommended: false,
    bestFor: 'Active users and small businesses',
    icon: 'Zap',
    maxActiveJobs: 10,
    maxJobAlerts: 10,
  },
  {
    id: 'plan_premium_yearly',
    name: 'Premium Plan',
    slug: 'premium',
    price: 1200,
    displayPrice: '₹1,200',
    period: 'year',
    durationLabel: '1 year',
    statusLabel: 'Yearly premium access',
    features: [
      'Everything in Standard',
      'Up to 50 active job postings',
      'Premium badge & Featured listings',
      'Higher visibility in job & business search',
      'Direct candidate contact',
      'Advanced CRM & Lead management dashboard',
      'Mock interviews & AI career tools',
      'Pixel & Google Analytics integrations',
      'Unlimited E-Commerce (up to 100 products)',
      'Unlimited Service Marketplace (up to 50 services)',
      'Full Design Presets (including Amber/Gold themes)',
      'Custom Call-to-Action (CTA) link',
      'Dedicated Priority support',
    ],
    featureKeys: [
      'basic_profile',
      'job_applications',
      'job_alerts',
      'resume_upload',
      'advanced_filters',
      'job_posting',
      'basic_analytics',
      'advanced_candidate_search',
      'direct_candidate_contact',
      'featured_listing',
      'premium_badge',
      'lead_dashboard',
      'ai_coach',
      'product_ecommerce',
      'service_marketplace',
      'custom_branding',
      'advanced_seo',
      'marketing_tools',
    ],
    notIncluded: [],
    recommended: true,
    bestFor: 'Recruiters, business owners, and power users',
    icon: 'Crown',
    maxActiveJobs: 50,
    maxJobAlerts: 50,
  },
  {
    id: 'plan_enterprise_yearly',
    name: 'Enterprise Plan',
    slug: 'enterprise',
    price: 5000,
    displayPrice: '₹5,000',
    period: 'year',
    durationLabel: '1 year',
    statusLabel: 'Yearly enterprise access',
    features: [
      'Everything in Premium',
      'Unlimited active job postings',
      'Enterprise Analytics & Reports',
      'Unlimited Product Catalog',
      'Unlimited Service Listings',
      'Dedicated Priority Support',
      'Featured + Promoted Listing',
      'Maximum SEO Boost',
      'API Access',
    ],
    featureKeys: [
      'basic_profile',
      'job_applications',
      'job_alerts',
      'resume_upload',
      'advanced_filters',
      'job_posting',
      'basic_analytics',
      'advanced_candidate_search',
      'direct_candidate_contact',
      'featured_listing',
      'premium_badge',
      'lead_dashboard',
      'ai_coach',
      'product_ecommerce',
      'service_marketplace',
      'custom_branding',
      'advanced_seo',
      'marketing_tools',
    ],
    notIncluded: [],
    recommended: false,
    bestFor: 'Large organizations and recruiters',
    icon: 'Building2',
    maxActiveJobs: 99999,
    maxJobAlerts: 99999,
  },
];

export const YEARLY_PLAN_BY_SLUG = YEARLY_SUBSCRIPTION_PLANS.reduce(
  (acc, plan) => {
    acc[plan.slug] = plan;
    return acc;
  },
  {} as Record<VisibleSubscriptionPlanSlug, YearlySubscriptionPlan>,
);

const PLAN_RANK: Record<VisibleSubscriptionPlanSlug, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
};

export function normalizePlanSlug(value?: string | null): VisibleSubscriptionPlanSlug {
  const normalized = String(value || 'free')
    .toLowerCase()
    .replace(/\s+plan$/, '')
    .replace(/^seeker_/, '')
    .trim();

  if (normalized === 'basic') return 'basic';
  if (normalized === 'premium') return 'premium';
  if (normalized === 'enterprise') return 'enterprise';
  return 'free';
}

export function isVisiblePlanSlug(value: SubscriptionPlanSlug): value is VisibleSubscriptionPlanSlug {
  return value === 'free' || value === 'basic' || value === 'premium' || value === 'enterprise';
}

export function getPlanRank(plan: string | null | undefined) {
  return PLAN_RANK[normalizePlanSlug(plan)];
}

export function addOneYear(date = new Date()) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function getYearlySubscriptionEndDate(startDate = new Date()) {
  return addOneYear(startDate);
}

export function getRenewalEndDate(currentEndDate?: unknown, now = new Date()) {
  const current = toDate(currentEndDate);
  const base = current && current.getTime() > now.getTime() ? current : now;
  return addOneYear(base);
}

export function toDate(value?: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') return maybeTimestamp.toDate();
    if (typeof maybeTimestamp.seconds === 'number') {
      return new Date(maybeTimestamp.seconds * 1000);
    }
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getDaysUntilExpiry(endDate?: unknown, now = new Date()) {
  const expiry = toDate(endDate);
  if (!expiry) return null;
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type SubscriptionStatusFields = {
  status?: string | null;
  endDate?: unknown;
};

export function getEffectiveSubscriptionStatus(
  subscription?: SubscriptionStatusFields | null,
  now = new Date(),
): SubscriptionStatus {
  if (!subscription) return 'expired';
  if (subscription.status === 'cancelled') return 'cancelled';

  const days = getDaysUntilExpiry(subscription.endDate, now);
  if (days !== null && days < 0) return 'expired';
  if (days !== null && days <= 30) return 'pending_renewal';
  return 'active';
}

export function hasActiveBenefits(subscription?: SubscriptionStatusFields | null) {
  const status = getEffectiveSubscriptionStatus(subscription);
  return status === 'active' || status === 'pending_renewal';
}

export function selectBestSubscription<T extends { plan?: string; status?: string; endDate?: unknown }>(
  subscriptions: T[],
) {
  const active = subscriptions
    .filter((subscription) => hasActiveBenefits(subscription))
    .sort((a, b) => getPlanRank(b.plan) - getPlanRank(a.plan));

  return active[0] || null;
}

export function planHasFeature(plan: string | null | undefined, feature: SubscriptionFeature) {
  return YEARLY_PLAN_BY_SLUG[normalizePlanSlug(plan)].featureKeys.includes(feature);
}

export function getPlanLimit(plan: string | null | undefined, key: 'maxActiveJobs' | 'maxJobAlerts') {
  return YEARLY_PLAN_BY_SLUG[normalizePlanSlug(plan)][key];
}

export function formatPlanPeriod(plan: Pick<YearlySubscriptionPlan, 'displayPrice' | 'durationLabel'>) {
  return `${plan.displayPrice} / ${plan.durationLabel}`;
}
