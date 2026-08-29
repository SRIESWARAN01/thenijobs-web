import CompanyProfilePageClient from '@/app/company/[slug]/CompanyProfilePageClient';
import { getAllCompanySlugsServer } from '@/lib/firebase/firestoreServer';

const STATIC_COMPANY_SLUGS = [
  '_fallback',
  'digital-theni-solutions',
  'arasu-pandi-farm-services',
  'greenfield-agro-exports',
  'quickdeliver-logistics',
  'theni-textiles',
  'thenijobs-demo-company',
  'agrimorein',
  'agrimart-farm-solutions-theni',
  'tata-consultancy-it-services-theni',
  'royal-grand-supermarket-cumbum',
  'sri-meenakshi-textiles-garments',
  'city-care-multi-speciality-hospital',
  'gk-clinic-chinnamanur',
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
