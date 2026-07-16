import type { Metadata } from 'next';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us — THENIJOBS Support & Help Center',
  description: 'Get in touch with the THENIJOBS team. Contact us for job posting support, business listings, account help, partnerships, and feedback. We are based in Theni, Tamil Nadu.',
  keywords: ['Contact THENIJOBS', 'THENIJOBS Support', 'THENIJOBS Help', 'Theni Jobs Contact'],
  alternates: { canonical: 'https://thenijobs.com/contact' },
  robots: { index: true, follow: true },
  openGraph: { title: 'Contact THENIJOBS — Support & Help', description: 'Get in touch with the THENIJOBS team for support, partnerships, and feedback.', url: 'https://thenijobs.com/contact', type: 'website' },
};

export default function ContactPage() {
  const contactLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact THENIJOBS',
    url: 'https://thenijobs.com/contact',
    mainEntity: {
      '@type': 'Organization',
      name: 'THENIJOBS',
      url: 'https://thenijobs.com',
      email: 'support@thenijobs.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Theni',
        addressRegion: 'Tamil Nadu',
        addressCountry: 'IN',
      },
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thenijobs.com' },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://thenijobs.com/contact' },
    ],
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a1a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(contactLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Header />

      <div className="mx-auto max-w-4xl px-4 py-28 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Contact Us
        </h1>
        <p className="mt-4 text-gray-400 max-w-2xl">
          Have questions about THENIJOBS? Need help with your account, job posting, or business listing? We&apos;re here to help.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Mail size={20} />
              </div>
              <h2 className="text-lg font-semibold">Email Support</h2>
            </div>
            <p className="text-sm text-gray-400">For general inquiries, account help, and partnerships.</p>
            <a href="mailto:support@thenijobs.com" className="mt-3 inline-block text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">
              support@thenijobs.com
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <MessageCircle size={20} />
              </div>
              <h2 className="text-lg font-semibold">WhatsApp</h2>
            </div>
            <p className="text-sm text-gray-400">Quick support via WhatsApp during business hours.</p>
            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              Chat on WhatsApp
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <MapPin size={20} />
              </div>
              <h2 className="text-lg font-semibold">Office Address</h2>
            </div>
            <p className="text-sm text-gray-400">
              THENIJOBS<br />
              Theni, Tamil Nadu<br />
              India — 625531
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Clock size={20} />
              </div>
              <h2 className="text-lg font-semibold">Business Hours</h2>
            </div>
            <p className="text-sm text-gray-400">
              Monday – Saturday: 9:00 AM – 6:00 PM IST<br />
              Sunday: Closed
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold mb-2">Frequently Asked Topics</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• <strong>Job Seekers:</strong> Account setup, job applications, profile issues</li>
            <li>• <strong>Employers:</strong> Job posting, subscription plans, candidate search</li>
            <li>• <strong>Businesses:</strong> Business listing, digital cards, service bookings</li>
            <li>• <strong>General:</strong> Feedback, bug reports, partnerships, media inquiries</li>
          </ul>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
