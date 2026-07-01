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
      '2 Job Alerts',
      'Product Catalogue (up to 3 products)',
      'Service Showcase (up to 3 services)',
      '6 Gallery Images',
      '1 Website Template & 2 Color Themes',
      'Company Logo upload',
      'Basic SEO & Schema Markup',
      'QR Code Share & Profile URL',
      'Basic WhatsApp Enquiry',
      'Google Maps & Contact Form',
      'Customer Reviews',
      'Business Hours display',
      'Basic Digital Visiting Card',
      'Basic Verification Badge',
      'Basic Careers Page',
      'Basic Analytics Dashboard',
      'XML Sitemap',
      'Community Support',
    ],
    featureKeys: ['basic_profile', 'job_applications', 'job_alerts', 'job_posting', 'product_ecommerce', 'service_marketplace'],
    notIncluded: [
      'Videos & Photo Albums',
      'Click-to-Call & FAQ Section',
      'Custom Cover Banner',
      'Team Members & Branch Locations',
      'Business Brochure PDF & Company Profile PDF',
      'Staff ID Cards',
      'Awards, Certifications & Clients Showcase',
      'Blog Section & Business Announcements',
      'Appointment Booking & Live Chat',
      'Google Analytics & Meta Pixel',
      'Leads Dashboard & CRM',
      'Advanced SEO & Custom Meta Tags',
      'Custom Domain & Brand Colors',
      'AI Business Assistant',
      'Multi-Admin Access',
    ],
    recommended: false,
    bestFor: 'New users and startups',
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
      '10 Job Alerts',
      'Product Catalogue (up to 20 products)',
      'Service listings (up to 10 services)',
      '10 Gallery Images & 2 Videos',
      '5 Website Templates & 5 Color Themes',
      'Custom Cover Banner',
      'Premium Digital Visiting Card',
      '5 Team Members & 3 Branch Locations',
      'Click-to-Call & FAQ Section',
      'Photo Albums & Review Photos',
      'Business Brochure PDF download',
      'Enhanced SEO & Custom Meta Tags',
      'Profile, Job & Business View Counters',
      'Business Announcements & Seasonal Offers',
      'Featured & Related Products',
      'Advanced WhatsApp Enquiry',
      'Silver Verified Badge',
      'Standard Analytics Dashboard',
      'Email Support',
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
      'Awards & Certifications showcase',
      'Clients Showcase',
      'Google Analytics & Meta Pixel',
      'Leads Dashboard & CRM tools',
      'Blog Section & Appointment Booking',
      'Live Chat Widget',
      'Staff ID Cards',
      'Company Profile PDF',
      'Dynamic QR Code',
      'Custom Domain & Brand Colors',
      'AI Business Assistant',
      'Multi-Admin Access',
      'Gold/Platinum badges',
    ],
    recommended: false,
    bestFor: 'Local shops and growing businesses',
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
      '50 Job Alerts',
      '15 Premium Templates & 15 Themes',
      'Product Catalogue (up to 100 products)',
      'Service listings (up to 50 services)',
      '50 Gallery Images & 10 Videos',
      'Video Banner & Photo Albums',
      'Premium+ Digital Card & 25 Staff IDs',
      '20 Team Members & 20 Branch Locations',
      'Awards, Certifications & Clients Showcase',
      'Google Analytics & Meta Pixel integration',
      'Advanced Analytics & Leads Dashboard',
      'Blog Section & Business Announcements',
      'Appointment Booking & Live Chat Widget',
      'Company Profile PDF download',
      'Dynamic QR Code',
      'Smart Auto WhatsApp Message',
      'Advanced SEO & Complete Schema Markup',
      'Advanced Careers Page',
      'Gold Verified Badge & Featured Search Priority',
      'Priority Email Support',
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
    notIncluded: [
      'Custom Domain mapping',
      'Custom Brand Colors & Fonts',
      'AI SEO Content & AI Generated Meta Tags',
      'AI Company Assistant chatbot',
      'CRM Dashboard & Multi-Admin Access',
      'CEO/Founder Message & Interactive Timeline',
      'Partner Logo Showcase',
      'Platinum Corporate Badge',
      'Unlimited resources',
    ],
    recommended: true,
    bestFor: 'Established brands and companies hiring actively',
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
      'Unlimited active job postings & alerts',
      'Unlimited Products & Services',
      'Unlimited Gallery, Videos & Albums',
      'Unlimited Templates & Themes',
      'Advanced Branding & Custom Colors/Fonts',
      'Enterprise Digital Card & Unlimited Staff IDs',
      'Unlimited Team Members & Branch Locations',
      'Custom Domain Support',
      'AI Company Assistant (chatbot widget)',
      'AI SEO Content & AI Generated Meta Tags',
      'CRM Dashboard & Multi-Admin Access',
      'Enterprise Careers Portal',
      'CEO Message Corner & Founder Video',
      'Interactive Company Journey Timeline',
      'Partner Logo Showcase',
      'Dynamic QR + Analytics',
      'Fully Customizable WhatsApp',
      'Custom Brand PDF & Brochure',
      'Live Analytics & Advanced Counters',
      'Platinum Corporate Badge & Homepage Featured Priority',
      '24×7 Priority Support',
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
    bestFor: 'Large corporations, groups and factories',
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

export function getCompanyActivePlan(company?: any): VisibleSubscriptionPlanSlug {
  if (!company) return 'free';
  const rawPlan = company.subscriptionPlan || (company.isPremium ? 'premium' : 'free');
  if (company.subscriptionEndsAt) {
    const endsAt = toDate(company.subscriptionEndsAt);
    if (endsAt && endsAt < new Date()) {
      return 'free';
    }
  }
  return normalizePlanSlug(rawPlan);
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
