/**
 * THENIJOBS — Central AI Configuration
 * Centralized credit costs, plan allowances, credit packs, and pricing.
 */

export type AIFeatureKey =
  | 'job_search'
  | 'job_recommendation'
  | 'career_assistant'
  | 'profile_improvement'
  | 'resume_improvement'
  | 'cover_letter'
  | 'interview_prep'
  | 'full_resume_generation'
  | 'company_description'
  | 'service_product_description'
  | 'job_description'
  | 'candidate_matching'
  | 'candidate_ranking'
  | 'candidate_search'
  | 'chatbot';

export const AI_CREDIT_COSTS: Record<AIFeatureKey, number> = {
  job_search: 1,
  job_recommendation: 1,
  career_assistant: 1,
  profile_improvement: 1,
  resume_improvement: 2,
  cover_letter: 2,
  interview_prep: 2,
  full_resume_generation: 3,
  company_description: 1,
  service_product_description: 1,
  job_description: 1,
  candidate_matching: 2,
  candidate_ranking: 2,
  candidate_search: 1,
  chatbot: 1,
};

export const AI_PLAN_ALLOWANCES: Record<string, number> = {
  FREE: 0,
  BASIC: 5,
  STANDARD: 10,
  PREMIUM: 10,
  ENTERPRISE: 50,
};

export interface AICreditPack {
  id: string;
  credits: number;
  priceINR: number;
  tag?: string;
}

export const AI_CREDIT_PACKS: AICreditPack[] = [
  { id: 'pack_10', credits: 10, priceINR: 10, tag: 'Starter' },
  { id: 'pack_25', credits: 25, priceINR: 20, tag: 'Popular' },
  { id: 'pack_50', credits: 50, priceINR: 35, tag: 'Best Value' },
  { id: 'pack_100', credits: 100, priceINR: 60, tag: 'Pro Pack' },
];

export const RESUME_BUILDER_PRICE_INR = 15;

export const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
