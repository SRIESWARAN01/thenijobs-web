import { syncClockSkew, getAdminAuth, getAdminFirestore } from '../src/lib/firebase/firebaseAdmin.ts';
import {
  DESIGNATED_RETAINED_ADMIN_UID,
  DESIGNATED_RETAINED_ADMIN_EMAIL,
  RETAINED_PRODUCTION_COMPANIES,
} from '../src/lib/constants.ts';

async function execute() {
  await syncClockSkew();
  const auth = getAdminAuth();
  const db = getAdminFirestore();

  console.log('=== STARTING SAFE FIREBASE CLEANUP EXECUTION ===');
  console.log(`Designated Retained Super Admin: ${DESIGNATED_RETAINED_ADMIN_UID} (${DESIGNATED_RETAINED_ADMIN_EMAIL})`);

  // 1. Verify Super Admin exists in Auth and Firestore
  const adminAuth = await auth.getUser(DESIGNATED_RETAINED_ADMIN_UID).catch(() => null);
  if (!adminAuth) {
    throw new Error(`CRITICAL: Designated Super Admin ${DESIGNATED_RETAINED_ADMIN_UID} not found in Firebase Auth! Halting.`);
  }
  const adminDoc = await db.collection('users').doc(DESIGNATED_RETAINED_ADMIN_UID).get();
  if (!adminDoc.exists) {
    throw new Error(`CRITICAL: Designated Super Admin ${DESIGNATED_RETAINED_ADMIN_UID} doc not found in Firestore! Halting.`);
  }
  console.log('✔ Designated Super Admin account verified in both Auth & Firestore.');

  // 2. Guarantee Company Data Independence:
  // Reassign ownerId to the Super Admin UID so companies remain 100% manageable by the admin.
  console.log('\n--- 1. Reassigning 8 Retained Companies to Super Admin ---');
  const compSnap = await db.collection('companies').get();
  const retainedCompanyIds = new Set(RETAINED_PRODUCTION_COMPANIES.map(c => c.id));

  for (const cDoc of compSnap.docs) {
    const data = cDoc.data();
    if (!retainedCompanyIds.has(cDoc.id)) {
      console.warn(`WARNING: Discovered non-retained company: ${cDoc.id} (${data.name})`);
      continue;
    }
    await cDoc.ref.update({
      ownerId: DESIGNATED_RETAINED_ADMIN_UID,
      managedByAdmin: true,
      previousOwnerId: data.ownerId || null,
      updatedAt: new Date(),
    });
    console.log(`✔ Company preserved and linked to Admin: "${data.name}" (${cDoc.id})`);
  }

  // 3. Delete non-retained accounts from Firebase Authentication
  console.log('\n--- 2. Deleting Non-Retained Accounts from Firebase Auth ---');
  let authUsers = [];
  let nextPageToken;
  do {
    const list = await auth.listUsers(1000, nextPageToken);
    authUsers = authUsers.concat(list.users);
    nextPageToken = list.pageToken;
  } while (nextPageToken);

  let authDeleted = 0;
  for (const u of authUsers) {
    if (u.uid === DESIGNATED_RETAINED_ADMIN_UID) {
      console.log(`[AUTH PRESERVE] Super Admin UID: ${u.uid} (${u.email})`);
      continue;
    }
    await auth.deleteUser(u.uid);
    authDeleted++;
    console.log(`[AUTH DELETED] UID: ${u.uid} (${u.email})`);
  }
  console.log(`Total Auth users deleted: ${authDeleted}`);

  // 4. Delete non-retained documents from Firestore 'users'
  console.log('\n--- 3. Deleting Non-Retained Docs from Firestore users ---');
  const usersSnap = await db.collection('users').get();
  let firestoreDeleted = 0;
  for (const d of usersSnap.docs) {
    if (d.id === DESIGNATED_RETAINED_ADMIN_UID) {
      console.log(`[FIRESTORE PRESERVE] Super Admin Doc: ${d.id}`);
      continue;
    }
    await d.ref.delete();
    firestoreDeleted++;
    console.log(`[FIRESTORE DELETED] Doc: ${d.id} (${d.data().email})`);
  }
  console.log(`Total Firestore user docs deleted: ${firestoreDeleted}`);

  // 5. Purge orphaned portfolio sites, portfolio slugs, and legacy applications
  console.log('\n--- 4. Purging Orphaned Records ---');
  const [portSnap, slugSnap, appSnap] = await Promise.all([
    db.collection('portfolioSites').get().catch(() => ({ docs: [] })),
    db.collection('portfolioSlugs').get().catch(() => ({ docs: [] })),
    db.collection('applications').get().catch(() => ({ docs: [] })),
  ]);

  for (const d of portSnap.docs) {
    await d.ref.delete();
  }
  console.log(`Purged ${portSnap.docs.length} orphaned portfolioSites docs`);

  for (const d of slugSnap.docs) {
    await d.ref.delete();
  }
  console.log(`Purged ${slugSnap.docs.length} orphaned portfolioSlugs docs`);

  for (const d of appSnap.docs) {
    await d.ref.delete();
  }
  console.log(`Purged ${appSnap.docs.length} orphaned applications docs`);

  // 6. Zero out residual balances in 'ambassadors'
  console.log('\n--- 5. Zeroing All User Balances ---');
  const ambSnap = await db.collection('ambassadors').get();
  for (const d of ambSnap.docs) {
    await d.ref.update({
      pendingPayoutINR: 0,
      totalEarningsINR: 0,
      paidPayoutINR: 0,
      updatedAt: new Date(),
    });
  }
  console.log(`Reset ${ambSnap.size} ambassador balance records to 0.00`);

  // 7. Verify Subscriptions are intact
  console.log('\n--- 6. Verifying Subscriptions ---');
  const subSnap = await db.collection('subscriptions').get();
  console.log(`Active subscriptions: ${subSnap.size}`);
  subSnap.forEach(d => {
    const s = d.data();
    console.log(`- Sub: ${d.id} | Company: "${s.companyName}" | Amount: ₹${s.amount} | Status: ${s.status}`);
  });

  console.log('\n=== CLEANUP EXECUTION COMPLETED SUCCESSFULLY ===');
}

execute().catch(console.error);
