import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SeekerPortfolioClient from './SeekerPortfolioClient';
import { getAllPublicSeekerPortfolioIdsServer, getPublicSeekerProfileServer } from '@/lib/firebase/firestoreServer';

// Only seekers who opted in via isPortfolioPublic get a static page here — see
// getAllPublicSeekerPortfolioIdsServer and the gate in SeekerPortfolioClient.
export async function generateStaticParams() {
  const ids = await getAllPublicSeekerPortfolioIdsServer().catch(() => []);
  const all = Array.from(new Set(['_fallback', 'demo', 'demo-seeker', ...ids]));
  return all.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (id === '_fallback' || id === 'demo' || id === 'demo-seeker') {
    return {
      title: 'Professional Portfolio | THENIJOBS',
      description: 'View verified professional candidate portfolios and resumes on THENIJOBS.',
      robots: { index: false, follow: false },
    };
  }

  const seeker = await getPublicSeekerProfileServer(id);
  if (!seeker || !seeker.isPortfolioPublic) {
    return {
      title: 'Portfolio Not Found | THENIJOBS',
      description: 'The requested candidate portfolio is private or does not exist.',
      robots: { index: false, follow: false },
    };
  }

  const isIndexEligible = ['premium', 'enterprise'].includes((seeker.subscriptionPlan || 'free').toLowerCase());
  const roleText = seeker.currentRole ? ` (${seeker.currentRole})` : '';
  const title = `${seeker.name}${roleText} — Professional Resume & Portfolio | THENIJOBS`;
  const description = `View ${seeker.name}'s verified career profile, skills, experience, and qualifications in ${seeker.district || 'Theni'}, Tamil Nadu on THENIJOBS.`;
  const canonicalUrl = `https://thenijobs.com/portfolio/seeker/${id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'profile',
      siteName: 'THENIJOBS',
      images: seeker.photoUrl ? [{ url: seeker.photoUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: seeker.photoUrl ? [seeker.photoUrl] : undefined,
    },
    robots: {
      index: isIndexEligible,
      follow: true,
    },
  };
}

export default async function SeekerPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id !== '_fallback' && id !== 'demo' && id !== 'demo-seeker') {
    const seeker = await getPublicSeekerProfileServer(id);
    if (!seeker || !seeker.isPortfolioPublic) {
      notFound();
    }
  }

  return <SeekerPortfolioClient seekerId={id} />;
}

