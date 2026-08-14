'use client';

import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { Loader2, AlertCircle } from 'lucide-react';
import TemplateRenderer from '@/components/portfolio/TemplateRenderer';
import type { PortfolioSite } from '@/lib/types/portfolio';
import Head from 'next/head';

interface PublicPortfolioPageClientProps {
  username: string;
}

export default function PublicPortfolioPageClient({ username }: PublicPortfolioPageClientProps) {
  const { data: sites, loading } = useCollection<any>('portfolioSites', [
    where('customUrl', '==', username || '')
  ], { skip: !username });

  const site = sites?.[0] as PortfolioSite | undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <p className="text-sm text-gray-500 font-medium">Loading website...</p>
      </div>
    );
  }

  if (!site) {
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
        <h1 className="text-lg font-bold text-gray-900">Website Under Maintenance</h1>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          This portfolio website is currently in draft mode and is not visible to the public.
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{site.seo?.title || site.branding?.companyName || 'Portfolio'}</title>
        <meta name="description" content={site.seo?.description || site.branding?.tagline || ''} />
        {!site.googleIndex && <meta name="robots" content="noindex, nofollow" />}
        {site.seo?.keywords && site.seo.keywords.length > 0 && (
          <meta name="keywords" content={site.seo.keywords.join(', ')} />
        )}
      </Head>
      <TemplateRenderer site={site} />
    </>
  );
}
