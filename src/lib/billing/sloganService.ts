/**
 * THENIJOBS BILLING SYSTEM — DYNAMIC UNIQUE SLOGAN ROTATION & ASSIGNMENT SERVICE
 *
 * Implements deterministic, database-safe, atomic assignment for billing slogans.
 * - Concurrency safe via Firestore Admin transactions
 * - Preserves historical slogan snapshots on past invoices/receipts
 * - Supports 14 billing models with customizable slogan mappings
 * - 4-Tier resolution hierarchy (Snapshot -> Model -> Category -> Global)
 * - Safe fallback to in-memory library ensures billing is never blocked
 */

import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';
import {
  MASTER_SLOGANS_LIBRARY,
  BILLING_MODELS,
  SLOGAN_CATEGORIES,
  BillingSlogan,
  SloganAssignmentResult,
  SloganRotationState,
  SloganCategory,
  SloganLanguage,
  resolveBillingSlogan,
  getDeterministicBillingSlogan,
  getDefaultModelMappings,
} from './sloganLibrary';

export {
  getDeterministicBillingSlogan,
  resolveBillingSlogan,
  getDefaultModelMappings,
  BILLING_MODELS,
  SLOGAN_CATEGORIES,
};

const ROTATION_DOC_REF = 'systemSettings/billingSloganRotation';
const MODEL_MAPPINGS_DOC_REF = 'systemSettings/billingModelSlogans';
const SLOGANS_COLLECTION = 'billingSlogans';

export interface BillingModelMappingRecord {
  modelId: string;
  sloganIdTa: string;
  sloganIdEn: string;
  updatedAt?: string;
}

export type ModelMappingsMap = Record<string, { sloganIdTa: string; sloganIdEn: string }>;

/**
 * Retrieves the current model-to-slogan mappings from Firestore,
 * merged with defaults for any unconfigured models.
 */
export async function getBillingModelSlogansMapping(): Promise<ModelMappingsMap> {
  const defaults = getDefaultModelMappings();
  try {
    const db = getAdminFirestore();
    const docSnap = await db.doc(MODEL_MAPPINGS_DOC_REF).get();
    if (docSnap.exists) {
      const stored = docSnap.data() as Record<string, { sloganIdTa: string; sloganIdEn: string }>;
      return { ...defaults, ...stored };
    }
  } catch (err) {
    console.warn('[getBillingModelSlogansMapping] Failed to load custom mappings, using defaults:', err);
  }
  return defaults;
}

/**
 * Updates a specific billing model's assigned slogans for Tamil and/or English.
 */
export async function updateBillingModelSloganMapping(
  modelId: string,
  sloganIdTa: string,
  sloganIdEn: string
): Promise<ModelMappingsMap> {
  const db = getAdminFirestore();
  const docRef = db.doc(MODEL_MAPPINGS_DOC_REF);

  const currentMappings = await getBillingModelSlogansMapping();
  currentMappings[modelId] = {
    sloganIdTa: sloganIdTa || currentMappings[modelId]?.sloganIdTa || 'slogan_1',
    sloganIdEn: sloganIdEn || currentMappings[modelId]?.sloganIdEn || 'slogan_51',
  };

  await docRef.set(
    {
      ...currentMappings,
      _updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return currentMappings;
}

/**
 * Seeds the Firestore `billingSlogans` collection with all 100 master slogans
 * and default billing model mappings if not already populated.
 * Safe to call multiple times (idempotent).
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

  // Initialize rotation state doc if missing
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

  // Initialize billing model mappings doc if missing
  const mappingsDoc = db.doc(MODEL_MAPPINGS_DOC_REF);
  const mapSnap = await mappingsDoc.get();
  if (!mapSnap.exists || force) {
    batch.set(
      mappingsDoc,
      {
        ...getDefaultModelMappings(),
        _seededAt: now,
      },
      { merge: true }
    );
  }

  await batch.commit();
  return MASTER_SLOGANS_LIBRARY.length;
}

export interface AssignSloganOptions {
  preferredLanguage?: SloganLanguage;
  billingModel?: string;
  category?: SloganCategory;
  seedFallback?: string;
  existingSlogan?: {
    sloganText?: string;
    sloganLanguage?: SloganLanguage;
    sloganId?: string;
    sloganCategory?: SloganCategory;
    sloganCycle?: number;
  };
}

/**
 * Assigns a dynamic slogan using the 4-tier resolution hierarchy:
 * 1. Historical Invoice Snapshot (if existingSlogan.sloganText present, strictly preserve)
 * 2. Billing Model assigned slogan (from Firestore mappings or defaults)
 * 3. Category default slogan
 * 4. Global default slogan
 *
 * Concurrency-safe against race conditions and updates usage count metrics.
 */
export async function assignNextBillingSlogan(
  options?: AssignSloganOptions
): Promise<SloganAssignmentResult> {
  // Tier 1 Check: Historical snapshot preservation - no DB mutation needed
  if (options?.existingSlogan && options.existingSlogan.sloganText) {
    return {
      sloganId: options.existingSlogan.sloganId || 'slogan_historical',
      sloganText: options.existingSlogan.sloganText,
      sloganLanguage: options.existingSlogan.sloganLanguage || 'ta',
      sloganCategory: options.existingSlogan.sloganCategory || 'business_growth',
      billingModel: options.billingModel,
      sloganCycle: options.existingSlogan.sloganCycle || 1,
      sloganAssignedAt: new Date().toISOString(),
    };
  }

  try {
    const db = getAdminFirestore();

    // Run transaction to select, track usage, and update rotation metrics atomically
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

      // Fetch active slogans from collection
      const slogansQuery = await transaction.get(
        db.collection(SLOGANS_COLLECTION).where('isActive', '==', true)
      );

      let activeSlogans: BillingSlogan[] = [];
      if (!slogansQuery.empty) {
        activeSlogans = slogansQuery.docs.map((d) => d.data() as BillingSlogan);
      } else {
        activeSlogans = MASTER_SLOGANS_LIBRARY.filter((s) => s.isActive).map((s) => ({
          ...s,
          usageCount: 0,
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
        }));
      }

      // Fetch custom model mappings
      const mapRef = db.doc(MODEL_MAPPINGS_DOC_REF);
      const mapSnap = await transaction.get(mapRef);
      const customMappings: ModelMappingsMap = mapSnap.exists
        ? (mapSnap.data() as ModelMappingsMap)
        : getDefaultModelMappings();

      // Resolve slogan using 4-tier hierarchy
      const resolved = resolveBillingSlogan(
        {
          language: options?.preferredLanguage,
          billingModel: options?.billingModel,
          category: options?.category,
          existingSlogan: options?.existingSlogan,
        },
        activeSlogans,
        customMappings
      );

      const nowIso = new Date().toISOString();
      const currentCycle = rotationState.cycle || 1;
      const updatedUsedIds = Array.from(new Set([...(rotationState.usedSloganIds || []), resolved.sloganId]));

      // Update rotation state
      transaction.set(
        rotRef,
        {
          cycle: currentCycle,
          usedSloganIds: updatedUsedIds,
          lastAssignedSloganId: resolved.sloganId,
          lastAssignedAt: nowIso,
          totalAssignedCount: (rotationState.totalAssignedCount || 0) + 1,
        },
        { merge: true }
      );

      // Increment slogan usage count
      const sloganDocRef = db.collection(SLOGANS_COLLECTION).doc(resolved.sloganId);
      const currentDoc = activeSlogans.find((s) => s.id === resolved.sloganId);
      transaction.set(
        sloganDocRef,
        {
          usageCount: (currentDoc?.usageCount || 0) + 1,
          lastUsedAt: nowIso,
        },
        { merge: true }
      );

      return {
        ...resolved,
        sloganCycle: currentCycle,
        sloganAssignedAt: nowIso,
      };
    });
  } catch (err) {
    console.warn('[assignNextBillingSlogan] Database transaction fallback:', err);
    // Safe in-memory fallback guarantees invoice/bill generation NEVER fails
    return resolveBillingSlogan({
      language: options?.preferredLanguage,
      billingModel: options?.billingModel,
      category: options?.category,
      existingSlogan: options?.existingSlogan,
    });
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
 * Fetches the entire slogan library, billing model mappings, and current rotation status for Admin management.
 */
export async function getAdminSloganLibrary(): Promise<{
  slogans: BillingSlogan[];
  rotationState: SloganRotationState;
  modelMappings: ModelMappingsMap;
}> {
  const db = getAdminFirestore();

  // Ensure master library exists
  await seedMasterSlogansIfNeeded(false);

  const [slogansSnap, rotSnap, mapSnap] = await Promise.all([
    db.collection(SLOGANS_COLLECTION).orderBy('sloganNumber', 'asc').get(),
    db.doc(ROTATION_DOC_REF).get(),
    db.doc(MODEL_MAPPINGS_DOC_REF).get(),
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

  const modelMappings: ModelMappingsMap = mapSnap.exists
    ? (mapSnap.data() as ModelMappingsMap)
    : getDefaultModelMappings();

  return { slogans, rotationState, modelMappings };
}
