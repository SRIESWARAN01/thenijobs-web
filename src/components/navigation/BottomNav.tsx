'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  Home, Briefcase, Building2, Store, User,
  FileText, LayoutDashboard, Users,
  Package, MessageSquare, CheckSquare, Megaphone, Settings,
  Bookmark, Calendar, Sparkles, GraduationCap, Bell,
  LogOut, HelpCircle, ChevronRight, X, MoreHorizontal,
  BriefcaseIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isBusinessRole } from '@/lib/access';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

// ── "More" menu items for job seeker ────────────────────────────────────────
const MORE_ITEMS = [
  { href: '/seeker/saved-jobs', label: 'Saved Jobs', icon: Bookmark, color: 'text-amber-400' },
  { href: '/seeker/interviews', label: 'Interviews', icon: Calendar, color: 'text-violet-400' },
  { href: '/seeker/ai-coach', label: 'AI Career Coach', icon: Sparkles, color: 'text-pink-400' },
  { href: '/seeker/skills', label: 'Learning / Skills', icon: GraduationCap, color: 'text-cyan-400' },
  { href: '/seeker/notifications', label: 'Notifications', icon: Bell, color: 'text-emerald-400' },
  { href: '/seeker/profile', label: 'My Profile', icon: User, color: 'text-blue-400' },
  { href: '/seeker/settings', label: 'Settings', icon: Settings, color: 'text-gray-400' },
  { href: 'https://wa.me/917550000000', label: 'Help & Support', icon: HelpCircle, color: 'text-green-400', external: true },
];

// ── Seeker bottom tabs (5 primary) ──────────────────────────────────────────
const SEEKER_TABS = [
  { href: '/seeker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seeker/jobs', label: 'Job Search', icon: Briefcase },
  { href: '/seeker/applications', label: 'Applications', icon: FileText },
  { href: '/seeker/companies', label: 'Companies', icon: Building2 },
];

function SeekerMoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: TouchEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('touchstart', handler);
    return () => document.removeEventListener('touchstart', handler);
  }, [open, onClose]);

  const handleLogout = async () => {
    onClose();
    await signOut(auth);
    router.push('/login');
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-[#0d0d20] border-t border-white/[0.08] shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05]">
          <p className="text-sm font-bold text-white font-outfit">More Options</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="px-3 py-3 space-y-0.5">
          {MORE_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href) && !item.external;
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all ${isActive ? 'bg-violet-500/10' : 'hover:bg-white/[0.04]'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.04] ${item.color}`}>
                  <Icon size={18} />
                </div>
                <span className={`text-sm font-medium flex-1 ${isActive ? 'text-violet-300' : 'text-gray-300'}`}>
                  {item.label}
                </span>
                <ChevronRight size={14} className="text-gray-600" />
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="px-3 pb-4 pt-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-rose-500/10 w-full transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <LogOut size={18} />
            </div>
            <span className="text-sm font-medium text-rose-400 flex-1 text-left">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [showMore, setShowMore] = useState(false);

  if (loading) return null;

  // ── Job Seeker: 5 tabs + More drawer ──────────────────────────────────────
  if (user?.role === 'job_seeker') {
    const isSeekerMoreActive = MORE_ITEMS.some(i => pathname.startsWith(i.href));
    return (
      <>
        <SeekerMoreDrawer open={showMore} onClose={() => setShowMore(false)} />
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0c0c1e]/90 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.5)] md:hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}
        >
          <div className="mx-auto flex max-w-lg items-center justify-around py-1.5 px-2">
            {SEEKER_TABS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all min-w-[56px] ${
                    isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${isActive ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  <span className="leading-tight text-center">{label}</span>
                </Link>
              );
            })}

            {/* More tab */}
            <button
              onClick={() => setShowMore(true)}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all min-w-[56px] ${
                isSeekerMoreActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${isSeekerMoreActive ? 'bg-emerald-500/10' : 'bg-transparent'}`}>
                <MoreHorizontal size={20} strokeWidth={isSeekerMoreActive ? 2.5 : 2} />
              </span>
              <span>More</span>
            </button>
          </div>
        </nav>
      </>
    );
  }

  // ── Other roles: original nav items ───────────────────────────────────────
  let navItems: { href: string; label: string; icon: any }[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/businesses', label: 'Business', icon: Building2 },
    { href: '/services', label: 'Services', icon: Store },
    { href: '/login', label: 'Profile', icon: User },
  ];

  if (user) {
    if (isBusinessRole(user.role)) {
      navItems = [
        { href: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/business/jobs', label: 'Jobs', icon: BriefcaseIcon },
        { href: '/business/products', label: 'Products', icon: Package },
        { href: '/business/messages', label: 'Messages', icon: MessageSquare },
        { href: '/business/settings', label: 'Account', icon: User },
      ];
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      navItems = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/businesses', label: 'Approvals', icon: CheckSquare },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/broadcasts', label: 'Broadcast', icon: Megaphone },
        { href: '/admin/settings', label: 'Settings', icon: Settings },
      ];
    }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0c0c1e]/90 px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={`${label}-${href}`}
              href={href}
              className={`flex min-w-[58px] min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${isActive ? 'bg-violet-500/10' : 'bg-transparent'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
