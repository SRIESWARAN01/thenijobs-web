'use client';

import Link from 'next/link';
import { ChevronRight, BadgeCheck, Star, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

interface Company {
  id: string;
  slug: string;
  name: string;
  category: string;
  district: string;
  rating: number;
  reviews: number;
  jobs: number;
  isVerified: boolean;
  isPremium: boolean;
  tagline: string;
  logo: string;
  logoUrl?: string;
  coverUrl?: string;
}

function BusinessCard({ biz }: { biz: Company }) {
  const initials = biz.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
  const BG_COLORS = ['#EFF6FF', '#ECFDF5', '#FFFBEB', '#F5F3FF', '#FFF1F2', '#F0F9FF'];
  const TEXT_COLORS = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#E11D48', '#0284C7'];
  const colorIdx = biz.name.charCodeAt(0) % BG_COLORS.length;

  return (
    <Link href={`/company/${biz.slug || biz.id}`} className="block group">
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-100 transition-all duration-200 h-full flex flex-col">
        {/* Cover */}
        <div className="h-32 sm:h-36 w-full relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center">
          {biz.coverUrl ? (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center blur-xs opacity-25 scale-105"
                style={{ backgroundImage: `url(${biz.coverUrl})` }}
              />
              <img src={biz.coverUrl} alt={biz.name} className="relative z-10 w-full h-full object-contain object-center p-1" />
            </>
          ) : (
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
          )}
          {biz.isPremium && (
            <div className="absolute top-2 right-2 z-20 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-400 text-amber-950 shadow-xs">
              ⭐ PREMIUM
            </div>
          )}
        </div>

        <div className="px-4 pb-4 -mt-6 flex-1 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="w-12 h-12 rounded-xl border-2 border-white shadow-sm flex items-center justify-center font-bold text-base mb-2 overflow-hidden bg-white"
              style={{ background: biz.logoUrl ? '#FFFFFF' : BG_COLORS[colorIdx], color: TEXT_COLORS[colorIdx] }}>
              {biz.logoUrl ? (
                <img src={biz.logoUrl} alt={biz.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>

            {/* Name + verified */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors break-words line-clamp-1">
                {biz.name}
              </h3>
              {biz.isVerified && <BadgeCheck size={14} className="text-emerald-500 flex-shrink-0" />}
            </div>

            <p className="text-xs text-slate-600 font-medium mb-2 break-words line-clamp-1">{biz.category}</p>
          </div>

          <div>
            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-gray-700">{biz.rating?.toFixed(1) || '4.5'}</span>
              <span className="text-xs text-gray-400">({biz.reviews || 0})</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                <MapPin size={11} className="text-gray-400" />
                <span className="truncate">{biz.district || 'Theni'}</span>
              </div>
              {biz.jobs > 0 && (
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {biz.jobs} jobs
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-20 bg-gray-100" />
      <div className="px-4 pb-4 -mt-6">
        <div className="w-12 h-12 bg-gray-200 rounded-xl mb-2" />
        <div className="h-3.5 bg-gray-100 rounded w-2/3 mb-1.5" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function FeaturedBusinesses() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'companies'),
          where('verificationStatus', '==', 'verified'),
          where('isActive', '==', true),
          limit(8)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            slug: d.slug || doc.id,
            name: d.name || 'Company',
            category: d.category || 'Business',
            district: d.district || 'Theni',
            rating: d.rating || 4.5,
            reviews: d.reviewCount || 0,
            jobs: d.jobCount || 0,
            isVerified: d.isVerified || true,
            isPremium: d.isPremium || false,
            tagline: d.tagline || '',
            logo: d.name ? d.name.substring(0, 2).toUpperCase() : 'C',
            logoUrl: d.logoUrl || d.logo || '',
            coverUrl: d.coverUrl || d.coverImage || '' } as Company;
        });
        setCompanies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="py-14" style={{ background: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600 text-xs font-semibold mb-2">
              <BadgeCheck size={11} /> Verified Partners
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Featured Companies
            </h2>
            <p className="text-sm text-gray-500 mt-1">Top employers hiring in Theni &amp; Tamil Nadu</p>
          </div>
          <Link href="/businesses" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : companies.length > 0
              ? companies.map(c => <BusinessCard key={c.id} biz={c} />)
              : (
                <div className="col-span-4 py-16 text-center">
                  <Briefcase size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No verified companies yet</p>
                </div>
              )
          }
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/businesses" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all">
            View All Companies <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
