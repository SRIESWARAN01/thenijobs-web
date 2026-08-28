import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import JobDetailPageClient from './JobDetailPageClient';
import { getJobByIdServer, getCompanyByIdServer } from '@/lib/firebase/firestoreServer';
import { generateJobPostingSchema, generateBreadcrumbSchema } from '@/lib/seo/jobSchema';
import { isJobExpired, formatSalaryDisplay } from '@/lib/seo/expiredJobUtils';

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { id: '_fallback' },
    { id: 'demo' },
  ];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server-side metadata generation with actual job data.
 * Google receives the real job title, company, salary, and location in the HTML <head>.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  if (id === '_fallback') {
    return {
      title: 'Job Vacancy in Theni | THENIJOBS',
      description: 'Explore verified job opportunities in Theni and surrounding districts on THENIJOBS.',
    };
  }

  const job = await getJobByIdServer(id);

  // Fallback metadata if job not found
  if (!job) {
    return {
      title: 'Job Opportunities | THENIJOBS',
      description: 'Find top job openings across Theni and Tamil Nadu on THENIJOBS.',
      robots: { index: false, follow: true },
    };
  }

  const canonicalUrl = `https://thenijobs.com/jobs/${id}`;
  const salary = formatSalaryDisplay(job.salaryMin, job.salaryMax);
  const locationText = `${job.district || job.location}, ${job.state || 'Tamil Nadu'}`;
  const pageTitle = `${job.title} in ${job.district || job.location} | ${job.companyName} | THENIJOBS`;
  const pageDescription = `Apply for ${job.title} at ${job.companyName} in ${locationText}. ${salary !== 'Salary Negotiable' ? `Salary: ${salary}.` : ''} View requirements, responsibilities, and apply directly on THENIJOBS.`;

  // Check expiry for noindex
  const expiry = isJobExpired(job);

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      `${job.title} in ${job.district}`,
      `${job.companyName} jobs`,
      `Jobs in ${job.district}`,
      `${job.district} job vacancy`,
      `${job.category || ''} jobs in ${job.district}`.trim(),
      'THENIJOBS',
    ].filter(Boolean),
    alternates: {
      canonical: canonicalUrl,
    },
    // Don't index expired jobs
    robots: expiry.isExpired ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: `${job.title} in ${job.district || job.location} | ${job.companyName}`,
      description: pageDescription,
      url: canonicalUrl,
      type: 'website',
      locale: 'en_IN',
      siteName: 'THENIJOBS',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: `${job.title} - THENIJOBS` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${job.title} | ${job.companyName} | THENIJOBS`,
      description: pageDescription,
      images: ['/og-image.jpg'],
    },
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJobByIdServer(id);

  // If job doesn't exist at build time, render client component for runtime resolution
  if (!job) {
    return <JobDetailPageClient id={id} />;
  }


  // Fetch company data for enhanced schema
  let companyData = null;
  if (job.companyId) {
    companyData = await getCompanyByIdServer(job.companyId);
  }

  // Check if job is expired
  const expiry = isJobExpired(job);

  // Generate breadcrumb schema (server-side)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Jobs', url: 'https://thenijobs.com/jobs' },
    { name: `Jobs in ${job.district || 'Theni'}`, url: `https://thenijobs.com/jobs-in-${(job.district || 'theni').toLowerCase().replace(/\s+/g, '-')}` },
    { name: job.title, url: `https://thenijobs.com/jobs/${id}` },
  ]);

  // Generate JobPosting JSON-LD (server-side) — ONLY for active, non-expired jobs
  let jobPostingSchema = null;
  if (!expiry.isExpired) {
    jobPostingSchema = generateJobPostingSchema({
      id: job.id,
      title: job.title,
      description: job.description || `${job.title} at ${job.companyName}`,
      companyName: job.companyName,
      companyWebsite: companyData?.website || job.companyWebsite,
      companyLogo: companyData?.logoUrl || job.companyLogo,
      district: job.district,
      location: job.location,
      state: job.state,
      streetAddress: job.streetAddress,
      postalCode: job.postalCode,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      jobType: job.jobType,
      postedDate: job.postedDate || job.createdAt,
      expiryDate: job.expiryDate,
      isRemote: job.isRemote,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      skills: job.skills,
      benefits: job.benefits,
      experience: job.experience,
      education: job.education,
      category: job.category,
      directApply: true,
    });
  }

  // Serialize initial job data for client component hydration
  const initialJobData = {
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    companyId: job.companyId,
    location: job.location,
    district: job.district,
    state: job.state,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    jobType: job.jobType,
    openings: job.openings,
    isUrgent: job.isUrgent,
    isVerified: job.isVerified,
    whatsapp: job.whatsapp,
    phone: job.phone,
    experience: job.experience || 'Not specified',
    education: job.education || 'Not specified',
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    skills: job.skills,
    benefits: job.benefits,
    posted: job.postedDate || '',
    deadline: job.expiryDate || '',
    logo: job.companyLogo || '',
    isExpired: expiry.isExpired,
    expiredMessage: expiry.message,
  };

  return (
    <>
      {/* BreadcrumbList JSON-LD — always rendered server-side */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* JobPosting JSON-LD — only for active jobs, rendered server-side for Google */}
      {jobPostingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }}
        />
      )}
      <JobDetailPageClient id={id} initialJob={initialJobData} />
    </>
  );
}
