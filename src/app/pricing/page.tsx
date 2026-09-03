'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Check, X, Zap, ArrowRight, ChevronDown, ChevronUp,
  Shield, Star, Crown, Building2, Lock, PhoneCall, BadgeCheck, CreditCard,
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';

const PLAN_ICONS: Record<string, typeof Shield> = { Shield, Star, Crown, Building2 };

// Strips the leading emoji glyph off constants.ts badge strings (e.g. "🥈 Silver Verified")
// so the plan card can pair a real Lucide icon with the label instead.
const stripBadgeEmoji = (badge?: string) => badge?.replace(/^\S+\s*/, '').trim() ?? '';

const COMPARISON_MATRIX = [
  { feature: 'Basic Company Profile', free: '✅', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Active Job Postings Limit', free: '1 Job', standard: '15 Jobs', premium: 'High Limit', enterprise: 'High Limit' },
  { feature: 'Company Portfolio Website', free: '❌', standard: 'Full', premium: 'Premium', enterprise: 'Custom' },
  { feature: 'Digital ID Card & QR Code', free: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Reviews & Ratings', free: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Services & Products Listing', free: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Featured Company Placement', free: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Candidate Search & Filtering', free: '❌', standard: 'Basic', premium: 'Advanced', enterprise: 'Advanced' },
  { feature: 'Interview Scheduling & Leads', free: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Advanced Analytics & Reports', free: '❌', standard: '❌', premium: '✅', enterprise: '✅' },
  { feature: 'Premium SEO Enhancement', free: '❌', standard: 'Basic', premium: 'Advanced', enterprise: 'Advanced' },
  { feature: 'Multiple HR Users', free: '❌', standard: '❌', premium: '❌', enterprise: '✅' },
  { feature: 'Branch / Franchise Mgmt', free: '❌', standard: '❌', premium: '❌', enterprise: '✅' },
  { feature: 'Priority Customer Support', free: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
];

const WHY_US = [
  { icon: Shield, title: 'Verified & Trusted', desc: 'Paid plans carry a verification badge, so job seekers and customers know your business is genuine.' },
  { icon: CreditCard, title: 'Simple Annual Billing', desc: 'One payment a year, no surprise renewals. UPI, cards, net banking and wallets all accepted.' },
  { icon: Zap, title: 'Instant Activation', desc: 'Your plan activates the moment payment is confirmed — start posting jobs and building your profile right away.' },
];

const TRUST_CHIPS = [
  { icon: Lock, label: 'Secure Payments' },
  { icon: Zap, label: 'Instant Activation' },
  { icon: PhoneCall, label: 'Local Theni Support' },
  { icon: BadgeCheck, label: 'Upgrade Anytime' },
];

const FAQS = [
  {
    q: 'Which plan should I choose?',
    a: 'Standard (₹480/yr) is a great start for local shops that need a full portfolio and reviews. Premium (₹1,200/yr) is our most popular plan — it adds advanced analytics, leads dashboard and higher job-posting limits for growing companies. Enterprise (₹5,000/yr) is built for large businesses with multiple branches and HR users.',
  },
  {
    q: 'Can I upgrade or downgrade anytime?',
    a: 'Yes. You can change your plan anytime from your Employer Billing dashboard — upgrades take effect immediately.',
  },
  {
    q: 'What payment options are available?',
    a: 'We accept all major UPI apps (GPay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and popular wallets.',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleSelectPlan = (plan: (typeof SUBSCRIPTION_PLANS)[number]) => {
    if (plan.price === 0) {
      router.push('/company/register');
      return;
    }

    if (!user) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setSelectedPlan({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      dailyEquivalent: plan.dailyEquivalent,
      features: plan.features,
    });
    setIsCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-24 lg:pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Hero — compact, no redundant top offset (Header already reserves its own 64px spacer) */}
      <section className="relative isolate overflow-hidden pt-[clamp(1.25rem,4dvh,2.5rem)] pb-[clamp(2.5rem,7dvh,4.5rem)] px-4">
        <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(160deg, #2563EB 0%, #1D4ED8 55%, #4338CA 100%)' }} aria-hidden />
        <div className="absolute inset-0 -z-10 opacity-40" style={{
          backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.12) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(16,185,129,0.18) 0%, transparent 50%)'
        }} aria-hidden />

        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold border border-white/20 backdrop-blur-sm">
            <Zap size={13} className="text-amber-300" fill="currentColor" fillOpacity={0.3} strokeWidth={2.25} />
            Affordable Annual Plans for Local Businesses
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Simple, Honest Pricing
          </h1>
          <p className="mt-3 text-blue-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Grow your company with local job postings, digital ID cards, verified portfolios, and recruitment tools in Theni &amp; Tamil Nadu.
          </p>

          {/* Trust chips — single scrollable row, Lucide soft-fill icons matching bottom nav */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar justify-start sm:justify-center -mx-4 px-4 sm:mx-0 sm:px-0">
            {TRUST_CHIPS.map(({ icon: Icon, label }) => (
              <span key={label} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold whitespace-nowrap">
                <Icon size={13} strokeWidth={2.25} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 -mt-8 sm:-mt-10 relative z-10">

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isRecommended = plan.recommended;
            const BadgeIcon = PLAN_ICONS[plan.icon] ?? Shield;
            const badgeText = stripBadgeEmoji(plan.badge);

            return (
              <div
                key={plan.slug}
                className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between relative ${
                  isRecommended
                    ? 'border-blue-600 ring-2 ring-blue-600/25 shadow-lg lg:-translate-y-1.5'
                    : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                }`}
              >
                {badgeText && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm ${
                      isRecommended ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'
                    }`}>
                      <BadgeIcon size={11} fill="currentColor" fillOpacity={0.3} strokeWidth={2.25} />
                      {badgeText}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-center pt-1">
                    <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 min-h-[32px]">{plan.bestFor}</p>
                  </div>

                  {/* Price breakdown */}
                  <div className={`text-center py-2.5 rounded-2xl border ${isRecommended ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      ₹{plan.price.toLocaleString('en-IN')}
                      <span className="text-xs text-gray-400 font-normal"> /yr</span>
                    </div>

                    {plan.price > 0 ? (
                      <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                        ~₹{plan.dailyEquivalent}/day <span className="text-gray-400 font-normal">(₹{plan.monthlyEquivalent}/mo)</span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-semibold text-gray-500 mt-0.5">
                        Free Forever Access
                      </div>
                    )}
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2 text-xs text-gray-600 pt-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notIncluded.length > 0 && (
                    <p className="text-[11px] text-gray-400 font-medium pt-1 flex items-center gap-1">
                      <X size={11} className="shrink-0" strokeWidth={2.5} />
                      +{plan.notIncluded.length} more feature{plan.notIncluded.length > 1 ? 's' : ''} on higher plans
                    </p>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-center transition-all ${
                      isRecommended
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {plan.price === 0 ? 'Start Free' : `Select ${plan.name}`}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix Table */}
        <div className="mt-12 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-1 text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Plan → Feature Access Matrix
          </h2>
          <p className="text-xs text-gray-500 text-center mb-4">Scroll sideways on mobile to compare every plan</p>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-xs text-left border-separate border-spacing-0 min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="sticky left-0 z-10 bg-gray-50 p-3 font-bold border-b border-gray-100">Feature</th>
                  <th className="p-3 font-bold text-center border-b border-gray-100">Free<br /><span className="font-normal text-gray-400">₹0</span></th>
                  <th className="p-3 font-bold text-center border-b border-gray-100">Standard<br /><span className="font-normal text-gray-400">₹480/yr</span></th>
                  <th className="p-3 font-bold text-center bg-blue-50 text-blue-700 border-b border-blue-100 rounded-t-lg">
                    <span className="inline-flex items-center gap-1"><Star size={11} fill="currentColor" fillOpacity={0.3} />Premium</span>
                    <br /><span className="font-normal text-blue-400">₹1,200/yr</span>
                  </th>
                  <th className="p-3 font-bold text-center border-b border-gray-100">Enterprise<br /><span className="font-normal text-gray-400">₹5,000/yr</span></th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_MATRIX.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="sticky left-0 z-10 bg-white p-3 font-semibold text-gray-900 border-b border-gray-100 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)]">{row.feature}</td>
                    <td className="p-3 text-center border-b border-gray-100">
                      {row.free === '✅' ? <Check size={15} className="mx-auto text-emerald-600" strokeWidth={2.5} /> : row.free === '❌' ? <X size={15} className="mx-auto text-gray-300" strokeWidth={2.5} /> : <span className="text-gray-600">{row.free}</span>}
                    </td>
                    <td className="p-3 text-center border-b border-gray-100">
                      {row.standard === '✅' ? <Check size={15} className="mx-auto text-emerald-600" strokeWidth={2.5} /> : row.standard === '❌' ? <X size={15} className="mx-auto text-gray-300" strokeWidth={2.5} /> : <span className="text-gray-600">{row.standard}</span>}
                    </td>
                    <td className="p-3 text-center bg-blue-50/50 font-bold text-blue-700 border-b border-blue-100">
                      {row.premium === '✅' ? <Check size={15} className="mx-auto text-blue-600" strokeWidth={2.5} /> : row.premium === '❌' ? <X size={15} className="mx-auto text-gray-300" strokeWidth={2.5} /> : row.premium}
                    </td>
                    <td className="p-3 text-center border-b border-gray-100">
                      {row.enterprise === '✅' ? <Check size={15} className="mx-auto text-emerald-600" strokeWidth={2.5} /> : row.enterprise === '❌' ? <X size={15} className="mx-auto text-gray-300" strokeWidth={2.5} /> : <span className="text-gray-600">{row.enterprise}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Why us — extra trust/info band */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {WHY_US.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <Icon size={19} className="text-blue-600" strokeWidth={2.25} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className={`bg-white rounded-2xl border overflow-hidden transition-all ${openFaq === i ? 'border-blue-200 shadow-sm' : 'border-gray-100 shadow-xs'}`}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left font-bold text-xs sm:text-sm text-gray-900"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-blue-600 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Closing CTA band */}
        <div className="mt-12 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}>
          <h2 className="text-lg sm:text-xl font-extrabold" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Still deciding? Start free, upgrade whenever you&apos;re ready.
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
            No credit card required for the Free plan. Upgrade in a few clicks from your dashboard.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/company/register"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 transition-all shadow-sm"
            >
              Start Free <ArrowRight size={14} />
            </Link>
            <a
              href="#top"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-white/10 border border-white/25 hover:bg-white/20 transition-all"
            >
              Compare Plans
            </a>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <PaymentCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plan={selectedPlan}
          onSuccess={() => {
            router.push('/employer/billing');
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
