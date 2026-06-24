import { Suspense } from 'react';
import type { Metadata } from 'next';
import PublicProfilePageClient from './PublicProfilePageClient';

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
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400" />
    </main>
  );
}

export default async function PublicProfileDynamicPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  return (
    <Suspense fallback={<ProfileFallback />}>
      <PublicProfilePageClient uid={uid} />
    </Suspense>
  );
}
