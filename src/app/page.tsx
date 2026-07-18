import type { Metadata } from 'next';
import LandingPageClient from './LandingPageClient';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';

export const metadata: Metadata = {
  title: 'THENIJOBS — #1 Job Portal, Business Directory & Service Marketplace in Theni, Tamil Nadu',
  description:
    'Find local jobs, hire employees, discover verified businesses, and book local services in Theni, Madurai, Dindigul & Coimbatore. The #1 hyperlocal directory and career ecosystem for Tamil Nadu.',
  alternates: {
    canonical: 'https://thenijobs.com',
  },
  other: {
    'geo.region': 'IN-TN',
    'geo.placename': 'Theni',
    'geo.position': '10.0104;77.4768',
    'ICBM': '10.0104, 77.4768',
  },
  openGraph: {
    title: 'THENIJOBS — #1 Job Portal, Business Directory & Service Marketplace in Theni',
    description:
      'Find local jobs, hire employees, discover verified businesses, and book local services in Theni, Madurai, Dindigul & Coimbatore.',
    url: 'https://thenijobs.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THENIJOBS — Jobs, Businesses & Services in Theni, Tamil Nadu',
    description:
      'Find local jobs, discover verified businesses, and hire employees locally in Theni district.',
  },
};

export default function HomePage() {
  return (
    <>
      <LandingPageClient />
      <FloatingWhatsApp />
    </>
  );
}

