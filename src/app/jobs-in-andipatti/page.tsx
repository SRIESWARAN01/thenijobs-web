import LocationJobPageClient from '@/components/seo/LocationJobPageClient';
import { createLocationMetadata } from '@/lib/seo/locationPageFactory';
import { generateBreadcrumbSchema } from '@/lib/seo/jobSchema';

export const metadata = createLocationMetadata('andipatti');

export default function AndipattiJobsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Jobs', url: 'https://thenijobs.com/jobs' },
    { name: 'Jobs in Andipatti', url: 'https://thenijobs.com/jobs-in-andipatti' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LocationJobPageClient locationSlug="andipatti" />
    </>
  );
}
