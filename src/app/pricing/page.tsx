'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight, Check, Crown, Shield, Zap, Sparkles, Loader2, Lock, Building2, ShieldCheck, HelpCircle } from 'lucide-react';
import Header from '@/components/navigation/Header';
import { YEARLY_SUBSCRIPTION_PLANS, formatPlanPeriod, normalizePlanSlug, type VisibleSubscriptionPlanSlug } from '@/lib/subscriptions';
import { useAuth } from '@/contexts/AuthContext';
import UpgradePlanDialog from '@/components/portal/UpgradePlanDialog';
import { db } from '@/lib/firebase/config';

interface FeatureItem {
  text: string;
  tooltip: string;
}

const customPlanFeatures: Record<VisibleSubscriptionPlanSlug, FeatureItem[]> = {
  free: [
    { text: 'Basic Company Profile', tooltip: 'Set up a basic profile for your business with contact info and operational hours.' },
    { text: 'View Jobs & Business Listings', tooltip: 'Browse all available jobs and listings on the THENIJOBS platform.' },
    { text: 'Apply for Standard Jobs', tooltip: 'Apply to standard job listings posted by employers.' },
    { text: '1 Active Job Posting (30 Days)', tooltip: 'Post 1 job at a time. The posting remains active for 30 days.' },
    { text: 'Product Catalogue (3 Products)', tooltip: 'Showcase up to 3 products in your online catalog.' },
    { text: 'Service Listings (3 Services)', tooltip: 'List up to 3 services you offer to local clients.' },
    { text: '6 Gallery Images', tooltip: 'Upload up to 6 high-quality images of your business or products.' },
    { text: 'Basic SEO', tooltip: 'Default title and meta description tags configuration for search engines.' },
    { text: 'Basic Business Badge', tooltip: 'Get a clean, basic verified badge on your profile.' },
    { text: 'QR Code & Public Profile URL', tooltip: 'Generate a shareable QR code and custom slug URL for your public profile.' },
  ],
  basic: [
    { text: 'Everything in Free Plan', tooltip: 'Access all features included in the Free tier.' },
    { text: '10 Active Job Postings', tooltip: 'Post and manage up to 10 active job listings simultaneously.' },
    { text: 'Product Catalogue (20 Products)', tooltip: 'Showcase up to 20 products in your digital storefront.' },
    { text: 'Service Listings (10 Services)', tooltip: 'Showcase up to 10 professional services to customers.' },
    { text: '5 Professional Themes', tooltip: 'Choose from 5 premium themes to style your public business card.' },
    { text: 'Custom Cover Banner', tooltip: 'Upload a personalized high-resolution cover banner for your page.' },
    { text: '10 Gallery Images', tooltip: 'Upload up to 10 high-quality photos to your gallery.' },
    { text: '2 Videos', tooltip: 'Embed up to 2 promotional or introduction videos from YouTube/Vimeo.' },
    { text: 'Branch Details', tooltip: 'Add addresses and contact details for multiple business branches.' },
    { text: 'Click-to-Call', tooltip: 'Add direct click-to-call action buttons for easy customer contact.' },
    { text: 'Company Brochure PDF Download', tooltip: 'Allow profile visitors to download your business brochure in PDF format.' },
    { text: 'Silver Verified Badge', tooltip: 'Stand out with a silver verification badge indicating a trusted business.' },
    { text: 'Profile Views Counter', tooltip: 'Monitor traffic with a public/private profile view counter.' },
    { text: 'FAQ Section', tooltip: 'Add a frequently asked questions section to answer customer queries.' },
    { text: 'Enhanced SEO', tooltip: 'Custom meta titles, descriptions, keywords, and search engine optimization.' },
  ],
  premium: [
    { text: 'Everything in Standard Plan', tooltip: 'Access all features of the Free and Standard tiers.' },
    { text: '50 Active Job Postings', tooltip: 'Post and manage up to 50 active job listings at any time.' },
    { text: 'Product Catalogue (100 Products)', tooltip: 'Showcase up to 100 products in an organized digital storefront.' },
    { text: 'Service Listings (50 Services)', tooltip: 'Showcase up to 50 professional services with booking queries.' },
    { text: '15 Premium Themes', tooltip: 'Choose from 15 high-end, responsive layouts for your page.' },
    { text: 'Animated / Video Banner', tooltip: 'Engage visitors with dynamic, auto-playing video or animated banners.' },
    { text: '50 Gallery Images', tooltip: 'Upload a comprehensive photo gallery of up to 50 images.' },
    { text: '10 Videos', tooltip: 'Embed up to 10 product demonstrations or promotional videos.' },
    { text: 'Awards & Certificates Showcase', tooltip: 'Feature achievements, certifications, and industry recognitions.' },
    { text: 'Clients Showcase', tooltip: 'Display client logos and testimonials on your page.' },
    { text: 'Google Analytics Integration', tooltip: 'Track views, bounces, and referral sources directly on your profile.' },
    { text: 'Facebook Pixel Integration', tooltip: 'Track conversions and retarget visitors with Facebook ads.' },
    { text: 'Leads Dashboard', tooltip: 'Capture, manage, and download business leads and inquiry data.' },
    { text: 'Custom CTA Buttons', tooltip: 'Create custom Call-to-Action buttons linkable to external platforms.' },
    { text: 'Blog Section', tooltip: 'Publish news, updates, and articles to share company updates.' },
    { text: 'Company Profile PDF Download', tooltip: 'Generate and download a stylized PDF profile card dynamically.' },
    { text: 'Appointment Booking', tooltip: 'Allow visitors to book appointments or request service schedules.' },
    { text: 'Live Chat Widget', tooltip: 'Integrate direct live chat buttons (like WhatsApp, Messenger, or Tawk.to).' },
    { text: 'Gold Verified Badge', tooltip: 'Distinguish your brand with a prestigious gold verification badge.' },
    { text: 'Featured Search Priority', tooltip: 'Get boosted to the top of category searches and directory listings.' },
  ],
  enterprise: [
    { text: 'Everything in Premium Plan', tooltip: 'Access all features of Free, Standard, and Premium tiers.' },
    { text: 'Unlimited Active Job Postings', tooltip: 'Post as many jobs as your company needs with no constraints.' },
    { text: 'Unlimited Products & Services', tooltip: 'Upload your entire product inventory and services directory.' },
    { text: 'Unlimited Gallery Images & Videos', tooltip: 'Upload an unlimited gallery of images and embed unlimited videos.' },
    { text: 'Unlimited Premium Themes', tooltip: 'Access all current and future premium themes, templates, and designs.' },
    { text: 'Custom Brand Colors & Fonts', tooltip: 'Fully white-label your profile with your specific brand colors and typography.' },
    { text: 'CEO Message Section', tooltip: 'Display a dedicated CEO/Founder profile message card on your page.' },
    { text: 'Founder Video', tooltip: 'Embed a prominent video message from the founder on your homepage.' },
    { text: 'Interactive Company Timeline', tooltip: 'Share your company history and milestones with an interactive timeline.' },
    { text: 'Custom Domain Support', tooltip: 'Point your own custom domain (e.g. careers.mycompany.com) directly to your profile.' },
    { text: 'AI Company Assistant (Chatbot)', tooltip: 'Train an AI assistant on your business info to answer customer questions 24/7.' },
    { text: 'CRM Dashboard', tooltip: 'Advanced CRM dashboard with lead assignment and status pipeline tracking.' },
    { text: 'Multi-Admin Access', tooltip: 'Grant dashboard management access to multiple team members or admins.' },
    { text: 'Careers Portal', tooltip: 'Fully functional dedicated careers page branded for your organization.' },
    { text: 'Partner Logos Showcase', tooltip: 'Display partners, sponsors, or vendor logos to build corporate trust.' },
    { text: 'Platinum Corporate Badge', tooltip: 'Obtain the highest tier corporate verification badge on the directory.' },
    { text: 'Homepage Featured Priority', tooltip: 'Get premium exposure on the THENIJOBS homepage and search banners.' },
  ],
};

const planBadges: Record<VisibleSubscriptionPlanSlug, string | null> = {
  free: '🆓 Basic Badge',
  basic: '🥈 Silver Verified',
  premium: '👑 Gold Verified',
  enterprise: '💎 Platinum Corporate',
};

const taglines: Record<VisibleSubscriptionPlanSlug, string> = {
  free: 'Best for New Users & Startups',
  basic: 'Best for Local Shops & Growing Businesses',
  premium: 'Best for Established Companies',
  enterprise: 'Best for Large Enterprises & Factories',
};

export default function PricingPage() {
  const { user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [currentPlan, setCurrentPlan] = useState<VisibleSubscriptionPlanSlug>('free');

  useEffect(() => {
    async function fetchCompanyPlan() {
      if (user?.companyId) {
        try {
          const compRef = doc(db, 'companies', user.companyId);
          const compSnap = await getDoc(compRef);
          if (compSnap.exists()) {
            const data = compSnap.data();
            const plan = normalizePlanSlug(data?.subscriptionPlan || (data?.isPremium ? 'premium' : 'free'));
            setCurrentPlan(plan);
          }
        } catch (err) {
          console.error('Failed to fetch company plan:', err);
        }
      }
    }
    fetchCompanyPlan();
  }, [user]);

  const handlePlanSelect = (slug: string) => {
    if (slug === 'free') return;
    setSelectedUpgrade(slug as 'basic' | 'premium' | 'enterprise');
    setUpgradeOpen(true);
  };

  // Determine audience from user role
  const audience: 'seeker' | 'employer' =
    user?.role === 'job_seeker' ? 'seeker' : 'employer';

  return (
    <main className="min-h-screen bg-[#0a0a1a] blob-bg grid-pattern text-slate-900">
      <Header />

      <section className="px-4 pb-20 pt-28 sm:px-6">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 mb-5 animate-fade-in">
              <Sparkles size={13} className="text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Yearly Plans Only</span>
            </div>
            <h1 className="font-outfit text-4xl sm:text-5xl font-black text-white leading-tight gradient-text">
              Flexible Plans for Every Stage of Business Growth
            </h1>
            <p className="mt-4 text-base font-semibold leading-relaxed text-slate-400 max-w-2xl mx-auto">
              THENIJOBS subscriptions run on a yearly model. Paid features unlock only for companies with an active plan. Enhance trust, visibility, and recruitment today.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4 items-stretch">
            {YEARLY_SUBSCRIPTION_PLANS.map((plan) => {
              const isFree = plan.slug === 'free';
              const isBasic = plan.slug === 'basic';
              const isPremium = plan.slug === 'premium';
              const isEnterprise = plan.slug === 'enterprise';

              const features = customPlanFeatures[plan.slug];
              const badgeText = planBadges[plan.slug];
              const tagline = taglines[plan.slug];

              return (
                <article
                  key={plan.slug}
                  className={`relative rounded-[20px] p-[2px] transition-all duration-300 hover:-translate-y-2 flex flex-col justify-between h-full ${
                    isPremium
                      ? 'bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 shadow-xl shadow-amber-500/10 scale-[1.02] lg:scale-[1.05] z-10 hover:shadow-2xl hover:shadow-amber-500/20'
                      : isEnterprise
                        ? 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-600 shadow-xl hover:shadow-2xl'
                        : isBasic
                          ? 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 shadow-md hover:shadow-lg'
                          : 'bg-slate-800/40 border border-slate-700/50 shadow-sm hover:shadow-md'
                  }`}
                  style={{ minHeight: '100%' }}
                >
                  {/* Recommended Ribbon */}
                  {isPremium && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-black tracking-widest uppercase px-4 py-1 rounded-full shadow-lg border border-amber-300/30 animate-pulse">
                      ⭐ MOST POPULAR
                    </span>
                  )}
                  {/* Enterprise Ribbon */}
                  {isEnterprise && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-slate-100 text-[10px] font-black tracking-widest uppercase px-4 py-1 rounded-full shadow-lg border border-slate-600/30">
                      💎 ENTERPRISE
                    </span>
                  )}

                  {/* Inner Card Container */}
                  <div
                    className={`rounded-[18px] p-6 flex flex-col justify-between h-full w-full ${
                      isEnterprise
                        ? 'bg-[#0b0c15] text-white'
                        : 'bg-white text-slate-900'
                    }`}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between">
                        {/* Plan Icon */}
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-inner ${
                            isPremium
                              ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white'
                              : isEnterprise
                                ? 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 text-slate-900'
                                : isBasic
                                  ? 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-white'
                                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                          }`}
                        >
                          {isPremium && <Crown size={22} className="animate-bounce-slow" />}
                          {isEnterprise && <Building2 size={22} />}
                          {isBasic && <Zap size={22} />}
                          {isFree && <ShieldCheck size={22} />}
                        </div>

                        {/* Verified Badges */}
                        {badgeText && (
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider shadow-sm ${
                              isPremium
                                ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                                : isEnterprise
                                  ? 'bg-purple-950/40 text-purple-200 border-purple-800/40'
                                  : isBasic
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}
                          >
                            {badgeText}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-5 text-2xl font-black font-outfit tracking-tight">{plan.name}</h2>
                      <p className={`mt-1.5 text-xs font-semibold leading-relaxed ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                        {tagline}
                      </p>

                      {/* Pricing block */}
                      <div className="mt-5 flex items-baseline">
                        <span className={`text-4xl font-extrabold font-outfit tracking-tight ${isPremium ? 'text-amber-500' : isEnterprise ? 'text-white' : 'text-slate-900'}`}>
                          {plan.displayPrice}
                        </span>
                        <span className={`ml-1 text-sm font-bold ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                          / {plan.durationLabel}
                        </span>
                      </div>

                      {/* Usage Limits (Info Cards) */}
                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className={`rounded-xl p-3 border text-center flex flex-col justify-center transition-all ${
                          isEnterprise
                            ? 'bg-white/[0.04] border-white/[0.06]'
                            : 'bg-slate-50 border-slate-100'
                        }`}>
                          <span className={`text-[10px] uppercase tracking-wider font-extrabold block mb-1 ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                            Active Jobs
                          </span>
                          <span className={`text-base font-black ${isEnterprise ? 'text-white' : 'text-slate-800'}`}>
                            {plan.maxActiveJobs === 99999 ? 'Unlimited' : plan.maxActiveJobs}
                          </span>
                        </div>
                        <div className={`rounded-xl p-3 border text-center flex flex-col justify-center transition-all ${
                          isEnterprise
                            ? 'bg-white/[0.04] border-white/[0.06]'
                            : 'bg-slate-50 border-slate-100'
                        }`}>
                          <span className={`text-[10px] uppercase tracking-wider font-extrabold block mb-1 ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                            Job Alerts
                          </span>
                          <span className={`text-base font-black ${isEnterprise ? 'text-white' : 'text-slate-800'}`}>
                            {plan.maxJobAlerts === 99999 ? 'Unlimited' : plan.maxJobAlerts}
                          </span>
                        </div>
                      </div>

                      {/* Pricing Summary */}
                      <div className="mt-5 text-center">
                        <p className={`text-[11px] font-bold tracking-wide uppercase ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                          Billing: <span className={isEnterprise ? 'text-slate-200' : 'text-slate-800'}>{plan.displayPrice} / 1 Year</span>
                        </p>
                      </div>

                      {/* Divider */}
                      <div className={`h-[1px] w-full my-6 ${isEnterprise ? 'bg-slate-800' : 'bg-slate-150'}`} />

                      {/* Features Checklist */}
                      <div className="space-y-3.5">
                        <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>
                          Key Features
                        </span>
                        {features.map((f, idx) => (
                          <div
                            key={idx}
                            className="relative group flex items-start gap-2 text-sm font-semibold cursor-help"
                          >
                            <Check
                              size={15}
                              className={`mt-0.5 shrink-0 ${
                                isPremium
                                  ? 'text-amber-500'
                                  : isEnterprise
                                    ? 'text-purple-400'
                                    : 'text-emerald-500'
                              }`}
                            />
                            <span className={isEnterprise ? 'text-slate-200' : 'text-slate-700'}>
                              {f.text}
                            </span>
                            
                            {/* Feature Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 bg-slate-950 text-white text-[11px] p-2 rounded-lg shadow-xl border border-slate-800 font-normal leading-relaxed text-center z-30 transition-all duration-200">
                              {f.tooltip}
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-8">
                      {isFree ? (
                        <Link
                          href={user ? (user.role === 'job_seeker' ? '/seeker/dashboard' : '/employer/dashboard') : '/register'}
                          className="flex w-full items-center justify-center gap-2 rounded-xl h-[52px] text-sm font-black transition-all bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        >
                          Get Started <ArrowRight size={15} />
                        </Link>
                      ) : user ? (
                        <button
                          onClick={() => handlePlanSelect(plan.slug)}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl h-[52px] text-sm font-black transition-all shadow-lg cursor-pointer hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            isPremium
                              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white focus-visible:ring-amber-500 shadow-amber-500/20'
                              : isEnterprise
                                ? 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 text-slate-950 hover:from-white hover:to-slate-200 focus-visible:ring-slate-400'
                                : 'bg-gradient-to-r from-slate-400 via-slate-500 to-blue-600 hover:from-slate-500 hover:to-blue-700 text-white focus-visible:ring-blue-500 shadow-slate-400/25'
                          }`}
                        >
                          <Lock size={14} className="shrink-0" />
                          Pay Now
                          <ArrowRight size={15} />
                        </button>
                      ) : (
                        <Link
                          href="/register"
                          className={`flex w-full items-center justify-center gap-2 rounded-xl h-[52px] text-sm font-black transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            isPremium
                              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white focus-visible:ring-amber-500 shadow-amber-500/20'
                              : isEnterprise
                                ? 'bg-gradient-to-r from-slate-200 via-slate-300 to-slate-400 text-slate-950 hover:from-white hover:to-slate-200 focus-visible:ring-slate-400'
                                : 'bg-gradient-to-r from-slate-400 via-slate-500 to-blue-600 hover:from-slate-500 hover:to-blue-700 text-white focus-visible:ring-blue-500 shadow-slate-400/25'
                          }`}
                        >
                          Get Started <ArrowRight size={15} />
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {user && (
        <UpgradePlanDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          currentPlan={currentPlan}
          audience={audience}
          userName={user.displayName || undefined}
          userEmail={user.email || undefined}
          initialPlan={selectedUpgrade}
          onUpgradeComplete={() => {
            window.location.reload();
          }}
        />
      )}
    </main>
  );
}
