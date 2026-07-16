import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';

export const metadata: Metadata = {
  title: 'Terms of Service — THENIJOBS',
  description: 'Read the Terms of Service for THENIJOBS. Learn about user obligations, account policies, job posting rules, intellectual property, and service limitations.',
  alternates: { canonical: 'https://thenijobs.com/terms' },
  robots: { index: true, follow: true },
  openGraph: { title: 'Terms of Service | THENIJOBS', description: 'Terms and conditions for using the THENIJOBS platform.', url: 'https://thenijobs.com/terms', type: 'website' },
};

export default function TermsPage() {
  const webPageLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service',
    description: 'Terms of Service for THENIJOBS platform.',
    url: 'https://thenijobs.com/terms',
    inLanguage: 'en-IN',
    isPartOf: { '@type': 'WebSite', name: 'THENIJOBS', url: 'https://thenijobs.com' },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thenijobs.com' },
      { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: 'https://thenijobs.com/terms' },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#04040d] text-slate-100 font-sans selection:bg-violet-600/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Header />

      <div className="mx-auto max-w-4xl px-4 py-28 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: July 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-300">
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using THENIJOBS (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. THENIJOBS reserves the right to modify these terms at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. User Accounts</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials. You must be at least 18 years old or have parental consent to use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Job Seekers</h2>
            <p>Job seekers may browse jobs, apply for positions, and create public profiles for free. All information provided must be accurate and truthful. THENIJOBS does not guarantee employment outcomes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Employers &amp; Businesses</h2>
            <p>Employers may post job vacancies, search for candidates, and manage their company profiles. Job postings must comply with applicable labor laws. Discriminatory or fraudulent job postings are strictly prohibited and will result in account suspension.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Subscription &amp; Payments</h2>
            <p>Certain features require a paid subscription. Payments are processed securely via Razorpay. Refunds are subject to our refund policy. Subscription benefits are valid for the stated duration only.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Prohibited Conduct</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li>Posting false or misleading information</li>
              <li>Scraping or automated data collection</li>
              <li>Harassment, abuse, or spam</li>
              <li>Impersonation of other users or businesses</li>
              <li>Uploading malicious files or content</li>
              <li>Circumventing security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Intellectual Property</h2>
            <p>All content, design, logos, and code on THENIJOBS are owned by THENIJOBS or its licensors. Users retain ownership of content they upload but grant THENIJOBS a non-exclusive license to display and distribute it on the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>THENIJOBS is provided &quot;as is&quot; without warranties. We are not liable for employment outcomes, business disputes, or losses arising from use of the Platform. Our total liability shall not exceed the fees paid by you in the preceding 12 months.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Termination</h2>
            <p>THENIJOBS reserves the right to suspend or terminate accounts that violate these terms. Users may delete their accounts at any time through the Settings page.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Governing Law</h2>
            <p>These terms are governed by the laws of India, with the courts of Theni, Tamil Nadu having exclusive jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@thenijobs.com" className="text-violet-400 hover:text-violet-300">support@thenijobs.com</a> or visit our <a href="/contact" className="text-violet-400 hover:text-violet-300">Contact page</a>.</p>
          </section>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
