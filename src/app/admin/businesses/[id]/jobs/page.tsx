import AdminJobsListRoute from './AdminJobsListRoute';

/**
 * A static export can only serve the ids listed here. Real company ids are deliberately NOT
 * enumerated (this is the private admin portal, not a public listing) — vercel.json rewrites
 * `/admin/businesses/<any id>/jobs` to this `_fallback` shell, and AdminJobsListRoute recovers
 * the real id from the URL at runtime. Same mechanism as `/admin/businesses/[id]/website` and
 * `/admin/businesses/[id]/profile`.
 */
export function generateStaticParams() {
  return [{ id: '_fallback' }];
}

export default async function AdminBusinessJobsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminJobsListRoute paramId={id} />;
}
