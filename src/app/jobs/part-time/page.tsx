import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Part-Time Jobs | Flexible Part Time Vacancies - THENIJOBS',
  description: 'Search flexible part-time jobs and weekend work options in Tamil Nadu. Ideal for students, homemakers, and professionals seeking secondary income.',
  alternates: {
    canonical: 'https://thenijobs.com/jobs/part-time',
  },
};

export default async function PartTimeJobsPage() {
  const initialJobs = await fetchSeoJobs('jobType', 'part_time');

  return (
    <SeoJobsLanding
      title="Part-Time Jobs"
      subtitle="Find flexible hours, weekend shifts, and hybrid part-time positions near you in Tamil Nadu."
      metaDescription="Search flexible part-time jobs and weekend work options in Tamil Nadu. Ideal for students, homemakers, and professionals seeking secondary income."
      filterField="jobType"
      filterValue="part_time"
      initialJobs={initialJobs}
    />
  );
}
