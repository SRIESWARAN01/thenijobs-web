'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Building2,
  LayoutDashboard,
  Menu,
  PlusCircle,
  Search,
  ShieldCheck,
  Store,
  User,
  X,
  Info,
} from 'lucide-react';
import PreferenceControls from '@/components/navigation/PreferenceControls';
import { usePreferences } from '@/contexts/PreferencesContext';

import { useAuth } from '@/hooks/useAuth';
import { getSafePostLoginRedirect } from '@/lib/access';

const navItems = [
  { label: 'Jobs', tamilLabel: 'வேலைகள்', href: '/jobs', icon: Briefcase },
  { label: 'Businesses', tamilLabel: 'நிறுவனங்கள்', href: '/businesses', icon: Building2 },
  { label: 'Services', tamilLabel: 'சேவைகள்', href: '/services', icon: Store },
  { label: 'Pricing', tamilLabel: 'திட்டங்கள்', href: '/pricing', icon: ShieldCheck },
  { label: 'About', tamilLabel: 'பற்றி', href: '/about', icon: Info },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { language } = usePreferences();
  const pathname = usePathname();
  const { user, isSeeker, isBusiness, isAdmin } = useAuth();

  // Get the correct dashboard URL for the logged-in user
  const dashboardUrl = user
    ? getSafePostLoginRedirect('', user.role)
    : '/login';

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 border-b transition-all duration-300 ${
        isScrolled || menuOpen
          ? 'border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl'
          : 'border-transparent bg-white/80 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="THENIJOBS home">
          <Image
            src="/logo.png"
            alt="THENIJOBS Logo"
            width={32}
            height={32}
            sizes="32px"
            className="h-8 w-8 object-contain rounded-lg"
            priority
          />
          <span className="font-outfit font-black text-xl tracking-wider text-transparent bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text">THENIJOBS</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                <Icon size={16} />
                {language === 'ta' ? item.tamilLabel : item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <PreferenceControls />
          <Link
            href="/jobs"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-teal-200 hover:text-teal-700"
            aria-label="Search jobs"
          >
            <Search size={18} />
          </Link>
          {user ? (
            <Link
              href={dashboardUrl}
              className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-100"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
            >
              <User size={16} />
              Login
            </Link>
          )}
          <Link
            href={user ? '/business/post-job' : '/login?redirect=/business/post-job'}
            className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-teal-800"
          >
            <PlusCircle size={16} />
            Job Post
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Icon size={18} className="text-teal-700" />
                  {language === 'ta' ? item.tamilLabel : item.label}
                </Link>
              );
            })}
            <div className="px-3 py-2">
              <PreferenceControls />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {user ? (
                <Link
                  href={dashboardUrl}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-center text-sm font-bold text-teal-800"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-700"
                >
                  Login
                </Link>
              )}
              <Link
                href="/company/register"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-teal-700 px-4 py-3 text-center text-sm font-bold text-white"
              >
                Business Add
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
