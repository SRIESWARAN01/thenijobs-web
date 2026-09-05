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

/**
 * SEO-4 — a `lastModified` field, or nothing at all.
 *
 * Returns `{ lastModified }` when the value is a date we can actually stand behind, and an
 * empty object otherwise, so it can be spread into an entry. The three dynamic families each
 * used to write `let lastMod = now` and overwrite it only on success, which meant an absent or
 * unparseable `updatedAt` was reported as "changed at deploy time" rather than "unknown".
 */
function withLastModified(value: unknown): { lastModified?: Date } {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) return {};
  const d = new Date(value as string | number | Date);
  return isNaN(d.getTime()) ? {} : { lastModified: d };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = 'https://thenijobs.com';

  /**
   * SEO-4 — there is deliberately no `const now = new Date()` here any more.
   *
   * It used to be handed to every static page, every location page, every location-category
   * page and every business category: 173 of 384 entries all claiming, on each deploy, to have
   * been modified at the instant of the build. Two builds a minute apart differed by 346 lines
   * with nothing in the repository changed.
   *
   * `lastmod` is optional, and a wrong one is worse than none: search engines stop trusting the
   * field when it does not match what they observe, which would have discounted it for the 211
   * entries here that carry a genuine `updatedAt`. So the URLs with no real modification signal
   * now carry no date, and only the ones that know when they changed say so.
   *
   * If these pages ever need a real date, it should come from something that actually changes
   * with them — the newest `updatedAt` among the jobs a listing renders, say — not from the
   * clock.
   */

  // Core static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/jobs`, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${BASE}/marketplace`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/businesses`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/services`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE}/daily-jobs`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/pricing`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/privacy`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/terms`, changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Location landing pages (/jobs-in-theni, /jobs-in-cumbum, etc.)
  const locationPages: MetadataRoute.Sitemap = LOCATIONS.map(loc => ({
    url: `${BASE}/jobs-in-${loc}`,
    changeFrequency: 'daily',
    priority: 0.95,
  }));

  // Location x Category landing pages (/jobs-in-theni/freshers, /jobs-in-theni/sales, etc.)
  const locationCategoryPages: MetadataRoute.Sitemap = [];
  for (const loc of LOCATIONS) {
    for (const cat of CATEGORIES) {
      locationCategoryPages.push({
        url: `${BASE}/jobs-in-${loc}/${cat}`,
        changeFrequency: 'daily',
        priority: 0.9,
      });
    }
  }

  // Business Category pages. SEO-3: this was a hand-written list of ten while the route
  // generated eighteen real pages, so eight existed and were advertised to nobody.
  const businessCategoryPages: MetadataRoute.Sitemap = BUSINESS_CATEGORY_SITEMAP_SLUGS.map(cat => ({
    url: `${BASE}/businesses/${cat}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // ── DYNAMIC: Individual active job URLs from Firestore ──────────────────
  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const activeJobs = await getActiveJobsForSitemap();
    jobPages = activeJobs.map(job => ({
      url: `${BASE}/jobs/${job.id}`,
      changeFrequency: 'daily' as const,
      priority: 0.85,
      // SEO-4: this used to default to the build time and only overwrite it when updatedAt
      // parsed, so a job with a missing or malformed updatedAt quietly claimed to have changed
      // at deploy. Now it either says when it changed or says nothing.
      ...withLastModified(job.updatedAt),
    }));
  } catch (error) {
    console.error('[Sitemap] Error fetching active jobs:', error);
  }

  // ── DYNAMIC: Verified company pages & landing websites from Firestore ───
  const companyPages: MetadataRoute.Sitemap = [];
  try {
    const companies = await getVerifiedCompanySlugsForSitemap();
    companies.forEach(c => {
      // 1. Standard Company Profile URL
      companyPages.push({
        url: `${BASE}/company/${c.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
        ...withLastModified(c.updatedAt),
      });

      // 2. Professional Company Landing Website URL
      companyPages.push({
        url: `${BASE}/${c.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
        ...withLastModified(c.updatedAt),
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
      portfolioPages.push({
        url: `${BASE}/portfolio/${p.customUrl}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        ...withLastModified(p.updatedAt),
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

