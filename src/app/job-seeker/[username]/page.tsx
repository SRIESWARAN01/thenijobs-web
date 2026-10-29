import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPortfolioPageClient from '@/app/portfolio/[username]/PublicPortfolioPageClient';
import {
  getAllPublishedPortfolioUsernamesServer,
  getPortfolioSiteSeoByUsernameServer,
} from '@/lib/firebase/firestoreServer';

/**
 * Pre-generate static paths for published candidate portfolios.
 * Draft or private sites are never pre-rendered statically.
 */
export async function generateStaticParams() {
  const usernames = await getAllPublishedPortfolioUsernamesServer().catch(() => []);
  const all = Array.from(new Set(['_fallback', 'demo', 'demo-seeker', ...usernames]));
  return all.map((username) => ({ username }));
}

/**
 * Generates SEO metadata for candidate portfolios at /job-seeker/[username].
 * CRITICAL RULE: Draft, pending_review, or private profiles MUST NEVER be indexed by Google.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;

  if (username === '_fallback' || username === 'demo' || username === 'demo-seeker') {
    return {
      title: 'Candidate Digital Portfolio | THENIJOBS',
      description: 'View verified job seeker and professional candidate digital portfolios on THENIJOBS.',
      robots: { index: false, follow: false },
    };
  }

  const site = await getPortfolioSiteSeoByUsernameServer(username);

  // Draft or private profiles: STRICTLY NOINDEX
  if (!site || site.status !== 'published' || site.visibility !== 'public' || !site.googleIndex) {
    return {
      title: 'Candidate Profile Private / Under Review | THENIJOBS',
      description: 'This candidate portfolio is currently in draft mode or private.',
      robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
          index: false,
          follow: false,
          'max-image-preview': 'none',
        },
      },
    };
  }

  const pageTitle = site.seoTitle || `${site.name} — Candidate Portfolio & Resume | THENIJOBS`;
  const pageDesc = site.seoDescription || site.tagline || `Explore the verified professional portfolio, skills, and work experience of ${site.name} on THENIJOBS.`;
  const canonicalUrl = `https://www.thenijobs.com/job-seeker/${site.customUrl || username}`;

  return {
    title: pageTitle,
    description: pageDesc,
    keywords: site.seoKeywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: canonicalUrl,
      type: 'profile',
      siteName: 'THENIJOBS',
      images: site.avatarUrl ? [{ url: site.avatarUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: site.avatarUrl ? [site.avatarUrl] : undefined,
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
  };
}

export default async function JobSeekerPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PublicPortfolioPageClient username={username} />;
}
