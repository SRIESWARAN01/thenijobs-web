import LocationJobPageClient from '@/components/seo/LocationJobPageClient';
import { createLocationMetadata } from '@/lib/seo/locationPageFactory';
import { generateBreadcrumbSchema } from '@/lib/seo/jobSchema';

export const metadata = createLocationMetadata('dindigul');

export default function DindigulJobsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Jobs', url: 'https://thenijobs.com/jobs' },
    { name: 'Jobs in Dindigul', url: 'https://thenijobs.com/jobs-in-dindigul' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LocationJobPageClient locationSlug="dindigul" />
    </>
  );
}
