'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, BadgeCheck, Star,
  Wrench, SlidersHorizontal, ArrowRight, Building2, Loader2, Phone, MessageCircle
} from 'lucide-react';
import { getPublicCompanies, getActiveServices } from '@/lib/firebase/firestoreService';
import { useLocations } from '@/hooks/useLocations';
import { matchesSearch, scoreSearchMatch } from '@/lib/search';
import { Select } from '@/components/ui/Select';
import { getCompanyPortfolioPath } from '@/lib/companyPortfolio';
import MembershipBadge from '@/components/ui/MembershipBadge';

const SERVICE_CATEGORIES = [
  'All',
  'AC Technician',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Digital Marketing',
  'Graphic Design',
  'Web Development',
  'Mobile Repair',
  'CCTV Installation',
  'Computer Service',
  'Home Cleaning',
  'Painting',
  'Interior Design',
  'Others'
];

interface ServiceWithCompany {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  location: string;
  district: string;
  providerId: string;
  companyId: string;
  companyName: string;
  ceoName: string;
  companyLogo: string;
  phone: string;
  whatsapp: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  subscriptionPlan: string;
  portfolioPath: string;
  createdAt?: any;
}

const SORT_OPTIONS = [
  { value: 'new', label: 'Newest First' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
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
  const [sortBy, setSortBy] = useState('new');
  const [showFilters, setShowFilters] = useState(false);
  const [services, setServices] = useState<ServiceWithCompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Load services and companies from Firestore
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('q') || params.get('search');
      const locationParam = params.get('location');
      if (searchParam) setSearch(searchParam);
      if (locationParam) setSelectedDistrict(locationParam);
    }

    async function loadServicesData() {
      try {
        setLoading(true);
        const [companies, activeServices] = await Promise.all([
          getPublicCompanies(),
          getActiveServices()
        ]);

        // Map companies list by ownerId for easy lookups
        const companyMap: Record<string, any> = {};
        companies.forEach(company => {
          companyMap[company.ownerId] = company;
        });

        // Join services with their provider companies details
        const mappedServices: ServiceWithCompany[] = activeServices.map(svc => {
          const provider = companyMap[svc.providerId] || {};
          const isVerified = provider.isVerified || provider.verificationStatus === 'verified' || provider.status === 'approved' || false;
          
          return {
            id: svc.id,
            name: svc.name || 'Unnamed Service',
            description: svc.description || 'Verified local service on THENIJOBS.',
            category: svc.category || 'Others',
            price: Number(svc.price) || 0,
            location: svc.location || provider.location || provider.district || 'Theni',
            district: svc.district || provider.district || 'Theni',
            providerId: svc.providerId || '',
            companyId: provider.id || '',
            companyName: provider.name || 'Local Service Provider',
            ceoName: provider.ceoName || provider.founder || provider.contactPerson || 'N/A',
            companyLogo: provider.logoUrl || provider.logo || '',
            phone: provider.phone || '',
            whatsapp: provider.whatsapp || provider.phone || '',
            rating: provider.rating || 4.5,
            reviewsCount: provider.reviewCount || 0,
            isVerified,
            subscriptionPlan: provider.subscriptionPlan || (provider.isFeatured ? 'premium' : 'free'),
            portfolioPath: getCompanyPortfolioPath(provider),
            createdAt: svc.createdAt
          };
        });

        setServices(mappedServices);
      } catch (err) {
        console.error('Error loading services catalogue:', err);
      } finally {
        setLoading(false);
      }
    }

    loadServicesData();
  }, []);

  const filteredServices = useMemo(() => {
    return services
      .filter(svc => {
        const matchSearch = matchesSearch(search, [
          { value: svc.name, weight: 3 },
          { value: svc.companyName, weight: 2 },
          { value: svc.category, weight: 2 },
          svc.description,
          svc.location
        ]);
        const matchCat = selectedCategory === 'All' || svc.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
        const matchDist = selectedDistrict === 'All' || svc.location === selectedDistrict || svc.district === selectedDistrict;
        const matchVerified = !showVerifiedOnly || svc.isVerified;

        return matchSearch && matchCat && matchDist && matchVerified;
      })
      .sort((a, b) => {
        if (search.trim()) {
          return scoreSearchMatch(search, [
            { value: b.name, weight: 3 },
            { value: b.companyName, weight: 2 },
            b.description,
          ]) - scoreSearchMatch(search, [
            { value: a.name, weight: 3 },
            { value: a.companyName, weight: 2 },
            a.description,
          ]);
        }

        if (sortBy === 'new') {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        }
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;

        return 0;
      });
  }, [services, search, selectedCategory, selectedDistrict, showVerifiedOnly, sortBy]);

  const activeFiltersCount = (selectedCategory !== 'All' ? 1 : 0) + (selectedDistrict !== 'All' ? 1 : 0) + (showVerifiedOnly ? 1 : 0);

  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <Header />

      {/* Sticky Search bar */}
      <div className="sticky top-16 z-40 glass-nav border-b border-white/5 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2">
          <div className="min-w-0 flex-[1_1_220px] flex items-center gap-2 search-input px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
            <Search size={15} className="text-gray-500 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Search services, category, providers..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
            {search && <button onClick={() => setSearch('')}><X size={13} className="text-gray-500" /></button>}
          </div>

          <Select
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            options={districtOptions}
            placeholder="All Areas"
            className="w-36 flex-1 sm:flex-none min-w-[9rem]"
          />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all border
              ${showFilters || activeFiltersCount > 0 ? 'bg-violet-500/20 border-violet-500/40 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400'}`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="max-w-5xl mx-auto mt-3 glass-card rounded-2xl p-4 border border-white/10">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Service Categories</p>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar">
                  {SERVICE_CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                        ${selectedCategory === c ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
                  className={`w-9 h-5 rounded-full relative transition-all ${showVerifiedOnly ? 'bg-violet-600' : 'bg-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${showVerifiedOnly ? 'left-[18px]' : 'left-0.5'}`} />
                </div>
                <span className="text-xs text-gray-300">Verified service providers only</span>
                <BadgeCheck size={12} className="text-emerald-400" />
              </label>

              {activeFiltersCount > 0 && (
                <button
                  onClick={() => { setSelectedCategory('All'); setSelectedDistrict('All'); setShowVerifiedOnly(false); }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
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
            <h1 className="font-outfit font-bold text-xl text-white">
              {loading ? 'Loading...' : `${filteredServices.length} Service${filteredServices.length !== 1 ? 's' : ''}`}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedCategory !== 'All' ? selectedCategory : 'All service categories'}
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

        {/* Category Pills horizontal scroller */}
        <div className="-mx-4 sm:mx-0 overflow-x-auto no-scrollbar mb-6 px-4 sm:px-0">
          <div className="flex w-max gap-2">
            {SERVICE_CATEGORIES.slice(1).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-all shrink-0
                  ${selectedCategory === cat ? 'bg-violet-600 text-white border-violet-600' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Empty / Grid layout */}
        {loading ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <Loader2 size={32} className="text-violet-400 mx-auto mb-4 animate-spin" />
            <p className="text-sm text-gray-400">Loading approved services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
              <Wrench size={28} className="text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No services found</h3>
            <p className="text-gray-450 text-sm mb-6 max-w-md mx-auto">
              We couldn&apos;t find any approved services matching your filters. Try adjusting your query or district.
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedDistrict('All'); setShowVerifiedOnly(false); }}
              className="btn-outline-glass px-5 py-2 rounded-xl text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredServices.map(svc => (
              <div key={svc.id} className="premium-card rounded-2xl p-5 flex flex-col gap-4 group justify-between h-full">
                <div>
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {svc.companyLogo ? (
                        <img
                          src={svc.companyLogo}
                          alt={svc.companyName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-lg font-black text-violet-400">${svc.companyName.substring(0, 2).toUpperCase()}</span>`;
                          }}
                        />
                      ) : (
                        <span className="text-lg font-black text-violet-400">
                          {svc.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <h2 className="font-semibold text-white text-base leading-tight truncate">
                            {svc.name}
                          </h2>
                          <p className="text-xs text-gray-500 mt-1.5 font-bold">
                            Business: <span className="text-slate-300 font-bold">{svc.companyName}</span>
                          </p>
                          <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
                            CEO / Owner: <span className="text-slate-400">{svc.ceoName}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-4 line-clamp-3 leading-relaxed text-left">
                    {svc.description}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500 pt-3 border-t border-white/5">
                    <span className="text-violet-400 font-medium">{svc.category}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} />{svc.location}</span>
                    {svc.price > 0 && (
                      <span className="text-emerald-400 font-bold">
                        Est: ₹{svc.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      {svc.rating.toFixed(1)}
                    </span>
                    {svc.subscriptionPlan && (
                      <MembershipBadge plan={svc.subscriptionPlan} size={14} />
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Link
                      href={svc.portfolioPath}
                      className="flex-1 btn-gradient py-2.5 rounded-xl text-xs font-semibold relative z-10 text-center flex items-center justify-center gap-1.5"
                    >
                      View Details <ArrowRight size={12} />
                    </Link>
                    {svc.phone && (
                      <a
                        href={`tel:${svc.phone}`}
                        className="btn-outline-glass px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1"
                        aria-label={`Call ${svc.companyName}`}
                      >
                        <Phone size={12} />
                      </a>
                    )}
                    {svc.whatsapp && (
                      <a
                        href={`https://wa.me/${svc.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline-glass px-3 py-2.5 rounded-xl text-xs font-medium flex items-center gap-1"
                        aria-label={`WhatsApp ${svc.companyName}`}
                      >
                        <MessageCircle size={12} />
                      </a>
                    )}
                  </div>
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
          <Link
            href="/company/register"
            className="btn-gradient px-6 py-3 rounded-2xl text-sm font-semibold relative z-10 inline-flex items-center gap-2"
          >
            Register Now — It&apos;s Free <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
