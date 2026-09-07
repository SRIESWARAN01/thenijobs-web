'use client';

import { usePathname } from 'next/navigation';
import AdminProfileManagerClient from './AdminProfileManagerClient';

/**
 * Recover the company id the admin actually navigated to. `paramId` is what the page was BUILT
 * with (`_fallback` for every id served through the vercel.json rewrite); `pathname` is what the
 * browser is actually showing. Same reasoning as
 * src/app/admin/businesses/[id]/website/AdminWebsiteManagerRoute.tsx's resolveCompanyIdFromPath.
 */
export function resolveCompanyIdFromPath(pathname: string | null | undefined, paramId: string): string {
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  // …/admin/businesses/<id>/profile — the id is second-to-last.
  const urlId = segments.length >= 2 ? segments[segments.length - 2] : undefined;
  if (!urlId || urlId === '_fallback') return paramId;
  try {
    return decodeURIComponent(urlId);
  } catch {
    return urlId;
  }
}

export default function AdminProfileManagerRoute({ paramId }: { paramId: string }) {
  const pathname = usePathname();
  return <AdminProfileManagerClient companyId={resolveCompanyIdFromPath(pathname, paramId)} />;
}
