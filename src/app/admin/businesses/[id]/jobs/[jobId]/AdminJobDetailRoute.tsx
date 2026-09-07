'use client';

import { usePathname } from 'next/navigation';
import AdminJobDetailClient from './AdminJobDetailClient';

/**
 * Recover the company id AND job id the admin actually navigated to, from a URL shaped
 * …/admin/businesses/<id>/jobs/<jobId>. `paramId`/`paramJobId` are what the page was BUILT with
 * (`_fallback` for both, for every id served through the vercel.json rewrite); `pathname` is what
 * the browser is actually showing. Same reasoning as every other admin-context route resolver in
 * this repo, one path segment deeper (two dynamic segments instead of one).
 */
export function resolveIdsFromPath(
  pathname: string | null | undefined,
  paramId: string,
  paramJobId: string
): { companyId: string; jobId: string } {
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  // …/admin/businesses/<id>/jobs/<jobId> — jobId is last, id is 3rd from the end.
  const urlJobId = segments.length >= 1 ? segments[segments.length - 1] : undefined;
  const urlCompanyId = segments.length >= 3 ? segments[segments.length - 3] : undefined;

  const decode = (v: string | undefined, fallback: string) => {
    if (!v || v === '_fallback') return fallback;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };

  return {
    companyId: decode(urlCompanyId, paramId),
    jobId: decode(urlJobId, paramJobId),
  };
}

export default function AdminJobDetailRoute({ paramId, paramJobId }: { paramId: string; paramJobId: string }) {
  const pathname = usePathname();
  const { companyId, jobId } = resolveIdsFromPath(pathname, paramId, paramJobId);
  return <AdminJobDetailClient companyId={companyId} jobId={jobId} />;
}
