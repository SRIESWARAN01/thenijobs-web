import { permanentRedirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * Legacy /service/* routes permanently redirect to /business/*.
 * This is a server component so Googlebot receives a proper 308 status code
 * instead of a client-side JavaScript redirect.
 */
export default async function ServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  permanentRedirect('/business/dashboard');
}
