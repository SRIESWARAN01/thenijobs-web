'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useRealtimeCount } from '@/hooks/useRealtimeStats';
import { where } from 'firebase/firestore';
import { getActivityLogs } from '@/lib/firebase/firestoreService';
import { useLocations } from '@/hooks/useLocations';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';

const quickActions = [
  { label: 'Jobs தேடுங்கள்', href: '/jobs', icon: Briefcase, className: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:opacity-90 shadow-lg shadow-teal-500/10' },
  { label: 'Business பார்க்க', href: '/businesses', icon: Building2, className: 'bg-white/5 text-white border border-white/10 hover:bg-white/10' },
  { label: 'Job Post', href: '/employer/post-job', icon: Send, className: 'bg-white/5 text-white border border-white/10 hover:bg-white/10' },
  { label: 'Business Add', href: '/company/register', icon: Sparkles, className: 'bg-white/5 text-white border border-white/10 hover:bg-white/10' },
];

export default function HeroSection() {
  const router = useRouter();
  const { allAreas } = useLocations();
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('Theni');
  const [updates, setUpdates] = useState<any[]>([]);

  const { count: activeJobs } = useRealtimeCount('jobs', [where('isActive', '==', true)]);
  const { count: totalCompanies } = useRealtimeCount('companies');
  const { count: totalUsers } = useRealtimeCount('users');

  useEffect(() => {
    async function fetchUpdates() {
      if (!user || !isAdmin) {
        setUpdates([]);
        return;
      }
      try {
        const logs = await getActivityLogs(3);
        if (logs && logs.length > 0) {
          setUpdates(logs.map(log => ({
            title: log.action || 'Platform Update',
            meta: `${log.target || ''} ${log.userName ? `by ${log.userName}` : ''}`,
            badge: 'Live'
          })));
        } else {
          setUpdates([]);
        }
      } catch {
        setUpdates([]);
      }
    }
    fetchUpdates();
  }, [user, isAdmin]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (locationFilter && locationFilter !== 'All Areas') {
      params.set('location', locationFilter);
    }
    router.push(`/jobs?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const statsList = [
    { value: activeJobs.toLocaleString('en-IN'), label: t('home.statsJobs') },
    { value: totalCompanies.toLocaleString('en-IN'), label: t('home.statsCompanies') },
    { value: totalUsers.toLocaleString('en-IN'), label: t('home.statsSeekers') },
  ];

  return (
    <section className="relative overflow-hidden bg-theme-main px-4 pb-12 pt-24 sm:px-6 lg:pb-16 lg:pt-32 border-b border-theme text-theme-body">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 rounded-full blur-[120px] pointer-events-none opacity-20" style={{ backgroundColor: 'var(--theme-primary)', width: 'clamp(200px, 40vw, 384px)', height: 'clamp(200px, 40vw, 384px)' }} />
      <div className="absolute top-1/3 right-1/4 rounded-full blur-[100px] pointer-events-none opacity-20" style={{ backgroundColor: 'var(--theme-accent)', width: 'clamp(180px, 35vw, 350px)', height: 'clamp(180px, 35vw, 350px)' }} />
      
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-theme bg-theme-card px-3.5 py-1.5 text-xs font-bold text-theme-primary shadow-sm backdrop-blur-md">
            <ShieldCheck size={14} className="text-theme-primary" />
            Theni local jobs + business directory
          </div>

          <h1 className="max-w-3xl font-outfit font-extrabold text-white tracking-tight" style={{ fontSize: 'clamp(1.75rem, 4vw + 0.5rem, 3.75rem)', lineHeight: 1.08 }}>
            {t('home.heroTitle')}
          </h1>

          <p className="mt-5 max-w-2xl text-sm sm:text-base leading-7 text-slate-450">
            {t('home.heroSubtitle')}
          </p>

          <div className="mt-7 rounded-2xl border border-theme bg-theme-card p-3 shadow-2xl backdrop-blur-md">
            <div className="grid gap-2 sm:grid-cols-[1fr_180px] md:grid-cols-[1fr_180px_auto]">
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-theme bg-white/5 px-4 focus-within:border-[var(--theme-primary)] focus-within:bg-white/[0.08] transition-all">
                <Search size={18} className="shrink-0 text-slate-500" />
                <input
                  type="search"
                  placeholder="Job, company, service தேடுங்கள்"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-500"
                />
              </label>

              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-theme bg-white/5 px-4">
                <MapPin size={18} className="shrink-0 text-theme-primary" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-slate-300 outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  {allAreas.map((area) => (
                    <option key={area} value={area} className="bg-[#0f0f27] text-white">{area}</option>
                  ))}
                  <option className="bg-[#0f0f27] text-white">All Areas</option>
                </select>
              </label>

              <button
                type="button"
                onClick={handleSearch}
                className="min-h-12 rounded-xl btn-theme-primary px-6 text-sm font-bold transition-all shadow-lg active:scale-95 cursor-pointer sm:col-span-2 md:col-span-1"
              >
                Search
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95 ${action.className}`}
                >
                  <Icon size={16} />
                  {action.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 grid gap-3 grid-cols-3">
            {statsList.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 sm:p-4 backdrop-blur-md min-w-0">
                <div className="text-lg sm:text-2xl font-black text-white truncate">{stat.value}</div>
                <div className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative w-full">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-3 shadow-2xl backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-all duration-500 premium-animated-banner">
            <div className="absolute -inset-x-20 -top-20 h-40 w-40 rounded-full bg-violet-600/20 blur-3xl pointer-events-none group-hover:bg-violet-600/30 transition-all" />
            <div className="glow-sweep-line" />
            <div className="overflow-hidden rounded-[1.4rem] bg-slate-900/50">
              <Image
                src="/thenijobs-platform-preview.png"
                alt="THENIJOBS mobile and laptop friendly business discovery preview"
                width={1100}
                height={820}
                priority
                className="h-auto w-full group-hover:scale-[1.01] transition-transform duration-700"
              />
            </div>

            <div className="grid gap-3 p-3 grid-cols-3">
              <a href="tel:+919360519460" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/20 px-3 py-2 text-xs font-bold text-teal-300 transition-colors">
                <Phone size={14} />
                Call
              </a>
              <a href="https://wa.me/917094826586" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors">
                <MessageCircle size={14} />
                WhatsApp
              </a>
              <Link href="/businesses" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 px-3 py-2 text-xs font-bold text-amber-300 transition-colors">
                <Navigation size={14} />
                Direction
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Live local updates</h2>
                <p className="text-xs text-slate-500">Jobs, services, offers</p>
              </div>
              <BadgeCheck size={20} className="text-teal-400" />
            </div>
            <div className="space-y-2">
              {updates.length === 0 ? (
                <div className="rounded-xl bg-white/5 p-3 text-xs font-semibold text-slate-400">
                  Live activity from jobs, leads and company approvals will appear here.
                </div>
              ) : (
                updates.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-white">{item.title}</p>
                      <p className="truncate text-[10px] text-slate-400">{item.meta}</p>
                    </div>
                    <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[9px] font-bold text-teal-300 border border-teal-500/20 shrink-0">
                      {item.badge}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link href="/businesses" className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors">
              Explore platform <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
