'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { MapPin, Briefcase, Building2, ArrowRight, BadgeCheck, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const CATEGORY_META: Record<string, { title: string; description: string; emoji: string; color: string }> = {
  agriculture: { title: 'Agriculture', description: 'Farm services, machinery rental, crop management companies in Theni', emoji: '🌾', color: '#10b981' },
  construction: { title: 'Construction', description: 'Builders, contractors, civil engineers and construction companies in Theni', emoji: '🏗️', color: '#f59e0b' },
  'it-software': { title: 'IT & Software', description: 'Web development, app development and IT companies in Theni', emoji: '💻', color: '#7c3aed' },
  healthcare: { title: 'Healthcare', description: 'Hospitals, clinics, medical labs and healthcare providers in Theni', emoji: '🏥', color: '#f43f5e' },
  education: { title: 'Education', description: 'Schools, colleges, coaching centres and educational institutes in Theni', emoji: '📚', color: '#06b6d4' },
  textiles: { title: 'Textiles', description: 'Textile mills, garment factories, fabric suppliers in Theni', emoji: '🧵', color: '#a78bfa' },
  manufacturing: { title: 'Manufacturing', description: 'Manufacturing units, factories and industrial companies in Theni', emoji: '🏭', color: '#fb923c' },
  retail: { title: 'Retail', description: 'Shops, stores, supermarkets and retail businesses in Theni', emoji: '🛒', color: '#34d399' },
};

const categoryMap: Record<string, string> = {
  'agriculture': 'Agriculture',
  'construction': 'Construction',
  'it-software': 'IT & Software',
  'healthcare': 'Healthcare',
  'education': 'Education',
  'textiles': 'Textiles',
  'manufacturing': 'Manufacturing',
  'retail': 'Retail',
};

export default function BusinessCategoryPageClient({ category }: { category: string }) {
  const meta = CATEGORY_META[category];

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) return;
    async function loadBusinesses() {
      try {
        setLoading(true);
        const mappedName = categoryMap[category] || '';
        const q = query(
          collection(db, 'companies'),
          where('category', '==', mappedName),
          where('verificationStatus', '==', 'verified')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            slug: d.slug || doc.id,
            name: d.name || '',
            tagline: d.tagline || d.description || '',
            location: d.district || 'Theni',
            rating: d.rating || 0,
            reviews: d.reviewCount || 0,
            jobs: d.jobCount || 0,
            isVerified: d.isVerified || false,
            isPremium: d.isPremium || false,
            logoUrl: d.logoUrl || d.logo || '',
            coverUrl: d.coverUrl || d.coverImage || '',
            phone: d.phone || '',
            whatsapp: d.whatsapp || d.phone || ''
          };
        });
        setBusinesses(data);
      } catch (err) {
        console.error('Error loading businesses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBusinesses();
  }, [category]);

  if (!meta) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center font-outfit text-gray-900">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Category not found</h1>
          <Link href="/businesses" className="text-blue-600 hover:underline">Browse all businesses</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-outfit text-[#111827]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 mt-4 font-medium">
          <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/businesses" className="hover:text-blue-600 transition-colors">Businesses</Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">{meta.title}</span>
        </nav>

        {/* Hero */}
        <div className="bg-white rounded-3xl p-8 mb-8 text-center relative overflow-hidden border border-gray-100 shadow-sm">
          <div className="relative z-10">
            <div className="text-7xl mb-4">{meta.emoji}</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {meta.title} <span className="text-blue-600">Companies in Theni</span>
            </h1>
            <p className="text-gray-600 text-sm max-w-lg mx-auto leading-relaxed">{meta.description}</p>
            <div className="flex flex-wrap justify-center gap-3 mt-5 text-sm">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-2 text-xs font-bold">
                <Building2 size={14} className="text-blue-600" />
                <span>{businesses.length} Companies</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-4 py-2 text-xs font-bold">
                <Briefcase size={14} className="text-emerald-600" />
                <span>{businesses.reduce((s, b) => s + b.jobs, 0)} Open Jobs</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 text-amber-800 rounded-full px-4 py-2 text-xs font-bold">
                <MapPin size={14} className="text-amber-600" />
                <span>Theni, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Listings */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">Loading {meta.title} businesses...</p>
          </div>
        ) : businesses.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg mb-4">
              All {meta.title} Businesses ({businesses.length})
            </h2>
            {businesses.map(biz => {
              const cleanPhone = (biz.phone || '').replace(/[^0-9+]/g, '');
              const cleanWa = (biz.whatsapp || biz.phone || '').replace(/[^0-9]/g, '');
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${biz.name} ${biz.location} Tamil Nadu`)}`;

              return (
                <div key={biz.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
                  {/* Cover Banner */}
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

                  <div className="p-5 pt-0 relative flex flex-col gap-3">
                    {/* Logo Avatar */}
                    <div className="-mt-7 flex justify-between items-end">
                      <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-md flex items-center justify-center font-bold text-xl shrink-0 overflow-hidden bg-white"
                        style={{ background: biz.logoUrl ? '#FFFFFF' : `${meta.color}15` }}>
                        {biz.logoUrl ? (
                          <img src={biz.logoUrl} alt={biz.name} className="w-full h-full object-cover" />
                        ) : (
                          meta.emoji
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors break-words">{biz.name}</h3>
                          {biz.isVerified && <BadgeCheck size={16} className="text-emerald-500 shrink-0" />}
                        </div>
                        {biz.tagline && <p className="text-xs text-gray-600 mt-1 line-clamp-2 break-words leading-relaxed">{biz.tagline}</p>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1 font-medium"><MapPin size={11} className="text-gray-400" />{biz.location}</span>
                      {biz.rating > 0 && <span className="flex items-center gap-1 font-medium">⭐ {biz.rating.toFixed(1)} ({biz.reviews} reviews)</span>}
                      {biz.jobs > 0 && <span className="flex items-center gap-1 text-emerald-600 font-bold"><Briefcase size={11} />{biz.jobs} open jobs</span>}
                    </div>

                    {/* Contact CTAs */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                      {cleanPhone && (
                        <a href={`tel:${cleanPhone}`}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-1 border border-blue-100">
                          📞 Call
                        </a>
                      )}
                      {cleanWa && (
                        <a href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi, I found ${biz.name} on THENIJOBS. I would like to make an enquiry.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1 shadow-xs"
                          style={{ background: '#25D366' }}>
                          💬 WhatsApp
                        </a>
                      )}
                      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition-all flex items-center gap-1 border border-amber-200">
                        📍 Directions
                      </a>
                      <Link href={`/company/${biz.slug}`}
                        className="ml-auto py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm">
                        View Profile <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="text-6xl mb-4">{meta.emoji}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses listed yet</h3>
            <p className="text-gray-400 text-sm mb-6">Be the first {meta.title} business in Theni on THENIJOBS</p>
            <Link href="/company/register" className="btn-gradient px-6 py-3 rounded-2xl text-sm font-semibold relative z-10 inline-flex items-center gap-2">
              Register Your Business <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
