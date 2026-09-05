import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  console.warn('[Payment Verify] Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY environment variables.');
}

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Plan price validation ───────────────────────────────────────────────────
// PAY-1: this was a hard-coded table — free 0, basic 999, standard 2999, premium 7999,
// enterprise 14999 — under a comment saying it must match the pricing page. It did not.
// SUBSCRIPTION_PLANS has said standard 480, premium 1200, enterprise 5000 for as long as the
// pricing page has rendered them, and the checkout modal sends `amount: plan.price` from that
// same list. So the amount check below compared 480 against 2999 and rejected EVERY paid plan
// with "Payment amount does not match the selected plan". `basic` was not even a plan any more.
//
// Deriving it means the check now does the job it was written for, and a price change in
// constants.ts cannot leave this file behind.
const PLAN_PRICES: Record<string, number> = Object.fromEntries(
  SUBSCRIPTION_PLANS.map((plan) => [plan.slug, plan.price]),
);

/**
 * PAY-1: every write in this route used to be a bare `await fetch(...)` whose result was
 * discarded, so the route returned `success: true` and told the user their subscription was
 * active whether or not a single document had been written.
 *
 * That is not hypothetical. These writes go to the Firestore REST API carrying
 * NEXT_PUBLIC_FIREBASE_API_KEY, which is an API key and not an authorization credential — the
 * request is UNAUTHENTICATED as far as security rules are concerned. Under the default-deny
 * rules from RULES-1 every one of them is denied. Without this check, the failure mode is a
 * customer who has paid, been congratulated, and has nothing.
 *
 * Throwing here is deliberate: the caller turns it into a 500 that says the payment needs
 * manual reconciliation, which is the truth, rather than a cheerful success.
 */
async function writeOrThrow(url: string, init: RequestInit, what: string): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[Payment Verify] ${what} FAILED ${res.status}: ${body.slice(0, 500)}`);
    throw new Error(`${what} failed with ${res.status}`);
  }
}

export async function POST(request: Request) {
  try {
    const { 
      orderId, 
      paymentId, 
      signature, 
      planSlug, 
      planName, 
      amount, 
      companyId, 
      companyName,
      userId, 
      userName,
      paymentMethod, 
      status 
    } = await request.json();

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Order ID and User ID are required' }, { status: 400 });
    }

    // If explicit failure passed from frontend gateway
    if (status === 'failed') {
      // Record failed payment in database for audit
      const paymentDoc = {
        fields: {
          orderId: { stringValue: orderId },
          paymentId: { stringValue: paymentId || `failed_${Date.now()}` },
          userId: { stringValue: userId },
          companyId: { stringValue: companyId || '' },
          companyName: { stringValue: companyName || '' },
          amount: { integerValue: String(amount || 0) },
          plan: { stringValue: planSlug || 'standard' },
          status: { stringValue: 'failed' },
          paymentMethod: { stringValue: paymentMethod || 'RAZORPAY' },
          createdAt: { timestampValue: new Date().toISOString() },
        }
      };

      // Audit only, on a path that has already failed — log rather than throw.
      await fetch(`${FIRESTORE_BASE}/payments?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDoc),
      }).then((res) => {
        if (!res.ok) console.error('[Payment Verify] failed-payment audit write failed:', res.status);
      }).catch((err) => console.error('[Payment Verify] failed-payment audit write threw:', err));

      return NextResponse.json({
        success: false,
        error: 'Payment was not completed or failed at gateway. Subscription was not updated.',
      }, { status: 400 });
    }

    // ─── C2 FIX: Razorpay Signature Verification ────────────────────────────
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    // PAY-1: this used to read `if (razorpaySecret && paymentId && signature)`, so a missing
    // secret or a missing signature skipped verification and fell through to granting the
    // subscription. That is fail-open on the money path: with RAZORPAY_KEY_SECRET unset — which
    // is its state in every environment this repository has — anything that could POST here got
    // a paid plan. It now refuses instead.
    if (!razorpaySecret || !paymentId || !signature) {
      console.error('[Payment Verify] Refusing to activate: signature verification is not possible.', {
        hasSecret: !!razorpaySecret,
        hasPaymentId: !!paymentId,
        hasSignature: !!signature,
      });
      return NextResponse.json({
        success: false,
        error: 'This payment could not be verified and no subscription was activated. If money was debited it will be refunded by the gateway. Please contact support with your order id.',
      }, { status: 403 });
    }

    {
      const expectedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('[Payment Verify] INVALID SIGNATURE. Expected:', expectedSignature, 'Got:', signature);

        // Log tampered payment attempt
        const tamperDoc = {
          fields: {
            orderId: { stringValue: orderId },
            paymentId: { stringValue: paymentId },
            userId: { stringValue: userId },
            status: { stringValue: 'signature_mismatch' },
            paymentMethod: { stringValue: paymentMethod || 'RAZORPAY' },
            createdAt: { timestampValue: new Date().toISOString() },
          }
        };
        await fetch(`${FIRESTORE_BASE}/payments?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tamperDoc),
        }).catch(() => {});

        return NextResponse.json({
          success: false,
          error: 'Payment signature verification failed. This incident has been logged.',
        }, { status: 403 });
      }
    }

    // ─── Validate the amount against the plan price ──────────────────────────
    // PAY-1: this used to skip the check entirely for an unknown plan slug and for any
    // zero-price plan, so `planSlug: 'anything'` sailed past it. Both are now refused.
    const expectedPrice = typeof planSlug === 'string' ? PLAN_PRICES[planSlug] : undefined;

    if (expectedPrice === undefined) {
      console.error(`[Payment Verify] UNKNOWN PLAN "${planSlug}" — refusing.`);
      return NextResponse.json({
        success: false,
        error: 'That subscription plan was not recognised and no subscription was activated.',
      }, { status: 400 });
    }

    if (expectedPrice <= 0) {
      // Nothing is owed on a free plan, so there is no payment here to verify.
      return NextResponse.json({
        success: false,
        error: 'No payment is required for this plan.',
      }, { status: 400 });
    }

    if (amount !== expectedPrice) {
      console.error(`[Payment Verify] AMOUNT MISMATCH. Plan ${planSlug} expects ₹${expectedPrice}, got ₹${amount}`);
      return NextResponse.json({
        success: false,
        error: 'Payment amount does not match the selected plan. Please contact support.',
      }, { status: 400 });
    }

    // Verified / Captured payment handling
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(now.getFullYear() + 1); // 1 year annual subscription

    const verifiedPaymentId = paymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Create record in 'payments' collection
    const paymentDoc = {
      fields: {
        orderId: { stringValue: orderId },
        paymentId: { stringValue: verifiedPaymentId },
        userId: { stringValue: userId },
        userName: { stringValue: userName || 'Customer' },
        companyId: { stringValue: companyId || '' },
        companyName: { stringValue: companyName || 'Business' },
        amount: { integerValue: String(amount || 0) },
        plan: { stringValue: planSlug || 'standard' },
        planName: { stringValue: planName || 'Standard Plan' },
        status: { stringValue: 'captured' },
        signatureVerified: { booleanValue: !!(razorpaySecret && signature) },
        paymentMethod: { stringValue: paymentMethod || 'RAZORPAY' },
        createdAt: { timestampValue: now.toISOString() },
      }
    };

    await writeOrThrow(`${FIRESTORE_BASE}/payments?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentDoc),
    }, 'payments record');

    // 2. Create/Update record in 'subscriptions' collection
    const subscriptionDoc = {
      fields: {
        userId: { stringValue: userId },
        companyId: { stringValue: companyId || '' },
        plan: { stringValue: planSlug || 'standard' },
        planName: { stringValue: planName || 'Standard Plan' },
        status: { stringValue: 'active' },
        amount: { integerValue: String(amount || 0) },
        startDate: { timestampValue: now.toISOString() },
        endDate: { timestampValue: expiryDate.toISOString() },
        autoRenew: { booleanValue: true },
        paymentMethod: { stringValue: paymentMethod || 'RAZORPAY' },
        createdAt: { timestampValue: now.toISOString() },
        updatedAt: { timestampValue: now.toISOString() },
      }
    };

    await writeOrThrow(`${FIRESTORE_BASE}/subscriptions?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionDoc),
    }, 'subscription record');

    // 3. Update company record if companyId is present
    if (companyId) {
      const companyPatch = {
        fields: {
          subscriptionPlan: { stringValue: planSlug || 'standard' },
          isPremium: { booleanValue: true },
          planStartDate: { timestampValue: now.toISOString() },
          planEndDate: { timestampValue: expiryDate.toISOString() },
          updatedAt: { timestampValue: now.toISOString() },
        }
      };

      await writeOrThrow(`${FIRESTORE_BASE}/companies/${companyId}?updateMask.fieldPaths=subscriptionPlan&updateMask.fieldPaths=isPremium&updateMask.fieldPaths=planStartDate&updateMask.fieldPaths=planEndDate&updateMask.fieldPaths=updatedAt&key=${API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyPatch),
      }, 'company plan update');
    }

    // 4. Update user record
    if (userId) {
      const userPatch = {
        fields: {
          subscriptionPlan: { stringValue: planSlug || 'standard' },
          isPremium: { booleanValue: true },
          updatedAt: { timestampValue: now.toISOString() },
        }
      };

      await writeOrThrow(`${FIRESTORE_BASE}/users/${userId}?updateMask.fieldPaths=subscriptionPlan&updateMask.fieldPaths=isPremium&updateMask.fieldPaths=updatedAt&key=${API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPatch),
      }, 'user plan update');
    }

    // 5. Create user notification
    const notificationDoc = {
      fields: {
        userId: { stringValue: userId },
        type: { stringValue: 'system' },
        title: { stringValue: `Payment Successful! 🎉` },
        message: { stringValue: `Your ${planName || 'Annual'} subscription (₹${amount?.toLocaleString('en-IN')}) is now active.` },
        read: { booleanValue: false },
        actionUrl: { stringValue: companyId ? '/employer/subscription' : '/seeker/subscription' },
        createdAt: { timestampValue: now.toISOString() },
      }
    };

    // Deliberately not writeOrThrow: the subscription is already active by this point, and
    // failing the whole payment because a courtesy notification did not write would be worse
    // than the missing notification. It is logged instead of swallowed.
    await fetch(`${FIRESTORE_BASE}/notifications?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationDoc),
    }).then((res) => {
      if (!res.ok) console.error('[Payment Verify] notification write failed:', res.status);
    }).catch((err) => console.error('[Payment Verify] notification write threw:', err));

    return NextResponse.json({
      success: true,
      paymentId: verifiedPaymentId,
      orderId,
      status: 'captured',
      message: 'Payment verified and subscription activated successfully!',
    });
  } catch (error: any) {
    // PAY-1: this used to say "Database state was protected", which was not something the code
    // knew. The writes are five separate REST calls with no transaction between them, so a
    // failure part-way through leaves exactly the partial state the old message denied.
    console.error('[Payment Verification Error]:', error);
    return NextResponse.json({
      success: false,
      error: 'The payment could not be recorded. If money was debited, quote your order id to support and it will be reconciled manually — do not pay again.',
    }, { status: 500 });
  }
}
