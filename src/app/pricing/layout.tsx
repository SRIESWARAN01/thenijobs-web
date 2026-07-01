import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Subscription Plans — Basic, Premium & Enterprise',
  description:
    'Compare THENIJOBS business plans. Get verified listing, priority ranking, digital business card, and lead generation tools starting at affordable prices.',
  alternates: {
    canonical: 'https://thenijobs.com/pricing',
  },
  openGraph: {
    title: 'Pricing & Subscription Plans | THENIJOBS',
    description:
      'Compare THENIJOBS business plans. Get verified listing, priority ranking, digital business card, and lead generation tools.',
    url: 'https://thenijobs.com/pricing',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Pricing & Subscription Plans | THENIJOBS',
    description:
      'Compare THENIJOBS business plans for verified listing, priority ranking, and lead generation.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
