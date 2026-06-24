import { Suspense } from 'react';
import type { Metadata } from 'next';
import DigitalIdCardPageClient from './DigitalIdCardPageClient';

export const metadata: Metadata = {
  title: 'Digital ID Card — THENIJOBS',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

function IdCardFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
    </main>
  );
}

export default async function DigitalIdDynamicPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;

  return (
    <Suspense fallback={<IdCardFallback />}>
      <DigitalIdCardPageClient uid={uid} />
    </Suspense>
  );
}
