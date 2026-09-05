import { MetadataRoute } from 'next';
import { getActiveJobsForSitemap, getVerifiedCompanySlugsForSitemap, getPublishedPortfolioSitesForSitemap } from '@/lib/firebase/firestoreServer';
import { LOCATIONS_DATA, CATEGORIES_LIST } from '@/components/seo/locationData';
import { BUSINESS_CATEGORY_SITEMAP_SLUGS } from '@/lib/seo/businessCategories';

export const dynamic = 'force-static';

/**
 * THENIJOBS Dynamic Sitemap
 * Includes individual active job URLs, location/category pages, and company pages.
 * Uses Firestore REST API for server-safe data fetching.
 *
 * Architecture (per checklist item #10):
 * /sitemap.xml → This file generates all URLs in a single sitemap.
 * As the job count grows beyond 50,000, use generateSitemaps() to split.
 */

/**
 * SEO-3 — these are derived, not typed out again.
 *
 * This file used to hand-maintain its own copies of the location and category lists. They
 * happened to match the data, but nothing tied them to the ROUTES, so the sitemap advertised
 * nine locations x fifteen categories while only theni and cumbum had a [category] route.
 * 105 of the 374 URLs it published returned 404 in production, measured on 2026-09-05.
 *
 * Every jobs-in-<location> route now has a [category] route and all nine read
 * getCategoryStaticParams(), which is CATEGORIES_LIST. Reading the same two exports here means
 * adding a location or a category updates the routes and the sitemap together, and dropping one
 * cannot leave the sitemap pointing at a page that no longer exists.
 */
const LOCATIONS = Object.keys(LOCATIONS_DATA);

const CATEGORIES = CATEGORIES_LIST.map((c) => c.slug);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://thenijobs.com';
  const now = new Date();

  // Core static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0, lastModified: now },
    { url: `${BASE}/jobs`, changeFrequency: 'hourly', priority: 0.95, lastModified: now },
    { url: `${BASE}/marketplace`, changeFrequency: 'daily', priority: 0.9, lastModified: now },
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

  // Business Category pages. SEO-3: this was a hand-written list of ten while the route
  // generated eighteen real pages, so eight existed and were advertised to nobody.
  const businessCategoryPages: MetadataRoute.Sitemap = BUSINESS_CATEGORY_SITEMAP_SLUGS.map(cat => ({
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

  // ── DYNAMIC: Verified company pages & landing websites from Firestore ───
  const companyPages: MetadataRoute.Sitemap = [];
  try {
    const companies = await getVerifiedCompanySlugsForSitemap();
    companies.forEach(c => {
      let lastMod = now;
      if (c.updatedAt) {
        try {
          const d = new Date(c.updatedAt);
          if (!isNaN(d.getTime())) lastMod = d;
        } catch { /* use now */ }
      }

      // 1. Standard Company Profile URL
      companyPages.push({
        url: `${BASE}/company/${c.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
        lastModified: lastMod,
      });

      // 2. Professional Company Landing Website URL
      companyPages.push({
        url: `${BASE}/${c.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        lastModified: lastMod,
      });
    });
  } catch (error) {
    console.error('[Sitemap] Error fetching companies:', error);
  }

  // ── DYNAMIC: Published Job Seeker & Company Portfolios (with Google Index enabled)
  const portfolioPages: MetadataRoute.Sitemap = [];
  try {
    const portfolios = await getPublishedPortfolioSitesForSitemap();
    portfolios.forEach(p => {
      let lastMod = now;
      if (p.updatedAt) {
        try {
          const d = new Date(p.updatedAt);
          if (!isNaN(d.getTime())) lastMod = d;
        } catch { /* use now */ }
      }

      portfolioPages.push({
        url: `${BASE}/portfolio/${p.customUrl}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        lastModified: lastMod,
      });
    });
  } catch (error) {
    console.error('[Sitemap] Error fetching portfolio sites:', error);
  }

  return [
    ...staticPages,
    ...locationPages,
    ...locationCategoryPages,
    ...businessCategoryPages,
    ...jobPages,
    ...companyPages,
    ...portfolioPages,
  ];
}

