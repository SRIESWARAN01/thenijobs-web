'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import DigitalIdCardPageClient from './DigitalIdCardPageClient';

function IdCardFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
    </main>
  );
}

export default function DigitalIdDynamicPage() {
  const params = useParams();
  const uid = typeof params?.uid === 'string' ? params.uid : '';

  if (!uid) return <IdCardFallback />;

  return (
    <Suspense fallback={<IdCardFallback />}>
      <DigitalIdCardPageClient uid={uid} />
    </Suspense>
  );
}
