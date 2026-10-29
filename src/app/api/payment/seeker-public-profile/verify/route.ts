import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { verifyRazorpaySignature, fetchRazorpayPayment } from '@/lib/firebase/paymentAdminService';
import { SEEKER_PUBLIC_PROFILE_FEE_INR } from '@/lib/constants';

/**
 * Verified Candidate Public Portfolio Payment Route.
 *
 * Provides cryptographic HMAC SHA-256 verification and gateway status validation
 * before activating the seeker's public portfolio website.
 * Sets isPortfolioPublic = true, sets publicProfilePaidUntil to 1 year,
 * updates portfolioSites status to 'published', and records an immutable audit in payments/{id}.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, userId } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    if (!paymentId || typeof paymentId !== 'string') {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Dual-Path Gateway Verification
    const isSignatureValid = signature ? verifyRazorpaySignature(orderId, paymentId, signature) : false;

    let isApiVerified = false;
    if (!isSignatureValid) {
      console.warn(`[Seeker Public Profile Verify] Signature check did not pass for ${paymentId}. Querying Razorpay API...`);
      const rpPayment = await fetchRazorpayPayment(paymentId);
      isApiVerified = !!(
        rpPayment &&
        (rpPayment.status === 'captured' || rpPayment.status === 'authorized') &&
        (!rpPayment.order_id || rpPayment.order_id === orderId)
      );
    }

    if (!isSignatureValid && !isApiVerified) {
      console.error('[Seeker Public Profile Verify] Verification failed: neither signature nor Razorpay API confirmed payment.', {
        orderId,
        paymentId,
        userId,
      });
      return NextResponse.json({
        success: false,
        error: 'Payment verification failed. If your account was debited, please contact support.',
      }, { status: 400 });
    }

    // 2. Database Updates with Admin Firestore
    const db = getAdminFirestore();
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(now.getFullYear() + 1);

    // Record verified transaction in payments/{paymentId}
    await db.collection('payments').doc(paymentId).set({
      paymentId,
      orderId,
      userId,
      amount: SEEKER_PUBLIC_PROFILE_FEE_INR,
      currency: 'INR',
      purpose: 'seeker-public-profile',
      status: 'captured',
      paymentMethod: 'RAZORPAY_VERIFY',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    // Activate Seeker Profile
    await db.collection('seekerProfiles').doc(userId).set({
      isPortfolioPublic: true,
      publicProfilePaidUntil: expiryDate,
      updatedAt: now,
    }, { merge: true });

    // Update Portfolio Sites to Published
    const siteSnap = await db.collection('portfolioSites').where('ownerId', '==', userId).limit(1).get();
    if (!siteSnap.empty) {
      const siteDoc = siteSnap.docs[0];
      await siteDoc.ref.set({
        status: 'published',
        visibility: 'public',
        publishedAt: now,
        updatedAt: now,
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      activated: userId,
      paidUntil: expiryDate.toISOString(),
      amount: SEEKER_PUBLIC_PROFILE_FEE_INR,
    });
  } catch (error: any) {
    console.error('[Seeker Public Profile Verify Error]:', error?.message || error);
    return NextResponse.json({ error: 'Failed to verify payment and publish portfolio' }, { status: 500 });
  }
}
