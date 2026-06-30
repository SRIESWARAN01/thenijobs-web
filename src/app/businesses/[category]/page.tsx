import type { Metadata } from 'next';
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
  'transport',
  'finance',
  'food-beverage',
];

const CATEGORY_NAMES: Record<string, string> = {
  'agriculture': 'Agriculture & Farming',
  'construction': 'Construction & Real Estate',
  'it-software': 'IT & Software Development',
  'healthcare': 'Healthcare & Medical',
  'education': 'Education & Training',
  'textiles': 'Textiles & Garments',
  'manufacturing': 'Manufacturing & Industrial',
  'retail': 'Retail & Shopping',
  'transport': 'Transportation & Logistics',
  'finance': 'Finance & Insurance',
  'food-beverage': 'Food & Beverage',
};

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const name = CATEGORY_NAMES[category] || category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const title = `${name} Businesses & Services in Theni | THENIJOBS`;
  const description = `Find verified ${name.toLowerCase()} businesses, shops, services, and companies in Theni district. View contact details, reviews, and products on THENIJOBS.`;
  const url = `https://thenijobs.com/businesses/${category}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function BusinessCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const catName = CATEGORY_NAMES[category] || category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://thenijobs.com'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Businesses',
        'item': 'https://thenijobs.com/businesses'
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': catName,
        'item': `https://thenijobs.com/businesses/${category}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <BusinessCategoryPageClient category={category} />
    </>
  );
}
