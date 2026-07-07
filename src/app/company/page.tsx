import { permanentRedirect } from 'next/navigation';

export const metadata = {
  robots: { index: false, follow: false },
};

/**
 * /company (with no slug) permanently redirects to /businesses.
 * If a ?slug= query param is present, it's handled by the proxy before this runs.
 */
export default async function CompanyRedirectPage() {
  permanentRedirect('/businesses');
}
