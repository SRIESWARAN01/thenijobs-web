import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | THENIJOBS',
  description:
    'Sign in to your THENIJOBS account to apply for jobs, manage your job postings, or continue where you left off.',
  alternates: { canonical: 'https://thenijobs.com/login' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
