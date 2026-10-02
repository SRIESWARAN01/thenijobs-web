/**
 * /api/cron/expire-jobs
 *
 * Daily automated cron job (runs at 01:00 UTC every night).
 * Scans active jobs whose deadline or expiryDate has passed,
 * marks them status: 'expired', isActive: false in Firestore,
 * and logs to activityLogs.
 *
 * Authorization: Bearer token matching CRON_SECRET or Vercel x-vercel-cron header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

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

  try {
    const db = getAdminFirestore();

    // Query active jobs
    const snapshot = await db
      .collection('jobs')
      .where('status', '==', 'active')
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No active jobs found', count: 0 });
    }

    const expiredJobs: { id: string; title: string; companyName?: string; deadline?: any }[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const rawDeadline = data.deadline || data.expiryDate;
      if (!rawDeadline) continue;

      let deadlineDate: Date | null = null;
      try {
        if (typeof rawDeadline === 'string' && rawDeadline.includes('/')) {
          const parts = rawDeadline.split('/');
          deadlineDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        } else if (rawDeadline.toDate) {
          deadlineDate = rawDeadline.toDate();
        } else if (rawDeadline._seconds) {
          deadlineDate = new Date(rawDeadline._seconds * 1000);
        } else {
          deadlineDate = new Date(rawDeadline);
        }
      } catch {
        continue;
      }

      if (deadlineDate && !isNaN(deadlineDate.getTime()) && deadlineDate < now) {
        expiredJobs.push({
          id: doc.id,
          title: data.title || 'Untitled Job',
          companyName: data.companyName || data.company,
          deadline: rawDeadline,
        });
      }
    }

    if (expiredJobs.length === 0) {
      return NextResponse.json({ message: 'No expired jobs to process', count: 0 });
    }

    // Process in batches (Firestore batch limit is 500 writes)
    const BATCH_SIZE = 400;
    for (let i = 0; i < expiredJobs.length; i += BATCH_SIZE) {
      const chunk = expiredJobs.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const item of chunk) {
        const ref = db.collection('jobs').doc(item.id);
        batch.update(ref, {
          status: 'expired',
          isActive: false,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
    }

    // Log to activityLogs
    try {
      await db.collection('activityLogs').add({
        userId: 'system_cron',
        userName: 'System (CRON)',
        action: 'Jobs auto-expired',
        target: `${expiredJobs.length} Job Postings`,
        targetId: 'cron-expire-jobs',
        details: `Auto-expired ${expiredJobs.length} job(s) past deadline at ${now.toISOString()}.`,
        timestamp: FieldValue.serverTimestamp(),
      });
    } catch (logErr) {
      console.warn('[CRON expire-jobs] Activity log write warning:', logErr);
    }

    console.log(`[CRON expire-jobs] Successfully expired ${expiredJobs.length} job(s) at ${now.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredJobs.length} expired job(s)`,
      count: expiredJobs.length,
      jobs: expiredJobs.map(j => ({ id: j.id, title: j.title })),
    });
  } catch (err: any) {
    console.error('[CRON expire-jobs] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export const POST = GET;
