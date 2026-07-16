'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, Bell, Search, Plus } from 'lucide-react';
import Sidebar, { type SidebarItem } from '@/components/ui/Sidebar';

import { useRequireAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { selectBestSubscription } from '@/lib/subscriptions';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useNotifications } from '@/contexts/NotificationContext';

// Unified Business dashboard navigation — all modules in one sidebar
const BUSINESS_NAV: SidebarItem[] = [
  // Overview
  { label: 'Dashboard', tamilLabel: 'டாஷ்போர்டு', icon: 'LayoutDashboard', href: '/business/dashboard' },

  // Recruitment module
  { label: 'Jobs', tamilLabel: 'வேலைகள்', icon: 'Briefcase', href: '/business/jobs', section: 'Recruitment' },
  { label: 'Post Job', tamilLabel: 'வேலை போடு', icon: 'Plus', href: '/business/post-job', section: 'Recruitment' },
  { label: 'Candidates', tamilLabel: 'விண்ணப்பதாரர்கள்', icon: 'Users', href: '/business/candidates', section: 'Recruitment' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: 'Calendar', href: '/business/interviews', section: 'Recruitment' },
  { label: 'Talent Search', tamilLabel: 'திறமை தேடல்', icon: 'Search', href: '/business/talent-search', section: 'Recruitment' },

  // Products & Inventory module
  { label: 'Products & Services', tamilLabel: 'தயாரிப்புகள்', icon: 'Package', href: '/business/products', section: 'Products & Inventory' },
  { label: 'Inventory', tamilLabel: 'சரக்கு இருப்பு', icon: 'Layers', href: '/business/inventory', section: 'Products & Inventory' },

  // Services module
  { label: 'My Services', tamilLabel: 'எனது சேவைகள்', icon: 'Settings', href: '/business/services', section: 'Services' },
  { label: 'Bookings', tamilLabel: 'முன்பதிவுகள்', icon: 'Calendar', href: '/business/bookings', section: 'Services' },

  // Growth module
  { label: 'Social Feed', tamilLabel: 'சமூக ஊட்டம்', icon: 'Rss', href: '/business/feed', section: 'Growth' },
  { label: 'Advertisements', tamilLabel: 'விளம்பரங்கள்', icon: 'Megaphone', href: '/business/ads', section: 'Growth' },
  { label: 'Leads & Enquiries', tamilLabel: 'விசாரணைகள்', icon: 'TrendingUp', href: '/business/leads', section: 'Growth' },
  { label: 'Messages', tamilLabel: 'செய்திகள்', icon: 'MessageSquare', href: '/business/messages', section: 'Growth' },
  { label: 'Reports', tamilLabel: 'அறிக்கைகள்', icon: 'BarChart3', href: '/business/reports', section: 'Growth' },
  { label: 'Reviews', tamilLabel: 'மதிப்புரைகள்', icon: 'Star', href: '/business/reviews', section: 'Growth' },

  // Account module
  { label: 'Company Profile', tamilLabel: 'நிறுவன விவரம்', icon: 'Building2', href: '/business/company-profile', section: 'Account' },
  { label: 'Website Builder', tamilLabel: 'இணையதள உருவாக்கி', icon: 'Globe', href: '/business/website-builder/appearance', section: 'Account' },
  { label: 'Digital ID Card', tamilLabel: 'டிஜிட்டல் ஐடி கார்டு', icon: 'Award', href: '/business/digital-card', section: 'Account' },
  { label: 'Billing', tamilLabel: 'கட்டணம்', icon: 'CreditCard', href: '/business/billing', section: 'Account' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/business/settings', section: 'Account' },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading: authLoading } = useRequireAuth([
    'business',
    'business_owner',
    'employer',
    'supplier',
    'service_provider',
    'entrepreneur',
  ], '/login', { skip: pathname === '/business/pending' });
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });
  const company = companies[0];
  const companyId = company?.id;

  const { data: subscriptions } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || '')
  ], { skip: !companyId });

  const { data: companyJobs } = useCollection<any>('jobs', [
    where('companyId', '==', companyId || ''),
    where('isActive', '==', true)
  ], { skip: !companyId });

  const activeSub = selectBestSubscription(subscriptions);
  let daysRemaining = -1;
  if (activeSub?.endDate) {
    const expiry = activeSub.endDate.toDate ? activeSub.endDate.toDate() : new Date(activeSub.endDate);
    const diff = expiry.getTime() - Date.now();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const expiringJobs = companyJobs.filter((job: any) => {
    if (!job.expiresAt) return false;
    const expiry = job.expiresAt.toDate ? job.expiresAt.toDate() : new Date(job.expiresAt);
    const diff = expiry.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days <= 7;
  });

  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Verifying access...</p>
      </div>
    );
  }

  if (!user) return null;

  // Pending page has its own standalone layout — skip sidebar
  if (pathname === '/business/pending') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleHeaderSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = headerSearch.trim();
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    const queryString = params.toString();
    router.push(queryString ? `/jobs?${queryString}` : '/jobs');
  };

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="min-h-screen bg-[#0a0a1a] flex">
      {/* Sidebar */}
      <Sidebar
        items={BUSINESS_NAV}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        portalTitle="THENIJOBS"
        portalIcon="Building2"
        user={{
          name: user?.displayName || user?.email?.split('@')[0] || 'Business',
          email: company?.name || 'Business Account',
          avatar: company?.logoUrl || company?.logo || '',
        }}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      >
        <Link
          href="/business/post-job"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Post Job / Add Product
        </Link>
      </Sidebar>

      {/* Main Content Area */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'md:ml-[72px]' : 'md:ml-[280px]'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 md:px-6 gap-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden h-12 w-12 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <Menu size={20} />
          </button>

          <form onSubmit={handleHeaderSearch} className="flex-1 max-w-lg relative hidden sm:block" aria-label="Search">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              placeholder="Search jobs, products, leads..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:border-purple-500/40 focus:bg-white/[0.06] outline-none transition-all"
            />
          </form>

          <div className="flex-1 sm:hidden" />

          <div className="flex items-center gap-2 relative">
            <Link
              href="/jobs"
              aria-label="Search jobs"
              className="sm:hidden h-12 w-12 flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <Search size={18} />
            </Link>
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
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
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
                          className={`px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors ${!n.read ? 'bg-purple-500/[0.03]' : ''}`}
                        >
                          <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                          <p className="text-[11px] text-gray-400 mt-1 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link href="/business/company-profile" aria-label="Open company profile" className="w-12 h-12 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center hover:opacity-90 transition-opacity">
              <span className="text-white text-xs sm:text-[10px] font-bold">
                {user?.displayName ? user.displayName[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'B')}
              </span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Subscription Warning Banner */}
          {daysRemaining !== -1 && daysRemaining <= 100 && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              daysRemaining <= 5 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                : daysRemaining <= 10 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-300'
            }`}>
              <div className="text-xs">
                <span className="font-bold uppercase tracking-wider block mb-0.5">
                  {daysRemaining <= 0 
                    ? 'Subscription Expired' 
                    : daysRemaining <= 5 
                      ? 'Critical: Subscription Expiring' 
                      : 'Subscription Expiry Notice'
                  }
                </span>
                {daysRemaining <= 0 
                  ? 'Your subscription has expired! Please renew now to keep your listed jobs active and access candidates.'
                  : `Your subscription expires in ${daysRemaining} days on ${activeSub.endDate.toDate ? activeSub.endDate.toDate().toLocaleDateString('en-IN') : new Date(activeSub.endDate).toLocaleDateString('en-IN')}.`
                }
              </div>
              <Link 
                href="/business/billing"
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap self-start sm:self-center transition-all ${
                  daysRemaining <= 5 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20' 
                    : daysRemaining <= 10 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20' 
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                }`}
              >
                Renew Subscription
              </Link>
            </div>
          )}

          {/* Job Expiry Banner */}
          {expiringJobs.length > 0 && (
            <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 text-violet-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold uppercase tracking-wider block mb-0.5">Job Listings Expiring / Expired</span>
                You have {expiringJobs.length} job listing{expiringJobs.length > 1 ? 's' : ''} expiring soon or expired. Renew them to keep receiving job applications.
              </div>
              <Link 
                href="/business/dashboard"
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold whitespace-nowrap self-start sm:self-center shadow-lg shadow-violet-600/20 transition-all"
              >
                Manage & Renew Jobs
              </Link>
            </div>
          )}

          {children}
        </main>
      </div>
      </div>
    </>
  );
}
