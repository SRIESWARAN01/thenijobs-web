'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import CompanyProfileClient from './CompanyProfileClient';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Building2, ArrowLeft } from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { slugifyCompany, resolveCompanyBySlug } from '@/lib/companySlug';

export default function CompanyProfilePageClient({ slug: slugProp }: { slug: string }) {
  // CRITICAL: Read slug from the actual URL, not from the server prop.
  // When Firebase serves the _fallback shell for unknown slugs, the prop
  // will be '_fallback' but the URL will contain the real company slug.
  const pathname = usePathname();
  const urlSlug = pathname?.split('/').filter(Boolean).pop() || '';
  const slug = (urlSlug && urlSlug !== '_fallback') ? urlSlug : slugProp;

  const [company, setCompany] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!slug || slug === '_fallback') return;

    async function loadCompanyData() {
      try {
        setLoading(true);
        setNotFoundState(false);

        // 1. Resolve the slug to a company.
        // PERF-2: this was six lookups in sequence, each waiting for the previous to come back
        // empty. They share no data, so resolveCompanyBySlug runs them together and returns the
        // first hit in the same priority order.
        const docData: any = await resolveCompanyBySlug(slug, {
          includeNameMatch: true,
          ownerUid: auth.currentUser?.uid ?? null,
        });

        if (!docData) {
          // TRUST-1: never substitute an invented company here.
          setNotFoundState(true);
          setLoading(false);
          return;
        }


        // Verification status tracking
        if (docData.verificationStatus !== 'verified' && docData.isVerified !== true) {
          console.info('Rendering unverified or pending company profile in preview mode:', slug);
        }

        // A company doc without its own `slug` field must never leak its raw
        // Firestore document ID into share links, ID cards, or canonical URLs —
        // derive a readable one from the name instead.
        if (!docData.slug) {
          docData.slug = slugifyCompany(docData.name || docData.id);
        }

        setCompany(docData);
        await loadJobsAndReviews(docData.id);
      } catch (err) {
        // TRUST-1: a failed query used to fall back to invented data, so a transient
        // Firestore error on a REAL company could replace it with a fabricated one. A
        // failure is now reported as a failure.
        console.error('Error loading company:', err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }

    async function loadJobsAndReviews(companyId: string) {
      try {
        // 2. Fetch company's active+approved jobs only
        const qJobs = query(
          collection(db, 'jobs'),
          where('companyId', '==', companyId),
          where('isActive', '==', true),
          where('status', '==', 'active')
        );
        const snapJobs = await getDocs(qJobs);
        const jobsData = snapJobs.docs.map(doc => {
          const d = doc.data();
          const salaryStr = d.salaryMin && d.salaryMax
            ? `₹${Number(d.salaryMin).toLocaleString('en-IN')} - ₹${Number(d.salaryMax).toLocaleString('en-IN')}`
            : 'Salary Negotiable';
          const typeStr = d.jobType
            ? d.jobType.replace('_', ' ').split(' ').map((w: string) => w[0].toUpperCase() + w.substring(1)).join(' ')
            : 'Full Time';
          return {
            id: doc.id,
            title: d.title || '',
            type: typeStr,
            salary: salaryStr,
            openings: d.openings ? Number(d.openings) : 1,
            posted: d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently'
          };
        });
        setJobs(jobsData);

        // 3. Fetch reviews
        const qReviews = query(
          collection(db, 'reviews'),
          where('companyId', '==', companyId),
          where('status', '==', 'approved')
        );
        const snapReviews = await getDocs(qReviews);
        const reviewsData = snapReviews.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            companyId: d.companyId,
            name: d.userName || 'Anonymous',
            rating: d.rating || 5,
            title: d.title || 'Review',
            content: d.comment || '',
            date: d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently',
            type: d.type || 'customer',
            verified: d.status === 'approved'
          };
        });
        setReviews(reviewsData);
      } catch (err) {
        console.error('Error fetching jobs/reviews:', err);
      }
    }

    loadCompanyData();
  }, [slug]);

  // --- Client-side SEO Enhancement ---
  useEffect(() => {
    if (!company) return;

    const companyName = company.name || '';
    const category = company.category || company.businessType || '';
    const district = company.district || '';
    const description = company.description || company.shortDescription || '';
    const phone = company.phone || company.contactNumber || '';
    const website = company.website || '';
    const address = company.address || '';
    const rating = company.rating || 5;
    const reviewCount = reviews.length;
    const canonicalUrl = `https://www.thenijobs.com/company/${slug}`;
    const logoUrl = company.logoUrl || company.logo || '';

    // 1. Document title
    const title = company.metaTitle
      || `${companyName}${category ? ` - ${category}` : ''}${district ? ` in ${district}` : ''} | THENIJOBS`;
    document.title = title;

    // 2. Helper to set/create a meta tag
    const setMeta = (name: string, content: string, property?: boolean) => {
      if (!content) return;
      const attr = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Helper to set/create a link tag
    const setLink = (rel: string, href: string) => {
      if (!href) return;
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    const metaDesc = description.substring(0, 160) || `${companyName} — Verified business in ${district || 'Theni'}, Tamil Nadu. View jobs, reviews & services on THENIJOBS.`;

    // Core meta
    setMeta('description', metaDesc);
    setMeta('robots', 'index, follow');

    // Canonical & Favicon Icon
    setLink('canonical', canonicalUrl);
    if (logoUrl) {
      setLink('icon', logoUrl);
      setLink('apple-touch-icon', logoUrl);
    }

    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', metaDesc, true);
    setMeta('og:type', 'business.business', true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:site_name', 'THENIJOBS', true);
    if (logoUrl) setMeta('og:image', logoUrl, true);

    // Twitter Card
    setMeta('twitter:card', 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', metaDesc);
    if (logoUrl) setMeta('twitter:image', logoUrl);

    // 3. Structured Data (JSON-LD LocalBusiness) — comprehensive schema
    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': canonicalUrl,
      name: companyName,
      description: description || `${companyName} is a verified business in ${district || 'Theni'}, Tamil Nadu.`,
      telephone: phone || undefined,
      email: company.email || undefined,
      url: website || canonicalUrl,
      image: logoUrl || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: address || district || 'Theni',
        addressLocality: district || 'Theni',
        addressRegion: 'Tamil Nadu',
        postalCode: company.pincode || undefined,
        addressCountry: 'IN'
      },
      geo: company.latitude && company.longitude ? {
        '@type': 'GeoCoordinates',
        latitude: company.latitude,
        longitude: company.longitude
      } : undefined,
      openingHoursSpecification: company.workingHours ? {
        '@type': 'OpeningHoursSpecification',
        description: company.workingHours
      } : undefined,
      priceRange: company.priceRange || undefined,
      sameAs: [
        company.facebook, company.instagram, company.linkedin, company.website
      ].filter(Boolean),
    };

    // Add aggregate rating only if reviews exist
    if (reviewCount > 0) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount,
        bestRating: 5,
        worstRating: 1
      };
    }

    // Add founder info
    if (company.founder?.name) {
      jsonLd.founder = {
        '@type': 'Person',
        name: company.founder.name,
        jobTitle: company.founder.designation || 'Founder'
      };
    }

    // Add founding date
    if (company.foundedYear || company.establishedYear || company.since) {
      jsonLd.foundingDate = String(company.foundedYear || company.establishedYear || company.since);
    }

    // Add number of employees
    if (company.employeeCount) {
      jsonLd.numberOfEmployees = {
        '@type': 'QuantitativeValue',
        value: company.employeeCount
      };
    }

    // Clean undefined values
    const cleanJsonLd = JSON.parse(JSON.stringify(jsonLd));

    let scriptTag = document.getElementById('company-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'company-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(cleanJsonLd);

    return () => {
      // Clean up on unmount
      document.getElementById('company-jsonld')?.remove();
      document.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [company, reviews.length, slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-[#111827]">
        <Loader2 size={36} className="text-[#2563EB] animate-spin mb-4" />
        <p className="text-sm text-slate-500">Loading company profile...</p>
      </div>
    );
  }

  if (notFoundState || !company) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] text-[#111827]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5">
            <Building2 size={36} className="text-gray-300" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Not Found</h1>
          <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
            This company profile doesn&apos;t exist yet, or is currently under review by our verification team.
            If you own this business, you can register it on THENIJOBS.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/businesses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors">
              <ArrowLeft size={15} /> Browse Businesses
            </Link>
            <Link href="/company/register" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors">
              Register Your Business
            </Link>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  // Ensure default structure values exist to prevent crashes in the UI
  const processedCompany = {
    ...company,
    posts: company.posts || [],
    services: company.services || [],
    verificationBadges: company.verificationBadges || {
      mobileVerified: false,
      emailVerified: false,
      gstVerified: false,
      businessVerified: false
    },
    products: company.products || [],
    viewCount: company.viewCount || 0,
    enquiryCount: company.enquiryCount || 0,
    followerCount: company.followerCount || 0,
    rating: company.rating || 0,
    reviewCount: reviews.length,
    trustScore: company.trustScore || 0,
    responseTime: company.responseTime || ''
  };

  return <CompanyProfileClient company={processedCompany} jobs={jobs} reviews={reviews} />;
}
