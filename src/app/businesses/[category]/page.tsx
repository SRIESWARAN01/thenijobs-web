import BusinessCategoryPageClient from './BusinessCategoryPageClient';

const CATEGORIES = [
  'agriculture',
  'construction',
  'it-software',
  'healthcare',
  'education',
  'textiles',
  'manufacturing',
  'retail',
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
