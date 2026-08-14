import { PLAN_FEATURE_MATRIX, SUBSCRIPTION_PLANS, PORTFOLIO_TEMPLATES, TEMPLATE_PLAN_ACCESS, PORTFOLIO_SECTION_DEFS } from '@/lib/constants';
import type { SubscriptionPlanSlug, SubscriptionPlan } from '@/lib/types';
import type { PlanTier, PortfolioTemplate } from '@/lib/types/portfolio';

export type PlanMatrix = typeof PLAN_FEATURE_MATRIX;
export type FeatureGateKey = keyof typeof PLAN_FEATURE_MATRIX.free;

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

/** Get the numeric limit of active job postings allowed by plan */
export function getActiveJobPostingLimit(planSlug: string | undefined): number {
  const slug = ((planSlug || 'free').toLowerCase()) as keyof PlanMatrix;
  const matrix = PLAN_FEATURE_MATRIX[slug] || PLAN_FEATURE_MATRIX.free;
  return matrix.activeJobsLimit;
}

/** Check if employer can post another job */
export function canPostNewJob(planSlug: string | undefined, currentActiveJobsCount: number): {
  allowed: boolean;
  limit: number;
  remaining: number;
} {
  const limit = getActiveJobPostingLimit(planSlug);
  const remaining = Math.max(0, limit - currentActiveJobsCount);
  return {
    allowed: currentActiveJobsCount < limit,
    limit,
    remaining,
  };
}

/** Get required plan slug to unlock a feature */
export function getRequiredPlanForFeature(feature: FeatureGateKey): {
  slug: SubscriptionPlanSlug;
  name: string;
  price: number;
} {
  const tiers: SubscriptionPlanSlug[] = ['free', 'basic', 'standard', 'premium', 'enterprise'];  // basic kept for legacy Firestore records
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

const PLAN_HIERARCHY: PlanTier[] = ['free', 'standard', 'premium', 'enterprise'];

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

