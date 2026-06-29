'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
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
    where('verificationStatus', '==', 'verified'),
    where('isFeatured', '==', true),
    limit(4)
  ]);

  const companiesList = dbCompanies.map((d: any) => ({
    id: d.id,
    slug: d.slug || d.id,
    portfolioPath: getCompanyPortfolioPath(d),
    name: d.name || '',
    category: d.category || 'Local Business',
    location: d.district || d.location || 'Local Area',
    rating: d.rating || 4.5,
    reviews: d.reviewsCount || 0,
    isVerified: d.verificationStatus === 'verified',
    isPremium: d.isPremium || d.isFeatured || false,
    tagline: d.description || d.tagline || 'Local service & support',
    phone: d.phone || '',
    whatsapp: d.whatsapp || d.phone || '',
  }));

  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-teal-700">Business Pages</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-slate-950 sm:text-3xl">
              Verified local businesses
            </h2>
            <p className="mt-1 text-sm text-slate-500">Call, WhatsApp, reviews and directions ready.</p>
          </div>
          <Link
            href="/businesses"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"
          >
            View all <ArrowRight size={15} />
          </Link>
        </div>

        {loading && dbCompanies.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"></div>
          </div>
        ) : companiesList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Building2 size={24} />
            </div>
            <h3 className="mt-4 font-outfit text-lg font-black text-slate-950">No featured businesses yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
              Verified featured businesses will appear here after approval.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {companiesList.map((biz) => {
              const Icon = getCategoryIcon(biz.category);
              return (
                <article key={biz.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <div className="relative bg-[linear-gradient(135deg,#0f766e,#2563eb)] p-5 text-white">
                      <div className="flex items-start justify-between">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/20">
                          <Icon size={28} />
                        </span>
                        {biz.isPremium && (
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-teal-800">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="mt-5 text-xs font-bold uppercase text-white/75">{biz.category}</p>
                      <h3 className="mt-1 min-h-11 text-base font-black leading-snug">{biz.name}</h3>
                    </div>

                    <div className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{biz.tagline}</p>
                        {biz.isVerified && <BadgeCheck size={18} className="mt-1 shrink-0 text-teal-700" />}
                      </div>
                      <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {biz.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          {biz.rating} ({biz.reviews})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                      <Link
                        href={biz.portfolioPath}
                        className="flex min-h-12 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white hover:bg-teal-800"
                      >
                        View Profile
                      </Link>
                      {biz.phone && (
                        <a
                          href={`tel:${biz.phone}`}
                          className="flex min-h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-800"
                          aria-label={`Call ${biz.name}`}
                        >
                          <Phone size={17} />
                        </a>
                      )}
                      {biz.whatsapp && (
                        <a
                          href={`https://wa.me/${String(biz.whatsapp).replace(/\D/g, '')}`}
                          className="flex min-h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"
                          aria-label={`WhatsApp ${biz.name}`}
                        >
                          <MessageCircle size={17} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
