import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Local Services in Theni',
  description: 'Browse local professional services and providers in Theni and Tamil Nadu.',
  alternates: { canonical: '/services' },
};

export default function ServicesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
