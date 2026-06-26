import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db, DEFAULT_PLANS, PLAN_RANK } from './config';
import { PlanSlug, SubscriptionStatus, PlanConfig, CreateJobPostingData, ResolvedSubscriptionState } from './types';

// ============================================================
// SHARED HELPERS
// ============================================================

export function requireUid(request: CallableRequest<unknown>): string {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Authentication is required.');
  }
  return request.auth.uid;
}

export async function requireAdmin(request: CallableRequest<unknown>): Promise<string> {
  const uid = requireUid(request);
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = getString(userSnap.data()?.role);
  if (role !== 'admin' && role !== 'super_admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  return uid;
}

export async function requireSuperAdmin(request: CallableRequest<unknown>): Promise<string> {
  const uid = requireUid(request);
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = getString(userSnap.data()?.role);
  if (role !== 'super_admin') {
    throw new HttpsError('permission-denied', 'Super admin access required.');
  }
  return uid;
}

export async function isAdminRequest(request: CallableRequest<unknown>): Promise<boolean> {
  const token = request.auth?.token as Record<string, unknown> | undefined;
  if (token?.admin === true || token?.super_admin === true) return true;

  const uid = request.auth?.uid;
  if (!uid) return false;

  const userSnap = await db.doc(`users/${uid}`).get();
  const role = getString(userSnap.data()?.role);
  return role === 'admin' || role === 'super_admin';
}

/** Server-side notification creation (Admin SDK, no rules check) */
export async function serverCreateNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
}) {
  if (!data.userId) return;
  await db.collection('notifications').add({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    ...(data.actionUrl ? { actionUrl: data.actionUrl } : {}),
    read: false,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Server-side audit log creation */
export async function createAuditLog(data: {
  action: string;
  adminId: string;
  targetId: string;
  targetType: string;
  changes?: Record<string, unknown>;
  reason?: string;
}) {
  await db.collection('activityLogs').add({
    userId: data.adminId,
    userName: 'Admin',
    action: data.action,
    target: data.targetId,
    targetId: data.targetId,
    targetType: data.targetType,
    ...(data.changes ? { changes: data.changes } : {}),
    ...(data.reason ? { reason: data.reason } : {}),
    timestamp: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });
}

/** Rate limiting check */
export async function checkRateLimit(
  userId: string,
  action: string,
  maxCount: number,
  windowMinutes: number,
): Promise<void> {
  const windowMs = windowMinutes * 60 * 1000;
  const windowKey = Math.floor(Date.now() / windowMs);
  const key = `${userId}_${action}_${windowKey}`;
  const ref = db.collection('rateLimiters').doc(key);

  const snap = await ref.get();
  const count = snap.exists ? (snap.data()?.count || 0) : 0;

  if (count >= maxCount) {
    throw new HttpsError(
      'resource-exhausted',
      `Rate limit exceeded. Max ${maxCount} ${action} per ${windowMinutes} minute(s).`,
    );
  }

  const expireAt = new Date(Date.now() + windowMs * 2);
  await ref.set({
    userId,
    action,
    count: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
    expireAt: Timestamp.fromDate(expireAt),
  }, { merge: true });
}


// ============================================================
// INTERNAL HELPER FUNCTIONS (preserved + new)
// ============================================================

export async function canNotifyRelatedUser(senderId: string, targetUserId: string): Promise<boolean> {
  if (await seekerHasApplicationWithCompanyOwner(senderId, targetUserId)) return true;
  return companyOwnerHasCandidateRelationship(senderId, targetUserId);
}

export async function seekerHasApplicationWithCompanyOwner(
  seekerId: string,
  ownerId: string,
): Promise<boolean> {
  const companySnap = await db.collection('companies')
    .where('ownerId', '==', ownerId)
    .limit(20)
    .get();
  const companyIds = companySnap.docs.map((company) => company.id);
  if (companyIds.length === 0) return false;

  const applicationSnap = await db.collection('jobApplications')
    .where('applicantId', '==', seekerId)
    .where('employerId', 'in', companyIds)
    .limit(1)
    .get();

  return !applicationSnap.empty;
}

export async function companyOwnerHasCandidateRelationship(
  ownerId: string,
  seekerId: string,
): Promise<boolean> {
  const companySnap = await db.collection('companies')
    .where('ownerId', '==', ownerId)
    .limit(20)
    .get();
  const companyIds = new Set(companySnap.docs.map((company) => company.id));
  if (companyIds.size === 0) return false;

  const applicationSnap = await db.collection('jobApplications')
    .where('applicantId', '==', seekerId)
    .limit(50)
    .get();
  if (applicationSnap.docs.some((application) => companyIds.has(getString(application.data().employerId)))) {
    return true;
  }

  const interviewSnap = await db.collection('interviews')
    .where('seekerId', '==', seekerId)
    .limit(50)
    .get();
  return interviewSnap.docs.some((interview) => companyIds.has(getString(interview.data().companyId)));
}

export async function getPlanConfigs(): Promise<Record<PlanSlug, PlanConfig>> {
  const snap = await db.doc('settings/subscriptionPlans').get();
  const remote = snap.exists ? snap.data() : undefined;

  return {
    free: mergePlan('free', remote?.free),
    basic: mergePlan('basic', remote?.basic),
    premium: mergePlan('premium', remote?.premium),
    enterprise: mergePlan('enterprise', remote?.enterprise),
  };
}

export function mergePlan(slug: PlanSlug, value: unknown): PlanConfig {
  if (!value || typeof value !== 'object') return DEFAULT_PLANS[slug];
  const raw = value as Partial<PlanConfig>;
  return {
    ...DEFAULT_PLANS[slug],
    maxActiveJobs: getNumber(raw.maxActiveJobs, DEFAULT_PLANS[slug].maxActiveJobs),
    maxGalleryImages: getNumber(raw.maxGalleryImages, DEFAULT_PLANS[slug].maxGalleryImages),
    maxJobAlerts: getNumber(raw.maxJobAlerts, DEFAULT_PLANS[slug].maxJobAlerts),
    aiRequestsPerMonth: getNumber(
      raw.aiRequestsPerMonth,
      DEFAULT_PLANS[slug].aiRequestsPerMonth,
    ),
    canUseFeaturedJobs: getBoolean(raw.canUseFeaturedJobs, DEFAULT_PLANS[slug].canUseFeaturedJobs),
    canUseUrgentJobs: getBoolean(raw.canUseUrgentJobs, DEFAULT_PLANS[slug].canUseUrgentJobs),
    canUsePremiumBadge: getBoolean(raw.canUsePremiumBadge, DEFAULT_PLANS[slug].canUsePremiumBadge),
    canUseAdvancedCandidateSearch: getBoolean(
      raw.canUseAdvancedCandidateSearch,
      DEFAULT_PLANS[slug].canUseAdvancedCandidateSearch,
    ),
    canUseLeadDashboard: getBoolean(raw.canUseLeadDashboard, DEFAULT_PLANS[slug].canUseLeadDashboard),
    slug,
  };
}

export async function resolveCompanyPlan(
  companyId: string,
  company: Record<string, unknown>,
): Promise<PlanSlug> {
  const subSnap = await db.collection('subscriptions')
    .where('companyId', '==', companyId)
    .get();

  const activePlan = getBestActiveSubscriptionPlan(
    subSnap.docs.map((docSnap) => docSnap.data()),
  );
  if (activePlan) {
    return activePlan;
  }

  if (
    (company.subscriptionStatus === 'active' || company.subscriptionStatus === 'pending_renewal') &&
    company.subscriptionPlan &&
    isFutureDate(company.subscriptionEndsAt)
  ) {
    return normalizePlanSlug(getString(company.subscriptionPlan, 'free'));
  }
  if (company.plan) return normalizePlanSlug(getString(company.plan, 'free'));
  if (company.isPremium === true) return 'premium';
  return 'free';
}

export async function resolveCompanyPlanState(
  companyId: string,
  company: Record<string, unknown>,
): Promise<ResolvedSubscriptionState> {
  const subSnap = await db.collection('subscriptions')
    .where('companyId', '==', companyId)
    .get();

  const state = getBestSubscriptionPlanState(subSnap.docs.map((docSnap) => docSnap.data()));
  if (state) return state;

  if (company.subscriptionPlan) {
    const status = getEffectiveSubscriptionStatus({
      status: company.subscriptionStatus,
      endDate: company.subscriptionEndsAt,
    });
    return {
      plan: hasActiveSubscriptionBenefits(status)
        ? normalizePlanSlug(getString(company.subscriptionPlan, 'free'))
        : 'free',
      status,
    };
  }

  if (company.plan) {
    return { plan: normalizePlanSlug(getString(company.plan, 'free')), status: 'active' };
  }
  if (company.isPremium === true) return { plan: 'premium', status: 'active' };
  return { plan: 'free', status: 'active' };
}

export async function resolveUserPlanState(userId: string): Promise<ResolvedSubscriptionState> {
  const subSnap = await db.collection('subscriptions')
    .where('userId', '==', userId)
    .get();

  return getBestSubscriptionPlanState(subSnap.docs.map((docSnap) => docSnap.data())) ||
    { plan: 'free', status: 'active' };
}

export function getBestActiveSubscriptionPlan(subscriptions: Array<Record<string, unknown>>): PlanSlug | null {
  const now = Date.now();
  let best: PlanSlug | null = null;

  for (const subscription of subscriptions) {
    const status = getString(subscription.status, 'active') as SubscriptionStatus;
    if (status !== 'active' && status !== 'pending_renewal') continue;

    const expiry = getDate(subscription.endDate);
    if (expiry && expiry.getTime() < now) continue;

    const plan = normalizePlanSlug(getString(subscription.plan || subscription.planName, 'free'));
    if (!best || PLAN_RANK[plan] > PLAN_RANK[best]) {
      best = plan;
    }
  }

  return best;
}

export function getBestSubscriptionPlanState(
  subscriptions: Array<Record<string, unknown>>,
): ResolvedSubscriptionState | null {
  let bestActive: ResolvedSubscriptionState | null = null;
  let bestInactive: ResolvedSubscriptionState | null = null;

  for (const subscription of subscriptions) {
    const status = getEffectiveSubscriptionStatus(subscription);
    const plan = normalizePlanSlug(getString(subscription.plan || subscription.planName, 'free'));
    const state = { plan, status };

    if (hasActiveSubscriptionBenefits(status)) {
      if (!bestActive || PLAN_RANK[plan] > PLAN_RANK[bestActive.plan]) {
        bestActive = state;
      }
      continue;
    }

    if (!bestInactive || PLAN_RANK[plan] > PLAN_RANK[bestInactive.plan]) {
      bestInactive = state;
    }
  }

  if (bestActive) return bestActive;
  if (bestInactive) return { plan: 'free', status: bestInactive.status };
  return null;
}

export function getEffectiveSubscriptionStatus(subscription: Record<string, unknown>): SubscriptionStatus {
  const rawStatus = getString(subscription.status, 'active') as SubscriptionStatus;
  if (rawStatus === 'cancelled') return 'cancelled';

  const expiry = getDate(subscription.endDate);
  if (expiry) {
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'pending_renewal';
  }

  if (rawStatus === 'expired') return 'expired';
  if (rawStatus === 'pending_renewal') return 'pending_renewal';
  return 'active';
}

export function hasActiveSubscriptionBenefits(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'pending_renewal';
}

export async function expireSubscription(path: string, data: Record<string, unknown>) {
  const ref = db.doc(path);
  await ref.set({
    status: 'expired',
    expiredAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await syncSubscriptionStatus(data, 'expired');
  await createSubscriptionNotification({
    userId: getString(data.userId),
    title: 'Subscription expired',
    message: `${getString(data.planName, 'Your plan')} has expired. Renew to restore plan benefits.`,
    actionUrl: getString(data.audience) === 'seeker' ? '/seeker/subscription' : '/employer/billing',
  });
}

export async function syncSubscriptionStatus(
  data: Record<string, unknown>,
  status: SubscriptionStatus,
) {
  const companyId = getString(data.companyId);
  const userId = getString(data.userId);
  const plan = normalizePlanSlug(getString(data.plan, 'free'));
  const isExpired = status === 'expired' || status === 'cancelled';

  if (companyId) {
    await db.doc(`companies/${companyId}`).set({
      isPremium: !isExpired && (plan === 'premium' || plan === 'enterprise'),
      subscriptionStatus: status,
      ...(isExpired ? { subscriptionPlan: 'free' } : { subscriptionPlan: plan }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  if (userId && getString(data.audience) === 'seeker') {
    await db.doc(`seekerProfiles/${userId}`).set({
      isPremium: !isExpired && (plan === 'premium' || plan === 'enterprise'),
      subscriptionStatus: status,
      ...(isExpired ? { subscriptionPlan: 'free' } : { subscriptionPlan: plan }),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}

export async function createSubscriptionNotification(data: {
  userId: string;
  title: string;
  message: string;
  actionUrl: string;
}) {
  if (!data.userId) return;
  await db.collection('notifications').add({
    userId: data.userId,
    type: 'subscription',
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl,
    read: false,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export function featureAllowed(limits: PlanConfig, feature: string): boolean {
  if (feature === 'featured_job') return limits.canUseFeaturedJobs;
  if (feature === 'urgent_job') return limits.canUseUrgentJobs;
  if (feature === 'premium_badge') return limits.canUsePremiumBadge;
  if (feature === 'advanced_candidate_search') return limits.canUseAdvancedCandidateSearch;
  if (feature === 'lead_dashboard') return limits.canUseLeadDashboard;
  return true;
}

export async function countOpenJobs(companyId: string): Promise<number> {
  const snap = await db.collection('jobs')
    .where('companyId', '==', companyId)
    .where('status', '==', 'active')
    .get();
  return snap.docs.filter((job) => {
    const data = job.data();
    return data.isActive === true && !isPastDate(data.expiresAt);
  }).length;
}

export async function hasDuplicateJob(companyId: string, normalizedTitle: string, location: string): Promise<boolean> {
  const snap = await db.collection('jobs')
    .where('companyId', '==', companyId)
    .where('normalizedTitle', '==', normalizedTitle)
    .limit(20)
    .get();

  return snap.docs.some((job) => {
    const data = job.data();
    const status = getString(data.status, data.isActive ? 'active' : 'pending');
    if (!['pending', 'active', 'paused', 'reported'].includes(status)) return false;
    if (isPastDate(data.expiresAt)) return false;
    return getString(data.location) === location;
  });
}

export function normaliseDuplicateKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function detectSpamFlags(input: { title: string; description: string }): string[] {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const flags: string[] = [];
  const bannedTerms = ['work from home earn daily', 'registration fee', 'pay first', 'quick money'];
  const urlCount = (text.match(/https?:\/\//g) || []).length;

  if (bannedTerms.some((term) => text.includes(term))) flags.push('spam_terms');
  if (urlCount > 2) flags.push('too_many_links');
  if (input.title.length > 0 && input.title === input.title.toUpperCase() && input.title.length > 18) {
    flags.push('all_caps_title');
  }
  if (input.description.length < 40) flags.push('thin_description');
  return flags;
}

export function getWalkInPayload(data: CreateJobPostingData): Record<string, unknown> {
  if (!getBoolean(data.isWalkIn)) return {};
  const walkIn = typeof data.walkIn === 'object' && data.walkIn !== null
    ? data.walkIn as Record<string, unknown>
    : {};

  const date = getString(data.walkInDate || walkIn.date);
  const time = getString(data.walkInTime || walkIn.time);
  const venue = getString(data.walkInVenue || walkIn.venue);
  const contactPerson = getString(data.walkInContactPerson || walkIn.contactPerson);
  const contactMobile = getString(data.walkInContactMobile || walkIn.contactMobile);

  return {
    walkIn: { date, time, venue, contactPerson, contactMobile },
    walkInDate: date,
    walkInTime: time,
    walkInVenue: venue,
    walkInContactPerson: contactPerson,
    walkInContactMobile: contactMobile,
  };
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isPastDate(value: unknown): boolean {
  const date = getDate(value);
  return !!date && date.getTime() < Date.now();
}

export async function createJobNotification(data: {
  userId: string;
  title: string;
  message: string;
  actionUrl: string;
}) {
  if (!data.userId) return;

  await db.collection('notifications').add({
    userId: data.userId,
    type: 'job_alert',
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl,
    read: false,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export function normalizePlanSlug(value: string): PlanSlug {
  const normalized = value.toLowerCase().replace(/\s+plan$/, '').trim();
  if (normalized === 'basic' || normalized === 'premium' || normalized === 'enterprise') {
    return normalized;
  }
  return 'free';
}

export function isUnlimited(value: number): boolean {
  return value < 0 || !Number.isFinite(value);
}

export function getRequiredString(value: unknown, field: string): string {
  const text = getString(value);
  if (!text) {
    throw new HttpsError('invalid-argument', `${field} is required.`);
  }
  return text;
}

export function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => getString(item)).filter((item) => item.length > 0)
    : [];
}

export function getBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function getNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function getNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = getNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && value !== null) {
    const raw = value as { toDate?: () => Date; seconds?: number };
    if (typeof raw.toDate === 'function') return raw.toDate();
    if (typeof raw.seconds === 'number') return new Date(raw.seconds * 1000);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export function isFutureDate(value: unknown): boolean {
  const date = getDate(value);
  return !!date && date.getTime() >= Date.now();
}

export function getNumberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map((item) => getNumber(item, Number.NaN)).filter((item) => Number.isFinite(item))
    : [];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

// ============================================================
// TALENT SEARCH & RESUME ACCESS
// ============================================================

export async function hasVerifiedEmployerAccessServer(uid: string): Promise<boolean> {
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) return false;
  const userData = userSnap.data()!;
  
  if (userData.employerVerified === true || userData.companyVerified === true) {
    return true;
  }
  
  const companyId = userData.companyId;
  if (companyId) {
    const companySnap = await db.doc(`companies/${companyId}`).get();
    if (companySnap.exists) {
      const companyData = companySnap.data()!;
      if (
        companyData.ownerId === uid &&
        companyData.isActive !== false &&
        (companyData.verificationStatus === 'verified' ||
         companyData.status === 'approved' ||
         companyData.isVerified === true)
      ) {
        return true;
      }
    }
  }
  return false;
}

export async function isPremiumCompanyOwnerServer(uid: string): Promise<boolean> {
  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) return false;
  const userData = userSnap.data()!;
  const companyId = userData.companyId;
  if (companyId) {
    const companySnap = await db.doc(`companies/${companyId}`).get();
    if (companySnap.exists) {
      const companyData = companySnap.data()!;
      if (companyData.ownerId === uid && companyData.isPremium === true) {
        return true;
      }
    }
  }
  return false;
}
