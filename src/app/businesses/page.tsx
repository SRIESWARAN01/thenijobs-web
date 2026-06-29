'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, BadgeCheck, Star,
  Briefcase, SlidersHorizontal, ArrowRight, Building2,
  Navigation, MessageCircle, Phone, Loader2
} from 'lucide-react';
import { getPublicCompanies, getActiveServices } from '@/lib/firebase/firestoreService';
import { useLocations } from '@/hooks/useLocations';
import { matchesSearch, scoreSearchMatch } from '@/lib/search';
import { Select } from '@/components/ui/Select';
import { getCompanyPortfolioPath } from '@/lib/companyPortfolio';

const CATEGORIES = ['All', 'Agriculture', 'Construction', 'Education', 'Healthcare', 'IT & Software', 'Textiles', 'Manufacturing', 'Retail', 'Transport', 'Finance', 'Food & Beverage'];

const SORT_OPTIONS = [
  { value: 'premium', label: 'Featured First' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'jobs', label: 'Most Jobs' },
  { value: 'new', label: 'Newest' },
];

interface Business {
  id: string;
  slug: string;
  portfolioPath: string;
  name: string;
  category: string;
  description: string;
  services: string[];
  district: string;
  location: string;
  rating: number;
  reviews: number;
  jobs: number;
  isVerified: boolean;
  isPremium: boolean;
  tagline: string;
  logo: string;
  isNew: boolean;
  phone: string;
  whatsapp: string;
}

export default function BusinessesPage() {
  const { allAreas } = useLocations();
  const districtOptions = useMemo(() => {
    return [{ value: 'All', label: 'All Areas' }, ...allAreas.map(d => ({ value: d, label: d }))];
  }, [allAreas]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('premium');
  const [showFilters, setShowFilters] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Load businesses from Firestore
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('q') || params.get('search');
      const locationParam = params.get('location');
      if (searchParam) setSearch(searchParam);
      if (locationParam) setSelectedDistrict(locationParam);
    }

    async function loadBusinesses() {
      try {
        const [companies, activeServices] = await Promise.all([
          getPublicCompanies(),
          getActiveServices()
        ]);

        const data = companies
          .map(company => {
            const d = company;
            // Get dynamically approved services for this company
            const dbServices = activeServices
              .filter((s: any) => s.providerId === company.ownerId)
              .map((s: any) => s.name);
            
            const legacyServices = Array.isArray(d.services) ? d.services : [];
            const mergedServices = Array.from(new Set([...dbServices, ...legacyServices]));

            return {
              id: d.id,
              slug: d.slug || d.id,
              portfolioPath: getCompanyPortfolioPath(d),
              name: d.name || '',
              category: d.category || '',
              description: d.description || '',
              services: mergedServices,
              district: d.district || 'Local Area',
              location: d.location || d.locality || d.town || d.district || 'Local Area',
              rating: d.rating || 0,
              reviews: d.reviewCount || 0,
              jobs: d.jobCount || 0,
              isVerified: d.isVerified || d.verificationStatus === 'verified' || d.status === 'approved' || d.verificationBadges?.businessVerified || false,
              isPremium: d.isPremium || d.isFeatured || false,
              tagline: d.tagline || d.description?.substring(0, 80) || '',
              logo: d.name ? d.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() : 'B',
              isNew: d.createdAt ? (Date.now() - d.createdAt?.toMillis?.() < 7 * 24 * 60 * 60 * 1000) : false,
              phone: d.phone || '',
              whatsapp: d.whatsapp || d.phone || '',
            } as Business;
          });
        setBusinesses(data);
      } catch (err) {
        console.error('Error loading businesses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBusinesses();
  }, []);

  const filtered = businesses
    .filter(b => {
      const matchSearch = matchesSearch(search, [
        { value: b.name, weight: 3 },
        { value: b.category, weight: 2 },
        b.tagline,
        b.description,
        b.services,
      ]);
      const matchCat = selectedCategory === 'All' || b.category === selectedCategory;
      const matchDist = selectedDistrict === 'All' || b.location === selectedDistrict || b.district === selectedDistrict;
      const matchVerified = !showVerifiedOnly || b.isVerified;
      return matchSearch && matchCat && matchDist && matchVerified;
    })
    .sort((a, b) => {
      if (search.trim()) {
        return scoreSearchMatch(search, [
          { value: b.name, weight: 3 },
          { value: b.category, weight: 2 },
          b.tagline,
          b.description,
          b.services,
        ]) - scoreSearchMatch(search, [
          { value: a.name, weight: 3 },
          { value: a.category, weight: 2 },
          a.tagline,
          a.description,
          a.services,
        ]);
      }
      if (sortBy === 'premium') return (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0);
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'jobs') return b.jobs - a.jobs;
      if (sortBy === 'new') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return 0;
    });

  const activeFilters = (selectedCategory !== 'All' ? 1 : 0) + (selectedDistrict !== 'All' ? 1 : 0) + (showVerifiedOnly ? 1 : 0);

  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <Header />

      {/* Sticky Search */}
      <div className="sticky top-16 z-40 glass-nav border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2">
          <div className="min-w-0 flex-[1_1_220px] flex items-center gap-2 search-input px-4 py-2.5">
            <Search size={15} className="text-gray-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} type="text"
              placeholder="Search businesses, services, categories..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-500" /></button>}
          </div>
          <Select
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            options={districtOptions}
            placeholder="All Areas"
            className="w-36 flex-1 sm:flex-none min-w-[9rem]"
          />
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border
              ${showFilters || activeFilters > 0 ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
          </button>
        </div>

        {showFilters && (
          <div className="max-w-5xl mx-auto mt-3 glass-card rounded-2xl p-4 border border-white/10">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${selectedCategory === c ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                  className={`w-9 h-5 rounded-full relative transition-all ${showVerifiedOnly ? 'bg-violet-600' : 'bg-white/20'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${showVerifiedOnly ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
                <span className="text-xs text-gray-300">Verified businesses only</span>
                <BadgeCheck size={12} className="text-emerald-400" />
              </label>
              {activeFilters > 0 && (
                <button onClick={() => { setSelectedCategory('All'); setSelectedDistrict('All'); setShowVerifiedOnly(false); }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                  <X size={11} /> Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">

        <div className="glass-card rounded-2xl p-5 mb-6 border border-emerald-500/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 text-emerald-400 text-xs font-bold uppercase">
                <Navigation size={14} /> Map Search
              </div>
              <h2 className="font-outfit font-bold text-white text-lg">Near me businesses</h2>
              <p className="text-sm text-gray-400 mt-1">
                Location wise jobs/businesses பாருங்கள். Direction button மூலம் Google Maps-க்கு போகலாம்.
              </p>
            </div>
            <button
              onClick={() => setSelectedDistrict(allAreas[0] || 'All')}
              className="btn-gradient px-5 py-3 rounded-xl text-sm font-semibold relative z-10 flex items-center justify-center gap-2"
            >
              <MapPin size={15} /> Use Primary Area
            </button>
          </div>
        </div>

        {/* Stats + Sort */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-outfit font-bold text-xl text-white">
              {loading ? 'Loading...' : `${filtered.length} Business${filtered.length !== 1 ? 'es' : ''}`}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedCategory !== 'All' ? selectedCategory : 'All categories'}
              {selectedDistrict !== 'All' ? ` in ${selectedDistrict}` : ' across all areas'}
            </p>
          </div>
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
            placeholder="Sort by"
            className="w-40"
          />
        </div>

        {/* Category quick pills */}
        <div className="-mx-4 sm:mx-0 overflow-x-auto no-scrollbar mb-6 px-4 sm:px-0">
          <div className="flex w-max gap-2">
          {CATEGORIES.slice(1).map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all shrink-0
                ${selectedCategory === cat ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
              {cat}
            </button>
          ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Loader2 size={32} className="text-violet-400 mx-auto mb-4 animate-spin" />
            <p className="text-sm text-gray-400">Loading businesses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Building2 size={28} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {businesses.length === 0 ? 'No businesses registered yet' : 'No businesses match your filters'}
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              {businesses.length === 0
                ? 'Be the first to register your business on THENIJOBS and get discovered by local customers.'
                : 'Try adjusting your search or filters to find what you are looking for.'
              }
            </p>
            {businesses.length === 0 ? (
              <Link href="/company/register" className="btn-gradient px-6 py-3 rounded-2xl text-sm font-semibold relative z-10 inline-flex items-center gap-2">
                Register Your Business <ArrowRight size={15} />
              </Link>
            ) : (
              <button onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedDistrict('All'); setShowVerifiedOnly(false); }}
                className="btn-outline-glass px-5 py-2 rounded-xl text-sm font-medium">Clear Filters</button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(biz => (
              <div key={biz.id} className="premium-card rounded-2xl p-5 flex flex-col gap-4 group">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-violet-400 shrink-0">
                    {biz.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="font-semibold text-white text-sm leading-tight truncate">{biz.name}</h2>
                          {biz.isVerified && <BadgeCheck size={14} className="text-emerald-400 shrink-0" />}
                        </div>
                        {biz.isPremium && <span className="badge-premium text-[9px] mt-0.5 inline-block">FEATURED</span>}
                        {biz.isNew && !biz.isPremium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-bold inline-block mt-0.5">NEW</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{biz.tagline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="text-violet-400 font-medium">{biz.category}</span>
                  <span className="flex items-center gap-1"><MapPin size={10} />{biz.location}</span>
                  {biz.rating > 0 && <span className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" />{biz.rating} ({biz.reviews})</span>}
                  {biz.jobs > 0 && <span className="flex items-center gap-1 text-cyan-400"><Briefcase size={10} />{biz.jobs} jobs</span>}
                </div>

                <div className="flex gap-2 mt-auto">
                  <Link href={biz.portfolioPath}
                    className="flex-1 btn-gradient py-2.5 rounded-xl text-xs font-semibold relative z-10 text-center flex items-center justify-center gap-1.5">
                    View Profile <ArrowRight size={12} />
                  </Link>
                  {biz.phone && (
                    <a href={`tel:${biz.phone}`} className="btn-outline-glass px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1" aria-label={`Call ${biz.name}`}>
                      <Phone size={12} />
                    </a>
                  )}
                  {biz.whatsapp && (
                    <a href={`https://wa.me/${biz.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-outline-glass px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1" aria-label={`WhatsApp ${biz.name}`}>
                      <MessageCircle size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Register CTA */}
        <div className="mt-10 glass-card rounded-2xl p-6 text-center border border-violet-500/20">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="font-outfit font-bold text-white text-lg mb-1">List Your Business Free</h3>
          <p className="text-gray-400 text-sm mb-4">Get your own Google-ready SEO page on THENIJOBS</p>
          <Link href="/company/register" className="btn-gradient px-6 py-3 rounded-2xl text-sm font-semibold relative z-10 inline-flex items-center gap-2">
            Register Now — It&apos;s Free <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
