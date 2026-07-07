import { permanentRedirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * Legacy /employer/* routes permanently redirect to /business/*.
 * This is a server component so Googlebot receives a proper 308 status code
 * instead of a client-side JavaScript redirect.
 */
export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // permanentRedirect throws internally, so this is a no-return call.
  // The proxy.ts handles the actual pathname mapping; this is a belt-and-suspenders fallback.
  permanentRedirect('/business/dashboard');
}
