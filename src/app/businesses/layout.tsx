import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verified Businesses & Companies Directory in Theni | THENIJOBS',
  description:
    'Explore registered and verified companies, factories, institutions, and local commercial shops across Theni, Cumbum, Periyakulam, and Bodinayakanur. View business portfolios, active vacancies, and contact details.',
  keywords: [
    'Businesses in Theni',
    'Theni company directory',
    'Verified companies Theni',
    'Local businesses Theni',
    'Shops and factories in Theni',
    'Commercial directory Tamil Nadu',
  ],
  alternates: { canonical: 'https://thenijobs.com/businesses' },
  openGraph: {
    title: 'Verified Businesses & Companies in Theni | THENIJOBS',
    description:
      'Search verified local companies, showroom profiles, and active hiring employers in Theni and Tamil Nadu.',
    url: 'https://thenijobs.com/businesses',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Businesses in Theni' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verified Companies & Employers in Theni | THENIJOBS',
    description: 'Explore verified company profiles, catalogs, and job openings in Theni district.',
    images: ['/og-image.jpg'],
  },
};

export default function BusinessesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
