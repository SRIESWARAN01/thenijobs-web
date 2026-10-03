/**
 * /api/subscription/reconcile
 *
 * Server-side reconciliation endpoint — C5 FIX.
 *
 * The client-side `useSubscriptionStatus` hook used to attempt reconciliation
 * writes directly via the Firestore client SDK, but those writes are blocked
 * by Firestore security rules (`companyModerationUnchanged`). This API route
 * uses the Firebase Admin SDK to perform the same reconciliation server-side.
 *
 * Called by the client hook when it detects a trial/subscription has expired
 * but Firestore hasn't been updated yet (between cron runs).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const { companyId, ownerUid } = await req.json();

    if (!companyId || typeof companyId !== 'string') {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const db = getAdminFirestore();
    const companyRef = db.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const company = companySnap.data()!;
    const now = new Date();
    const nowTs = Timestamp.fromDate(now);

    // Already suspended/expired — nothing to do
    if (
      company.accountStatus === 'suspended' &&
      (company.subscriptionStatus === 'trial_expired' || company.subscriptionStatus === 'subscription_expired' || company.subscriptionStatus === 'suspended')
    ) {
      return NextResponse.json({ reconciled: false, reason: 'already_suspended' });
    }

    // Don't reconcile pending approval companies
    if (company.accountStatus === 'pending_admin_approval' || company.verificationStatus === 'pending') {
      return NextResponse.json({ reconciled: false, reason: 'pending_approval' });
    }

    // Check if trial has expired
    const trialEndDate = company.trialEndDate?.toDate?.() || (company.trialEndDate ? new Date(company.trialEndDate) : null);
    const subEndDate = company.subscriptionEndDate?.toDate?.() || (company.subscriptionEndDate ? new Date(company.subscriptionEndDate) : null);
    const isPaid = company.paymentStatus === 'paid';

    let needsReconciliation = false;
    let expiryType = '';

    // Case 1: Trial expired, not paid
    if (trialEndDate && trialEndDate <= now && !isPaid) {
      needsReconciliation = true;
      expiryType = 'trial_expired';
    }

    // Case 2: Paid subscription expired
    if (isPaid && subEndDate && subEndDate <= now) {
      needsReconciliation = true;
      expiryType = 'subscription_expired';
    }

    if (!needsReconciliation) {
      return NextResponse.json({ reconciled: false, reason: 'still_active' });
    }

    // Perform the reconciliation via Admin SDK
    const updates: Record<string, any> = {
      subscriptionStatus: expiryType,
      accountStatus: 'suspended',
      websiteStatus: 'suspended',
      updatedAt: FieldValue.serverTimestamp(),
    };

    await companyRef.update(updates);

    // Update user doc if ownerUid is provided or exists on company
    const targetUid = ownerUid || company.ownerId;
    if (targetUid) {
      try {
        await db.collection('users').doc(targetUid).update({
          subscriptionStatus: expiryType,
          accountStatus: 'suspended',
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (userErr) {
        console.warn('[Reconcile API] User doc update skipped:', userErr);
      }

      // Create notification
      try {
        await db.collection('notifications').add({
          userId: targetUid,
          type: 'system',
          title: expiryType === 'trial_expired' ? 'Free Trial Expired ⏳' : 'Subscription Expired 📋',
          message: expiryType === 'trial_expired'
            ? `Your THENIJOBS 15-day Standard free trial has ended. Please complete payment to reactivate your employer services and company website.`
            : `Your THENIJOBS annual subscription has expired. Please renew to continue using employer services and your company website.`,
          actionUrl: '/employer/billing',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch {
        // Non-critical
      }
    }

    // Audit log
    try {
      await db.collection('activityLogs').add({
        userId: 'system_reconcile',
        userName: 'System (Reconciliation)',
        action: `${expiryType === 'trial_expired' ? 'Trial' : 'Subscription'} reconciled and suspended`,
        target: company.name || companyId,
        targetId: companyId,
        details: `Server-side reconciliation at ${now.toISOString()}.`,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch {
      // Non-critical
    }

    console.log(`[Reconcile API] Reconciled company "${companyId}" as "${expiryType}".`);

    return NextResponse.json({
      reconciled: true,
      expiryType,
      companyId,
    });
  } catch (err: any) {
    console.error('[Reconcile API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
