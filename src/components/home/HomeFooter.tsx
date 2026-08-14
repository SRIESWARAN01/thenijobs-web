import Link from 'next/link';
import { Globe2, MessageCircle, Phone, Mail, MapPin, Play, Share2 } from 'lucide-react';

const footerLinks = {
  'For Job Seekers': [
    { label: 'Browse Jobs', href: '/jobs' },
    { label: 'Companies', href: '/businesses' },
    { label: 'Services', href: '/services' },
    { label: 'Create Profile', href: '/register?role=seeker' },
    { label: 'Saved Jobs', href: '/seeker/saved-jobs' },
  ],
  'For Employers': [
    { label: 'Post a Job', href: '/employer/post-job' },
    { label: 'Register Company', href: '/company/register' },
    { label: 'Employer Dashboard', href: '/employer/dashboard' },
    { label: 'Talent Search', href: '/employer/talent-search' },
  ],
  'Company': [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Daily Jobs', href: '/daily-jobs' },
  ],
};

export default function HomeFooter() {
  return (
    <footer className="border-t border-gray-100" style={{ background: '#111827', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-gray-700">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="THENIJOBS" className="h-9 w-auto" />
              <span className="font-bold text-lg text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
                THENIJOBS
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5 max-w-xs">
              Tamil Nadu&apos;s most trusted local job portal. Connecting talent with opportunity across Theni, Madurai, Dindigul and beyond.
            </p>

            {/* Contact */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} className="text-gray-500" />
                <span>Theni, Tamil Nadu, India</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} className="text-gray-500" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} className="text-gray-500" />
                <span>info@thenijobs.com</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              {[
                { Icon: Globe2, href: 'https://thenijobs.com' },
                { Icon: MessageCircle, href: 'https://wa.me/919876543210' },
                { Icon: Share2, href: 'https://www.linkedin.com' },
                { Icon: Play, href: 'https://www.youtube.com' },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href}
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © 2024 THENIJOBS. All rights reserved. Made with ❤️ in Tamil Nadu.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/cookies" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
