/**
 * SEO-friendly job URL slug utilities.
 *
 * Format: `{title}-{location}-{firestoreId}`
 * Example: `software-engineer-madurai-abc123XYZ`
 *
 * The Firestore document ID is always the last segment after the final hyphen,
 * allowing backwards-compatible extraction from the slug.
 */

/**
 * Generate a URL-safe slug from arbitrary text.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Build a full job slug: `{title}-{location}-{id}`
 * Falls back to just the raw ID if title is empty.
 */
export function buildJobSlug(job: {
  id: string;
  title?: string | null;
  location?: string | null;
  district?: string | null;
}): string {
  const parts: string[] = [];

  if (job.title) parts.push(slugify(job.title));
  const loc = job.location || job.district;
  if (loc) parts.push(slugify(loc));

  // Always append the Firestore ID so the slug is unique and extractable
  parts.push(job.id);

  return parts.join('-');
}

/**
 * Extract the Firestore document ID from a job slug or raw ID.
 *
 * Strategy:
 * 1. If the entire param is a valid 20-char Firestore auto-ID, use it directly.
 * 2. Otherwise, extract the trailing segment after the last hyphen that looks
 *    like a Firestore auto-ID (20 alphanumeric chars).
 * 3. Fall back to using the entire param as-is.
 */
export function extractJobId(slugOrId: string): string {
  // Direct Firestore auto-ID (20 alphanumeric chars)
  if (/^[a-zA-Z0-9]{20}$/.test(slugOrId)) {
    return slugOrId;
  }

  // Try extracting from the end of a slug
  const lastDash = slugOrId.lastIndexOf('-');
  if (lastDash !== -1) {
    const tail = slugOrId.substring(lastDash + 1);
    if (/^[a-zA-Z0-9]{20}$/.test(tail)) {
      return tail;
    }
  }

  // Fall back — could be a custom ID or short ID
  return slugOrId;
}
