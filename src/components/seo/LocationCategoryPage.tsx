import CategoryJobPageClient from '@/components/seo/CategoryJobPageClient';
import { LOCATIONS_DATA, CATEGORIES_LIST } from '@/components/seo/locationData';
import { generateBreadcrumbSchema } from '@/lib/seo/jobSchema';

const BASE = 'https://thenijobs.com';

/**
 * SEO-3 — the body of every `/jobs-in-<location>/<category>` page.
 *
 * There were two of these routes, for theni and cumbum, whose files differed only by a
 * location string — while the sitemap advertised all nine locations. 105 of its URLs returned
 * 404 in production. Adding seven more copies of a file that already existed twice would have
 * left nine copies to drift, so the shared part lives here and each route file carries nothing
 * but its own location.
 *
 * The location and category names come from `locationData`, the same source the routes and the
 * sitemap now both read, so a page cannot exist under a name the breadcrumb disagrees with.
 */
export default function LocationCategoryPage({
  locationSlug,
  categorySlug,
}: {
  locationSlug: string;
  categorySlug: string;
}) {
  const locationName =
    LOCATIONS_DATA[locationSlug]?.name ??
    locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1);
  const categoryName =
    CATEGORIES_LIST.find((c) => c.slug === categorySlug)?.name ??
    categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: BASE },
    { name: 'Jobs', url: `${BASE}/jobs` },
    { name: `Jobs in ${locationName}`, url: `${BASE}/jobs-in-${locationSlug}` },
    { name: `${categoryName} Jobs`, url: `${BASE}/jobs-in-${locationSlug}/${categorySlug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CategoryJobPageClient locationSlug={locationSlug} categorySlug={categorySlug} />
    </>
  );
}
