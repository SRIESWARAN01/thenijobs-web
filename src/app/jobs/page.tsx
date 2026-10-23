import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import JobsBrowseContent from '@/components/jobs/JobsBrowseContent';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import { toJsonLdScript } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Jobs in Theni, Cumbum & Tamil Nadu | Latest Vacancies | THENIJOBS',
  description:
    'Find and apply for verified private, fresher, full-time, and urgent job vacancies in Theni, Cumbum, Periyakulam, Bodinayakanur, and across Tamil Nadu on THENIJOBS.',
  keywords: [
    'Jobs in Theni',
    'Theni job vacancy',
    'Jobs in Cumbum',
    'Jobs in Periyakulam',
    'Jobs in Bodinayakanur',
    'Tamil Nadu private jobs',
    'Fresher jobs Theni',
    'Apply jobs online Theni',
  ],
  alternates: {
    canonical: 'https://thenijobs.com/jobs',
  },
  openGraph: {
    title: 'Jobs in Theni & Tamil Nadu | Verified Vacancies | THENIJOBS',
    description:
      'Search and apply directly to verified employer job vacancies across Theni district. Zero consultancy fees, verified local employers.',
    url: 'https://thenijobs.com/jobs',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS Job Openings' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobs in Theni & Tamil Nadu | THENIJOBS',
    description: 'Find verified private, fresher, and full-time jobs across Theni district.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function JobsPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Jobs', url: 'https://thenijobs.com/jobs' },
  ]);

  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }} className="font-outfit">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />
      <Header />
      <JobsBrowseContent />
      <BottomNav />
    </main>
  );
}
