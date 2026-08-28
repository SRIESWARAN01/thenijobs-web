import PublicPortfolioPageClient from './PublicPortfolioPageClient';

export function generateStaticParams() {
  return [
    { username: '_fallback' },
    { username: 'demo' },
  ];
}


export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PublicPortfolioPageClient username={username} />;
}
