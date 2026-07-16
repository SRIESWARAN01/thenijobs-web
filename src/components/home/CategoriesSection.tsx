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
  Grid,
  ChevronRight
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const categoryDefs = [
  { label: 'Agriculture', tamil: 'விவசாயம்', slugs: ['agriculture'], href: '/businesses?category=Agriculture', color: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400', icon: Sprout },
  { label: 'Construction', tamil: 'கட்டிடம்', slugs: ['construction'], href: '/businesses?category=Construction', color: 'bg-amber-500/10 border border-amber-500/20 text-amber-400', icon: Building2 },
  { label: 'IT & Software', tamil: 'IT', slugs: ['it-software', 'it & software', 'it'], href: '/businesses?category=IT & Software', color: 'bg-blue-500/10 border border-blue-500/20 text-blue-400', icon: Laptop },
  { label: 'Healthcare', tamil: 'மருத்துவம்', slugs: ['healthcare'], href: '/businesses?category=Healthcare', color: 'bg-rose-500/10 border border-rose-500/20 text-rose-400', icon: HeartPulse },
  { label: 'Education', tamil: 'கல்வி', slugs: ['education'], href: '/businesses?category=Education', color: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400', icon: GraduationCap },
  { label: 'Textiles', tamil: 'ஜவுளி', slugs: ['textile', 'textiles'], href: '/businesses?category=Textile', color: 'bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400', icon: Package },
  { label: 'Manufacturing', tamil: 'தொழிற்சாலை', slugs: ['manufacturing'], href: '/businesses?category=Manufacturing', color: 'bg-orange-500/10 border border-orange-500/20 text-orange-400', icon: Wrench },
  { label: 'Retail', tamil: 'கடை', slugs: ['retail'], href: '/businesses?category=Retail', color: 'bg-lime-500/10 border border-lime-500/20 text-lime-400', icon: Store },
  { label: 'Transport', tamil: 'போக்குவரத்து', slugs: ['transport', 'transportation'], href: '/businesses?category=Transportation', color: 'bg-sky-500/10 border border-sky-500/20 text-sky-400', icon: Truck },
  { label: 'Finance', tamil: 'நிதி', slugs: ['finance'], href: '/businesses?category=Finance', color: 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400', icon: Landmark },
  { label: 'Hospitality', tamil: 'விருந்தோம்பல்', slugs: ['hospitality', 'food & beverage'], href: '/businesses?category=Hospitality', color: 'bg-red-500/10 border border-red-500/20 text-red-400', icon: BriefcaseBusiness },
  { label: 'Others', tamil: 'இதர பிரிவுகள்', slugs: [], href: '/businesses', color: 'bg-slate-500/10 border border-slate-500/20 text-slate-300', icon: Grid },
];

interface CategoryStats {
  businesses: number;
  jobs: number;
}

export default function CategoriesSection() {
  const [stats, setStats] = useState<Record<string, CategoryStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchCategoryMetrics() {
      try {
        setLoading(true);
        // Fetch all active companies and active jobs in single parallel request to save Firestore reads and offer rapid loading
        const [companiesSnap, jobsSnap] = await Promise.all([
          getDocs(query(collection(db, 'companies'), where('isActive', '==', true))),
          getDocs(query(collection(db, 'jobs'), where('isActive', '==', true)))
        ]);

        if (cancelled) return;

        const companyList = companiesSnap.docs.map(doc => doc.data());
        const jobList = jobsSnap.docs.map(doc => doc.data());

        const tempStats: Record<string, CategoryStats> = {};
        
        // Initialize stats object
        categoryDefs.forEach(cat => {
          tempStats[cat.label] = { businesses: 0, jobs: 0 };
        });

        // Accumulate company metrics
        companyList.forEach(company => {
          const rawCat = String(company.category || '').toLowerCase().trim();
          let matched = false;

          for (const cat of categoryDefs) {
            if (cat.label === 'Others') continue;
            if (cat.slugs.some(s => s === rawCat || rawCat.includes(s))) {
              tempStats[cat.label].businesses += 1;
              matched = true;
              break;
            }
          }

          if (!matched) {
            tempStats['Others'].businesses += 1;
          }
        });

        // Accumulate active job metrics
        jobList.forEach(job => {
          const rawCat = String(job.category || '').toLowerCase().trim();
          let matched = false;

          for (const cat of categoryDefs) {
            if (cat.label === 'Others') continue;
            if (cat.slugs.some(s => s === rawCat || rawCat.includes(s))) {
              tempStats[cat.label].jobs += 1;
              matched = true;
              break;
            }
          }

          if (!matched) {
            tempStats['Others'].jobs += 1;
          }
        });

        setStats(tempStats);
      } catch (err) {
        console.error('Error fetching category counts:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoryMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-4 py-12 sm:px-6 bg-[#0a0a1a]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Popular Categories</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-white sm:text-3xl tracking-tight" style={{ fontSize: 'clamp(1.35rem, 3vw + 0.25rem, 1.875rem)' }}>
              Jobs & Businesses by Industry
            </h2>
            <p className="mt-1 text-sm text-slate-400">Dynamically updated live business listings and active careers count.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categoryDefs.map((cat) => {
            const Icon = cat.icon;
            const categoryData = stats[cat.label];

            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:bg-white/[0.04] p-4 sm:p-5 shadow-xl transition-all duration-300 flex flex-col justify-between min-w-0"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl ${cat.color} group-hover:scale-105 transition-transform`}>
                      <Icon size={20} />
                    </span>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <span className="block text-sm sm:text-base font-bold text-white group-hover:text-violet-300 transition-colors leading-tight">
                    {cat.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 font-semibold">{cat.tamil}</span>
                </div>

                <div className="mt-4 sm:mt-6 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
                  <div className="text-slate-400">
                    Businesses:{' '}
                    <span className="text-white">
                      {loading ? (
                        <span className="inline-block h-3 w-4 animate-pulse rounded bg-white/10" />
                      ) : (
                        categoryData?.businesses ?? 0
                      )}
                    </span>
                  </div>
                  <div className="text-violet-400">
                    Jobs:{' '}
                    <span className="text-white">
                      {loading ? (
                        <span className="inline-block h-3 w-4 animate-pulse rounded bg-white/10" />
                      ) : (
                        categoryData?.jobs ?? 0
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
