import type { Metadata } from 'next';
import CategoryJobPageClient from '@/components/seo/CategoryJobPageClient';
import { createCategoryMetadata, getCategoryStaticParams } from '@/lib/seo/locationPageFactory';
import { generateBreadcrumbSchema } from '@/lib/seo/jobSchema';

export function generateStaticParams() {
  return getCategoryStaticParams();
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  return createCategoryMetadata('cumbum', category);
}

export default async function CumbumCategoryJobsPage({ params }: PageProps) {
  const { category } = await params;
  const catName = category.charAt(0).toUpperCase() + category.slice(1);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Jobs', url: 'https://thenijobs.com/jobs' },
    { name: 'Jobs in Cumbum', url: 'https://thenijobs.com/jobs-in-cumbum' },
    { name: `${catName} Jobs`, url: `https://thenijobs.com/jobs-in-cumbum/${category}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CategoryJobPageClient locationSlug="cumbum" categorySlug={category} />
    </>
  );
}
