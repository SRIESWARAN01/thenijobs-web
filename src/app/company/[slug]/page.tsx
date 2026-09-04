import CompanyProfilePageClient from './CompanyProfilePageClient';
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

// SEO: generateMetadata for server-side title/meta on pre-built pages
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // For the fallback shell, use generic metadata
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
    description: `View ${displayName}'s verified company profile on THENIJOBS. See open job vacancies, reviews, products, services, and contact information. Apply for jobs at ${displayName} in Tamil Nadu.`,
    openGraph: {
      title: `${displayName} — Company Profile | THENIJOBS`,
      description: `Explore verified company profile, jobs, and reviews for ${displayName} on THENIJOBS.`,
      type: 'website',
      url: `https://thenijobs.com/company/${slug}`,
      siteName: 'THENIJOBS',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} — THENIJOBS`,
      description: `View ${displayName}'s company profile, open jobs, and reviews.`,
    },
    alternates: {
      canonical: `https://thenijobs.com/company/${slug}`,
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
  return <CompanyProfilePageClient slug={slug} />;
}
