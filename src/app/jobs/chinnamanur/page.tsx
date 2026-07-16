import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Chinnamanur 2026 — Latest Vacancies & Job Openings',
  description: 'Find latest job vacancies in Chinnamanur, Theni district. Apply to government, private, agriculture, textile & fresher jobs. 100% free on THENIJOBS.',
  keywords: ['Jobs in Chinnamanur', 'Chinnamanur Job Vacancy', 'Chinnamanur Employment', 'Chinnamanur Jobs'],
  alternates: { canonical: 'https://thenijobs.com/jobs/chinnamanur' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Chinnamanur — Latest Vacancies | THENIJOBS', description: 'Find jobs in Chinnamanur. Apply free.', url: 'https://thenijobs.com/jobs/chinnamanur', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Chinnamanur | THENIJOBS', description: 'Latest job vacancies in Chinnamanur.' },
};

export default async function ChinnamanurJobsPage() {
  const initialJobs = await fetchSeoJobs('location', 'Chinnamanur');
  return (
    <SeoJobsLanding
      title="Jobs in Chinnamanur"
      subtitle="Find employment openings in Chinnamanur, Theni district."
      metaDescription="Find latest job vacancies in Chinnamanur."
      filterField="location"
      filterValue="Chinnamanur"
      initialJobs={initialJobs}
    />
  );
}
