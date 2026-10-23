import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Employer Pricing & Subscription Plans | TheniJobs',
  description: 'Affordable annual membership plans for businesses in Theni and Tamil Nadu. Post jobs, get verified company profiles, digital ID cards, and hire top local talent.',
  alternates: {
    canonical: 'https://thenijobs.com/pricing',
  },
  openGraph: {
    title: 'Employer Pricing & Subscription Plans | TheniJobs',
    description: 'Affordable annual membership plans for businesses in Theni and Tamil Nadu. Post jobs, get verified company profiles, digital ID cards, and hire top local talent.',
    url: 'https://thenijobs.com/pricing',
    siteName: 'TheniJobs',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Employer Pricing & Subscription Plans | TheniJobs',
    description: 'Affordable annual membership plans for businesses in Theni and Tamil Nadu. Post jobs, get verified company profiles, and hire top local talent.',
  },
};

export default function PricingPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://thenijobs.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Pricing',
        item: 'https://thenijobs.com/pricing',
      },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Which plan should I choose on TheniJobs?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Basic (₹999/yr) is great for new businesses needing a verified profile and digital ID card. Standard (₹1,800/yr) adds a portfolio website, product/service listings, and reviews. Premium (₹3,500/yr) is our most popular plan with higher job-posting limits, video banners, and Gold badge. Enterprise (₹5,000/yr) includes unlimited postings and dedicated careers portal.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I upgrade or downgrade my plan anytime?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can change your plan anytime from your Employer Billing dashboard — upgrades take effect immediately.',
        },
      },
      {
        '@type': 'Question',
        name: 'What payment options are available for TheniJobs subscriptions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We accept all major UPI apps (GPay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and popular wallets.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PricingClient />
    </>
  );
}
