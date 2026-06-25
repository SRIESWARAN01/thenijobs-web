'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardPathForRole } from '@/lib/access';

export default function PublicOnlyGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [loading, router, user]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <div className="w-10 h-10 rounded-full border-4 border-violet-500/25 border-t-violet-400 animate-spin mb-4" />
        <p className="text-sm text-gray-400">
          {user ? 'Opening your dashboard...' : 'Checking session...'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

