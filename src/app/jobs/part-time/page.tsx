import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Part-Time Jobs in Tamil Nadu 2026 — Flexible, Weekend & Work From Home Vacancies',
  description: 'Search flexible part-time jobs, weekend work & work from home opportunities in Tamil Nadu. Ideal for students, homemakers & professionals seeking secondary income. Apply free on THENIJOBS.',
  keywords: ['Part Time Jobs', 'Part Time Jobs Tamil Nadu', 'Weekend Jobs', 'Work From Home Jobs', 'Flexible Jobs', 'Student Jobs', 'Secondary Income Jobs', 'Part Time Vacancy'],
  alternates: { canonical: 'https://thenijobs.com/jobs/part-time' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Part-Time Jobs — Flexible & Weekend Vacancies | THENIJOBS', description: 'Find flexible part-time & work from home jobs in Tamil Nadu. Apply free.', url: 'https://thenijobs.com/jobs/part-time', type: 'website' },
  twitter: { card: 'summary', title: 'Part-Time Jobs in Tamil Nadu | THENIJOBS', description: 'Flexible part-time, weekend & work from home jobs in Tamil Nadu.' },
};

export default async function PartTimeJobsPage() {
  const initialJobs = await fetchSeoJobs('jobType', 'part_time');

  return (
    <SeoJobsLanding
      title="Part-Time Jobs"
      subtitle="Find flexible hours, weekend shifts, and hybrid part-time positions near you in Tamil Nadu."
      metaDescription="Search flexible part-time jobs and weekend work options in Tamil Nadu. Ideal for students, homemakers, and professionals seeking secondary income."
      filterField="jobType"
      filterValue="part_time"
      initialJobs={initialJobs}
    />
  );
}
