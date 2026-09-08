import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

/**
 * SEEKERPRIVACY-1 — a real Razorpay webhook, called directly by Razorpay's own servers, not by
 * the client's browser. HOSTING-1 landed the real server identity this needed to exist at all.
 *
 * Deliberately NOT the client-driven "verify" pattern used by payment/verify/route.ts (client
 * reports success, server checks an HMAC over values the client itself supplied). That pattern
 * is cryptographically sound but depends on the client's browser actually making the call — a
 * closed tab, a network drop, or a crashed page right after paying leaves a captured Razorpay
 * payment with nothing recorded on our side. A webhook has no such dependency: Razorpay calls
 * this endpoint itself once the payment captures, independent of what the seeker's browser does
 * next. Configured via `RAZORPAY_WEBHOOK_SECRET`, set by the owner in the Razorpay dashboard's
 * webhook settings (a value distinct from RAZORPAY_KEY_SECRET) — pointed at this route's URL.
 *
 * Verification is over the RAW request body bytes, per Razorpay's own webhook signature spec —
 * re-serializing the parsed JSON before hashing would not reliably reproduce the same bytes
 * Razorpay signed, and would make a genuine webhook call fail verification.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Seeker Public Profile Webhook] RAZORPAY_WEBHOOK_SECRET is not set — refusing to process any webhook call.');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    console.error('[Seeker Public Profile Webhook] Missing X-Razorpay-Signature header — refusing.');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('[Seeker Public Profile Webhook] Signature mismatch — refusing. This request did not come from Razorpay (or the raw body was altered in transit).');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[Seeker Public Profile Webhook] Body is not valid JSON despite a valid signature — refusing.');
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (payload?.event !== 'payment.captured') {
    // Not an error — Razorpay may send this endpoint every event type on the account.
    // Anything other than a captured payment needs no action here.
    return NextResponse.json({ received: true, ignored: payload?.event || 'unknown' });
  }

  const payment = payload?.payload?.payment?.entity;
  const notes = payment?.notes || {};

  if (notes.purpose !== 'seeker-public-profile' || !notes.userId) {
    // A payment.captured event for a different purchase type (or without the notes this
    // route's own create-order always attaches) — not this endpoint's concern.
    return NextResponse.json({ received: true, ignored: 'not-seeker-public-profile' });
  }

  const userId: string = notes.userId;
  const paymentId: string = payment.id;
  const orderId: string = payment.order_id;
  const amountReceived = typeof payment.amount === 'number' ? payment.amount / 100 : 0;

  try {
    const db = getAdminFirestore();
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(now.getFullYear() + 1);

    // Deterministic doc id (the Razorpay payment id) — Razorpay's webhooks are at-least-once
    // delivery and may retry the same event; this makes a duplicate delivery a harmless
    // overwrite of the same audit record rather than a second one, and re-setting
    // publicProfilePaidUntil to a near-identical "now + 1 year" value on a retry is likewise
    // idempotent in effect.
    await db.collection('payments').doc(paymentId).set({
      paymentId,
      orderId,
      userId,
      amount: amountReceived,
      purpose: 'seeker-public-profile',
      status: 'captured',
      paymentMethod: 'RAZORPAY_WEBHOOK',
      createdAt: now,
    }, { merge: true });

    // The profile only becomes publicly visible once payment actually succeeds (the objective's
    // own wording) — this is the ONLY code path in the app permitted to set either field, per
    // the firestore.rules gate on seekerProfiles' update rule.
    await db.collection('seekerProfiles').doc(userId).set({
      isPortfolioPublic: true,
      publicProfilePaidUntil: expiryDate,
    }, { merge: true });

    return NextResponse.json({ received: true, activated: userId });
  } catch (err: any) {
    console.error('[Seeker Public Profile Webhook] Failed to record payment / activate profile:', err?.message || err);
    // A non-2xx response tells Razorpay to retry this webhook delivery later, which is the
    // correct behavior here — the payment genuinely captured, but our own write failed, so
    // retrying (rather than silently dropping it) is how this eventually still activates.
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
