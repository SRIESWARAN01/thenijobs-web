import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Jobs in Theni District 2026 — Government, Private, Walk-in & Fresher Vacancies',
  description: 'Find latest job vacancies in Theni, Cumbum, Bodinayakanur, Periyakulam & Uthamapalayam. Apply to government jobs, private jobs, walk-in interviews, IT, retail & fresher openings. 100% free on THENIJOBS.',
  keywords: ['Jobs in Theni', 'Theni Job Vacancy', 'Government Jobs Theni', 'Private Jobs Theni', 'Walk-in Interview Theni', 'Fresher Jobs Theni', 'Theni District Jobs'],
  alternates: { canonical: 'https://thenijobs.com/jobs/theni' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Jobs in Theni District — Latest Vacancies | THENIJOBS', description: 'Find government, private, walk-in & fresher jobs in Theni district. Apply free.', url: 'https://thenijobs.com/jobs/theni', type: 'website' },
  twitter: { card: 'summary', title: 'Jobs in Theni District | THENIJOBS', description: 'Latest job vacancies in Theni — government, private & walk-in jobs.' },
};

export default async function TheniJobsPage() {
  const initialJobs = await fetchSeoJobs('district', 'Theni');

  return (
    <SeoJobsLanding
      title="Jobs in Theni"
      subtitle="Find local employment openings and vacancies in Theni, Cumbum, Bodinayakanur, Periyakulam, and Uthamapalayam."
      metaDescription="Find local employment openings and vacancies in Theni, Cumbum, Bodinayakanur, Periyakulam, and Uthamapalayam. Apply to retail, IT, office, and fresher roles."
      filterField="district"
      filterValue="Theni"
      initialJobs={initialJobs}
    />
  );
}
