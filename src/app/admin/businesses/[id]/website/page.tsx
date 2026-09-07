import AdminWebsiteManagerRoute from './AdminWebsiteManagerRoute';

/**
 * A static export can only serve the ids listed here. Real company ids are deliberately NOT
 * enumerated (this is the private admin portal, not a public listing) — vercel.json rewrites
 * `/admin/businesses/<any id>/website` to this `_fallback` shell, and
 * AdminWebsiteManagerRoute recovers the real id from the URL at runtime. Same mechanism as
 * `/employer/jobs/[id]`, `/company/[slug]`, `/portfolio/seeker/[id]`.
 */
export function generateStaticParams() {
  return [{ id: '_fallback' }];
}

export default async function AdminBusinessWebsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminWebsiteManagerRoute paramId={id} />;
}
