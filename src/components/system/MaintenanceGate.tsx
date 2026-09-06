'use client';

import { usePathname } from 'next/navigation';
import { useDocument } from '@/hooks/useFirestore';
import { Wrench } from 'lucide-react';
import Link from 'next/link';

/**
 * DOC2-2 — reads the same `platformSettings/public` document DOC2-1 already built (public read,
 * admin write). `/admin/**` and `/login` always pass straight through, unevaluated, so an admin
 * can always reach the login page and their own dashboard to turn maintenance back off — the
 * existing per-page `useRequireAuth(['admin','super_admin'])` guards already keep non-admins out
 * of `/admin/**` regardless of this flag, so no new access path opens by exempting the route.
 * Fail-safe by construction: only an explicit `maintenance === true` blocks anything. A missing
 * document, a missing field, a still-loading read, and a read error all fall through to the same
 * `!== true` branch and render the real page — "site is up" is always the default, never "down".
 */
export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useDocument<{ maintenance?: boolean }>('platformSettings', 'public');

  const isExempt = pathname === '/login' || pathname === '/admin' || pathname?.startsWith('/admin/');
  const maintenanceOn = data?.maintenance === true;

  if (!isExempt && maintenanceOn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center font-sans">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200 shadow-xs">
          <Wrench size={32} />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">THENIJOBS is temporarily down for maintenance</h1>
        <p className="text-sm text-gray-600 max-w-md mb-6 leading-relaxed">
          We are making some improvements and will be back shortly. Please check back soon.
        </p>
        <Link href="/login" className="text-xs font-semibold text-blue-600 hover:underline">
          Admin login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
