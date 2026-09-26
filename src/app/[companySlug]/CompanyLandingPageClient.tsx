'use client';

import { useState, useEffect } from 'react';
import { usePathname, notFound } from 'next/navigation';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { resolveCompanyBySlug } from '@/lib/companySlug';
import { Loader2, Building2, AlertCircle, ArrowLeft, ShieldAlert, BadgeCheck } from 'lucide-react';
import CompanyLandingWebsite from '@/components/company/CompanyLandingWebsite';
import Header from '@/components/navigation/Header';

const RESERVED_SYSTEM_ROUTES = new Set([
  'about', 'admin', 'api', 'businesses', 'companies', 'company', 'contact', 'cookies',
  'daily-jobs', 'employer', 'forgot-password', 'jobs', 'login', 'marketplace',
  'portfolio', 'pricing', 'privacy', 'profile', 'register', 'register-business',
  'seeker', 'services', 'terms', '_fallback',
  // Static assets that may appear as path segments
  'favicon.ico', 'sitemap.xml', 'robots.txt', 'icon.png', 'apple-icon.png',
  // Next.js internal routes
  '_next', '__nextjs_original-stack-frame',
]);

/** Sanitize strings for safe JSON-LD injection (prevent </script> breakout) */
function sanitizeForJsonLd(str: string | undefined): string {
  if (!str) return '';
  return str.replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--');
}

interface CompanyLandingPageClientProps {
  slug: string;
}

export default function CompanyLandingPageClient({ slug: slugProp }: CompanyLandingPageClientProps) {
  const pathname = usePathname();
  const rawSlug = pathname?.split('/').filter(Boolean)[0] || slugProp;
  const slug = (rawSlug && rawSlug !== '_fallback') ? rawSlug : slugProp;

  const [company, setCompany] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  // If the path is a reserved top-level route or location page, don't execute company lookup
  const isReserved = RESERVED_SYSTEM_ROUTES.has(slug?.toLowerCase()) || slug?.startsWith('jobs-in-');

  useEffect(() => {
    if (!slug || slug === '_fallback' || isReserved) {
      if (isReserved) setLoading(false);
      return;
    }

    async function loadCompanyLanding() {
      try {
        setLoading(true);
        setNotFoundState(false);

        // 1. Resolve the slug to a company.
        // PERF-2: this was five lookups in sequence; resolveCompanyBySlug runs them together and
        // returns the first hit in the same priority order. The name-match branch stays off here,
        // matching this page's previous behaviour.
        const docData: any = await resolveCompanyBySlug(slug, {
          ownerUid: auth.currentUser?.uid ?? null,
        });

        if (!docData) {
          // TRUST-1: never substitute an invented company here.
          setNotFoundState(true);
          setLoading(false);
          return;
        }

        setCompany(docData);
        await loadActiveJobsAndReviews(docData.id);
      } catch (err) {
        // TRUST-1: see the note above — a failed query no longer substitutes invented data.
        console.error('Error fetching company landing page:', err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }

    async function loadActiveJobsAndReviews(companyId: string) {
      try {
        // Fetch active jobs
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
            : 'Salary on Request';
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

        // Fetch approved reviews
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
            name: d.userName || 'Anonymous Client',
            rating: d.rating || 5,
            title: d.title || 'Review',
            content: d.comment || '',
            date: d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString('en-IN') : 'Recently',
          };
        });
        setReviews(reviewsData);
      } catch (err) {
        console.error('Error fetching jobs/reviews for landing:', err);
      }
    }

    loadCompanyLanding();
  }, [slug, isReserved]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 p-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-sm font-semibold text-slate-600">Loading company official website...</p>
      </div>
    );
  }

  if (notFoundState || !company || isReserved) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-4 shadow-xs">
            <Building2 size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Company Website Not Found</h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">
            The company website you are looking for at <span className="font-mono font-bold text-slate-700">/{slug}</span> does not exist or may have been renamed.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <Link
              href="/businesses"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
            >
              Browse All Companies
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isVerified = company.verificationStatus === 'verified' || company.isVerified === true;

  // ── Website Suspension Notice ─────────────────────────────────────────────
  const isSuspended =
    company.websiteStatus === 'suspended' ||
    company.accountStatus === 'suspended' ||
    company.subscriptionStatus === 'trial_expired' ||
    company.subscriptionStatus === 'suspended';

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <ShieldAlert size={28} />
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold uppercase tracking-wider">
                Subscription Suspended
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-3">{company.name}</h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                This business website is temporarily unavailable. The subscription for this business has expired.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left">
              <p className="text-xs font-bold text-slate-700 mb-2">Business Details</p>
              {company.phone && <p className="text-xs text-slate-600">📞 {company.phone}</p>}
              {company.district && <p className="text-xs text-slate-600 mt-1">📍 {company.district}, Tamil Nadu</p>}
            </div>
            <p className="text-[11px] text-slate-500">
              Are you the business owner?{' '}
              <a href="/login" className="text-blue-600 font-semibold hover:underline">
                Login to reactivate your subscription
              </a>
            </p>
            <a
              href="/businesses"
              className="block w-full py-2.5 rounded-2xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Browse Other Businesses
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Schema generation
  const schemaType = company.category?.includes('Healthcare') ? 'MedicalBusiness'
    : company.category?.includes('Education') ? 'EducationalOrganization'
    : company.category?.includes('Food') || company.category?.includes('Hotel') ? 'FoodEstablishment'
    : 'LocalBusiness';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: sanitizeForJsonLd(company.name),
    description: sanitizeForJsonLd(company.description || `${company.name} in ${company.district || 'Theni'}, Tamil Nadu`),
    url: `https://thenijobs.com/${company.slug}`,
    telephone: sanitizeForJsonLd(company.phone),
    address: {
      '@type': 'PostalAddress',
      streetAddress: sanitizeForJsonLd(company.address || company.district || 'Theni'),
      addressLocality: sanitizeForJsonLd(company.district || 'Theni'),
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    image: company.logoUrl || company.bannerUrl || 'https://thenijobs.com/icon.png',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CompanyLandingWebsite
        company={company}
        jobs={jobs}
        reviews={reviews}
        isDraftPreview={!isVerified}
      />
    </>
  );
}
