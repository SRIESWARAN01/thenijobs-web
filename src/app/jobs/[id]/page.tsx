import { cache } from 'react';
import type { Metadata } from 'next';
import JobDetailPageClient from './JobDetailPageClient';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { Briefcase } from 'lucide-react';

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

  const isSuspendedOrDeleted = !jobData || 
    jobData.isActive === false || 
    jobData.status === 'suspended' || 
    jobData.status === 'deleted' || 
    jobData.deleted === true;

  if (isSuspendedOrDeleted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070714] px-6 text-center text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 max-w-md backdrop-blur-md shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 mb-4 animate-bounce">
            <Briefcase size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Job listing not available</h1>
          <p className="mt-2 text-sm text-gray-400">
            This job posting has been suspended, filled, or is no longer active.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-xl bg-violet-600 px-6 text-xs font-bold text-white hover:bg-violet-700 transition-all shadow-md active:scale-95"
          >
            Go Back Home
          </a>
        </div>
      </main>
    );
  }

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
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': jobData.location || jobData.district || 'Theni',
      'addressRegion': 'Tamil Nadu',
      'addressCountry': 'IN'
    }
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
