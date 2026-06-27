'use client';

import { useEffect, useState } from 'react';
import PublicProfilePageClient from './[uid]/PublicProfilePageClient';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function PublicProfileQueryClient() {
  const [uid, setUid] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setUid(new URLSearchParams(window.location.search).get('uid') || '');
  }, []);

  useEffect(() => {
    if (uid === '') {
      if (!loading) {
        if (!user) {
          router.replace('/login');
        } else if (user.role === 'job_seeker') {
          router.replace('/seeker/profile');
        } else if (user.role === 'admin' || user.role === 'super_admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/business/settings');
        }
      }
    }
  }, [uid, user, loading, router]);

  if (uid === null || (uid === '' && loading)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
      </main>
    );
  }

  if (uid === '') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
      </main>
    );
  }

  return <PublicProfilePageClient uid={uid} />;
}
