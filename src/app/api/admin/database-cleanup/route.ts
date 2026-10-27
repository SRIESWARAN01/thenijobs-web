import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  syncClockSkew,
  getAdminAuth,
  getAdminFirestore,
} from '@/lib/firebase/firebaseAdmin';
import {
  DESIGNATED_RETAINED_ADMIN_UID,
  DESIGNATED_RETAINED_ADMIN_EMAIL,
  RETAINED_PRODUCTION_COMPANIES,
} from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    await syncClockSkew();
    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // 1. Fetch Auth Users
    let authUsers: any[] = [];
    let nextPageToken: string | undefined;
    do {
      const list = await auth.listUsers(1000, nextPageToken);
      authUsers = authUsers.concat(list.users.map((u) => u.toJSON()));
      nextPageToken = list.pageToken;
    } while (nextPageToken);

    // 2. Fetch Firestore Users
    const usersSnap = await db.collection('users').get();
    const firestoreUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 3. Fetch Companies
    const compSnap = await db.collection('companies').get();
    const companies = compSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 4. Fetch Subscriptions
    const subSnap = await db.collection('subscriptions').get();
    const subscriptions = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 5. Fetch Balances & Wallets
    const ambSnap = await db.collection('ambassadors').get();
    const ambassadors = ambSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 6. Fetch Orphaned Artifacts
    const [portSnap, slugSnap, appSnap] = await Promise.all([
      db.collection('portfolioSites').get().catch(() => ({ docs: [] } as any)),
      db.collection('portfolioSlugs').get().catch(() => ({ docs: [] } as any)),
      db.collection('applications').get().catch(() => ({ docs: [] } as any)),
    ]);

    // Partition users
    const retainedAdminAuth = authUsers.find((u) => u.uid === DESIGNATED_RETAINED_ADMIN_UID);
    const nonAdminAuthUsers = authUsers.filter((u) => u.uid !== DESIGNATED_RETAINED_ADMIN_UID);
    const nonAdminFirestoreUsers = firestoreUsers.filter((u) => u.id !== DESIGNATED_RETAINED_ADMIN_UID);

    // Verify company retention
    const retainedCompanyIds = new Set(RETAINED_PRODUCTION_COMPANIES.map((c) => c.id));
    const verifiedRetainedCompanies = companies.filter((c: any) => retainedCompanyIds.has(c.id));
    const unexpectedCompanies = companies.filter((c: any) => !retainedCompanyIds.has(c.id));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalAuthUsers: authUsers.length,
        totalFirestoreUsers: firestoreUsers.length,
        retainedAdminPresent: Boolean(retainedAdminAuth),
        candidateAuthDeletions: nonAdminAuthUsers.length,
        candidateFirestoreDeletions: nonAdminFirestoreUsers.length,
        totalCompanies: companies.length,
        retainedCompaniesCount: verifiedRetainedCompanies.length,
        unexpectedCompaniesCount: unexpectedCompanies.length,
        totalSubscriptions: subscriptions.length,
        totalAmbassadorBalances: ambassadors.length,
        orphanedPortfolioSites: portSnap.docs.length,
        orphanedApplications: appSnap.docs.length,
      },
      retainedAdmin: {
        uid: DESIGNATED_RETAINED_ADMIN_UID,
        email: DESIGNATED_RETAINED_ADMIN_EMAIL,
        authRecord: retainedAdminAuth || null,
        firestoreRecord: firestoreUsers.find((u) => u.id === DESIGNATED_RETAINED_ADMIN_UID) || null,
      },
      retainedCompanies: verifiedRetainedCompanies,
      candidateDeletions: {
        authUsers: nonAdminAuthUsers.map((u) => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
        })),
        firestoreUsers: nonAdminFirestoreUsers.map((u: any) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          name: u.displayName || u.name,
          companyId: u.companyId,
        })),
      },
      subscriptions,
    });
  } catch (error: any) {
    console.error('[Admin DB Cleanup GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to inspect database state' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await syncClockSkew();
    const body = await req.json();
    const { action = 'dry_run', confirmationKey = '' } = body;

    const auth = getAdminAuth();
    const db = getAdminFirestore();

    // ── ACTION 1: CREATE AUTOMATED BACKUP ─────────────────────────────────────
    if (action === 'create_backup') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(process.cwd(), 'backups', `cleanup_backup_${timestamp}`);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      let authUsers: any[] = [];
      let nextPageToken: string | undefined;
      do {
        const list = await auth.listUsers(1000, nextPageToken);
        authUsers = authUsers.concat(list.users.map((u) => u.toJSON()));
        nextPageToken = list.pageToken;
      } while (nextPageToken);
      fs.writeFileSync(path.join(backupDir, 'firebase_auth_users.json'), JSON.stringify(authUsers, null, 2));

      const [uSnap, cSnap, sSnap, aSnap, pSnap, rSnap] = await Promise.all([
        db.collection('users').get(),
        db.collection('companies').get(),
        db.collection('subscriptions').get(),
        db.collection('ambassadors').get(),
        db.collection('payoutRequests').get().catch(() => ({ docs: [], size: 0 } as any)),
        db.collection('referrals').get().catch(() => ({ docs: [], size: 0 } as any)),
      ]);

      fs.writeFileSync(path.join(backupDir, 'firestore_users.json'), JSON.stringify(uSnap.docs.map((d) => ({ id: d.id, ...d.data() })), null, 2));
      fs.writeFileSync(path.join(backupDir, 'companies.json'), JSON.stringify(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })), null, 2));
      fs.writeFileSync(path.join(backupDir, 'subscriptions.json'), JSON.stringify(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })), null, 2));
      fs.writeFileSync(path.join(backupDir, 'ambassadors.json'), JSON.stringify(aSnap.docs.map((d) => ({ id: d.id, ...d.data() })), null, 2));
      fs.writeFileSync(path.join(backupDir, 'payout_requests.json'), JSON.stringify(pSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })), null, 2));
      fs.writeFileSync(path.join(backupDir, 'referrals.json'), JSON.stringify(rSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })), null, 2));

      return NextResponse.json({
        success: true,
        action: 'create_backup',
        backupPath: backupDir,
        counts: {
          authUsers: authUsers.length,
          firestoreUsers: uSnap.size,
          companies: cSnap.size,
          subscriptions: sSnap.size,
          ambassadors: aSnap.size,
          payoutRequests: pSnap.size,
          referrals: rSnap.size,
        },
      });
    }

    // ── ACTION 2: DRY RUN ─────────────────────────────────────────────────────
    if (action === 'dry_run') {
      let authUsers: any[] = [];
      let nextPageToken: string | undefined;
      do {
        const list = await auth.listUsers(1000, nextPageToken);
        authUsers = authUsers.concat(list.users.map((u) => u.toJSON()));
        nextPageToken = list.pageToken;
      } while (nextPageToken);

      const usersSnap = await db.collection('users').get();
      const compSnap = await db.collection('companies').get();

      const candidateAuthUids = authUsers
        .filter((u) => u.uid !== DESIGNATED_RETAINED_ADMIN_UID)
        .map((u) => u.uid);

      const candidateFirestoreDocIds = usersSnap.docs
        .filter((d) => d.id !== DESIGNATED_RETAINED_ADMIN_UID)
        .map((d) => d.id);

      return NextResponse.json({
        success: true,
        action: 'dry_run',
        dryRunReport: {
          designatedAdminUID: DESIGNATED_RETAINED_ADMIN_UID,
          preservedAdmin: true,
          preservedCompanyCount: compSnap.size,
          proposedAuthDeletionsCount: candidateAuthUids.length,
          proposedFirestoreDeletionsCount: candidateFirestoreDocIds.length,
          candidateAuthUids,
          candidateFirestoreDocIds,
        },
      });
    }

    // ── ACTION 3: EXECUTE DESTRUCTIVE CLEANUP ─────────────────────────────────
    if (action === 'execute_cleanup') {
      if (confirmationKey !== 'CONFIRM_CLEANUP_THENIJOBS') {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing or invalid confirmationKey. Provide "CONFIRM_CLEANUP_THENIJOBS" to proceed.',
          },
          { status: 400 }
        );
      }

      console.log('[Database Cleanup] Initiating authorized execution...');

      // 1. Reassign Company Ownership to Designated Admin to guarantee Company Data Independence
      const compSnap = await db.collection('companies').get();
      let companiesReassigned = 0;
      for (const cDoc of compSnap.docs) {
        const data = cDoc.data();
        if (data.ownerId !== DESIGNATED_RETAINED_ADMIN_UID) {
          await cDoc.ref.update({
            ownerId: DESIGNATED_RETAINED_ADMIN_UID,
            managedByAdmin: true,
            previousOwnerId: data.ownerId || null,
            updatedAt: new Date(),
          });
          companiesReassigned++;
        }
      }

      // 2. Delete non-retained accounts from Firebase Authentication
      let authUsers: any[] = [];
      let nextPageToken: string | undefined;
      do {
        const list = await auth.listUsers(1000, nextPageToken);
        authUsers = authUsers.concat(list.users);
        nextPageToken = list.pageToken;
      } while (nextPageToken);

      let authUsersDeleted = 0;
      const authDeletionFailures: any[] = [];
      for (const u of authUsers) {
        if (u.uid === DESIGNATED_RETAINED_ADMIN_UID) {
          console.log(`[Database Cleanup] PRESERVED Super Admin: ${u.uid} (${u.email})`);
          continue;
        }
        try {
          await auth.deleteUser(u.uid);
          authUsersDeleted++;
        } catch (err: any) {
          authDeletionFailures.push({ uid: u.uid, email: u.email, error: err.message });
        }
      }

      // 3. Delete non-retained user documents from Firestore 'users'
      const usersSnap = await db.collection('users').get();
      let firestoreUsersDeleted = 0;
      for (const d of usersSnap.docs) {
        if (d.id === DESIGNATED_RETAINED_ADMIN_UID) {
          console.log(`[Database Cleanup] PRESERVED Firestore Super Admin doc: ${d.id}`);
          continue;
        }
        await d.ref.delete();
        firestoreUsersDeleted++;
      }

      // 4. Purge orphaned portfolio sites and slugs
      const [portSnap, slugSnap, appSnap] = await Promise.all([
        db.collection('portfolioSites').get().catch(() => ({ docs: [] } as any)),
        db.collection('portfolioSlugs').get().catch(() => ({ docs: [] } as any)),
        db.collection('applications').get().catch(() => ({ docs: [] } as any)),
      ]);

      let portPurged = 0;
      for (const d of portSnap.docs) {
        await d.ref.delete();
        portPurged++;
      }

      let slugPurged = 0;
      for (const d of slugSnap.docs) {
        await d.ref.delete();
        slugPurged++;
      }

      let appPurged = 0;
      for (const d of appSnap.docs) {
        await d.ref.delete();
        appPurged++;
      }

      // 5. User balance cleanup: Remove non-admin ambassador records & reset admin balance
      const ambSnap = await db.collection('ambassadors').get();
      let ambassadorBalancesRemoved = 0;
      for (const d of ambSnap.docs) {
        if (d.id === DESIGNATED_RETAINED_ADMIN_UID) {
          await d.ref.update({
            pendingPayoutINR: 0,
            totalEarningsINR: 0,
            paidPayoutINR: 0,
            updatedAt: new Date(),
          });
        } else {
          await d.ref.delete();
          ambassadorBalancesRemoved++;
        }
      }

      // 6. Purge non-admin payoutRequests to guarantee no orphaned payout requests remain
      const pSnap = await db.collection('payoutRequests').get().catch(() => ({ docs: [] } as any));
      let payoutRequestsPurged = 0;
      for (const d of pSnap.docs) {
        const pData = d.data();
        if (pData.ambassadorUid !== DESIGNATED_RETAINED_ADMIN_UID) {
          await d.ref.delete();
          payoutRequestsPurged++;
        }
      }

      // 7. Log audit record in 'activityLogs'
      await db.collection('activityLogs').add({
        action: 'DATABASE_CLEANUP_EXECUTED',
        executedBy: DESIGNATED_RETAINED_ADMIN_UID,
        authUsersDeleted,
        firestoreUsersDeleted,
        companiesPreserved: compSnap.size,
        companiesReassigned,
        ambassadorBalancesRemoved,
        payoutRequestsPurged,
        portPurged,
        slugPurged,
        appPurged,
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        action: 'execute_cleanup',
        result: {
          authUsersDeleted,
          firestoreUsersDeleted,
          companiesPreserved: compSnap.size,
          companiesReassigned,
          ambassadorBalancesRemoved,
          payoutRequestsPurged,
          orphanedSitesPurged: portPurged,
          orphanedSlugsPurged: slugPurged,
          orphanedApplicationsPurged: appPurged,
          authDeletionFailures,
          retainedAdminUID: DESIGNATED_RETAINED_ADMIN_UID,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Admin DB Cleanup POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cleanup operation failed' },
      { status: 500 }
    );
  }
}
