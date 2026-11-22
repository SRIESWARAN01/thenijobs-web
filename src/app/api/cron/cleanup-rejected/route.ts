import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth, syncClockSkew, FieldValue } from '@/lib/firebase/firebaseAdmin';
import {
  DESIGNATED_RETAINED_ADMIN_UID,
  DESIGNATED_RETAINED_ADMIN_EMAIL,
  RETAINED_PRODUCTION_COMPANIES,
} from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handleCleanup(req);
}

export async function POST(req: NextRequest) {
  return handleCleanup(req);
}

async function handleCleanup(req: NextRequest) {
  try {
    await syncClockSkew();
    const db = getAdminFirestore();
    const auth = getAdminAuth();

    const { searchParams } = new URL(req.url);
    const retentionDaysParam = parseInt(searchParams.get('days') || '15', 10);
    const retentionDays = Math.min(Math.max(isNaN(retentionDaysParam) ? 15 : retentionDaysParam, 10), 30);

    const now = Date.now();
    const cutoffMs = now - retentionDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(cutoffMs);

    const retainedCompanyIds = new Set<string>(RETAINED_PRODUCTION_COMPANIES.map((c) => c.id));

    let deletedUsersCount = 0;
    let deletedCompaniesCount = 0;
    const deletedLog: any[] = [];

    // 1. Process Rejected Users
    const rejectedUsersSnap = await db
      .collection('users')
      .where('approvalStatus', '==', 'rejected')
      .get();

    for (const doc of rejectedUsersSnap.docs) {
      const data = doc.data();

      // SAFETY GUARDS
      if (
        doc.id === DESIGNATED_RETAINED_ADMIN_UID ||
        data.email === DESIGNATED_RETAINED_ADMIN_EMAIL ||
        data.role === 'admin' ||
        data.approvalStatus === 'approved' ||
        data.accountStatus === 'active' ||
        data.paymentStatus === 'paid'
      ) {
        continue;
      }

      const rejectedTime = data.rejectedAt?.toDate
        ? data.rejectedAt.toDate().getTime()
        : data.updatedAt?.toDate
        ? data.updatedAt.toDate().getTime()
        : data.createdAt?.toDate
        ? data.createdAt.toDate().getTime()
        : null;

      // Only delete if older than retention threshold
      if (rejectedTime && rejectedTime < cutoffMs) {
        try {
          await db.collection('users').doc(doc.id).delete();
          try {
            await auth.deleteUser(doc.id);
          } catch {
            // ignore if already deleted from auth
          }
          deletedUsersCount++;
          deletedLog.push({ id: doc.id, type: 'user', email: data.email, name: data.fullName || data.name });
        } catch (delErr) {
          console.warn(`[CleanupRejected] Failed to delete user ${doc.id}:`, delErr);
        }
      }
    }

    // 2. Process Rejected Companies
    const rejectedCompaniesSnap = await db
      .collection('companies')
      .where('approvalStatus', '==', 'rejected')
      .get();

    for (const doc of rejectedCompaniesSnap.docs) {
      const data = doc.data();

      // SAFETY GUARDS
      if (
        retainedCompanyIds.has(doc.id) ||
        data.approvalStatus === 'approved' ||
        data.verificationStatus === 'verified' ||
        data.isActive === true ||
        data.subscriptionStatus === 'active' ||
        data.paymentStatus === 'paid'
      ) {
        continue;
      }

      const rejectedTime = data.rejectedAt?.toDate
        ? data.rejectedAt.toDate().getTime()
        : data.updatedAt?.toDate
        ? data.updatedAt.toDate().getTime()
        : data.createdAt?.toDate
        ? data.createdAt.toDate().getTime()
        : null;

      if (rejectedTime && rejectedTime < cutoffMs) {
        try {
          await db.collection('companies').doc(doc.id).delete();
          deletedCompaniesCount++;
          deletedLog.push({ id: doc.id, type: 'company', name: data.name });
        } catch (delErr) {
          console.warn(`[CleanupRejected] Failed to delete company ${doc.id}:`, delErr);
        }
      }
    }

    // 3. Record Audit Log if any records were purged
    if (deletedUsersCount > 0 || deletedCompaniesCount > 0) {
      try {
        await db.collection('activityLogs').add({
          action: 'Auto-cleanup of rejected data',
          retentionDays,
          deletedUsersCount,
          deletedCompaniesCount,
          cutoffDate,
          deletedRecords: deletedLog,
          timestamp: FieldValue.serverTimestamp(),
        });
      } catch (logErr) {
        console.warn('[CleanupRejected] Failed to log activity:', logErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned up rejected records older than ${retentionDays} days.`,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      deletedUsersCount,
      deletedCompaniesCount,
      totalDeleted: deletedUsersCount + deletedCompaniesCount,
    });
  } catch (error: any) {
    console.error('[CleanupRejected] Execution error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to cleanup rejected data' },
      { status: 500 }
    );
  }
}
