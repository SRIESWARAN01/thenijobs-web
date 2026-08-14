'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, User, FileText, Search, Bookmark,
  Bell, Calendar, Building2, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Sparkles,
  Send, GraduationCap, Loader2, CreditCard
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

const SEEKER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/seeker/dashboard' },
  { label: 'My Profile', icon: User, href: '/seeker/profile' },
  { label: 'Resume', icon: FileText, href: '/seeker/resume' },
  { label: 'Browse Jobs', icon: Search, href: '/jobs', external: true },
  { label: 'Applications', icon: Send, href: '/seeker/applications' },
  { label: 'Saved Jobs', icon: Bookmark, href: '/seeker/saved-jobs' },
  { label: 'Job Alerts', icon: Bell, href: '/seeker/job-alerts' },
  { label: 'Interviews', icon: Calendar, href: '/seeker/interviews' },
  { label: 'Companies', icon: Building2, href: '/businesses', external: true },
  { label: 'AI Coach', icon: Sparkles, href: '/seeker/ai-coach', accent: true },
  { label: 'Skills', icon: GraduationCap, href: '/seeker/skills' },
  { label: 'Digital ID Card', icon: CreditCard, href: '/seeker/id-card' },
  { label: 'Notifications', icon: Bell, href: '/seeker/notifications' },
  { label: 'Settings', icon: Settings, href: '/seeker/settings' },
];

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useRequireAuth(['job_seeker']);
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" style={{ color: '#10B981' }} size={32} />
          <p className="text-sm text-gray-500 font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0]?.toUpperCase() || 'JS');
  const displayName = user.displayName || user.email?.split('@')[0] || 'Job Seeker';

  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      {/* Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white border-r border-gray-100 shadow-sm`}
      >
        {/* Brand */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          {!collapsed && (
            <>
              <img src="/logo.png" alt="THENIJOBS" className="h-8 w-auto flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>THENIJOBS</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Job Seeker Portal</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="lg:hidden text-gray-400">
                <X size={16} />
              </button>
            </>
          )}
          {collapsed && (
            <img src="/logo.png" alt="THENIJOBS" className="h-8 w-auto" />
          )}
        </div>

        {/* Profile section */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-gray-50">
            <div className="flex items-center gap-2.5 p-2.5 bg-emerald-50 rounded-xl">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0"
                style={{ background: '#D1FAE5' }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: '65%', background: '#10B981' }} />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">65%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
          {SEEKER_NAV.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (!item.external && item.href !== '/seeker/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-emerald-50 text-emerald-600 font-semibold'
                    : (item as any).accent
                      ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <button onClick={handleLogout}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all ${collapsed ? '' : 'flex-1'}`}>
              <LogOut size={14} />
              {!collapsed && 'Sign Out'}
            </button>
            <button onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-all">
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-600">
            <Menu size={17} />
          </button>
          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium text-gray-900">My Account</span>
          </div>

          <Link href="/seeker/notifications" className="relative p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 transition-all">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: '#EF4444' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/jobs" className="text-xs text-emerald-600 font-semibold border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-all">
            Browse Jobs
          </Link>
        </header>

        <main className="flex-1 overflow-auto pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
