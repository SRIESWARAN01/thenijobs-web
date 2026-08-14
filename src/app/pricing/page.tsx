'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Zap, ArrowRight, ChevronDown, ChevronUp, Star, Shield, Crown, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';

const COMPARISON_MATRIX = [
  { feature: 'Basic Company Profile', free: '✅', basic: '✅', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Active Job Postings Limit', free: '1 Job', basic: '5 Jobs', standard: '15 Jobs', premium: 'High Limit', enterprise: 'High Limit' },
  { feature: 'Company Portfolio Website', free: '❌', basic: 'Basic', standard: 'Full', premium: 'Premium', enterprise: 'Custom' },
  { feature: 'Digital ID Card & QR Code', free: '❌', basic: '✅', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Reviews & Ratings', free: '❌', basic: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Services & Products Listing', free: '❌', basic: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Featured Company Placement', free: '❌', basic: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Candidate Search & Filtering', free: '❌', basic: '❌', standard: 'Basic', premium: 'Advanced', enterprise: 'Advanced' },
  { feature: 'Interview Scheduling & Leads', free: '❌', basic: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
  { feature: 'Advanced Analytics & Reports', free: '❌', basic: '❌', standard: '❌', premium: '✅', enterprise: '✅' },
  { feature: 'Premium SEO Enhancement', free: '❌', basic: '❌', standard: 'Basic', premium: 'Advanced', enterprise: 'Advanced' },
  { feature: 'Multiple HR Users', free: '❌', basic: '❌', standard: '❌', premium: '❌', enterprise: '✅' },
  { feature: 'Branch / Franchise Mgmt', free: '❌', basic: '❌', standard: '❌', premium: '❌', enterprise: '✅' },
  { feature: 'Priority Customer Support', free: '❌', basic: '❌', standard: '✅', premium: '✅', enterprise: '✅' },
];

const FAQS = [
  { q: 'Why is ₹999/year the most recommended plan for Theni local businesses?', a: 'At just ₹2.74 per day, the Standard plan provides 15 job postings, full company portfolio, QR digital ID, customer reviews, leads management, and priority placement — giving your business maximum visibility in Theni.' },
  { q: 'Can I upgrade my plan anytime?', a: 'Yes! You can upgrade your plan at any time from your Employer Billing dashboard. Upgrades take effect immediately.' },
  { q: 'How does the company digital ID card work?', a: 'Starting from the Basic plan (₹499/yr), your company gets an official digital ID card with a QR code that links directly to your public verified business portfolio.' },
  { q: 'What payment options are available?', a: 'We accept all major UPI apps (GPay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and popular wallets.' },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-24">
      <Header />

      {/* Hero Header */}
      <div className="pt-24 pb-12 px-4 text-center bg-gradient-to-b from-blue-600 to-indigo-700 text-white">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 text-xs font-bold border border-white/20">
            <Zap size={14} className="text-amber-300" /> Affordable Annual Plans for Local Businesses
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Simple, Honest Pricing
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Grow your company with local job postings, digital ID cards, verified portfolios, and recruitment tools in Theni & Tamil Nadu.
          </p>
        </div>
      </div>

      {/* 5 Annual Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isStandard = plan.slug === 'standard';
            return (
              <div
                key={plan.slug}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between relative shadow-sm hover:shadow-md ${
                  isStandard ? 'border-blue-600 ring-2 ring-blue-600/30' : 'border-gray-100'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-extrabold shadow-sm">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-base font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {plan.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5 min-h-[32px]">{plan.bestFor}</p>
                  </div>

                  {/* Price breakdown */}
                  <div className="text-center py-2 bg-gray-50 rounded-2xl border border-gray-100">
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
                        <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 mt-4 border-t border-gray-100">
                  <Link
                    href="/company/register"
                    className={`w-full py-2.5 rounded-xl text-xs font-bold text-center block transition-all ${
                      isStandard
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {plan.price === 0 ? 'Start Free' : `Select ${plan.name}`}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix Table */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 mb-4 text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Plan → Feature Access Matrix
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-700">
                  <th className="p-3 font-bold">Feature</th>
                  <th className="p-3 font-bold text-center">Free (₹0)</th>
                  <th className="p-3 font-bold text-center">Basic (₹499)</th>
                  <th className="p-3 font-bold text-center bg-blue-50 text-blue-700">Standard (₹999) ⭐</th>
                  <th className="p-3 font-bold text-center">Premium (₹1,999)</th>
                  <th className="p-3 font-bold text-center">Enterprise (₹3,999)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARISON_MATRIX.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="p-3 font-semibold text-gray-900">{row.feature}</td>
                    <td className="p-3 text-center text-gray-600">{row.free}</td>
                    <td className="p-3 text-center text-gray-600">{row.basic}</td>
                    <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/40">{row.standard}</td>
                    <td className="p-3 text-center text-gray-600">{row.premium}</td>
                    <td className="p-3 text-center text-gray-600">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQs */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-gray-900"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
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
      </div>

      <BottomNav />
    </div>
  );
}
