/**
 * THENIJOBS — SEO Job Slug Utility
 *
 * Implements the standard SEO URL model:
 * `/jobs/{job-title}-{company}-{location}`
 * Example: `/jobs/medical-records-reviewer-ags-it-solutions-theni`
 *
 * Rules:
 * - Lowercase
 * - Spaces replaced by '-'
 * - Special characters removed
 * - Multiple hyphens collapsed
 * - Suffix support for collision resolution
 */

export function slugify(str: unknown): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')     // remove non-alphanumeric chars
    .replace(/[\s_-]+/g, '-')        // collapse spaces/underscores to hyphen
    .replace(/^-+|-+$/g, '');        // strip leading/trailing hyphens
}

/**
 * Generates the standardized SEO job slug:
 * `${jobTitleSlug}-${companySlug}-${locationSlug}`
 */
export function generateJobSlug(
  title: string,
  company: string,
  location: string,
  suffix?: string
): string {
  const cleanTitle = slugify(title) || 'job';
  const cleanCompany = slugify(company) || 'company';
  const cleanLocation = slugify(location) || 'theni';

  let slug = `${cleanTitle}-${cleanCompany}-${cleanLocation}`
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (suffix) {
    const cleanSuffix = slugify(suffix);
    if (cleanSuffix) {
      slug = `${slug}-${cleanSuffix}`;
    }
  }

  return slug;
}

/**
 * Returns true if an identifier looks like a slug rather than a standard Firestore ID.
 * Standard Firestore document IDs are typically 20-character alphanumeric strings without hyphens.
 */
export function isJobSlug(identifier: string): boolean {
  if (!identifier) return false;
  if (identifier === '_fallback' || identifier === 'demo') return false;
  return identifier.includes('-');
}

/**
 * Standard helper to get the canonical URL path for a job across all components.
 * Prioritizes the job slug, falling back to generated slug or ID.
 */
export function getJobUrl(job: {
  slug?: string;
  id: string;
  title?: string;
  companyName?: string;
  company?: string;
  district?: string;
  location?: string;
}): string {
  if (job.slug && job.slug.trim()) {
    return `/jobs/${job.slug.trim()}`;
  }

  const title = job.title || '';
  const company = job.companyName || job.company || '';
  const loc = job.district || job.location || '';

  if (title && company) {
    return `/jobs/${generateJobSlug(title, company, loc)}`;
  }

  return `/jobs/${job.id}`;
}
