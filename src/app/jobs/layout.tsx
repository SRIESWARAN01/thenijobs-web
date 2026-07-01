import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jobs in Theni, Madurai & Tamil Nadu — Latest Vacancies',
  description:
    'Browse verified job openings in Theni, Madurai, Coimbatore & Tamil Nadu. Filter by location, salary, job type. Apply instantly on THENIJOBS.',
  alternates: {
    canonical: 'https://thenijobs.com/jobs',
  },
  openGraph: {
    title: 'Jobs in Theni, Madurai & Tamil Nadu — Latest Vacancies | THENIJOBS',
    description:
      'Browse verified job openings in Theni, Madurai, Coimbatore & Tamil Nadu. Filter by location, salary, job type. Apply instantly on THENIJOBS.',
    url: 'https://thenijobs.com/jobs',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Jobs in Theni, Madurai & Tamil Nadu | THENIJOBS',
    description:
      'Browse verified job openings in Theni, Madurai, Coimbatore & Tamil Nadu. Apply instantly on THENIJOBS.',
  },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
