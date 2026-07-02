'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DigitalIdCardPageClient from './[uid]/DigitalIdCardPageClient';

export default function DigitalIdQueryClient() {
  const { user } = useAuth();
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const queryUid = new URLSearchParams(window.location.search).get('uid');
    if (queryUid) {
      setUid(queryUid);
    } else if (user?.uid) {
      setUid(user.uid);
    } else {
      setUid('');
    }
  }, [user]);

  if (uid === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
      </main>
    );
  }

  return <DigitalIdCardPageClient uid={uid} />;
}
