import CompanyProfilePageClient from '@/app/company/[slug]/CompanyProfilePageClient';
import { getAllCompanySlugsServer } from '@/lib/firebase/firestoreServer';

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === '_fallback') {
    return {
      title: 'Company Profile | THENIJOBS',
      description: "View verified company profiles, job openings, reviews, and services on THENIJOBS — Tamil Nadu's leading local job platform.",
    };
  }

  const displayName = slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    title: `${displayName} — Company Profile, Jobs & Reviews | THENIJOBS`,
    description: `View ${displayName}'s verified company profile on THENIJOBS.`,
    alternates: {
      canonical: `https://thenijobs.com/company/${slug}`,
    },
  };
}

export default async function CompaniesSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CompanyProfilePageClient slug={slug} />;
}
