/**
 * Razorpay Webhook Handler
 *
 * Receives POST requests from Razorpay when payment events occur.
 * Acts as source-of-truth for payment state — works alongside (not
 * instead of) the client-side verifyRazorpayPayment Cloud Function.
 *
 * Supported events:
 *  - payment.authorized / payment.captured → activate subscription
 *  - payment.failed → mark payment as failed
 *
 * Security:
 *  - Verifies X-Razorpay-Signature (HMAC SHA-256) before processing
 *  - Idempotent: duplicate events are silently accepted (200 OK)
 */
import { type NextRequest } from 'next/server';
import { createHmac } from 'crypto';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Force dynamic so this route is never cached
export const dynamic = 'force-dynamic';

// Plan config (mirrors functions/src/subscriptions.ts)
const SERVER_PLAN_CONFIGS: Record<string, { price: number; name: string }> = {
  basic: { price: 499, name: 'Basic Plan' },
  premium: { price: 999, name: 'Premium Plan' },
};

// ──────────────────────────────────────────────────────────────────
// Signature verification
// ──────────────────────────────────────────────────────────────────

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ──────────────────────────────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[razorpay/webhook] RAZORPAY_WEBHOOK_SECRET env var is missing');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // 1. Read raw body (needed for HMAC verification)
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';

  // 2. Verify signature
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.warn('[razorpay/webhook] Invalid signature');
    return new Response('Invalid signature', { status: 400 });
  }

  // 3. Parse payload
  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = payload.event;
  const paymentEntity = payload.payload?.payment?.entity;

  if (!paymentEntity?.id) {
    // Not a payment event we care about — acknowledge it
    return new Response('OK', { status: 200 });
  }

  const paymentId = paymentEntity.id;
  const orderId = paymentEntity.order_id;

  console.log(`[razorpay/webhook] Received event=${event} payment=${paymentId} order=${orderId}`);

  // 4. Idempotency check — have we already processed this payment+event?
  const idempotencyRef = adminDb.doc(`webhookEvents/${paymentId}_${event}`);
  const existingEvent = await idempotencyRef.get();
  if (existingEvent.exists) {
    console.log(`[razorpay/webhook] Already processed ${paymentId}_${event} — skipping`);
    return new Response('Already processed', { status: 200 });
  }

  // 5. Handle event
  try {
    if (event === 'payment.authorized' || event === 'payment.captured') {
      await handlePaymentSuccess(paymentEntity, orderId);
    } else if (event === 'payment.failed') {
      await handlePaymentFailed(paymentEntity, orderId);
    } else {
      console.log(`[razorpay/webhook] Unhandled event type: ${event}`);
    }

    // 6. Record idempotency marker
    await idempotencyRef.set({
      paymentId,
      orderId,
      event,
      processedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error(`[razorpay/webhook] Error processing ${event}:`, err);
    // Return 200 anyway to prevent infinite retries from Razorpay
    // (the idempotency marker was NOT written, so a retry will re-attempt)
    return new Response('Processing error', { status: 200 });
  }

  return new Response('OK', { status: 200 });
}

// ──────────────────────────────────────────────────────────────────
// Payment success handler
// ──────────────────────────────────────────────────────────────────

async function handlePaymentSuccess(
  payment: PaymentEntity,
  orderId: string,
) {
  // Check if subscription was already activated (by client-side verifyRazorpayPayment)
  const existingPayments = await adminDb
    .collection('payments')
    .where('paymentRequestId', '==', payment.id)
    .where('status', '==', 'approved')
    .limit(1)
    .get();

  if (!existingPayments.empty) {
    console.log(`[razorpay/webhook] Payment ${payment.id} already approved via client flow — skipping`);
    return;
  }

  // Look up order metadata to resolve userId, planSlug, audience, companyId
  const orderDoc = await adminDb.doc(`razorpayOrders/${orderId}`).get();
  if (!orderDoc.exists) {
    console.error(`[razorpay/webhook] No order metadata found for ${orderId}`);
    return;
  }

  const orderData = orderDoc.data()!;
  const userId = orderData.userId as string;
  const planSlug = orderData.planSlug as string;
  const audience = orderData.audience as 'seeker' | 'employer';
  const companyId = (orderData.companyId as string) || '';

  if (!userId || !planSlug || !audience) {
    console.error(`[razorpay/webhook] Incomplete order metadata for ${orderId}`, orderData);
    return;
  }

  const planConfig = SERVER_PLAN_CONFIGS[planSlug];
  if (!planConfig) {
    console.error(`[razorpay/webhook] Unknown plan slug: ${planSlug}`);
    return;
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setFullYear(now.getFullYear() + 1);

  const planName = planConfig.name;
  const subscriptionId = companyId ? `${companyId}_${planSlug}` : `${userId}_${planSlug}`;

  // Fetch user info for subscription record
  const userSnap = await adminDb.doc(`users/${userId}`).get();
  const userData = userSnap.data() || {};
  const requesterName = (userData.displayName || userData.email || (audience === 'seeker' ? 'Candidate' : 'Business')) as string;
  const email = (userData.email || '') as string;
  const mobile = (userData.phone || '') as string;

  let companyName = audience === 'seeker' ? 'Job Seeker' : 'Company';
  if (companyId) {
    const companySnap = await adminDb.doc(`companies/${companyId}`).get();
    if (companySnap.exists) {
      const compData = companySnap.data() || {};
      companyName = (compData.name || compData.businessName || compData.companyName || 'Business') as string;
    }
  }

  const batch = adminDb.batch();

  // Subscription doc
  batch.set(adminDb.doc(`subscriptions/${subscriptionId}`), {
    userId,
    ...(companyId ? { companyId } : {}),
    audience,
    userName: requesterName,
    companyName,
    businessName: companyName,
    email,
    mobile,
    plan: planSlug,
    planName,
    amount: planConfig.price,
    period: 'year',
    status: 'active',
    startDate: Timestamp.fromDate(now),
    endDate: Timestamp.fromDate(endDate),
    paymentDate: Timestamp.fromDate(now),
    autoRenew: false,
    paymentMethod: 'razorpay',
    paymentRequestId: payment.id,
    expiryReminderDaysSent: [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  // Payment record
  const paymentRef = adminDb.collection('payments').doc();
  batch.set(paymentRef, {
    userId,
    ...(companyId ? { companyId } : {}),
    audience,
    userName: requesterName,
    businessName: companyName,
    companyName,
    plan: planName,
    planSlug,
    period: 'year',
    paymentMethod: 'razorpay',
    amount: planConfig.price,
    status: 'approved',
    paymentRequestId: payment.id,
    source: 'webhook',
    createdAt: FieldValue.serverTimestamp(),
  });

  // Update company or seeker profile
  if (audience === 'employer' && companyId) {
    batch.update(adminDb.doc(`companies/${companyId}`), {
      isPremium: planSlug === 'premium',
      subscriptionPlan: planSlug,
      subscriptionStatus: 'active',
      subscriptionStartsAt: Timestamp.fromDate(now),
      subscriptionEndsAt: Timestamp.fromDate(endDate),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  if (audience === 'seeker') {
    batch.set(adminDb.doc(`seekerProfiles/${userId}`), {
      isPremium: planSlug === 'premium',
      premiumPlan: planSlug,
      premiumUntil: Timestamp.fromDate(endDate),
      subscriptionPlan: planSlug,
      subscriptionStatus: 'active',
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // Mark order as paid
  batch.update(adminDb.doc(`razorpayOrders/${orderId}`), {
    status: 'paid',
    paymentId: payment.id,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  // Activity log (outside batch for best-effort)
  await adminDb.collection('activityLogs').add({
    userId,
    action: 'webhook_payment_confirmed',
    target: `Subscription: ${subscriptionId}`,
    targetId: subscriptionId,
    targetType: 'subscription',
    details: `Upgraded to ${planName} via webhook (payment: ${payment.id})`,
    timestamp: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`[razorpay/webhook] Activated subscription ${subscriptionId} for user ${userId}`);
}

// ──────────────────────────────────────────────────────────────────
// Payment failure handler
// ──────────────────────────────────────────────────────────────────

async function handlePaymentFailed(
  payment: PaymentEntity,
  orderId: string,
) {
  // Update order status
  const orderRef = adminDb.doc(`razorpayOrders/${orderId}`);
  const orderDoc = await orderRef.get();
  if (orderDoc.exists) {
    await orderRef.update({
      status: 'failed',
      failureReason: payment.error_description || payment.error_reason || 'Unknown',
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  console.log(`[razorpay/webhook] Payment failed for order ${orderId}: ${payment.error_description || 'unknown reason'}`);
}

// ──────────────────────────────────────────────────────────────────
// Type definitions for Razorpay webhook payload
// ──────────────────────────────────────────────────────────────────

interface PaymentEntity {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  email?: string;
  contact?: string;
  error_code?: string;
  error_description?: string;
  error_reason?: string;
}

interface WebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: PaymentEntity;
    };
  };
}
