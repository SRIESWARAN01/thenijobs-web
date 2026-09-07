import AdminJobDetailRoute from './AdminJobDetailRoute';

/**
 * A static export can only serve the ids listed here. Real company/job ids are deliberately NOT
 * enumerated (this is the private admin portal, not a public listing) — vercel.json rewrites
 * `/admin/businesses/<any id>/jobs/<any jobId>` to this `_fallback/_fallback` shell, and
 * AdminJobDetailRoute recovers both real ids from the URL at runtime. Same mechanism as every
 * other admin-context route in this repo (`/website`, `/profile`, `/jobs`).
 */
export function generateStaticParams() {
  return [{ id: '_fallback', jobId: '_fallback' }];
}

export default async function AdminBusinessJobDetailPage({
  params,
}: {
  params: Promise<{ id: string; jobId: string }>;
}) {
  const { id, jobId } = await params;
  return <AdminJobDetailRoute paramId={id} paramJobId={jobId} />;
}
