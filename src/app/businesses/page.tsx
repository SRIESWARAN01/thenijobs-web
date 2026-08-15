'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, BadgeCheck, Star,
  Briefcase, SlidersHorizontal, ArrowRight, Building2,
  MessageCircle, Phone
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const CATEGORIES = ['All', 'Agriculture', 'Construction', 'Education', 'Healthcare', 'IT & Software', 'Textiles', 'Manufacturing', 'Retail', 'Transport', 'Finance', 'Food & Beverage'];
const DISTRICTS = ['All', 'Theni', 'Madurai', 'Dindigul', 'Coimbatore', 'Salem', 'Chennai', 'Trichy'];

interface Business {
  id: string; slug: string; name: string; category: string;
  district: string; rating: number; reviews: number; jobs: number;
  isVerified: boolean; isPremium: boolean; tagline: string;
  logo: string; logoUrl?: string; coverUrl?: string; isNew: boolean; phone: string; whatsapp: string;
}

const BG_COLORS = ['#EFF6FF','#ECFDF5','#FFFBEB','#F5F3FF','#FFF1F2','#F0F9FF'];
const TEXT_COLORS = ['#2563EB','#059669','#D97706','#7C3AED','#E11D48','#0284C7'];

function BizCard({ biz }: { biz: Business }) {
  const idx = biz.name.charCodeAt(0) % BG_COLORS.length;
  const cleanPhone = (biz.phone || '').replace(/[^0-9+]/g, '');
  const cleanWa = (biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${biz.name} ${biz.district} Tamil Nadu`)}`;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col hover:shadow-md hover:border-blue-100 transition-all duration-200 group">
      {/* Cover Banner Image */}
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
          <span className="absolute top-2 right-2 z-20 text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-amber-400 text-amber-950 shadow-xs">
            ⭐ FEATURED
          </span>
        )}
      </div>

      <div className="p-5 pt-0 flex flex-col flex-1 gap-3 relative">
        {/* Logo Avatar */}
        <div className="-mt-7 mb-1 flex justify-between items-end">
          <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-md flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden bg-white"
            style={{ background: biz.logoUrl ? '#FFFFFF' : BG_COLORS[idx], color: TEXT_COLORS[idx] }}>
            {biz.logoUrl ? (
              <img src={biz.logoUrl} alt={biz.name} className="w-full h-full object-cover" />
            ) : (
              biz.logo
            )}
          </div>
          {biz.isNew && !biz.isPremium && (
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 mb-1">
              NEW
            </span>
          )}
        </div>

        {/* Company Title */}
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <h2 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors break-words">{biz.name}</h2>
            {biz.isVerified && <BadgeCheck size={16} className="text-emerald-500 flex-shrink-0" />}
          </div>
          {biz.tagline && <p className="text-xs text-gray-600 mt-1 line-clamp-2 break-words leading-relaxed">{biz.tagline}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{biz.category}</span>
          <span className="flex items-center gap-1 font-medium"><MapPin size={11} className="text-gray-400" />{biz.district}</span>
          {biz.rating > 0 && (
            <span className="flex items-center gap-1 font-medium">
              <Star size={11} className="fill-amber-400 text-amber-400" />
              {biz.rating.toFixed(1)} ({biz.reviews})
            </span>
          )}
          {biz.jobs > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <Briefcase size={11} />{biz.jobs} jobs
            </span>
          )}
        </div>

        {/* Contact CTAs (Call, WhatsApp, Google Maps) + View Profile */}
        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-gray-100">
          <div className="flex gap-1.5">
            {cleanPhone && (
              <a href={`tel:${cleanPhone}`}
                className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center gap-1 border border-blue-100"
                title="Call Company">
                <Phone size={13} /> Call
              </a>
            )}
            {cleanWa && (
              <a href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi, I found ${biz.name} on THENIJOBS. I would like to make an enquiry.`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1 shadow-xs"
                style={{ background: '#25D366' }}
                title="WhatsApp Enquiry">
                <MessageCircle size={13} /> WhatsApp
              </a>
            )}
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className="py-2 px-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all flex items-center justify-center gap-1 border border-amber-200"
              title="Google Maps Location">
              <MapPin size={13} /> Maps
            </a>
          </div>

          <Link href={`/company/${biz.slug}`}
            className="w-full text-xs font-bold text-white rounded-xl py-2.5 flex items-center justify-center gap-1.5 transition-all hover:opacity-90 shadow-sm"
            style={{ background: '#2563EB' }}>
            View Full Profile <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex-shrink-0" />
        <div className="flex-1">
          <div className="h-3.5 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="h-9 bg-gray-100 rounded-xl" />
    </div>
  );
}

export default function BusinessesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('premium');
  const [showFilters, setShowFilters] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusinesses() {
      try {
        const q = query(
          collection(db, 'companies'),
          where('verificationStatus', '==', 'verified'),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            slug: d.slug || doc.id,
            name: d.name || '',
            category: d.category || '',
            district: d.district || '',
            rating: d.rating || 0,
            reviews: d.reviewCount || 0,
            jobs: d.jobCount || 0,
            isVerified: d.isVerified || false,
            isPremium: d.isPremium || false,
            tagline: d.tagline || d.description || '',
            logo: d.name ? d.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() : 'B',
            logoUrl: d.logoUrl || d.logo || '',
            coverUrl: d.coverUrl || d.coverImage || '',
            isNew: d.createdAt ? (Date.now() - d.createdAt?.toMillis?.() < 7 * 24 * 60 * 60 * 1000) : false,
            phone: d.phone || '',
            whatsapp: d.whatsapp || d.phone || '' } as Business;
        });
        setBusinesses(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    loadBusinesses();
  }, []);

  const filtered = businesses
    .filter(b => {
      const q = search.toLowerCase();
      return (!q || b.name.toLowerCase().includes(q) || b.tagline.toLowerCase().includes(q) || b.category.toLowerCase().includes(q))
        && (selectedCategory === 'All' || b.category === selectedCategory)
        && (selectedDistrict === 'All' || b.district === selectedDistrict)
        && (!showVerifiedOnly || b.isVerified);
    })
    .sort((a, b) => {
      if (sortBy === 'premium') return (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0);
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'jobs') return b.jobs - a.jobs;
      return 0;
    });

  const activeFilters = (selectedCategory !== 'All' ? 1 : 0) + (selectedDistrict !== 'All' ? 1 : 0) + (showVerifiedOnly ? 1 : 0);

  return (
    <main style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Sticky search bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-2">
          <div className="flex-[1_1_220px] flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} type="text"
              placeholder="Search businesses, services, categories..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none" />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-400" /></button>}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
            <MapPin size={14} className="text-blue-500 flex-shrink-0" />
            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-sm text-gray-700 outline-none pr-1 w-24 cursor-pointer">
              {DISTRICTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              showFilters || activeFilters > 0
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: '#2563EB' }}>
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="max-w-6xl mx-auto mt-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedCategory === c
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                    className={`w-9 h-5 rounded-full relative transition-all cursor-pointer ${showVerifiedOnly ? 'bg-blue-600' : 'bg-gray-200'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${showVerifiedOnly ? 'left-4' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs text-gray-700 font-medium">Verified only</span>
                  <BadgeCheck size={12} className="text-emerald-500" />
                </label>
                {activeFilters > 0 && (
                  <button onClick={() => { setSelectedCategory('All'); setSelectedDistrict('All'); setShowVerifiedOnly(false); }}
                    className="text-xs text-red-500 font-semibold hover:text-red-600 flex items-center gap-1">
                    <X size={11} /> Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-8">
        {/* Stats + Sort */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-bold text-xl text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {loading ? 'Loading...' : `${filtered.length} Business${filtered.length !== 1 ? 'es' : ''}`}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedCategory !== 'All' ? selectedCategory : 'All categories'}
              {selectedDistrict !== 'All' ? ` in ${selectedDistrict}` : ' across Tamil Nadu'}
            </p>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 outline-none cursor-pointer">
            <option value="premium">Featured First</option>
            <option value="rating">Top Rated</option>
            <option value="jobs">Most Jobs</option>
          </select>
        </div>

        {/* Category pills */}
        <div className="-mx-4 sm:mx-0 overflow-x-auto no-scrollbar mb-5 px-4 sm:px-0">
          <div className="flex w-max gap-2">
            {CATEGORIES.slice(1).map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all ${
                  selectedCategory === cat
                    ? 'text-white border-transparent'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={selectedCategory === cat ? { background: '#2563EB' } : {}}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {businesses.length === 0 ? 'No businesses registered yet' : 'No businesses match your filters'}
            </h3>
            <p className="text-gray-500 text-sm mb-5 max-w-md mx-auto">
              {businesses.length === 0
                ? 'Be the first to register your business on THENIJOBS and get discovered by thousands of customers across Tamil Nadu.'
                : 'Try adjusting your filters to find what you are looking for.'
              }
            </p>
            {businesses.length === 0 ? (
              <Link href="/company/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-md"
                style={{ background: '#2563EB' }}>
                Register Your Business <ArrowRight size={15} />
              </Link>
            ) : (
              <button onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedDistrict('All'); setShowVerifiedOnly(false); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(biz => <BizCard key={biz.id} biz={biz} />)}
          </div>
        )}

        {/* Register CTA */}
        <div className="mt-10 rounded-3xl p-8 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 bg-white" style={{ transform: 'translate(30%, -30%)' }} />
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="font-bold text-white text-xl mb-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
            List Your Business Free
          </h3>
          <p className="text-blue-100 text-sm mb-5">Get your own SEO-optimized business page on THENIJOBS</p>
          <Link href="/company/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-blue-700 bg-white hover:bg-blue-50 transition-all">
            Register Now — It&apos;s Free <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
