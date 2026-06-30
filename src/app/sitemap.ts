import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://thenijobs.com';
  const now = new Date();

  const staticPages = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/jobs`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/jobs/madurai`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/jobs/theni`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/jobs/coimbatore`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/jobs/freshers`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/jobs/part-time`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/businesses`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/register`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/company/register`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/employer/post-job`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/pricing`, changeFrequency: 'weekly', priority: 0.7 },
  ] as MetadataRoute.Sitemap;

  const categoryPages = [
    'agriculture', 'construction', 'education', 'healthcare',
    'it-software', 'textiles', 'manufacturing', 'retail', 'transport', 'finance',
  ].map(cat => ({
    url: `${BASE}/businesses/${cat}`,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    lastModified: now,
  }));

  // Fetch active jobs from Firestore
  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const jobsSnap = await adminDb.collection('jobs')
      .where('isActive', '==', true)
      .limit(500)
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

  // Fetch verified companies from Firestore
  let companyPages: MetadataRoute.Sitemap = [];
  try {
    const companiesSnap = await adminDb.collection('companies')
      .where('verificationStatus', '==', 'verified')
      .limit(500)
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

  // Fetch seeker public profiles from Firestore
  let profilePages: MetadataRoute.Sitemap = [];
  try {
    const profilesSnap = await adminDb.collection('publicProfiles')
      .limit(500)
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
