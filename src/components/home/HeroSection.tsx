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
  { label: 'Jobs தேடுங்கள்', href: '/jobs', icon: Briefcase, className: 'bg-teal-700 text-white hover:bg-teal-800' },
  { label: 'Business பார்க்க', href: '/businesses', icon: Building2, className: 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50' },
  { label: 'Job Post', href: '/employer/post-job', icon: Send, className: 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50' },
  { label: 'Business Add', href: '/company/register', icon: Sparkles, className: 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50' },
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
    <section className="relative overflow-hidden bg-[#f6f8fb] px-4 pb-10 pt-24 sm:px-6 lg:pb-14 lg:pt-28">
      <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,#dff7ef_0%,rgba(246,248,251,0)_100%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-2 text-xs font-bold text-teal-800 shadow-sm">
            <ShieldCheck size={15} />
            Theni local jobs + business directory
          </div>

          <h1 className="max-w-3xl font-outfit text-4xl font-black leading-[1.08] text-slate-950 sm:text-5xl lg:text-6xl">
            {t('home.heroTitle')}
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {t('home.heroSubtitle')}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
            <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 focus-within:border-teal-500 focus-within:bg-white">
                <Search size={18} className="shrink-0 text-slate-400" />
                <input
                  type="search"
                  placeholder="Job, company, service தேடுங்கள்"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4">
                <MapPin size={18} className="shrink-0 text-teal-700" />
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                >
                  {allAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                  <option>All Areas</option>
                </select>
              </label>

              <button
                type="button"
                onClick={handleSearch}
                className="min-h-12 rounded-xl bg-slate-950 px-6 text-sm font-black text-white transition-colors hover:bg-teal-800"
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
                  className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition-colors ${action.className}`}
                >
                  <Icon size={17} />
                  {action.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {statsList.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-2xl font-black text-slate-950">{stat.value}</div>
                <div className="mt-1 text-xs font-bold uppercase text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
            <div className="overflow-hidden rounded-[1.4rem] bg-slate-100">
              <Image
                src="/thenijobs-platform-preview.png"
                alt="THENIJOBS mobile and laptop friendly business discovery preview"
                width={1100}
                height={820}
                priority
                className="h-auto w-full"
              />
            </div>

            <div className="grid gap-3 p-3 sm:grid-cols-3">
              <a href="tel:+919360519460" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-xs font-black text-teal-800">
                <Phone size={15} />
                Call
              </a>
              <a href="https://wa.me/917094826586" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
                <MessageCircle size={15} />
                WhatsApp
              </a>
              <Link href="/businesses" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
                <Navigation size={15} />
                Direction
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-950">Live local updates</h2>
                <p className="text-xs font-medium text-slate-500">Jobs, services, offers</p>
              </div>
              <BadgeCheck size={20} className="text-teal-700" />
            </div>
            <div className="space-y-2">
              {updates.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">
                  Live activity from jobs, leads and company approvals will appear here.
                </div>
              ) : (
                updates.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{item.meta}</p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-teal-700 ring-1 ring-teal-100 shrink-0">
                      {item.badge}
                    </span>
                  </div>
                ))
              )}
            </div>
            <Link href="/businesses" className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">
              Explore platform <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
