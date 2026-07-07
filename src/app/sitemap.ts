import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Dynamic sitemap — regenerated on every request so newly added
 * jobs, companies, and profiles appear immediately for Google.
 *
 * Previously this used `force-static` which froze the sitemap at build time.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://thenijobs.com';
  const now = new Date();

  // ── Static pages ──
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${BASE}/jobs`, changeFrequency: 'hourly', priority: 0.9, lastModified: now },
    { url: `${BASE}/jobs/madurai`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/jobs/theni`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/jobs/coimbatore`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/jobs/freshers`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/jobs/part-time`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/businesses`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${BASE}/services`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${BASE}/privacy`, changeFrequency: 'monthly', priority: 0.4, lastModified: now },
    { url: `${BASE}/academy`, changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: `${BASE}/register`, changeFrequency: 'monthly', priority: 0.7, lastModified: now },
    { url: `${BASE}/company/register`, changeFrequency: 'monthly', priority: 0.8, lastModified: now },
    { url: `${BASE}/pricing`, changeFrequency: 'weekly', priority: 0.7, lastModified: now },
  ];

  // ── Business category pages ──
  const categoryPages: MetadataRoute.Sitemap = [
    'agriculture', 'construction', 'education', 'healthcare',
    'it-software', 'textiles', 'manufacturing', 'retail', 'transport', 'finance',
    'food-beverage',
  ].map(cat => ({
    url: `${BASE}/businesses/${cat}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    lastModified: now,
  }));

  // ── Active jobs from Firestore ──
  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const jobsSnap = await adminDb.collection('jobs')
      .where('isActive', '==', true)
      .limit(5000)
      .get();
    jobPages = jobsSnap.docs.map((docSnap) => {
      const d = docSnap.data();
      const lastModified = d.updatedAt ? (
        typeof d.updatedAt.toDate === 'function' ? d.updatedAt.toDate() : new Date(d.updatedAt)
      ) : now;
      return {
        url: `${BASE}/jobs/${docSnap.id}`,
        changeFrequency: 'daily' as const,
        priority: 0.7,
        lastModified,
      };
    });
  } catch (err) {
    console.error('Failed to fetch jobs for sitemap:', err);
  }

  // ── Verified companies from Firestore ──
  let companyPages: MetadataRoute.Sitemap = [];
  try {
    const companiesSnap = await adminDb.collection('companies')
      .where('verificationStatus', '==', 'verified')
      .limit(5000)
      .get();
    companyPages = companiesSnap.docs
      .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
      .filter((c: any) => !!c.slug && c.isActive === true && c.status !== 'suspended' && c.status !== 'deleted' && c.deleted !== true)
      .map((c: any) => {
        const lastModified = c.updatedAt ? (
          typeof c.updatedAt.toDate === 'function' ? c.updatedAt.toDate() : new Date(c.updatedAt)
        ) : now;
        return {
          url: `${BASE}/company/${c.slug}`,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
          lastModified,
        };
      });
  } catch (err) {
    console.error('Failed to fetch companies for sitemap:', err);
  }

  // ── Public profiles from Firestore ──
  let profilePages: MetadataRoute.Sitemap = [];
  try {
    const profilesSnap = await adminDb.collection('publicProfiles')
      .limit(5000)
      .get();
    profilePages = profilesSnap.docs.map((docSnap) => {
      const d = docSnap.data();
      const lastModified = d.updatedAt ? (
        typeof d.updatedAt.toDate === 'function' ? d.updatedAt.toDate() : new Date(d.updatedAt)
      ) : now;
      return {
        url: `${BASE}/profile/${docSnap.id}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
        lastModified,
      };
    });
  } catch (err) {
    console.error('Failed to fetch public profiles for sitemap:', err);
  }

  return [...staticPages, ...categoryPages, ...jobPages, ...companyPages, ...profilePages];
}
