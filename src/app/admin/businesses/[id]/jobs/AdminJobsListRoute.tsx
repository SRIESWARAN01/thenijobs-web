'use client';

import { usePathname } from 'next/navigation';
import AdminJobsListClient from './AdminJobsListClient';

/**
 * Recover the company id the admin actually navigated to. Same reasoning as
 * src/app/admin/businesses/[id]/website/AdminWebsiteManagerRoute.tsx's resolveCompanyIdFromPath.
 */
export function resolveCompanyIdFromPath(pathname: string | null | undefined, paramId: string): string {
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  // …/admin/businesses/<id>/jobs — the id is second-to-last.
  const urlId = segments.length >= 2 ? segments[segments.length - 2] : undefined;
  if (!urlId || urlId === '_fallback') return paramId;
  try {
    return decodeURIComponent(urlId);
  } catch {
    return urlId;
  }
}

export default function AdminJobsListRoute({ paramId }: { paramId: string }) {
  const pathname = usePathname();
  return <AdminJobsListClient companyId={resolveCompanyIdFromPath(pathname, paramId)} />;
}
