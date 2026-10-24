import { notFound } from 'next/navigation';
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

  // Return non-indexed 404 metadata for missing companies
  return {
    title: 'Company Not Found | THENIJOBS',
    description: 'The requested company profile was not found on THENIJOBS.',
    robots: {
      index: false,
      follow: false,
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

  if (!company) {
    if (slug === '_fallback') {
      return <CompanyProfilePageClient slug={slug} />;
    }
    notFound();
  }

  const displayName = company.name || slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  // Breadcrumb with real company name and correct link to /businesses
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.thenijobs.com' },
    { name: 'Businesses', url: 'https://www.thenijobs.com/businesses' },
    ...(company?.category ? [{ name: company.category, url: `https://www.thenijobs.com/businesses/${slugify(company.category)}` }] : []),
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
