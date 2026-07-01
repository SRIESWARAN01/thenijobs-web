'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, BadgeCheck, Star,
  Briefcase, SlidersHorizontal, ArrowRight, Building2, Loader2
} from 'lucide-react';
import { getPublicCompanies, getActiveServices } from '@/lib/firebase/firestoreService';
import { useLocations } from '@/hooks/useLocations';
import { matchesSearch, scoreSearchMatch } from '@/lib/search';
import { Select } from '@/components/ui/Select';
import { getCompanyPortfolioPath } from '@/lib/companyPortfolio';

const CATEGORIES = ['All', 'Agriculture', 'Construction', 'Education', 'Healthcare', 'IT', 'Textiles', 'Manufacturing', 'Retail', 'Transport', 'Finance'];

interface Service {
  id: string;
  slug: string;
  portfolioPath: string;
  name: string;
  category: string;
  district: string;
  location: string;
  description: string;
  services: string[];
  rating: number;
  reviews: number;
  jobs: number;
  isVerified: boolean;
  isPremium: boolean;
  tagline: string;
  logo: string;
  isNew: boolean;
}

const SORT_OPTIONS = [
  { value: 'premium', label: 'Featured First' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'jobs', label: 'Most Jobs' },
  { value: 'new', label: 'Newest' },
];

export default function ServicesPage() {
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Load service providers from Firestore (companies that offer services)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('q') || params.get('search');
      const locationParam = params.get('location');
      if (searchParam) setSearch(searchParam);
      if (locationParam) setSelectedDistrict(locationParam);
    }

    async function loadServices() {
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
              district: d.district || 'Local Area',
              location: d.location || d.locality || d.town || d.district || 'Local Area',
              description: d.description || '',
              services: mergedServices,
              rating: d.rating || 0,
              reviews: d.reviewCount || 0,
              jobs: d.jobCount || 0,
              isVerified: d.isVerified || d.verificationStatus === 'verified' || d.status === 'approved' || d.verificationBadges?.businessVerified || false,
              isPremium: d.isPremium || d.isFeatured || false,
              tagline: d.tagline || d.description?.substring(0, 80) || '',
              logo: d.logoUrl || d.logo || (d.name ? d.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() : 'S'),
              isNew: d.createdAt ? (Date.now() - d.createdAt?.toMillis?.() < 7 * 24 * 60 * 60 * 1000) : false,
            } as Service;
          });
        setServices(data);
      } catch (err) {
        console.error('Error loading services:', err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const filtered = services
    .filter(s => {
      const matchSearch = matchesSearch(search, [
        { value: s.name, weight: 3 },
        { value: s.category, weight: 2 },
        s.tagline,
        s.description,
        s.services,
      ]);
      const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
      const matchDist = selectedDistrict === 'All' || s.location === selectedDistrict || s.district === selectedDistrict;
      const matchVerified = !showVerifiedOnly || s.isVerified;
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
        <div className="max-w-5xl mx-auto flex gap-2">
          <div className="flex-1 flex items-center gap-2 search-input px-4 py-2.5">
            <Search size={15} className="text-gray-500 shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} type="text"
              placeholder="Search services, categories, providers..."
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none" />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-500" /></button>}
          </div>
          <Select
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            options={districtOptions}
            placeholder="All Areas"
            className="w-36"
          />
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border
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
                <p className="text-xs font-semibold text-gray-400 mb-2">Service Category</p>
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
                <span className="text-xs text-gray-300">Verified services only</span>
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

        {/* Stats + Sort */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-outfit font-bold text-xl text-white">{filtered.length} Services</h1>
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
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
          {CATEGORIES.slice(1).map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all shrink-0
                ${selectedCategory === cat ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Services Cards */}
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Loader2 size={32} className="animate-spin text-violet-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading services...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🔧</div>
            <h3 className="text-lg font-semibold text-white mb-2">No services found</h3>
            <p className="text-gray-400 text-sm mb-4">Try adjusting your search or filters</p>
            <button onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedDistrict('All'); setShowVerifiedOnly(false); }}
              className="btn-outline-glass px-5 py-2 rounded-xl text-sm font-medium">Clear Filters</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(svc => (
              <div key={svc.id} className="premium-card rounded-2xl p-5 flex flex-col gap-4 group">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {svc.logo && (svc.logo.startsWith('http') || svc.logo.startsWith('/')) ? (
                      <img src={svc.logo} alt={svc.name} className="w-full h-full object-cover" onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-lg font-black text-violet-400">${(svc.name || 'S').substring(0, 2).toUpperCase()}</span>`;
                      }} />
                    ) : (
                      <span className="text-lg font-black text-violet-400">{svc.logo}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="font-semibold text-white text-sm leading-tight truncate">{svc.name}</h2>
                          {svc.isVerified && <BadgeCheck size={14} className="text-emerald-400 shrink-0" />}
                        </div>
                        {svc.isPremium && <span className="badge-premium text-[9px] mt-0.5 inline-block">FEATURED</span>}
                        {svc.isNew && !svc.isPremium && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-bold inline-block mt-0.5">NEW</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{svc.tagline}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span className="text-violet-400 font-medium">{svc.category}</span>
                  <span className="flex items-center gap-1"><MapPin size={10} />{svc.location}</span>
                  <span className="flex items-center gap-1"><Star size={10} className="fill-amber-400 text-amber-400" />{svc.rating} ({svc.reviews})</span>
                  <span className="flex items-center gap-1 text-cyan-400"><Briefcase size={10} />{svc.jobs} jobs</span>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Link href={svc.portfolioPath}
                    className="flex-1 btn-gradient py-2.5 rounded-xl text-xs font-semibold relative z-10 text-center flex items-center justify-center gap-1.5">
                    View Profile <ArrowRight size={12} />
                  </Link>
                  <Link href={`/businesses/${svc.category.toLowerCase()}`}
                    className="btn-outline-glass px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1">
                    <Building2 size={12} /> More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Register CTA */}
        <div className="mt-10 glass-card rounded-2xl p-6 text-center border border-violet-500/20">
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="font-outfit font-bold text-white text-lg mb-1">List Your Services Free</h3>
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
