import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing & Employer Subscription Plans | THENIJOBS',
  description:
    'Transparent and affordable annual hiring plans for businesses in Theni. Starting at just ₹2.74/day (₹999/yr) for 15 job postings, company portfolio, digital ID card, and priority candidate access.',
  keywords: [
    'THENIJOBS pricing',
    'Post job in Theni cost',
    'Employer hiring plans Theni',
    'Business subscription TheniJobs',
    'Recruitment package Tamil Nadu',
  ],
  alternates: { canonical: 'https://thenijobs.com/pricing' },
  openGraph: {
    title: 'Employer Pricing & Hiring Plans | THENIJOBS',
    description:
      'Affordable yearly recruitment plans for local businesses with Razorpay UPI & card checkout, digital visiting card, and verified badge.',
    url: 'https://thenijobs.com/pricing',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS Pricing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Employer Pricing Plans | THENIJOBS',
    description: 'Affordable recruitment packages for businesses in Theni & Tamil Nadu.',
    images: ['/og-image.jpg'],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
