import type { Metadata } from 'next';
import JobDetailPageClient from './JobDetailPageClient';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/lib/seo/jobSchema';

export function generateStaticParams() {
  return [
    { id: 'demo' },
  ];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const canonicalUrl = `https://thenijobs.com/jobs/${id}`;

  return {
    title: `Job Vacancy in Theni & Tamil Nadu | THENIJOBS`,
    description: `Apply for the latest job vacancy in Theni and surrounding areas. View salary, requirements, and apply directly on THENIJOBS.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `Job Vacancy in Theni & Tamil Nadu | THENIJOBS`,
      description: `Verified job opening with direct application on THENIJOBS portal.`,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_IN',
      siteName: 'THENIJOBS',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Job Vacancy in Theni & Tamil Nadu | THENIJOBS`,
      description: `Verified job opening with direct application on THENIJOBS portal.`,
      images: ['/og-image.jpg'],
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Generate fallback breadcrumbs schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Jobs', url: 'https://thenijobs.com/jobs' },
    { name: 'Jobs in Theni', url: 'https://thenijobs.com/jobs-in-theni' },
    { name: 'Job Details', url: `https://thenijobs.com/jobs/${id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <JobDetailPageClient id={id} />
    </>
  );
}
