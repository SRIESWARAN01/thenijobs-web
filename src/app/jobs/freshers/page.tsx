import { Metadata } from 'next';
import SeoJobsLanding from '../components/SeoJobsLanding';
import { fetchSeoJobs } from '../components/fetchSeoJobs';

export const metadata: Metadata = {
  title: 'Fresher Jobs in Tamil Nadu 2026 — Entry Level, Internship & Training Opportunities',
  description: 'Find entry-level jobs, internships & training opportunities for freshers in Tamil Nadu. Apply to IT, marketing, sales, accounting & admin positions requiring zero experience. 100% free on THENIJOBS.',
  keywords: ['Fresher Jobs', 'Fresher Jobs Tamil Nadu', 'Entry Level Jobs', 'Internship Tamil Nadu', 'Graduate Jobs', 'Jobs for Freshers', 'No Experience Jobs', 'Training Jobs'],
  alternates: { canonical: 'https://thenijobs.com/jobs/freshers' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 } },
  openGraph: { title: 'Fresher Jobs — Entry Level & Internship Opportunities | THENIJOBS', description: 'Find entry-level jobs & internships for freshers in Tamil Nadu. Apply free.', url: 'https://thenijobs.com/jobs/freshers', type: 'website' },
  twitter: { card: 'summary', title: 'Fresher Jobs in Tamil Nadu | THENIJOBS', description: 'Entry-level jobs, internships & training opportunities for freshers.' },
};

export default async function FreshersJobsPage() {
  const initialJobs = await fetchSeoJobs('jobType', 'fresher');

  return (
    <SeoJobsLanding
      title="Jobs for Freshers"
      subtitle="Kickstart your career with top entry-level roles, graduate openings, and internship opportunities across Tamil Nadu."
      metaDescription="Find entry-level jobs and internships for freshers in Tamil Nadu. Apply to IT, marketing, sales, accounting, and admin positions requiring zero experience."
      filterField="jobType"
      filterValue="fresher"
      initialJobs={initialJobs}
    />
  );
}
