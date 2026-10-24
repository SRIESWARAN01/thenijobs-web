import { NextResponse } from 'next/server';
import { ALL_VALID_PLAN_PRICES } from '@/lib/constants';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { 
  verifyRazorpaySignature, 
  fetchRazorpayPayment, 
  recordVerifiedPayment
} from '@/lib/firebase/paymentAdminService';

/**
 * Audit log helper that catches and logs errors without crashing the request.
 */
function bestEffortAuditWrite(op: () => Promise<unknown>, what: string): void {
  try {
    op()?.catch?.((err: any) => console.error(`[Payment Verify Audit] ${what} threw:`, err?.message || err));
  } catch (err: any) {
    console.error(`[Payment Verify Audit] ${what} threw:`, err?.message || err);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      paymentId,
      signature,
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
      status
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // If explicit failure reported from frontend gateway
    if (status === 'failed') {
      bestEffortAuditWrite(() => getAdminFirestore().collection('payments').doc(paymentId || `failed_${Date.now()}`).set({
        orderId,
        paymentId: paymentId || `failed_${Date.now()}`,
        userId: userId || '',
        companyId: companyId || '',
        companyName: companyName || '',
        amount: amount || 0,
        plan: planSlug || 'standard',
        status: 'failed',
        paymentMethod: paymentMethod || 'RAZORPAY',
        updatedAt: new Date(),
        createdAt: new Date(),
      }, { merge: true }), 'failed-payment audit write');

      return NextResponse.json({
        success: false,
        error: 'Payment was not completed or failed at gateway. Subscription was not updated.',
      }, { status: 400 });
    }

    if (!paymentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing Razorpay Payment ID. Cannot verify transaction.',
      }, { status: 400 });
    }

    // ─── 1. Dual-Path Verification ──────────────────────────────────────────
    // Path A: Cryptographic HMAC SHA256 signature verification
    const isSignatureValid = signature ? verifyRazorpaySignature(orderId, paymentId, signature) : false;

    // Path B: Fallback to direct Razorpay API query if signature check didn't pass
    // (e.g. if webhook / proxy stripped headers or key secret was misaligned)
    let rpVerifiedPayment: any = null;
    if (!isSignatureValid) {
      console.warn(`[Payment Verify] HMAC signature check did not pass for ${paymentId}. Querying Razorpay API directly...`);
      rpVerifiedPayment = await fetchRazorpayPayment(paymentId);
    }

    const isApiVerified = !!(
      rpVerifiedPayment && 
      (rpVerifiedPayment.status === 'captured' || rpVerifiedPayment.status === 'authorized') &&
      (!rpVerifiedPayment.order_id || rpVerifiedPayment.order_id === orderId)
    );

    if (!isSignatureValid && !isApiVerified) {
      console.error('[Payment Verify] Verification failed: neither HMAC signature nor Razorpay API confirmed this payment.', {
        orderId,
        paymentId,
        isSignatureValid,
        hasApiPayment: !!rpVerifiedPayment,
        apiStatus: rpVerifiedPayment?.status
      });

      // Audit invalid attempt
      bestEffortAuditWrite(() => getAdminFirestore().collection('payments').doc(`unverified_${paymentId}`).set({
        orderId,
        paymentId,
        userId: userId || '',
        status: 'signature_mismatch',
        paymentMethod: paymentMethod || 'RAZORPAY',
        createdAt: new Date(),
      }, { merge: true }), 'signature-mismatch audit write');

      return NextResponse.json({
        success: false,
        error: 'Payment could not be verified by cryptographic signature or Razorpay API. This incident has been logged.',
      }, { status: 403 });
    }

    // ─── 2. Validate Amount Against Plan ─────────────────────────────────────
    const expectedPrice = typeof planSlug === 'string' ? ALL_VALID_PLAN_PRICES[planSlug] : undefined;

    if (expectedPrice === undefined) {
      console.error(`[Payment Verify] UNKNOWN PLAN "${planSlug}" — refusing.`);
      return NextResponse.json({
        success: false,
        error: 'That subscription plan was not recognised and no subscription was activated.',
      }, { status: 400 });
    }

    if (expectedPrice <= 0) {
      return NextResponse.json({
        success: false,
        error: 'No payment is required for this plan.',
      }, { status: 400 });
    }

    // Allow slight float tolerance or verify against expected price
    const paidAmount = Number(amount) || (rpVerifiedPayment ? rpVerifiedPayment.amount / 100 : expectedPrice);
    if (Math.abs(paidAmount - expectedPrice) > 1) {
      console.error(`[Payment Verify] AMOUNT MISMATCH. Plan ${planSlug} expects ₹${expectedPrice}, got ₹${paidAmount}`);
      return NextResponse.json({
        success: false,
        error: `Payment amount (₹${paidAmount}) does not match the selected plan (₹${expectedPrice}). Please contact support.`,
      }, { status: 400 });
    }

    // ─── 2.5 Resolve Company Info if Omitted ─────────────────────────────────
    let resolvedCompanyId = companyId || '';
    let resolvedCompanyName = companyName || '';
    let resolvedCompanyAddress = companyAddress || '';
    let resolvedCompanyPhone = companyPhone || '';
    let resolvedCompanyGst = companyGst || '';

    if (!resolvedCompanyId && userId) {
      try {
        const db = getAdminFirestore();
        const compSnap = await db.collection('companies').where('ownerId', '==', userId).limit(1).get();
        if (!compSnap.empty) {
          const compDoc = compSnap.docs[0];
          const cData = compDoc.data();
          resolvedCompanyId = compDoc.id;
          resolvedCompanyName = resolvedCompanyName || cData.name || '';
          resolvedCompanyAddress = resolvedCompanyAddress || cData.address || '';
          resolvedCompanyPhone = resolvedCompanyPhone || cData.phone || '';
          resolvedCompanyGst = resolvedCompanyGst || cData.gstNumber || '';
        }
      } catch (cErr) {
        console.warn('[Payment Verify] Company lookup skipped:', cErr);
      }
    }

    // ─── 3. Record Verified Payment in Firestore ─────────────────────────────
    // Uses recordVerifiedPayment which is fully idempotent and updates:
    // orders, payments, subscriptions, companies, users, and seekerProfiles with { merge: true }
    try {
      const recordResult = await recordVerifiedPayment({
        orderId,
        paymentId,
        signature: signature || undefined,
        planSlug,
        planName,
        amount: paidAmount,
        companyId: resolvedCompanyId,
        companyName: resolvedCompanyName,
        companyAddress: resolvedCompanyAddress,
        companyPhone: resolvedCompanyPhone,
        companyGst: resolvedCompanyGst,
        userId: userId || '',
        userName,
        userEmail,
        userPhone,
        paymentMethod: paymentMethod || (rpVerifiedPayment?.method ? rpVerifiedPayment.method.toUpperCase() : 'RAZORPAY'),
        source: 'client_verify',
      });

      return NextResponse.json({
        success: true,
        paymentId: recordResult.paymentId,
        orderId: recordResult.orderId,
        receiptNo: recordResult.receiptNo,
        amount: recordResult.amount,
        planSlug: recordResult.planSlug,
        planName: recordResult.planName,
        startDate: recordResult.startDate,
        expiryDate: recordResult.expiryDate,
        status: 'captured',
        message: 'Payment verified and subscription activated successfully!',
        slogan: recordResult.slogan,
        receiptData: recordResult.receiptData,
      });
    } catch (dbError: any) {
      console.error('[Payment Verify DB Error] Verified with Razorpay but database write encountered issue:', dbError?.message || dbError);

      // Payment IS verified with Razorpay (money is charged!).
      // We MUST NOT tell the user "Payment failed / Pay again".
      // Return 202 Accepted with pendingReconciliation so frontend polls /reconcile and succeeds.
      return NextResponse.json({
        success: false,
        pendingReconciliation: true,
        orderId,
        paymentId,
        amount: paidAmount,
        planSlug,
        message: 'Payment received and verified by gateway. Database records are synchronizing. We are confirming automatically — do not pay again.',
      }, { status: 202 });
    }
  } catch (error: any) {
    console.error('[Payment Verification Route Exception]:', error?.message || error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred during verification. If money was debited, quote your order ID and payment ID to support for automatic reconciliation — do not pay again.',
    }, { status: 500 });
  }
}
