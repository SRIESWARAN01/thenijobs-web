import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Cumbum 2026 — Latest Vacancies & Walk-in Interviews',
  description: 'Find latest job vacancies in Cumbum, Theni district. Apply to government jobs, private jobs, walk-in interviews, agriculture, retail & fresher openings. 100% free on THENIJOBS.',
  keywords: ['Jobs in Cumbum', 'Cumbum Job Vacancy', 'Cumbum Jobs', 'Cumbum Walk-in', 'Cumbum Employment'],
  alternates: { canonical: 'https://thenijobs.com/jobs/cumbum' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Cumbum — Latest Vacancies | THENIJOBS', description: 'Find jobs in Cumbum, Theni district. Apply free.', url: 'https://thenijobs.com/jobs/cumbum', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Cumbum | THENIJOBS', description: 'Latest job vacancies in Cumbum, Theni district.' },
};

export default async function CumbumJobsPage() {
  const initialJobs = await fetchSeoJobs('location', 'Cumbum');
  return (
    <SeoJobsLanding
      title="Jobs in Cumbum"
      subtitle="Find local employment openings and vacancies in Cumbum, Theni district. Browse agriculture, retail, and private sector jobs."
      metaDescription="Find latest job vacancies in Cumbum. Apply to government, private, walk-in & fresher jobs."
      filterField="location"
      filterValue="Cumbum"
      initialJobs={initialJobs}
    />
  );
}
