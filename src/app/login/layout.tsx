import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Your Account',
  description:
    'Log in to THENIJOBS to apply for jobs, manage your business profile, post vacancies, and connect with local employers in Theni & Tamil Nadu.',
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
