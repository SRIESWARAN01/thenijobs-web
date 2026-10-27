import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Timestamp } from 'firebase-admin/firestore';
import { syncClockSkew, getAdminFirestore } from '../src/lib/firebase/firebaseAdmin.ts';
import {
  DESIGNATED_RETAINED_ADMIN_UID,
  RETAINED_PRODUCTION_COMPANIES,
} from '../src/lib/constants.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Recursively convert serialized { _seconds, _nanoseconds } objects back to Firestore Timestamps
function convertTimestamps(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object') {
    if (typeof val._seconds === 'number' && typeof val._nanoseconds === 'number') {
      return new Timestamp(val._seconds, val._nanoseconds);
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    const result = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = convertTimestamps(v);
    }
    return result;
  }
  return val;
}

async function restore() {
  await syncClockSkew();
  const db = getAdminFirestore();

  console.log('=== RESTORING 8 RETAINED COMPANIES AND THEIR SUBSCRIPTIONS ===');
  console.log(`Target Super Admin UID: ${DESIGNATED_RETAINED_ADMIN_UID}`);

  const backupDir = path.resolve(__dirname, '../backups/cleanup_backup_2026-10-26T19-11-07-020Z');
  const companiesBackupPath = path.join(backupDir, 'companies.json');
  const subsBackupPath = path.join(backupDir, 'subscriptions.json');

  if (!fs.existsSync(companiesBackupPath) || !fs.existsSync(subsBackupPath)) {
    throw new Error(`Backup files missing at ${backupDir}`);
  }

  const rawCompanies = JSON.parse(fs.readFileSync(companiesBackupPath, 'utf8'));
  const rawSubs = JSON.parse(fs.readFileSync(subsBackupPath, 'utf8'));

  console.log(`Loaded ${rawCompanies.length} companies and ${rawSubs.length} subscriptions from backup.`);

  const allowedCompanyIds = new Set(RETAINED_PRODUCTION_COMPANIES.map(c => c.id));

  // 1. Restore Companies
  console.log('\n--- 1. Restoring 8 Company Documents into Firestore ---');
  let companiesRestored = 0;
  for (const rawComp of rawCompanies) {
    if (!allowedCompanyIds.has(rawComp.id)) {
      console.warn(`Skipping company ${rawComp.id} (${rawComp.name}) - not in retained whitelist!`);
      continue;
    }

    const compId = rawComp.id;
    const compData = convertTimestamps({ ...rawComp });
    delete compData.id; // Document ID is specified in doc(compId)

    // Ensure data independence: Admin owns and manages the company
    compData.ownerId = DESIGNATED_RETAINED_ADMIN_UID;
    compData.managedByAdmin = true;
    compData.updatedAt = new Date();

    await db.collection('companies').doc(compId).set(compData, { merge: true });
    companiesRestored++;
    console.log(`✔ Restored Company [${companiesRestored}/8]: "${compData.name}" (ID: ${compId})`);
  }

  // 2. Restore Subscriptions
  console.log('\n--- 2. Restoring 8 Standard Subscriptions into Firestore ---');
  let subsRestored = 0;
  for (const rawSub of rawSubs) {
    if (!allowedCompanyIds.has(rawSub.companyId)) {
      console.warn(`Skipping subscription ${rawSub.id} for company ${rawSub.companyId} - not in retained whitelist!`);
      continue;
    }

    const subId = rawSub.id;
    const subData = convertTimestamps({ ...rawSub });
    delete subData.id; // Document ID is specified in doc(subId)

    // Ensure link to Admin and active standard plan
    subData.userId = DESIGNATED_RETAINED_ADMIN_UID;
    subData.approvedBy = DESIGNATED_RETAINED_ADMIN_UID;
    subData.plan = 'standard';
    subData.planId = 'standard';
    subData.amount = 1800;
    subData.status = 'active';
    subData.paymentStatus = 'paid';
    subData.updatedAt = new Date();

    await db.collection('subscriptions').doc(subId).set(subData, { merge: true });
    subsRestored++;
    console.log(`✔ Restored Subscription [${subsRestored}/8]: "${subData.companyName}" (ID: ${subId}, Amount: ₹${subData.amount})`);
  }

  // 3. Verification
  console.log('\n--- 3. Verifying Restored Firestore Records ---');
  const compSnap = await db.collection('companies').get();
  const subSnap = await db.collection('subscriptions').get();

  console.log(`Live Firestore Companies Count: ${compSnap.size}`);
  compSnap.forEach(d => {
    const data = d.data();
    console.log(`  - Company: "${data.name}" | ID: ${d.id} | Owner: ${data.ownerId} | Managed: ${data.managedByAdmin}`);
  });

  console.log(`Live Firestore Subscriptions Count: ${subSnap.size}`);
  subSnap.forEach(d => {
    const data = d.data();
    console.log(`  - Subscription: "${data.companyName}" | ID: ${d.id} | Plan: ${data.planId || data.plan} | Amount: ₹${data.amount} | Status: ${data.status}`);
  });

  if (compSnap.size === 8 && subSnap.size === 8) {
    console.log('\n SUCCESS: Exactly 8 companies and 8 subscriptions are live in Firestore!');
  } else {
    console.error(`\n WARNING: Expected 8 companies and 8 subscriptions, but got ${compSnap.size} companies and ${subSnap.size} subscriptions.`);
  }
}

restore().catch(err => {
  console.error('Restoration failed:', err);
  process.exit(1);
});
