import { MetadataRoute } from 'next';
import { getActiveJobsForSitemap, getVerifiedCompanySlugsForSitemap } from '@/lib/firebase/firestoreServer';

/**
 * THENIJOBS Dynamic Sitemap
 * Includes individual active job URLs, location/category pages, and company pages.
 * Uses Firestore REST API for server-safe data fetching.
 *
 * Architecture (per checklist item #10):
 * /sitemap.xml → This file generates all URLs in a single sitemap.
 * As the job count grows beyond 50,000, use generateSitemaps() to split.
 */

const LOCATIONS = [
  'theni',
  'cumbum',
  'periyakulam',
  'bodinayakanur',
  'uthamapalayam',
  'andipatti',
  'chinnamanur',
  'madurai',
  'dindigul',
];

const CATEGORIES = [
  'freshers',
  'sales',
  'it',
  'accounts',
  'healthcare',
  'education',
  'banking',
  'hospitality',
  'manufacturing',
  'driving',
  'security',
  'customer-service',
  'part-time',
  'full-time',
  'work-from-home',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://thenijobs.com';
  const now = new Date();

  // Core static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${BASE}/jobs`, changeFrequency: 'hourly', priority: 0.95, lastModified: now },
    { url: `${BASE}/businesses`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/services`, changeFrequency: 'daily', priority: 0.85, lastModified: now },
    { url: `${BASE}/daily-jobs`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.6, lastModified: now },
    { url: `${BASE}/pricing`, changeFrequency: 'weekly', priority: 0.7, lastModified: now },
    { url: `${BASE}/privacy`, changeFrequency: 'monthly', priority: 0.4, lastModified: now },
    { url: `${BASE}/terms`, changeFrequency: 'monthly', priority: 0.4, lastModified: now },
  ];

  // Location landing pages (/jobs-in-theni, /jobs-in-cumbum, etc.)
  const locationPages: MetadataRoute.Sitemap = LOCATIONS.map(loc => ({
    url: `${BASE}/jobs-in-${loc}`,
    changeFrequency: 'daily',
    priority: 0.95,
    lastModified: now,
  }));

  // Location x Category landing pages (/jobs-in-theni/freshers, /jobs-in-theni/sales, etc.)
  const locationCategoryPages: MetadataRoute.Sitemap = [];
  for (const loc of LOCATIONS) {
    for (const cat of CATEGORIES) {
      locationCategoryPages.push({
        url: `${BASE}/jobs-in-${loc}/${cat}`,
        changeFrequency: 'daily',
        priority: 0.9,
        lastModified: now,
      });
    }
  }

  // Business Category pages
  const businessCategoryPages: MetadataRoute.Sitemap = [
    'agriculture', 'construction', 'education', 'healthcare',
    'it-software', 'textiles', 'manufacturing', 'retail', 'transport', 'finance',
  ].map(cat => ({
    url: `${BASE}/businesses/${cat}`,
    changeFrequency: 'daily',
    priority: 0.8,
    lastModified: now,
  }));

  // ── DYNAMIC: Individual active job URLs from Firestore ──────────────────
  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const activeJobs = await getActiveJobsForSitemap();
    jobPages = activeJobs.map(job => {
      // Use accurate lastmod from job.updatedAt
      let lastMod = now;
      if (job.updatedAt) {
        try {
          const d = new Date(job.updatedAt);
          if (!isNaN(d.getTime())) lastMod = d;
        } catch { /* use now */ }
      }

      return {
        url: `${BASE}/jobs/${job.id}`,
        changeFrequency: 'daily' as const,
        priority: 0.85,
        lastModified: lastMod,
      };
    });
  } catch (error) {
    console.error('[Sitemap] Error fetching active jobs:', error);
  }

  // ── DYNAMIC: Verified company pages from Firestore ──────────────────────
  let companyPages: MetadataRoute.Sitemap = [];
  try {
    const companies = await getVerifiedCompanySlugsForSitemap();
    companyPages = companies.map(c => {
      let lastMod = now;
      if (c.updatedAt) {
        try {
          const d = new Date(c.updatedAt);
          if (!isNaN(d.getTime())) lastMod = d;
        } catch { /* use now */ }
      }

      return {
        url: `${BASE}/company/${c.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        lastModified: lastMod,
      };
    });
  } catch (error) {
    console.error('[Sitemap] Error fetching companies:', error);
  }

  return [
    ...staticPages,
    ...locationPages,
    ...locationCategoryPages,
    ...businessCategoryPages,
    ...jobPages,
    ...companyPages,
  ];
}
