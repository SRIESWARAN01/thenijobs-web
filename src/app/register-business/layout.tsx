import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Your Business | THENIJOBS',
  description:
    'List your business on THENIJOBS. Showcase your company, post job openings, and reach local job seekers and customers across Theni district.',
  alternates: { canonical: 'https://thenijobs.com/register-business' },
};

export default function RegisterBusinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
