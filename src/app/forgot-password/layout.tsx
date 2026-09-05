import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Your Password | THENIJOBS',
  description: 'Request a password reset link for your THENIJOBS account.',
  alternates: { canonical: 'https://thenijobs.com/forgot-password' },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
