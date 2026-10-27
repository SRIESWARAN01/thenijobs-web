import EmployerJobPostersClient from './EmployerJobPostersClient';

export function generateStaticParams() {
  return [{ id: '_fallback' }, { id: 'demo' }];
}

export default async function JobPostersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployerJobPostersClient jobId={id} />;
}
