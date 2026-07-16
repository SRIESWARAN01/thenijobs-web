import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Madurai 2026 — Latest Vacancies, Walk-in Interviews & Career Opportunities',
  description: 'Apply to the latest job openings in Madurai. Search government jobs, full-time, part-time, engineering, IT, software & freshers jobs from verified employers. 100% free on THENIJOBS.',
  keywords: ['Jobs in Madurai', 'Madurai Job Vacancy', 'Government Jobs Madurai', 'IT Jobs Madurai', 'Walk-in Madurai', 'Fresher Jobs Madurai', 'Career Opportunities Madurai'],
  alternates: { canonical: 'https://thenijobs.com/jobs/madurai' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Madurai — Latest Vacancies | THENIJOBS', description: 'Find government, private, walk-in & fresher jobs in Madurai. Apply free.', url: 'https://thenijobs.com/jobs/madurai', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Madurai | THENIJOBS', description: 'Latest job vacancies in Madurai — government, private & walk-in jobs.' },
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
