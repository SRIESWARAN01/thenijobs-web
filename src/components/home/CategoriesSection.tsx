'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Laptop,
  Package,
  Sprout,
  Store,
  Truck,
  Wrench,
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

const categoryDefs = [
  { label: 'Agriculture', tamil: 'விவசாயம்', href: '/businesses?category=agriculture', color: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400', icon: Sprout },
  { label: 'Construction', tamil: 'கட்டிடம்', href: '/businesses?category=construction', color: 'bg-amber-500/10 border border-amber-500/20 text-amber-400', icon: Building2 },
  { label: 'IT & Software', tamil: 'IT', href: '/businesses?category=it-software', color: 'bg-blue-500/10 border border-blue-500/20 text-blue-400', icon: Laptop },
  { label: 'Healthcare', tamil: 'மருத்துவம்', href: '/businesses?category=healthcare', color: 'bg-rose-500/10 border border-rose-500/20 text-rose-400', icon: HeartPulse },
  { label: 'Education', tamil: 'கல்வி', href: '/businesses?category=education', color: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400', icon: GraduationCap },
  { label: 'Textiles', tamil: 'ஜவுளி', href: '/businesses?category=textiles', color: 'bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400', icon: Package },
  { label: 'Manufacturing', tamil: 'தொழிற்சாலை', href: '/businesses?category=manufacturing', color: 'bg-orange-500/10 border border-orange-500/20 text-orange-400', icon: Wrench },
  { label: 'Retail', tamil: 'கடை', href: '/businesses?category=retail', color: 'bg-lime-500/10 border border-lime-500/20 text-lime-400', icon: Store },
  { label: 'Transport', tamil: 'போக்குவரத்து', href: '/businesses?category=transport', color: 'bg-sky-500/10 border border-sky-500/20 text-sky-400', icon: Truck },
  { label: 'Finance', tamil: 'நிதி', href: '/businesses?category=finance', color: 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400', icon: Landmark },
  { label: 'Services', tamil: 'சேவைகள்', href: '/services', color: 'bg-slate-500/10 border border-slate-500/20 text-slate-300', icon: BriefcaseBusiness },
];

export default function CategoriesSection() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      const results: Record<string, number> = {};
      await Promise.all(
        categoryDefs.map(async (cat) => {
          try {
            const categoryKey = cat.label.toLowerCase().replace(/\s*&\s*/g, '-').replace(/\s+/g, '-');
            if (cat.label === 'Services') {
              const snap = await getCountFromServer(collection(db, 'serviceProfiles'));
              results[cat.label] = snap.data().count;
            } else {
              const q = query(
                collection(db, 'companies'),
                where('category', '==', categoryKey)
              );
              const snap = await getCountFromServer(q);
              results[cat.label] = snap.data().count;
            }
          } catch {
            results[cat.label] = 0;
          }
        })
      );
      if (!cancelled) setCounts(results);
    }
    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="px-4 py-12 sm:px-6 bg-[#0a0a1a]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Browse Categories</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-white sm:text-3xl tracking-tight">
              Jobs + Businesses by Industry
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            Theni local market-க்கு முக்கியமான categories. Mobile-ல் swipe இல்லாமல் scan பண்ண easy.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categoryDefs.map((cat) => {
            const Icon = cat.icon;
            const count = counts[cat.label];
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:bg-white/[0.04] p-4 shadow-xl transition-all duration-300 relative overflow-hidden"
              >
                <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${cat.color} group-hover:scale-105 transition-transform`}>
                  <Icon size={20} />
                </span>
                <span className="block text-sm font-bold text-white group-hover:text-violet-300 transition-colors">{cat.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{cat.tamil}</span>
                <span className="mt-4 block text-xs font-bold text-violet-400">
                  {count !== undefined ? `${count} listings` : (
                    <span className="inline-block h-3 w-12 animate-pulse rounded bg-white/10" />
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
