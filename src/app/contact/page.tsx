import type { Metadata } from 'next';
import InfoPage from '@/components/public/InfoPage';

export const metadata: Metadata = { title: 'Contact THENIJOBS', description: 'Contact the THENIJOBS team for help with jobs, employers and local business listings.', alternates: { canonical: '/contact' } };

export default function ContactPage() {
  return <InfoPage eyebrow="Contact" title="We are here to help." description="Reach the THENIJOBS team for support with job applications, employer accounts and business listings." sections={[{ title: 'Support', content: 'Email: info@thenijobs.com\nPhone: +91 98765 43210\nLocation: Theni, Tamil Nadu, India' }, { title: 'Business enquiries', content: 'For company profiles, job postings and local advertising, use the employer dashboard after signing in.' }]} />;
}
