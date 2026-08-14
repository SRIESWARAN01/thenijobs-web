import SeekerPortfolioClient from './SeekerPortfolioClient';

export function generateStaticParams() {
  return [{ id: 'demo-seeker' }];
}

export default async function SeekerPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SeekerPortfolioClient seekerId={id} />;
}
