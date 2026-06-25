import { Suspense } from 'react';
import type { Metadata } from 'next';
import DigitalIdQueryClient from './DigitalIdQueryClient';

export const metadata: Metadata = {
  title: 'Digital ID Card',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

function IdFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
    </main>
  );
}

export default function DigitalIdIndexPage() {
  return (
    <Suspense fallback={<IdFallback />}>
      <DigitalIdQueryClient />
    </Suspense>
  );
}
