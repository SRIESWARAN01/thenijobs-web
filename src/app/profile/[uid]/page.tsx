'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import PublicProfilePageClient from './PublicProfilePageClient';

function ProfileFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400" />
    </main>
  );
}

export default function PublicProfileDynamicPage() {
  const params = useParams();
  const uid = typeof params?.uid === 'string' ? params.uid : '';

  if (!uid) return <ProfileFallback />;

  return (
    <Suspense fallback={<ProfileFallback />}>
      <PublicProfilePageClient uid={uid} />
    </Suspense>
  );
}
