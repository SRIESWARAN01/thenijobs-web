'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, MapPin, Package, Search, Store, Wrench } from 'lucide-react';
import { useLocations } from '@/hooks/useLocations';

const tabs = [
  {
    id: 'jobs',
    label: 'Jobs',
    tamil: 'வேலை',
    icon: Briefcase,
    placeholder: 'Driver, Teacher, Accountant...',
    tags: ['Tractor Driver', 'Teacher', 'Accounts', 'Security', 'Field Sales'],
    color: 'teal',
  },
  {
    id: 'businesses',
    label: 'Business',
    tamil: 'நிறுவனம்',
    icon: Building2,
    placeholder: 'Agro, textiles, school, hospital...',
    tags: ['Agriculture', 'Construction', 'Textiles', 'Healthcare', 'Education'],
    color: 'blue',
  },
  {
    id: 'services',
    label: 'Services',
    tamil: 'சேவை',
    icon: Wrench,
    placeholder: 'Plumbing, web design, accounting...',
    tags: ['Web Design', 'Legal', 'Accounting', 'Photography', 'Repair'],
    color: 'amber',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    tamil: 'Supplier',
    icon: Package,
    placeholder: 'Seeds, machinery, raw materials...',
    tags: ['Seeds', 'Fertilizer', 'Machinery', 'Packaging', 'Wholesale'],
    color: 'rose',
  },
];

const activeClass: Record<string, string> = {
  teal: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

export default function SearchHub() {
  const router = useRouter();
  const { allAreas } = useLocations();
  const [activeTab, setActiveTab] = useState('jobs');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('Theni');
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setQuery('');
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (location && location !== 'All Areas') params.set('location', location);

    const path = active.id === 'jobs'
      ? '/jobs'
      : active.id === 'services'
        ? '/services'
        : '/businesses';

    router.push(`${path}?${params.toString()}`);
  };

  return (
    <section className="px-4 py-8 sm:px-6 bg-[#0a0a1a]">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-4 shadow-2xl backdrop-blur-md sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Smart Search</p>
              <h2 className="mt-1 font-outfit text-2xl font-black text-white">
                நீங்கள் என்ன தேடுகிறீர்கள்?
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-slate-400">
              Job, company, service, supplier எல்லாத்தையும் ஒரே search flow-ல் கண்டுபிடிக்கலாம்.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="tablist" aria-label="Search type">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left transition-all hover:scale-[1.01] ${
                    isActive ? activeClass[tab.color] : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-white'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0f0f27] text-white shadow-inner">
                    <Icon size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{tab.label}</span>
                    <span className="block text-[10px] opacity-75">{tab.tamil}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_180px_auto]">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 focus-within:border-violet-500 focus-within:bg-white/[0.08] transition-all">
              <Search size={18} className="shrink-0 text-slate-500" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
                placeholder={active.placeholder}
                className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
              />
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4">
              <MapPin size={18} className="shrink-0 text-teal-400" />
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
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
              className="min-h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 px-6 text-sm font-bold text-white transition-all shadow-md active:scale-95"
            >
              தேடு
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold text-slate-500">Popular:</span>
            {active.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                  const params = new URLSearchParams({ search: tag });
                  if (location && location !== 'All Areas') params.set('location', location);
                  router.push(`${active.id === 'jobs' ? '/jobs' : active.id === 'services' ? '/services' : '/businesses'}?${params.toString()}`);
                }}
                className="rounded-full border border-white/5 bg-white/5 px-4 py-2 sm:px-3 sm:py-1.5 text-sm sm:text-xs font-bold text-slate-300 transition-colors hover:border-violet-500/30 hover:bg-white/10 hover:text-white"
              >
                {tag}
              </button>
            ))}
            <span className="ml-auto hidden items-center gap-1.5 text-xs text-slate-500 sm:flex">
              <Store size={14} />
              Business + Jobs combined search
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
