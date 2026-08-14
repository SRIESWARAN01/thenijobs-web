import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verified Businesses in Theni',
  description: 'Discover verified businesses, services and employers in Theni and Tamil Nadu. Explore company profiles and current openings.',
  alternates: { canonical: '/businesses' },
  openGraph: {
    title: 'Verified Businesses in Theni | THENIJOBS',
    description: 'Find local companies, services and hiring businesses.',
    url: '/businesses',
  },
};

export default function BusinessesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
