import BusinessCategoryPageClient from './BusinessCategoryPageClient';

const CATEGORIES = [
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
];

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }));
}


export default async function BusinessCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <BusinessCategoryPageClient category={category} />;
}
