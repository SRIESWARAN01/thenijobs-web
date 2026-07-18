import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Latest Job Vacancies & Openings in Tamil Nadu — Government, Private, Walk-in & Fresher Jobs',
  description:
    'Search latest job vacancies in Theni, Madurai, Coimbatore & across Tamil Nadu. Find government jobs, private jobs, walk-in interviews, part-time work, internships & fresher openings. Apply instantly on THENIJOBS — 100% free for job seekers.',
  keywords: [
    'Jobs in Theni', 'Jobs in Madurai', 'Jobs in Tamil Nadu', 'Government Jobs Tamil Nadu',
    'Private Jobs Theni', 'Walk-in Interview', 'Fresher Jobs', 'Part Time Jobs',
    'Job Vacancy', 'Latest Jobs', 'Employment', 'Recruitment', 'Career Opportunities',
    'Work From Home Jobs', 'Internship Tamil Nadu', 'Job Search', 'Hiring',
  ],
  // NOTE: Do NOT set alternates.canonical here — it cascades to ALL child
  // pages (/jobs/theni, /jobs/[id], etc.) and tells Google they are duplicates
  // of /jobs. Each indexable sub-page defines its own canonical.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' as const, 'max-snippet': -1 },
  },
  openGraph: {
    title: 'Latest Job Vacancies in Tamil Nadu — Government, Private & Walk-in Jobs | THENIJOBS',
    description:
      'Search latest job vacancies in Theni, Madurai, Coimbatore & across Tamil Nadu. Apply instantly on THENIJOBS.',
    url: 'https://thenijobs.com/jobs',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Latest Job Vacancies in Tamil Nadu | THENIJOBS',
    description:
      'Search government, private, walk-in & fresher jobs in Theni, Madurai & Tamil Nadu. Apply free on THENIJOBS.',
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
