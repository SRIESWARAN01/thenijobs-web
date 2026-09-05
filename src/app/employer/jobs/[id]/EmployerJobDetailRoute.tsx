'use client';

import { usePathname } from 'next/navigation';
import EmployerJobDetailClient from './EmployerJobDetailClient';

/**
 * Recover the job id the employer actually asked for.
 *
 * `paramId` is what the page was BUILT with, which for every id served through the rewrite is
 * the literal `_fallback`. `pathname` is what the browser is actually showing. When they differ,
 * the URL is right.
 *
 * Exported on its own so it can be exercised directly: it is the whole of the routing fix, and
 * a rule that only ever runs behind an auth guard is a rule nobody can check.
 */
export function resolveJobIdFromPath(pathname: string | null | undefined, paramId: string): string {
  const urlId = pathname?.split('/').filter(Boolean).pop();
  if (!urlId || urlId === '_fallback') return paramId;
  try {
    return decodeURIComponent(urlId);
  } catch {
    // A malformed percent-escape is not worth throwing over; the raw segment is closer to
    // right than the build-time placeholder.
    return urlId;
  }
}

/**
 * FIX-3 — the employer job detail route.
 *
 * Production is a static export, so this route ships exactly two HTML files: `_fallback` and
 * `demo`. `vercel.json` rewrites `/employer/jobs/<anything>` to the `_fallback` shell, which
 * means the `params` this page was built with say `_fallback` while the URL holds the id the
 * employer clicked. Reading the id from the URL is the half of the rewrite that makes it
 * useful; without it the shell would render itself instead of the job.
 *
 * The same reasoning is written out at `src/app/company/[slug]/CompanyProfilePageClient.tsx`,
 * which is the route this one is modelled on. Before this component `/employer/jobs/<id>` had
 * none of the three parts of that pattern and returned 404 for every id except `demo`,
 * confirmed against the live site on 2026-09-05.
 *
 * Why this is its own component rather than a few lines inside `EmployerJobDetailClient`:
 * routing recovery is not the detail page's concern, and the detail page keeping the id as a
 * plain prop is what lets it re-render when the URL changes without knowing about routing at
 * all. (It also leaves that file untouched for the branch that currently owns it.)
 */
export default function EmployerJobDetailRoute({ paramId }: { paramId: string }) {
  const pathname = usePathname();
  return <EmployerJobDetailClient jobId={resolveJobIdFromPath(pathname, paramId)} />;
}
