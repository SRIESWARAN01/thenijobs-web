import { permanentRedirect } from 'next/navigation';

export default async function CompaniesSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/company/${slug}`);
}

