import PublicPortfolioPageClient from './PublicPortfolioPageClient';
import { getAllPublishedPortfolioUsernamesServer } from '@/lib/firebase/firestoreServer';

// Every published business portfolio site's URL must be listed here at build time — a
// static export can only serve pages that existed at the last build. This used to return
// only two demo usernames, which 404'd every real published portfolio site in production.
export async function generateStaticParams() {
  const usernames = await getAllPublishedPortfolioUsernamesServer().catch(() => []);
  const all = Array.from(new Set(['_fallback', 'demo', ...usernames]));
  return all.map((username) => ({ username }));
}


export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PublicPortfolioPageClient username={username} />;
}
