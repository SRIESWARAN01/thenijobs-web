'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Building2, Star, Loader2, MapPin, Globe, Phone
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import CompanyReviewsSection from '@/components/company/CompanyReviewsSection';
import MembershipBadge from '@/components/ui/MembershipBadge';
import { getCompanyActivePlan } from '@/lib/subscriptions';

interface CompanyData {
  id: string;
  name?: string;
  businessName?: string;
  slug?: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  district?: string;
  category?: string;
  description?: string;
  overview?: string;
  tagline?: string;
  website?: string;
  subscriptionPlan?: string;
  isPremium?: boolean;
  verificationStatus?: string;
  rating?: number;
  reviewCount?: number;
}

export default function CompanyReviewsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompany() {
      try {
        // Try slug first, then ID
        let snap = await getDocs(query(
          collection(db, 'companies'),
          where('slug', '==', slug),
          limit(1)
        ));
        if (snap.empty) {
          snap = await getDocs(query(
            collection(db, 'companies'),
            where('__name__', '==', slug),
            limit(1)
          ));
        }
        if (!snap.empty) {
          const d = snap.docs[0];
          setCompany({ id: d.id, ...d.data() } as CompanyData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCompany();
  }, [slug]);

  const activePlan = getCompanyActivePlan(company);
  const displayName = company?.name || company?.businessName || 'Company';

  return (
    <div className="min-h-screen bg-[#080814] text-white font-outfit">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#080814]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href={`/company/${slug}`}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {loading ? 'Loading...' : `${displayName} — Reviews`}
            </p>
          </div>
          {company && (
            <MembershipBadge plan={activePlan} size={18} />
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={36} className="text-violet-400 animate-spin" />
          </div>
        ) : !company ? (
          <div className="text-center py-20">
            <Building2 size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Company not found</p>
            <Link href="/" className="mt-4 inline-block text-violet-400 text-sm hover:underline">Go Home</Link>
          </div>
        ) : (
          <>
            {/* Company Overview Card */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-gray-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-black text-white">{displayName}</h1>
                    <MembershipBadge plan={activePlan} size={18} />
                  </div>

                  {/* Plan pill */}
                  {activePlan && activePlan !== 'free' && (
                    <MembershipBadge plan={activePlan} size={12} variant="pill" />
                  )}

                  <div className="mt-2 space-y-1">
                    {company.category && (
                      <p className="text-xs text-gray-400">{company.category}</p>
                    )}
                    {(company.district || company.address) && (
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={10} /> {company.district || company.address}
                      </p>
                    )}
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-violet-400 hover:underline"
                      >
                        <Globe size={10} /> {company.website}
                      </a>
                    )}
                    {company.phone && (
                      <a
                        href={`tel:${company.phone}`}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        <Phone size={10} /> {company.phone}
                      </a>
                    )}
                  </div>

                  {/* Rating summary */}
                  {company.rating && company.rating > 0 ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={12} className={i <= Math.round(company.rating!) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'} />
                        ))}
                      </div>
                      <span className="text-xs text-amber-400 font-bold">{company.rating}</span>
                      {company.reviewCount && (
                        <span className="text-[10px] text-gray-500">({company.reviewCount} reviews)</span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Description / Overview */}
              {(company.description || company.overview || company.tagline) && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">About</p>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {company.overview || company.description || company.tagline}
                  </p>
                </div>
              )}
            </div>

            {/* Reviews Section — full mode */}
            <div className="glass-card rounded-2xl p-5">
              <CompanyReviewsSection
                companyId={company.id}
                companyName={displayName}
                companySlug={slug}
                mode="full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
