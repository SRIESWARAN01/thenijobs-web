import { cache } from 'react';
import type { Metadata } from 'next';
import CompanyProfilePageClient from './CompanyProfilePageClient';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Memoize the Firestore fetch so generateMetadata and the page share it
const getCompanyBySlug = cache(async (slug: string) => {
  try {
    const q = query(
      collection(db, 'companies'),
      where('slug', '==', slug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data();
    }
  } catch (err) {
    console.error('Failed to fetch company data:', err);
  }
  return null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const companyData = await getCompanyBySlug(slug);

  if (!companyData) {
    return {
      title: 'Business Not Found',
      description: 'This business listing may have been removed or is no longer available on THENIJOBS.',
    };
  }

  const name = companyData.name || companyData.businessName || companyData.companyName || 'Business';
  const description = companyData.description
    ? String(companyData.description).replace(/\s+/g, ' ').slice(0, 160)
    : `${name} — a verified business in ${companyData.district || 'Theni'} district. View profile, services, and reviews on THENIJOBS.`;
  const logoUrl = companyData.logoUrl || undefined;

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} — THENIJOBS`,
      description,
      type: 'website',
      url: `https://thenijobs.com/company/${slug}`,
      ...(logoUrl ? { images: [{ url: logoUrl, width: 256, height: 256, alt: `${name} logo` }] } : {}),
    },
    twitter: {
      card: 'summary',
      title: `${name} — THENIJOBS`,
      description,
      ...(logoUrl ? { images: [logoUrl] } : {}),
    },
  };
}

export async function generateStaticParams() {
  try {
    const q = query(
      collection(db, 'companies'),
      where('verificationStatus', '==', 'verified'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    const paths = snapshot.docs
      .map((d) => d.data())
      .filter((company) => !!company.slug)
      .map((company) => ({
        slug: String(company.slug),
      }));
    if (paths.length === 0) {
      return [{ slug: 'placeholder' }];
    }
    return paths;
  } catch (err) {
    console.error('Failed to generate static params for companies:', err);
    return [{ slug: 'placeholder' }];
  }
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const companyData = await getCompanyBySlug(slug);

  const jsonLd = companyData ? {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': companyData.name,
    'description': companyData.description || 'Local business in Theni',
    'image': companyData.logoUrl || undefined,
    'telephone': companyData.phone || undefined,
    'email': companyData.email || undefined,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': companyData.address || undefined,
      'addressLocality': companyData.district || 'Theni',
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
      <CompanyProfilePageClient slug={slug} />
    </>
  );
}
