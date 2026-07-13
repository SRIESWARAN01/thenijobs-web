import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Serialisable job type that can be passed from server → client components.
 * All Firestore Timestamps are converted to ISO strings.
 */
export interface SeoJob {
  id: string;
  title: string;
  company: string;
  location: string;
  district: string;
  salary: string;
  type: string;
  posted: string;
  logo: string;
  isUrgent: boolean;
  isPremium: boolean;
  isVerified: boolean;
  verificationLevel: string;
  description: string;
}

/**
 * Server-side function to fetch jobs filtered by district or jobType.
 * Used at build/request time in page.tsx server components.
 */
export async function fetchSeoJobs(
  filterField: 'district' | 'jobType',
  filterValue: string,
  maxResults = 40,
): Promise<SeoJob[]> {
  try {
    const queryRef = adminDb
      .collection('jobs')
      .where('isActive', '==', true)
      .where(filterField, '==', filterValue)
      .orderBy('createdAt', 'desc')
      .limit(maxResults);

    const snapshot = await queryRef.get();

    return snapshot.docs
      .filter((doc) => {
        const d = doc.data();
        // Inline visibility check (mirroring isPublicJobVisible without importing client lib)
        if (d.status === 'suspended' || d.status === 'deleted' || d.deleted === true) return false;
        if (d.companyDeleted === true || d.companyIsActive === false) return false;
        const blockedStatuses = ['suspended', 'deleted', 'rejected', 'banned'];
        if (d.companyStatus && blockedStatuses.includes(d.companyStatus)) return false;
        return true;
      })
      .map((doc) => {
        const d = doc.data();

        const salaryStr =
          d.salaryMin && d.salaryMax
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}`
            : 'Salary Negotiable';

        const typeStr = d.jobType
          ? d.jobType
              .replace('_', ' ')
              .split(' ')
              .map((w: string) => w[0].toUpperCase() + w.substring(1))
              .join(' ')
          : 'Full Time';

        const createdAtMs = d.createdAt
          ? typeof d.createdAt.toMillis === 'function'
            ? d.createdAt.toMillis()
            : new Date(d.createdAt).getTime()
          : Date.now();
        const daysAgo = Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24));
        const postedStr = daysAgo <= 0 ? 'Today' : `${daysAgo}d ago`;

        return {
          id: doc.id,
          title: d.title || '',
          company: d.companyName || 'Verified Employer',
          location: d.location || d.district || 'Theni',
          district: d.district || 'Theni',
          salary: salaryStr,
          type: typeStr,
          posted: postedStr,
          logo: d.logo || (d.companyName ? d.companyName.substring(0, 2).toUpperCase() : '💼'),
          isUrgent: d.isUrgent || false,
          isPremium: d.isPremium || false,
          isVerified:
            d.isVerified || d.companyVerificationStatus === 'verified' || d.companyVerified || false,
          verificationLevel: d.verificationLevel || d.companyVerificationLevel || 'free',
          description: d.description || '',
        };
      });
  } catch (err) {
    console.error(`[fetchSeoJobs] Error fetching ${filterField}=${filterValue}:`, err);
    return [];
  }
}
