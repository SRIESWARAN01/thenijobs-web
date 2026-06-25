'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, Building2, Crown, Store, TrendingUp } from 'lucide-react';
import { where } from 'firebase/firestore';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';

export default function ServiceDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(['service_provider']);
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || ''),
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const { data: services } = useCollection<any>('services', [
    where('providerId', '==', user?.uid || ''),
  ], { skip: !user?.uid });
  const { data: leads } = useCollection<any>('leads', [
    where('companyId', '==', companyId || ''),
  ], { skip: !companyId });

  if (authLoading || companyLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-emerald-500/5 p-6">
          <p className="text-xs font-black uppercase tracking-wider text-cyan-300">Service Dashboard</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-outfit text-3xl font-black">{company?.name || 'Service Portfolio'}</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Manage your public service presence, enquiries, verification and portfolio media.
              </p>
            </div>
            <Link href="/employer/company-profile" className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-white">
              <Building2 size={16} /> Portfolio Setup
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Service Listings', value: services.length, icon: Store, tone: 'text-cyan-300' },
            { label: 'Leads', value: leads.length, icon: TrendingUp, tone: 'text-emerald-300' },
            { label: 'Verification', value: company?.verificationStatus || 'Pending', icon: BadgeCheck, tone: 'text-amber-300' },
            { label: 'Plan', value: company?.isPremium ? 'Premium' : 'Free', icon: Crown, tone: 'text-violet-300' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <Icon size={19} className={item.tone} />
                <div className="mt-4 text-2xl font-black capitalize">{item.value}</div>
                <div className="text-sm text-gray-500">{item.label}</div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            { label: 'Portfolio', detail: 'Keep logo, cover, gallery, contact and social links fresh.', href: '/employer/company-profile', icon: Building2 },
            { label: 'Leads', detail: 'Follow up on customer service enquiries.', href: '/employer/leads', icon: TrendingUp },
            { label: 'Billing', detail: 'Unlock premium badge, featured listing and lead visibility.', href: '/employer/billing', icon: Crown },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-cyan-500/30 hover:bg-white/[0.05]">
                <Icon size={20} className="text-cyan-300" />
                <h2 className="mt-4 text-lg font-bold">{action.label}</h2>
                <p className="mt-2 text-sm text-gray-500">{action.detail}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
                  Open <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
