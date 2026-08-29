'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  ChevronDown, Bell, Menu, X, User, LogOut, Settings,
  Shield, PlusCircle, ChevronRight, Briefcase, Building2,
  Wrench, Calendar, Tag, Info, Sparkles, ShoppingBag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavLinkItem {
  label: string;
  href: string;
  icon: any;
}

const navLinks: NavLinkItem[] = [
  { label: 'Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { label: 'Companies', href: '/businesses', icon: Building2 },
  { label: 'Services', href: '/services', icon: Wrench },
  { label: 'Daily Jobs', href: '/daily-jobs', icon: Calendar },
  { label: 'Pricing', href: '/pricing', icon: Tag },
  { label: 'About', href: '/about', icon: Info },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
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
            ? 'bg-white/98 shadow-sm border-b border-slate-200/80'
            : 'bg-white/95 border-b border-slate-100'
        }`}
        style={{ fontFamily: "'Inter', sans-serif", paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3 sm:gap-6">

          {/* ── Brand Logo Section ── */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none select-none" 
            aria-label="THENIJOBS Home"
          >
            {/* Logo image container: fixed aspect ratio, never cropped or distorted */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-xs group-hover:border-blue-300 transition-colors">
              <img 
                src="/logo.png" 
                alt="THENIJOBS Logo" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Typography */}
            <div className="flex flex-col justify-center">
              <span 
                className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight leading-none whitespace-nowrap" 
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                THENI<span className="text-blue-600">JOBS</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase hidden sm:block whitespace-nowrap mt-0.5">
                Tamil Nadu Jobs
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation Links (>= 1024px) ── */}
          <nav 
            className="hidden lg:flex items-center gap-1 xl:gap-1.5" 
            aria-label="Primary Navigation"
          >
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-xl text-xs xl:text-sm font-semibold transition-all ${
                    active
                      ? 'text-blue-700 bg-blue-50/80 font-bold shadow-xs'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Right Actions (Desktop) ── */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {mounted && user ? (
              <>
                {/* Notification Bell */}
                <Link
                  href={(role === 'admin' || role === 'super_admin') ? '/admin/notifications' : (role === 'employer' || role === 'business_owner') ? '/employer/messages' : '/seeker/notifications'}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
                  aria-label="Notifications"
                >
                  <Bell size={16} />
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 h-9 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-xs"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-blue-600 shrink-0">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-xs xl:text-sm font-semibold text-slate-800 max-w-[110px] truncate whitespace-nowrap">
                      {user.displayName || user.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-11 w-56 bg-white rounded-2xl border border-slate-100 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                        <p className="text-xs text-slate-900 font-bold truncate mt-0.5">{user.email || user.displayName}</p>
                      </div>
                      <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                        <User size={15} className="text-slate-400" /> My Profile
                      </Link>
                      <Link href={dashboardHref} className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium">
                        <Briefcase size={15} className="text-slate-400" /> Dashboard
                      </Link>
                      {(role === 'admin' || role === 'super_admin') && (
                        <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-blue-700 hover:bg-blue-50 font-bold">
                          <Shield size={15} className="text-blue-600" /> Admin Portal
                        </Link>
                      )}
                      <Link
                        href={(role === 'employer' || role === 'business_owner') ? '/employer/settings' : '/seeker/settings'}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <Settings size={15} className="text-slate-400" /> Settings
                      </Link>
                      <div className="border-t border-slate-100 mt-1">
                        <button
                          onClick={() => void logout()}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-semibold text-left"
                        >
                          <LogOut size={15} /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Employer Post Job Button */}
                {(role === 'employer' || role === 'business_owner' || role === 'admin' || role === 'super_admin') && (
                  <Link
                    href="/employer/post-job"
                    className="whitespace-nowrap flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs xl:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-xs"
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
                  className="whitespace-nowrap h-9 px-3.5 xl:px-4 rounded-xl text-xs xl:text-sm font-bold text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center shadow-xs"
                >
                  Sign In
                </Link>
                <Link
                  href="/employer/post-job"
                  className="whitespace-nowrap h-9 px-3.5 xl:px-4 rounded-xl text-xs xl:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle size={15} />
                  Post a Job
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile / Tablet Action & Hamburger Bar (< 1024px) ── */}
          <div className="flex lg:hidden items-center gap-2">
            {(!mounted || !user) && (
              <Link
                href="/login"
                className="whitespace-nowrap h-8 sm:h-9 px-3 rounded-lg text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center"
              >
                Sign In
              </Link>
            )}
            <button
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile & Tablet Dropdown Drawer ── */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200/80 px-4 py-3 space-y-1 max-h-[calc(100vh-64px)] overflow-y-auto shadow-xl animate-in fade-in slide-in-from-top-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-1.5">Navigation Menu</p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={active ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="whitespace-nowrap">{link.label}</span>
                  </div>
                  <ChevronRight size={15} className="text-slate-300" />
                </Link>
              );
            })}

            {/* Mobile Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 mt-3 pb-2">
              {user ? (
                <>
                  <Link 
                    href={dashboardHref} 
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
                  >
                    <Briefcase size={16} /> My Dashboard
                  </Link>
                  {(role === 'employer' || role === 'business_owner' || role === 'admin' || role === 'super_admin') && (
                    <Link
                      href="/employer/post-job"
                      className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <PlusCircle size={16} /> Post a Job Opening
                    </Link>
                  )}
                  <button
                    onClick={() => void logout()}
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="flex items-center justify-center py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
                  >
                    Sign In to THENIJOBS
                  </Link>
                  <Link 
                    href="/employer/post-job" 
                    className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <PlusCircle size={16} /> Post a Job (Free)
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Overlay for Profile Dropdown */}
      {profileOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
      )}

      {/* Header Spacer */}
      <div className="h-16" style={{ paddingTop: 'env(safe-area-inset-top)' }} />
    </>
  );
}
