'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, Package, Wrench, Building2, Phone, MessageCircle,
  ExternalLink, BadgeCheck, Star, Filter, ArrowRight, Sparkles,
  ShoppingBag, Check, Layers, ChevronRight, X, Briefcase, Navigation,
  Clock, ShieldCheck
} from 'lucide-react';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

const LOCATIONS = [
  'All Locations', 'Theni', 'Cumbum', 'Periyakulam', 'Bodinayakanur',
  'Chinnamanur', 'Uthamapalayam', 'Andipatti', 'Madurai', 'Dindigul'
];

const CATEGORIES = [
  'All Categories', 'Healthcare & Hospital', 'Education & Training',
  'Manufacturing & Industry', 'IT & Software', 'Agriculture & Farming',
  'Hotel & Restaurant', 'Retail & Supermarket', 'Automobile & Services',
  'Professional & Corporate', 'Local Shops & Business'
];

type TabType = 'all' | 'products' | 'services' | 'companies';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItemModal, setSelectedItemModal] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setLoading(false);
    }, 10000);

    async function loadMarketplaceData() {
      try {
        setLoading(true);
        const qComp = query(
          collection(db, 'companies'),
          where('isActive', '==', true),
          limit(100)
        );
        const snap = await getDocs(qComp);
        if (cancelled) return;
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(data);
      } catch (err) {
        console.error('Error fetching marketplace companies:', err);
      } finally {
        clearTimeout(timeout);
        if (!cancelled) setLoading(false);
      }
    }
    loadMarketplaceData();

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  // Aggregate all products with company metadata
  const allProducts = useMemo(() => {
    const list: any[] = [];
    companies.forEach(company => {
      if (company.products && Array.isArray(company.products)) {
        company.products.forEach((prod: any, idx: number) => {
          list.push({
            id: prod.id || `${company.id}-prod-${idx}`,
            name: typeof prod === 'string' ? prod : prod.name || prod.title,
            description: typeof prod === 'object' ? prod.description : '',
            price: typeof prod === 'object' ? prod.price : null,
            priceRange: typeof prod === 'object' ? prod.priceRange : null,
            category: typeof prod === 'object' ? prod.category || company.category : company.category,
            imageUrl: typeof prod === 'object' ? prod.imageUrl : null,
            type: 'product' as const,
            company: {
              id: company.id,
              name: company.name,
              slug: company.slug,
              district: company.district || 'Theni',
              phone: company.phone,
              whatsapp: company.whatsapp || company.phone,
              isVerified: company.verificationStatus === 'verified' || company.isVerified === true,
              logoUrl: company.logoUrl,
            }
          });
        });
      }
    });
    return list;
  }, [companies]);

  // Aggregate all services with company metadata
  const allServices = useMemo(() => {
    const list: any[] = [];
    companies.forEach(company => {
      if (company.services && Array.isArray(company.services)) {
        company.services.forEach((srv: any, idx: number) => {
          list.push({
            id: srv.id || `${company.id}-srv-${idx}`,
            name: typeof srv === 'string' ? srv : srv.title || srv.name,
            description: typeof srv === 'object' ? srv.description || srv.desc : '',
            price: typeof srv === 'object' ? srv.startingPrice || srv.price : null,
            category: typeof srv === 'object' ? srv.category || company.category : company.category,
            imageUrl: typeof srv === 'object' ? srv.imageUrl : null,
            type: 'service' as const,
            company: {
              id: company.id,
              name: company.name,
              slug: company.slug,
              district: company.district || 'Theni',
              phone: company.phone,
              whatsapp: company.whatsapp || company.phone,
              isVerified: company.verificationStatus === 'verified' || company.isVerified === true,
              logoUrl: company.logoUrl,
            }
          });
        });
      }
    });
    return list;
  }, [companies]);

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return allProducts.filter(item => {
      const matchSearch = searchQuery === '' ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLoc = selectedLocation === 'All Locations' || item.company.district?.toLowerCase() === selectedLocation.toLowerCase();
      const matchCat = selectedCategory === 'All Categories' || item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchVer = !verifiedOnly || item.company.isVerified;

      return matchSearch && matchLoc && matchCat && matchVer;
    });
  }, [allProducts, searchQuery, selectedLocation, selectedCategory, verifiedOnly]);

  const filteredServices = useMemo(() => {
    return allServices.filter(item => {
      const matchSearch = searchQuery === '' ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company.name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLoc = selectedLocation === 'All Locations' || item.company.district?.toLowerCase() === selectedLocation.toLowerCase();
      const matchCat = selectedCategory === 'All Categories' || item.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchVer = !verifiedOnly || item.company.isVerified;

      return matchSearch && matchLoc && matchCat && matchVer;
    });
  }, [allServices, searchQuery, selectedLocation, selectedCategory, verifiedOnly]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchSearch = searchQuery === '' ||
        company.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLoc = selectedLocation === 'All Locations' || company.district?.toLowerCase() === selectedLocation.toLowerCase();
      const matchCat = selectedCategory === 'All Categories' || company.category?.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchVer = !verifiedOnly || (company.verificationStatus === 'verified' || company.isVerified === true);

      return matchSearch && matchLoc && matchCat && matchVer;
    });
  }, [companies, searchQuery, selectedLocation, selectedCategory, verifiedOnly]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* ── Marketplace Banner ── */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-xs">
            <ShoppingBag size={14} className="text-amber-300" />
            <span>Local Business Marketplace • Theni &amp; Tamil Nadu</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Discover Products, Services &amp; Verified Businesses
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Order products directly, schedule professional services, and connect with trusted local companies across Theni district.
          </p>

          {/* Unified Search Bar */}
          <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20 max-w-4xl shadow-xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products, AC repair, hospitals, groceries, businesses..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>

              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="px-3.5 py-3 bg-white rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none"
              >
                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3.5 py-3 bg-white rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Marketplace Filter Tabs & Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex gap-1.5 p-1 rounded-2xl bg-slate-200/80 overflow-x-auto no-scrollbar w-fit max-w-full">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Items ({filteredProducts.length + filteredServices.length + filteredCompanies.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛒 Products ({filteredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'services' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔧 Services ({filteredServices.length})
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'companies' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Companies ({filteredCompanies.length})
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={e => setVerifiedOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0"
            />
            <BadgeCheck size={16} className="text-blue-600" />
            <span>Verified Companies Only</span>
          </label>
        </div>

        {/* ── PRODUCTS SECTION ── */}
        {(activeTab === 'all' || activeTab === 'products') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                <span>Featured Products</span>
              </h2>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('products')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  View all products ({filteredProducts.length}) →
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                No products found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredProducts.slice(0, activeTab === 'all' ? 8 : 50).map(prod => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-40 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-blue-50/50 flex items-center justify-center text-blue-400">
                          <Package size={32} />
                        </div>
                      )}
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                        {prod.category || 'Product'}
                      </span>
                    </div>

                    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{prod.name}</h3>
                        </div>

                        <Link
                          href={`/${prod.company.slug}`}
                          className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 line-clamp-1"
                        >
                          <span>{prod.company.name}</span>
                          {prod.company.isVerified && <BadgeCheck size={12} className="text-blue-600 shrink-0" />}
                        </Link>

                        <p className="text-[11px] text-slate-500 line-clamp-2">{prod.description || 'Quality product from verified local seller.'}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-700">
                            {prod.price ? `₹${Number(prod.price).toLocaleString('en-IN')}` : prod.priceRange || 'Price on request'}
                          </span>
                          <span className="text-[10px] text-slate-400">{prod.company.district}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {prod.company.whatsapp && (
                            <a
                              href={`https://wa.me/${prod.company.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${prod.company.name}, I am interested in ordering your product "${prod.name}" listed on THENIJOBS Marketplace.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                              style={{ background: '#25D366' }}
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                          )}
                          <Link
                            href={`/${prod.company.slug}`}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold"
                            title="Visit Official Company Website"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SERVICES SECTION ── */}
        {(activeTab === 'all' || activeTab === 'services') && (
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench size={18} className="text-teal-600" />
                <span>Professional Services</span>
              </h2>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('services')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  View all services ({filteredServices.length}) →
                </button>
              )}
            </div>

            {filteredServices.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                No services found matching your search.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredServices.slice(0, activeTab === 'all' ? 8 : 50).map(srv => (
                  <div
                    key={srv.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="h-36 bg-slate-100 relative flex items-center justify-center overflow-hidden">
                      {srv.imageUrl ? (
                        <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-teal-50/50 flex items-center justify-center text-teal-500">
                          <Wrench size={32} />
                        </div>
                      )}
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/90 backdrop-blur-md text-slate-900 shadow-xs">
                        {srv.category || 'Service'}
                      </span>
                    </div>

                    <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{srv.name}</h3>

                        <Link
                          href={`/${srv.company.slug}`}
                          className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 line-clamp-1"
                        >
                          <span>{srv.company.name}</span>
                          {srv.company.isVerified && <BadgeCheck size={12} className="text-blue-600 shrink-0" />}
                        </Link>

                        <p className="text-[11px] text-slate-500 line-clamp-2">{srv.description || 'Reliable service from verified local provider.'}</p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-blue-700">
                            {srv.price ? `Starts ₹${Number(srv.price).toLocaleString('en-IN')}` : 'Rate on inquiry'}
                          </span>
                          <span className="text-[10px] text-slate-400">{srv.company.district}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {srv.company.whatsapp && (
                            <a
                              href={`https://wa.me/${srv.company.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${srv.company.name}, I would like to book your service "${srv.name}" listed on THENIJOBS Marketplace.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs bg-blue-600 hover:bg-blue-700"
                            >
                              <Wrench size={12} /> Book Service
                            </a>
                          )}
                          <Link
                            href={`/${srv.company.slug}`}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold"
                            title="Visit Official Company Website"
                          >
                            <ExternalLink size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMPANIES SECTION ── */}
        {(activeTab === 'all' || activeTab === 'companies') && (
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" />
                <span>Verified Local Companies</span>
              </h2>
              {activeTab === 'all' && (
                <button
                  onClick={() => setActiveTab('companies')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  View all companies ({filteredCompanies.length}) →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.slice(0, activeTab === 'all' ? 6 : 50).map(c => {
                const isVer = c.verificationStatus === 'verified' || c.isVerified === true;
                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-bold text-indigo-600 text-lg">{(c.name || 'C')[0]}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-slate-900 truncate">{c.name}</h3>
                          {isVer && <BadgeCheck size={15} className="text-blue-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{c.category || 'Business'} • {c.district || 'Theni'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {c.description || `${c.name} is a verified business serving ${c.district || 'Theni'} district.`}
                    </p>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        href={`/${c.slug}`}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Official Website</span> <ArrowRight size={12} />
                      </Link>

                      <Link
                        href={`/company/${c.slug}`}
                        className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                        title="Directory Profile"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
