import CompanyProfilePageClient from './CompanyProfilePageClient';
import { getAllCompanySlugsServer, getCompanyBySlugServer } from '@/lib/firebase/firestoreServer';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import { generateCompanySEO, generateCompanySchema, canonicalCompanyUrl } from '@/lib/seo/seoEngine';
import { toJsonLdScript } from '@/lib/seo/jsonLd';
import { slugify } from '@/lib/seo/jobSlug';
import type { Metadata } from 'next';

const STATIC_COMPANY_SLUGS = [
  // TRUST-1: the showcase slugs were removed. A read-only query on 2026-09-05 confirmed none
  // of the 13 existed in Firestore, so they generated pages for companies that do not exist:
  // three rendered invented businesses from sampleCompanies.ts and ten rendered an empty
  // not-found shell, each at three URLs. Real companies come from getAllCompanySlugsServer()
  // below. '_fallback' stays because vercel.json rewrites unknown slugs to it.
  '_fallback',
];

export async function generateStaticParams() {
  const dynamicSlugs = await getAllCompanySlugsServer().catch(() => []);
  const allSlugs = Array.from(new Set([...STATIC_COMPANY_SLUGS, ...dynamicSlugs]));
  return allSlugs.map((slug) => ({ slug }));
}

/**
 * SEO-CRITICAL: Server-side metadata generation using REAL Firebase company data.
 * Google crawlers receive the actual company name, description, category, and logo
 * in the HTML <head>, not a slug-to-title guess.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // For the fallback shell, use generic metadata
  if (slug === '_fallback') {
    return {
      title: 'Company Profile | THENIJOBS',
      description: "View verified company profiles, job openings, reviews, and services on THENIJOBS — Tamil Nadu's leading local job platform.",
      robots: { index: false, follow: true },
    };
  }

  // Fetch real company data from Firebase
  const company = await getCompanyBySlugServer(slug);

  if (company) {
    // Use the centralized SEO engine with real data
    return generateCompanySEO(company);
  }

  // Fallback: company not found in server-side fetch (may resolve client-side)
  const displayName = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    title: `${displayName} — Company Profile, Jobs & Reviews | THENIJOBS`,
    description: `View ${displayName}'s verified company profile on THENIJOBS. See open job vacancies, reviews, products, services, and contact information. Apply for jobs at ${displayName} in Tamil Nadu.`,
    openGraph: {
      title: `${displayName} — Company Profile | THENIJOBS`,
      description: `Explore verified company profile, jobs, and reviews for ${displayName} on THENIJOBS.`,
      type: 'website',
      url: canonicalCompanyUrl(slug),
      siteName: 'THENIJOBS',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} — THENIJOBS`,
      description: `View ${displayName}'s company profile, open jobs, and reviews.`,
    },
    alternates: {
      canonical: canonicalCompanyUrl(slug),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Fetch real company data for server-side structured data
  const company = await getCompanyBySlugServer(slug).catch(() => null);

  const displayName = company?.name || slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Breadcrumb with real company name and correct link to /businesses
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Businesses', url: 'https://thenijobs.com/businesses' },
    ...(company?.category ? [{ name: company.category, url: `https://thenijobs.com/businesses/${slugify(company.category)}` }] : []),
    { name: displayName, url: canonicalCompanyUrl(slug) },
  ]);

  // Organization/LocalBusiness JSON-LD — only for verified companies with real data
  const companySchema = company ? generateCompanySchema(company) : null;

  return (
    <>
      {/* BreadcrumbList JSON-LD — always rendered server-side */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbSchema) }}
      />
      {/* Organization/LocalBusiness JSON-LD — server-side for Google */}
      {companySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: toJsonLdScript(companySchema) }}
        />
      )}
      <CompanyProfilePageClient slug={slug} />
    </>
  );
}
