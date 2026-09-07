import type { Metadata } from 'next';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

// TRUST-5: the description below used to hard-code "₹2.74/day (₹999/yr) for 15 job postings",
// which was wrong at the time — the entry paid plan was 'standard' at ₹480/yr. PRICING-1
// (2026-09-07) reconciled the plan table to the owner's final numbers and reintroduced a real
// 'basic' tier at ₹999/yr as the new entry paid plan, so this now reads correctly from
// SUBSCRIPTION_PLANS again rather than by coincidence.
//
// Reads the entry paid plan directly from SUBSCRIPTION_PLANS — the source PAY-1 already made
// every other price in the app derive from — so a future price change updates this sentence
// instead of leaving a stale copy for someone else to find.
const entryPaidPlan = SUBSCRIPTION_PLANS.find((p) => p.slug === 'basic');
const postingsFeature = entryPaidPlan?.features.find((f) => /Active Job Postings?/i.test(f));
const postingsCount = postingsFeature?.match(/\d+/)?.[0] ?? '10';
const priceLine = entryPaidPlan
  ? `Starting at just ₹${entryPaidPlan.dailyEquivalent}/day (₹${entryPaidPlan.price}/yr) for ${postingsCount} job postings`
  : 'Affordable annual plans';

export const metadata: Metadata = {
  title: 'Pricing & Employer Subscription Plans | THENIJOBS',
  description:
    `Transparent and affordable annual hiring plans for businesses in Theni. ${priceLine}, company portfolio, digital ID card, and priority candidate access.`,
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
