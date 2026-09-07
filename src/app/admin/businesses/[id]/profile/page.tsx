import AdminProfileManagerRoute from './AdminProfileManagerRoute';

/**
 * A static export can only serve the ids listed here. Real company ids are deliberately NOT
 * enumerated (this is the private admin portal, not a public listing) — vercel.json rewrites
 * `/admin/businesses/<any id>/profile` to this `_fallback` shell, and
 * AdminProfileManagerRoute recovers the real id from the URL at runtime. Same mechanism as
 * `/admin/businesses/[id]/website`.
 */
export function generateStaticParams() {
  return [{ id: '_fallback' }];
}

export default async function AdminBusinessProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProfileManagerRoute paramId={id} />;
}
