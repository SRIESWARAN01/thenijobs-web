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
            tagline: d.tagline || d.description?.substring(0, 100) || '',
            location: d.district || 'Theni',
            rating: d.rating || 0,
            reviews: d.reviewCount || 0,
            jobs: d.jobCount || 0,
            isVerified: d.isVerified || false,
            isPremium: d.isPremium || false
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
      <main className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-center font-outfit text-white">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-white mb-2">Category not found</h1>
          <Link href="/businesses" className="text-violet-400 hover:text-violet-300">Browse all businesses</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] font-outfit text-white">
      <Header />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-28 md:pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 mt-4">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/businesses" className="hover:text-white transition-colors">Businesses</Link>
          <span>/</span>
          <span className="text-white">{meta.title}</span>
        </nav>

        {/* Hero */}
        <div className="glass-card rounded-3xl p-8 mb-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative z-10">
            <div className="text-7xl mb-4">{meta.emoji}</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {meta.title} <span className="gradient-text">Companies in Theni</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">{meta.description}</p>
            <div className="flex flex-wrap justify-center gap-4 mt-5 text-sm">
              <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
                <Building2 size={14} className="text-violet-400" />
                <span className="text-gray-300">{businesses.length} Companies</span>
              </div>
              <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
                <Briefcase size={14} className="text-cyan-400" />
                <span className="text-gray-300">{businesses.reduce((s, b) => s + b.jobs, 0)} Open Jobs</span>
              </div>
              <div className="flex items-center gap-2 glass rounded-full px-4 py-2">
                <MapPin size={14} className="text-emerald-400" />
                <span className="text-gray-300">Theni, Tamil Nadu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Listings */}
        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <Loader2 size={32} className="animate-spin text-violet-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading businesses...</p>
          </div>
        ) : businesses.length > 0 ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-white text-lg mb-4">
              All {meta.title} Businesses
            </h2>
            {businesses.map(biz => (
              <div key={biz.id} className="premium-card rounded-2xl p-5 group">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-white/10 bg-white/5 shrink-0" style={{ background: `${meta.color}15` }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">{biz.name}</h3>
                          {biz.isVerified && <BadgeCheck size={15} className="text-emerald-400" />}
                          {biz.isPremium && <span className="badge-premium text-[9px]">PREMIUM</span>}
                        </div>
                        <p className="text-sm text-gray-400">{biz.tagline}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin size={11} />{biz.location}</span>
                      <span className="flex items-center gap-1">⭐ {biz.rating} ({biz.reviews} reviews)</span>
                      <span className="flex items-center gap-1 text-cyan-400"><Briefcase size={11} />{biz.jobs} open jobs</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/company?slug=${encodeURIComponent(biz.slug)}`}
                        className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold relative z-10 flex items-center gap-2">
                        View Profile <ArrowRight size={14} />
                      </Link>
                      <Link href={`/company?slug=${encodeURIComponent(biz.slug)}`}
                        className="btn-outline-glass px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
                        <Briefcase size={13} /> Jobs
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="text-6xl mb-4">{meta.emoji}</div>
            <h3 className="text-xl font-semibold text-white mb-2">No businesses listed yet</h3>
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
