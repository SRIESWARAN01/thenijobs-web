import { syncClockSkew, getAdminFirestore } from '../src/lib/firebase/firebaseAdmin.ts';

async function scanAllCollections() {
  await syncClockSkew();
  const db = getAdminFirestore();

  console.log('=== FULL FIRESTORE COLLECTIONS SCAN ===');
  const collections = await db.listCollections();
  console.log(`Discovered ${collections.length} root collections in Firestore:`);

  for (const col of collections) {
    const snap = await col.get();
    console.log(`- Collection: '${col.id}' -> ${snap.size} documents`);
  }
}

scanAllCollections().catch(console.error);
