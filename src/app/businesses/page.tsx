import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import BusinessesBrowseContent from '@/components/businesses/BusinessesBrowseContent';
import { generateBreadcrumbSchema } from '@/lib/seo/schemas';
import { toJsonLdScript } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Business Directory Theni | Verified Companies & Services | THENIJOBS',
  description:
    'Explore verified businesses, shops, manufacturing units, and service providers across Theni district, Tamil Nadu. Find company profiles, contact numbers, and career vacancies.',
  keywords: [
    'Theni business directory',
    'Companies in Theni',
    'Theni shops and services',
    'Verified businesses Theni',
    'Cumbum businesses',
    'Periyakulam companies',
    'Bodinayakanur cardamom trade',
    'THENIJOBS business listings',
  ],
  alternates: {
    canonical: 'https://www.thenijobs.com/businesses',
  },
  openGraph: {
    title: 'Business Directory Theni | Verified Local Businesses | THENIJOBS',
    description:
      'Connect with verified local businesses, manufacturers, shops, and service providers in Theni district, Tamil Nadu.',
    url: 'https://www.thenijobs.com/businesses',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS Business Directory' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Business Directory Theni | THENIJOBS',
    description: 'Explore verified companies, local shops, and service providers in Theni district.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BusinessesPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://www.thenijobs.com' },
    { name: 'Businesses', url: 'https://www.thenijobs.com/businesses' },
  ]);

  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLdScript(breadcrumbs) }}
      />
      <Header />
      <BusinessesBrowseContent />
      <BottomNav />
    </main>
  );
}
