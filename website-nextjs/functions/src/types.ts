export type PlanSlug = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'pending_renewal' | 'expired' | 'cancelled';

export interface PlanConfig {
  slug: PlanSlug;
  maxActiveJobs: number;
  maxGalleryImages: number;
  maxJobAlerts: number;
  aiRequestsPerMonth: number;
  canUseFeaturedJobs: boolean;
  canUseUrgentJobs: boolean;
  canUsePremiumBadge: boolean;
  canUseAdvancedCandidateSearch: boolean;
  canUseLeadDashboard: boolean;
}

export interface CreateJobPostingData {
  companyId?: unknown;
  title?: unknown;
  category?: unknown;
  description?: unknown;
  jobType?: unknown;
  location?: unknown;
  district?: unknown;
  openings?: unknown;
  experience?: unknown;
  education?: unknown;
  skills?: unknown;
  salaryMin?: unknown;
  salaryMax?: unknown;
  salaryType?: unknown;
  isNegotiable?: unknown;
  benefits?: unknown;
  deadline?: unknown;
  isPremium?: unknown;
  isUrgent?: unknown;
  isFeatured?: unknown;
  isWalkIn?: unknown;
  walkIn?: unknown;
  walkInDate?: unknown;
  walkInTime?: unknown;
  walkInVenue?: unknown;
  walkInContactPerson?: unknown;
  walkInContactMobile?: unknown;
}

export interface ValidateSubscriptionAccessData {
  companyId?: unknown;
  feature?: unknown;
}

export interface CreateNotificationData {
  userId?: unknown;
  type?: unknown;
  title?: unknown;
  message?: unknown;
  actionUrl?: unknown;
}

export interface ResolvedSubscriptionState {
  plan: PlanSlug;
  status: SubscriptionStatus;
}

export interface SyncMobileVerificationData {
  userId?: unknown;
}

export interface CreateRazorpayOrderData {
  planSlug?: unknown;
  audience?: unknown;
  companyId?: unknown;
}
