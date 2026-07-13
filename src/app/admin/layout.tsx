'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search, Menu } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Sidebar from '@/components/ui/Sidebar';

import { useNotifications } from '@/contexts/NotificationContext';
import { useRequireAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase/config';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';

const ADMIN_NAV = [
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்டு', icon: 'LayoutDashboard', href: '/admin/dashboard' },
  { label: 'Users', tamilLabel: 'பயனர்கள்', icon: 'Users', href: '/admin/users' },
  { label: 'Businesses', tamilLabel: 'நிறுவனங்கள்', icon: 'Building2', href: '/admin/businesses' },
  { label: 'Digital ID Cards', tamilLabel: 'டிஜிட்டல் அடையாள அட்டைகள்', icon: 'CreditCard', href: '/admin/businesses/digital-cards' },
  { label: 'Jobs', tamilLabel: 'வேலைகள்', icon: 'Briefcase', href: '/admin/jobs' },
  { label: 'Leads', tamilLabel: 'விசாரணைகள்', icon: 'TrendingUp', href: '/admin/leads' },
  { label: 'Services', tamilLabel: 'சேவைகள்', icon: 'Globe', href: '/admin/services' },
  { label: 'Service Bookings', tamilLabel: 'சேவை முன்பதிவுகள்', icon: 'CalendarCheck', href: '/admin/bookings' },
  { label: 'Subscriptions', tamilLabel: 'சந்தாக்கள்', icon: 'CreditCard', href: '/admin/subscriptions' },
  { label: 'Expiry Monitoring', tamilLabel: 'காலாவதி கண்காணிப்பு', icon: 'Clock', href: '/admin/monitoring' },
  { label: 'Marketing', tamilLabel: 'மார்க்கெட்டிங்', icon: 'Megaphone', href: '/admin/marketing' },
  { label: 'Coupons', tamilLabel: 'கூப்பன்கள்', icon: 'Ticket', href: '/admin/coupons' },
  { label: 'SEO Controls', tamilLabel: 'SEO கட்டுப்பாடுகள்', icon: 'Search', href: '/admin/seo' },
  { label: 'Ads', tamilLabel: 'விளம்பரங்கள்', icon: 'Tv', href: '/admin/ads' },
  { label: 'Reviews', tamilLabel: 'மதிப்புரைகள்', icon: 'Star', href: '/admin/reviews' },
  { label: 'Shop Products', tamilLabel: 'கடை பொருட்கள்', icon: 'Package', href: '/admin/shop/products' },
  { label: 'Shop Orders', tamilLabel: 'கடை ஆர்டர்கள்', icon: 'ShoppingBag', href: '/admin/shop/orders' },
  { label: 'Shop Customers', tamilLabel: 'வாடிக்கையாளர்கள்', icon: 'UserCircle', href: '/admin/shop/customers' },
  { label: 'Shop Coupons', tamilLabel: 'கடை தள்ளுபடி குறியீடுகள்', icon: 'Tag', href: '/admin/shop/coupons' },
  { label: 'Shop Reviews', tamilLabel: 'கடை மதிப்புரைகள்', icon: 'MessageSquare', href: '/admin/shop/reviews' },
  { label: 'Learning Academy', tamilLabel: 'கற்றல் அகாடமி', icon: 'GraduationCap', href: '/admin/academy' },
  { label: 'Reports', tamilLabel: 'அறிக்கைகள்', icon: 'BarChart3', href: '/admin/reports' },
  { label: 'Notifications', tamilLabel: 'அறிவிப்புகள்', icon: 'Bell', href: '/admin/notifications' },
  { label: 'Security', tamilLabel: 'பாதுகாப்பு', icon: 'Shield', href: '/admin/security' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/admin/settings' },
  { label: 'Activity Logs', tamilLabel: 'செயல்பாட்டு பதிவுகள்', icon: 'FileText', href: '/admin/activity-logs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';
  const { user, loading: authLoading } = useRequireAuth(
    ['admin', 'super_admin'],
    '/admin/login',
    { skip: isLoginPage },
  );
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  // Pending businesses count for badge
  const { data: pendingCompanies } = useCollection<{ id: string }>('companies', [
    where('status', 'in', ['pending', 'changes_requested']),
  ], { skip: isLoginPage || authLoading || !user });
  const pendingBizCount = pendingCompanies.length;

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Skip layout for login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Verifying admin access...</p>
      </div>
    );
  }

  if (!user || !['admin', 'super_admin'].includes(user.role)) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleHeaderSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = headerSearch.trim();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    const queryString = params.toString();
    router.push(queryString ? `/jobs?${queryString}` : '/jobs');
  };

  const adminName = user.displayName || user.email?.split('@')[0] || 'Admin';
  const adminEmail = user.email || 'Admin account';
  const adminRole = user.role === 'super_admin' ? 'Super Admin' : 'Admin';
  const adminInitials = adminName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD';

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex">
      {/* Sidebar */}
      <Sidebar
        items={ADMIN_NAV.map(item => item.href === '/admin/businesses' && pendingBizCount > 0 ? { ...item, badge: pendingBizCount } : item)}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        portalTitle="THENIJOBS"
        portalIcon="Zap"
        user={{
          name: adminName,
          email: `${adminRole} - ${adminEmail}`,
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 lg:px-6 gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-12 w-12 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Menu size={20} />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleHeaderSearch} className="flex-1 max-w-lg relative hidden sm:block" aria-label="Search jobs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              placeholder="Search jobs by title, company, skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:border-violet-500/40 focus:bg-white/[0.06] outline-none transition-all"
            />
          </form>

          <div className="flex-1 sm:hidden" />

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/jobs"
              aria-label="Search jobs"
              className="sm:hidden h-12 w-12 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <Search size={18} />
            </Link>
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative h-12 w-12 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d20] font-outfit shadow-[0_10px_30px_rgba(0,0,0,0.5)] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
                  <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={async () => {
                          await markAllAsRead();
                          setShowNotifDropdown(false);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04] no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-500">
                        You&apos;re all caught up!
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={async () => {
                            await markAsRead(n.id);
                            setShowNotifDropdown(false);
                            if (n.actionUrl) {
                              router.push(n.actionUrl);
                            }
                          }}
                          className={`px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors ${!n.read ? 'bg-cyan-500/[0.03]' : ''}`}
                        >
                          <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                          <p className="text-[11px] text-gray-400 mt-1 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-white/[0.06] text-center bg-white/[0.01]">
                    <Link
                      href="/admin/notifications"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-[11px] text-violet-400 hover:text-violet-300 font-bold block"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar */}
            <Link href="/admin/settings" aria-label="Open admin settings" className="w-12 h-12 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center hover:opacity-90 transition-opacity">
              <span className="text-white text-xs sm:text-[10px] font-bold">{adminInitials}</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
