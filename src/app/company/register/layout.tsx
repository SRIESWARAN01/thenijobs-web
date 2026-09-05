import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register Your Business | THENIJOBS',
  // QUAL-3: /company/register and /register-business are two separately-linked routes with
  // the same purpose — this one is reached from /businesses, /pricing, company profile pages
  // and the site footer; /register-business is reached once, from the home hero. Neither page
  // decides which should be canonical, so both get an honest, accurate title for what they
  // actually are rather than an artificial distinction invented to make them look different.
  // Whether the site needs two business-registration entry points is a routing question, not
  // a title one.
  description:
    'Add your company to THENIJOBS. Create a verified business profile, list products and services, and start posting jobs to hire in Theni and Tamil Nadu.',
  alternates: { canonical: 'https://thenijobs.com/company/register' },
};

export default function CompanyRegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
