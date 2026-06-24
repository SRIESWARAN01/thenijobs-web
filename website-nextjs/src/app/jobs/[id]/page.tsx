import { cache } from 'react';
import type { Metadata } from 'next';
import JobDetailPageClient from './JobDetailPageClient';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Memoize the Firestore fetch so generateMetadata and the page share it
const getJobData = cache(async (id: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'jobs', id));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error('Failed to fetch job data:', err);
  }
  return null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const jobData = await getJobData(id);

  if (!jobData) {
    return {
      title: 'Job Not Found',
      description: 'This job posting may have been removed or is no longer available on THENIJOBS.',
    };
  }

  const title = jobData.title
    ? `${jobData.title}${jobData.companyName ? ` at ${jobData.companyName}` : ''}`
    : 'Job Details';
  const description = jobData.description
    ? String(jobData.description).replace(/\s+/g, ' ').slice(0, 160)
    : `View this job posting${jobData.companyName ? ` from ${jobData.companyName}` : ''} on THENIJOBS, Theni's local job portal.`;
  const logoUrl = jobData.companyLogoUrl || undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${title} — THENIJOBS`,
      description,
      type: 'website',
      url: `https://thenijobs.com/jobs/${id}`,
      ...(logoUrl ? { images: [{ url: logoUrl, width: 256, height: 256, alt: jobData.companyName || 'Company Logo' }] } : {}),
    },
    twitter: {
      card: 'summary',
      title: `${title} — THENIJOBS`,
      description,
      ...(logoUrl ? { images: [logoUrl] } : {}),
    },
  };
}

export async function generateStaticParams() {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('isActive', '==', true),
      limit(100)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [{ id: 'placeholder' }];
    }
    return snapshot.docs.map((d) => ({
      id: d.id,
    }));
  } catch (err) {
    console.error('Failed to generate static params for jobs:', err);
    return [{ id: 'placeholder' }];
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const jobData = await getJobData(id);

  const jsonLd = jobData ? {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    'title': jobData.title,
    'description': jobData.description,
    'datePosted': jobData.postedAt?.toDate?.() ? jobData.postedAt.toDate().toISOString() : (jobData.createdAt?.toDate?.() ? jobData.createdAt.toDate().toISOString() : new Date().toISOString()),
    'validThrough': jobData.expiresAt?.toDate?.() ? jobData.expiresAt.toDate().toISOString() : undefined,
    'employmentType': jobData.jobType === 'full_time' ? 'FULL_TIME' : jobData.jobType === 'part_time' ? 'PART_TIME' : jobData.jobType === 'internship' ? 'INTERN' : jobData.jobType === 'contract' ? 'CONTRACTOR' : 'OTHER',
    'hiringOrganization': {
      '@type': 'Organization',
      'name': jobData.companyName || 'Verified Employer',
      'logo': jobData.companyLogoUrl || undefined,
    },
    'jobLocation': {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': jobData.location || jobData.district || 'Theni',
        'addressRegion': 'Tamil Nadu',
        'addressCountry': 'IN',
      }
    },
    'baseSalary': jobData.salaryMin ? {
      '@type': 'MonetaryAmount',
      'currency': 'INR',
      'value': {
        '@type': 'QuantitativeValue',
        'minValue': jobData.salaryMin,
        'maxValue': jobData.salaryMax || jobData.salaryMin,
        'unitText': 'MONTH'
      }
    } : undefined
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobDetailPageClient id={id} />
    </>
  );
}
