'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  MapPin,
  MessageCircle,
  Phone,
  Sprout,
  Star,
  Store,
  Briefcase,
} from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { where, limit } from 'firebase/firestore';
import { getCompanyPortfolioPath } from '@/lib/companyPortfolio';
import { sortCompaniesByPlan } from '@/lib/firebase/firestoreService';
import MembershipBadge from '@/components/ui/MembershipBadge';

const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'agriculture':
      return Sprout;
    case 'retail':
    case 'textiles':
      return Store;
    case 'it & software':
    case 'corporate':
      return Building2;
    default:
      return Briefcase;
  }
};

export default function FeaturedBusinesses() {
  const { data: dbCompanies, loading } = useCollection<any>('companies', [
    where('isActive', '==', true),
    where('verificationStatus', '==', 'verified'),
    where('isFeatured', '==', true),
    limit(20)
  ]);

  const rawList = dbCompanies.map((d: any) => ({
    id: d.id,
    slug: d.slug || d.id,
    portfolioPath: getCompanyPortfolioPath(d),
    name: d.name || '',
    category: d.category || 'Local Business',
    location: d.district || d.location || 'Local Area',
    rating: d.rating || 4.5,
    reviews: d.reviewCount || d.reviewsCount || 0,
    isVerified: d.verificationStatus === 'verified' || d.status === 'approved' || d.isVerified === true,
    isPremium: d.isPremium || d.isFeatured || false,
    subscriptionPlan: d.subscriptionPlan || (d.isPremium ? 'premium' : 'free'),
    tagline: d.description || d.tagline || 'Local service & support',
    phone: d.phone || '',
    whatsapp: d.whatsapp || d.phone || '',
    logoUrl: d.logoUrl || d.logo || '',
    status: d.status || '',
    deleted: d.deleted || false,
    updatedAt: d.updatedAt,
    createdAt: d.createdAt,
  })).filter((c: any) => {
    const isApproved = c.isVerified || c.status === 'approved';
    const isNotSuspendedOrDeleted = c.status !== 'suspended' && c.status !== 'deleted' && c.deleted !== true;
    return isApproved && isNotSuspendedOrDeleted;
  });

  // Apply Plan Priority Sorting: Enterprise (Gold) -> Premium (Blue) -> Basic/Free (Gray)
  const companiesList = sortCompaniesByPlan(rawList).slice(0, 4);

  return (
    <section className="px-4 py-12 sm:px-6 relative overflow-hidden bg-theme-main border-b border-theme text-theme-body">
      {/* Light effect */}
      <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] pointer-events-none opacity-10" style={{ backgroundColor: 'var(--theme-primary)' }} />
      
      <div className="mx-auto max-w-6xl relative z-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-theme-primary">Business Directory</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-white sm:text-3xl tracking-tight">
              Verified Local Businesses
            </h2>
            <p className="mt-1 text-sm text-slate-400">Call, WhatsApp, reviews and directions ready.</p>
          </div>
          <Link
            href="/businesses"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-theme bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading && dbCompanies.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)]"></div>
          </div>
        ) : companiesList.length === 0 ? (
          <div className="rounded-2xl border border-theme bg-white/[0.01] p-8 text-center backdrop-blur-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-theme-card text-theme-primary">
              <Building2 size={24} />
            </div>
            <h3 className="mt-4 font-outfit text-lg font-bold text-white">No featured businesses yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-450">
              Verified featured businesses will appear here after approval.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {companiesList.map((biz) => {
              const Icon = getCategoryIcon(biz.category);
              return (
                <article key={biz.id} className="overflow-hidden rounded-2xl border border-theme bg-theme-card hover:border-[var(--theme-primary)]/30 hover:scale-[1.02] transition-all duration-300 shadow-xl flex flex-col justify-between h-full group relative">
                  {/* Subtle top background decoration */}
                  <div className="absolute top-0 inset-x-0 h-[100px] bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
                  
                  <div>
                    <div className="relative bg-gradient-to-br from-[#12122d] to-[#1e1a3a] p-5 text-white border-b border-theme">
                      <div className="flex items-start justify-between">
                        {biz.logoUrl ? (
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-theme overflow-hidden group-hover:scale-105 transition-transform duration-300">
                            <img src={biz.logoUrl} alt={biz.name} className="w-full h-full object-cover" onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-lg font-black text-[var(--theme-primary)]">${(biz.name || 'B').substring(0, 2).toUpperCase()}</span>`;
                            }} />
                          </span>
                        ) : (
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-theme text-white/95 group-hover:scale-105 transition-transform duration-300">
                            <Icon size={26} />
                          </span>
                        )}
                        {biz.isPremium && (
                          <span className="rounded-full bg-[var(--theme-primary)]/20 border border-[var(--theme-primary)]/30 px-2.5 py-0.5 text-[9px] font-black text-theme-primary uppercase tracking-wide">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="mt-5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{biz.category}</p>
                      <h3 className="mt-1 min-h-11 text-base font-bold leading-snug group-hover:text-[var(--theme-primary)] transition-colors">{biz.name}</h3>
                    </div>

                    <div className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-slate-400">{biz.tagline}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-bold text-slate-500 mt-2">
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin size={12} className="text-theme-primary" />
                          {biz.location}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          {biz.rating} ({biz.reviews})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2 pt-4 border-t border-theme">
                      <Link
                        href={biz.portfolioPath}
                        className="flex min-h-10 items-center justify-center rounded-xl btn-theme-primary text-xs font-bold text-white transition-all shadow-md active:scale-95 flex-1 text-center cursor-pointer"
                      >
                        View Profile
                      </Link>
                      {biz.phone && (
                        <a
                          href={`tel:${biz.phone}`}
                          className="flex min-h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-theme text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label={`Call ${biz.name}`}
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      {biz.whatsapp && (
                        <a
                          href={`https://wa.me/${String(biz.whatsapp).replace(/\D/g, '')}`}
                          className="flex min-h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-colors"
                          aria-label={`WhatsApp ${biz.name}`}
                        >
                          <MessageCircle size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                  {/* Floating verification badge overlay in bottom right corner of cover header */}
                  <span className="absolute right-3 top-[105px] z-10">
                    <MembershipBadge plan={biz.subscriptionPlan} size={20} />
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
