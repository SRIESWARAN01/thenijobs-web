/**
 * THENIJOBS BILLING SYSTEM — DYNAMIC UNIQUE SLOGAN ROTATION SERVICE
 *
 * Implements deterministic, database-safe, atomic rotation for bill slogans.
 * - Concurrency safe via Firestore Admin transactions
 * - Rotates through all available active slogans before repeating
 * - Avoids back-to-back duplicate slogans
 * - Automatically advances cycle upon complete rotation
 * - Preserves historical slogan consistency on past invoices
 */

import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import {
  MASTER_SLOGANS_LIBRARY,
  BillingSlogan,
  SloganAssignmentResult,
  SloganRotationState,
  getDeterministicBillingSlogan,
} from './sloganLibrary';

const ROTATION_DOC_REF = 'systemSettings/billingSloganRotation';
const SLOGANS_COLLECTION = 'billingSlogans';

/**
 * Seeds the Firestore `billingSlogans` collection with all 100 master slogans
 * if not already populated. Safe to call multiple times (idempotent).
 */
export async function seedMasterSlogansIfNeeded(force = false): Promise<number> {
  const db = getAdminFirestore();
  const slogansSnap = await db.collection(SLOGANS_COLLECTION).limit(1).get();

  if (!force && !slogansSnap.empty) {
    return 0; // Already seeded
  }

  const batch = db.batch();
  const now = new Date().toISOString();

  for (const item of MASTER_SLOGANS_LIBRARY) {
    const docRef = db.collection(SLOGANS_COLLECTION).doc(item.id);
    batch.set(
      docRef,
      {
        ...item,
        usageCount: 0,
        lastUsedAt: null,
        createdAt: now,
      },
      { merge: true },
    );
  }

  // Also initialize rotation state doc if missing
  const rotationDoc = db.doc(ROTATION_DOC_REF);
  const rotSnap = await rotationDoc.get();
  if (!rotSnap.exists || force) {
    batch.set(
      rotationDoc,
      {
        cycle: 1,
        usedSloganIds: [],
        lastAssignedSloganId: null,
        lastAssignedAt: null,
        totalAssignedCount: 0,
      } as SloganRotationState,
      { merge: true },
    );
  }

  await batch.commit();
  return MASTER_SLOGANS_LIBRARY.length;
}

/**
 * Atomically assigns the next dynamic slogan from the approved library.
 * Database-safe against race conditions across concurrent invoice creations.
 */
export async function assignNextBillingSlogan(options?: {
  preferredLanguage?: 'ta' | 'en';
  seedFallback?: string;
}): Promise<SloganAssignmentResult> {
  try {
    const db = getAdminFirestore();

    // Run within a database transaction for strict ACID atomicity and concurrency safety
    return await db.runTransaction(async (transaction) => {
      const rotRef = db.doc(ROTATION_DOC_REF);
      const rotSnap = await transaction.get(rotRef);

      let rotationState: SloganRotationState = {
        cycle: 1,
        usedSloganIds: [],
        lastAssignedSloganId: null,
        lastAssignedAt: null,
        totalAssignedCount: 0,
      };

      if (rotSnap.exists) {
        rotationState = rotSnap.data() as SloganRotationState;
      }

      // Fetch all active slogans
      const slogansQuery = await transaction.get(
        db.collection(SLOGANS_COLLECTION).where('isActive', '==', true),
      );

      let activeSlogans: BillingSlogan[] = [];
      if (!slogansQuery.empty) {
        activeSlogans = slogansQuery.docs.map((d) => d.data() as BillingSlogan);
      } else {
        // Fallback: master library in memory if collection has not yet been seeded
        activeSlogans = MASTER_SLOGANS_LIBRARY.map((s) => ({
          ...s,
          usageCount: 0,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
        }));
      }

      // Optional language preference filter
      let candidatePool = activeSlogans;
      if (options?.preferredLanguage) {
        const langFiltered = activeSlogans.filter((s) => s.language === options.preferredLanguage);
        if (langFiltered.length > 0) {
          candidatePool = langFiltered;
        }
      }

      // Find slogans that have not yet been used in the current cycle
      let unusedCandidates = candidatePool.filter(
        (s) => !rotationState.usedSloganIds.includes(s.id) && s.id !== rotationState.lastAssignedSloganId,
      );

      let currentCycle = rotationState.cycle || 1;
      let updatedUsedIds = [...(rotationState.usedSloganIds || [])];

      // If all slogans have been used in this cycle, advance to next cycle and reset rotation
      if (unusedCandidates.length === 0) {
        currentCycle += 1;
        updatedUsedIds = [];
        // Candidate pool for new cycle, excluding immediately previous slogan to avoid consecutive repetition
        unusedCandidates = candidatePool.filter((s) => s.id !== rotationState.lastAssignedSloganId);
        // Extreme fallback if candidate pool only has 1 slogan
        if (unusedCandidates.length === 0) {
          unusedCandidates = candidatePool;
        }
      }

      // Select next candidate (least recently used or next in index order)
      // Sort candidates by usageCount ascending, then by sloganNumber
      unusedCandidates.sort((a, b) => {
        if (a.usageCount !== b.usageCount) return a.usageCount - b.usageCount;
        return a.sloganNumber - b.sloganNumber;
      });

      const selectedSlogan = unusedCandidates[0] || candidatePool[0] || MASTER_SLOGANS_LIBRARY[0];
      const nowIso = new Date().toISOString();

      // Record this slogan ID in the used list for the cycle
      updatedUsedIds.push(selectedSlogan.id);

      // Update rotation state doc
      transaction.set(
        rotRef,
        {
          cycle: currentCycle,
          usedSloganIds: updatedUsedIds,
          lastAssignedSloganId: selectedSlogan.id,
          lastAssignedAt: nowIso,
          totalAssignedCount: (rotationState.totalAssignedCount || 0) + 1,
        },
        { merge: true },
      );

      // Update individual slogan doc usage metrics
      const sloganDocRef = db.collection(SLOGANS_COLLECTION).doc(selectedSlogan.id);
      transaction.set(
        sloganDocRef,
        {
          usageCount: (selectedSlogan.usageCount || 0) + 1,
          lastUsedAt: nowIso,
        },
        { merge: true },
      );

      return {
        sloganId: selectedSlogan.id,
        sloganText: selectedSlogan.text,
        sloganLanguage: selectedSlogan.language,
        sloganCycle: currentCycle,
        sloganAssignedAt: nowIso,
      };
    });
  } catch (err) {
    console.warn('[assignNextBillingSlogan] Fallback to deterministic rotation:', err);
    // Non-throwing deterministic fallback ensures bill creation is NEVER blocked
    return getDeterministicBillingSlogan(options?.seedFallback, options?.preferredLanguage);
  }
}

/**
 * Resets the rotation cycle back to cycle 1 (or specified cycle) and clears used IDs.
 * Strictly admin-only action.
 */
export async function resetSloganRotation(cycle = 1): Promise<void> {
  const db = getAdminFirestore();
  await db.doc(ROTATION_DOC_REF).set(
    {
      cycle,
      usedSloganIds: [],
      lastAssignedSloganId: null,
      lastAssignedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/**
 * Fetches the entire slogan library and current rotation status for Admin management.
 */
export async function getAdminSloganLibrary(): Promise<{
  slogans: BillingSlogan[];
  rotationState: SloganRotationState;
}> {
  const db = getAdminFirestore();

  // Ensure master library exists
  await seedMasterSlogansIfNeeded(false);

  const [slogansSnap, rotSnap] = await Promise.all([
    db.collection(SLOGANS_COLLECTION).orderBy('sloganNumber', 'asc').get(),
    db.doc(ROTATION_DOC_REF).get(),
  ]);

  let slogans: BillingSlogan[] = [];
  if (!slogansSnap.empty) {
    slogans = slogansSnap.docs.map((d) => d.data() as BillingSlogan);
  } else {
    slogans = MASTER_SLOGANS_LIBRARY.map((s) => ({
      ...s,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
    }));
  }

  const rotationState: SloganRotationState = rotSnap.exists
    ? (rotSnap.data() as SloganRotationState)
    : {
        cycle: 1,
        usedSloganIds: [],
        lastAssignedSloganId: null,
        lastAssignedAt: null,
        totalAssignedCount: 0,
      };

  return { slogans, rotationState };
}
