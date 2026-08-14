import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jobs in Theni | Today’s Local Job Vacancies',
  description: 'Search verified job vacancies in Theni, Madurai, Dindigul and across Tamil Nadu. Filter by role, location, job type and experience.',
  alternates: { canonical: '/jobs' },
  openGraph: {
    title: 'Jobs in Theni | THENIJOBS',
    description: 'Find verified local job opportunities and apply from any device.',
    url: '/jobs',
  },
};

export default function JobsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
