import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { PlanSlug, PlanConfig } from './types';

initializeApp();

export const REGION = 'asia-south1';
export const db = getFirestore();
export const auth = getAuth();

export const DEFAULT_PLANS: Record<PlanSlug, PlanConfig> = {
  free: {
    slug: 'free',
    maxActiveJobs: 1,
    maxGalleryImages: 2,
    maxJobAlerts: 2,
    aiRequestsPerMonth: 3,
    canUseFeaturedJobs: false,
    canUseUrgentJobs: false,
    canUsePremiumBadge: false,
    canUseAdvancedCandidateSearch: false,
    canUseLeadDashboard: false,
  },
  basic: {
    slug: 'basic',
    maxActiveJobs: 2,
    maxGalleryImages: 5,
    maxJobAlerts: 10,
    aiRequestsPerMonth: 15,
    canUseFeaturedJobs: false,
    canUseUrgentJobs: false,
    canUsePremiumBadge: false,
    canUseAdvancedCandidateSearch: true,
    canUseLeadDashboard: false,
  },
  premium: {
    slug: 'premium',
    maxActiveJobs: 5,
    maxGalleryImages: 20,
    maxJobAlerts: 50,
    aiRequestsPerMonth: 100,
    canUseFeaturedJobs: true,
    canUseUrgentJobs: true,
    canUsePremiumBadge: true,
    canUseAdvancedCandidateSearch: true,
    canUseLeadDashboard: true,
  },
  enterprise: {
    slug: 'enterprise',
    maxActiveJobs: -1,
    maxGalleryImages: -1,
    maxJobAlerts: -1,
    aiRequestsPerMonth: -1,
    canUseFeaturedJobs: true,
    canUseUrgentJobs: true,
    canUsePremiumBadge: true,
    canUseAdvancedCandidateSearch: true,
    canUseLeadDashboard: true,
  },
};

export const PLAN_RANK: Record<PlanSlug, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  enterprise: 3,
};

export const REMINDER_DAYS = [30, 7, 1] as const;
export const JOB_VALIDITY_DAYS = 30;
export const JOB_REMINDER_DAYS = [7, 3, 1] as const;
