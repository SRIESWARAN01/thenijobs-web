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
  { label: 'Agriculture', tamil: 'விவசாயம்', href: '/businesses?category=agriculture', color: 'bg-emerald-50 text-emerald-700', icon: Sprout },
  { label: 'Construction', tamil: 'கட்டிடம்', href: '/businesses?category=construction', color: 'bg-amber-50 text-amber-700', icon: Building2 },
  { label: 'IT & Software', tamil: 'IT', href: '/businesses?category=it-software', color: 'bg-blue-50 text-blue-700', icon: Laptop },
  { label: 'Healthcare', tamil: 'மருத்துவம்', href: '/businesses?category=healthcare', color: 'bg-rose-50 text-rose-700', icon: HeartPulse },
  { label: 'Education', tamil: 'கல்வி', href: '/businesses?category=education', color: 'bg-cyan-50 text-cyan-700', icon: GraduationCap },
  { label: 'Textiles', tamil: 'ஜவுளி', href: '/businesses?category=textiles', color: 'bg-fuchsia-50 text-fuchsia-700', icon: Package },
  { label: 'Manufacturing', tamil: 'தொழிற்சாலை', href: '/businesses?category=manufacturing', color: 'bg-orange-50 text-orange-700', icon: Wrench },
  { label: 'Retail', tamil: 'கடை', href: '/businesses?category=retail', color: 'bg-lime-50 text-lime-700', icon: Store },
  { label: 'Transport', tamil: 'போக்குவரத்து', href: '/businesses?category=transport', color: 'bg-sky-50 text-sky-700', icon: Truck },
  { label: 'Finance', tamil: 'நிதி', href: '/businesses?category=finance', color: 'bg-yellow-50 text-yellow-700', icon: Landmark },
  { label: 'Services', tamil: 'சேவைகள்', href: '/services', color: 'bg-slate-100 text-slate-700', icon: BriefcaseBusiness },
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
              // Count from services collection
              const snap = await getCountFromServer(collection(db, 'serviceProfiles'));
              results[cat.label] = snap.data().count;
            } else {
              // Count companies in this category
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
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-teal-700">Browse Categories</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
              Jobs + Businesses by industry
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Theni local market-க்கு முக்கியமான categories. Mobile-ல் swipe இல்லாமல் scan பண்ண easy.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categoryDefs.map((cat) => {
            const Icon = cat.icon;
            const count = counts[cat.label];
            return (
              <Link
                key={cat.label}
                href={cat.href}
                className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/40"
              >
                <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${cat.color}`}>
                  <Icon size={21} />
                </span>
                <span className="block text-sm font-black text-slate-950">{cat.label}</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">{cat.tamil}</span>
                <span className="mt-3 block text-xs font-black text-teal-700">
                  {count !== undefined ? `${count} listings` : (
                    <span className="inline-block h-3 w-12 animate-pulse rounded bg-slate-200" />
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
