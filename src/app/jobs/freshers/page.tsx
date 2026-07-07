import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs for Freshers | Entry Level Careers in Tamil Nadu - THENIJOBS',
  description: 'Find entry-level jobs and internships for freshers in Tamil Nadu. Apply to IT, marketing, sales, accounting, and admin positions requiring zero experience.',
  alternates: {
    canonical: 'https://thenijobs.com/jobs/freshers',
  },
};

export default async function FreshersJobsPage() {
  const initialJobs = await fetchSeoJobs('jobType', 'fresher');

  return (
    <SeoJobsLanding
      title="Jobs for Freshers"
      subtitle="Kickstart your career with top entry-level roles, graduate openings, and internship opportunities across Tamil Nadu."
      metaDescription="Find entry-level jobs and internships for freshers in Tamil Nadu. Apply to IT, marketing, sales, accounting, and admin positions requiring zero experience."
      filterField="jobType"
      filterValue="fresher"
      initialJobs={initialJobs}
    />
  );
}
