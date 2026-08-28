import CompanyProfilePageClient from './CompanyProfilePageClient';

// NOTE: With output:'export', generateStaticParams defines which pages get
// pre-rendered at build time. The "_fallback" entry ensures Next.js generates
// a generic /company/[slug] shell page that Firebase Hosting can serve for
// ANY company slug via rewrites. The client component reads the real slug
// from the URL at runtime and loads data from Firestore.
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

export function generateStaticParams() {
  return STATIC_COMPANY_SLUGS.map((slug) => ({ slug }));
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
      url: `https://www.thenijobs.com/company/${slug}`,
      siteName: 'THENIJOBS',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} — THENIJOBS`,
      description: `View ${displayName}'s company profile, open jobs, and reviews.`,
    },
    alternates: {
      canonical: `https://www.thenijobs.com/company/${slug}`,
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
