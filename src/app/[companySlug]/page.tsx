import { notFound } from 'next/navigation';
import CompanyLandingPageClient from './CompanyLandingPageClient';
import { getAllCompanySlugsServer, getCompanyBySlugServer } from '@/lib/firebase/firestoreServer';

// Static fallback slugs for Next.js build-time export.
const STATIC_LANDING_SLUGS = [
  // TRUST-1: the showcase slugs were removed. A read-only query on 2026-09-05 confirmed none
  // of the 13 existed in Firestore, so they generated pages for companies that do not exist:
  // three rendered invented businesses from sampleCompanies.ts and ten rendered an empty
  // not-found shell, each at three URLs. Real companies come from getAllCompanySlugsServer()
  // below. '_fallback' stays because vercel.json rewrites unknown slugs to it.
  '_fallback',
];

export async function generateStaticParams() {
  const dynamicSlugs = await getAllCompanySlugsServer().catch(() => []);
  const allSlugs = Array.from(new Set([...STATIC_LANDING_SLUGS, ...dynamicSlugs]));
  return allSlugs.map((companySlug) => ({ companySlug }));
}

// Dynamic SEO metadata generator for company landing websites
export async function generateMetadata({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  if (companySlug === '_fallback') {
    return {
      title: 'Company Official Website | THENIJOBS',
      description: 'Official verified company landing websites and careers on THENIJOBS.',
      robots: { index: false, follow: false },
    };
  }

  const company = await getCompanyBySlugServer(companySlug).catch(() => null);
  if (!company) {
    return {
      title: 'Company Not Found | THENIJOBS',
      description: 'The requested official company website does not exist on THENIJOBS.',
      robots: { index: false, follow: false },
    };
  }

  const displayName = company.name || companySlug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  const pageTitle = `${displayName} — Official Website, Services & Careers | THENIJOBS`;
  const pageDesc = company.description
    ? company.description.substring(0, 155)
    : `Welcome to the official website of ${displayName}. Discover services, products, contact details, and apply for open career opportunities in Tamil Nadu on THENIJOBS.`;

  return {
    title: pageTitle,
    description: pageDesc,
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      type: 'website',
      url: `https://www.thenijobs.com/${companySlug}`,
      siteName: 'THENIJOBS',
      images: company.logoUrl ? [{ url: company.logoUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: company.logoUrl ? [company.logoUrl] : undefined,
    },
    alternates: {
      canonical: `https://www.thenijobs.com/${companySlug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CompanyLandingPage({
  params,
}: {
  params: Promise<{ companySlug: string }>;
}) {
  const { companySlug } = await params;

  if (companySlug !== '_fallback') {
    const company = await getCompanyBySlugServer(companySlug).catch(() => null);
    if (!company) {
      notFound();
    }
  }

  return <CompanyLandingPageClient slug={companySlug} />;
}

