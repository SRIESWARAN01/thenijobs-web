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

    console.log(`[CRON expire-trials] Suspended ${activeTrialDocs.length} companies at ${now.toISOString()}`);
    return NextResponse.json({
      message: `Processed ${activeTrialDocs.length} expired trial(s)`,
      count: activeTrialDocs.length,
      companies: activeTrialDocs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, name: d.data().name })),
    });
  } catch (err: any) {
    console.error('[CRON expire-trials] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// Also support POST for external CRON services that prefer POST
export const POST = GET;
