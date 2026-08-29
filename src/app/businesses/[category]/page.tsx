import type { Metadata } from 'next';
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

function formatCategoryName(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;

  if (category === '_fallback' || category === 'all') {
    return {
      title: 'All Businesses & Companies | THENIJOBS',
      description:
        'Browse verified businesses, companies, and service providers across Theni and Tamil Nadu on THENIJOBS.',
      alternates: { canonical: 'https://thenijobs.com/businesses/all' },
    };
  }

  const displayName = formatCategoryName(category);
  const canonicalUrl = `https://thenijobs.com/businesses/${category}`;

  return {
    title: `${displayName} Businesses in Theni | Companies & Services | THENIJOBS`,
    description: `Find verified ${displayName.toLowerCase()} businesses, companies, and service providers in Theni and Tamil Nadu. View profiles, services, products, and contact details on THENIJOBS.`,
    keywords: [
      `${displayName} businesses Theni`,
      `${displayName} companies Tamil Nadu`,
      `${displayName} services Theni`,
      `Theni business directory`,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${displayName} Businesses | THENIJOBS`,
      description: `Explore ${displayName.toLowerCase()} companies and services in Theni.`,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_IN',
      siteName: 'THENIJOBS',
    },
    robots: { index: true, follow: true },
  };
}

export default async function BusinessCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <BusinessCategoryPageClient category={category} />;
}
