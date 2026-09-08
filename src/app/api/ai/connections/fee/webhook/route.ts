import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

/**
 * AI-CONNECT-1 -- a real Razorpay webhook for the ₹50 AI-key connection fee, mirroring
 * seeker-public-profile/webhook/route.ts's exact pattern (server-to-server, no dependency on the
 * client's browser surviving to report success).
 *
 * This is a SEPARATE webhook URL from seeker-public-profile's own (registered independently in
 * the Razorpay dashboard), so it is configured with its own env var, `RAZORPAY_AI_WEBHOOK_SECRET`
 * -- deliberately NOT reusing `RAZORPAY_WEBHOOK_SECRET`, since that name is already the seeker-
 * public-profile webhook's own secret and the two URLs may be configured with different secret
 * values in the Razorpay dashboard. Verification is over the RAW request body bytes, per
 * Razorpay's own webhook signature spec.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_AI_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[AI Connection Fee Webhook] RAZORPAY_AI_WEBHOOK_SECRET is not set — refusing to process any webhook call.');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    console.error('[AI Connection Fee Webhook] Missing X-Razorpay-Signature header — refusing.');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('[AI Connection Fee Webhook] Signature mismatch — refusing. This request did not come from Razorpay (or the raw body was altered in transit).');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[AI Connection Fee Webhook] Body is not valid JSON despite a valid signature — refusing.');
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (payload?.event !== 'payment.captured') {
    return NextResponse.json({ received: true, ignored: payload?.event || 'unknown' });
  }

  const payment = payload?.payload?.payment?.entity;
  const notes = payment?.notes || {};

  if (notes.purpose !== 'ai-connection-fee' || !notes.userId) {
    return NextResponse.json({ received: true, ignored: 'not-ai-connection-fee' });
  }

  const userId: string = notes.userId;
  const paymentId: string = payment.id;
  const orderId: string = payment.order_id;
  const amountReceived = typeof payment.amount === 'number' ? payment.amount / 100 : 0;

  try {
    const db = getAdminFirestore();
    const now = new Date();

    // Deterministic doc id (the Razorpay payment id) -- Razorpay's webhooks are at-least-once
    // delivery; a duplicate delivery becomes a harmless overwrite of the same audit record
    // rather than a second one, and re-setting feePaid:true on a retry is likewise idempotent.
    await db.collection('payments').doc(paymentId).set({
      paymentId,
      orderId,
      userId,
      amount: amountReceived,
      purpose: 'ai-connection-fee',
      status: 'captured',
      paymentMethod: 'RAZORPAY_WEBHOOK',
      createdAt: now,
    }, { merge: true });

    // The ONLY code path permitted to set feePaid true -- connect/route.ts's own access gate
    // (aiConnectionAccess.ts) reads this same field and never writes it itself.
    await db.collection('aiConnections').doc(userId).set({
      feePaid: true,
      feePaidVia: 'razorpay',
      feePaidAt: now,
    }, { merge: true });

    return NextResponse.json({ received: true, activated: userId });
  } catch (err: any) {
    console.error('[AI Connection Fee Webhook] Failed to record payment / activate entitlement:', err?.message || err);
    // A non-2xx response tells Razorpay to retry this webhook delivery later -- the payment
    // genuinely captured, but our own write failed, so retrying is the correct behavior.
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
