import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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

  const isSuspendedOrDeleted = !jobData || 
    jobData.isActive === false || 
    jobData.status === 'suspended' || 
    jobData.status === 'deleted' || 
    jobData.deleted === true;

  if (isSuspendedOrDeleted) {
    return {
      title: 'Job Vacancy Not Available | THENIJOBS',
      description: 'This job vacancy is currently not available on THENIJOBS.',
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
        }
      }
    };
  }

  const title = jobData.title
    ? `${jobData.title} Jobs in ${jobData.location || jobData.district || 'Theni'}${jobData.companyName ? ` at ${jobData.companyName}` : ''} | THENIJOBS`
    : 'Job Details';
  const description = jobData.description
    ? String(jobData.description).replace(/\s+/g, ' ').slice(0, 160)
    : `View this job posting${jobData.companyName ? ` from ${jobData.companyName}` : ''} on THENIJOBS, Theni's local job portal.`;
  const logoUrl = jobData.companyLogoUrl || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `https://thenijobs.com/jobs/${id}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
    },
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
      limit(200)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
    }));
  } catch (err) {
    console.error('Failed to generate static params for jobs:', err);
    return [];
  }
}

/**
 * Postal code lookup for known localities in the Theni region.
 * Used as fallbacks when the job document doesn't store a postal code.
 */
const LOCATION_POSTAL_CODES: Record<string, string> = {
  'Theni':            '625531',
  'Bodinayakanur':    '625513',
  'Periyakulam':      '625601',
  'Cumbum':           '625516',
  'Uthamapalayam':    '625533',
  'Andipatti':        '625512',
  'Chinnamanur':      '625515',
  'Bodi':             '625513',
  'Kambam':           '625516',
  'Madurai':          '625001',
  'Dindigul':         '624001',
  'Coimbatore':       '641001',
};

/** Default fallback when no location match is found */
const DEFAULT_POSTAL_CODE = '625531';
const DEFAULT_STREET_ADDRESS = 'Main Road';

/**
 * Resolve a PostalAddress object from job data with full Schema.org
 * recommended fields. Prefers dynamic DB values, falls back to the
 * location-based lookup map, then to configurable defaults.
 */
function resolvePostalAddress(jobData: Record<string, any>) {
  const locality  = jobData.location || jobData.district || 'Theni';
  const region    = jobData.state || 'Tamil Nadu';

  // streetAddress: prefer DB → company address → configurable default
  const streetAddress =
    jobData.streetAddress ||
    jobData.address ||
    jobData.companyAddress ||
    `${DEFAULT_STREET_ADDRESS}, ${locality}`;

  // postalCode: prefer DB → lookup map → default
  const postalCode =
    jobData.postalCode ||
    jobData.pinCode ||
    jobData.pincode ||
    jobData.companyPinCode ||
    LOCATION_POSTAL_CODES[locality] ||
    DEFAULT_POSTAL_CODE;

  return {
    '@type': 'PostalAddress' as const,
    'streetAddress': streetAddress,
    'addressLocality': locality,
    'addressRegion': region,
    'postalCode': postalCode,
    'addressCountry': 'IN',
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const jobData = await getJobData(id);

  const isSuspendedOrDeleted = !jobData || 
    jobData.isActive === false || 
    jobData.status === 'suspended' || 
    jobData.status === 'deleted' || 
    jobData.deleted === true;

  if (isSuspendedOrDeleted) {
    notFound();
  }

  // Build the shared PostalAddress once — used by JobPosting & LocalBusiness
  const postalAddress = jobData ? resolvePostalAddress(jobData) : null;

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
      'address': postalAddress,
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

  const orgLd = jobData ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': jobData.companyName || 'Verified Employer',
    'logo': jobData.companyLogoUrl || undefined,
    'url': jobData.companySlug ? `https://thenijobs.com/company/${jobData.companySlug}` : undefined
  } : null;

  const businessLd = jobData ? {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': jobData.companyName || 'Verified Employer',
    'image': jobData.companyLogoUrl || undefined,
    'telephone': jobData.phone || undefined,
    'email': jobData.email || undefined,
    'address': postalAddress,
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {orgLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
      )}
      {businessLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }}
        />
      )}
      <JobDetailPageClient id={id} />
    </>
  );
}
