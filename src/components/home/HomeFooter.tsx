import Link from 'next/link';
import Image from 'next/image';
import { MapPin, MessageCircle, Phone } from 'lucide-react';

const socialLinks = [
  { label: 'Facebook', short: 'f', href: 'https://www.facebook.com/thenijobs' },
  { label: 'Instagram', short: 'ig', href: 'https://www.instagram.com/thenijobs' },
  { label: 'LinkedIn', short: 'in', href: 'https://www.linkedin.com/company/thenijobs' },
  { label: 'YouTube', short: 'yt', href: 'https://www.youtube.com/@thenijobs' },
];

const seekerLinks = [
  { label: 'Browse Jobs', href: '/jobs' },
  { label: 'Create Profile', href: '/register' },
  { label: 'Upload Resume', href: '/seeker/resume' },
  { label: 'Job Alerts', href: '/seeker/job-alerts' },
  { label: 'Companies', href: '/businesses' },
];
const employerLinks = [
  { label: 'Post a Job', href: '/employer/post-job' },
  { label: 'Register Company', href: '/company/register' },
  { label: 'Browse Candidates', href: '/employer/talent-search' },
  { label: 'Pricing Plans', href: '/pricing' },
  { label: 'Dashboard', href: '/employer/dashboard' },
];

const mobileNumbers = [
  { label: '+91 93605 19460', href: 'tel:+919360519460' },
  { label: '+91 70948 26886', href: 'tel:+917094826886' },
];

export default function HomeFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 pb-28 pt-12 sm:px-6 md:pb-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="THENIJOBS Logo"
                width={32}
                height={32}
                sizes="32px"
                className="h-8 w-8 object-contain rounded-lg"
              />
              <span className="font-outfit font-black text-xl tracking-wider text-slate-800">THENIJOBS</span>
            </div>
            <p className="mb-4 text-sm font-semibold leading-6 text-slate-500">
              Search, connect, hire and grow. Theni jobs and business discovery platform.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 min-w-12 sm:h-9 sm:min-w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-black uppercase text-slate-600 hover:bg-teal-50 hover:text-teal-800"
                  aria-label={item.label}
                >
                  {item.short}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black text-slate-950">For Job Seekers</h4>
            <ul className="space-y-3 sm:space-y-2">
              {seekerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-[36px] sm:min-h-0 items-center text-sm font-semibold text-slate-500 hover:text-teal-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black text-slate-950">For Employers</h4>
            <ul className="space-y-3 sm:space-y-2">
              {employerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-[36px] sm:min-h-0 items-center text-sm font-semibold text-slate-500 hover:text-teal-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-black text-slate-950">Contact</h4>
            <ul className="space-y-4 sm:space-y-3">
              <li className="flex items-start gap-2 text-sm font-semibold text-slate-500">
                <MapPin size={16} className="mt-0.5 shrink-0 text-teal-700" />
                <span>
                  North Street,<br />
                  A.M. Patty,<br />
                  Uthamapalayam,<br />
                  Theni District,<br />
                  Tamil Nadu, India.
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm font-semibold text-slate-500">
                <Phone size={16} className="mt-0.5 shrink-0 text-teal-700" />
                <span className="space-y-2 sm:space-y-1">
                  {mobileNumbers.map((number) => (
                    <a key={number.href} href={number.href} className="block py-1 sm:py-0 hover:text-teal-700">
                      {number.label}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                <MessageCircle size={16} className="shrink-0 text-teal-700" />
                <a href="https://wa.me/917094826586" target="_blank" rel="noreferrer" className="py-1 sm:py-0 hover:text-teal-700">
                  +91 70948 26586
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 THENIJOBS. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-teal-700">About Us</Link>
            <Link href="/privacy" className="hover:text-teal-700">Privacy</Link>
            <Link href="/terms" className="hover:text-teal-700">Terms</Link>
            <Link href="/sitemap.xml" className="hover:text-teal-700">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
