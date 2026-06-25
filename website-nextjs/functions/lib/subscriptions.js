"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPayment = exports.createRazorpayOrder = exports.processSubscriptionAutomation = exports.validateSubscriptionAccess = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const crypto = __importStar(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const config_1 = require("./config");
const helpers = __importStar(require("./helpers"));
const SERVER_PLAN_CONFIGS = {
    free: { price: 0, name: 'Free Plan' },
    basic: { price: 499, name: 'Basic Plan' },
    premium: { price: 999, name: 'Premium Plan' },
    enterprise: { price: 5000, name: 'Enterprise Plan' },
};
const { requireUid, checkRateLimit, getString, getPlanConfigs, resolveCompanyPlanState, resolveUserPlanState, featureAllowed, expireSubscription, syncSubscriptionStatus, createSubscriptionNotification, hasActiveSubscriptionBenefits, getDate, getNumberArray } = helpers;
exports.validateSubscriptionAccess = (0, https_1.onCall)({ region: config_1.REGION, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request);
    const companyId = getString(request.data.companyId);
    const feature = getString(request.data.feature);
    const plans = await getPlanConfigs();
    let plan = 'free';
    let subscriptionStatus = 'active';
    if (companyId) {
        const companySnap = await config_1.db.doc(`companies/${companyId}`).get();
        const company = companySnap.data();
        if (!company) {
            throw new https_1.HttpsError('not-found', 'Company profile not found.');
        }
        if (company.ownerId !== uid) {
            throw new https_1.HttpsError('permission-denied', 'You can only validate your own company subscription.');
        }
        const state = await resolveCompanyPlanState(companyId, company);
        plan = state.plan;
        subscriptionStatus = state.status;
    }
    else {
        const state = await resolveUserPlanState(uid);
        plan = state.plan;
        subscriptionStatus = state.status;
    }
    const effectivePlan = hasActiveSubscriptionBenefits(subscriptionStatus) ? plan : 'free';
    const limits = plans[effectivePlan];
    return {
        plan: effectivePlan,
        status: subscriptionStatus,
        limits,
        allowed: feature ? featureAllowed(limits, feature) : true,
    };
});
// ============================================================
// EXISTING: createNotification (preserved)
// ============================================================
exports.processSubscriptionAutomation = (0, scheduler_1.onSchedule)({
    region: config_1.REGION,
    schedule: 'every 24 hours',
    timeZone: 'Asia/Kolkata',
}, async () => {
    const now = new Date();
    const snapshot = await config_1.db.collection('subscriptions')
        .where('status', 'in', ['active', 'pending_renewal'])
        .get();
    firebase_functions_1.logger.info('Processing subscription automation.', { count: snapshot.size });
    for (const subscription of snapshot.docs) {
        const data = subscription.data();
        const expiry = getDate(data.endDate);
        if (!expiry)
            continue;
        const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const reminderDaysSent = getNumberArray(data.expiryReminderDaysSent);
        const updates = {
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (daysUntilExpiry < 0) {
            await expireSubscription(subscription.ref.path, data);
            continue;
        }
        if (daysUntilExpiry <= 30 && data.status === 'active') {
            updates.status = 'pending_renewal';
            await syncSubscriptionStatus(data, 'pending_renewal');
        }
        for (const reminderDay of config_1.REMINDER_DAYS) {
            if (daysUntilExpiry <= reminderDay && daysUntilExpiry >= 0 && !reminderDaysSent.includes(reminderDay)) {
                await createSubscriptionNotification({
                    userId: getString(data.userId),
                    title: `Subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`,
                    message: `${getString(data.planName, 'Your plan')} expires on ${expiry.toLocaleDateString('en-IN')}. Renew to keep benefits active.`,
                    actionUrl: getString(data.audience) === 'seeker' ? '/seeker/subscription' : '/employer/billing',
                });
                reminderDaysSent.push(reminderDay);
            }
        }
        updates.expiryReminderDaysSent = reminderDaysSent;
        await subscription.ref.set(updates, { merge: true });
    }
});
exports.createRazorpayOrder = (0, https_1.onCall)({ region: config_1.REGION, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request);
    await checkRateLimit(uid, 'razorpay_order', 5, 10);
    const planSlug = getString(request.data?.planSlug);
    const audience = getString(request.data?.audience);
    const companyId = getString(request.data?.companyId);
    if (planSlug !== 'basic' && planSlug !== 'premium' && planSlug !== 'enterprise') {
        throw new https_1.HttpsError('invalid-argument', 'Invalid plan slug. Only basic, premium, and enterprise are supported.');
    }
    if (audience !== 'seeker' && audience !== 'employer') {
        throw new https_1.HttpsError('invalid-argument', 'Invalid audience. Must be seeker or employer.');
    }
    const planConfig = SERVER_PLAN_CONFIGS[planSlug];
    const amount = planConfig.price;
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!keyId || !keySecret || keyId === 'mock_key_id') {
        const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
        firebase_functions_1.logger.info(`Running createRazorpayOrder in MOCK mode for user ${uid}, plan ${planSlug}`);
        // Persist order metadata so webhook can resolve context
        await config_1.db.doc(`razorpayOrders/${mockOrderId}`).set({
            orderId: mockOrderId,
            userId: uid,
            planSlug,
            audience,
            ...(companyId ? { companyId } : {}),
            amount: amount * 100,
            currency: 'INR',
            status: 'created',
            mockMode: true,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return {
            orderId: mockOrderId,
            amount: amount * 100,
            currency: 'INR',
            keyId: 'mock_key_id',
            mockMode: true,
        };
    }
    try {
        const razorpay = new razorpay_1.default({
            key_id: keyId,
            key_secret: keySecret,
        });
        const receiptId = `rcpt_${uid.substring(0, 8)}_${Date.now()}`;
        const order = await razorpay.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: receiptId,
        });
        // Persist order metadata so webhook can resolve context
        await config_1.db.doc(`razorpayOrders/${order.id}`).set({
            orderId: order.id,
            userId: uid,
            planSlug,
            audience,
            ...(companyId ? { companyId } : {}),
            amount: order.amount,
            currency: order.currency,
            receipt: receiptId,
            status: 'created',
            mockMode: false,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId,
            mockMode: false,
        };
    }
    catch (err) {
        firebase_functions_1.logger.error('Error creating Razorpay order:', err);
        throw new https_1.HttpsError('internal', err?.message || 'Error creating Razorpay order');
    }
});
exports.verifyRazorpayPayment = (0, https_1.onCall)({ region: config_1.REGION, enforceAppCheck: false }, async (request) => {
    const uid = requireUid(request);
    await checkRateLimit(uid, 'razorpay_verify', 3, 5);
    const paymentId = getString(request.data?.razorpay_payment_id);
    const orderId = getString(request.data?.razorpay_order_id);
    const signature = getString(request.data?.razorpay_signature);
    const planSlug = getString(request.data?.planSlug);
    const audience = getString(request.data?.audience);
    const companyId = getString(request.data?.companyId);
    if (!paymentId || !orderId || (!signature && !orderId.startsWith('order_mock_'))) {
        throw new https_1.HttpsError('invalid-argument', 'Missing payment credentials.');
    }
    if (planSlug !== 'basic' && planSlug !== 'premium') {
        throw new https_1.HttpsError('invalid-argument', 'Invalid plan slug.');
    }
    if (audience !== 'seeker' && audience !== 'employer') {
        throw new https_1.HttpsError('invalid-argument', 'Invalid audience.');
    }
    const planConfig = SERVER_PLAN_CONFIGS[planSlug];
    const amount = planConfig.price;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    const isMock = isEmulator && orderId.startsWith('order_mock_');
    if (!isMock) {
        if (!keySecret) {
            firebase_functions_1.logger.error('RAZORPAY_KEY_SECRET environment variable is missing.');
            throw new https_1.HttpsError('failed-precondition', 'Razorpay signature verification is misconfigured.');
        }
        const hmac = crypto.createHmac('sha256', keySecret);
        hmac.update(`${orderId}|${paymentId}`);
        const generated_signature = hmac.digest('hex');
        if (generated_signature !== signature) {
            firebase_functions_1.logger.error(`Signature verification failed for user ${uid}. Order: ${orderId}, Payment: ${paymentId}`);
            throw new https_1.HttpsError('permission-denied', 'Payment signature verification failed.');
        }
    }
    else {
        firebase_functions_1.logger.info(`Bypassing signature verification (MOCK mode) for user ${uid}. Order: ${orderId}`);
    }
    try {
        const planName = planConfig.name;
        const subscriptionId = companyId ? `${companyId}_${planSlug}` : `${uid}_${planSlug}`;
        const result = await config_1.db.runTransaction(async (transaction) => {
            const orderRef = config_1.db.doc(`razorpayOrders/${orderId}`);
            const orderSnap = await transaction.get(orderRef);
            const orderData = orderSnap.data();
            // If order already processed, return success (idempotent)
            if (orderData && orderData.status === 'paid') {
                return { success: true, alreadyProcessed: true };
            }
            const userRef = config_1.db.doc(`users/${uid}`);
            const userSnap = await transaction.get(userRef);
            const userData = userSnap.data() || {};
            const requesterName = getString(userData.displayName || userData.email || (audience === 'seeker' ? 'Candidate' : 'Business'));
            const email = getString(userData.email);
            const mobile = getString(userData.phone);
            let companyName = audience === 'seeker' ? 'Job Seeker' : 'Company';
            if (companyId) {
                const companyRef = config_1.db.doc(`companies/${companyId}`);
                const companySnap = await transaction.get(companyRef);
                if (companySnap.exists) {
                    const compData = companySnap.data() || {};
                    companyName = getString(compData.name || compData.businessName || compData.companyName || 'Business');
                }
            }
            const now = new Date();
            const endDate = new Date(now);
            endDate.setFullYear(now.getFullYear() + 1);
            const subscriptionRef = config_1.db.doc(`subscriptions/${subscriptionId}`);
            transaction.set(subscriptionRef, {
                userId: uid,
                ...(companyId ? { companyId } : {}),
                audience,
                userName: requesterName,
                companyName,
                businessName: companyName,
                email,
                mobile,
                plan: planSlug,
                planName,
                amount,
                period: 'year',
                status: 'active',
                startDate: firestore_1.Timestamp.fromDate(now),
                endDate: firestore_1.Timestamp.fromDate(endDate),
                paymentDate: firestore_1.Timestamp.fromDate(now),
                autoRenew: false,
                paymentMethod: isMock ? 'mock_razorpay' : 'razorpay',
                paymentRequestId: paymentId,
                expiryReminderDaysSent: [],
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            const paymentRef = config_1.db.collection('payments').doc();
            transaction.set(paymentRef, {
                userId: uid,
                ...(companyId ? { companyId } : {}),
                audience,
                userName: requesterName,
                businessName: companyName,
                companyName,
                plan: planName,
                planSlug,
                period: 'year',
                paymentMethod: isMock ? 'mock_razorpay' : 'razorpay',
                amount,
                status: 'approved',
                paymentRequestId: paymentId,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
            if (audience === 'employer' && companyId) {
                const companyRef = config_1.db.doc(`companies/${companyId}`);
                transaction.update(companyRef, {
                    isPremium: planSlug === 'premium',
                    subscriptionPlan: planSlug,
                    subscriptionStatus: 'active',
                    subscriptionStartsAt: firestore_1.Timestamp.fromDate(now),
                    subscriptionEndsAt: firestore_1.Timestamp.fromDate(endDate),
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                });
            }
            if (audience === 'seeker') {
                const seekerRef = config_1.db.doc(`seekerProfiles/${uid}`);
                transaction.set(seekerRef, {
                    isPremium: planSlug === 'premium',
                    premiumPlan: planSlug,
                    premiumUntil: firestore_1.Timestamp.fromDate(endDate),
                    subscriptionPlan: planSlug,
                    subscriptionStatus: 'active',
                    updatedAt: firestore_1.FieldValue.serverTimestamp(),
                }, { merge: true });
            }
            // Update the order doc status to paid
            transaction.set(orderRef, {
                status: 'paid',
                paymentId: paymentId,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            return { success: true, alreadyProcessed: false };
        });
        if (result.success && !result.alreadyProcessed) {
            await config_1.db.collection('activityLogs').add({
                userId: uid,
                action: 'verify_razorpay_payment',
                target: `Subscription: ${subscriptionId}`,
                targetId: subscriptionId,
                targetType: 'subscription',
                details: `Upgraded to ${planName}`,
                timestamp: firestore_1.FieldValue.serverTimestamp(),
                createdAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        firebase_functions_1.logger.info(`Successful upgrade to ${planSlug} for user ${uid}. Subscription ID: ${subscriptionId}`);
        return { success: true };
    }
    catch (err) {
        firebase_functions_1.logger.error('Error writing subscription documents:', err);
        throw new https_1.HttpsError('internal', err?.message || 'Error writing subscription documents');
    }
});
//# sourceMappingURL=subscriptions.js.map