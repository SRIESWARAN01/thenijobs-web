import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { db, REGION, REMINDER_DAYS } from './config';
import { PlanSlug, SubscriptionStatus, ValidateSubscriptionAccessData, CreateRazorpayOrderData } from './types';
import * as helpers from './helpers';

const SERVER_PLAN_CONFIGS = {
  free: { price: 0, name: 'Free Plan' },
  basic: { price: 499, name: 'Basic Plan' },
  premium: { price: 999, name: 'Premium Plan' },
  enterprise: { price: 5000, name: 'Enterprise Plan' },
} as const;

const {
  requireUid, checkRateLimit, getString,
  getPlanConfigs, resolveCompanyPlanState,
  resolveUserPlanState, featureAllowed, expireSubscription,
  syncSubscriptionStatus, createSubscriptionNotification,
  hasActiveSubscriptionBenefits, getDate, getNumberArray
} = helpers;

export const validateSubscriptionAccess = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<ValidateSubscriptionAccessData>) => {
    const uid = requireUid(request);
    const companyId = getString(request.data.companyId);
    const feature = getString(request.data.feature);
    const plans = await getPlanConfigs();

    let plan: PlanSlug = 'free';
    let subscriptionStatus: SubscriptionStatus = 'active';
    if (companyId) {
      const companySnap = await db.doc(`companies/${companyId}`).get();
      const company = companySnap.data();
      if (!company) {
        throw new HttpsError('not-found', 'Company profile not found.');
      }
      if (company.ownerId !== uid) {
        throw new HttpsError('permission-denied', 'You can only validate your own company subscription.');
      }
      const state = await resolveCompanyPlanState(companyId, company);
      plan = state.plan;
      subscriptionStatus = state.status;
    } else {
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
  },
);

// ============================================================
// EXISTING: createNotification (preserved)
// ============================================================


export const processSubscriptionAutomation = onSchedule(
  {
    region: REGION,
    schedule: 'every 24 hours',
    timeZone: 'Asia/Kolkata',
  },
  async () => {
    const now = new Date();
    const snapshot = await db.collection('subscriptions')
      .where('status', 'in', ['active', 'pending_renewal'])
      .get();

    logger.info('Processing subscription automation.', { count: snapshot.size });

    for (const subscription of snapshot.docs) {
      const data = subscription.data();
      const expiry = getDate(data.endDate);
      if (!expiry) continue;

      const daysUntilExpiry = Math.ceil(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const reminderDaysSent = getNumberArray(data.expiryReminderDaysSent);
      const updates: Record<string, unknown> = {
        daysRemaining: Math.max(0, daysUntilExpiry),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (daysUntilExpiry < 0) {
        await expireSubscription(subscription.ref.path, data);
        continue;
      }

      if (daysUntilExpiry <= 30 && data.status === 'active') {
        updates.status = 'pending_renewal';
        await syncSubscriptionStatus(data, 'pending_renewal');
      }

      for (const reminderDay of REMINDER_DAYS) {
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
  },
);


export const createRazorpayOrder = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<CreateRazorpayOrderData>) => {
    const uid = requireUid(request);
    await checkRateLimit(uid, 'razorpay_order', 5, 10);
    const planSlug = getString(request.data?.planSlug);
    const audience = getString(request.data?.audience) as 'seeker' | 'employer';
    const companyId = getString(request.data?.companyId);

    if (planSlug !== 'basic' && planSlug !== 'premium' && planSlug !== 'enterprise') {
      throw new HttpsError('invalid-argument', 'Invalid plan slug. Only basic, premium, and enterprise are supported.');
    }
    if (audience !== 'seeker' && audience !== 'employer') {
      throw new HttpsError('invalid-argument', 'Invalid audience. Must be seeker or employer.');
    }

    const planConfig = SERVER_PLAN_CONFIGS[planSlug as keyof typeof SERVER_PLAN_CONFIGS];
    const amount = planConfig.price;

    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keyId || !keySecret || keyId === 'mock_key_id') {
      const mockOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
      logger.info(`Running createRazorpayOrder in MOCK mode for user ${uid}, plan ${planSlug}`);

      // Persist order metadata so webhook can resolve context
      await db.doc(`razorpayOrders/${mockOrderId}`).set({
        orderId: mockOrderId,
        userId: uid,
        planSlug,
        audience,
        ...(companyId ? { companyId } : {}),
        amount: amount * 100,
        currency: 'INR',
        status: 'created',
        mockMode: true,
        createdAt: FieldValue.serverTimestamp(),
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
      const razorpay = new Razorpay({
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
      await db.doc(`razorpayOrders/${order.id}`).set({
        orderId: order.id,
        userId: uid,
        planSlug,
        audience,
        ...(companyId ? { companyId } : {}),
        amount: order.amount,
        currency: order.currency as string,
        receipt: receiptId,
        status: 'created',
        mockMode: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        mockMode: false,
      };
    } catch (err: any) {
      logger.error('Error creating Razorpay order:', err);
      throw new HttpsError('internal', err?.message || 'Error creating Razorpay order');
    }
  }
);

interface VerifyRazorpayPaymentData {
  razorpay_payment_id?: unknown;
  razorpay_order_id?: unknown;
  razorpay_signature?: unknown;
  planSlug?: unknown;
  audience?: unknown;
  companyId?: unknown;
}

export const verifyRazorpayPayment = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<VerifyRazorpayPaymentData>) => {
    const uid = requireUid(request);
    await checkRateLimit(uid, 'razorpay_verify', 3, 5);
    
    const paymentId = getString(request.data?.razorpay_payment_id);
    const orderId = getString(request.data?.razorpay_order_id);
    const signature = getString(request.data?.razorpay_signature);
    const planSlug = getString(request.data?.planSlug);
    const audience = getString(request.data?.audience) as 'seeker' | 'employer';
    const companyId = getString(request.data?.companyId);

    if (!paymentId || !orderId || (!signature && !orderId.startsWith('order_mock_'))) {
      throw new HttpsError('invalid-argument', 'Missing payment credentials.');
    }
    if (planSlug !== 'basic' && planSlug !== 'premium') {
      throw new HttpsError('invalid-argument', 'Invalid plan slug.');
    }
    if (audience !== 'seeker' && audience !== 'employer') {
      throw new HttpsError('invalid-argument', 'Invalid audience.');
    }

    const planConfig = SERVER_PLAN_CONFIGS[planSlug as keyof typeof SERVER_PLAN_CONFIGS];
    const amount = planConfig.price;

    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    const isMock = isEmulator && orderId.startsWith('order_mock_');

    if (!isMock) {
      if (!keySecret) {
        logger.error('RAZORPAY_KEY_SECRET environment variable is missing.');
        throw new HttpsError('failed-precondition', 'Razorpay signature verification is misconfigured.');
      }
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      const generated_signature = hmac.digest('hex');

      if (generated_signature !== signature) {
        logger.error(`Signature verification failed for user ${uid}. Order: ${orderId}, Payment: ${paymentId}`);
        throw new HttpsError('permission-denied', 'Payment signature verification failed.');
      }
    } else {
      logger.info(`Bypassing signature verification (MOCK mode) for user ${uid}. Order: ${orderId}`);
    }

    try {
      const planName = planConfig.name;
      const subscriptionId = companyId ? `${companyId}_${planSlug}` : `${uid}_${planSlug}`;

      const result = await db.runTransaction(async (transaction) => {
        const orderRef = db.doc(`razorpayOrders/${orderId}`);
        const orderSnap = await transaction.get(orderRef);
        const orderData = orderSnap.data();

        // If order already processed, return success (idempotent)
        if (orderData && orderData.status === 'paid') {
          return { success: true, alreadyProcessed: true };
        }

        const userRef = db.doc(`users/${uid}`);
        const userSnap = await transaction.get(userRef);
        const userData = userSnap.data() || {};
        const requesterName = getString(userData.displayName || userData.email || (audience === 'seeker' ? 'Candidate' : 'Business'));
        const email = getString(userData.email);
        const mobile = getString(userData.phone);

        let companyName = audience === 'seeker' ? 'Job Seeker' : 'Company';
        if (companyId) {
          const companyRef = db.doc(`companies/${companyId}`);
          const companySnap = await transaction.get(companyRef);
          if (companySnap.exists) {
            const compData = companySnap.data() || {};
            companyName = getString(compData.name || compData.businessName || compData.companyName || 'Business');
          }
        }

        const now = new Date();
        const endDate = new Date(now);
        endDate.setFullYear(now.getFullYear() + 1);

        const subscriptionRef = db.doc(`subscriptions/${subscriptionId}`);
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
          startDate: Timestamp.fromDate(now),
          endDate: Timestamp.fromDate(endDate),
          paymentDate: Timestamp.fromDate(now),
          autoRenew: false,
          paymentMethod: isMock ? 'mock_razorpay' : 'razorpay',
          paymentRequestId: paymentId,
          expiryReminderDaysSent: [],
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        const paymentRef = db.collection('payments').doc();
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
          createdAt: FieldValue.serverTimestamp(),
        });

        if (audience === 'employer' && companyId) {
          const companyRef = db.doc(`companies/${companyId}`);
          transaction.update(companyRef, {
            isPremium: planSlug === 'premium',
            subscriptionPlan: planSlug,
            subscriptionStatus: 'active',
            subscriptionStartsAt: Timestamp.fromDate(now),
            subscriptionEndsAt: Timestamp.fromDate(endDate),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        if (audience === 'seeker') {
          const seekerRef = db.doc(`seekerProfiles/${uid}`);
          transaction.set(seekerRef, {
            isPremium: planSlug === 'premium',
            premiumPlan: planSlug,
            premiumUntil: Timestamp.fromDate(endDate),
            subscriptionPlan: planSlug,
            subscriptionStatus: 'active',
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true });
        }

        // Update the order doc status to paid
        transaction.set(orderRef, {
          status: 'paid',
          paymentId: paymentId,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        return { success: true, alreadyProcessed: false };
      });

      if (result.success && !result.alreadyProcessed) {
        await db.collection('activityLogs').add({
          userId: uid,
          action: 'verify_razorpay_payment',
          target: `Subscription: ${subscriptionId}`,
          targetId: subscriptionId,
          targetType: 'subscription',
          details: `Upgraded to ${planName}`,
          timestamp: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      logger.info(`Successful upgrade to ${planSlug} for user ${uid}. Subscription ID: ${subscriptionId}`);
      return { success: true };
    } catch (err: any) {
      logger.error('Error writing subscription documents:', err);
      throw new HttpsError('internal', err?.message || 'Error writing subscription documents');
    }
  }
);

export const createAdOrder = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<any>) => {
    const uid = requireUid(request);
    await checkRateLimit(uid, 'ad_order_create', 5, 10);
    
    const planId = getString(request.data?.planId);
    const targetId = getString(request.data?.targetId);
    const placement = getString(request.data?.placement) as 'job' | 'product' | 'service';
    const companyId = getString(request.data?.companyId);

    if (!planId || !targetId || !placement) {
      throw new HttpsError('invalid-argument', 'Missing required parameters.');
    }

    // Resolve plan pricing
    let amount = 100;
    if (planId === 'ad_premium') {
      amount = 250;
    } else if (planId === 'ad_featured') {
      amount = 500;
    }

    const keyId = process.env.RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    // If Razorpay keys are not configured, run in mock mode
    if (!keyId || !keySecret || keyId === 'mock_key_id') {
      const mockOrderId = `order_mock_ad_${Math.random().toString(36).substring(2, 11)}`;
      logger.info(`[MOCK AD] Creating order for user ${uid}, plan ${planId}`);

      await db.doc(`razorpayOrders/${mockOrderId}`).set({
        orderId: mockOrderId,
        userId: uid,
        planId,
        targetId,
        placement,
        amount: amount * 100,
        currency: 'INR',
        status: 'created',
        mockMode: true,
        type: 'advertisement',
        ...(companyId ? { companyId } : {}),
        createdAt: FieldValue.serverTimestamp(),
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
      const razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });

      const receiptId = `rcpt_ad_${uid.substring(0, 5)}_${Date.now()}`;
      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: receiptId,
      });

      await db.doc(`razorpayOrders/${order.id}`).set({
        orderId: order.id,
        userId: uid,
        planId,
        targetId,
        placement,
        amount: order.amount,
        currency: order.currency as string,
        receipt: receiptId,
        status: 'created',
        mockMode: false,
        type: 'advertisement',
        ...(companyId ? { companyId } : {}),
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        mockMode: false,
      };
    } catch (err: any) {
      logger.error('Error creating Ad Razorpay order:', err);
      throw new HttpsError('internal', err?.message || 'Error creating Razorpay order');
    }
  }
);

export const verifyAdPayment = onCall(
  { region: REGION, enforceAppCheck: false },
  async (request: CallableRequest<any>) => {
    const uid = requireUid(request);
    await checkRateLimit(uid, 'ad_payment_verify', 3, 5);

    const paymentId = getString(request.data?.razorpay_payment_id);
    const orderId = getString(request.data?.razorpay_order_id);
    const signature = getString(request.data?.razorpay_signature);
    const planId = getString(request.data?.planId);
    const targetId = getString(request.data?.targetId);
    const placement = getString(request.data?.placement) as 'job' | 'product' | 'service';
    const companyId = getString(request.data?.companyId);

    if (!paymentId || !orderId || (!signature && !orderId.startsWith('order_mock_ad_'))) {
      throw new HttpsError('invalid-argument', 'Missing signature parameters.');
    }

    const isMock = orderId.startsWith('order_mock_ad_');
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!isMock) {
      if (!keySecret) {
        throw new HttpsError('failed-precondition', 'Razorpay signature verification is misconfigured.');
      }
      const hmac = crypto.createHmac('sha256', keySecret);
      hmac.update(`${orderId}|${paymentId}`);
      const generated_signature = hmac.digest('hex');

      if (generated_signature !== signature) {
        throw new HttpsError('permission-denied', 'Payment signature verification failed.');
      }
    }

    try {
      const result = await db.runTransaction(async (transaction) => {
        const orderRef = db.doc(`razorpayOrders/${orderId}`);
        const orderSnap = await transaction.get(orderRef);
        const orderData = orderSnap.data();

        if (orderData && orderData.status === 'paid') {
          return { success: true, alreadyProcessed: true };
        }

        // Mark order as paid
        transaction.set(orderRef, { status: 'paid', paymentId }, { merge: true });

        // Resolve plan days
        let days = 7;
        let amount = 100;
        if (planId === 'ad_premium') {
          days = 30;
          amount = 250;
        } else if (planId === 'ad_featured') {
          days = 90;
          amount = 500;
        }

        const now = new Date();
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        // Fetch company name
        let companyName = 'My Business';
        if (companyId) {
          const companyRef = db.doc(`companies/${companyId}`);
          const companySnap = await transaction.get(companyRef);
          if (companySnap.exists) {
            companyName = companySnap.data()?.name || companyName;
          }
        }

        // Resolve target document titles and names
        let targetTitle = '';
        let collectionName = '';
        if (placement === 'job') {
          const ref = db.doc(`jobs/${targetId}`);
          const snap = await transaction.get(ref);
          targetTitle = snap.data()?.title || 'Job Post';
          collectionName = 'jobs';
        } else if (placement === 'product') {
          const ref = db.doc(`products/${targetId}`);
          const snap = await transaction.get(ref);
          targetTitle = snap.data()?.name || 'Product';
          collectionName = 'products';
        } else {
          const ref = db.doc(`services/${targetId}`);
          const snap = await transaction.get(ref);
          targetTitle = snap.data()?.title || 'Service';
          collectionName = 'services';
        }

        // Update target listing document
        if (collectionName) {
          const ref = db.doc(`${collectionName}/${targetId}`);
          transaction.update(ref, {
            isPromoted: true,
            promotedUntil: Timestamp.fromDate(endDate),
            promotedAt: FieldValue.serverTimestamp(),
            promotionScore: planId === 'ad_featured' ? 300 : planId === 'ad_premium' ? 200 : 100
          });
        }

        // Create transaction history document
        const transactionRef = db.collection('adTransactions').doc();
        transaction.set(transactionRef, {
          userId: uid,
          companyId: companyId || '',
          companyName,
          title: targetTitle,
          targetId,
          placement,
          planId,
          amount,
          orderId,
          paymentId,
          status: 'success',
          startDate: Timestamp.fromDate(now),
          endDate: Timestamp.fromDate(endDate),
          createdAt: FieldValue.serverTimestamp(),
        });

        // Add to advertisements collection
        const adRef = db.collection('advertisements').doc();
        transaction.set(adRef, {
          companyId: companyId || '',
          companyName,
          title: targetTitle,
          targetId,
          type: planId === 'ad_featured' ? 'Featured' : planId === 'ad_premium' ? 'Premium' : 'Sponsored',
          placement,
          status: 'active',
          startDate: Timestamp.fromDate(now),
          endDate: Timestamp.fromDate(endDate),
          impressions: 0,
          clicks: 0,
          contactClicks: 0,
          applicationsGenerated: 0,
          amount,
          createdAt: FieldValue.serverTimestamp(),
        });

        return { success: true };
      });

      return result;
    } catch (err: any) {
      logger.error('Error verifying Ad payment:', err);
      throw new HttpsError('internal', err?.message || 'Error verifying Ad payment');
    }
  }
);

