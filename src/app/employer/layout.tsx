'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Building2, Briefcase, Users2, Calendar,
  Search, MessageSquare, BarChart3, CreditCard, Star,
  LogOut, ChevronLeft, ChevronRight, Menu, X, Bell,
  Plus, TrendingUp, Settings, Key, BadgeCheck,
  Clock, AlertTriangle, CheckCircle, ShieldAlert,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

const EMPLOYER_NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/employer/dashboard' },
  { label: 'Company Profile', icon: Building2, href: '/employer/company-profile' },
  { label: 'Post a Job', icon: Plus, href: '/employer/post-job', accent: true },
  { label: 'My Jobs', icon: Briefcase, href: '/employer/jobs' },
  { label: 'Candidates', icon: Users2, href: '/employer/candidates' },
  { label: 'Interviews', icon: Calendar, href: '/employer/interviews' },
  { label: 'Talent Search', icon: Search, href: '/employer/talent-search' },
  { label: 'Leads', icon: TrendingUp, href: '/employer/leads' },
  { label: 'Messages', icon: MessageSquare, href: '/employer/messages' },
  { label: 'Reports', icon: BarChart3, href: '/employer/reports' },
  { label: 'Billing', icon: CreditCard, href: '/employer/billing' },
  { label: 'Reviews', icon: Star, href: '/employer/reviews' },
  // AI-CONNECT-1: justified cascade, same reasoning as the seeker layout's own entry above --
  // without a nav link the new /employer/ai page would be unreachable by any real user.
  { label: 'AI Key Connection', icon: Key, href: '/employer/ai' },
  { label: 'Digital ID Card', icon: CreditCard, href: '/employer/id-card' },
  { label: 'Settings', icon: Settings, href: '/employer/settings' },
];

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useRequireAuth(['employer', 'business_owner']);
  const { unreadCount } = useNotifications();
  const { data: companies } = useCollection<any>('companies', [where('ownerId', '==', user?.uid || '')], { skip: !user?.uid });
  const company = companies?.[0];
  const subState = useSubscriptionStatus(company, user);
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (authLoading || (user && companies === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  // ── Pending Admin Approval Screen ─────────────────────────────────────────
  if (company && subState.isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
            <Clock size={32} className="text-amber-600" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
              ⏳ Pending Admin Approval
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-3">Registration Under Review</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Your business registration for <strong>&quot;{company.name}&quot;</strong> is being reviewed by THENIJOBS admin.
              Once approved, your 15-day Standard free trial will begin automatically.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">What happens next?</p>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>✓ Admin verifies your business details</li>
              <li>✓ 15-day Standard free trial starts from approval</li>
              <li>✓ Company website goes live immediately</li>
              <li>✓ You can post jobs and manage candidates</li>
            </ul>
          </div>
          <p className="text-xs text-gray-500">Typically approved within 2–4 hours on working days.</p>
          <button onClick={() => { signOut(auth); router.push('/'); }}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // ── Suspended / Trial Expired Screen ──────────────────────────────────────
  if (company && (subState.isSuspended || subState.isTrialExpired) && !subState.isPaidActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-red-200 shadow-xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} className="text-red-600" />
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-extrabold uppercase tracking-wider">
              🚫 Trial Expired — Upgrade Required
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-3">Your 15-Day Free Trial Has Ended</h1>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Your employer dashboard and company website have been temporarily suspended.
              All your data is safe. Activate a paid plan to restore access instantly.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <p className="text-xs font-bold text-slate-600 mb-1">Standard Plan</p>
              <p className="text-xl font-black text-gray-900">₹1,800<span className="text-xs font-normal text-gray-500">/year</span></p>
              <p className="text-[10px] text-gray-500 mt-1">10 jobs · 20 products · Full website</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3 border border-blue-200">
              <p className="text-xs font-bold text-blue-600 mb-1">Premium Plan ⭐</p>
              <p className="text-xl font-black text-gray-900">₹3,500<span className="text-xs font-normal text-gray-500">/year</span></p>
              <p className="text-[10px] text-gray-500 mt-1">50 jobs · 100 products · All features</p>
            </div>
          </div>
          <Link href="/employer/billing"
            className="block w-full py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-sm">
            💳 Activate Paid Plan Now
          </Link>
          <button onClick={() => { signOut(auth); router.push('/'); }}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const initials = user.displayName
    ? user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0]?.toUpperCase() || 'E');

  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300
        ${collapsed ? 'w-[68px]' : 'w-[240px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white border-r border-gray-100 shadow-sm`}
      >
        {/* Brand header */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          {!collapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>THENIJOBS</p>
                <p className="text-[10px] text-blue-600 font-semibold">Employer Portal</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-500 hover:text-gray-600">
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

        {/* Company info */}
        {!collapsed && company && (
          <div className="px-3 py-3 border-b border-gray-100">
            <Link
              href="/employer/company-profile"
              className="flex items-center gap-2.5 p-2 bg-slate-50/80 hover:bg-blue-50/80 rounded-2xl transition-all border border-slate-100 group"
              title="Manage Company Branding"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                {company.logoUrl || (company as any).companyLogo ? (
                  <img
                    src={company.logoUrl || (company as any).companyLogo}
                    alt={company.name || 'Company Logo'}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <span>{company.name?.[0]?.toUpperCase() || 'C'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {company.name}
                  </p>
                  {(company.verificationStatus === 'verified' || (company as any).isVerified) && (
                    <BadgeCheck size={13} className="text-blue-600 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                    company.verificationStatus === 'verified' ? 'bg-emerald-500' : 'bg-amber-400'
                  }`} />
                  <p className="text-[10px] text-gray-500 truncate capitalize font-medium">
                    {company.verificationStatus === 'verified' ? 'Verified Business' : 'Pending Review'}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
          {EMPLOYER_NAV.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/employer/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${active
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : (item as any).accent
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0"
                style={{ background: '#EFF6FF' }}>{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user.displayName || user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-500 truncate">Employer</p>
              </div>
            </div>
          )}
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <button onClick={handleLogout}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all ${collapsed ? '' : 'flex-1'}`}>
              <LogOut size={14} />
              {!collapsed && 'Sign Out'}
            </button>
            <button onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl border border-gray-200 text-slate-500 hover:text-gray-600 hover:border-gray-300 transition-all">
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex min-w-0 flex-1 flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'}`}>
        {/* Trial Countdown Banner */}
        {subState.isTrialActive && !subState.isPaidActive && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock size={14} className="shrink-0" />
              <p className="text-xs font-bold">
                🎉 Free Trial Active — <strong>{subState.trialDaysRemaining} day{subState.trialDaysRemaining !== 1 ? 's' : ''}</strong> remaining
                {subState.trialEndDate && (
                  <span className="font-normal opacity-90"> (expires {subState.trialEndDate.toLocaleDateString('en-IN')})</span>
                )}
              </p>
            </div>
            <Link href="/employer/billing"
              className="shrink-0 px-3 py-1 rounded-lg bg-white text-orange-600 text-[11px] font-bold hover:bg-orange-50 transition-all">
              💳 Pay Now — ₹1,800/year
            </Link>
          </div>
        )}

        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-gray-100 flex items-center px-4 gap-3">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-600">
            <Menu size={17} />
          </button>
          <div className="flex-1" />
          {/* Subscription status pill */}
          {subState.isPaidActive && (
            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
              <CheckCircle size={10} /> Active
            </span>
          )}
          {subState.isTrialActive && !subState.isPaidActive && (
            <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
              <Clock size={10} /> Trial · {subState.trialDaysRemaining}d left
            </span>
          )}
          <Link href="/employer/messages" className="relative p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all">
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

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
