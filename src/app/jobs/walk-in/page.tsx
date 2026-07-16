import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Walk-in Interview Jobs 2026 — Direct Hiring in Theni & Tamil Nadu',
  description: 'Find walk-in interview jobs in Theni, Madurai & Tamil Nadu. Direct hiring, no appointment needed. Browse retail, sales, IT & fresher walk-in openings. Free on THENIJOBS.',
  keywords: ['Walk-in Interview Jobs', 'Walk-in Jobs Theni', 'Direct Hiring', 'Walk-in Interview Tamil Nadu', 'Spot Hiring'],
  alternates: { canonical: 'https://thenijobs.com/jobs/walk-in' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Walk-in Interview Jobs | THENIJOBS', description: 'Find walk-in interview jobs. No appointment needed.', url: 'https://thenijobs.com/jobs/walk-in', type: 'website' },
  twitter: { card: 'summary', title: 'Walk-in Jobs | THENIJOBS', description: 'Walk-in interview jobs in Tamil Nadu.' },
};

export default async function WalkInJobsPage() {
  const initialJobs = await fetchSeoJobs('jobType', 'walk_in');
  return (
    <SeoJobsLanding
      title="Walk-in Interview Jobs"
      subtitle="Find direct hiring and walk-in interview opportunities across Theni, Madurai & Tamil Nadu. No appointment needed."
      metaDescription="Find walk-in interview jobs in Tamil Nadu."
      filterField="jobType"
      filterValue="walk_in"
      initialJobs={initialJobs}
    />
  );
}
