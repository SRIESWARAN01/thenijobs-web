'use client';

import { useEffect, useState } from 'react';
import PublicProfilePageClient from './[uid]/PublicProfilePageClient';

export default function PublicProfileQueryClient() {
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    setUid(new URLSearchParams(window.location.search).get('uid') || '');
  }, []);

  if (uid === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
      </main>
    );
  }

  return <PublicProfilePageClient uid={uid} />;
}
