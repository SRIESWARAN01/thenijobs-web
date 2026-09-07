'use client';

import { usePathname } from 'next/navigation';
import AdminWebsiteManagerClient from './AdminWebsiteManagerClient';

/**
 * Recover the company id the admin actually navigated to. `paramId` is what the page was BUILT
 * with (`_fallback` for every id served through the vercel.json rewrite); `pathname` is what the
 * browser is actually showing. Modelled on
 * src/app/employer/jobs/[id]/EmployerJobDetailRoute.tsx's resolveJobIdFromPath — same reasoning,
 * one path segment earlier (…/[id]/website instead of …/[id]).
 */
export function resolveCompanyIdFromPath(pathname: string | null | undefined, paramId: string): string {
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  // …/admin/businesses/<id>/website — the id is second-to-last.
  const urlId = segments.length >= 2 ? segments[segments.length - 2] : undefined;
  if (!urlId || urlId === '_fallback') return paramId;
  try {
    return decodeURIComponent(urlId);
  } catch {
    return urlId;
  }
}

export default function AdminWebsiteManagerRoute({ paramId }: { paramId: string }) {
  const pathname = usePathname();
  return <AdminWebsiteManagerClient companyId={resolveCompanyIdFromPath(pathname, paramId)} />;
}
