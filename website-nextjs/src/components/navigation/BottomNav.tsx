'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Briefcase, Building2, Store, User,
  FileText, MessageSquare, LayoutDashboard, Users,
  Package, TrendingUp, Calendar, Wrench, CheckSquare,
  Megaphone, Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { isBusinessRole } from '@/lib/access';

export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Don't render until auth state resolves
  }

  // Define nav items based on user role
  let navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/businesses', label: 'Business', icon: Building2 },
    { href: '/services', label: 'Services', icon: Store },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  if (user) {
    if (user.role === 'job_seeker') {
      navItems = [
        { href: '/seeker/dashboard', label: 'Home', icon: Home },
        { href: '/jobs', label: 'Jobs', icon: Briefcase },
        { href: '/seeker/applications', label: 'Applications', icon: FileText },
        { href: '/seeker/messages', label: 'Messages', icon: MessageSquare },
        { href: '/seeker/profile', label: 'Profile', icon: User },
      ];
    } else if (isBusinessRole(user.role)) {
      // Unified Business nav — all business roles (employer, business_owner, supplier, service_provider, entrepreneur, business)
      navItems = [
        { href: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/business/jobs', label: 'Jobs', icon: Briefcase },
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0c0c1e]/90 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden">
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
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  isActive ? 'bg-violet-500/10' : 'bg-transparent'
                }`}
              >
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
