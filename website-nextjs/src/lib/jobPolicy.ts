import { Timestamp } from 'firebase/firestore';
import { normalizePlanSlug, toDate, type VisibleSubscriptionPlanSlug } from '@/lib/subscriptions';

export const JOB_VALIDITY_DAYS = 30;
export const JOB_EXPIRY_REMINDER_DAYS = [7, 3, 1] as const;

export type JobLifecycleStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'closed'
  | 'expired'
  | 'rejected'
  | 'reported'
  | 'pending_renewal';

export const JOB_PLAN_LIMITS: Record<VisibleSubscriptionPlanSlug | 'enterprise', number> = {
  free: 1,
  basic: 10,
  premium: 50,
  enterprise: Number.POSITIVE_INFINITY,
};

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getJobExpiryDate(startDate = new Date()) {
  return addDays(startDate, JOB_VALIDITY_DAYS);
}

export function toFirestoreTimestamp(date: Date) {
  return Timestamp.fromDate(date);
}

export function getJobPlanLimit(plan?: string | null) {
  const normalized = String(plan || '').toLowerCase().replace(/\s+plan$/, '').trim();
  if (normalized === 'enterprise') return JOB_PLAN_LIMITS.enterprise;
  return JOB_PLAN_LIMITS[normalizePlanSlug(plan)];
}

export function isUnlimitedJobPlan(plan?: string | null) {
  return !Number.isFinite(getJobPlanLimit(plan));
}

export function getJobPostedDate(job: { activatedAt?: unknown; postedAt?: unknown; createdAt?: unknown }) {
  return toDate(job.activatedAt) || toDate(job.postedAt) || toDate(job.createdAt);
}

export function getEffectiveJobExpiry(job: { expiresAt?: unknown; deadline?: unknown }) {
  return toDate(job.expiresAt) || toDate(job.deadline);
}

export function getDaysUntilJobExpiry(job: { expiresAt?: unknown; deadline?: unknown }, now = new Date()) {
  const expiry = getEffectiveJobExpiry(job);
  if (!expiry) return null;
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isJobExpired(job: { expiresAt?: unknown; deadline?: unknown }, now = new Date()) {
  const expiry = getEffectiveJobExpiry(job);
  return !!expiry && expiry.getTime() < now.getTime();
}

export function isActiveJobSlot(job: {
  status?: string | null;
  isActive?: boolean | null;
  expiresAt?: unknown;
  deadline?: unknown;
}, now = new Date()) {
  return job.isActive === true && (job.status || 'active') === 'active' && !isJobExpired(job, now);
}

export function getEffectiveJobStatus(job: {
  status?: string | null;
  isActive?: boolean | null;
  expiresAt?: unknown;
  deadline?: unknown;
}, now = new Date()): JobLifecycleStatus {
  const status = (job.status || (job.isActive ? 'active' : 'pending')) as JobLifecycleStatus;
  if ((status === 'active' || status === 'paused') && isJobExpired(job, now)) return 'expired';
  return status;
}

export function isPublicJobVisible(job: {
  status?: string | null;
  isActive?: boolean | null;
  expiresAt?: unknown;
  deadline?: unknown;
  companyIsActive?: boolean | null;
  companyDeleted?: boolean | null;
  companyStatus?: string | null;
  companyVerificationStatus?: string | null;
}, now = new Date()) {
  if (!isActiveJobSlot(job, now)) return false;
  if (job.companyDeleted === true) return false;
  if (job.companyIsActive === false) return false;
  if (job.companyStatus && !['approved', 'verified', 'active'].includes(job.companyStatus)) return false;
  if (job.companyVerificationStatus && job.companyVerificationStatus !== 'verified') return false;
  return true;
}

export function getJobExpiryReminderLabel(job: { expiresAt?: unknown; deadline?: unknown }, now = new Date()) {
  const days = getDaysUntilJobExpiry(job, now);
  if (days === null || days < 0) return null;
  if (JOB_EXPIRY_REMINDER_DAYS.includes(days as typeof JOB_EXPIRY_REMINDER_DAYS[number])) {
    return `${days} day${days === 1 ? '' : 's'} left`;
  }
  return null;
}
