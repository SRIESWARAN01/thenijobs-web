/**
 * THENIJOBS — Production Database Cleanup Script
 * 
 * Purpose: Remove all demo/test data from Firestore before production launch.
 * 
 * IMPORTANT: 
 * - Set DRY_RUN = true to PREVIEW what will be deleted (no actual deletion)
 * - Set DRY_RUN = false to EXECUTE actual deletion
 * - Admin users are NEVER deleted
 * 
 * Run with: npx tsx scripts/cleanup_demo_data.ts
 */

const DRY_RUN = true; // SET TO false TO ACTUALLY DELETE

const PRESERVE_USER_IDS: string[] = [
  // Add production admin UIDs to preserve here
];

const COLLECTIONS_TO_CLEAN = [
  'companies',
  'jobs',
  'applications',
  'reviews',
  'notifications',
  'interviews',
  'activityLogs',
  'companyFollows',
];

const USER_COLLECTION = 'users';

import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../src/lib/firebase/config';

async function cleanCollection(collectionName: string) {
  console.log(`\n Processing collection: ${collectionName}`);
  const snap = await getDocs(collection(db, collectionName));
  if (snap.empty) { console.log(`   Already empty`); return 0; }
  console.log(`   Found ${snap.size} documents`);
  let deletedCount = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const identifier = data.name || data.title || data.displayName || data.email || d.id;
    console.log(`   ${DRY_RUN ? 'Would delete' : 'Deleting'}: ${identifier} (${d.id})`);
    if (!DRY_RUN) await deleteDoc(doc(db, collectionName, d.id));
    deletedCount++;
  }
  console.log(`   ${DRY_RUN ? 'Would delete' : 'Deleted'}: ${deletedCount} documents`);
  return deletedCount;
}

async function cleanUsers() {
  console.log(`\n Processing collection: ${USER_COLLECTION}`);
  const snap = await getDocs(collection(db, USER_COLLECTION));
  if (snap.empty) { console.log(`   Already empty`); return 0; }
  console.log(`   Found ${snap.size} users`);
  let deletedCount = 0, preservedCount = 0;
  for (const d of snap.docs) {
    const data = d.data();
    const role = data.role || '';
    if (role === 'admin' || role === 'super_admin' || PRESERVE_USER_IDS.includes(d.id)) {
      console.log(`   PRESERVING admin: ${data.displayName || data.email || d.id}`);
      preservedCount++;
      continue;
    }
    const identifier = data.displayName || data.email || d.id;
    console.log(`   ${DRY_RUN ? 'Would delete' : 'Deleting'}: ${identifier} (role: ${role})`);
    if (!DRY_RUN) await deleteDoc(doc(db, USER_COLLECTION, d.id));
    deletedCount++;
  }
  console.log(`   Preserved: ${preservedCount} admin users`);
  console.log(`   ${DRY_RUN ? 'Would delete' : 'Deleted'}: ${deletedCount} non-admin users`);
  return deletedCount;
}

async function main() {
  console.log('THENIJOBS Database Cleanup');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE DELETE'}`);
  let totalDeleted = 0;
  for (const col of COLLECTIONS_TO_CLEAN) totalDeleted += await cleanCollection(col);
  totalDeleted += await cleanUsers();
  console.log(`\nTotal: ${totalDeleted} documents ${DRY_RUN ? 'would be deleted' : 'deleted'}`);
  if (DRY_RUN) console.log('This was a DRY RUN. Set DRY_RUN = false to execute.');
  else console.log('Database cleanup complete!');
}

main().catch(console.error);

