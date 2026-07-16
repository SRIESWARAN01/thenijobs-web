import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Andipatti 2026 — Latest Vacancies & Job Openings',
  description: 'Find latest job vacancies in Andipatti, Theni district. Apply to government, private, agriculture & fresher jobs. 100% free on THENIJOBS.',
  keywords: ['Jobs in Andipatti', 'Andipatti Job Vacancy', 'Andipatti Employment', 'Andipatti Jobs'],
  alternates: { canonical: 'https://thenijobs.com/jobs/andipatti' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Andipatti — Latest Vacancies | THENIJOBS', description: 'Find jobs in Andipatti. Apply free.', url: 'https://thenijobs.com/jobs/andipatti', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Andipatti | THENIJOBS', description: 'Latest job vacancies in Andipatti.' },
};

export default async function AndipattiJobsPage() {
  const initialJobs = await fetchSeoJobs('location', 'Andipatti');
  return (
    <SeoJobsLanding
      title="Jobs in Andipatti"
      subtitle="Find employment openings in Andipatti, Theni district."
      metaDescription="Find latest job vacancies in Andipatti."
      filterField="location"
      filterValue="Andipatti"
      initialJobs={initialJobs}
    />
  );
}
