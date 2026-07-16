import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Periyakulam 2026 — Latest Vacancies & Job Openings',
  description: 'Find latest job vacancies in Periyakulam, Theni district. Apply to government, private, agriculture, healthcare & fresher jobs. 100% free on THENIJOBS.',
  keywords: ['Jobs in Periyakulam', 'Periyakulam Job Vacancy', 'Periyakulam Employment', 'Periyakulam Jobs'],
  alternates: { canonical: 'https://thenijobs.com/jobs/periyakulam' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Periyakulam — Latest Vacancies | THENIJOBS', description: 'Find jobs in Periyakulam, Theni district. Apply free.', url: 'https://thenijobs.com/jobs/periyakulam', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Periyakulam | THENIJOBS', description: 'Latest job vacancies in Periyakulam, Theni district.' },
};

export default async function PeriyakulamJobsPage() {
  const initialJobs = await fetchSeoJobs('location', 'Periyakulam');
  return (
    <SeoJobsLanding
      title="Jobs in Periyakulam"
      subtitle="Find employment openings in Periyakulam, Theni district. Browse healthcare, agriculture, education, and private sector jobs."
      metaDescription="Find latest job vacancies in Periyakulam."
      filterField="location"
      filterValue="Periyakulam"
      initialJobs={initialJobs}
    />
  );
}
