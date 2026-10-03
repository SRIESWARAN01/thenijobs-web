/**
 * /api/cron/expire-trials
 *
 * Called by a cron job (e.g. Vercel Cron / external CRON service) every 12 h.
 * Scans companies whose trial has expired and suspends them.
 *
 * Authorization: Bearer token from CRON_SECRET env var.
 * Example Vercel cron.json:
 *   { "crons": [{ "path": "/api/cron/expire-trials", "schedule": "0 0,12 * * *" }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import crypto from 'crypto';

const CRON_SECRET = process.env.CRON_SECRET;

function verifyAuth(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || '';
  if (CRON_SECRET && auth.startsWith('Bearer ')) {
    const supplied = Buffer.from(auth.slice(7));
    const expected = Buffer.from(CRON_SECRET);
    if (supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected)) return true;
  }
  // Allow Vercel internal cron calls
  const cronHeader = req.headers.get('x-vercel-cron');
  if (cronHeader === '1') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const nowTs = Timestamp.fromDate(now);

  try {
    const db = getAdminFirestore();

    // Find companies where trialEndDate <= now AND paymentStatus != 'paid' AND status not already suspended/expired
    const snapshot = await db
      .collection('companies')
      .where('trialEndDate', '<=', nowTs)
      .where('paymentStatus', '!=', 'paid')
      .get();

    const activeTrialDocs = snapshot.docs.filter((d: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = d.data();
      return (
        data.accountStatus !== 'suspended' &&
        data.subscriptionStatus !== 'trial_expired' &&
        data.subscriptionStatus !== 'suspended' &&
        // Exclude pending_admin_approval — they don't have a trial yet
        data.accountStatus !== 'pending_admin_approval'
      );
    });

    if (activeTrialDocs.length === 0) {
      return NextResponse.json({ message: 'No expired trials to process', count: 0 });
    }

    const batch = db.batch();
    const userUpdates: Promise<any>[] = [];
    const notificationInserts: Promise<any>[] = [];

    for (const companyDoc of activeTrialDocs) {
      const company = companyDoc.data();

      // Suspend the company
      batch.update(companyDoc.ref, {
        subscriptionStatus: 'trial_expired',
        accountStatus: 'suspended',
        websiteStatus: 'suspended',
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Update the user doc
      if (company.ownerId) {
        userUpdates.push(
          db.collection('users').doc(company.ownerId).update({
            subscriptionStatus: 'trial_expired',
            accountStatus: 'suspended',
            updatedAt: FieldValue.serverTimestamp(),
          }).catch(() => {})
        );

        // In-app notification
        notificationInserts.push(
          db.collection('notifications').add({
            userId: company.ownerId,
            type: 'system',
            title: 'Free Trial Expired ⏳',
            message: `Your THENIJOBS 15-day Standard free trial for "${company.name || 'your business'}" has ended. Please complete payment to reactivate your employer services and company website.`,
            actionUrl: '/employer/billing',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
          }).catch(() => {})
        );

        // Audit log entry
        notificationInserts.push(
          db.collection('activityLogs').add({
            userId: 'system_cron',
            userName: 'System (CRON)',
            action: 'Trial auto-expired',
            target: company.name || companyDoc.id,
            targetId: companyDoc.id,
            details: `Trial ended at ${now.toISOString()}. Account suspended automatically.`,
            timestamp: FieldValue.serverTimestamp(),
          }).catch(() => {})
        );
      }
    }

    await batch.commit();
    await Promise.allSettled([...userUpdates, ...notificationInserts]);

    console.log(`[CRON expire-trials] Suspended ${activeTrialDocs.length} trial companies at ${now.toISOString()}`);

    // ═══════════════════════════════════════════════════════════════════════════
    // C4 FIX: Also handle PAID subscription expiry (subscriptionEndDate passed)
    // ═══════════════════════════════════════════════════════════════════════════
    let paidExpiredCount = 0;
    try {
      const paidSnapshot = await db
        .collection('companies')
        .where('subscriptionEndDate', '<=', nowTs)
        .where('paymentStatus', '==', 'paid')
        .get();

      const expiredPaidDocs = paidSnapshot.docs.filter((d: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = d.data();
        return (
          data.accountStatus !== 'suspended' &&
          data.subscriptionStatus !== 'subscription_expired' &&
          data.subscriptionStatus !== 'suspended'
        );
      });

      if (expiredPaidDocs.length > 0) {
        const paidBatch = db.batch();
        const paidUserUpdates: Promise<any>[] = [];
        const paidNotifications: Promise<any>[] = [];

        for (const companyDoc of expiredPaidDocs) {
          const company = companyDoc.data();

          paidBatch.update(companyDoc.ref, {
            subscriptionStatus: 'subscription_expired',
            accountStatus: 'suspended',
            websiteStatus: 'suspended',
            updatedAt: FieldValue.serverTimestamp(),
          });

          if (company.ownerId) {
            paidUserUpdates.push(
              db.collection('users').doc(company.ownerId).update({
                subscriptionStatus: 'subscription_expired',
                accountStatus: 'suspended',
                updatedAt: FieldValue.serverTimestamp(),
              }).catch(() => {})
            );

            paidNotifications.push(
              db.collection('notifications').add({
                userId: company.ownerId,
                type: 'system',
                title: 'Subscription Expired 📋',
                message: `Your THENIJOBS annual subscription for "${company.name || 'your business'}" has expired. Please renew to continue using employer services and your company website.`,
                actionUrl: '/employer/billing',
                read: false,
                createdAt: FieldValue.serverTimestamp(),
              }).catch(() => {})
            );

            paidNotifications.push(
              db.collection('activityLogs').add({
                userId: 'system_cron',
                userName: 'System (CRON)',
                action: 'Paid subscription auto-expired',
                target: company.name || companyDoc.id,
                targetId: companyDoc.id,
                details: `Paid subscription ended at ${now.toISOString()}. Account suspended automatically.`,
                timestamp: FieldValue.serverTimestamp(),
              }).catch(() => {})
            );
          }
        }

        await paidBatch.commit();
        await Promise.allSettled([...paidUserUpdates, ...paidNotifications]);
        paidExpiredCount = expiredPaidDocs.length;
        console.log(`[CRON expire-trials] Suspended ${paidExpiredCount} paid-expired companies at ${now.toISOString()}`);
      }
    } catch (paidErr: any) {
      console.error('[CRON expire-trials] Paid subscription expiry error:', paidErr);
      // Non-fatal: trial expiry already committed, don't fail the whole response
    }

    return NextResponse.json({
      message: `Processed ${activeTrialDocs.length} expired trial(s) and ${paidExpiredCount} expired paid subscription(s)`,
      trialExpired: activeTrialDocs.length,
      paidExpired: paidExpiredCount,
      count: activeTrialDocs.length + paidExpiredCount,
      companies: activeTrialDocs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, name: d.data().name })),
    });
  } catch (err: any) {
    console.error('[CRON expire-trials] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// Also support POST for external CRON services that prefer POST
export const POST = GET;
