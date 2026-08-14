'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Bell, Menu, X, User, LogOut, Settings,
  Shield, PlusCircle, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { label: 'Jobs', href: '/jobs' },
  { label: 'Companies', href: '/businesses' },
  { label: 'Services', href: '/services' },
  { label: 'Daily Jobs', href: '/daily-jobs' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    function setIsScrolled(v: boolean) { setScrolled(v); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  const role = user?.role;

  const dashboardHref =
    (role === 'admin' || role === 'super_admin') ? '/admin/dashboard' :
    (role === 'employer' || role === 'business_owner') ? '/employer/dashboard' :
    '/seeker/dashboard';

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-200 backdrop-blur-md ${
          scrolled || mobileOpen
            ? 'bg-white/98 shadow-sm border-b border-gray-100'
            : 'bg-white/95 border-b border-gray-100'
        }`}
        style={{ fontFamily: "'Inter', sans-serif", paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0" aria-label="THENIJOBS home">
            <img src="/logo.png" alt="THENIJOBS" className="h-9 w-auto" />
            <span className="font-bold text-lg text-gray-900 hidden sm:block" style={{ fontFamily: "'Poppins', sans-serif" }}>
              THENIJOBS
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
            {navLinks.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {/* Notifications */}
                <Link
                  href={(role === 'admin' || role === 'super_admin') ? '/admin/notifications' : (role === 'employer' || role === 'business_owner') ? '/employer/messages' : '/seeker/notifications'}
                  className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <Bell size={17} />
                </Link>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#2563EB' }}>
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-11 w-52 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-gray-50">
                        <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                        <p className="text-sm text-gray-800 font-semibold truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={15} className="text-gray-400" /> My Profile
                      </Link>
                      <Link href={dashboardHref} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <User size={15} className="text-gray-400" /> Dashboard
                      </Link>
                      {(role === 'admin' || role === 'super_admin') && (
                        <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Shield size={15} className="text-gray-400" /> Admin Panel
                        </Link>
                      )}
                      <Link
                        href={(role === 'employer' || role === 'business_owner') ? '/employer/settings' : '/seeker/settings'}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings size={15} className="text-gray-400" /> Settings
                      </Link>
                      <div className="border-t border-gray-50 mt-1">
                        <button
                          onClick={() => void logout()}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Post Job */}
                {(role === 'employer' || role === 'business_owner' || role === 'admin' || role === 'super_admin') && (
                  <Link
                    href="/employer/post-job"
                    className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#2563EB' }}
                  >
                    <PlusCircle size={15} />
                    Post Job
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="h-9 px-4 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/employer/post-job"
                  className="h-9 px-4 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center gap-1.5"
                  style={{ background: '#2563EB' }}
                >
                  Post a Job
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 max-h-[calc(100vh-64px)] overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname?.startsWith(link.href)
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronRight size={14} className="text-gray-400" />
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 mt-2">
              {user ? (
                <>
                  <Link href={dashboardHref} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700">
                    <User size={15} /> My Dashboard
                  </Link>
                  <button
                    onClick={() => void logout()}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700">
                    Sign In
                  </Link>
                  <Link href="/employer/post-job" className="flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#2563EB' }}>
                    Post a Job
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Overlay to close profile dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}

      {/* Spacer to push content below fixed header */}
      <div className="h-16" style={{ paddingTop: 'env(safe-area-inset-top)' }} />
    </>
  );
}
