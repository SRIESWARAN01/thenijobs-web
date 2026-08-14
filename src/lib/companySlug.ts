import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
