'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Search } from 'lucide-react';
import Sidebar from '@/components/ui/Sidebar';
import { useRequireAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { useNotifications } from '@/contexts/NotificationContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import type { JobSeekerProfile } from '@/lib/types';

const SEEKER_NAV = [
  { label: 'Dashboard', tamilLabel: 'டாஷோர்டு', icon: 'LayoutDashboard', href: '/seeker/dashboard' },
  { label: 'My Profile', tamilLabel: 'என் விவரம்', icon: 'User', href: '/seeker/profile' },
  { label: 'Resume', tamilLabel: 'ரெஸ்யூம்', icon: 'FileText', href: '/seeker/resume' },
  { label: 'Job Search', tamilLabel: 'வேலை தேடல்', icon: 'Search', href: '/seeker/jobs' },
  { label: 'Applications', tamilLabel: 'விண்ணப்பங்கள்', icon: 'Send', href: '/seeker/applications' },
  { label: 'Saved Jobs', tamilLabel: 'சேமித்த வேலைகள்', icon: 'Bookmark', href: '/seeker/saved-jobs' },
  { label: 'Job Alerts', tamilLabel: 'வேலை அலர்ட்', icon: 'Bell', href: '/seeker/job-alerts' },
  { label: 'Interviews', tamilLabel: 'நேர்காணல்கள்', icon: 'Calendar', href: '/seeker/interviews' },
  { label: 'Companies', tamilLabel: 'நிறுவனங்கள்', icon: 'Building2', href: '/seeker/companies' },
  { label: 'AI Coach', tamilLabel: 'AI பயிற்சி', icon: 'Sparkles', href: '/seeker/ai-coach' },
  { label: 'Skill Dev', tamilLabel: 'திறன் மேம்பாடு', icon: 'GraduationCap', href: '/seeker/skills' },
  { label: 'Settings', tamilLabel: 'அமைப்புகள்', icon: 'Settings', href: '/seeker/settings' },
];

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth(['job_seeker']);
  const { data: seekerProfile } = useDocument<JobSeekerProfile>('seekerProfiles', user?.uid);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center font-outfit">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Verifying seeker access...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const userInitials = user?.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email ? user.email[0].toUpperCase() : 'JS');
  const userDisplayName = user?.displayName || user?.email?.split('@')[0] || 'Job Seeker';
  const profileStrength = Math.min(100, Math.max(0, Number(seekerProfile?.profileStrength ?? 0)));

  const handleHeaderSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = headerSearch.trim();
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    const queryString = params.toString();
    router.push(queryString ? `/seeker/jobs?${queryString}` : '/seeker/jobs');
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex">
      {/* Sidebar */}
      <Sidebar
        items={SEEKER_NAV}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        portalTitle="THENIJOBS"
        portalIcon="Briefcase"
        user={{
          name: userDisplayName,
          email: user?.email || undefined,
        }}
        onLogout={handleLogout}
      >
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Profile Strength</span>
            <span className="text-xs font-bold text-emerald-400">{profileStrength}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${profileStrength}%` }} />
          </div>
        </div>
      </Sidebar>

      {/* Main Content Area */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center px-4 lg:px-6 gap-4">
          <form onSubmit={handleHeaderSearch} className="flex-1 max-w-lg relative hidden sm:block" aria-label="Search jobs">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={headerSearch}
              onChange={(event) => setHeaderSearch(event.target.value)}
              placeholder="Search jobs, companies, skills..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:bg-white/[0.06] outline-none transition-all"
            />
          </form>

          <div className="flex-1 sm:hidden" />

          <div className="flex items-center gap-2">
            <Link
              href="/seeker/jobs"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Search size={14} />
              Find Jobs
            </Link>
            <Link
              href="/seeker/jobs"
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
                      href="/seeker/notifications"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold block"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link href="/seeker/profile" aria-label="Open profile" className="w-12 h-12 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center hover:opacity-90 transition-opacity">
              <span className="text-white text-xs sm:text-[10px] font-bold">{userInitials}</span>
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
