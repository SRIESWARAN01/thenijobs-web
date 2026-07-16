import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import {
  Briefcase,
  Store,
  Truck,
  Wrench,
  Users,
  Package,
  CalendarCheck,
  Search,
  TrendingUp,
  Building2,
  ArrowRight,
  Sparkles,
  BarChart3,
  MessageSquare,
  Star,
  ShieldCheck,
  Box,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Hub — Employer, Business, Supplier & Service Portals',
  description:
    'Access all THENIJOBS business portals from one place. Post jobs, manage products, connect with suppliers, and offer services across Theni district.',
  alternates: {
    canonical: 'https://thenijobs.com/hub',
  },
  openGraph: {
    title: 'Business Hub — THENIJOBS',
    description:
      'Your gateway to Employer, Business, Supplier & Service portals on THENIJOBS.',
    type: 'website',
    url: 'https://thenijobs.com/hub',
  },
};

const portals = [
  {
    title: 'Employer',
    tamilLabel: 'முதலாளி',
    description:
      'Recruitment module: Post jobs, screen candidates, schedule interviews, and hire the best talent in Theni district.',
    href: '/business/dashboard',
    cta: 'Go to Employer Portal',
    icon: Briefcase,
    accent: {
      bg: 'bg-violet-50',
      iconBg: 'bg-gradient-to-br from-violet-600 to-indigo-600',
      text: 'text-violet-700',
      border: 'border-violet-200 hover:border-violet-300',
      ctaBg: 'bg-violet-700 hover:bg-violet-800',
      featureBadge: 'bg-violet-50 text-violet-700',
      glow: 'group-hover:shadow-violet-200/60',
    },
    features: [
      { label: 'Job Posting', icon: Briefcase },
      { label: 'Candidates', icon: Users },
      { label: 'Talent Search', icon: Search },
      { label: 'Reports', icon: BarChart3 },
      { label: 'Messages', icon: MessageSquare },
    ],
  },
  {
    title: 'Business',
    tamilLabel: 'வணிகம்',
    description:
      'Products module: Manage your local products & services, track inventory, handle shop orders, and sell to buyers.',
    href: '/business/dashboard',
    cta: 'Go to Business Portal',
    icon: Store,
    accent: {
      bg: 'bg-emerald-50',
      iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-600',
      text: 'text-emerald-700',
      border: 'border-emerald-200 hover:border-emerald-300',
      ctaBg: 'bg-emerald-700 hover:bg-emerald-800',
      featureBadge: 'bg-emerald-50 text-emerald-700',
      glow: 'group-hover:shadow-emerald-200/60',
    },
    features: [
      { label: 'Products & Services', icon: Package },
      { label: 'Inventory', icon: Box },
      { label: 'Leads', icon: TrendingUp },
      { label: 'Reviews', icon: Star },
    ],
  },
  {
    title: 'Supplier',
    tamilLabel: 'சப்ளையர்',
    description:
      'Supplier & B2B module: Receive bulk RFQs, handle wholesale business leads, and connect for B2B partnerships.',
    href: '/business/dashboard',
    cta: 'Go to Supplier Portal',
    icon: Truck,
    badge: 'B2B',
    accent: {
      bg: 'bg-amber-50',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-700',
      border: 'border-amber-200 hover:border-amber-300',
      ctaBg: 'bg-amber-600 hover:bg-amber-700',
      featureBadge: 'bg-amber-50 text-amber-700',
      glow: 'group-hover:shadow-amber-200/60',
    },
    features: [
      { label: 'Supplier Directory', icon: Building2 },
      { label: 'B2B Leads', icon: TrendingUp },
      { label: 'Verified Profiles', icon: ShieldCheck },
    ],
  },
  {
    title: 'Service',
    tamilLabel: 'சேவை',
    description:
      'Services module: List your local services, manage booking appointments, receive reviews, and grow your service provider profile.',
    href: '/business/dashboard',
    cta: 'Go to Service Portal',
    icon: Wrench,
    accent: {
      bg: 'bg-rose-50',
      iconBg: 'bg-gradient-to-br from-rose-600 to-pink-600',
      text: 'text-rose-700',
      border: 'border-rose-200 hover:border-rose-300',
      ctaBg: 'bg-rose-700 hover:bg-rose-800',
      featureBadge: 'bg-rose-50 text-rose-700',
      glow: 'group-hover:shadow-rose-200/60',
    },
    features: [
      { label: 'My Services', icon: Wrench },
      { label: 'Bookings', icon: CalendarCheck },
      { label: 'Reviews', icon: Star },
    ],
  },
];

export default function BusinessHubPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <Header />

      {/* Hero Banner */}
      <section className="relative overflow-hidden px-4 pb-8 pt-24 sm:px-6 lg:pb-12 lg:pt-28">
        {/* Subtle gradient backdrop */}
        <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,#dff7ef_0%,rgba(246,248,251,0)_100%)]" />
        <div className="absolute left-1/2 top-20 -translate-x-1/2 h-64 w-[600px] rounded-full bg-teal-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Category badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-teal-800 shadow-sm">
            <Building2 size={15} />
            Business Hub
          </div>

          <h1 className="mx-auto max-w-3xl font-outfit text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Your Business starts here
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
            One unified Business Account to post jobs, manage products, connect with suppliers, and offer services — all under one dashboard for Theni district businesses.
          </p>

          {/* Quick register CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/company/register"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-teal-800"
            >
              <Sparkles size={16} />
              Register Your Business
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              Already registered? Login
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Portal Cards Grid */}
      <section className="px-4 pb-16 sm:px-6 lg:pb-24">
        <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.title}
                href={portal.href}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-8 ${portal.accent.border} ${portal.accent.glow}`}
              >
                {/* Badge (if present) */}
                {portal.badge && (
                  <span className={`absolute right-5 top-5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${portal.accent.featureBadge}`}>
                    {portal.badge}
                  </span>
                )}

                {/* Icon + Title */}
                <div className="mb-4 flex items-center gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${portal.accent.iconBg} shadow-lg`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-outfit text-xl font-black text-slate-950 sm:text-2xl">
                      {portal.title}
                    </h2>
                    <p className="text-xs font-bold text-slate-400">{portal.tamilLabel}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="mb-5 text-sm leading-relaxed text-slate-500">
                  {portal.description}
                </p>

                {/* Feature pills */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {portal.features.map((feat) => {
                    const FeatIcon = feat.icon;
                    return (
                      <span
                        key={feat.label}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${portal.accent.featureBadge}`}
                      >
                        <FeatIcon size={12} />
                        {feat.label}
                      </span>
                    );
                  })}
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  <span className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white transition-all duration-200 ${portal.accent.ctaBg}`}>
                    {portal.cta}
                    <ArrowRight
                      size={15}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bottom info strip */}
      <section className="border-t border-slate-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50">
            <ShieldCheck size={24} className="text-teal-700" />
          </div>
          <h3 className="font-outfit text-lg font-black text-slate-950 sm:text-xl">
            Trusted by businesses across Theni district
          </h3>
          <p className="max-w-lg text-sm leading-relaxed text-slate-500">
            THENIJOBS connects employers, businesses, suppliers, and service providers with the local community. Register your business today and start growing.
          </p>
          <Link
            href="/company/register"
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-teal-800"
          >
            Get Started Free
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
