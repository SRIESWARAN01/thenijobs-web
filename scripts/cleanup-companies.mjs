import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

// ── APPROVED WHITELIST (MUST NEVER BE DELETED) ─────────────────────────────
const APPROVED_COMPANIES = new Map([
  ['mWWNVrCGounWsmXdaRGL', { name: 'sarvesh super market', location: 'Theni' }],
  ['oKDQpFZ3bx9C4S0Z0ti9', { name: 'Apex Scholar Publication', location: 'Theni' }],
  ['u9sYSAG9YoGrept1FbSe', { name: 'Suruliraj Chemicals', location: 'Theni' }],
  ['SDv5CaYdxKRWOXl4ej84', { name: 'Chennai Bakes', location: 'Uthamapalayam' }],
  ['VG1PwPzKXofu1fLxLIpk', { name: 'SVR HERITAGE HALL', location: 'Uthamapalayam' }],
  ['vMQgOwNd2fZ4Nm8870Dw', { name: 'AGS IT SOLUTIONS', location: 'Theni' }],
  ['ik3pWBDVVUR3Sb51knwK', { name: 'Agrimore', location: 'Chinnamanur' }],
]);

const APPROVED_NORMALIZED_NAMES = [
  'sarvesh super market',
  'apex scholar publication',
  'suruliraj chemicals',
  'chennai bakes',
  'svr heritage hall',
  'ags it solutions',
  'agrimore',
];

function getLatestToken() {
  const configPath = path.join(process.env.USERPROFILE, '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI credentials not found at ' + configPath);
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.tokens?.access_token;
}

function refreshTokenViaCli() {
  console.log('Refreshing token via Firebase CLI...');
  execSync('firebase projects:list', { stdio: 'pipe' });
  return getLatestToken();
}

async function main() {
  console.log('=== THENIJOBS FIREBASE COMPANY CLEANUP EXECUTION ===');

  let token = getLatestToken();

  async function authFetch(url, options = {}) {
    options.headers = options.headers || {};
    options.headers.Authorization = 'Bearer ' + token;

    let res = await fetch(url, options);
    if (res.status === 401) {
      token = refreshTokenViaCli();
      options.headers.Authorization = 'Bearer ' + token;
      res = await fetch(url, options);
    }
    return res;
  }

  // 1. Fetch all company records currently in Firestore
  console.log('\nStep 1: Auditing current companies collection in Firestore...');
  let allDocs = [];
  let pageToken = null;
  do {
    let url = 'https://firestore.googleapis.com/v1/projects/thenijobs-9f01d/databases/(default)/documents/companies?pageSize=300';
    if (pageToken) url += '&pageToken=' + pageToken;
    const res = await authFetch(url);
    const data = await res.json();
    if (data.documents) {
      allDocs.push(...data.documents);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  console.log(`Found ${allDocs.length} total company documents in Firestore.`);

  // 2. Verify ALL 7 approved companies exist before proceeding
  console.log('\nStep 2: Pre-deletion verification of approved companies...');
  const foundApproved = new Set();
  for (const doc of allDocs) {
    const id = doc.name.split('/').pop();
    if (APPROVED_COMPANIES.has(id)) {
      foundApproved.add(id);
      console.log(` ✓ Verified Approved: [${id}] ${APPROVED_COMPANIES.get(id).name}`);
    }
  }

  if (foundApproved.size !== APPROVED_COMPANIES.size) {
    console.error(`FATAL: Only found ${foundApproved.size} of 7 approved companies. ABORTING DELETION.`);
    process.exit(1);
  }
  console.log('All 7 approved companies verified present.');

  // 3. Identify exact deletion targets
  console.log('\nStep 3: Compiling list of target documents to delete...');
  const targetsToDelete = [];
  for (const doc of allDocs) {
    const id = doc.name.split('/').pop();
    const name = (doc.fields?.name?.stringValue || doc.fields?.title?.stringValue || '').trim().toLowerCase();

    // Extra safeguard: check normalized name
    const isApprovedName = APPROVED_NORMALIZED_NAMES.some((n) => name.includes(n));

    if (APPROVED_COMPANIES.has(id) || isApprovedName) {
      console.log(` 🛡️  PROTECTED FROM DELETION: [${id}] ${doc.fields?.name?.stringValue}`);
    } else {
      targetsToDelete.push({
        id,
        name: doc.fields?.name?.stringValue || 'NO_NAME',
        category: doc.fields?.category?.stringValue || 'Unknown',
        location: doc.fields?.location?.stringValue || doc.fields?.district?.stringValue || 'Unknown',
        docPath: doc.name,
      });
    }
  }

  console.log(`\nIdentified ${targetsToDelete.length} company documents to delete.`);
  console.log(`Identified ${allDocs.length - targetsToDelete.length} company documents to keep.`);

  if (targetsToDelete.length === 0) {
    console.log('No unwanted companies found. Database is already clean.');
    return;
  }

  // 4. Execute batched safe deletion with error handling
  console.log('\nStep 4: Executing batched safe deletion with error handling...');
  const deletionLog = {
    startedAt: new Date().toISOString(),
    totalBefore: allDocs.length,
    totalTargeted: targetsToDelete.length,
    successfulDeletions: [],
    failedDeletions: [],
  };

  const BATCH_SIZE = 10;
  for (let i = 0; i < targetsToDelete.length; i += BATCH_SIZE) {
    const chunk = targetsToDelete.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (target) => {
        const deleteUrl = `https://firestore.googleapis.com/v1/${target.docPath}`;
        try {
          let attempts = 0;
          let success = false;
          while (attempts < 3 && !success) {
            attempts++;
            const res = await authFetch(deleteUrl, { method: 'DELETE' });
            if (res.ok || res.status === 404) {
              success = true;
              deletionLog.successfulDeletions.push(target);
              console.log(` [DELETE OK] (${deletionLog.successfulDeletions.length}/${targetsToDelete.length}) ${target.id} — ${target.name}`);
            } else if (res.status === 429 || res.status >= 500) {
              console.warn(` [RETRY ${attempts}] Rate limited / server error on ${target.id}: HTTP ${res.status}`);
              await new Promise((r) => setTimeout(r, 1000 * attempts));
            } else {
              const errBody = await res.text();
              throw new Error(`HTTP ${res.status}: ${errBody}`);
            }
          }
          if (!success) {
            deletionLog.failedDeletions.push({ ...target, error: 'Max retries exceeded' });
          }
        } catch (err) {
          console.error(` [DELETE FAILED] ${target.id} — ${target.name}:`, err.message);
          deletionLog.failedDeletions.push({ ...target, error: err.message });
        }
      })
    );
    // Slight pause between batches
    await new Promise((r) => setTimeout(r, 200));
  }

  deletionLog.completedAt = new Date().toISOString();
  console.log(`\nDeletion completed. Success: ${deletionLog.successfulDeletions.length}, Failed: ${deletionLog.failedDeletions.length}`);

  // 5. Post-deletion audit verification
  console.log('\nStep 5: Post-deletion audit verification in Firestore...');
  let remainingDocs = [];
  pageToken = null;
  do {
    let url = 'https://firestore.googleapis.com/v1/projects/thenijobs-9f01d/databases/(default)/documents/companies?pageSize=300';
    if (pageToken) url += '&pageToken=' + pageToken;
    const res = await authFetch(url);
    const data = await res.json();
    if (data.documents) {
      remainingDocs.push(...data.documents);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  console.log(`\n=== POST-CLEANUP VERIFICATION RESULT ===`);
  console.log(`Total companies remaining in Firestore: ${remainingDocs.length}`);

  const remainingSummary = remainingDocs.map((doc) => {
    const id = doc.name.split('/').pop();
    const name = doc.fields?.name?.stringValue || '';
    const loc = doc.fields?.location?.stringValue || doc.fields?.district?.stringValue || '';
    return { id, name, loc };
  });

  for (const r of remainingSummary) {
    console.log(` • [${r.id}] ${r.name} (${r.loc})`);
  }

  // Write complete post-cleanup report
  fs.writeFileSync('backups/cleanup_report_after.json', JSON.stringify({
    metadata: {
      timestamp: new Date().toISOString(),
      database: 'projects/thenijobs-9f01d/databases/(default)',
      totalBefore: allDocs.length,
      totalDeleted: deletionLog.successfulDeletions.length,
      totalFailed: deletionLog.failedDeletions.length,
      totalRemaining: remainingDocs.length,
    },
    remainingCompanies: remainingSummary,
    deletedCompanies: deletionLog.successfulDeletions,
    failedDeletions: deletionLog.failedDeletions,
  }, null, 2));

  console.log('\nSaved post-cleanup audit report to backups/cleanup_report_after.json');
}

main().catch(console.error);
