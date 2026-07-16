import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Work From Home Jobs 2026 — Remote & WFH Opportunities in Tamil Nadu',
  description: 'Find work from home and remote jobs in Tamil Nadu. Data entry, IT, customer support, content writing & more. No commute required. Apply free on THENIJOBS.',
  keywords: ['Work From Home Jobs', 'Remote Jobs Tamil Nadu', 'WFH Jobs', 'Online Jobs', 'Work From Home Theni'],
  alternates: { canonical: 'https://thenijobs.com/jobs/work-from-home' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Work From Home Jobs | THENIJOBS', description: 'Find remote & WFH jobs in Tamil Nadu.', url: 'https://thenijobs.com/jobs/work-from-home', type: 'website' },
  twitter: { card: 'summary', title: 'Work From Home Jobs | THENIJOBS', description: 'Remote & WFH job opportunities.' },
};

export default async function WorkFromHomeJobsPage() {
  const initialJobs = await fetchSeoJobs('jobType', 'wfh');
  return (
    <SeoJobsLanding
      title="Work From Home Jobs"
      subtitle="Find remote and work from home opportunities. Data entry, IT, customer support, content writing & more — no commute required."
      metaDescription="Find work from home jobs in Tamil Nadu."
      filterField="jobType"
      filterValue="wfh"
      initialJobs={initialJobs}
    />
  );
}
