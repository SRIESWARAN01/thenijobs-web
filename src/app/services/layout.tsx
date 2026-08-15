import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Products & Services Marketplace in Theni District | THENIJOBS',
  description:
    'Discover verified local service providers, industrial products, shops, and agricultural offerings across Theni, Cumbum, Periyakulam, and Bodinayakanur. 1-Click WhatsApp direct ordering and quotes.',
  keywords: [
    'Local services in Theni',
    'Theni marketplace',
    'Theni business directory',
    'Products in Theni',
    'Service providers Theni',
    'Order local products Theni',
    'Agriculture services Theni',
    'Textile suppliers Theni',
  ],
  alternates: { canonical: 'https://thenijobs.com/services' },
  openGraph: {
    title: 'Local Products & Services Marketplace in Theni | THENIJOBS',
    description:
      'Browse verified products, business catalogs, and professional services in Theni district with 1-click WhatsApp order inquiries.',
    url: 'https://thenijobs.com/services',
    type: 'website',
    locale: 'en_IN',
    siteName: 'THENIJOBS',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'THENIJOBS Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theni Local Marketplace & Services | THENIJOBS',
    description: 'Find local products, shops, and services in Theni district with direct WhatsApp contact.',
    images: ['/og-image.jpg'],
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
