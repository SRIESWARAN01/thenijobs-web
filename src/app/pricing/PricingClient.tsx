'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check, X, Zap, ArrowRight, ChevronDown, ChevronUp,
  Shield, Star, Crown, Building2, Lock, PhoneCall, BadgeCheck, CreditCard, Sparkles, CheckCircle2, Loader2
} from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useReferral } from '@/hooks/useReferral';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import PaymentCheckoutModal, { PlanDetails } from '@/components/payment/PaymentCheckoutModal';

const PLAN_ICONS: Record<string, typeof Shield> = {
  Shield,
  Star,
  Crown,
  Building2,
};

// Strips the leading emoji glyph off constants.ts badge strings (e.g. "🥈 Silver Verified")
const stripBadgeEmoji = (badge?: string) => badge?.replace(/^\S+\s*/, '').trim() ?? '';

// Authoritative Feature Comparison Matrix (10 standard rows as specified)
const COMPARISON_MATRIX = [
  {
    feature: 'Active Job Postings Limit',
    basic: '5 Jobs',
    standard: '10 Jobs',
    premium: '50 Jobs',
    enterprise: 'Unlimited',
    highlight: true,
  },
  {
    feature: 'Company Portfolio Website',
    basic: '1 Template',
    standard: '5 Templates',
    premium: '15 Templates',
    enterprise: 'Unlimited (All 16)',
  },
  {
    feature: 'Digital ID Card & QR Code',
    basic: 'Standard Card & QR',
    standard: 'Premium Visiting Card',
    premium: 'Premium+ & Dynamic QR',
    enterprise: 'Enterprise Digital Card',
  },
  {
    feature: 'Reviews & Ratings',
    basic: '❌',
    standard: '✅ Photo Reviews',
    premium: '✅ Priority Reviews',
    enterprise: '✅ Full Showcase',
  },
  {
    feature: 'Services & Products Listing',
    basic: '❌',
    standard: '20 Products / 10 Services',
    premium: '100 Products / 50 Services',
    enterprise: 'Unlimited',
    highlight: true,
  },
  {
    feature: 'Featured Company Placement',
    basic: '❌',
    standard: '❌',
    premium: '✅ Search Priority',
    enterprise: '✅ Homepage + Top Priority',
  },
  {
    feature: 'Candidate Search & Filtering',
    basic: '❌',
    standard: 'Basic',
    premium: 'Advanced',
    enterprise: 'Advanced + Priority Alerts',
  },
  {
    feature: 'Interview Scheduling & Leads',
    basic: 'Leads Only',
    standard: '✅ Leads & Interviews',
    premium: '✅ Leads & Interviews',
    enterprise: '✅ Dedicated Careers Portal',
  },
  {
    feature: 'Premium SEO Enhancement',
    basic: 'Basic SEO & Schema',
    standard: 'Enhanced Meta Tags',
    premium: 'Custom SEO Meta',
    enterprise: 'AI Generated SEO Content',
  },
  {
    feature: 'Branch / Franchise Management',
    basic: '❌',
    standard: '3 Branches',
    premium: '20 Branches',
    enterprise: 'Unlimited Branches',
  },
];

const WHY_US = [
  {
    icon: Shield,
    title: 'Verified & Trusted',
    desc: 'Paid plan members receive official verification badge eligibility once business credentials are confirmed by admin review.',
  },
  {
    icon: CreditCard,
    title: 'Simple Annual Billing',
    desc: 'One annual payment with manual renewal. No hidden fees, surprise charges, or forced recurring credit card debits.',
  },
  {
    icon: Zap,
    title: 'Instant Activation',
    desc: 'Your membership and limits activate immediately upon server-side payment verification by the Razorpay gateway.',
  },
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
    a: 'Basic (₹999/yr) is ideal for startups and new businesses needing 5 active job postings, a digital ID card, and lead capture. Standard (₹1,800/yr) is designed for growing local shops with 10 active jobs, 20 products, 10 services, and 3 branches. Premium (₹3,500/yr) is our most popular choice for established companies, unlocking 50 jobs, 100 products, 50 services, 20 branches, and 25 staff IDs with Gold badge. Enterprise (₹5,000/yr) provides unlimited jobs, products, services, branches, and staff IDs with Platinum Corporate badge and AI company tools for large enterprises and factories.',
  },
  {
    q: 'Can I upgrade or downgrade anytime?',
    a: 'Yes. You can upgrade your plan anytime from your Employer Billing dashboard. Upgrades take effect immediately upon successful payment verification. If you choose a lower tier upon renewal, all your existing listings and data remain safely preserved; however, you will only be able to publish new items within the lower tier\'s limits. Subscriptions are billed annually on a manual renewal basis with no automatic recurring charges.',
  },
  {
    q: 'What payment options are available?',
    a: 'We accept all major secure Indian payment methods via Razorpay 256-bit SSL encryption, including UPI (Google Pay, PhonePe, Paytm, BHIM), Debit & Credit Cards (Visa, Mastercard, RuPay), Net Banking (across 50+ Indian banks), and popular digital wallets. Your subscription activates automatically once the payment gateway confirms the transaction.',
  },
];

export default function PricingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { referralCode } = useReferral();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Fetch employer's company details to link subscription directly to company
  const { data: companies } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies?.[0];
  const [trialLoading, setTrialLoading] = useState(false);

  const handleRequestTrial = async () => {
    if (!user) {
      router.push('/register?role=business_owner&trial=true');
      return;
    }

    setTrialLoading(true);
    try {
      const res = await fetch('/api/subscription/request-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          companyId: company?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to request free trial.');
        return;
      }
      router.push('/employer/dashboard');
    } catch (err: any) {
      alert(err.message || 'Error submitting trial request.');
    } finally {
      setTrialLoading(false);
    }
  };

  // Auto-launch checkout if plan was preserved during login redirect
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam && user) {
      const target = SUBSCRIPTION_PLANS.find(p => p.slug === planParam.toLowerCase());
      if (target) {
        setSelectedPlan({
          name: target.name,
          slug: target.slug,
          price: target.price,
          dailyEquivalent: target.dailyEquivalent,
          monthlyEquivalent: target.monthlyEquivalent,
          features: target.features,
          badge: target.badge,
        });
        setIsCheckoutOpen(true);
      }
    }
  }, [searchParams, user]);

  const handleSelectPlan = (plan: (typeof SUBSCRIPTION_PLANS)[number]) => {
    if (!user) {
      // Preserve selected plan during login redirect
      const targetUrl = `/pricing?plan=${encodeURIComponent(plan.slug)}`;
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
      return;
    }

    setSelectedPlan({
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      dailyEquivalent: plan.dailyEquivalent,
      monthlyEquivalent: plan.monthlyEquivalent,
      features: plan.features,
      badge: plan.badge,
    });
    setIsCheckoutOpen(true);
  };

  const basicPlan = SUBSCRIPTION_PLANS.find(p => p.slug === 'basic') || SUBSCRIPTION_PLANS[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-24 lg:pb-16" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Header />

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-[clamp(1.5rem,4.5dvh,3rem)] pb-[clamp(3rem,8dvh,5rem)] px-4">
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

          {/* Trust chips */}
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
        {referralCode && (
          <div className="max-w-xl mx-auto mb-6 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-emerald-300 shadow-md text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Partner Onboarding Referral Active: <strong className="font-mono text-emerald-950 font-bold">{referralCode}</strong></span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full">
              Partner Benefits Applied
            </span>
          </div>
        )}

        {/* Registration Welcome Banner */}
        {searchParams.get('registered') === 'true' && (
          <div className="max-w-4xl mx-auto mb-6 p-4 rounded-2xl bg-blue-600 text-white shadow-lg flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Welcome to THENIJOBS! Account Created</h4>
                <p className="text-xs text-blue-100 mt-0.5">Select an annual subscription plan below, or request our 15-day Standard Free Trial under admin review.</p>
              </div>
            </div>
          </div>
        )}

        {/* 15-Day Free Trial Option Card */}
        <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-start gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                ⭐ 15-Day Free Trial
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                Try THENIJOBS Free for 15 Days (Standard Plan)
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-xl leading-relaxed">
                Experience 10 active job postings, verified company profile, and WhatsApp lead capture free for 15 days. Trial begins automatically after Admin approval. No upfront payment required.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-gray-500 font-medium">
                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-600" /> 10 Active Jobs</span>
                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-600" /> 5 Website Templates</span>
                <span className="flex items-center gap-1"><Check size={12} className="text-emerald-600" /> Starts on Admin Approval</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestTrial}
            disabled={trialLoading}
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs sm:text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {trialLoading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
            <span>Request 15-Day Free Trial</span>
          </button>
        </div>

        {/* Pricing cards: 4 authoritative plans */}
        <div id="pricing-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isRecommended = plan.recommended;
            const isEnterprise = plan.slug === 'enterprise';
            const BadgeIcon = PLAN_ICONS[plan.icon] ?? Shield;
            const badgeText = stripBadgeEmoji(plan.badge);

            return (
              <div
                key={plan.slug}
                className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border transition-all flex flex-col justify-between relative ${
                  isRecommended
                    ? 'border-blue-600 ring-2 ring-blue-600/25 shadow-lg lg:-translate-y-2'
                    : isEnterprise
                    ? 'border-purple-300 shadow-md hover:shadow-lg hover:border-purple-400'
                    : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                }`}
              >
                {/* Header Tag / Badge */}
                {isRecommended ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm bg-blue-600 text-white uppercase tracking-wider">
                      <Star size={11} fill="currentColor" />
                      MOST POPULAR
                    </span>
                  </div>
                ) : isEnterprise ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm bg-gradient-to-r from-purple-700 to-indigo-700 text-white uppercase tracking-wider">
                      <Building2 size={11} />
                      ENTERPRISE
                    </span>
                  </div>
                ) : badgeText ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-extrabold shadow-sm bg-slate-800 text-white">
                      <BadgeIcon size={11} fill="currentColor" fillOpacity={0.3} strokeWidth={2.25} />
                      {badgeText}
                    </span>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <div className="text-center pt-1">
                    <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 min-h-[32px]">{plan.bestFor}</p>
                  </div>

                  {/* Price breakdown */}
                  <div className={`text-center py-3 rounded-2xl border ${
                    isRecommended
                      ? 'bg-blue-50/70 border-blue-100'
                      : isEnterprise
                      ? 'bg-purple-50/60 border-purple-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}>
                    <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                      ₹{plan.price.toLocaleString('en-IN')}
                      <span className="text-xs text-gray-400 font-normal"> /year</span>
                    </div>

                    <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                      ~₹{plan.dailyEquivalent}/day <span className="text-gray-400 font-normal">(₹{plan.monthlyEquivalent}/mo)</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Billed annually</div>
                  </div>

                  {/* Verification Badge Preview */}
                  <div className="text-center py-1.5 px-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1">
                    <span>Badge:</span>
                    <strong className="text-slate-900">{plan.badge}</strong>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2 text-xs text-gray-600 pt-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="pt-2 border-t border-gray-100/80">
                      <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                        <X size={11} className="shrink-0 text-gray-300" strokeWidth={2.5} />
                        +{plan.notIncluded.length} more features on higher tiers
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      isRecommended
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-blue-500/25'
                        : isEnterprise
                        ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:opacity-95 shadow-md'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {`Select ${plan.name}`}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix Table */}
        <div id="comparison-matrix" className="mt-14 bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Plan → Feature Access Matrix
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Compare exact resource quotas and feature capabilities across all four annual membership tiers.
            </p>
          </div>

          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-xs text-left border-separate border-spacing-0 min-w-[620px]">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="sticky left-0 z-10 bg-gray-50 p-3 font-bold border-b border-gray-200 w-1/3">
                    Feature &amp; Quota
                  </th>
                  <th className="p-3 font-bold text-center border-b border-gray-200">
                    Basic<br />
                    <span className="font-normal text-gray-400">₹999/yr</span>
                  </th>
                  <th className="p-3 font-bold text-center border-b border-gray-200">
                    Standard<br />
                    <span className="font-normal text-gray-400">₹1,800/yr</span>
                  </th>
                  <th className="p-3 font-bold text-center bg-blue-50 text-blue-800 border-b border-blue-200 rounded-t-xl">
                    <span className="inline-flex items-center gap-1 font-extrabold">
                      <Star size={11} fill="currentColor" />
                      Premium
                    </span>
                    <br />
                    <span className="font-normal text-blue-600">₹3,500/yr</span>
                  </th>
                  <th className="p-3 font-bold text-center border-b border-gray-200">
                    Enterprise<br />
                    <span className="font-normal text-gray-400">₹5,000/yr</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_MATRIX.map((row, i) => (
                  <tr key={i} className={`hover:bg-gray-50/60 ${row.highlight ? 'bg-slate-50/30' : ''}`}>
                    <td className="sticky left-0 z-10 bg-white p-3 font-semibold text-gray-900 border-b border-gray-100 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)]">
                      {row.feature}
                    </td>
                    <td className="p-3 text-center border-b border-gray-100">
                      {row.basic === '✅' ? (
                        <Check size={15} className="mx-auto text-emerald-600" strokeWidth={2.5} />
                      ) : row.basic === '❌' ? (
                        <X size={15} className="mx-auto text-gray-300" strokeWidth={2.5} />
                      ) : (
                        <span className="text-gray-700 font-medium">{row.basic}</span>
                      )}
                    </td>
                    <td className="p-3 text-center border-b border-gray-100 font-medium text-gray-800">
                      {row.standard === '✅' ? (
                        <Check size={15} className="mx-auto text-emerald-600" strokeWidth={2.5} />
                      ) : row.standard === '❌' ? (
                        <X size={15} className="mx-auto text-gray-300" strokeWidth={2.5} />
                      ) : (
                        row.standard
                      )}
                    </td>
                    <td className="p-3 text-center bg-blue-50/50 font-bold text-blue-700 border-b border-blue-100">
                      {row.premium === '✅' ? (
                        <Check size={15} className="mx-auto text-blue-600" strokeWidth={2.5} />
                      ) : row.premium === '❌' ? (
                        <X size={15} className="mx-auto text-gray-300" strokeWidth={2.5} />
                      ) : (
                        row.premium
                      )}
                    </td>
                    <td className="p-3 text-center border-b border-gray-100 font-bold text-purple-900">
                      {row.enterprise === '✅' ? (
                        <Check size={15} className="mx-auto text-emerald-600" strokeWidth={2.5} />
                      ) : row.enterprise === '❌' ? (
                        <X size={15} className="mx-auto text-gray-300" strokeWidth={2.5} />
                      ) : (
                        row.enterprise
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sticky left-0 z-10 bg-white p-3 border-t border-gray-100" />
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <td key={plan.slug} className="p-3 text-center border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full py-2 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          plan.recommended
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        Choose {plan.name}
                      </button>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Why us — Trust / Verification Guarantee */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {WHY_US.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <Icon size={19} className="text-blue-600" strokeWidth={2.25} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* FAQs Section */}
        <div className="mt-14 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  openFaq === i ? 'border-blue-200 shadow-sm' : 'border-gray-200 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left font-bold text-xs sm:text-sm text-gray-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={16} className="text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Closing CTA Section */}
        <div
          className="mt-14 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center text-white relative overflow-hidden shadow-lg"
          style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
        >
          <h2 className="text-lg sm:text-xl font-extrabold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Still deciding? Start with Basic, upgrade whenever you&apos;re ready.
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
            Get verified for ₹999/yr. Upgrade in a few clicks from your dashboard.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectPlan(basicPlan)}
              className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-blue-700 bg-white hover:bg-blue-50 transition-all shadow-md cursor-pointer"
            >
              Get Started <ArrowRight size={14} />
            </button>
            <a
              href="#comparison-matrix"
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-white/10 border border-white/25 hover:bg-white/20 transition-all"
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
          companyId={company?.id}
          companyName={company?.name}
          companyAddress={company?.address}
          companyPhone={company?.phone}
          companyGst={company?.gstNumber}
          company={company}
          onSuccess={() => {
            router.push('/employer/billing');
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
