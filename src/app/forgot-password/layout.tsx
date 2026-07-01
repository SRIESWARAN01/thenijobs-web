import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Your Password',
  description:
    'Forgot your THENIJOBS password? Enter your email to receive a secure reset link and regain access to your account.',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
