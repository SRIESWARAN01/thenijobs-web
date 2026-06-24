"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireUid = requireUid;
exports.requireAdmin = requireAdmin;
exports.requireSuperAdmin = requireSuperAdmin;
exports.isAdminRequest = isAdminRequest;
exports.serverCreateNotification = serverCreateNotification;
exports.createAuditLog = createAuditLog;
exports.checkRateLimit = checkRateLimit;
exports.canNotifyRelatedUser = canNotifyRelatedUser;
exports.seekerHasApplicationWithCompanyOwner = seekerHasApplicationWithCompanyOwner;
exports.companyOwnerHasCandidateRelationship = companyOwnerHasCandidateRelationship;
exports.getPlanConfigs = getPlanConfigs;
exports.mergePlan = mergePlan;
exports.resolveCompanyPlan = resolveCompanyPlan;
exports.resolveCompanyPlanState = resolveCompanyPlanState;
exports.resolveUserPlanState = resolveUserPlanState;
exports.getBestActiveSubscriptionPlan = getBestActiveSubscriptionPlan;
exports.getBestSubscriptionPlanState = getBestSubscriptionPlanState;
exports.getEffectiveSubscriptionStatus = getEffectiveSubscriptionStatus;
exports.hasActiveSubscriptionBenefits = hasActiveSubscriptionBenefits;
exports.expireSubscription = expireSubscription;
exports.syncSubscriptionStatus = syncSubscriptionStatus;
exports.createSubscriptionNotification = createSubscriptionNotification;
exports.featureAllowed = featureAllowed;
exports.countOpenJobs = countOpenJobs;
exports.hasDuplicateJob = hasDuplicateJob;
exports.normaliseDuplicateKey = normaliseDuplicateKey;
exports.detectSpamFlags = detectSpamFlags;
exports.getWalkInPayload = getWalkInPayload;
exports.addDays = addDays;
exports.isPastDate = isPastDate;
exports.createJobNotification = createJobNotification;
exports.normalizePlanSlug = normalizePlanSlug;
exports.isUnlimited = isUnlimited;
exports.getRequiredString = getRequiredString;
exports.getString = getString;
exports.getStringArray = getStringArray;
exports.getBoolean = getBoolean;
exports.getNumber = getNumber;
exports.getNullableNumber = getNullableNumber;
exports.getDate = getDate;
exports.isFutureDate = isFutureDate;
exports.getNumberArray = getNumberArray;
exports.slugify = slugify;
exports.hasVerifiedEmployerAccessServer = hasVerifiedEmployerAccessServer;
exports.isPremiumCompanyOwnerServer = isPremiumCompanyOwnerServer;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const config_1 = require("./config");
// ============================================================
// SHARED HELPERS
// ============================================================
function requireUid(request) {
    if (!request.auth?.uid) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication is required.');
    }
    return request.auth.uid;
}
async function requireAdmin(request) {
    const uid = requireUid(request);
    const userSnap = await config_1.db.doc(`users/${uid}`).get();
    const role = getString(userSnap.data()?.role);
    if (role !== 'admin' && role !== 'super_admin') {
        throw new https_1.HttpsError('permission-denied', 'Admin access required.');
    }
    return uid;
}
async function requireSuperAdmin(request) {
    const uid = requireUid(request);
    const userSnap = await config_1.db.doc(`users/${uid}`).get();
    const role = getString(userSnap.data()?.role);
    if (role !== 'super_admin') {
        throw new https_1.HttpsError('permission-denied', 'Super admin access required.');
    }
    return uid;
}
async function isAdminRequest(request) {
    const token = request.auth?.token;
    if (token?.admin === true || token?.super_admin === true)
        return true;
    const uid = request.auth?.uid;
    if (!uid)
        return false;
    const userSnap = await config_1.db.doc(`users/${uid}`).get();
    const role = getString(userSnap.data()?.role);
    return role === 'admin' || role === 'super_admin';
}
/** Server-side notification creation (Admin SDK, no rules check) */
async function serverCreateNotification(data) {
    if (!data.userId)
        return;
    await config_1.db.collection('notifications').add({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        ...(data.actionUrl ? { actionUrl: data.actionUrl } : {}),
        read: false,
        isRead: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
/** Server-side audit log creation */
async function createAuditLog(data) {
    await config_1.db.collection('activityLogs').add({
        userId: data.adminId,
        userName: 'Admin',
        action: data.action,
        target: data.targetId,
        targetId: data.targetId,
        targetType: data.targetType,
        ...(data.changes ? { changes: data.changes } : {}),
        ...(data.reason ? { reason: data.reason } : {}),
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
/** Rate limiting check */
async function checkRateLimit(userId, action, maxCount, windowMinutes) {
    const windowMs = windowMinutes * 60 * 1000;
    const windowKey = Math.floor(Date.now() / windowMs);
    const key = `${userId}_${action}_${windowKey}`;
    const ref = config_1.db.collection('rateLimiters').doc(key);
    const snap = await ref.get();
    const count = snap.exists ? (snap.data()?.count || 0) : 0;
    if (count >= maxCount) {
        throw new https_1.HttpsError('resource-exhausted', `Rate limit exceeded. Max ${maxCount} ${action} per ${windowMinutes} minute(s).`);
    }
    const expireAt = new Date(Date.now() + windowMs * 2);
    await ref.set({
        userId,
        action,
        count: firestore_1.FieldValue.increment(1),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        expireAt: firestore_1.Timestamp.fromDate(expireAt),
    }, { merge: true });
}
// ============================================================
// INTERNAL HELPER FUNCTIONS (preserved + new)
// ============================================================
async function canNotifyRelatedUser(senderId, targetUserId) {
    if (await seekerHasApplicationWithCompanyOwner(senderId, targetUserId))
        return true;
    return companyOwnerHasCandidateRelationship(senderId, targetUserId);
}
async function seekerHasApplicationWithCompanyOwner(seekerId, ownerId) {
    const companySnap = await config_1.db.collection('companies')
        .where('ownerId', '==', ownerId)
        .limit(20)
        .get();
    const companyIds = companySnap.docs.map((company) => company.id);
    if (companyIds.length === 0)
        return false;
    const applicationSnap = await config_1.db.collection('applications')
        .where('seekerId', '==', seekerId)
        .where('companyId', 'in', companyIds)
        .limit(1)
        .get();
    return !applicationSnap.empty;
}
async function companyOwnerHasCandidateRelationship(ownerId, seekerId) {
    const companySnap = await config_1.db.collection('companies')
        .where('ownerId', '==', ownerId)
        .limit(20)
        .get();
    const companyIds = new Set(companySnap.docs.map((company) => company.id));
    if (companyIds.size === 0)
        return false;
    const applicationSnap = await config_1.db.collection('applications')
        .where('seekerId', '==', seekerId)
        .limit(50)
        .get();
    if (applicationSnap.docs.some((application) => companyIds.has(getString(application.data().companyId)))) {
        return true;
    }
    const interviewSnap = await config_1.db.collection('interviews')
        .where('seekerId', '==', seekerId)
        .limit(50)
        .get();
    return interviewSnap.docs.some((interview) => companyIds.has(getString(interview.data().companyId)));
}
async function getPlanConfigs() {
    const snap = await config_1.db.doc('settings/subscriptionPlans').get();
    const remote = snap.exists ? snap.data() : undefined;
    return {
        free: mergePlan('free', remote?.free),
        basic: mergePlan('basic', remote?.basic),
        premium: mergePlan('premium', remote?.premium),
        enterprise: mergePlan('enterprise', remote?.enterprise),
    };
}
function mergePlan(slug, value) {
    if (!value || typeof value !== 'object')
        return config_1.DEFAULT_PLANS[slug];
    const raw = value;
    return {
        ...config_1.DEFAULT_PLANS[slug],
        maxActiveJobs: getNumber(raw.maxActiveJobs, config_1.DEFAULT_PLANS[slug].maxActiveJobs),
        maxGalleryImages: getNumber(raw.maxGalleryImages, config_1.DEFAULT_PLANS[slug].maxGalleryImages),
        maxJobAlerts: getNumber(raw.maxJobAlerts, config_1.DEFAULT_PLANS[slug].maxJobAlerts),
        aiRequestsPerMonth: getNumber(raw.aiRequestsPerMonth, config_1.DEFAULT_PLANS[slug].aiRequestsPerMonth),
        canUseFeaturedJobs: getBoolean(raw.canUseFeaturedJobs, config_1.DEFAULT_PLANS[slug].canUseFeaturedJobs),
        canUseUrgentJobs: getBoolean(raw.canUseUrgentJobs, config_1.DEFAULT_PLANS[slug].canUseUrgentJobs),
        canUsePremiumBadge: getBoolean(raw.canUsePremiumBadge, config_1.DEFAULT_PLANS[slug].canUsePremiumBadge),
        canUseAdvancedCandidateSearch: getBoolean(raw.canUseAdvancedCandidateSearch, config_1.DEFAULT_PLANS[slug].canUseAdvancedCandidateSearch),
        canUseLeadDashboard: getBoolean(raw.canUseLeadDashboard, config_1.DEFAULT_PLANS[slug].canUseLeadDashboard),
        slug,
    };
}
async function resolveCompanyPlan(companyId, company) {
    const subSnap = await config_1.db.collection('subscriptions')
        .where('companyId', '==', companyId)
        .get();
    const activePlan = getBestActiveSubscriptionPlan(subSnap.docs.map((docSnap) => docSnap.data()));
    if (activePlan) {
        return activePlan;
    }
    if ((company.subscriptionStatus === 'active' || company.subscriptionStatus === 'pending_renewal') &&
        company.subscriptionPlan &&
        isFutureDate(company.subscriptionEndsAt)) {
        return normalizePlanSlug(getString(company.subscriptionPlan, 'free'));
    }
    if (company.plan)
        return normalizePlanSlug(getString(company.plan, 'free'));
    if (company.isPremium === true)
        return 'premium';
    return 'free';
}
async function resolveCompanyPlanState(companyId, company) {
    const subSnap = await config_1.db.collection('subscriptions')
        .where('companyId', '==', companyId)
        .get();
    const state = getBestSubscriptionPlanState(subSnap.docs.map((docSnap) => docSnap.data()));
    if (state)
        return state;
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
    if (company.isPremium === true)
        return { plan: 'premium', status: 'active' };
    return { plan: 'free', status: 'active' };
}
async function resolveUserPlanState(userId) {
    const subSnap = await config_1.db.collection('subscriptions')
        .where('userId', '==', userId)
        .get();
    return getBestSubscriptionPlanState(subSnap.docs.map((docSnap) => docSnap.data())) ||
        { plan: 'free', status: 'active' };
}
function getBestActiveSubscriptionPlan(subscriptions) {
    const now = Date.now();
    let best = null;
    for (const subscription of subscriptions) {
        const status = getString(subscription.status, 'active');
        if (status !== 'active' && status !== 'pending_renewal')
            continue;
        const expiry = getDate(subscription.endDate);
        if (expiry && expiry.getTime() < now)
            continue;
        const plan = normalizePlanSlug(getString(subscription.plan || subscription.planName, 'free'));
        if (!best || config_1.PLAN_RANK[plan] > config_1.PLAN_RANK[best]) {
            best = plan;
        }
    }
    return best;
}
function getBestSubscriptionPlanState(subscriptions) {
    let bestActive = null;
    let bestInactive = null;
    for (const subscription of subscriptions) {
        const status = getEffectiveSubscriptionStatus(subscription);
        const plan = normalizePlanSlug(getString(subscription.plan || subscription.planName, 'free'));
        const state = { plan, status };
        if (hasActiveSubscriptionBenefits(status)) {
            if (!bestActive || config_1.PLAN_RANK[plan] > config_1.PLAN_RANK[bestActive.plan]) {
                bestActive = state;
            }
            continue;
        }
        if (!bestInactive || config_1.PLAN_RANK[plan] > config_1.PLAN_RANK[bestInactive.plan]) {
            bestInactive = state;
        }
    }
    if (bestActive)
        return bestActive;
    if (bestInactive)
        return { plan: 'free', status: bestInactive.status };
    return null;
}
function getEffectiveSubscriptionStatus(subscription) {
    const rawStatus = getString(subscription.status, 'active');
    if (rawStatus === 'cancelled')
        return 'cancelled';
    const expiry = getDate(subscription.endDate);
    if (expiry) {
        const daysUntilExpiry = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0)
            return 'expired';
        if (daysUntilExpiry <= 30)
            return 'pending_renewal';
    }
    if (rawStatus === 'expired')
        return 'expired';
    if (rawStatus === 'pending_renewal')
        return 'pending_renewal';
    return 'active';
}
function hasActiveSubscriptionBenefits(status) {
    return status === 'active' || status === 'pending_renewal';
}
async function expireSubscription(path, data) {
    const ref = config_1.db.doc(path);
    await ref.set({
        status: 'expired',
        expiredAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    await syncSubscriptionStatus(data, 'expired');
    await createSubscriptionNotification({
        userId: getString(data.userId),
        title: 'Subscription expired',
        message: `${getString(data.planName, 'Your plan')} has expired. Renew to restore plan benefits.`,
        actionUrl: getString(data.audience) === 'seeker' ? '/seeker/subscription' : '/employer/billing',
    });
}
async function syncSubscriptionStatus(data, status) {
    const companyId = getString(data.companyId);
    const userId = getString(data.userId);
    const plan = normalizePlanSlug(getString(data.plan, 'free'));
    const isExpired = status === 'expired' || status === 'cancelled';
    if (companyId) {
        await config_1.db.doc(`companies/${companyId}`).set({
            isPremium: !isExpired && (plan === 'premium' || plan === 'enterprise'),
            subscriptionStatus: status,
            ...(isExpired ? { subscriptionPlan: 'free' } : { subscriptionPlan: plan }),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    if (userId && getString(data.audience) === 'seeker') {
        await config_1.db.doc(`seekerProfiles/${userId}`).set({
            isPremium: !isExpired && (plan === 'premium' || plan === 'enterprise'),
            subscriptionStatus: status,
            ...(isExpired ? { subscriptionPlan: 'free' } : { subscriptionPlan: plan }),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
}
async function createSubscriptionNotification(data) {
    if (!data.userId)
        return;
    await config_1.db.collection('notifications').add({
        userId: data.userId,
        type: 'subscription',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        read: false,
        isRead: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
function featureAllowed(limits, feature) {
    if (feature === 'featured_job')
        return limits.canUseFeaturedJobs;
    if (feature === 'urgent_job')
        return limits.canUseUrgentJobs;
    if (feature === 'premium_badge')
        return limits.canUsePremiumBadge;
    if (feature === 'advanced_candidate_search')
        return limits.canUseAdvancedCandidateSearch;
    if (feature === 'lead_dashboard')
        return limits.canUseLeadDashboard;
    return true;
}
async function countOpenJobs(companyId) {
    const snap = await config_1.db.collection('jobs')
        .where('companyId', '==', companyId)
        .where('status', '==', 'active')
        .get();
    return snap.docs.filter((job) => {
        const data = job.data();
        return data.isActive === true && !isPastDate(data.expiresAt);
    }).length;
}
async function hasDuplicateJob(companyId, normalizedTitle, location) {
    const snap = await config_1.db.collection('jobs')
        .where('companyId', '==', companyId)
        .where('normalizedTitle', '==', normalizedTitle)
        .limit(20)
        .get();
    return snap.docs.some((job) => {
        const data = job.data();
        const status = getString(data.status, data.isActive ? 'active' : 'pending');
        if (!['pending', 'active', 'paused', 'reported'].includes(status))
            return false;
        if (isPastDate(data.expiresAt))
            return false;
        return getString(data.location) === location;
    });
}
function normaliseDuplicateKey(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function detectSpamFlags(input) {
    const text = `${input.title} ${input.description}`.toLowerCase();
    const flags = [];
    const bannedTerms = ['work from home earn daily', 'registration fee', 'pay first', 'quick money'];
    const urlCount = (text.match(/https?:\/\//g) || []).length;
    if (bannedTerms.some((term) => text.includes(term)))
        flags.push('spam_terms');
    if (urlCount > 2)
        flags.push('too_many_links');
    if (input.title.length > 0 && input.title === input.title.toUpperCase() && input.title.length > 18) {
        flags.push('all_caps_title');
    }
    if (input.description.length < 40)
        flags.push('thin_description');
    return flags;
}
function getWalkInPayload(data) {
    if (!getBoolean(data.isWalkIn))
        return {};
    const walkIn = typeof data.walkIn === 'object' && data.walkIn !== null
        ? data.walkIn
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
function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
function isPastDate(value) {
    const date = getDate(value);
    return !!date && date.getTime() < Date.now();
}
async function createJobNotification(data) {
    if (!data.userId)
        return;
    await config_1.db.collection('notifications').add({
        userId: data.userId,
        type: 'job_alert',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        read: false,
        isRead: false,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}
function normalizePlanSlug(value) {
    const normalized = value.toLowerCase().replace(/\s+plan$/, '').trim();
    if (normalized === 'basic' || normalized === 'premium' || normalized === 'enterprise') {
        return normalized;
    }
    return 'free';
}
function isUnlimited(value) {
    return value < 0 || !Number.isFinite(value);
}
function getRequiredString(value, field) {
    const text = getString(value);
    if (!text) {
        throw new https_1.HttpsError('invalid-argument', `${field} is required.`);
    }
    return text;
}
function getString(value, fallback = '') {
    return typeof value === 'string' ? value.trim() : fallback;
}
function getStringArray(value) {
    return Array.isArray(value)
        ? value.map((item) => getString(item)).filter((item) => item.length > 0)
        : [];
}
function getBoolean(value, fallback = false) {
    return typeof value === 'boolean' ? value : fallback;
}
function getNumber(value, fallback) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed))
            return parsed;
    }
    return fallback;
}
function getNullableNumber(value) {
    if (value === null || value === undefined || value === '')
        return null;
    const parsed = getNumber(value, Number.NaN);
    return Number.isFinite(parsed) ? parsed : null;
}
function getDate(value) {
    if (!value)
        return null;
    if (value instanceof Date)
        return value;
    if (value instanceof firestore_1.Timestamp)
        return value.toDate();
    if (typeof value === 'object' && value !== null) {
        const raw = value;
        if (typeof raw.toDate === 'function')
            return raw.toDate();
        if (typeof raw.seconds === 'number')
            return new Date(raw.seconds * 1000);
    }
    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    return null;
}
function isFutureDate(value) {
    const date = getDate(value);
    return !!date && date.getTime() >= Date.now();
}
function getNumberArray(value) {
    return Array.isArray(value)
        ? value.map((item) => getNumber(item, Number.NaN)).filter((item) => Number.isFinite(item))
        : [];
}
function slugify(value) {
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
async function hasVerifiedEmployerAccessServer(uid) {
    const userSnap = await config_1.db.doc(`users/${uid}`).get();
    if (!userSnap.exists)
        return false;
    const userData = userSnap.data();
    if (userData.employerVerified === true || userData.companyVerified === true) {
        return true;
    }
    const companyId = userData.companyId;
    if (companyId) {
        const companySnap = await config_1.db.doc(`companies/${companyId}`).get();
        if (companySnap.exists) {
            const companyData = companySnap.data();
            if (companyData.ownerId === uid &&
                companyData.isActive !== false &&
                (companyData.verificationStatus === 'verified' ||
                    companyData.status === 'approved' ||
                    companyData.isVerified === true)) {
                return true;
            }
        }
    }
    return false;
}
async function isPremiumCompanyOwnerServer(uid) {
    const userSnap = await config_1.db.doc(`users/${uid}`).get();
    if (!userSnap.exists)
        return false;
    const userData = userSnap.data();
    const companyId = userData.companyId;
    if (companyId) {
        const companySnap = await config_1.db.doc(`companies/${companyId}`).get();
        if (companySnap.exists) {
            const companyData = companySnap.data();
            if (companyData.ownerId === uid && companyData.isPremium === true) {
                return true;
            }
        }
    }
    return false;
}
//# sourceMappingURL=helpers.js.map