import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';

/** Convert raw company name to URL-friendly slug */
export function slugifyCompany(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Check if a company slug is already taken in Firestore */
export async function isCompanySlugAvailable(slug: string, currentCompanyId?: string): Promise<boolean> {
  if (!slug) return false;
  try {
    const q = query(collection(db, 'companies'), where('slug', '==', slug.toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (currentCompanyId) {
      return snap.docs.every(doc => doc.id === currentCompanyId);
    }
    return false;
  } catch (err) {
    console.error('Error checking company slug availability:', err);
    return true;
  }
}

/** Generate 3 alternate slug suggestions if the primary slug is taken */
export function generateSlugSuggestions(baseSlug: string, district?: string): string[] {
  const cleanBase = slugifyCompany(baseSlug);
  const cleanDistrict = district ? slugifyCompany(district) : 'theni';

  return [
    `${cleanBase}-${cleanDistrict}`,
    `${cleanBase}-tn`,
    `${cleanBase}-official`,
    `${cleanBase}-india`,
  ];
}

/**
 * Resolve a public company page's slug to its company document.
 *
 * PERF-2: the callers used to try these lookups strictly in sequence, each waiting for the
 * previous to come back empty, so an unresolvable slug cost up to six serial round trips on a
 * page that is already client-fetched. No branch feeds another, so they run together here and
 * the first hit wins **in the same priority order as before** — which company resolves does not
 * change, only how long it takes to find out.
 *
 * Promise.allSettled rather than Promise.all on purpose: under the default-deny rules some of
 * these can be rejected rather than empty (a get on a document that does not exist has no
 * `resource` for the rule to read), and one rejection must not abort the others. The sequential
 * version put every branch in one try block, so a single denial skipped the rest of the cascade
 * including the owner preview.
 */
export async function resolveCompanyBySlug(
  slug: string,
  options: { includeNameMatch?: boolean; ownerUid?: string | null } = {},
): Promise<Record<string, any> | null> {
  if (!slug) return null;

  // Public list queries must carry the constraint the companies read rule enforces, or
  // Firestore refuses the query outright rather than returning nothing.
  const verified = where('verificationStatus', '==', 'verified');
  const first = async (...constraints: any[]) => {
    const snap = await getDocs(query(collection(db, 'companies'), ...constraints));
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  };

  // Priority order. Index 0 wins over index 1, and so on.
  const branches: Array<Promise<Record<string, any> | null>> = [
    first(where('slug', '==', slug), verified, limit(1)),
    getDoc(doc(db, 'companies', slug)).then(s => (s.exists() ? { id: s.id, ...s.data() } : null)),
    first(where('aliases', 'array-contains', slug), verified, limit(1)),
    first(where('slugLower', '==', slug.toLowerCase()), verified, limit(1)),
  ];

  // A company saved without a slug/slugLower is still reachable: the directory links to
  // slugifyCompany(name), so match the name that produces this slug. PERF-2 added the verified
  // constraint here — it was the one branch missing it, which would have made it throw rather
  // than return empty once the default-deny rules ship.
  if (options.includeNameMatch) {
    branches.push(first(where('name', '==', slug.replace(/-/g, ' ')), verified, limit(1)));
  }

  // Last resort: a signed-in owner may preview their own pending or rejected company.
  if (options.ownerUid) {
    branches.push(first(where('slug', '==', slug), where('ownerId', '==', options.ownerUid), limit(1)));
  }

  const settled = await Promise.allSettled(branches);
  for (const outcome of settled) {
    if (outcome.status === 'fulfilled' && outcome.value) return outcome.value;
  }
  return null;
}
