import type { Metadata } from 'next';
import BusinessesPageClient from './BusinessesPageClient';

export const metadata: Metadata = {
  title: 'Local Businesses & Services Directory | THENIJOBS',
  description: 'Browse, search and connect with top verified local businesses, shops, and services in Madurai, Theni, Coimbatore and across Tamil Nadu on THENIJOBS.',
  alternates: {
    canonical: 'https://thenijobs.com/businesses',
  },
  openGraph: {
    title: 'Local Businesses & Services Directory | THENIJOBS',
    description: 'Browse, search and connect with top verified local businesses, shops, and services in Madurai, Theni, Coimbatore and across Tamil Nadu on THENIJOBS.',
    url: 'https://thenijobs.com/businesses',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Local Businesses & Services Directory | THENIJOBS',
    description: 'Browse, search and connect with top verified local businesses, shops, and services in Madurai, Theni, Coimbatore and across Tamil Nadu on THENIJOBS.',
  },
};

export default function BusinessesPage() {
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thenijobs.com' },
      { '@type': 'ListItem', position: 2, name: 'Businesses', item: 'https://thenijobs.com/businesses' },
    ],
  };

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Local Businesses & Services Directory',
    description: 'Browse verified local businesses, shops, and services in Tamil Nadu on THENIJOBS.',
    url: 'https://thenijobs.com/businesses',
    numberOfItems: 11,
    itemListElement: [
      'Agriculture', 'Construction', 'Education', 'Healthcare', 'IT & Software',
      'Textiles', 'Manufacturing', 'Retail', 'Transport', 'Finance', 'Food & Beverage',
    ].map((cat, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: cat,
      url: `https://thenijobs.com/businesses/${cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <BusinessesPageClient />
    </>
  );
}
