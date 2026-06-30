import type { Metadata } from 'next';
import BusinessesPageClient from './BusinessesPageClient';

export const metadata: Metadata = {
  title: 'Local Businesses & Services Directory | THENIJOBS',
  description: 'Browse, search and connect with top verified local businesses, shops, and services in Madurai, Theni, Coimbatore and across Tamil Nadu on THENIJOBS.',
  alternates: {
    canonical: 'https://thenijobs.com/businesses',
  },
  openGraph: {
    title: 'Local Businesses & Services Directory | THENIJOBS',
    description: 'Browse, search and connect with top verified local businesses, shops, and services in Madurai, Theni, Coimbatore and across Tamil Nadu on THENIJOBS.',
    url: 'https://thenijobs.com/businesses',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Local Businesses & Services Directory | THENIJOBS',
    description: 'Browse, search and connect with top verified local businesses, shops, and services in Madurai, Theni, Coimbatore and across Tamil Nadu on THENIJOBS.',
  },
};

export default function BusinessesPage() {
  return <BusinessesPageClient />;
}
