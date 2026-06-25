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
  const defaultDescription = companyData.description
    ? String(companyData.description).replace(/\s+/g, ' ').slice(0, 160)
    : `${name} — a verified business in ${companyData.district || 'Theni'} district. View profile, services, and reviews on THENIJOBS.`;

  // Parse plan and expiry status
  const rawPlan = companyData.subscriptionPlan || (companyData.isPremium ? 'premium' : 'free');
  
  const toDateLocal = (value?: any) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object') {
      if (typeof value.toDate === 'function') return value.toDate();
      if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    }
    const d = new Date(String(value));
    return isNaN(d.getTime()) ? null : d;
  };

  const isExpired = (() => {
    if (companyData.subscriptionEndsAt) {
      const endsAt = toDateLocal(companyData.subscriptionEndsAt);
      if (endsAt && endsAt < new Date()) {
        return true;
      }
    }
    return false;
  })();

  const activePlan = isExpired ? 'free' : rawPlan;

  // Plan based SEO configuration
  if (activePlan === 'free') {
    // Free: standard basic SEO, no custom meta titles/descriptions
    return {
      title: name,
      description: defaultDescription,
    };
  } else if (activePlan === 'basic') {
    // Standard (basic): Enhanced SEO (custom seoTitle / seoDescription if available)
    const title = companyData.customMetaTitle || companyData.seoTitle || name;
    const description = companyData.customMetaDescription || companyData.seoDescription || defaultDescription;
    return {
      title,
      description,
    };
  } else {
    // Premium: Full SEO Optimization (custom title/description, full OpenGraph & Twitter tags)
    const title = companyData.customMetaTitle || companyData.seoTitle || name;
    const description = companyData.customMetaDescription || companyData.seoDescription || defaultDescription;
    const logoUrl = companyData.logoUrl || undefined;

    return {
      title,
      description,
      openGraph: {
        title: `${title} — THENIJOBS Premium Partner`,
        description,
        type: 'website',
        url: `https://thenijobs.com/company/${slug}`,
        ...(logoUrl ? { images: [{ url: logoUrl, width: 256, height: 256, alt: `${name} logo` }] } : {}),
      },
      twitter: {
        card: 'summary',
        title: `${title} — THENIJOBS Premium Partner`,
        description,
        ...(logoUrl ? { images: [logoUrl] } : {}),
      },
    };
  }
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

  const toDateLocal = (value?: any) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object') {
      if (typeof value.toDate === 'function') return value.toDate();
      if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    }
    const d = new Date(String(value));
    return isNaN(d.getTime()) ? null : d;
  };

  const activePlan = (() => {
    if (!companyData) return 'free';
    const rawPlan = companyData.subscriptionPlan || (companyData.isPremium ? 'premium' : 'free');
    if (companyData.subscriptionEndsAt) {
      const endsAt = toDateLocal(companyData.subscriptionEndsAt);
      if (endsAt && endsAt < new Date()) {
        return 'free'; // Expired
      }
    }
    return rawPlan;
  })();

  // Gate rich Schema markup (LocalBusiness) to Standard (basic) and Premium tiers only
  const showSchema = activePlan === 'basic' || activePlan === 'premium';

  const jsonLd = (companyData && showSchema) ? {
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
