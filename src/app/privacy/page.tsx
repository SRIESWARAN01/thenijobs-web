import type { Metadata } from 'next';
import InfoPage from '@/components/public/InfoPage';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'THENIJOBS privacy policy.', robots: { index: false, follow: true } };
export default function PrivacyPage() { return <InfoPage eyebrow="Legal" title="Privacy Policy" description="How THENIJOBS handles account and application information." sections={[{ title: 'Information we process', content: 'We process the information required to provide accounts, job applications, employer listings and support.' }, { title: 'Your controls', content: 'You can update profile information through your account. Contact support for account-access or deletion requests.' }]} />; }
