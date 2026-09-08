import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

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
 * That is not hypothetical. HOSTING-1: these writes used to go to the Firestore REST API
 * carrying NEXT_PUBLIC_FIREBASE_API_KEY, which is an API key and not an authorization
 * credential — the request was UNAUTHENTICATED as far as security rules are concerned, and
 * under the default-deny rules from RULES-1 every one of them was denied. They now go through
 * the Firebase Admin SDK (see firebaseAdmin.ts) with a real server identity. Without this
 * check, the failure mode is a customer who has paid, been congratulated, and has nothing.
 *
 * Throwing here is deliberate: the caller turns it into a 500 that says the payment needs
 * manual reconciliation, which is the truth, rather than a cheerful success.
 */
async function writeOrThrow(op: () => Promise<unknown>, what: string): Promise<void> {
  try {
    await op();
  } catch (err: any) {
    console.error(`[Payment Verify] ${what} FAILED: ${err?.message || err}`);
    throw new Error(`${what} failed`);
  }
}

/**
 * HOSTING-1: an audit-log write that must never turn "log rather than throw" into "throw
 * instead" — getAdminFirestore() itself throws synchronously when no credential is configured,
 * which a bare `.catch()` on the write promise does not catch (the throw happens before any
 * promise exists). Caught here at the call site instead, exactly matching this route's own
 * pre-existing swallow-and-log convention for its audit writes, so an uncredentialed Admin SDK
 * still returns the request's real (400/403) response instead of an unrelated 500.
 */
function bestEffortWrite(op: () => Promise<unknown>, what: string): void {
  try {
    op()?.catch?.((err: any) => console.error(`[Payment Verify] ${what} threw:`, err?.message || err));
  } catch (err: any) {
    console.error(`[Payment Verify] ${what} threw:`, err?.message || err);
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

    // HOSTING-1: getAdminFirestore() is only ever called inside a write site below (via
    // writeOrThrow/bestEffortWrite) — never hoisted here. A request that never reaches a write
    // at all (unknown plan, wrong amount, no signature) must still get its specific 400/403,
    // not a generic 500 from an Admin SDK credential this particular request didn't need yet.

    // If explicit failure passed from frontend gateway
    if (status === 'failed') {
      // Audit only, on a path that has already failed — log rather than throw.
      bestEffortWrite(() => getAdminFirestore().collection('payments').add({
        orderId,
        paymentId: paymentId || `failed_${Date.now()}`,
        userId,
        companyId: companyId || '',
        companyName: companyName || '',
        amount: amount || 0,
        plan: planSlug || 'standard',
        status: 'failed',
        paymentMethod: paymentMethod || 'RAZORPAY',
        createdAt: new Date(),
      }), 'failed-payment audit write');

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
        bestEffortWrite(() => getAdminFirestore().collection('payments').add({
          orderId,
          paymentId,
          userId,
          status: 'signature_mismatch',
          paymentMethod: paymentMethod || 'RAZORPAY',
          createdAt: new Date(),
        }), 'signature-mismatch audit write');

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

    // Verified / Captured payment handling. Only reached once every check above has passed,
    // so a missing Admin SDK credential from here on is a genuine write failure — the outer
    // catch below turns it into the "could not be recorded" 500, which is the correct, honest
    // response for a payment that passed verification but couldn't be persisted.
    const db = getAdminFirestore();
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(now.getFullYear() + 1); // 1 year annual subscription

    const verifiedPaymentId = paymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Create record in 'payments' collection
    await writeOrThrow(() => db.collection('payments').add({
      orderId,
      paymentId: verifiedPaymentId,
      userId,
      userName: userName || 'Customer',
      companyId: companyId || '',
      companyName: companyName || 'Business',
      amount: amount || 0,
      plan: planSlug || 'standard',
      planName: planName || 'Standard Plan',
      status: 'captured',
      signatureVerified: !!(razorpaySecret && signature),
      paymentMethod: paymentMethod || 'RAZORPAY',
      createdAt: now,
    }), 'payments record');

    // 2. Create/Update record in 'subscriptions' collection
    await writeOrThrow(() => db.collection('subscriptions').add({
      userId,
      companyId: companyId || '',
      plan: planSlug || 'standard',
      planName: planName || 'Standard Plan',
      status: 'active',
      amount: amount || 0,
      startDate: now,
      endDate: expiryDate,
      autoRenew: true,
      paymentMethod: paymentMethod || 'RAZORPAY',
      createdAt: now,
      updatedAt: now,
    }), 'subscription record');

    // 3. Update company record if companyId is present
    if (companyId) {
      await writeOrThrow(() => db.collection('companies').doc(companyId).update({
        subscriptionPlan: planSlug || 'standard',
        isPremium: true,
        planStartDate: now,
        planEndDate: expiryDate,
        updatedAt: now,
      }), 'company plan update');
    }

    // 4. Update user record
    if (userId) {
      await writeOrThrow(() => db.collection('users').doc(userId).update({
        subscriptionPlan: planSlug || 'standard',
        isPremium: true,
        updatedAt: now,
      }), 'user plan update');
    }

    // 5. Create user notification
    // Deliberately not writeOrThrow: the subscription is already active by this point, and
    // failing the whole payment because a courtesy notification did not write would be worse
    // than the missing notification. It is logged instead of swallowed.
    bestEffortWrite(() => db.collection('notifications').add({
      userId,
      type: 'system',
      title: 'Payment Successful! 🎉',
      message: `Your ${planName || 'Annual'} subscription (₹${amount?.toLocaleString('en-IN')}) is now active.`,
      read: false,
      actionUrl: companyId ? '/employer/subscription' : '/seeker/subscription',
      createdAt: now,
    }), 'notification write');

    return NextResponse.json({
      success: true,
      paymentId: verifiedPaymentId,
      orderId,
      status: 'captured',
      message: 'Payment verified and subscription activated successfully!',
    });
  } catch (error: any) {
    // PAY-1: this used to say "Database state was protected", which was not something the code
    // knew. The writes are five separate Admin SDK calls with no transaction between them, so a
    // failure part-way through leaves exactly the partial state the old message denied.
    console.error('[Payment Verification Error]:', error?.message || error);
    return NextResponse.json({
      success: false,
      error: 'The payment could not be recorded. If money was debited, quote your order id to support and it will be reconciled manually — do not pay again.',
    }, { status: 500 });
  }
}
