import type { Metadata } from 'next';
import MarketplaceBrowseClient from './MarketplaceBrowseClient';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import { toJsonLdScript } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Marketplace Theni | Local Products, Services & B2B Deals | THENIJOBS',
  description:
    'Discover verified local products, commercial services, agriculture supplies, and B2B deals across Theni, Cumbum, and Tamil Nadu. Connect directly with sellers on THENIJOBS Marketplace.',
  keywords: [
    'Theni marketplace',
    'Local products Theni',
    'Services in Theni',
    'Theni B2B marketplace',
    'Cumbum services',
    'Bodinayakanur spices cardamom marketplace',
    'Tamil Nadu local business deals',
    'THENIJOBS marketplace',
  ],
  alternates: {
    canonical: 'https://www.thenijobs.com/marketplace',
  },
  openGraph: {
    title: 'Marketplace Theni | Verified Products & Services | THENIJOBS',
    description:
      'Buy local products and hire verified service professionals across Theni and Tamil Nadu directly without commission.',
    url: 'https://www.thenijobs.com/marketplace',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace Theni | THENIJOBS',
    description: 'Discover local products and hire verified services across Theni district.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketplacePage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.thenijobs.com' },
    { name: 'Marketplace', url: 'https://www.thenijobs.com/marketplace' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />
      <MarketplaceBrowseClient />
    </>
  );
}
