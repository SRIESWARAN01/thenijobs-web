import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Dindigul 2026 — Latest Vacancies, Walk-in & Career Opportunities',
  description: 'Find latest job vacancies in Dindigul district. Apply to government, private, IT, manufacturing, textile & fresher jobs. 100% free on THENIJOBS.',
  keywords: ['Jobs in Dindigul', 'Dindigul Job Vacancy', 'Dindigul Employment', 'Dindigul Jobs', 'Government Jobs Dindigul'],
  alternates: { canonical: 'https://thenijobs.com/jobs/dindigul' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Dindigul — Latest Vacancies | THENIJOBS', description: 'Find jobs in Dindigul district. Apply free.', url: 'https://thenijobs.com/jobs/dindigul', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Dindigul | THENIJOBS', description: 'Latest job vacancies in Dindigul district.' },
};

export default async function DindigulJobsPage() {
  const initialJobs = await fetchSeoJobs('district', 'Dindigul');
  return (
    <SeoJobsLanding
      title="Jobs in Dindigul"
      subtitle="Find employment openings in Dindigul district. Browse IT, manufacturing, textile, and government sector jobs."
      metaDescription="Find latest job vacancies in Dindigul district."
      filterField="district"
      filterValue="Dindigul"
      initialJobs={initialJobs}
    />
  );
}
