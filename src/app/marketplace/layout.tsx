import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Business Marketplace — Theni & Tamil Nadu | THENIJOBS',
  description: 'Discover products, professional services, and verified local businesses in Theni district. Order products, book services, and contact verified companies directly on THENIJOBS.',
  openGraph: {
    title: 'Local Business Marketplace — Theni & Tamil Nadu | THENIJOBS',
    description: 'Explore products, services, and verified companies across Theni district.',
    url: 'https://thenijobs.com/marketplace',
    type: 'website',
  },
  alternates: {
    canonical: 'https://thenijobs.com/marketplace',
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
