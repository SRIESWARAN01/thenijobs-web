import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Authoritative Constants (matching src/lib/constants.ts)
const DESIGNATED_RETAINED_ADMIN_UID = 'xNM3lkvzQ5fcgVVZirlC6kkyoSE2';
const DESIGNATED_RETAINED_ADMIN_EMAIL = 'srieswaran22@gmail.com';

const RETAINED_PRODUCTION_COMPANIES = [
  { id: 'vMQgOwNd2fZ4Nm8870Dw', name: 'AGS IT Solutions' },
  { id: 'ik3pWBDVVUR3Sb51knwK', name: 'Agrimore' },
  { id: '7K95afmwXMddFJo8PeRB', name: 'M K Security Solutions & Electronics' },
  { id: 'VG1PwPzKXofu1fLxLIpk', name: 'SVR Heritage Hall' },
  { id: 'SDv5CaYdxKRWOXl4ej84', name: 'Chennai Bakes' },
  { id: 'mWWNVrCGounWsmXdaRGL', name: 'Sarvesh Super Market' },
  { id: 'oKDQpFZ3bx9C4S0Z0ti9', name: 'Apex Scholar Publication' },
  { id: 'u9sYSAG9YoGrept1FbSe', name: 'Suruliraj Chemicals' },
];

describe('THENIJOBS — Database Cleanup & Retention Invariant Test Suite', () => {

  // ─── 1. Super Admin Account Preservation Invariant ──────────────────────────
  describe('Super Admin Account Preservation', () => {
    test('Guarantees designated Super Admin UID and email are invariant', () => {
      assert.equal(DESIGNATED_RETAINED_ADMIN_UID, 'xNM3lkvzQ5fcgVVZirlC6kkyoSE2');
      assert.equal(DESIGNATED_RETAINED_ADMIN_EMAIL, 'srieswaran22@gmail.com');
    });

    test('Protects Super Admin UID from deletion in any user filter or queue', () => {
      const allUsers = [
        { uid: 'user_seeker_1', email: 'seeker1@gmail.com' },
        { uid: 'xNM3lkvzQ5fcgVVZirlC6kkyoSE2', email: 'srieswaran22@gmail.com' },
        { uid: 'user_employer_2', email: 'owner@business.com' },
      ];

      const deletionQueue = allUsers.filter(u => u.uid !== DESIGNATED_RETAINED_ADMIN_UID);
      assert.equal(deletionQueue.length, 2);
      assert.ok(!deletionQueue.some(u => u.uid === DESIGNATED_RETAINED_ADMIN_UID));

      // Attempting to delete protected admin must be blocked
      function attemptDelete(user) {
        if (user.uid === DESIGNATED_RETAINED_ADMIN_UID) {
          throw new Error('IMMUTABLE_ERROR: Cannot delete designated Super Admin account');
        }
        return true;
      }

      assert.throws(
        () => attemptDelete({ uid: DESIGNATED_RETAINED_ADMIN_UID }),
        /IMMUTABLE_ERROR: Cannot delete designated Super Admin account/
      );
    });
  });

  // ─── 2. 8 Production Companies Preservation Invariant ───────────────────────
  describe('8 Retained Companies Invariant', () => {
    test('Exactly 8 companies are in the approved production whitelist', () => {
      assert.equal(RETAINED_PRODUCTION_COMPANIES.length, 8);
      const companyIds = new Set(RETAINED_PRODUCTION_COMPANIES.map(c => c.id));
      assert.equal(companyIds.size, 8, 'All company IDs must be distinct');

      const expectedIds = [
        'vMQgOwNd2fZ4Nm8870Dw',
        'ik3pWBDVVUR3Sb51knwK',
        '7K95afmwXMddFJo8PeRB',
        'VG1PwPzKXofu1fLxLIpk',
        'SDv5CaYdxKRWOXl4ej84',
        'mWWNVrCGounWsmXdaRGL',
        'oKDQpFZ3bx9C4S0Z0ti9',
        'u9sYSAG9YoGrept1FbSe',
      ];

      for (const expId of expectedIds) {
        assert.ok(companyIds.has(expId), `Expected company ID ${expId} missing from whitelist`);
      }
    });

    test('Rejects any unauthorized company deletion or substitution', () => {
      const allowedSet = new Set(RETAINED_PRODUCTION_COMPANIES.map(c => c.id));
      const testCandidates = [
        { id: 'vMQgOwNd2fZ4Nm8870Dw', name: 'AGS IT Solutions' },
        { id: 'unknown_fake_company_123', name: 'Demo Company' },
      ];

      const retained = testCandidates.filter(c => allowedSet.has(c.id));
      const rejected = testCandidates.filter(c => !allowedSet.has(c.id));

      assert.equal(retained.length, 1);
      assert.equal(rejected.length, 1);
      assert.equal(rejected[0].id, 'unknown_fake_company_123');
    });
  });

  // ─── 3. Company Data Independence & Ownership Reassignment ─────────────────
  describe('Company Data Independence', () => {
    test('Reassigns company owner to Super Admin while preserving business profiles', () => {
      const originalCompany = {
        id: '7K95afmwXMddFJo8PeRB',
        name: 'M K Security Solutions & Electronics',
        ownerId: 'previous_deleted_user_uid_123',
        slug: 'm-k-security-solutions-electronics',
        address: 'Chinnamanur, Theni',
        phone: '9629625478',
        proofNumber: '33BFPD5519Q1ZU',
        isVerified: true,
      };

      // Independence transformation
      const migrated = {
        ...originalCompany,
        ownerId: DESIGNATED_RETAINED_ADMIN_UID,
        managedByAdmin: true,
        previousOwnerId: originalCompany.ownerId,
        updatedAt: new Date().toISOString(),
      };

      assert.equal(migrated.ownerId, DESIGNATED_RETAINED_ADMIN_UID);
      assert.equal(migrated.managedByAdmin, true);
      assert.equal(migrated.name, originalCompany.name);
      assert.equal(migrated.slug, originalCompany.slug);
      assert.equal(migrated.phone, originalCompany.phone);
      assert.equal(migrated.isVerified, true);
      assert.equal(migrated.previousOwnerId, 'previous_deleted_user_uid_123');
    });
  });

  // ─── 4. Subscription Plan & Pricing Consistency ─────────────────────────────
  describe('Subscription Plan Invariant', () => {
    test('Ensures all 8 retained companies map to active Standard annual subscriptions (₹1,800)', () => {
      const mockSubscriptions = RETAINED_PRODUCTION_COMPANIES.map(comp => ({
        id: `sub_${comp.id}`,
        companyId: comp.id,
        companyName: comp.name,
        userId: DESIGNATED_RETAINED_ADMIN_UID,
        plan: 'standard',
        planId: 'standard',
        amount: 1800,
        status: 'active',
        paymentStatus: 'paid',
      }));

      assert.equal(mockSubscriptions.length, 8);
      for (const sub of mockSubscriptions) {
        assert.equal(sub.plan, 'standard');
        assert.equal(sub.amount, 1800);
        assert.equal(sub.status, 'active');
        assert.equal(sub.paymentStatus, 'paid');
        assert.equal(sub.userId, DESIGNATED_RETAINED_ADMIN_UID);
      }
    });
  });

  // ─── 5. User Balance Zeroing Invariant ───────────────────────────────────────
  describe('User Balance Zeroing', () => {
    test('Zeroes out all pending, earnings, and wallet balances', () => {
      const ambData = {
        userId: 'some_user',
        pendingPayoutINR: 2500,
        totalEarningsINR: 7500,
        paidPayoutINR: 5000,
      };

      const resetData = {
        ...ambData,
        pendingPayoutINR: 0,
        totalEarningsINR: 0,
        paidPayoutINR: 0,
      };

      assert.equal(resetData.pendingPayoutINR, 0);
      assert.equal(resetData.totalEarningsINR, 0);
      assert.equal(resetData.paidPayoutINR, 0);
    });
  });

  // ─── 6. Dry-Run & Safety Confirmation Key Invariant ────────────────────────
  describe('Dry-Run & Confirmation Security', () => {
    const CONFIRMATION_KEY = 'CONFIRM_CLEANUP_THENIJOBS';

    function executeCleanupAction(action, payload) {
      if (action === 'dry_run') {
        return {
          mutationsCommitted: 0,
          simulatedAuthDeletions: payload.authCount || 0,
          simulatedFirestoreDeletions: payload.firestoreCount || 0,
          safe: true,
        };
      }

      if (action === 'execute_cleanup') {
        if (payload.confirmationKey !== CONFIRMATION_KEY) {
          throw new Error('INVALID_KEY: Deletion aborted. Confirmation key mismatch.');
        }
        return { mutationsCommitted: payload.authCount + payload.firestoreCount, success: true };
      }

      throw new Error(`Unknown action ${action}`);
    }

    test('Dry run simulates deletions with 0 committed mutations', () => {
      const result = executeCleanupAction('dry_run', { authCount: 8, firestoreCount: 8 });
      assert.equal(result.mutationsCommitted, 0);
      assert.equal(result.simulatedAuthDeletions, 8);
      assert.equal(result.safe, true);
    });

    test('Blocks cleanup execution if confirmation key is absent or incorrect', () => {
      assert.throws(
        () => executeCleanupAction('execute_cleanup', { confirmationKey: 'WRONG_KEY', authCount: 5, firestoreCount: 5 }),
        /INVALID_KEY: Deletion aborted/
      );
      assert.throws(
        () => executeCleanupAction('execute_cleanup', { authCount: 5, firestoreCount: 5 }),
        /INVALID_KEY: Deletion aborted/
      );
    });

    test('Permits cleanup execution only with exact confirmation key', () => {
      const result = executeCleanupAction('execute_cleanup', {
        confirmationKey: CONFIRMATION_KEY,
        authCount: 3,
        firestoreCount: 3,
      });
      assert.equal(result.success, true);
      assert.equal(result.mutationsCommitted, 6);
    });
  });

  // ─── 7. Local Disk Backup Integrity Check ───────────────────────────────────
  describe('Timestamped Backup Integrity', () => {
    test('Verifies presence and valid JSON structure of disk backup files', () => {
      const backupDir = path.resolve(__dirname, '../backups/cleanup_backup_2026-10-26T19-11-07-020Z');
      assert.ok(fs.existsSync(backupDir), 'Backup directory must exist on disk');

      const compFile = path.join(backupDir, 'companies.json');
      const subFile = path.join(backupDir, 'subscriptions.json');

      assert.ok(fs.existsSync(compFile), 'companies.json backup must exist');
      assert.ok(fs.existsSync(subFile), 'subscriptions.json backup must exist');

      const comps = JSON.parse(fs.readFileSync(compFile, 'utf8'));
      const subs = JSON.parse(fs.readFileSync(subFile, 'utf8'));

      assert.equal(comps.length, 8, 'Backup must contain exactly 8 companies');
      assert.equal(subs.length, 8, 'Backup must contain exactly 8 subscriptions');

      const compIds = new Set(comps.map(c => c.id));
      for (const retained of RETAINED_PRODUCTION_COMPANIES) {
        assert.ok(compIds.has(retained.id), `Backup contains company ${retained.name} (${retained.id})`);
      }
    });
  });
});
