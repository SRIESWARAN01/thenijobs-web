import PublicPortfolioPageClient from './PublicPortfolioPageClient';
import { getAllPublishedPortfolioUsernamesServer, getPortfolioSiteSeoByUsernameServer } from '@/lib/firebase/firestoreServer';

// Every published business portfolio site's URL must be listed here at build time — a
// static export can only serve pages that existed at the last build. This used to return
// only two demo usernames, which 404'd every real published portfolio site in production.
export async function generateStaticParams() {
  const usernames = await getAllPublishedPortfolioUsernamesServer().catch(() => []);
  const all = Array.from(new Set(['_fallback', 'demo', ...usernames]));
  return all.map((username) => ({ username }));
}

// SEEKER-5: server-side title/meta on pre-built pages. PublicPortfolioPageClient.tsx previously
// tried to set this via `next/head`'s <Head>, the Pages Router API — it has no effect under the
// App Router, so every portfolio's static HTML shipped the root layout's generic sitewide title
// regardless of whose portfolio it was. generateMetadata runs server-side at build time and is
// the mechanism every other dynamic route in this app (company/[slug], jobs/[id], etc.) already
// uses correctly.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  if (username === '_fallback' || username === 'demo') {
    return {
      title: 'Professional Portfolio | THENIJOBS',
      description: "View verified job seeker and business portfolio websites on THENIJOBS — Tamil Nadu's leading local job platform.",
      robots: { index: false, follow: false },
    };
  }

  const site = await getPortfolioSiteSeoByUsernameServer(username);

  if (!site || site.status !== 'published') {
    return {
      title: 'Portfolio Not Found | THENIJOBS',
      description: 'This portfolio website does not exist or is not yet published.',
      robots: { index: false, follow: false },
    };
  }

  const pageTitle = site.seoTitle || `${site.name} — Official Website | THENIJOBS`;
  const pageDesc = site.seoDescription || site.tagline || `Explore the verified professional portfolio, skills, and projects of ${site.name} on THENIJOBS.`;
  const canonicalUrl = `https://thenijobs.com/portfolio/${site.customUrl}`;

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
      images: site.avatarUrl ? [site.avatarUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
    },
    robots: {
      index: site.googleIndex,
      follow: site.googleIndex,
    },
  };
}

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PublicPortfolioPageClient username={username} />;
}
