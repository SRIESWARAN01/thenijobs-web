import type { Metadata } from 'next';
import LocationCategoryPage from '@/components/seo/LocationCategoryPage';
import { createCategoryMetadata, getCategoryStaticParams } from '@/lib/seo/locationPageFactory';

// SEO-3: the only thing that distinguishes this route from the other eight.
const LOCATION = 'dindigul';

export function generateStaticParams() {
  return getCategoryStaticParams();
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  return createCategoryMetadata(LOCATION, category);
}

export default async function DindigulCategoryJobsPage({ params }: PageProps) {
  const { category } = await params;
  return <LocationCategoryPage locationSlug={LOCATION} categorySlug={category} />;
}
