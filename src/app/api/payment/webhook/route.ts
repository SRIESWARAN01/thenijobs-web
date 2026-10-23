import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { recordVerifiedPayment } from '@/lib/firebase/paymentAdminService';

/**
 * Universal Razorpay Webhook Handler for THENIJOBS Subscription and Order Payments.
 *
 * Configured in Razorpay Dashboard -> Settings -> Webhooks:
 * Endpoint: https://thenijobs.com/api/payment/webhook
 * Secret: RAZORPAY_WEBHOOK_SECRET (falls back to RAZORPAY_KEY_SECRET)
 * Events: payment.captured, order.paid, payment.failed
 *
 * This webhook provides 100% resilient asynchronous reconciliation even if:
 * 1. The customer's mobile browser was closed after paying in UPI / banking app.
 * 2. Network dropped right after Razorpay authorization.
 * 3. Client-side verify request encountered an error or timeout.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!webhookSecret) {
    console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET or RAZORPAY_KEY_SECRET is not configured.');
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!signature) {
    console.error('[Razorpay Webhook] Missing X-Razorpay-Signature header.');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // 1. Verify HMAC SHA-256 signature using timingSafeEqual
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      console.error('[Razorpay Webhook] Invalid webhook signature. Rejecting request.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } catch (sigErr) {
    console.error('[Razorpay Webhook] Signature verification error:', sigErr);
    return NextResponse.json({ error: 'Signature verification failure' }, { status: 400 });
  }

  // 2. Parse payload safely
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[Razorpay Webhook] Malformed JSON payload despite valid signature.');
    return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
  }

  const event = payload?.event;
  console.log(`[Razorpay Webhook] Received verified event: ${event}`);

  // 3. Handle payment.captured and order.paid
  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    const paymentId = paymentEntity?.id;
    const orderId = paymentEntity?.order_id || orderEntity?.id;
    const notes = paymentEntity?.notes || orderEntity?.notes || {};

    if (!paymentId || !orderId) {
      console.warn('[Razorpay Webhook] Missing paymentId or orderId in captured payment payload.');
      return NextResponse.json({ received: true, ignored: 'missing_identifiers' });
    }

    // Ignore events meant for other specific micro-endpoints (like seeker-public-profile or ai-connection-fee)
    if (notes.purpose === 'seeker-public-profile') {
      return NextResponse.json({ received: true, ignored: 'handled_by_seeker_webhook' });
    }
    if (notes.purpose === 'ai-connection-fee') {
      return NextResponse.json({ received: true, ignored: 'handled_by_ai_webhook' });
    }

    const amountInRupees = typeof paymentEntity?.amount === 'number' 
      ? paymentEntity.amount / 100 
      : (typeof orderEntity?.amount === 'number' ? orderEntity.amount / 100 : 0);

    const planSlug = notes.planSlug || 'standard';
    const planName = notes.planName;
    const companyId = notes.companyId || '';
    const userId = notes.userId || '';
    const userName = notes.userName || paymentEntity?.email;

    try {
      // Record payment idempotently
      const recordResult = await recordVerifiedPayment({
        orderId,
        paymentId,
        planSlug,
        planName,
        amount: amountInRupees,
        companyId,
        userId,
        userName,
        userEmail: paymentEntity?.email || '',
        userPhone: paymentEntity?.contact || '',
        paymentMethod: paymentEntity?.method ? paymentEntity.method.toUpperCase() : 'RAZORPAY_WEBHOOK',
        source: 'webhook',
      });

      console.log(`[Razorpay Webhook] Successfully recorded payment ${paymentId} via webhook.`);
      return NextResponse.json({
        received: true,
        success: true,
        paymentId,
        orderId,
        receiptNo: recordResult.receiptNo,
        alreadyProcessed: recordResult.alreadyProcessed || false,
      });
    } catch (recordErr: any) {
      console.error('[Razorpay Webhook] Error recording captured payment:', recordErr?.message || recordErr);
      // Return 500 so Razorpay retries webhook delivery if our DB had a transient glitch
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }
  }

  // 4. Handle payment.failed
  if (event === 'payment.failed') {
    const paymentEntity = payload?.payload?.payment?.entity;
    const paymentId = paymentEntity?.id;
    const orderId = paymentEntity?.order_id;
    const notes = paymentEntity?.notes || {};

    if (paymentId) {
      try {
        const db = getAdminFirestore();
        await db.collection('payments').doc(paymentId).set({
          paymentId,
          orderId: orderId || '',
          userId: notes.userId || '',
          companyId: notes.companyId || '',
          amount: typeof paymentEntity?.amount === 'number' ? paymentEntity.amount / 100 : 0,
          status: 'failed',
          errorCode: paymentEntity?.error_code || 'PAYMENT_FAILED',
          errorDescription: paymentEntity?.error_description || 'Payment failed at gateway',
          paymentMethod: paymentEntity?.method || 'RAZORPAY',
          updatedAt: new Date(),
        }, { merge: true });
        console.log(`[Razorpay Webhook] Logged failed payment ${paymentId}.`);
      } catch (logErr) {
        console.warn('[Razorpay Webhook] Non-critical error logging failed payment:', logErr);
      }
    }

    return NextResponse.json({ received: true, status: 'failed_logged' });
  }

  // All other events acknowledged
  return NextResponse.json({ received: true, ignored: event });
}
