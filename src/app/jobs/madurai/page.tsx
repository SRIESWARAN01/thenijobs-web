import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Madurai | Find Employment Openings in Madurai - THENIJOBS',
  description: 'Apply to the latest job openings in Madurai. Search for full-time, part-time, engineering, IT, and freshers jobs in Madurai from verified local employers.',
  alternates: {
    canonical: 'https://thenijobs.com/jobs/madurai',
  },
};

export default async function MaduraiJobsPage() {
  const initialJobs = await fetchSeoJobs('district', 'Madurai');

  return (
    <SeoJobsLanding
      title="Jobs in Madurai"
      subtitle="Discover and apply for the best career opportunities, corporate listings, and local business jobs in Madurai city."
      metaDescription="Apply to the latest job openings in Madurai. Search for full-time, part-time, engineering, IT, and freshers jobs in Madurai from verified local employers."
      filterField="district"
      filterValue="Madurai"
      initialJobs={initialJobs}
    />
  );
}
