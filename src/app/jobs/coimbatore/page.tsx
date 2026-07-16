import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Coimbatore 2026 — IT, Engineering, Manufacturing & Fresher Vacancies',
  description: 'Explore active job vacancies in Coimbatore. Apply to IT, software, engineering, manufacturing, textiles & freshers jobs with top companies. 100% free on THENIJOBS.',
  keywords: ['Jobs in Coimbatore', 'Coimbatore Job Vacancy', 'IT Jobs Coimbatore', 'Engineering Jobs Coimbatore', 'Software Jobs Coimbatore', 'Fresher Jobs Coimbatore', 'Manufacturing Jobs Coimbatore'],
  alternates: { canonical: 'https://thenijobs.com/jobs/coimbatore' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Coimbatore — IT, Engineering & Fresher Vacancies | THENIJOBS', description: 'Find IT, engineering, manufacturing & fresher jobs in Coimbatore. Apply free.', url: 'https://thenijobs.com/jobs/coimbatore', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Coimbatore | THENIJOBS', description: 'Latest job vacancies in Coimbatore — IT, engineering & manufacturing jobs.' },
};

export default async function CoimbatoreJobsPage() {
  const initialJobs = await fetchSeoJobs('district', 'Coimbatore');

  return (
    <SeoJobsLanding
      title="Jobs in Coimbatore"
      subtitle="Explore active job vacancies in Coimbatore. Apply to engineering, manufacturing, textiles, IT, software development, and freshers jobs."
      metaDescription="Explore active job vacancies in Coimbatore. Apply to engineering, manufacturing, textiles, IT, software development, and freshers jobs with top companies."
      filterField="district"
      filterValue="Coimbatore"
      initialJobs={initialJobs}
    />
  );
}
