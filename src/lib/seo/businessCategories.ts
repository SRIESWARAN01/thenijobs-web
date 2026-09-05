/**
 * SEO-3 — the one list of business-category slugs.
 *
 * `src/app/businesses/[category]/page.tsx` held this privately while `src/app/sitemap.ts` kept
 * its own hand-written copy of ten of them. The route generated eighteen real pages, so eight
 * existed and were never advertised to a search engine. Nothing connected the two lists, so
 * nothing could notice.
 *
 * `_fallback` is the shell that `vercel.json` rewrites unknown categories to. It is a real
 * exported page and must stay in the route's static params, but it is not a destination and
 * must never appear in the sitemap — hence the two exports.
 */
export const BUSINESS_CATEGORY_ROUTE_SLUGS = [
  '_fallback',
  'all',
  'agriculture',
  'construction',
  'it-software',
  'healthcare',
  'healthcare-hospital',
  'education',
  'education-training',
  'textiles',
  'manufacturing',
  'retail',
  'transport',
  'finance',
  'services',
  'automobile',
  'hotel-restaurant',
  'professional-corporate',
  'local-business',
] as const;

/** Everything above that is a real destination — the route list minus the rewrite shell. */
export const BUSINESS_CATEGORY_SITEMAP_SLUGS: readonly string[] =
  BUSINESS_CATEGORY_ROUTE_SLUGS.filter((slug) => slug !== '_fallback');
