import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Account | THENIJOBS',
  description:
    'Sign up free on THENIJOBS as a job seeker or an employer. Search verified private jobs, build a resume, or post openings and hire local talent in Theni and Tamil Nadu.',
  alternates: { canonical: 'https://thenijobs.com/register' },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
