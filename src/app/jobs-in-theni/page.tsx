import LocationJobPageClient from '@/components/seo/LocationJobPageClient';
import { createLocationMetadata } from '@/lib/seo/locationPageFactory';
import { generateBreadcrumbSchema } from '@/lib/seo/jobSchema';

export const metadata = createLocationMetadata('theni');

export default function TheniJobsPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Jobs', url: 'https://thenijobs.com/jobs' },
    { name: 'Jobs in Theni', url: 'https://thenijobs.com/jobs-in-theni' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <LocationJobPageClient locationSlug="theni" />
    </>
  );
}
