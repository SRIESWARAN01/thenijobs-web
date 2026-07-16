import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Bodinayakanur 2026 — Latest Vacancies & Career Opportunities',
  description: 'Find latest job vacancies in Bodinayakanur (Bodi), Theni district. Apply to government, private, agriculture, textile & fresher jobs. 100% free on THENIJOBS.',
  keywords: ['Jobs in Bodinayakanur', 'Bodi Jobs', 'Bodinayakanur Job Vacancy', 'Bodinayakanur Employment'],
  alternates: { canonical: 'https://thenijobs.com/jobs/bodinayakanur' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Bodinayakanur — Latest Vacancies | THENIJOBS', description: 'Find jobs in Bodinayakanur, Theni district. Apply free.', url: 'https://thenijobs.com/jobs/bodinayakanur', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Bodinayakanur | THENIJOBS', description: 'Latest job vacancies in Bodinayakanur, Theni district.' },
};

export default async function BodinayakanurJobsPage() {
  const initialJobs = await fetchSeoJobs('location', 'Bodinayakanur');
  return (
    <SeoJobsLanding
      title="Jobs in Bodinayakanur"
      subtitle="Find local employment openings in Bodinayakanur (Bodi), Theni district. Browse agriculture, textile, and private sector jobs."
      metaDescription="Find latest job vacancies in Bodinayakanur."
      filterField="location"
      filterValue="Bodinayakanur"
      initialJobs={initialJobs}
    />
  );
}
