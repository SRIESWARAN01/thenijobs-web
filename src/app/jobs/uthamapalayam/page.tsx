import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Uthamapalayam 2026 — Latest Vacancies & Job Openings',
  description: 'Find latest job vacancies in Uthamapalayam, Theni district. Apply to government, private, agriculture & fresher jobs. 100% free on THENIJOBS.',
  keywords: ['Jobs in Uthamapalayam', 'Uthamapalayam Job Vacancy', 'Uthamapalayam Employment'],
  alternates: { canonical: 'https://thenijobs.com/jobs/uthamapalayam' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Uthamapalayam — Latest Vacancies | THENIJOBS', description: 'Find jobs in Uthamapalayam. Apply free.', url: 'https://thenijobs.com/jobs/uthamapalayam', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Uthamapalayam | THENIJOBS', description: 'Latest job vacancies in Uthamapalayam.' },
};

export default async function UthamapalayamJobsPage() {
  const initialJobs = await fetchSeoJobs('location', 'Uthamapalayam');
  return (
    <SeoJobsLanding
      title="Jobs in Uthamapalayam"
      subtitle="Find employment openings in Uthamapalayam, Theni district."
      metaDescription="Find latest job vacancies in Uthamapalayam."
      filterField="location"
      filterValue="Uthamapalayam"
      initialJobs={initialJobs}
    />
  );
}
