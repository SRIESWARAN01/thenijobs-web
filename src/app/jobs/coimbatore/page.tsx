import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Coimbatore | Career Opportunities in Coimbatore - THENIJOBS',
  description: 'Explore active job vacancies in Coimbatore. Apply to engineering, manufacturing, textiles, IT, software development, and freshers jobs with top companies.',
  alternates: {
    canonical: 'https://thenijobs.com/jobs/coimbatore',
  },
};

export default async function CoimbatoreJobsPage() {
  const initialJobs = await fetchSeoJobs('district', 'Coimbatore');

  return (
    <SeoJobsLanding
      title="Jobs in Coimbatore"
      subtitle="Explore active job vacancies in Coimbatore. Apply to engineering, manufacturing, textiles, IT, software development, and freshers jobs."
      metaDescription="Explore active job vacancies in Coimbatore. Apply to engineering, manufacturing, textiles, IT, software development, and freshers jobs with top companies."
      filterField="district"
      filterValue="Coimbatore"
      initialJobs={initialJobs}
    />
  );
}
