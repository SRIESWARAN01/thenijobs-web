import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'THENIJOBS – Jobs, Business Networking & Career Platform in India',
  description:
    'THENIJOBS is an AI-powered career and business networking platform connecting job seekers, employers, freelancers, startups, and entrepreneurs across India.',
  keywords: [
    'THENIJOBS',
    'Jobs in Theni',
    'Jobs in Tamil Nadu',
    'Career Platform India',
    'Business Networking Platform',
    'Freelancer Platform',
    'AI Job Portal',
    'Startup Network',
    'Professional Networking',
    'Employment Platform India',
  ],
  alternates: {
    canonical: 'https://thenijobs.com/about',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://thenijobs.com/about',
    siteName: 'THENIJOBS',
    title: 'THENIJOBS – Jobs, Business Networking & Career Platform in India',
    description:
      'THENIJOBS is an AI-powered career and business networking platform connecting job seekers, employers, freelancers, startups, and entrepreneurs across India.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'THENIJOBS - Professional Digital Ecosystem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THENIJOBS – Jobs, Business Networking & Career Platform in India',
    description:
      'THENIJOBS is an AI-powered career and business networking platform connecting job seekers, employers, freelancers, startups, and entrepreneurs across India.',
    images: ['/og-image.jpg'],
  },
};

export default function AboutPage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'THENIJOBS',
    'url': 'https://thenijobs.com',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://thenijobs.com/jobs?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'THENIJOBS',
    'url': 'https://thenijobs.com',
    'logo': 'https://thenijobs.com/logo.png',
    'description': 'AI-powered career, digital business identity and networking platform in India.',
    'foundingDate': '2024',
    'founders': [
      {
        '@type': 'Person',
        'name': 'Eswaran P',
        'jobTitle': 'Founder & Chief Executive Officer (CEO)'
      },
      {
        '@type': 'Person',
        'name': 'Anbarasan S',
        'jobTitle': 'Co-Founder & Director'
      }
    ],
    'contactPoint': [
      {
        '@type': 'ContactPoint',
        'telephone': '+91-93605-19460',
        'contactType': 'customer support',
        'email': 'support@thenijobs.in',
        'areaServed': 'IN'
      }
    ],
    'sameAs': [
      'https://www.facebook.com/thenijobs',
      'https://www.instagram.com/thenijobs',
      'https://www.linkedin.com/company/thenijobs',
      'https://www.youtube.com/@thenijobs'
    ]
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://thenijobs.com'
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'About Us',
        'item': 'https://thenijobs.com/about'
      }
    ]
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is THENIJOBS?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'THENIJOBS is a complete professional digital ecosystem connecting job seekers, employers, freelancers, startups, and entrepreneurs. More than a job portal, it acts as a digital business identity platform.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Is it free to join THENIJOBS?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes, basic registration, profile building, and job searching are free. We also offer standard and premium subscription plans for businesses looking to enhance their SEO and digital identity.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does the Digital ID card work?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Once verified on THENIJOBS, you receive a dynamic high-resolution Digital ID card with a custom QR code. Scanners can access your secure, professional digital portfolio directly. You can save your ID card as a PNG or print-ready PDF.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does the VCF \"Save Contact\" feature benefit businesses?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Every verified company page features a \"Save Contact\" button. When users click this button, the system downloads a pre-formatted vCard (VCF) file. Opening this file instantly saves all company details into their phone contacts list.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can freelancers use this platform?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Absolutely. Freelancers can register as service providers, list their services, showcase portfolios, and connect with local or global clients directly through the platform.'
        }
      }
    ]
  };

  const schemas = [websiteSchema, organizationSchema, breadcrumbSchema, faqSchema];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <AboutPageClient />
    </>
  );
}
