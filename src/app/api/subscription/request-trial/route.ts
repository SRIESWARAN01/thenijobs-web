import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, FieldValue } from '@/lib/firebase/firebaseAdmin';
import { safeReadRequestBody } from '@/lib/api/safeResponse';
import { sendAdminTrialWhatsAppAlert } from '@/lib/notifications/adminWhatsAppAlert';

export async function POST(req: NextRequest) {
  try {
    const body = await safeReadRequestBody<{ userId?: string; companyId?: string }>(req, {});
    const { userId, companyId } = body;

    if (!userId && !companyId) {
      return NextResponse.json(
        { success: false, error: 'User ID or Company ID is required.' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();

    let existingUserData: Record<string, any> | null = null;
    let existingCompanyData: Record<string, any> | null = null;

    // 1. Guard against duplicate trial activation
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        existingUserData = userDoc.data() || null;
        if (existingUserData && (existingUserData.trialStartDate || existingUserData.trialEndDate)) {
          return NextResponse.json(
            { success: false, error: 'A 15-day free trial has already been used by this account.' },
            { status: 400 }
          );
        }
      }

      // Check subscriptions ledger for historical trial
      const subSnap = await db
        .collection('subscriptions')
        .where('userId', '==', userId)
        .where('paymentMethod', '==', 'FREE_TRIAL_15_DAYS')
        .limit(1)
        .get();

      if (!subSnap.empty) {
        return NextResponse.json(
          { success: false, error: 'A 15-day free trial has already been recorded for this account.' },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    let targetCompanyId = companyId;
    if (!targetCompanyId && userId) {
      try {
        const compSnap = await db.collection('companies').where('ownerId', '==', userId).limit(1).get();
        if (!compSnap.empty) {
          targetCompanyId = compSnap.docs[0].id;
        }
      } catch (err) {
        console.warn('[request-trial] Could not query company by ownerId:', err);
      }
    }

    if (targetCompanyId) {
      const companyDoc = await db.collection('companies').doc(targetCompanyId).get();
      if (companyDoc.exists) {
        existingCompanyData = companyDoc.data() || null;
        if (existingCompanyData && (existingCompanyData.trialStartDate || existingCompanyData.trialEndDate)) {
          return NextResponse.json(
            { success: false, error: 'A 15-day free trial has already been used by this company.' },
            { status: 400 }
          );
        }

        // Automatic 15-day free trial activates immediately without upfront payment.
        // Website preview is accessible (isActive: true), but verificationStatus stays pending.
        await db.collection('companies').doc(targetCompanyId).set({
          trialRequested: true,
          requestedPlan: 'standard',
          subscriptionPlan: 'standard',
          subscriptionStatus: 'trial',
          accountStatus: 'trial_active',
          trialStartDate: now,
          trialEndDate: trialEndDate,
          trialStartedAt: now,
          trialEndsAt: trialEndDate,
          verificationStatus: 'pending',
          isVerified: false,
          isActive: true,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    }

    if (userId) {
      // Activate 15-day free trial for user. canPostJobs stays false until Admin approval.
      await db.collection('users').doc(userId).set({
        trialRequested: true,
        selectedPlan: 'trial',
        requestedPlan: 'standard',
        subscriptionPlan: 'standard',
        subscriptionStatus: 'trial',
        accountStatus: 'trial_active',
        trialStartDate: now,
        trialEndDate: trialEndDate,
        trialStartedAt: now,
        trialEndsAt: trialEndDate,
        trialEligible: false,
        hasUsedFreeTrial: true,
        trialDurationDays: 15,
        paymentStatus: 'not_required',
        approvalStatus: 'pending',
        isEmployer: true,
        canPostJobs: false,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    // Record entry in subscriptions collection for tracking
    try {
      await db.collection('subscriptions').add({
        companyId: targetCompanyId || '',
        companyName: existingCompanyData?.name || existingUserData?.companyName || 'Business Owner',
        userId: userId || '',
        plan: 'standard',
        status: 'trial',
        paymentStatus: 'free_trial',
        paymentMethod: 'FREE_TRIAL_15_DAYS',
        amount: 0,
        startDate: now,
        endDate: trialEndDate,
        autoRenew: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (subErr) {
      console.warn('[request-trial] Failed to record subscription entry:', subErr);
    }

    // Automated WhatsApp alert to Admin for new free trial registration
    const companyDisplayName = existingCompanyData?.name || existingUserData?.companyName || 'Registered Company';
    const ownerDisplayName = existingUserData?.name || existingUserData?.displayName || 'Business Owner';
    const contactPhone = existingCompanyData?.phone || existingUserData?.phone || '';
    const contactEmail = existingCompanyData?.email || existingUserData?.email || '';

    void sendAdminTrialWhatsAppAlert({
      companyName: companyDisplayName,
      ownerName: ownerDisplayName,
      phone: contactPhone,
      email: contactEmail,
      planName: 'Standard Plan (15-Day Free Trial)',
      trialStartDate: now.toLocaleDateString('en-IN'),
      trialExpiryDate: trialEndDate.toLocaleDateString('en-IN'),
    }).catch(() => 0);

    return NextResponse.json({
      success: true,
      message: '15-Day Free Trial activated! Your website preview is accessible. Job posting will unlock upon Admin approval.',
      status: 'trial_active',
    });
  } catch (error: any) {
    console.error('[request-trial] Error requesting free trial:', error);
    const isAuthErr = error?.message?.includes('UNAUTHENTICATED') || error?.message?.includes('invalid_grant');
    const userMsg = isAuthErr
      ? 'Database service authentication is undergoing synchronization. Please verify FIREBASE_SERVICE_ACCOUNT_KEY in Vercel settings and retry.'
      : (error?.message || 'Failed to request free trial.');
    return NextResponse.json(
      { success: false, error: userMsg },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
