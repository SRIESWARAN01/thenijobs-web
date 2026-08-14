'use client';

import { useState } from 'react';
import { Briefcase, Building2, MapPin, Package, Search, Store, Wrench } from 'lucide-react';

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
  teal: 'border-teal-700 bg-teal-50 text-teal-800',
  blue: 'border-blue-700 bg-blue-50 text-blue-800',
  amber: 'border-amber-500 bg-amber-50 text-amber-800',
  rose: 'border-rose-500 bg-rose-50 text-rose-800',
};

export default function SearchHub() {
  const [activeTab, setActiveTab] = useState('jobs');
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-teal-700">Smart Search</p>
              <h2 className="mt-1 font-outfit text-2xl font-black text-slate-950">
                நீங்கள் என்ன தேடுகிறீர்கள்?
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-slate-500">
              Job, company, service, supplier எல்லாத்தையும் ஒரே search flow-ல் கண்டுபிடிக்கலாம்.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4" role="tablist" aria-label="Search type">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border px-3 text-left transition-colors ${
                    isActive ? activeClass[tab.color] : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">{tab.label}</span>
                    <span className="block text-xs font-bold opacity-75">{tab.tamil}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_180px_auto]">
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-teal-600 focus-within:bg-white">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                key={active.id}
                type="search"
                placeholder={active.placeholder}
                className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
            <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <MapPin size={18} className="shrink-0 text-teal-700" />
              <select className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none">
                <option>Theni</option>
                <option>Bodinayakanur</option>
                <option>Periyakulam</option>
                <option>Cumbum</option>
                <option>All Areas</option>
              </select>
            </label>
            <button
              type="button"
              className="min-h-12 rounded-2xl bg-teal-700 px-6 text-sm font-black text-white transition-colors hover:bg-teal-800"
            >
              தேடு
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-black text-slate-500">Popular:</span>
            {active.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
              >
                {tag}
              </button>
            ))}
            <span className="ml-auto hidden items-center gap-1 text-xs font-bold text-slate-400 sm:flex">
              <Store size={14} />
              Business + Jobs combined search
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
