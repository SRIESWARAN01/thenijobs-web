import { Suspense } from 'react';
import type { Metadata } from 'next';
import PublicProfileQueryClient from './PublicProfileQueryClient';

export const metadata: Metadata = {
  title: 'Private Portfolio',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

function ProfileFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
    </main>
  );
}

export default function PublicProfileIndexPage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <PublicProfileQueryClient />
    </Suspense>
  );
}
