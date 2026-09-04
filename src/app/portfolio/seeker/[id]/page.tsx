import SeekerPortfolioClient from './SeekerPortfolioClient';
import { getAllPublicSeekerPortfolioIdsServer } from '@/lib/firebase/firestoreServer';

// Only seekers who opted in via isPortfolioPublic get a static page here — see
// getAllPublicSeekerPortfolioIdsServer and the gate in SeekerPortfolioClient.
export async function generateStaticParams() {
  const ids = await getAllPublicSeekerPortfolioIdsServer().catch(() => []);
  const all = Array.from(new Set(['_fallback', 'demo', 'demo-seeker', ...ids]));
  return all.map((id) => ({ id }));
}


export default async function SeekerPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SeekerPortfolioClient seekerId={id} />;
}
