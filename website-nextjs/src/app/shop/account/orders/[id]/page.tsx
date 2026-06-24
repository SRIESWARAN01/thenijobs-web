import OrderDetailPageClient from './OrderDetailPageClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: PageProps) {
  return <OrderDetailPageClient params={params} />;
}

