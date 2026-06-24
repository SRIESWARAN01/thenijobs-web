// ============================================================
// Business Ranking System — Dynamic Featured Ranking
// ============================================================

import type { PlanSlug } from './subscriptionPlans';

export interface BusinessRankingInput {
  /** Current subscription plan */
  planSlug: PlanSlug;
  /** Average star rating (0-5) */
  averageRating: number;
  /** Total number of reviews */
  totalReviews: number;
  /** Profile completeness percentage (0-100) */
  profileCompleteness: number;
  /** Verification status */
  isVerified: boolean;
  /** Is GST verified */
  isGSTVerified: boolean;
  /** Number of social posts in last 30 days */
  recentPostCount: number;
  /** Number of active job listings */
  activeJobCount: number;
  /** Average response time in hours (lower is better) */
  avgResponseTimeHrs: number;
  /** Last activity timestamp (ms since epoch) */
  lastActivityMs: number;
}

export interface BusinessRankingResult {
  totalScore: number;
  breakdown: {
    subscriptionScore: number;
    reviewScore: number;
    completenessScore: number;
    verificationScore: number;
    activityScore: number;
  };
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  badge: string; // emoji
}

// ─── Weights ────────────────────────────────────────────
const WEIGHT_SUBSCRIPTION = 0.30;
const WEIGHT_REVIEWS = 0.25;
const WEIGHT_COMPLETENESS = 0.15;
const WEIGHT_VERIFICATION = 0.15;
const WEIGHT_ACTIVITY = 0.15;

// ─── Subscription tier scores ───────────────────────────
const PLAN_SCORES: Record<PlanSlug, number> = {
  free: 10,
  basic: 40,
  premium: 75,
  enterprise: 100,
};

/**
 * Calculate a composite ranking score (0-100) for a business.
 */
export function calculateBusinessRanking(input: BusinessRankingInput): BusinessRankingResult {
  // 1. Subscription Score (0-100)
  const subscriptionScore = PLAN_SCORES[input.planSlug] ?? 10;

  // 2. Review Score (0-100)
  // Combines average rating (weighted) with review volume
  const ratingNorm = (input.averageRating / 5) * 100;
  const volumeBonus = Math.min(input.totalReviews / 50, 1) * 30; // up to +30 for 50+ reviews
  const reviewScore = Math.min(ratingNorm * 0.7 + volumeBonus, 100);

  // 3. Profile Completeness Score (0-100)
  const completenessScore = Math.min(input.profileCompleteness, 100);

  // 4. Verification Score (0-100)
  let verificationScore = 0;
  if (input.isVerified) verificationScore += 60;
  if (input.isGSTVerified) verificationScore += 40;

  // 5. Activity Score (0-100)
  const daysSinceActivity = Math.max(0, (Date.now() - input.lastActivityMs) / (1000 * 60 * 60 * 24));
  const recencyScore = Math.max(0, 100 - daysSinceActivity * 3); // loses 3 pts per day inactive
  const postScore = Math.min(input.recentPostCount / 10, 1) * 40; // up to 40 pts for 10+ posts
  const jobScore = Math.min(input.activeJobCount / 5, 1) * 30; // up to 30 pts for 5+ jobs
  const responseScore = input.avgResponseTimeHrs <= 1 ? 30 : input.avgResponseTimeHrs <= 4 ? 20 : input.avgResponseTimeHrs <= 24 ? 10 : 0;
  const activityScore = Math.min((recencyScore * 0.3 + postScore + jobScore + responseScore) / 1.3, 100);

  // Weighted total
  const totalScore = Math.round(
    subscriptionScore * WEIGHT_SUBSCRIPTION +
    reviewScore * WEIGHT_REVIEWS +
    completenessScore * WEIGHT_COMPLETENESS +
    verificationScore * WEIGHT_VERIFICATION +
    activityScore * WEIGHT_ACTIVITY
  );

  // Determine tier
  let tier: BusinessRankingResult['tier'];
  let badge: string;
  if (totalScore >= 80) {
    tier = 'platinum';
    badge = '💎';
  } else if (totalScore >= 60) {
    tier = 'gold';
    badge = '🥇';
  } else if (totalScore >= 40) {
    tier = 'silver';
    badge = '🥈';
  } else {
    tier = 'bronze';
    badge = '🥉';
  }

  return {
    totalScore,
    breakdown: {
      subscriptionScore: Math.round(subscriptionScore * WEIGHT_SUBSCRIPTION),
      reviewScore: Math.round(reviewScore * WEIGHT_REVIEWS),
      completenessScore: Math.round(completenessScore * WEIGHT_COMPLETENESS),
      verificationScore: Math.round(verificationScore * WEIGHT_VERIFICATION),
      activityScore: Math.round(activityScore * WEIGHT_ACTIVITY),
    },
    tier,
    badge,
  };
}

/**
 * Sort businesses by ranking score (descending).
 */
export function sortByRanking<T extends { rankingScore?: number }>(businesses: T[]): T[] {
  return [...businesses].sort((a, b) => (b.rankingScore ?? 0) - (a.rankingScore ?? 0));
}

/**
 * Get tier display info.
 */
export function getTierInfo(tier: BusinessRankingResult['tier']): { label: string; color: string; bg: string } {
  switch (tier) {
    case 'platinum': return { label: 'Platinum', color: 'text-violet-400', bg: 'bg-violet-500/15' };
    case 'gold': return { label: 'Gold', color: 'text-amber-400', bg: 'bg-amber-500/15' };
    case 'silver': return { label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-500/15' };
    case 'bronze': return { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-500/15' };
  }
}
