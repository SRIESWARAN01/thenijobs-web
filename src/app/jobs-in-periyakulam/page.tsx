import LocationJobPageClient from '@/components/seo/LocationJobPageClient';
import { createLocationMetadata } from '@/lib/seo/locationPageFactory';
import { generateBreadcrumbSchema } from '@/lib/seo/jobSchema';
import { toJsonLdScript } from '@/lib/seo/jsonLd';

export const metadata = createLocationMetadata('periyakulam');

export default function PeriyakulamJobsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.thenijobs.com' },
    { name: 'Jobs', url: 'https://www.thenijobs.com/jobs' },
    { name: 'Jobs in Periyakulam', url: 'https://www.thenijobs.com/jobs-in-periyakulam' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbSchema) }}
      />
      <LocationJobPageClient locationSlug="periyakulam" />
    </>
  );
}
