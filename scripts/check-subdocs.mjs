import { syncClockSkew, getAdminFirestore } from '../src/lib/firebase/firebaseAdmin.ts';

async function checkSubdocs() {
  await syncClockSkew();
  const db = getAdminFirestore();

  for (const colName of ['applications', 'conversations', 'notifications', 'orders', 'portfolioSites', 'portfolioSlugs']) {
    console.log(`\n=== Collection: ${colName} ===`);
    const snap = await db.collection(colName).get();
    snap.forEach(d => {
      console.log(`- ${d.id}:`, JSON.stringify(d.data()).substring(0, 160));
    });
  }
}

checkSubdocs().catch(console.error);
