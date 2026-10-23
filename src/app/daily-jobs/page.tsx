import type { Metadata } from 'next';
import DailyJobsClient from './DailyJobsClient';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import { toJsonLdScript } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Daily Jobs in Theni | Urgent Hiring & Immediate Joining | THENIJOBS',
  description:
    'Find daily wage jobs, urgent hiring, walk-in interviews, and immediate joining vacancies across Theni, Cumbum, and Tamil Nadu. Apply directly on THENIJOBS.',
  keywords: [
    'Daily jobs in Theni',
    'Urgent jobs Theni',
    'Immediate joining jobs Theni',
    'Theni walkin interview',
    'Daily wage jobs Theni',
    'Part time jobs Theni',
    'THENIJOBS daily jobs',
  ],
  alternates: {
    canonical: 'https://thenijobs.com/daily-jobs',
  },
  openGraph: {
    title: 'Daily Jobs in Theni | Urgent Hiring Vacancies | THENIJOBS',
    description:
      'Urgent hiring vacancies with immediate joining and daily wage opportunities across Theni district.',
    url: 'https://thenijobs.com/daily-jobs',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS Daily Jobs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily Jobs in Theni | THENIJOBS',
    description: 'Urgent hiring vacancies and immediate joining jobs across Theni district.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DailyJobsPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://thenijobs.com' },
    { name: 'Daily Jobs', url: 'https://thenijobs.com/daily-jobs' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />
      <DailyJobsClient />
    </>
  );
}
