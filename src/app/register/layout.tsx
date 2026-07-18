import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Free Account — Job Seeker, Employer or Service Provider',
  description:
    'Join THENIJOBS for free. Register as a job seeker, employer, supplier, or service provider. Start hiring or finding jobs in Theni & Tamil Nadu today.',
  alternates: {
    canonical: 'https://thenijobs.com/register',
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Create Your Free Account | THENIJOBS',
    description:
      'Join THENIJOBS for free. Register as a job seeker, employer, supplier, or service provider.',
    url: 'https://thenijobs.com/register',
    type: 'website',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
