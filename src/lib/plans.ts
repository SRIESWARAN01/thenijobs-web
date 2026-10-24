import {
  PLAN_FEATURE_MATRIX,
  SUBSCRIPTION_PLANS,
  PORTFOLIO_TEMPLATES,
  TEMPLATE_PLAN_ACCESS,
  PORTFOLIO_SECTION_DEFS,
  UNLIMITED_LIMIT,
  isUnlimited,
  isWithinLimit,
  getRemainingQuota,
  formatLimit,
  PLAN_LIMITS,
  type PlanLimits,
} from '@/lib/constants';
import type { SubscriptionPlanSlug, SubscriptionPlan } from '@/lib/types';
import type { PlanTier, PortfolioTemplate } from '@/lib/types/portfolio';

export {
  UNLIMITED_LIMIT,
  isUnlimited,
  isWithinLimit,
  getRemainingQuota,
  formatLimit,
  PLAN_LIMITS,
  type PlanLimits,
};

export type PlanMatrix = typeof PLAN_FEATURE_MATRIX;
export type FeatureGateKey = keyof typeof PLAN_FEATURE_MATRIX.free;

export const PLAN_HIERARCHY: PlanTier[] = ['free', 'basic', 'standard', 'premium', 'enterprise'];

/** Get full plan object by slug */
export function getPlan(slug: string | undefined): SubscriptionPlan {
  const normalizedSlug = (slug || 'free').toLowerCase() as SubscriptionPlanSlug;
  const found = SUBSCRIPTION_PLANS.find(p => p.slug === normalizedSlug);
  return found || SUBSCRIPTION_PLANS[0];
}

/** Check if a plan has permission for a specific boolean feature */
export function hasFeaturePermission(
  planSlug: string | undefined,
  feature: FeatureGateKey
): boolean {
  const slug = ((planSlug || 'free').toLowerCase()) as keyof PlanMatrix;
  const matrix = PLAN_FEATURE_MATRIX[slug] || PLAN_FEATURE_MATRIX.free;
  const value = matrix[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value !== 'none';
  if (typeof value === 'number') return value > 0;
  return false;
}

/** Get the authoritative limits for a given plan */
export function getPlanLimits(planSlug: string | undefined): PlanLimits {
  const normalized = (planSlug || 'free').toLowerCase();
  return PLAN_LIMITS[normalized] || PLAN_LIMITS.free;
}

/** Get the numeric limit of active job postings allowed by plan */
export function getActiveJobPostingLimit(planSlug: string | undefined): number {
  const limits = getPlanLimits(planSlug);
  return limits.activeJobs;
}

/** Check if employer can post another job */
export function canPostNewJob(planSlug: string | undefined, currentActiveJobsCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
} {
  const limit = getActiveJobPostingLimit(planSlug);
  const unlimited = isUnlimited(limit);
  const remaining = unlimited ? Infinity : Math.max(0, limit - currentActiveJobsCount);
  return {
    allowed: unlimited || currentActiveJobsCount < limit,
    limit,
    remaining,
    isUnlimited: unlimited,
  };
}

/** Check if employer can add another product */
export function canAddProduct(planSlug: string | undefined, currentCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
} {
  const limits = getPlanLimits(planSlug);
  const unlimited = isUnlimited(limits.products);
  return {
    allowed: limits.products !== 0 && (unlimited || currentCount < limits.products),
    limit: limits.products,
    remaining: unlimited ? Infinity : Math.max(0, limits.products - currentCount),
    isUnlimited: unlimited,
  };
}

/** Check if employer can add another service */
export function canAddService(planSlug: string | undefined, currentCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
} {
  const limits = getPlanLimits(planSlug);
  const unlimited = isUnlimited(limits.services);
  return {
    allowed: limits.services !== 0 && (unlimited || currentCount < limits.services),
    limit: limits.services,
    remaining: unlimited ? Infinity : Math.max(0, limits.services - currentCount),
    isUnlimited: unlimited,
  };
}

/** Check if employer can add another gallery image */
export function canAddGalleryImage(planSlug: string | undefined, currentCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
} {
  const limits = getPlanLimits(planSlug);
  const unlimited = isUnlimited(limits.galleryImages);
  return {
    allowed: limits.galleryImages !== 0 && (unlimited || currentCount < limits.galleryImages),
    limit: limits.galleryImages,
    remaining: unlimited ? Infinity : Math.max(0, limits.galleryImages - currentCount),
    isUnlimited: unlimited,
  };
}

/** Check if employer can add another video */
export function canAddGalleryVideo(planSlug: string | undefined, currentCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
} {
  const limits = getPlanLimits(planSlug);
  const unlimited = isUnlimited(limits.videos);
  return {
    allowed: limits.videos !== 0 && (unlimited || currentCount < limits.videos),
    limit: limits.videos,
    remaining: unlimited ? Infinity : Math.max(0, limits.videos - currentCount),
    isUnlimited: unlimited,
  };
}

/** Check if employer can add another branch */
export function canAddBranch(planSlug: string | undefined, currentCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
} {
  const limits = getPlanLimits(planSlug);
  const unlimited = isUnlimited(limits.branches);
  return {
    allowed: limits.branches !== 0 && (unlimited || currentCount < limits.branches),
    limit: limits.branches,
    remaining: unlimited ? Infinity : Math.max(0, limits.branches - currentCount),
    isUnlimited: unlimited,
  };
}

/** Check if employer can add another staff member */
export function canAddStaff(planSlug: string | undefined, currentCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
} {
  const limits = getPlanLimits(planSlug);
  const unlimited = isUnlimited(limits.staffIds);
  return {
    allowed: limits.staffIds !== 0 && (unlimited || currentCount < limits.staffIds),
    limit: limits.staffIds,
    remaining: unlimited ? Infinity : Math.max(0, limits.staffIds - currentCount),
    isUnlimited: unlimited,
  };
}

/** Get required plan slug to unlock a feature */
export function getRequiredPlanForFeature(feature: FeatureGateKey): {
  slug: SubscriptionPlanSlug;
  name: string;
  price: number;
} {
  const tiers: SubscriptionPlanSlug[] = ['free', 'basic', 'standard', 'premium', 'enterprise'];
  for (const tier of tiers) {
    if (hasFeaturePermission(tier, feature)) {
      const plan = getPlan(tier);
      return { slug: plan.slug, name: plan.name, price: plan.price };
    }
  }
  const standard = getPlan('standard');
  return { slug: standard.slug, name: standard.name, price: standard.price };
}

// ===== PORTFOLIO TEMPLATE UTILITIES =====

/** Get all templates accessible for a given plan */
export function getTemplatesForPlan(planSlug: string | undefined): PortfolioTemplate[] {
  const slug = ((planSlug || 'free').toLowerCase()) as PlanTier;
  const accessibleIds = TEMPLATE_PLAN_ACCESS[slug] || TEMPLATE_PLAN_ACCESS.free;
  return PORTFOLIO_TEMPLATES.filter(t => accessibleIds.includes(t.id));
}

/** Check if a plan can access a specific template */
export function canAccessTemplate(planSlug: string | undefined, templateId: string): boolean {
  const slug = ((planSlug || 'free').toLowerCase()) as PlanTier;
  const accessibleIds = TEMPLATE_PLAN_ACCESS[slug] || TEMPLATE_PLAN_ACCESS.free;
  return accessibleIds.includes(templateId);
}

/** Get all portfolio sections unlocked for a plan */
export function getPortfolioSectionsForPlan(planSlug: string | undefined) {
  const slug = ((planSlug || 'free').toLowerCase()) as PlanTier;
  const planIndex = PLAN_HIERARCHY.indexOf(slug);
  return PORTFOLIO_SECTION_DEFS.filter(s => {
    const sectionPlanIndex = PLAN_HIERARCHY.indexOf(s.requiredPlan);
    return sectionPlanIndex <= planIndex;
  });
}

/** Get the minimum plan required for a specific template */
export function getRequiredPlanForTemplate(templateId: string): PlanTier {
  const template = PORTFOLIO_TEMPLATES.find(t => t.id === templateId);
  return template?.plan || 'free';
}

