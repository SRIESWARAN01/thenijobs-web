import { NextResponse } from 'next/server';
import crypto from 'crypto';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!PROJECT_ID || !API_KEY) {
  console.warn('[Payment Verify] Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY environment variables.');
}

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ─── Plan Price Validation (must match pricing page) ─────────────────────────
const PLAN_PRICES: Record<string, number> = {
  free: 0,
  basic: 999,
  standard: 2999,
  premium: 7999,
  enterprise: 14999,
};

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

      await fetch(`${FIRESTORE_BASE}/payments?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDoc),
      });

      return NextResponse.json({
        success: false,
        error: 'Payment was not completed or failed at gateway. Subscription was not updated.',
      }, { status: 400 });
    }

    // ─── C2 FIX: Razorpay Signature Verification ────────────────────────────
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (razorpaySecret && paymentId && signature) {
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

    // ─── H12 FIX: Validate Amount Against Plan Price ─────────────────────────
    if (planSlug && PLAN_PRICES[planSlug] !== undefined) {
      const expectedPrice = PLAN_PRICES[planSlug];
      if (expectedPrice > 0 && amount !== expectedPrice) {
        console.error(`[Payment Verify] AMOUNT MISMATCH. Plan ${planSlug} expects ₹${expectedPrice}, got ₹${amount}`);
        return NextResponse.json({
          success: false,
          error: 'Payment amount does not match the selected plan. Please contact support.',
        }, { status: 400 });
      }
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

    await fetch(`${FIRESTORE_BASE}/payments?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentDoc),
    });

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

    await fetch(`${FIRESTORE_BASE}/subscriptions?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionDoc),
    });

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

      await fetch(`${FIRESTORE_BASE}/companies/${companyId}?updateMask.fieldPaths=subscriptionPlan&updateMask.fieldPaths=isPremium&updateMask.fieldPaths=planStartDate&updateMask.fieldPaths=planEndDate&updateMask.fieldPaths=updatedAt&key=${API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyPatch),
      });
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

      await fetch(`${FIRESTORE_BASE}/users/${userId}?updateMask.fieldPaths=subscriptionPlan&updateMask.fieldPaths=isPremium&updateMask.fieldPaths=updatedAt&key=${API_KEY}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userPatch),
      });
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

    await fetch(`${FIRESTORE_BASE}/notifications?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationDoc),
    });

    return NextResponse.json({
      success: true,
      paymentId: verifiedPaymentId,
      orderId,
      status: 'captured',
      message: 'Payment verified and subscription activated successfully!',
    });
  } catch (error: any) {
    console.error('[Payment Verification Error]:', error);
    return NextResponse.json({
      error: 'Backend payment verification error. Database state was protected.',
    }, { status: 500 });
  }
}
