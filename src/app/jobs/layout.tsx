import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jobs in Theni | Latest Private & Fresher Job Vacancies | THENIJOBS',
  description:
    'Search 1,200+ verified private jobs, fresher openings, IT, sales, textile, and technical vacancies in Theni, Cumbum, Periyakulam, Bodinayakanur, and across Tamil Nadu. Filter by salary, type, and apply with 1-click.',
  keywords: [
    'Jobs in Theni',
    'Theni job vacancy',
    'Private jobs in Theni',
    'Freshers jobs in Theni',
    'Jobs in Cumbum',
    'Jobs in Periyakulam',
    'Jobs in Bodinayakanur',
    'Jobs in Chinnamanur',
    'Walk in interview Theni',
    'Salary in Theni jobs',
    'THENIJOBS search',
  ],
  alternates: { canonical: 'https://thenijobs.com/jobs' },
  openGraph: {
    title: 'Jobs in Theni | Search Verified Job Vacancies | THENIJOBS',
    description:
      'Find the latest private and full-time job openings in Theni district. Filter by role, location, and apply directly to verified employers.',
    url: 'https://thenijobs.com/jobs',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Jobs in Theni' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobs in Theni | Search Verified Jobs | THENIJOBS',
    description: 'Find verified job vacancies in Theni and Tamil Nadu with instant application.',
    images: ['/og-image.jpg'],
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
