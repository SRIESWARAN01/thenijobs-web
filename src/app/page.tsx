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
  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "THENIJOBS",
    "url": "https://thenijobs.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://thenijobs.com/jobs?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "THENIJOBS",
    "url": "https://thenijobs.com",
    "logo": "https://thenijobs.com/icon-512.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-70948-26586",
      "contactType": "customer service",
      "areaServed": "IN",
      "availableLanguage": ["en", "ta"]
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Theni",
      "addressRegion": "Tamil Nadu",
      "postalCode": "625531",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://www.facebook.com/thenijobs",
      "https://www.instagram.com/thenijobs",
      "https://www.linkedin.com/company/thenijobs",
      "https://www.youtube.com/@thenijobs"
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      <LandingPageClient />
      <FloatingWhatsApp />
    </>
  );
}
