import JobDetailPageClient from '@/app/jobs/[id]/JobDetailPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [];
}

export default async function SeekerJobDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <JobDetailPageClient id={id} hideNav={true} />;
}
