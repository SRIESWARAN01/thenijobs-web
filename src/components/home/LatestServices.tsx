'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  MapPin,
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Star
} from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { getCompanyPortfolioPath } from '@/lib/companyPortfolio';
import MembershipBadge from '@/components/ui/MembershipBadge';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  location: string;
  providerId: string;
  createdAt?: any;
}

interface CompanyItem {
  id: string;
  name: string;
  ownerId: string;
  logoUrl?: string;
  phone?: string;
  whatsapp?: string;
  rating?: number;
  reviewCount?: number;
  subscriptionPlan?: string;
  verificationStatus?: string;
  location?: string;
}

export default function LatestServices() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [companies, setCompanies] = useState<Record<string, CompanyItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadLatestServices() {
      try {
        setLoading(true);
        // Query latest active services
        const servicesQ = query(
          collection(db, 'services'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        const servicesSnap = await getDocs(servicesQ);
        if (cancelled) return;

        const svcList = servicesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ServiceItem[];

        setServices(svcList);

        // Fetch company details for all providers
        const providerIds = Array.from(new Set(svcList.map(s => s.providerId).filter(Boolean)));
        if (providerIds.length > 0) {
          const companiesQ = query(
            collection(db, 'companies'),
            where('ownerId', 'in', providerIds),
            where('isActive', '==', true)
          );
          const companiesSnap = await getDocs(companiesQ);
          if (cancelled) return;

          const companyMap: Record<string, CompanyItem> = {};
          companiesSnap.docs.forEach(doc => {
            const data = doc.data();
            companyMap[data.ownerId] = {
              id: doc.id,
              name: data.name || '',
              ownerId: data.ownerId || '',
              logoUrl: data.logoUrl || data.logo || '',
              phone: data.phone || '',
              whatsapp: data.whatsapp || '',
              rating: data.rating || 0,
              reviewCount: data.reviewCount || 0,
              subscriptionPlan: data.subscriptionPlan || (data.isPremium ? 'premium' : 'free'),
              verificationStatus: data.verificationStatus || '',
            };
          });

          setCompanies(companyMap);
        }
      } catch (err) {
        console.error('Error fetching latest services:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLatestServices();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="px-4 py-12 sm:px-6 bg-[#0a0a1a]">
        <div className="mx-auto max-w-6xl text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500 mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-bold">Loading approved services...</p>
        </div>
      </section>
    );
  }

  if (services.length === 0) {
    return null; // Don't show the section if no services are approved yet
  }

  return (
    <section className="px-4 py-12 sm:px-6 bg-gradient-to-b from-[#0a0a1a] to-[#080814] relative overflow-hidden">
      <div className="absolute top-1/2 right-0 h-[250px] w-[250px] rounded-full bg-violet-600/5 blur-[80px] pointer-events-none" />

      <div className="mx-auto max-w-6xl relative z-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-400">Services Catalog</p>
            <h2 className="mt-1 font-outfit text-2xl font-black text-white sm:text-3xl tracking-tight">
              Latest Approved Local Services
            </h2>
            <p className="mt-1 text-sm text-slate-400">Direct booking and enquiries with verified technicians and agencies.</p>
          </div>
          <Link
            href="/services"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-md active:scale-95 shrink-0"
          >
            View all services <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => {
            const company = companies[svc.providerId];
            const portfolioPath = company ? getCompanyPortfolioPath(company) : '#';
            const companyLogo = company?.logoUrl || '';

            return (
              <div
                key={svc.id}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] hover:border-violet-500/30 hover:bg-white/[0.04] p-5 shadow-xl transition-all duration-300 flex flex-col justify-between h-full relative"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      {companyLogo ? (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                          <img
                            src={companyLogo}
                            alt={company?.name || 'Provider Logo'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-sm font-black text-violet-400">${(company?.name || 'S').substring(0, 2).toUpperCase()}</span>`;
                            }}
                          />
                        </span>
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 group-hover:scale-105 transition-transform duration-300">
                          <Wrench size={20} />
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                          {svc.name}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400">
                          {company?.name || 'Local Service Provider'}
                        </p>
                      </div>
                    </div>

                    {company?.subscriptionPlan && (
                      <span className="shrink-0">
                        <MembershipBadge plan={company.subscriptionPlan} size={15} />
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-xs font-semibold leading-relaxed text-slate-400 mb-4">
                    {svc.description || 'Verified local service and support on THENIJOBS.'}
                  </p>
                </div>

                <div>
                  <div className="grid gap-2 border-t border-white/5 pt-4 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-2">
                      <MapPin size={13} className="text-violet-400" />
                      {svc.location || company?.location || 'Theni'}
                    </span>
                    {svc.price > 0 && (
                      <span className="text-emerald-400">
                        Estimated Price: ₹{svc.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    {company?.rating ? (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {company.rating.toFixed(1)} ({company.reviewCount} reviews)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Star size={12} className="text-slate-650" />
                        No ratings yet
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2">
                    <Link
                      href={portfolioPath}
                      className="flex min-h-10 items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all shadow-md active:scale-95 text-center flex-1"
                    >
                      View Details
                    </Link>
                    {company?.phone && (
                      <a
                        href={`tel:${company.phone}`}
                        className="flex min-h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label={`Call ${company.name}`}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    {company?.whatsapp && (
                      <a
                        href={`https://wa.me/${String(company.whatsapp).replace(/\D/g, '')}`}
                        className="flex min-h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:text-white hover:bg-emerald-500/20 transition-colors"
                        aria-label={`WhatsApp ${company.name}`}
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
