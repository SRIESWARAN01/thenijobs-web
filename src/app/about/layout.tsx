import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About THENIJOBS — Theni’s #1 Local Job Portal & Business Ecosystem',
  description:
    'Learn about THENIJOBS, our mission to bridge local candidates with top businesses in Theni district, AI-driven trust scoring, verified candidate passes, and regional employment growth.',
  keywords: [
    'About THENIJOBS',
    'Theni job portal mission',
    'Local employment Theni',
    'Recruitment platform Tamil Nadu',
    'Theni business directory',
  ],
  alternates: { canonical: 'https://thenijobs.com/about' },
  openGraph: {
    title: 'About THENIJOBS — Theni’s Leading Employment & Business Platform',
    description:
      'Connecting job seekers, companies, and local commerce across Theni district with verified credentials, AI coach, and direct applications.',
    url: 'https://thenijobs.com/about',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'About THENIJOBS' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About THENIJOBS — Theni’s #1 Job Portal',
    description: 'Bridging local job seekers and verified companies in Theni, Tamil Nadu.',
    images: ['/og-image.jpg'],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
