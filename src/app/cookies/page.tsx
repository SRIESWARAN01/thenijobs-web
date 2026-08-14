import type { Metadata } from 'next';
import InfoPage from '@/components/public/InfoPage';

export const metadata: Metadata = { title: 'Cookie Notice', description: 'THENIJOBS cookie notice.', robots: { index: false, follow: true } };
export default function CookiesPage() { return <InfoPage eyebrow="Legal" title="Cookie Notice" description="How browser storage helps THENIJOBS deliver a reliable service." sections={[{ title: 'Essential storage', content: 'Essential browser storage may be used for authentication, security and core site preferences.' }, { title: 'Controls', content: 'You can manage browser storage in your browser settings. Disabling essential storage can affect sign-in and saved preferences.' }]} />; }
