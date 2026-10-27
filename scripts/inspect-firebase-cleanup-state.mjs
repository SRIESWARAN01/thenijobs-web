import { syncClockSkew, getAdminAuth, getAdminFirestore } from '../src/lib/firebase/firebaseAdmin.ts';

async function main() {
  await syncClockSkew();
  const auth = getAdminAuth();
  const db = getAdminFirestore();

  console.log('=== 1. FIREBASE AUTHENTICATION AUDIT ===');
  let authUsers = [];
  try {
    let nextPageToken;
    do {
      const list = await auth.listUsers(1000, nextPageToken);
      authUsers = authUsers.concat(list.users);
      nextPageToken = list.pageToken;
    } while (nextPageToken);
    console.log(`Total Firebase Auth Users: ${authUsers.length}`);
    authUsers.forEach(u => {
      console.log(`- UID: ${u.uid} | Email: ${u.email} | Name: ${u.displayName || '(none)'} | Disabled: ${u.disabled} | Claims: ${JSON.stringify(u.customClaims || {})}`);
    });
  } catch (err) {
    console.error('Failed to list Auth users:', err);
  }

  console.log('\n=== 2. FIRESTORE USERS AUDIT ===');
  const usersSnap = await db.collection('users').get();
  console.log(`Total Firestore 'users' documents: ${usersSnap.size}`);
  usersSnap.forEach(d => {
    const data = d.data();
    console.log(`- DocID: ${d.id} | Email: ${data.email} | Role: ${data.role} | Name: ${data.displayName || data.name} | CompanyId: ${data.companyId || '(none)'}`);
  });

  console.log('\n=== 3. FIRESTORE COMPANIES AUDIT ===');
  const compSnap = await db.collection('companies').get();
  console.log(`Total Firestore 'companies' documents: ${compSnap.size}`);
  compSnap.forEach(d => {
    const data = d.data();
    console.log(`- DocID: ${d.id} | Name: "${data.name}" | OwnerId: ${data.ownerId || data.userId || '(none)'} | Managed: ${data.managedByAdmin} | Status: ${data.status} | Verified: ${data.isVerified}`);
  });

  console.log('\n=== 4. FIRESTORE SUBSCRIPTIONS AUDIT ===');
  const subSnap = await db.collection('subscriptions').get();
  console.log(`Total Firestore 'subscriptions' documents: ${subSnap.size}`);
  subSnap.forEach(d => {
    const data = d.data();
    console.log(`- DocID: ${d.id} | Company: "${data.companyName}" | CompanyId: ${data.companyId} | Plan: ${data.planId || data.plan} | Amount: ₹${data.amount} | Status: ${data.status}`);
  });

  console.log('\n=== 5. USER BALANCES AUDIT ===');
  const ambSnap = await db.collection('ambassadors').get();
  console.log(`Total 'ambassadors' records: ${ambSnap.size}`);
  let totalPending = 0;
  let totalEarnings = 0;
  ambSnap.forEach(d => {
    const data = d.data();
    totalPending += (data.pendingPayoutINR || 0);
    totalEarnings += (data.totalEarningsINR || 0);
    console.log(`- Ambassador Doc: ${d.id} | Pending: ₹${data.pendingPayoutINR || 0} | Earnings: ₹${data.totalEarningsINR || 0} | Paid: ₹${data.paidPayoutINR || 0}`);
  });
  console.log(`Total Pending Balances: ₹${totalPending} | Total Earnings: ₹${totalEarnings}`);

  console.log('\n=== 6. CLEANUP AUDIT SUMMARY VERDICT ===');
  const checks = [
    { name: 'Exactly 1 Firebase Auth User', pass: authUsers.length === 1 && authUsers[0].uid === 'xNM3lkvzQ5fcgVVZirlC6kkyoSE2' },
    { name: 'Exactly 1 Firestore User Doc', pass: usersSnap.size === 1 && usersSnap.docs[0].id === 'xNM3lkvzQ5fcgVVZirlC6kkyoSE2' },
    { name: 'Exactly 8 Preserved Companies', pass: compSnap.size === 8 },
    { name: 'All 8 Companies Owned & Managed by Super Admin', pass: compSnap.docs.every(d => d.data().ownerId === 'xNM3lkvzQ5fcgVVZirlC6kkyoSE2' && d.data().managedByAdmin === true) },
    { name: 'Exactly 8 Standard Subscriptions', pass: subSnap.size === 8 && subSnap.docs.every(d => (d.data().planId === 'standard' || d.data().plan === 'standard') && d.data().amount === 1800 && d.data().status === 'active') },
    { name: 'Zero Residual Balances', pass: totalPending === 0 && totalEarnings === 0 },
  ];

  let allPass = true;
  checks.forEach(c => {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`);
    if (!c.pass) allPass = false;
  });

  if (allPass) {
    console.log('\n🎉 ALL FIREBASE CLEANUP INVARIANTS VERIFIED SUCCESSFULLY!');
  } else {
    console.error('\n❌ SOME VERIFICATION CHECKS FAILED!');
    process.exit(1);
  }
}

main().catch(console.error);
