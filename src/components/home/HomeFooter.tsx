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
  { label: 'Post a Job', href: '/pricing' },
  { label: 'Register Company', href: '/company/register' },
  { label: 'Browse Candidates', href: '/businesses' },
  { label: 'Pricing Plans', href: '/pricing' },
  { label: 'Services', href: '/services' },
];

const mobileNumbers = [
  { label: '+91 93605 19460', href: 'tel:+919360519460' },
  { label: '+91 70948 26886', href: 'tel:+917094826886' },
];

export default function HomeFooter() {
  return (
    <footer className="border-t border-white/5 bg-[#080814] px-4 pb-28 pt-12 sm:px-6 md:pb-12">
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
              <span className="font-outfit font-black text-xl tracking-wider text-white">THENIJOBS</span>
            </div>
            <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-400">
              Search, connect, hire and grow. Theni jobs and business discovery platform.
            </p>
            <div className="flex gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 min-w-12 sm:h-9 sm:min-w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-2 text-xs font-bold uppercase text-slate-300 hover:bg-violet-600 hover:text-white transition-colors"
                  aria-label={item.label}
                >
                  {item.short}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-white">For Job Seekers</h4>
            <ul className="space-y-3 sm:space-y-2">
              {seekerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-[36px] sm:min-h-0 items-center text-sm text-slate-400 hover:text-violet-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-white">For Employers</h4>
            <ul className="space-y-3 sm:space-y-2">
              {employerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex min-h-[36px] sm:min-h-0 items-center text-sm text-slate-400 hover:text-violet-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold text-white">Contact</h4>
            <ul className="space-y-4 sm:space-y-3">
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <MapPin size={16} className="mt-0.5 shrink-0 text-violet-400" />
                <span className="leading-relaxed">
                  North Street,<br />
                  A.M. Patty,<br />
                  Uthamapalayam,<br />
                  Theni District,<br />
                  Tamil Nadu, India.
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-400">
                <Phone size={16} className="mt-0.5 shrink-0 text-violet-400" />
                <span className="space-y-2 sm:space-y-1">
                  {mobileNumbers.map((number) => (
                    <a key={number.href} href={number.href} className="block py-1 sm:py-0 hover:text-violet-400 transition-colors">
                      {number.label}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-400">
                <MessageCircle size={16} className="shrink-0 text-violet-400" />
                <a href="https://wa.me/917094826586" target="_blank" rel="noreferrer" className="py-1 sm:py-0 hover:text-violet-400 transition-colors">
                  +91 70948 26586
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/5 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 THENIJOBS. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-violet-400 transition-colors">About Us</Link>
            <Link href="/privacy" className="hover:text-violet-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-violet-400 transition-colors">Terms</Link>
            <Link href="/sitemap.xml" className="hover:text-violet-400 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
