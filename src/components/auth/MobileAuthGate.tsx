'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Avoid running on server side
    if (typeof window === 'undefined') return;

    // Check if running inside Capacitor native app
    const isCapacitor = !!(window as any).Capacitor;
    if (!isCapacitor) return;

    if (loading) return;

    // Allowed pages without login on mobile app
    const isAuthPage =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password' ||
      pathname === '/role-selection';

    if (!user && !isAuthPage) {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}
