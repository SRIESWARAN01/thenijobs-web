'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import StickySearchBar from '@/components/search/StickySearchBar';
import ChipScroller from '@/components/search/ChipScroller';
import {
  MapPin, X, BadgeCheck, Star,
  ArrowRight, Building2,
  MessageCircle, Phone, Rocket,
} from 'lucide-react';
import { collection, getDocs, query, where, limit as fbLimit } from 'firebase/firestore';

// PERF-3: an explicit ceiling on a public list read. It used to fetch every matching
// document. Measured against production on 2026-09-05: 2 active jobs and 104 verified
// companies, so this ceiling is far above real data and no visitor loses a result today.
// No orderBy is added on purpose: zero job documents carry `postedAt` and only one of the
// two carries `createdAt`, and Firestore's orderBy drops every document missing the field
// it sorts on, so ordering here would hide a live job. Sorting stays client-side, where a
// missing timestamp falls back instead of vanishing.
const PUBLIC_LIST_LIMIT = 500;
import { db } from '@/lib/firebase/config';
import { slugifyCompany } from '@/lib/companySlug';

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
// Per-business gradient used as the cover-banner fallback when a company hasn't uploaded a cover photo —
// keeps the same index as TEXT_COLORS so a business's empty-state banner and avatar initials share a hue.
// The avatar's own fill stays solid white regardless (see BizCard) so it never blends into this banner.
const BANNER_GRADIENTS = [
  'linear-gradient(135deg, #2563EB, #1E3A8A)',
  'linear-gradient(135deg, #059669, #065F46)',
  'linear-gradient(135deg, #D97706, #92400E)',
  'linear-gradient(135deg, #7C3AED, #4C1D95)',
  'linear-gradient(135deg, #E11D48, #881337)',
  'linear-gradient(135deg, #0284C7, #075985)',
];

function BizCard({ biz }: { biz: Business }) {
  const idx = biz.name.charCodeAt(0) % BG_COLORS.length;
  const cleanPhone = (biz.phone || '').replace(/[^0-9+]/g, '');
  const cleanWa = (biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${biz.name} ${biz.district} Tamil Nadu`)}`;
  const [coverBroken, setCoverBroken] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);

  return (
    <div className={`bg-white rounded-2xl overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group border ${
      biz.isPremium ? 'border-amber-200' : 'border-gray-100 hover:border-blue-100'
    }`}>
      {/* Cover Banner Image — fills the full banner (object-cover); falls back to a branded
          gradient both when there's no cover photo AND when the stored URL fails to load.
          The dominant element of the card — text/CTA footer below is kept to a slim strip. */}
      <div className="h-40 sm:h-48 w-full relative overflow-hidden">
        {biz.coverUrl && !coverBroken ? (
          <img
            src={biz.coverUrl}
            alt={biz.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setCoverBroken(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: BANNER_GRADIENTS[idx] }}>
            <Building2 size={48} className="text-white/25" strokeWidth={1.5} />
          </div>
        )}
        {biz.isPremium && (
          <span className="absolute top-2 right-2 z-20 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-extrabold bg-amber-400 text-amber-950 shadow-xs">
            <Star size={9} fill="currentColor" strokeWidth={0} /> FEATURED
          </span>
        )}
        {biz.isNew && !biz.isPremium && (
          <span className="absolute top-2 right-2 z-20 text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500 text-white shadow-xs">
            NEW
          </span>
        )}
      </div>

      {/* Slim text + CTA footer — name/tagline compressed to single lines, all CTAs in one row.
          Logo avatar sits fully inside this footer (not overlapping the banner above) — an
          overlapping avatar can't guarantee contrast against an arbitrary uploaded cover photo,
          only against the fallback gradient, so it's kept on the guaranteed-white footer instead. */}
      <div className="px-3 pt-2 pb-2.5 flex flex-col flex-1 gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-9 h-9 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden bg-white"
            style={{ color: TEXT_COLORS[idx] }}>
            {biz.logoUrl && !logoBroken ? (
              <img src={biz.logoUrl} alt={biz.name} className="w-full h-full object-cover" onError={() => setLogoBroken(true)} />
            ) : (
              biz.logo
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <h2 className="font-bold text-gray-900 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors">{biz.name}</h2>
          {biz.isVerified && <BadgeCheck size={13} className="text-emerald-500 flex-shrink-0" />}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-500">
          <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{biz.category}</span>
          <span className="flex items-center gap-1 font-medium"><MapPin size={9} className="text-gray-400" />{biz.district}</span>
          {biz.rating > 0 && (
            <span className="flex items-center gap-1 font-medium">
              <Star size={9} className="fill-amber-400 text-amber-400" />
              {biz.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Contact CTAs (Call, WhatsApp, Google Maps) — compact icon-only, plus View Profile,
            all in a single row so the footer stays a slim strip under the dominant banner.
            tap-target-auto opts these out of the site-wide 44px min-tap-target rule
            (globals.css `@media (pointer: coarse)`) — sized deliberately smaller here. */}
        <div className="flex items-center gap-1.5 mt-auto pt-1.5">
          {cleanPhone && (
            <a href={`tel:${cleanPhone}`}
              className="tap-target-auto w-8 h-8 shrink-0 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center border border-blue-100"
              title="Call Company" aria-label="Call">
              <Phone size={14} />
            </a>
          )}
          {cleanWa && (
            <a href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi, I found ${biz.name} on THENIJOBS. I would like to make an enquiry.`)}`}
              target="_blank" rel="noopener noreferrer"
              className="tap-target-auto w-8 h-8 shrink-0 rounded-lg text-white transition-all flex items-center justify-center shadow-xs"
              style={{ background: '#25D366' }}
              title="WhatsApp Enquiry" aria-label="WhatsApp">
              <MessageCircle size={14} />
            </a>
          )}
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
            className="tap-target-auto w-8 h-8 shrink-0 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all flex items-center justify-center border border-amber-200"
            title="Google Maps Location" aria-label="Maps">
            <MapPin size={14} />
          </a>

          <Link href={`/company/${biz.slug}`}
            className="flex-1 text-[11px] font-bold text-white rounded-lg py-2 flex items-center justify-center gap-1 transition-all hover:opacity-90 shadow-sm"
            style={{ background: '#2563EB' }}>
            View Profile <ArrowRight size={11} />
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
  // PERF-3: true when the read hit PUBLIC_LIST_LIMIT, so the page can say so instead of
  // silently truncating. A seeker who cannot see a job cannot apply for it.
  const [capped, setCapped] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 10000);

    async function loadBusinesses() {
      try {
        const q = query(
          collection(db, 'companies'),
          where('verificationStatus', '==', 'verified'),
          where('isActive', '==', true),
          fbLimit(PUBLIC_LIST_LIMIT)
        );
        const snapshot = await getDocs(q);
        if (cancelled) return;
        setCapped(snapshot.size >= PUBLIC_LIST_LIMIT);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            slug: d.slug || slugifyCompany(d.name || doc.id),
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
      finally { clearTimeout(timeout); if (!cancelled) setLoading(false); }
    }
    loadBusinesses();

    return () => { cancelled = true; clearTimeout(timeout); };
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

      {/* Sticky search bar — canonical system shared with the Jobs page (src/components/search).
          No redundant top offset needed: Header already reserves its own 64px spacer. */}
      <StickySearchBar
        searchId="biz-directory-search"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search businesses, services, categories..."
        location={{ value: selectedDistrict, onChange: setSelectedDistrict, options: DISTRICTS }}
        filterActiveCount={activeFilters}
        filterOpen={showFilters}
        onFilterClick={() => setShowFilters(!showFilters)}
        maxWidthClassName="max-w-6xl"
      >
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
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
      </StickySearchBar>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-8">
        {/* Stats + Sort */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-bold text-xl text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {loading ? 'Loading...' : `${filtered.length} Business${filtered.length !== 1 ? 'es' : ''}`}
              {capped && !loading && (
                <span className="ml-1 text-xs font-normal text-gray-500">
                  {' '}· first {PUBLIC_LIST_LIMIT.toLocaleString()} shown
                </span>
              )}
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

        {/* Category chips */}
        <ChipScroller
          className="mb-5"
          items={CATEGORIES.slice(1)}
          isActive={cat => selectedCategory === cat}
          onSelect={cat => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
        />

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
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
            <Rocket size={22} className="text-white" strokeWidth={2.25} />
          </div>
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
