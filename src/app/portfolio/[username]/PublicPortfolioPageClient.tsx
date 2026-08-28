'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { Loader2, AlertCircle, Globe, ShieldCheck } from 'lucide-react';
import TemplateRenderer from '@/components/portfolio/TemplateRenderer';
import type { PortfolioSite } from '@/lib/types/portfolio';
import Head from 'next/head';

interface PublicPortfolioPageClientProps {
  username: string;
}

export default function PublicPortfolioPageClient({ username: usernameProp }: PublicPortfolioPageClientProps) {
  const pathname = usePathname();
  const rawUsername = pathname?.split('/').filter(Boolean).pop() || '';
  const username = (rawUsername && rawUsername !== '_fallback') ? rawUsername : usernameProp;

  const [site, setSite] = useState<PortfolioSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!username || username === '_fallback') return;

    async function loadPortfolio() {
      try {
        setLoading(true);
        setNotFoundState(false);

        // 1. Search by customUrl slug
        const qSlug = query(
          collection(db, 'portfolioSites'),
          where('customUrl', '==', username),
          limit(1)
        );
        const snapSlug = await getDocs(qSlug);

        let data: any = null;

        if (!snapSlug.empty) {
          data = { id: snapSlug.docs[0].id, ...snapSlug.docs[0].data() };
        } else {
          // 2. Search by ownerId
          const qOwner = query(
            collection(db, 'portfolioSites'),
            where('ownerId', '==', username),
            limit(1)
          );
          const snapOwner = await getDocs(qOwner);
          if (!snapOwner.empty) {
            data = { id: snapOwner.docs[0].id, ...snapOwner.docs[0].data() };
          } else {
            // 3. Search by direct doc ID
            try {
              const docRef = doc(db, 'portfolioSites', username);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                data = { id: docSnap.id, ...docSnap.data() };
              }
            } catch { /* invalid doc id */ }
          }
        }

        if (!data) {
          setNotFoundState(true);
        } else {
          setSite(data as PortfolioSite);
        }
      } catch (err) {
        console.error('Error fetching portfolio site:', err);
        setNotFoundState(true);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 font-medium">Loading portfolio website...</p>
      </div>
    );
  }

  if (notFoundState || !site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Website Not Found</h1>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          The portfolio website at <span className="font-mono text-gray-700">/{username}</span> does not exist or has been removed.
        </p>
      </div>
    );
  }

  if (site.status !== 'published') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h1 className="text-lg font-bold text-gray-900">Portfolio Under Construction</h1>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          This portfolio website is currently in draft mode and will be available once published by the owner.
        </p>
      </div>
    );
  }

  // Schema.org Person JSON-LD for Google Search Engine Indexing
  const heroSection = site.sections?.find(s => s.type === 'hero');
  const heroData = heroSection?.data || {};
  const pageTitle = site.seo?.title || `${heroData.name || site.branding?.companyName || 'Portfolio'} — Official Website | THENIJOBS`;
  const pageDesc = site.seo?.description || heroData.tagline || site.branding?.tagline || `Explore the verified professional portfolio, skills, and projects of ${heroData.name || site.branding?.companyName} on THENIJOBS.`;
  const canonicalUrl = `https://thenijobs.com/portfolio/${site.customUrl || username}`;
  const isSeeker = site.ownerType === 'seeker' || site.templateId?.startsWith('seeker-');

  const personSchema = isSeeker ? {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: heroData.name || site.branding?.companyName,
      jobTitle: heroData.title || site.branding?.tagline,
      description: pageDesc,
      url: canonicalUrl,
      image: heroData.avatarUrl || site.branding?.logo,
      address: {
        '@type': 'PostalAddress',
        addressLocality: heroData.location || 'Theni',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
      knowsAbout: site.seo?.keywords || ['Career Professional', 'Tamil Nadu'],
    },
  } : {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: site.branding?.companyName || heroData.name,
    description: pageDesc,
    url: canonicalUrl,
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        {site.googleIndex ? (
          <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        ) : (
          <meta name="robots" content="noindex, nofollow" />
        )}
        {site.seo?.keywords && site.seo.keywords.length > 0 && (
          <meta name="keywords" content={site.seo.keywords.join(', ')} />
        )}
        <link rel="canonical" href={canonicalUrl} />
        {/* OpenGraph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="profile" />
        {heroData.avatarUrl && <meta property="og:image" content={heroData.avatarUrl} />}
      </Head>

      {/* Schema.org Rich Snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <TemplateRenderer site={site} />
    </>
  );
}

