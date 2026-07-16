import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Government Jobs in Tamil Nadu 2026 — TNPSC, TRB, Railway & SSC Vacancies',
  description: 'Find latest government job vacancies in Tamil Nadu. Apply to TNPSC, TRB, Railway, SSC, Banking & state government jobs. Get alerts for Theni, Madurai & all districts. Free on THENIJOBS.',
  keywords: ['Government Jobs Tamil Nadu', 'Government Jobs Theni', 'TNPSC Jobs', 'TRB Jobs', 'Railway Jobs Tamil Nadu', 'SSC Jobs', 'Sarkari Naukri Tamil Nadu'],
  alternates: { canonical: 'https://thenijobs.com/jobs/government' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Government Jobs in Tamil Nadu 2026 | THENIJOBS', description: 'Find TNPSC, TRB, Railway & SSC government jobs. Apply free.', url: 'https://thenijobs.com/jobs/government', type: 'website' },
  twitter: { card: 'summary', title: 'Government Jobs Tamil Nadu | THENIJOBS', description: 'Latest government job vacancies in Tamil Nadu.' },
};

export default async function GovernmentJobsPage() {
  const initialJobs = await fetchSeoJobs('jobType', 'government');
  return (
    <SeoJobsLanding
      title="Government Jobs in Tamil Nadu"
      subtitle="Find TNPSC, TRB, Railway, SSC, Banking & state government jobs across Tamil Nadu. Get alerts for Theni, Madurai & all districts."
      metaDescription="Find latest government job vacancies in Tamil Nadu."
      filterField="jobType"
      filterValue="government"
      initialJobs={initialJobs}
    />
  );
}
