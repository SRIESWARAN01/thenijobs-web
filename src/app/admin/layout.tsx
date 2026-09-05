'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, Building2, Briefcase, BarChart3, CreditCard, Megaphone, Shield, Settings, Bell,
  LogOut, ChevronLeft, ChevronRight, Menu, X, Star,
  TrendingUp, Globe, Search, AlertTriangle, Loader2, Sparkles, UserPlus, FileSpreadsheet
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/contexts/NotificationContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

const ADMIN_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Create User', icon: UserPlus, href: '/admin/users/create' },
  { label: 'Companies', icon: Building2, href: '/admin/businesses', badge: 'pending' },
  { label: 'Bulk Import', icon: FileSpreadsheet, href: '/admin/businesses/import' },
  { label: 'Jobs', icon: Briefcase, href: '/admin/jobs', badge: 'pending' },
  { label: 'SEO & Keywords', icon: Search, href: '/admin/seo' },
  { label: 'Leads', icon: TrendingUp, href: '/admin/leads' },
  { label: 'Services', icon: Globe, href: '/admin/services' },
  { label: 'Subscriptions', icon: CreditCard, href: '/admin/subscriptions' },
  { label: 'Advertisements', icon: Megaphone, href: '/admin/ads' },
  { label: 'Reviews', icon: Star, href: '/admin/reviews' },
  { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
  { label: 'Error Monitoring', icon: AlertTriangle, href: '/admin/errors' },
  { label: 'Notifications', icon: Bell, href: '/admin/notifications' },
  { label: 'AI Settings', icon: Sparkles, href: '/admin/ai-settings' },
  { label: 'Security', icon: Shield, href: '/admin/security' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useRequireAuth(['admin', 'super_admin']);
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { unreadCount } = useNotifications();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (pathname === '/admin/login') return <>{children}</>;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm text-gray-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

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
        <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          {!collapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>THENIJOBS</p>
                <p className="text-[10px] font-bold text-indigo-600">Admin Portal</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-500">
                <X size={16} />
              </button>
            </>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        {/* Search (expanded only) */}
        {!collapsed && (
          <div className="px-3 py-2.5 border-b border-gray-50">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input placeholder="Quick search..." className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all" />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
          {ADMIN_NAV.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100/60' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={17} className={`flex-shrink-0 ${active ? 'text-indigo-600' : ''}`} />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {(item as any).badge === 'pending' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3">
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <button onClick={handleLogout}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all ${collapsed ? '' : 'flex-1'}`}>
              <LogOut size={14} />
              {!collapsed && 'Sign Out'}
            </button>
            <button onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 text-slate-500 hover:text-gray-600 transition-all">
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-600">
            <Menu size={17} />
          </button>

          <div className="flex-1 flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border"
              style={{ background: '#FEF3C7', borderColor: '#FDE68A', color: '#92400E' }}>
              <AlertTriangle size={12} />
              Admin Mode
            </div>
          </div>

          <Link href="/admin/notifications" className="relative p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 transition-all">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center" style={{ background: '#EF4444' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href="/" className="text-xs text-blue-600 font-semibold border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-all">
            View Site
          </Link>
        </header>

        <main className="min-w-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
