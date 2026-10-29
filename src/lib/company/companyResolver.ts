import { db } from '@/lib/firebase/config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { slugifyCompany } from '@/lib/companySlug';

export interface CompanyEntity {
  id: string;
  name?: string;
  slug?: string;
  category?: string;
  district?: string;
  phone?: string;
  email?: string;
  ownerId?: string;
  ownerEmail?: string;
  verificationStatus?: any;
  isActive?: boolean;
  isVerified?: boolean;
  [key: string]: any;
}

/**
 * Generates an available unique company slug.
 * Checks against both the public companySlugs reservation collection and the companies collection.
 */
export async function getUniqueCompanySlug(
  baseName: string,
  district?: string,
  currentCompanyId?: string,
): Promise<string> {
  const cleanBase = slugifyCompany(baseName) || `company-${Date.now()}`;
  const cleanDistrict = district ? slugifyCompany(district) : '';

  const candidates: string[] = [
    cleanBase,
    cleanDistrict ? `${cleanBase}-${cleanDistrict}` : `${cleanBase}-theni`,
    `${cleanBase}-official`,
    `${cleanBase}-${Math.random().toString(36).substring(2, 6)}`,
  ];

  for (const candidate of candidates) {
    try {
      // 1. Check reservation in companySlugs
      const slugSnap = await getDoc(doc(db, 'companySlugs', candidate));
      if (slugSnap.exists()) {
        const data = slugSnap.data();
        if (currentCompanyId && data?.companyId === currentCompanyId) {
          return candidate; // Owned by current company
        }
        continue; // Collision, try next candidate
      }

      // 2. Check companies collection directly
      const q = query(collection(db, 'companies'), where('slug', '==', candidate), limit(1));
      const compSnap = await getDocs(q);
      if (compSnap.empty) {
        return candidate;
      }
      if (currentCompanyId && compSnap.docs[0].id === currentCompanyId) {
        return candidate;
      }
    } catch (err) {
      console.warn('[getUniqueCompanySlug] Error checking slug:', candidate, err);
      return candidate;
    }
  }

  return `${cleanBase}-${Date.now().toString().slice(-4)}`;
}

/**
 * Resolves a canonical company record for a given user.
 * Tries direct companyId, ownerId, ownerEmail, and slug reservation.
 * Automatically synchronizes users/{uid}.companyId when a match is found.
 */
export async function resolveCanonicalCompany(user: {
  uid: string;
  email?: string | null;
  companyId?: string | null;
} | null): Promise<CompanyEntity | null> {
  if (!user?.uid) return null;

  // 1. Check direct companyId if present
  if (user.companyId) {
    try {
      const snap = await getDoc(doc(db, 'companies', user.companyId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as CompanyEntity;
      }
    } catch (err) {
      console.warn('[resolveCanonicalCompany] direct companyId lookup failed:', err);
    }
  }

  // 2. Query by ownerId
  try {
    const qOwner = query(collection(db, 'companies'), where('ownerId', '==', user.uid), limit(1));
    const snapOwner = await getDocs(qOwner);
    if (!snapOwner.empty) {
      const comp = { id: snapOwner.docs[0].id, ...snapOwner.docs[0].data() } as CompanyEntity;
      await linkUserToCompany(user.uid, comp.id);
      return comp;
    }
  } catch (err) {
    console.warn('[resolveCanonicalCompany] ownerId lookup failed:', err);
  }

  // 3. Query by ownerEmail
  if (user.email) {
    const normalizedEmail = user.email.toLowerCase().trim();
    try {
      const qEmail = query(collection(db, 'companies'), where('ownerEmail', '==', normalizedEmail), limit(1));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        const comp = { id: snapEmail.docs[0].id, ...snapEmail.docs[0].data() } as CompanyEntity;
        await linkUserToCompany(user.uid, comp.id);
        // If ownerId is missing or guest, claim it
        if (!comp.ownerId || comp.ownerId.startsWith('guest_')) {
          await setDoc(doc(db, 'companies', comp.id), { ownerId: user.uid }, { merge: true }).catch(() => {});
        }
        return comp;
      }
    } catch (err) {
      console.warn('[resolveCanonicalCompany] ownerEmail lookup failed:', err);
    }
  }

  // 4. Check companySlugs reservation by ownerId
  try {
    const qSlugOwner = query(collection(db, 'companySlugs'), where('ownerId', '==', user.uid), limit(1));
    const snapSlugOwner = await getDocs(qSlugOwner);
    if (!snapSlugOwner.empty) {
      const slugData = snapSlugOwner.docs[0].data();
      if (slugData?.companyId) {
        const compSnap = await getDoc(doc(db, 'companies', slugData.companyId));
        if (compSnap.exists()) {
          const comp = { id: compSnap.id, ...compSnap.data() } as CompanyEntity;
          await linkUserToCompany(user.uid, comp.id);
          return comp;
        }
      }
    }
  } catch (err) {
    console.warn('[resolveCanonicalCompany] companySlugs lookup failed:', err);
  }

  return null;
}

/**
 * Links a user document to a canonical companyId and sets business roles.
 */
export async function linkUserToCompany(
  userId: string,
  companyId: string,
  role: string = 'business_owner',
): Promise<void> {
  if (!userId || !companyId) return;
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        companyId,
        role,
        isEmployer: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('[linkUserToCompany] failed to update user record:', err);
  }
}

/**
 * Safely reserves a company slug in the public companySlugs collection.
 */
export async function reserveCompanySlug(
  slug: string,
  companyId: string,
  ownerId: string,
  email?: string,
): Promise<boolean> {
  if (!slug || !companyId || !ownerId) return false;
  try {
    await setDoc(doc(db, 'companySlugs', slug), {
      slug,
      companyId,
      ownerId,
      email: (email || '').toLowerCase().trim(),
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn('[reserveCompanySlug] failed to reserve slug:', err);
    return false;
  }
}
