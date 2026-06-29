import { cache } from 'react';
import type { Metadata } from 'next';
import CompanyProfilePageClient from './CompanyProfilePageClient';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { getCompanyBannerUrl, getCompanyPortfolioUrl } from '@/lib/companyPortfolio';

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

    // Fallback 1: Extract possible ID from name-id slug structure (e.g., name-Js5S3mEMVKZz6WkOlonP)
    const lastHyphenIndex = slug.lastIndexOf('-');
    if (lastHyphenIndex !== -1) {
      const possibleId = slug.substring(lastHyphenIndex + 1);
      if (possibleId.length === 20 && /^[a-zA-Z0-9]+$/.test(possibleId)) {
        const docSnap = await getDoc(doc(db, 'companies', possibleId));
        if (docSnap.exists()) {
          return docSnap.data();
        }
      }
    }

    // Fallback 2: Try fetching by document ID directly
    const docSnap = await getDoc(doc(db, 'companies', slug));
    if (docSnap.exists()) {
      return docSnap.data();
    }

    const aliasQuery = query(
      collection(db, 'companies'),
      where('aliases', 'array-contains', slug),
      limit(1)
    );
    const aliasSnap = await getDocs(aliasQuery);
    if (!aliasSnap.empty) {
      return aliasSnap.docs[0].data();
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
  const canonicalUrl = getCompanyPortfolioUrl({ ...companyData, slug });
  const bannerUrl = getCompanyBannerUrl(companyData);
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
  } else if (activePlan === 'premium') {
    // Premium: Full SEO Optimization (custom title/description, full OpenGraph & Twitter tags)
    const title = companyData.customMetaTitle || companyData.seoTitle || name;
    const description = companyData.customMetaDescription || companyData.seoDescription || defaultDescription;
    const keywords = companyData.seoKeywords || undefined;
    const logoUrl = companyData.logoUrl || undefined;
    const ogTitleVal = companyData.ogTitle || `${title} — THENIJOBS Premium Partner`;
    const ogDescVal = companyData.ogDescription || description;
    const ogImageVal = companyData.socialShareImage || bannerUrl || logoUrl;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: ogTitleVal,
        description: ogDescVal,
        type: 'website',
        url: canonicalUrl,
        ...(ogImageVal ? { images: [{ url: ogImageVal, alt: `${name} logo` }] } : {}),
      },
      twitter: {
        card: 'summary',
        title: ogTitleVal,
        description: ogDescVal,
        ...(ogImageVal ? { images: [ogImageVal] } : {}),
      },
    };
  } else {
    // Enterprise: Ultra Premium SEO Optimization & Structured Data
    const title = companyData.customMetaTitle || companyData.seoTitle || name;
    const description = companyData.customMetaDescription || companyData.seoDescription || defaultDescription;
    const keywords = companyData.seoKeywords || undefined;
    const logoUrl = companyData.logoUrl || undefined;
    const ogTitleVal = companyData.ogTitle || `${title} — THENIJOBS Enterprise VIP Partner`;
    const ogDescVal = companyData.ogDescription || description;
    const ogImageVal = companyData.socialShareImage || bannerUrl || logoUrl;
    const canonical = companyData.canonicalUrl || canonicalUrl;

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      openGraph: {
        title: ogTitleVal,
        description: ogDescVal,
        type: 'website',
        url: canonicalUrl,
        ...(ogImageVal ? { images: [{ url: ogImageVal, alt: `${name} logo` }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitleVal,
        description: ogDescVal,
        ...(ogImageVal ? { images: [ogImageVal] } : {}),
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

  // Gate rich Schema markup to Standard (basic), Premium and Enterprise tiers
  const showSchema = activePlan === 'basic' || activePlan === 'premium' || activePlan === 'enterprise';

  const jsonLdList = (companyData && showSchema) ? [
    {
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
    },
    ...(activePlan === 'enterprise' ? [{
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': companyData.name,
      'description': companyData.description || 'Verified Enterprise Organization in Theni',
      'logo': companyData.logoUrl || undefined,
      'url': getCompanyPortfolioUrl({ ...companyData, slug }),
      'sameAs': [
        companyData.website || undefined,
        companyData.facebook || undefined,
        companyData.instagram || undefined,
        companyData.linkedin || undefined,
      ].filter(Boolean)
    }] : [])
  ] : null;

  return (
    <>
      {jsonLdList && jsonLdList.map((ld, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <CompanyProfilePageClient slug={slug} />
    </>
  );
}
