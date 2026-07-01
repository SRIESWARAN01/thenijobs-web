import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Services Directory — Plumbing, Electrician, Web Design & More',
  description:
    'Find and hire trusted local service providers in Theni & Tamil Nadu. Compare ratings, read reviews, and book services directly on THENIJOBS.',
  alternates: {
    canonical: 'https://thenijobs.com/services',
  },
  openGraph: {
    title: 'Local Services Directory | THENIJOBS',
    description:
      'Find and hire trusted local service providers in Theni & Tamil Nadu. Compare ratings, read reviews, and book services directly.',
    url: 'https://thenijobs.com/services',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Local Services Directory | THENIJOBS',
    description:
      'Find and hire trusted local service providers in Theni & Tamil Nadu on THENIJOBS.',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
