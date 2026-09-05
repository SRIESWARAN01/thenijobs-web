import EmployerJobDetailRoute from './EmployerJobDetailRoute';

/**
 * FIX-3: a static export can only serve the ids listed here, and this used to list `demo`
 * alone — so every real job posting an employer clicked returned 404 in production. Verified
 * live on 2026-09-05: `/employer/jobs/demo` was 200 and every other id was 404.
 *
 * Real job ids are deliberately NOT enumerated. `/jobs/[id]` lists them because those pages
 * are public and want to be crawled; this is the private employer portal, and writing every
 * job id into the export would publish the job table as a list of static paths for no benefit.
 * The `_fallback` shell plus the `vercel.json` rewrite serves any id without doing that, which
 * is the same mechanism `/jobs/[id]`, `/company/[slug]` and `/portfolio/seeker/[id]` use.
 *
 * `demo` stays: it is a real link target in the repository's own demo content.
 */
export function generateStaticParams() {
  return [{ id: '_fallback' }, { id: 'demo' }];
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployerJobDetailRoute paramId={id} />;
}
