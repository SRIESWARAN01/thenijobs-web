'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Search, MapPin, X, BadgeCheck, Star,
  Briefcase, SlidersHorizontal, ArrowRight, Building2, Loader2,
  Package, Phone, MessageCircle, ShoppingCart, ExternalLink, ShieldCheck
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import ProductDetailModal from '@/components/company/ProductDetailModal';
import { slugifyCompany } from '@/lib/companySlug';

const CATEGORIES = ['All', 'Agriculture', 'Construction', 'Education', 'Healthcare', 'IT & Software', 'Textiles', 'Manufacturing', 'Retail', 'Transport', 'Finance'];
const DISTRICTS = ['All', 'Theni', 'Madurai', 'Dindigul', 'Coimbatore', 'Salem'];

interface ServiceProvider {
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
  phone?: string;
  whatsapp?: string;
  website?: string;
  products?: any[];
  servicesList?: any[];
}

export default function ServicesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'marketplace' | 'directory'>('marketplace');
  const [showFilters, setShowFilters] = useState(false);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Load approved+active service providers & their products from Firestore
  useEffect(() => {
    async function loadData() {
      try {
        const q = query(
          collection(db, 'companies'),
          where('verificationStatus', '==', 'verified'),
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            slug: d.slug || slugifyCompany(d.name || docSnap.id),
            name: d.name || 'Verified Company',
            category: d.category || 'Business Services',
            district: d.district || 'Theni',
            rating: d.rating || 4.8,
            reviews: d.reviewCount || 12,
            jobs: d.jobCount || 0,
            isVerified: d.isVerified !== false,
            isPremium: d.isPremium || false,
            tagline: d.tagline || d.description || '',
            logo: d.name ? d.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() : 'C',
            logoUrl: d.logoUrl || d.logo || '',
            coverUrl: d.coverUrl || d.coverImage || '',
            phone: d.phone || '9360519460',
            whatsapp: d.whatsapp || d.phone || '9360519460',
            website: d.website || '',
            products: d.products || [
              {
                id: `${docSnap.id}_p1`,
                name: `${d.category || 'Business'} Consultation & Service`,
                description: `Professional ${d.category || 'local'} services provided by ${d.name} in ${d.district || 'Theni'}.`,
                price: 999,
                category: d.category || 'Service',
                imageUrl: d.coverUrl || d.logoUrl || '',
                features: ['Verified Provider', 'Local Quality Guarantee', 'Fast Turnaround'],
              }
            ],
            servicesList: d.services || [],
          } as ServiceProvider;
        });
        setProviders(data);
      } catch (err) {
        console.error('Error loading companies & services:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter providers
  const filteredProviders = providers.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'All' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchDist = selectedDistrict === 'All' || p.district.toLowerCase().includes(selectedDistrict.toLowerCase());
    const matchVerified = !showVerifiedOnly || p.isVerified;
    return matchSearch && matchCat && matchDist && matchVerified;
  });

  // Extract all individual products/services into flat marketplace list
  const allMarketplaceItems: any[] = [];
  filteredProviders.forEach(p => {
    (p.products || []).forEach(prod => {
      allMarketplaceItems.push({
        ...prod,
        companyName: p.name,
        companySlug: p.slug,
        phone: p.phone,
        whatsapp: p.whatsapp,
        district: p.district,
        isVerified: p.isVerified,
      });
    });
  });

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-outfit text-gray-900">
      <Header />

      {/* Top Banner */}
      <div className="pt-20 pb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
              Local Business Marketplace
            </span>
            <span className="text-xs text-indigo-200">Theni &amp; Tamil Nadu</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            Company Products, Services &amp; Business Directory
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/80 max-w-2xl">
            Discover products and services sold by verified companies in Theni. Call, WhatsApp, or order directly from verified local businesses.
          </p>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setViewMode('marketplace')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'marketplace'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-white/10 text-white/80 hover:text-white'
              }`}
            >
              🛒 Products &amp; Services Marketplace ({allMarketplaceItems.length})
            </button>
            <button
              onClick={() => setViewMode('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'directory'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-white/10 text-white/80 hover:text-white'
              }`}
            >
              🏢 Company Directory ({filteredProviders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Search & Filter Bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap sm:flex-nowrap gap-2">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search products, services, or company names" placeholder="Search products, services, or company names..."
              className="w-full bg-transparent text-base sm:text-xs sm:text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
            {search && <button onClick={() => setSearch('')}><X size={14} className="text-gray-400" /></button>}
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 flex-shrink-0 min-w-[130px]">
            <MapPin size={14} className="text-gray-400 shrink-0" />
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-base sm:text-xs font-bold text-gray-900 outline-none w-full cursor-pointer"
            >
              {DISTRICTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Districts' : d}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs">
            <Loader2 size={32} className="animate-spin text-emerald-600 mx-auto mb-3" />
            <p className="text-gray-600 text-xs font-bold">Loading local products &amp; company listings...</p>
          </div>
        ) : viewMode === 'marketplace' ? (
          /* MARKETPLACE VIEW: PRODUCTS & SERVICES GRID */
          allMarketplaceItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-xs space-y-3">
              <Package size={40} className="text-gray-300 mx-auto" />
              <h3 className="text-base font-bold text-gray-900">No products or services found</h3>
              <p className="text-xs text-gray-500">Try searching for a different item or select another category.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {allMarketplaceItems.map((prod, idx) => {
                const cleanPhone = (prod.phone || '').replace(/[^0-9+]/g, '');
                const cleanWa = (prod.whatsapp || prod.phone || '').replace(/[^0-9]/g, '');
                const priceText = prod.price
                  ? `₹${Number(prod.price).toLocaleString('en-IN')}`
                  : prod.priceRange || 'Contact for Price';

                return (
                  <div
                    key={prod.id || idx}
                    onClick={() => setSelectedProduct(prod)}
                    className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer flex flex-col group"
                  >
                    {/* Product Image */}
                    <div className="h-48 sm:h-52 w-full bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                      {prod.imageUrl ? (
                        <>
                          <div className="absolute inset-0 bg-cover bg-center blur-sm opacity-25 scale-105" style={{ backgroundImage: `url(${prod.imageUrl})` }} />
                          <img src={prod.imageUrl} alt={prod.name} className="relative z-10 w-full h-full object-cover sm:object-contain object-center group-hover:scale-105 transition-transform duration-300" />
                        </>
                      ) : (
                        <Package size={36} className="text-gray-400" />
                      )}
                      <span className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-xl bg-slate-950/85 text-white font-extrabold text-xs shadow-xs border border-white/20">
                        {priceText}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1 gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                          {prod.category || 'Product'}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm mt-1.5 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                        <span className="font-bold text-gray-900 flex items-center gap-1">
                          <Building2 size={12} className="text-emerald-600" /> {prod.companyName}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin size={12} /> {prod.district || 'Theni'}
                        </span>
                      </div>

                      {/* Direct CTAs */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2" onClick={e => e.stopPropagation()}>
                        {cleanPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="py-2 px-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all flex items-center justify-center gap-1 border border-indigo-200"
                          >
                            <Phone size={12} /> Call
                          </a>
                        )}
                        {cleanWa && (
                          <a
                            href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`🛍️ *ORDER / ENQUIRY via THENIJOBS*\n📌 *Item:* ${prod.name}\n💰 *Price:* ${priceText}\n🏢 *Company:* ${prod.companyName}\n📍 *District:* ${prod.district || 'Theni'}\n${prod.imageUrl ? `🖼️ *Photo:* ${prod.imageUrl}\n` : ''}Hi, I saw this on THENIJOBS and would like to order / get more information.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-2 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1 shadow-xs"
                            style={{ background: '#25D366' }}
                          >
                            <MessageCircle size={12} /> WhatsApp
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedProduct(prod)}
                          className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all shadow-xs cursor-pointer"
                        >
                          <ShoppingCart size={12} /> Order
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* DIRECTORY VIEW: COMPANY CARDS GRID */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProviders.map(p => {
              const cleanPhone = (p.phone || '').replace(/[^0-9+]/g, '');
              const cleanWa = (p.whatsapp || p.phone || '').replace(/[^0-9]/g, '');

              return (
                <div key={p.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col group">
                  <div className="h-32 sm:h-36 w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center justify-center">
                    {p.coverUrl ? (
                      <>
                        <div
                          className="absolute inset-0 bg-cover bg-center blur-xs opacity-25 scale-105"
                          style={{ backgroundImage: `url(${p.coverUrl})` }}
                        />
                        <img src={p.coverUrl} alt={p.name} className="relative z-10 w-full h-full object-contain object-center p-1" />
                      </>
                    ) : (
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                    )}
                  </div>
                  <div className="p-5 pt-0 flex flex-col flex-1 gap-3 relative">
                    <div className="-mt-7 mb-1 flex justify-between items-end">
                      <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-md flex items-center justify-center font-bold text-sm bg-white text-slate-900 overflow-hidden shrink-0">
                        {p.logoUrl ? <img src={p.logoUrl} alt={p.name} className="w-full h-full object-cover" /> : p.logo}
                      </div>
                      {p.isVerified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck size={12} /> Verified Company
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-emerald-700 transition-colors">{p.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.tagline}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{p.category}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin size={12} />{p.district}</span>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 mt-auto">
                      <div className="grid grid-cols-2 gap-2">
                        {cleanPhone && (
                          <a href={`tel:${cleanPhone}`} className="py-2 px-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1 border border-indigo-200">
                            <Phone size={12} /> Call
                          </a>
                        )}
                        {cleanWa && (
                          <a href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${p.name}, I found your business profile on THENIJOBS.`)}`} target="_blank" rel="noreferrer" className="py-2 px-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs" style={{ background: '#25D366' }}>
                            <MessageCircle size={12} /> WhatsApp
                          </a>
                        )}
                      </div>
                      <Link href={`/company/${p.slug}`} className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center flex items-center justify-center gap-1 transition-all">
                        View Full Company Profile <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reusable Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <BottomNav />
    </main>
  );
}
