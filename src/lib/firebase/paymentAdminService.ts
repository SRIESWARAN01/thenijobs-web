import crypto from 'crypto';
import { getAdminFirestore, getServiceAccountCredentials } from './firebaseAdmin';
import { assignNextBillingSlogan, getDeterministicBillingSlogan } from '@/lib/billing/sloganService';
import { ALL_VALID_PLAN_PRICES, SUBSCRIPTION_PLANS } from '@/lib/constants';
import type { ReceiptData } from '@/lib/pdf/receiptGenerator';

export interface VerifyPaymentInput {
  orderId: string;
  paymentId: string;
  signature?: string;
  planSlug: string;
  planName?: string;
  amount: number;
  companyId?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyGst?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  paymentMethod?: string;
  source?: 'client_verify' | 'webhook' | 'reconcile';
}

export interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  email?: string;
  contact?: string;
  vpa?: string;
  notes?: Record<string, any>;
  created_at?: number;
  acquirer_data?: Record<string, any>;
  [key: string]: any;
}

/**
 * Fetch raw payment details directly from the Razorpay API.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPaymentEntity | null> {
  const key = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key || !secret) {
    console.error('[paymentAdminService] Razorpay API credentials are not configured.');
    return null;
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: authHeader },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[paymentAdminService] Razorpay API returned ${res.status} for payment ${paymentId}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[paymentAdminService] Error fetching Razorpay payment:', err);
    return null;
  }
}

/**
 * Verify HMAC SHA-256 signature from Razorpay checkout.
 */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature || !orderId || !paymentId) return false;

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  } catch (err) {
    console.error('[paymentAdminService] Signature verification exception:', err);
    return false;
  }
}

// Cached Google server clock offset in milliseconds
let cachedClockOffsetMs: number | null = null;
let lastOffsetFetchTime = 0;

async function getGoogleClockOffsetMs(): Promise<number> {
  const now = Date.now();
  if (cachedClockOffsetMs !== null && now - lastOffsetFetchTime < 15 * 60 * 1000) {
    return cachedClockOffsetMs;
  }

  for (const endpoint of ['https://oauth2.googleapis.com', 'https://www.google.com']) {
    try {
      const headRes = await fetch(endpoint, { method: 'HEAD', cache: 'no-store' });
      const dateHeader = headRes.headers.get('date');
      if (dateHeader) {
        const googleServerTime = new Date(dateHeader).getTime();
        if (!isNaN(googleServerTime)) {
          cachedClockOffsetMs = googleServerTime - Date.now();
          lastOffsetFetchTime = now;
          return cachedClockOffsetMs;
        }
      }
    } catch {
      // try next endpoint
    }
  }

  return cachedClockOffsetMs || 0;
}

/**
 * Fallback mechanism: gets a valid OAuth2 bearer token to write to Firestore via REST
 * with automated clock-skew correction.
 */
async function getFallbackBearerToken(): Promise<string | null> {
  const sa = getServiceAccountCredentials();
  if (sa && sa.client_email && sa.private_key) {
    try {
      const offsetMs = await getGoogleClockOffsetMs();
      const trueNowMs = Date.now() + offsetMs;
      const nowSeconds = Math.floor(trueNowMs / 1000);
      const iat = nowSeconds - 30;
      const exp = iat + 3540; // 59 minutes total lifetime (strictly <= 3600s for Google OAuth2)

      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const claimSet = Buffer.from(JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore',
        aud: 'https://oauth2.googleapis.com/token',
        exp,
        iat,
      })).toString('base64url');

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(`${header}.${claimSet}`);
      const signature = sign.sign(sa.private_key, 'base64url');
      const jwt = `${header}.${claimSet}.${signature}`;

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      const d = await res.json();
      if (d.access_token) return d.access_token;
    } catch (jwtErr) {
      console.warn('[paymentAdminService] Service account OAuth grant failed:', jwtErr);
    }
  }

  return null;
}

/**
 * Converts Firestore REST document fields to standard JS object.
 */
function parseFirestoreRestFields(fields?: Record<string, any>): Record<string, any> {
  if (!fields) return {};
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v.stringValue !== undefined) res[k] = v.stringValue;
    else if (v.integerValue !== undefined) res[k] = parseInt(v.integerValue, 10);
    else if (v.doubleValue !== undefined) res[k] = parseFloat(v.doubleValue);
    else if (v.booleanValue !== undefined) res[k] = v.booleanValue;
    else if (v.timestampValue !== undefined) res[k] = new Date(v.timestampValue);
    else if (v.nullValue !== undefined) res[k] = null;
    else res[k] = v;
  }
  return res;
}

/**
 * Executes Firestore REST GET call as a secondary fail-safe.
 */
export async function executeRestFirestoreGet(collection: string, docId: string): Promise<Record<string, any> | null> {
  const token = await getFallbackBearerToken();
  if (!token) return null;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'thenijobs-9f01d';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return parseFirestoreRestFields(data.fields);
    }
  } catch (err) {
    console.warn(`[paymentAdminService] REST get ${collection}/${docId} error:`, err);
  }
  return null;
}

/**
 * Executes Firestore REST PATCH call as a secondary fail-safe.
 */
async function executeRestFirestorePatch(collection: string, docId: string, fields: Record<string, any>): Promise<boolean> {
  const token = await getFallbackBearerToken();
  if (!token) return false;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'thenijobs-9f01d';
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;

  // Format JS values into Firestore REST format
  const restFields: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) {
      restFields[k] = { nullValue: null };
    } else if (typeof v === 'string') {
      restFields[k] = { stringValue: v };
    } else if (typeof v === 'number') {
      restFields[k] = Number.isInteger(v) ? { integerValue: v.toString() } : { doubleValue: v };
    } else if (typeof v === 'boolean') {
      restFields[k] = { booleanValue: v };
    } else if (v instanceof Date) {
      restFields[k] = { timestampValue: v.toISOString() };
    } else if (Array.isArray(v)) {
      restFields[k] = {
        arrayValue: {
          values: v.map((item) => ({ stringValue: typeof item === 'string' ? item : JSON.stringify(item) })),
        },
      };
    } else if (typeof v === 'object') {
      restFields[k] = { stringValue: JSON.stringify(v) };
    }
  }

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: restFields }),
    });

    if (res.ok) {
      return true;
    }
    const errText = await res.text();
    console.error(`[paymentAdminService] REST patch failed (${res.status}):`, errText);
    return false;
  } catch (netErr) {
    console.error('[paymentAdminService] REST patch network error:', netErr);
    return false;
  }
}

/**
 * Builds formatted ReceiptData ready for PDF generation and display.
 */
export function buildReceiptDataFromPayment(p: Record<string, any>): ReceiptData {
  const now = p.createdAt instanceof Date ? p.createdAt : (p.createdAt ? new Date(p.createdAt) : new Date());
  const expiry = p.expiryDate instanceof Date ? p.expiryDate : (p.expiryDate ? new Date(p.expiryDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000));

  const formattedStartDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedEndDate = expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedDateTime = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    receiptNo: p.receiptNo || `THENI-REC-${(p.paymentId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`,
    paymentId: p.paymentId || 'pay_verified',
    orderId: p.orderId || '',
    amount: Number(p.amount) || 0,
    planName: p.planName || 'Standard Annual Plan',
    planSlug: p.plan || p.planSlug || 'standard',
    date: p.date || formattedDateTime,
    startDate: p.startDateStr || formattedStartDate,
    expiryDate: p.expiryDateStr || formattedEndDate,
    billedTo: p.companyName || p.userName || 'Business Owner',
    address: p.companyAddress || 'Theni District, Tamil Nadu',
    phone: p.companyPhone || p.userPhone || '',
    email: p.userEmail || '',
    gst: p.companyGst || '',
    paymentMethod: p.paymentMethod || 'Razorpay 256-Bit SSL (UPI / Cards)',
    status: 'PAID / ACTIVE',
    sloganId: p.sloganId,
    sloganText: p.sloganText,
    sloganLanguage: p.sloganLanguage || 'ta',
    sloganCycle: p.sloganCycle || 1,
  };
}

/**
 * Records a verified successful payment in Firestore.
 * Updates payments, subscriptions, companies, users, and seekerProfiles idempotently.
 */
export async function recordVerifiedPayment(input: VerifyPaymentInput) {
  const {
    orderId,
    paymentId,
    planSlug,
    planName,
    amount,
    companyId,
    companyName,
    companyAddress,
    companyPhone,
    companyGst,
    userId,
    userName,
    userEmail,
    userPhone,
    paymentMethod,
    source = 'client_verify',
  } = input;

  if (!orderId || !paymentId) {
    throw new Error('Missing orderId or paymentId');
  }

  // 1. Fetch live Razorpay details for verification and metadata
  const rpPayment = await fetchRazorpayPayment(paymentId);
  const paymentMethodResolved = rpPayment?.method
    ? (rpPayment.method === 'upi' ? `UPI (${rpPayment.vpa || 'Direct UPI'})` : rpPayment.method.toUpperCase())
    : (paymentMethod || 'Razorpay 256-Bit SSL (UPI / Cards)');

  // 2. Derive plan name and duration
  const matchedPlan = SUBSCRIPTION_PLANS.find((p) => p.slug === planSlug);
  const resolvedPlanName = planName || matchedPlan?.name || (planSlug === 'seeker_pro' ? 'Pro Candidate' : 'Standard Plan');

  const now = new Date();
  const expiryDate = new Date();
  if (planSlug === 'seeker_pro' || planSlug === 'seeker-premium') {
    expiryDate.setMonth(now.getMonth() + 3); // 3 months for quarterly candidate pro
  } else {
    expiryDate.setFullYear(now.getFullYear() + 1); // 1 full year for annual business plans
  }

  const receiptNo = `THENI-REC-${paymentId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase()}`;

  // 3. Assign dynamic billing slogan based on billing model / plan
  const resolvedModel = planSlug
    ? (planSlug.startsWith('subscription_') ? planSlug : `subscription_${planSlug}`)
    : 'subscription_standard';

  let assignedSlogan: any = null;
  try {
    assignedSlogan = await assignNextBillingSlogan({
      billingModel: resolvedModel,
      seedFallback: orderId,
    });
  } catch (sErr) {
    console.warn('[paymentAdminService] Slogan assignment fallback:', sErr);
    assignedSlogan = getDeterministicBillingSlogan(orderId);
  }

  const sloganText = assignedSlogan?.sloganText || assignedSlogan?.text || 'வணிக வளர்ச்சிக்கு நம்பகமான களம்';
  const sloganLanguage = assignedSlogan?.sloganLanguage || assignedSlogan?.language || 'ta';
  const sloganId = assignedSlogan?.sloganId || assignedSlogan?.id || 'SLOGAN-TJ-01';
  const sloganCycle = assignedSlogan?.sloganCycle || assignedSlogan?.cycle || 1;
  const sloganCategory = assignedSlogan?.sloganCategory || 'business_growth';

  const formattedStartDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedEndDate = expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedDateTime = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // 4. Payment record payload
  const paymentPayload = {
    paymentId,
    orderId,
    receiptNo,
    userId: userId || rpPayment?.notes?.userId || '',
    userName: userName || rpPayment?.email || 'Customer',
    userEmail: userEmail || rpPayment?.email || '',
    userPhone: userPhone || rpPayment?.contact || '',
    companyId: companyId || rpPayment?.notes?.companyId || '',
    companyName: companyName || rpPayment?.notes?.companyName || 'Business',
    companyAddress: companyAddress || '',
    companyPhone: companyPhone || '',
    companyGst: companyGst || '',
    plan: planSlug,
    planName: resolvedPlanName,
    amount: amount || (rpPayment?.amount ? rpPayment.amount / 100 : 0),
    currency: 'INR',
    status: 'captured',
    signatureVerified: true,
    paymentMethod: paymentMethodResolved,
    razorpayMethod: rpPayment?.method || '',
    razorpayVpa: rpPayment?.vpa || '',
    source,
    startDate: now,
    expiryDate,
    startDateStr: formattedStartDate,
    expiryDateStr: formattedEndDate,
    date: formattedDateTime,
    createdAt: now,
    updatedAt: now,
    // Slogan metadata
    sloganId,
    sloganText,
    sloganLanguage,
    sloganCycle,
    sloganCategory,
    billingModel: resolvedModel,
  };

  const subscriptionPayload = {
    subscriptionId: `sub_${paymentId}`,
    userId: userId || rpPayment?.notes?.userId || '',
    companyId: companyId || rpPayment?.notes?.companyId || '',
    plan: planSlug,
    planName: resolvedPlanName,
    status: 'active',
    amount: amount || (rpPayment?.amount ? rpPayment.amount / 100 : 0),
    startDate: now,
    endDate: expiryDate,
    autoRenew: false, // Manual annual renewal
    paymentMethod: paymentMethodResolved,
    paymentId,
    orderId,
    createdAt: now,
    updatedAt: now,
    sloganId,
    sloganText,
  };

  const receiptData: ReceiptData = {
    receiptNo,
    paymentId,
    orderId,
    amount: paymentPayload.amount,
    planName: resolvedPlanName,
    planSlug,
    date: formattedDateTime,
    startDate: formattedStartDate,
    expiryDate: formattedEndDate,
    billedTo: paymentPayload.companyName || paymentPayload.userName || 'Business Owner',
    address: paymentPayload.companyAddress || 'Theni District, Tamil Nadu',
    phone: paymentPayload.companyPhone || paymentPayload.userPhone || '',
    email: paymentPayload.userEmail || '',
    gst: paymentPayload.companyGst || '',
    paymentMethod: paymentMethodResolved,
    status: 'PAID / ACTIVE',
    sloganId,
    sloganText,
    sloganLanguage,
    sloganCycle,
  };

  let writeSucceeded = false;

  // Attempt 1: Standard Firebase Admin SDK write
  try {
    const db = getAdminFirestore();

    // Check idempotency via Admin SDK with REST fallback
    try {
      const existingDoc = await db.collection('payments').doc(paymentId).get();
      if (existingDoc.exists && existingDoc.data()?.status === 'captured') {
        console.log(`[paymentAdminService] Payment ${paymentId} already recorded and captured.`);
        const existingData = existingDoc.data()!;
        return {
          success: true,
          alreadyProcessed: true,
          paymentId,
          orderId,
          receiptNo: existingData.receiptNo || receiptNo,
          amount: existingData.amount || amount,
          planSlug: existingData.plan || planSlug,
          planName: existingData.planName || resolvedPlanName,
          startDate: existingData.startDateStr || formattedStartDate,
          expiryDate: existingData.expiryDateStr || formattedEndDate,
          slogan: {
            sloganId: existingData.sloganId || sloganId,
            sloganText: existingData.sloganText || sloganText,
            sloganLanguage: existingData.sloganLanguage || sloganLanguage,
            sloganCycle: existingData.sloganCycle || sloganCycle,
          },
          receiptData: buildReceiptDataFromPayment(existingData),
          payment: existingData,
        };
      }
    } catch {
      // If Admin SDK gRPC threw (e.g. clock skew), check via REST fallback
      const restExisting = await executeRestFirestoreGet('payments', paymentId);
      if (restExisting && restExisting.status === 'captured') {
        console.log(`[paymentAdminService] Payment ${paymentId} already recorded (found via REST).`);
        return {
          success: true,
          alreadyProcessed: true,
          paymentId,
          orderId,
          receiptNo: restExisting.receiptNo || receiptNo,
          amount: restExisting.amount || amount,
          planSlug: restExisting.plan || planSlug,
          planName: restExisting.planName || resolvedPlanName,
          startDate: restExisting.startDateStr || formattedStartDate,
          expiryDate: restExisting.expiryDateStr || formattedEndDate,
          slogan: {
            sloganId: restExisting.sloganId || sloganId,
            sloganText: restExisting.sloganText || sloganText,
            sloganLanguage: restExisting.sloganLanguage || sloganLanguage,
            sloganCycle: restExisting.sloganCycle || sloganCycle,
          },
          receiptData: buildReceiptDataFromPayment(restExisting),
          payment: restExisting,
        };
      }
    }

    // 0. Update order status in orders collection
    if (orderId) {
      await db.collection('orders').doc(orderId).set({
        orderId,
        paymentId,
        receiptNo,
        status: 'paid',
        paidAt: now,
        updatedAt: now,
      }, { merge: true });
    }

    // 1. Write payments document (doc id = paymentId)
    await db.collection('payments').doc(paymentId).set(paymentPayload, { merge: true });

    // 2. Write subscriptions document
    await db.collection('subscriptions').doc(`sub_${paymentId}`).set(subscriptionPayload, { merge: true });

    // 3. Update company document if companyId is present (merge: true ensures non-existent docs don't throw NOT_FOUND)
    const targetCompanyId = companyId || rpPayment?.notes?.companyId;
    if (targetCompanyId) {
      await db.collection('companies').doc(targetCompanyId).set({
        subscriptionPlan: planSlug,
        subscriptionStatus: 'active',
        accountStatus: 'active',
        websiteStatus: 'active',
        paymentStatus: 'paid',
        isPremium: true,
        isActive: true,
        subscriptionStartDate: now,
        subscriptionEndDate: expiryDate,
        updatedAt: now,
      }, { merge: true });
    }

    // 4. Update user document (merge: true ensures non-existent docs don't throw NOT_FOUND)
    const targetUserId = userId || rpPayment?.notes?.userId;
    if (targetUserId) {
      let isAlreadyApproved = false;
      try {
        const uSnap = await db.collection('users').doc(targetUserId).get();
        if (uSnap.exists && uSnap.data()?.approvalStatus === 'approved') {
          isAlreadyApproved = true;
        }
      } catch (err) {
        console.warn('[paymentAdminService] Could not check existing approval status:', err);
      }

      const userUpdatePayload: Record<string, any> = {
        subscriptionPlan: planSlug,
        selectedPlan: planSlug,
        paymentStatus: 'paid',
        paidAt: now,
        isPremium: true,
        updatedAt: now,
      };

      if (isAlreadyApproved) {
        userUpdatePayload.subscriptionStatus = 'active';
        userUpdatePayload.accountStatus = 'active';
        userUpdatePayload.planStartDate = now;
        userUpdatePayload.planEndDate = expiryDate;
      } else {
        // Business owner is waiting for mandatory Admin Approval!
        userUpdatePayload.subscriptionStatus = 'pending_admin_approval';
        userUpdatePayload.accountStatus = 'pending_approval';
        userUpdatePayload.approvalStatus = 'pending';
      }

      await db.collection('users').doc(targetUserId).set(userUpdatePayload, { merge: true });

      // If job seeker plan
      if (planSlug === 'seeker_pro' || planSlug === 'seeker-premium') {
        await db.collection('seekerProfiles').doc(targetUserId).set({
          isPremium: true,
          premiumStartDate: now,
          premiumEndDate: expiryDate,
          updatedAt: now,
        }, { merge: true });
      }

      // 5. System notification
      try {
        await db.collection('notifications').add({
          userId: targetUserId,
          type: 'system',
          title: 'Payment Confirmed! 🎉',
          message: `Your ${resolvedPlanName} (₹${amount}) is active until ${formattedEndDate}.`,
          read: false,
          actionUrl: targetCompanyId ? '/employer/billing' : '/seeker/subscription',
          createdAt: now,
        });
      } catch (nErr) {
        console.warn('[paymentAdminService] Courtesy notification error (non-blocking):', nErr);
      }
    }

    writeSucceeded = true;
    console.log(`[paymentAdminService] Successfully saved payment ${paymentId} via Firebase Admin SDK.`);
  } catch (adminErr: any) {
    console.warn('[paymentAdminService] Firebase Admin SDK direct write failed. Attempting REST fallback...', adminErr?.message || adminErr);
  }

  // Attempt 2: REST fallback if Admin SDK write did not succeed
  if (!writeSucceeded) {
    if (orderId) {
      await executeRestFirestorePatch('orders', orderId, {
        orderId,
        paymentId,
        receiptNo,
        status: 'paid',
        paidAt: now,
        updatedAt: now,
      });
    }

    const pSuccess = await executeRestFirestorePatch('payments', paymentId, paymentPayload);
    const sSuccess = await executeRestFirestorePatch('subscriptions', `sub_${paymentId}`, subscriptionPayload);

    const targetCompanyId = companyId || rpPayment?.notes?.companyId;
    if (targetCompanyId) {
      await executeRestFirestorePatch('companies', targetCompanyId, {
        subscriptionPlan: planSlug,
        subscriptionStatus: 'active',
        accountStatus: 'active',
        websiteStatus: 'active',
        paymentStatus: 'paid',
        isPremium: true,
        isActive: true,
        subscriptionStartDate: now,
        subscriptionEndDate: expiryDate,
        updatedAt: now,
      });
    }

    const targetUserId = userId || rpPayment?.notes?.userId;
    if (targetUserId) {
      await executeRestFirestorePatch('users', targetUserId, {
        subscriptionPlan: planSlug,
        subscriptionStatus: 'active',
        accountStatus: 'active',
        paymentStatus: 'paid',
        isPremium: true,
        updatedAt: now,
      });

      if (planSlug === 'seeker_pro' || planSlug === 'seeker-premium') {
        await executeRestFirestorePatch('seekerProfiles', targetUserId, {
          isPremium: true,
          premiumStartDate: now,
          premiumEndDate: expiryDate,
          updatedAt: now,
        });
      }
    }

    if (pSuccess && sSuccess) {
      writeSucceeded = true;
      console.log(`[paymentAdminService] Successfully saved payment ${paymentId} via REST fallback.`);
    }
  }

  if (!writeSucceeded) {
    throw new Error('Database write channels encountered an error while saving payment record.');
  }

  return {
    success: true,
    paymentId,
    orderId,
    receiptNo,
    amount: paymentPayload.amount,
    planSlug,
    planName: resolvedPlanName,
    startDate: formattedStartDate,
    expiryDate: formattedEndDate,
    slogan: {
      sloganId,
      sloganText,
      sloganLanguage,
      sloganCycle,
    },
    receiptData,
    payment: paymentPayload,
  };
}

/**
 * Checks whether an order or payment is recorded as captured in Firestore.
 * Automatically reconciles with Razorpay API if not yet in Firestore.
 */
export async function getOrReconcilePaymentStatus(orderId?: string, paymentId?: string) {
  if (!orderId && !paymentId) {
    return { exists: false, isPaid: false };
  }

  // 1. Try querying Firestore
  try {
    const db = getAdminFirestore();

    if (paymentId) {
      const doc = await db.collection('payments').doc(paymentId).get();
      if (doc.exists && doc.data()?.status === 'captured') {
        const data = doc.data()!;
        return {
          exists: true,
          isPaid: true,
          payment: data,
          receiptData: buildReceiptDataFromPayment(data),
        };
      }
    }

    if (orderId) {
      const querySnapshot = await db
        .collection('payments')
        .where('orderId', '==', orderId)
        .where('status', '==', 'captured')
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return {
          exists: true,
          isPaid: true,
          payment: data,
          receiptData: buildReceiptDataFromPayment(data),
        };
      }
    }
  } catch (err) {
    console.warn('[paymentAdminService] Firestore query error in getOrReconcilePaymentStatus:', err);
  }

  // 1b. Fallback to REST lookup if Admin SDK had connection/clock-skew issues
  if (paymentId) {
    const restDoc = await executeRestFirestoreGet('payments', paymentId);
    if (restDoc && restDoc.status === 'captured') {
      return {
        exists: true,
        isPaid: true,
        payment: restDoc,
        receiptData: buildReceiptDataFromPayment(restDoc),
      };
    }
  }

  // 2. If not yet found in Firestore, but paymentId is provided, check Razorpay API!
  if (paymentId) {
    console.log(`[paymentAdminService] Payment ${paymentId} not yet in Firestore. Checking Razorpay API...`);
    const rpPayment = await fetchRazorpayPayment(paymentId);

    if (rpPayment && (rpPayment.status === 'captured' || rpPayment.status === 'authorized')) {
      console.log(`[paymentAdminService] Razorpay confirmed payment ${paymentId} is captured! Auto-reconciling...`);
      const notes = rpPayment.notes || {};
      const planSlug = notes.planSlug || 'standard';
      const expectedPrice = ALL_VALID_PLAN_PRICES[planSlug] || (rpPayment.amount / 100);

      const record = await recordVerifiedPayment({
        orderId: rpPayment.order_id || orderId || '',
        paymentId: rpPayment.id,
        planSlug,
        amount: expectedPrice,
        userId: notes.userId || '',
        companyId: notes.companyId || '',
        source: 'reconcile',
      });

      return {
        exists: true,
        isPaid: true,
        payment: record.payment,
        receiptData: record.receiptData,
        reconciled: true,
      };
    }
  }

  return { exists: false, isPaid: false };
}
