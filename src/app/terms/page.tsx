import type { Metadata } from 'next';
import InfoPage from '@/components/public/InfoPage';

export const metadata: Metadata = { title: 'Terms of Service', description: 'THENIJOBS terms of service.', robots: { index: false, follow: true } };
export default function TermsPage() { return <InfoPage eyebrow="Legal" title="Terms of Service" description="The terms for using THENIJOBS." sections={[{ title: 'Using the platform', content: 'Provide accurate information, use the platform lawfully, and keep your account credentials secure.' }, { title: 'Employers and listings', content: 'Employers are responsible for the accuracy of their listings. Listings are subject to platform moderation.' }]} />; }
