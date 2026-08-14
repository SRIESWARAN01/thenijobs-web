import type { Metadata } from 'next';
import { LOCATIONS_DATA, CATEGORIES_LIST } from '@/components/seo/locationData';

export function createLocationMetadata(locationSlug: string): Metadata {
  const loc = LOCATIONS_DATA[locationSlug] || {
    name: locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1),
  };
  const name = loc.name;
  const canonicalUrl = `https://thenijobs.com/jobs-in-${locationSlug}`;

  return {
    title: `Jobs in ${name} | Latest ${name} Job Vacancies & Openings | THENIJOBS`,
    description: `Find verified private, fresher, and full-time jobs in ${name}, Tamil Nadu. Search top companies, salary details, and apply directly on THENIJOBS.`,
    keywords: [
      `Jobs in ${name}`,
      `${name} jobs`,
      `${name} job vacancy`,
      `${name} jobs for freshers`,
      `Private jobs in ${name}`,
      `Latest jobs in ${name}`,
      `Theni jobs`,
      `Tamil Nadu jobs`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Jobs in ${name} | Latest Job Vacancies | THENIJOBS`,
      description: `Explore top career opportunities, fresher openings, and private vacancies in ${name}, Tamil Nadu.`,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_IN',
      siteName: 'THENIJOBS',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `Jobs in ${name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Jobs in ${name} | Latest Job Vacancies | THENIJOBS`,
      description: `Explore top career opportunities, fresher openings, and private vacancies in ${name}, Tamil Nadu.`,
      images: ['/og-image.jpg'],
    },
  };
}

export function createCategoryMetadata(locationSlug: string, categorySlug: string): Metadata {
  const loc = LOCATIONS_DATA[locationSlug] || {
    name: locationSlug.charAt(0).toUpperCase() + locationSlug.slice(1),
  };
  const catObj = CATEGORIES_LIST.find(c => c.slug === categorySlug);
  const catName = catObj?.name || (categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
  const locName = loc.name;
  const canonicalUrl = `https://thenijobs.com/jobs-in-${locationSlug}/${categorySlug}`;

  return {
    title: `${catName} Jobs in ${locName} | Vacancies & Openings | THENIJOBS`,
    description: `Find the best ${catName.toLowerCase()} jobs in ${locName}, Tamil Nadu. Search entry-level and experienced openings with direct employer applications on THENIJOBS.`,
    keywords: [
      `${catName} Jobs in ${locName}`,
      `${locName} ${catName.toLowerCase()} vacancy`,
      `Jobs in ${locName}`,
      `${locName} jobs`,
      `Tamil Nadu jobs`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${catName} Jobs in ${locName} | THENIJOBS`,
      description: `Search verified ${catName.toLowerCase()} openings in ${locName}.`,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_IN',
      siteName: 'THENIJOBS',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${catName} Jobs in ${locName}` }],
    },
  };
}

export function getCategoryStaticParams() {
  return CATEGORIES_LIST.map(c => ({ category: c.slug }));
}
