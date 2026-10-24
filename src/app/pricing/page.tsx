import type { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Affordable Annual Plans for Local Businesses | THENIJOBS',
  description: 'Grow your company with local job postings, digital ID cards, verified portfolios, and recruitment tools in Theni & Tamil Nadu. Simple, honest annual pricing from ₹999/yr.',
  alternates: {
    canonical: 'https://www.thenijobs.com/pricing',
  },
  openGraph: {
    title: 'Affordable Annual Plans for Local Businesses | THENIJOBS',
    description: 'Grow your company with local job postings, digital ID cards, verified portfolios, and recruitment tools in Theni & Tamil Nadu. Simple, honest annual pricing from ₹999/yr.',
    url: 'https://www.thenijobs.com/pricing',
    siteName: 'THENIJOBS',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affordable Annual Plans for Local Businesses | THENIJOBS',
    description: 'Grow your company with local job postings, digital ID cards, verified portfolios, and recruitment tools in Theni & Tamil Nadu.',
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
        item: 'https://www.thenijobs.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Pricing',
        item: 'https://www.thenijobs.com/pricing',
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
          text: 'Basic (₹999/yr) is ideal for startups needing 5 active jobs and a verified digital card. Standard (₹1,800/yr) is designed for growing local shops with 10 active jobs, 20 products, 10 services, and 3 branches. Premium (₹3,500/yr) is our most popular plan for established companies with 50 active jobs, 100 products, 50 services, 20 branches, and 25 staff IDs with Gold badge. Enterprise (₹5,000/yr) delivers unlimited jobs, products, services, branches, and staff IDs with Platinum Corporate badge and AI company tools.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I upgrade or downgrade my plan anytime?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. You can change your plan anytime from your Employer Billing dashboard. Upgrades take effect immediately upon successful payment. When renewing at a lower tier, all your existing listings and company records remain safely preserved without deletion; new additions are simply bounded by the new tier limits. Subscriptions are billed annually on a manual renewal basis with no surprise auto-debits.',
        },
      },
      {
        '@type': 'Question',
        name: 'What payment options are available for TheniJobs subscriptions?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We accept all major UPI apps (GPay, PhonePe, Paytm, BHIM), Net Banking across 50+ Indian banks, Debit/Credit Cards (Visa, Mastercard, RuPay), and popular wallets via Razorpay 256-bit SSL encrypted checkout. Subscriptions activate immediately upon payment verification.',
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
