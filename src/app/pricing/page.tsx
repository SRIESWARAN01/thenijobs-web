'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowRight, Check, Crown, Shield, Zap, Sparkles, Lock, Building2, ShieldCheck, X, ChevronDown, ChevronUp, Palette, Camera, BarChart3, Megaphone, Headphones, Globe, Layout } from 'lucide-react';
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
    { text: '1 Active Job Posting', tooltip: 'Post 1 job at a time. The posting remains active for 30 days.' },
    { text: '2 Job Alerts', tooltip: 'Receive up to 2 job alert notifications.' },
    { text: 'Product Catalogue (3 Products)', tooltip: 'Showcase up to 3 products in your online catalog.' },
    { text: 'Service Listings (3 Services)', tooltip: 'List up to 3 services you offer to local clients.' },
    { text: '6 Gallery Images', tooltip: 'Upload up to 6 high-quality images of your business or products.' },
    { text: '1 Website Template & 2 Themes', tooltip: 'Access 1 basic template and 2 color themes for your profile.' },
    { text: 'Basic Digital Visiting Card', tooltip: 'Generate a simple digital card for sharing with clients.' },
    { text: 'Basic SEO & Schema', tooltip: 'Default title, meta description, and basic schema markup.' },
    { text: 'QR Code & Public Profile URL', tooltip: 'Generate a shareable QR code and custom slug URL for your public profile.' },
    { text: 'Basic WhatsApp Enquiry', tooltip: 'Basic WhatsApp link for customer enquiries.' },
    { text: 'Google Maps & Contact Form', tooltip: 'Show your location and accept enquiries via contact form.' },
    { text: 'Customer Reviews', tooltip: 'Accept and display customer reviews on your profile.' },
    { text: 'Basic Verification Badge', tooltip: 'Get a clean, basic verified badge on your profile.' },
  ],
  basic: [
    { text: 'Everything in Free Plan', tooltip: 'Access all features included in the Free tier.' },
    { text: '10 Active Job Postings', tooltip: 'Post and manage up to 10 active job listings simultaneously.' },
    { text: '10 Job Alerts', tooltip: 'Receive up to 10 job alert notifications.' },
    { text: 'Product Catalogue (20 Products)', tooltip: 'Showcase up to 20 products in your digital storefront.' },
    { text: 'Service Listings (10 Services)', tooltip: 'Showcase up to 10 professional services to customers.' },
    { text: '10 Gallery Images & 2 Videos', tooltip: 'Upload up to 10 photos and embed 2 promotional videos.' },
    { text: '5 Templates & 5 Color Themes', tooltip: 'Choose from 5 premium templates and 5 color themes.' },
    { text: 'Custom Cover Banner', tooltip: 'Upload a personalized high-resolution cover banner for your page.' },
    { text: 'Premium Digital Visiting Card', tooltip: 'Enhanced digital card with better styling and more fields.' },
    { text: '5 Team Members & 3 Branches', tooltip: 'Add up to 5 team members and 3 branch locations.' },
    { text: 'Click-to-Call & FAQ Section', tooltip: 'Direct call buttons and a frequently asked questions section.' },
    { text: 'Photo Albums & Review Photos', tooltip: 'Organize images in albums and allow photo reviews from customers.' },
    { text: 'Business Brochure PDF', tooltip: 'Allow visitors to download your business brochure in PDF format.' },
    { text: 'Enhanced SEO & Custom Meta Tags', tooltip: 'Custom meta titles, descriptions, keywords, and SEO optimization.' },
    { text: 'View Counters (Profile, Jobs, Business)', tooltip: 'Track profile, job, and business listing views.' },
    { text: 'Business Announcements & Offers', tooltip: 'Post business announcements and seasonal offers.' },
    { text: 'Silver Verified Badge', tooltip: 'Stand out with a silver verification badge indicating a trusted business.' },
  ],
  premium: [
    { text: 'Everything in Standard Plan', tooltip: 'Access all features of the Free and Standard tiers.' },
    { text: '50 Active Job Postings', tooltip: 'Post and manage up to 50 active job listings at any time.' },
    { text: '50 Job Alerts', tooltip: 'Receive up to 50 job alert notifications.' },
    { text: 'Product Catalogue (100 Products)', tooltip: 'Showcase up to 100 products in an organized digital storefront.' },
    { text: 'Service Listings (50 Services)', tooltip: 'Showcase up to 50 professional services with booking queries.' },
    { text: '50 Gallery Images & 10 Videos', tooltip: 'Upload a comprehensive gallery and embed up to 10 videos.' },
    { text: '15 Premium Templates & 15 Themes', tooltip: 'Choose from 15 high-end responsive layouts and 15 themes.' },
    { text: 'Video Banner', tooltip: 'Engage visitors with dynamic auto-playing video banners.' },
    { text: 'Premium+ Digital Card & 25 Staff IDs', tooltip: 'Enhanced digital card plus generate up to 25 staff ID cards.' },
    { text: '20 Team Members & 20 Branches', tooltip: 'Add up to 20 team members and 20 branch locations.' },
    { text: 'Awards & Certifications Showcase', tooltip: 'Feature achievements, certifications, and industry recognitions.' },
    { text: 'Google Analytics & Meta Pixel', tooltip: 'Track views, bounces, and retarget visitors with Facebook ads.' },
    { text: 'Advanced Analytics & Leads Dashboard', tooltip: 'Advanced analytics with lead capture and management tools.' },
    { text: 'Blog, Booking & Live Chat', tooltip: 'Blog section, appointment booking, and live chat widget.' },
    { text: 'Dynamic QR Code', tooltip: 'QR codes that can be updated without reprinting.' },
    { text: 'Gold Verified Badge', tooltip: 'Distinguish your brand with a prestigious gold verification badge.' },
    { text: 'Featured Search Priority', tooltip: 'Get boosted to the top of category searches and directory listings.' },
  ],
  enterprise: [
    { text: 'Everything in Premium Plan', tooltip: 'Access all features of Free, Standard, and Premium tiers.' },
    { text: 'Unlimited Jobs, Products & Services', tooltip: 'Post unlimited jobs, products, and services with no constraints.' },
    { text: 'Unlimited Gallery, Videos & Albums', tooltip: 'Upload unlimited media content across all formats.' },
    { text: 'Unlimited Templates & Themes', tooltip: 'Access all current and future templates, themes, and designs.' },
    { text: 'Advanced Branding & Custom Colors/Fonts', tooltip: 'Fully white-label your profile with brand colors and typography.' },
    { text: 'Enterprise Digital Card & Unlimited Staff IDs', tooltip: 'Enterprise-grade digital card and unlimited staff ID generation.' },
    { text: 'Custom Domain Support', tooltip: 'Point your own domain (e.g. careers.mycompany.com) to your profile.' },
    { text: 'AI Company Assistant (Chatbot)', tooltip: 'Train an AI assistant on your business info for 24/7 customer support.' },
    { text: 'AI SEO Content & AI Generated Meta Tags', tooltip: 'AI-powered content generation and automatic meta tag optimization.' },
    { text: 'CRM Dashboard & Multi-Admin Access', tooltip: 'Advanced CRM with lead pipeline and team management access.' },
    { text: 'Enterprise Careers Portal', tooltip: 'Fully functional dedicated careers page branded for your organization.' },
    { text: 'CEO Message & Interactive Timeline', tooltip: 'Showcase company history and CEO message on your profile.' },
    { text: 'Partner Logo Showcase', tooltip: 'Display partners, sponsors, or vendor logos to build corporate trust.' },
    { text: 'Platinum Corporate Badge', tooltip: 'Obtain the highest tier corporate verification badge on the directory.' },
    { text: 'Homepage Featured & Top Search Priority', tooltip: 'Get premium exposure on homepage and highest search ranking.' },
    { text: '24×7 Priority Support', tooltip: 'Round-the-clock dedicated priority support for enterprise clients.' },
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

// ────────────────────────────────────────────────────────────────────
// Feature Comparison Table Data
// ────────────────────────────────────────────────────────────────────

type FeatureValue = string | boolean;

interface ComparisonFeature {
  name: string;
  free: FeatureValue;
  basic: FeatureValue;
  premium: FeatureValue;
  enterprise: FeatureValue;
}

interface ComparisonGroup {
  name: string;
  icon: React.ReactNode;
  features: ComparisonFeature[];
}

const comparisonGroups: ComparisonGroup[] = [
  {
    name: 'Core Business',
    icon: <Building2 size={16} />,
    features: [
      { name: 'Annual Price', free: '₹0', basic: '₹480', premium: '₹1,200', enterprise: '₹5,000' },
      { name: 'Active Jobs', free: '1', basic: '10', premium: '50', enterprise: 'Unlimited' },
      { name: 'Job Alerts', free: '2', basic: '10', premium: '50', enterprise: 'Unlimited' },
      { name: 'Company Profile', free: true, basic: true, premium: true, enterprise: true },
      { name: 'Public Business Website', free: true, basic: true, premium: true, enterprise: true },
      { name: 'Mobile Responsive Website', free: true, basic: true, premium: true, enterprise: true },
      { name: 'Business Hours', free: true, basic: true, premium: true, enterprise: true },
      { name: 'Contact Form', free: true, basic: true, premium: true, enterprise: true },
      { name: 'Google Maps', free: true, basic: true, premium: true, enterprise: true },
    ],
  },
  {
    name: 'Website & Branding',
    icon: <Palette size={16} />,
    features: [
      { name: 'Company Logo & Banner', free: 'Logo Only', basic: 'Custom Banner', premium: 'Video Banner', enterprise: 'Advanced Branding' },
      { name: 'Website Templates', free: '1', basic: '5', premium: '15', enterprise: 'Unlimited' },
      { name: 'Color Themes', free: '2', basic: '5', premium: '15', enterprise: 'Unlimited' },
      { name: 'Digital Visiting Card', free: 'Basic', basic: 'Premium', premium: 'Premium+', enterprise: 'Enterprise' },
      { name: 'Staff ID Cards', free: false, basic: false, premium: '25', enterprise: 'Unlimited' },
      { name: 'QR Code', free: true, basic: true, premium: 'Dynamic', enterprise: 'Dynamic + Analytics' },
      { name: 'Custom Domain', free: false, basic: false, premium: false, enterprise: true },
      { name: 'Custom Brand Colors', free: false, basic: false, premium: false, enterprise: true },
      { name: 'Custom Fonts', free: false, basic: false, premium: false, enterprise: true },
    ],
  },
  {
    name: 'Content & Media',
    icon: <Camera size={16} />,
    features: [
      { name: 'Products', free: '3', basic: '20', premium: '100', enterprise: 'Unlimited' },
      { name: 'Services', free: '3', basic: '10', premium: '50', enterprise: 'Unlimited' },
      { name: 'Gallery Images', free: '6', basic: '10', premium: '50', enterprise: 'Unlimited' },
      { name: 'Videos', free: false, basic: '2', premium: '10', enterprise: 'Unlimited' },
      { name: 'Photo Albums', free: false, basic: true, premium: true, enterprise: 'Unlimited' },
      { name: 'Customer Reviews', free: true, basic: true, premium: true, enterprise: true },
      { name: 'Review Photos', free: false, basic: true, premium: true, enterprise: true },
      { name: 'FAQ Section', free: false, basic: true, premium: true, enterprise: true },
      { name: 'Blog Section', free: false, basic: false, premium: true, enterprise: 'Unlimited' },
      { name: 'Business Brochure PDF', free: false, basic: true, premium: true, enterprise: 'Custom PDF' },
      { name: 'Company Profile PDF', free: false, basic: false, premium: true, enterprise: true },
      { name: 'Awards & Certifications', free: false, basic: false, premium: true, enterprise: 'Unlimited' },
      { name: 'Clients Showcase', free: false, basic: false, premium: true, enterprise: 'Unlimited' },
      { name: 'Team Members', free: false, basic: '5', premium: '20', enterprise: 'Unlimited' },
      { name: 'Branch Locations', free: false, basic: '3', premium: '20', enterprise: 'Unlimited' },
    ],
  },
  {
    name: 'Marketing & Engagement',
    icon: <Megaphone size={16} />,
    features: [
      { name: 'WhatsApp Enquiry', free: 'Basic', basic: 'Advanced', premium: 'Smart Auto Message', enterprise: 'Fully Customizable' },
      { name: 'Click-to-Call', free: false, basic: true, premium: true, enterprise: true },
      { name: 'Business Announcements', free: false, basic: true, premium: true, enterprise: 'Unlimited' },
      { name: 'Seasonal Offers', free: false, basic: true, premium: true, enterprise: 'Unlimited' },
      { name: 'Featured Products', free: false, basic: true, premium: true, enterprise: 'Unlimited' },
      { name: 'Related Products', free: false, basic: true, premium: true, enterprise: 'Unlimited' },
      { name: 'Careers Page', free: 'Basic', basic: 'Basic', premium: 'Advanced', enterprise: 'Enterprise Portal' },
      { name: 'Appointment Booking', free: false, basic: false, premium: true, enterprise: 'Advanced' },
      { name: 'Live Chat Widget', free: false, basic: false, premium: true, enterprise: 'AI Chatbot' },
      { name: 'Partner Logo Showcase', free: false, basic: false, premium: false, enterprise: true },
    ],
  },
  {
    name: 'SEO & Analytics',
    icon: <BarChart3 size={16} />,
    features: [
      { name: 'SEO Optimization', free: 'Basic', basic: 'Enhanced', premium: 'Advanced', enterprise: 'AI SEO' },
      { name: 'XML Sitemap', free: true, basic: true, premium: true, enterprise: true },
      { name: 'Schema Markup', free: 'Basic', basic: 'Advanced', premium: 'Complete', enterprise: 'Complete' },
      { name: 'Custom Meta Tags', free: false, basic: true, premium: true, enterprise: 'AI Generated' },
      { name: 'Local SEO', free: 'Basic', basic: 'Enhanced', premium: 'Advanced', enterprise: 'Enterprise' },
      { name: 'AI SEO Content', free: false, basic: false, premium: false, enterprise: true },
      { name: 'Product View Counter', free: false, basic: true, premium: true, enterprise: 'Advanced' },
      { name: 'Job View Counter', free: false, basic: true, premium: true, enterprise: 'Advanced' },
      { name: 'Business View Counter', free: false, basic: true, premium: true, enterprise: 'Live Analytics' },
      { name: 'Analytics Dashboard', free: 'Basic', basic: 'Standard', premium: 'Advanced', enterprise: 'Enterprise' },
      { name: 'Google Analytics', free: false, basic: false, premium: true, enterprise: true },
      { name: 'Meta Pixel', free: false, basic: false, premium: true, enterprise: true },
      { name: 'Lead Dashboard', free: false, basic: false, premium: true, enterprise: 'CRM Dashboard' },
    ],
  },
  {
    name: 'Enterprise & AI',
    icon: <Sparkles size={16} />,
    features: [
      { name: 'AI Business Assistant', free: false, basic: false, premium: false, enterprise: true },
      { name: 'CRM Dashboard', free: false, basic: false, premium: false, enterprise: true },
      { name: 'Multi-Admin Access', free: false, basic: false, premium: false, enterprise: true },
      { name: 'AI Website Builder', free: false, basic: false, premium: false, enterprise: true },
    ],
  },
  {
    name: 'Trust & Support',
    icon: <Headphones size={16} />,
    features: [
      { name: 'Verification Badge', free: 'Basic', basic: 'Silver', premium: 'Gold', enterprise: 'Platinum Corporate' },
      { name: 'Search Ranking Priority', free: 'Standard', basic: 'Silver', premium: 'Gold', enterprise: 'Platinum' },
      { name: 'Homepage Featured', free: false, basic: false, premium: 'Featured', enterprise: 'Top Priority' },
      { name: 'Priority Support', free: 'Community', basic: 'Email', premium: 'Priority Email', enterprise: '24×7 Priority' },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────
// Template Access Data
// ────────────────────────────────────────────────────────────────────

interface TemplateAccess {
  emoji: string;
  planName: string;
  planSlug: VisibleSubscriptionPlanSlug;
  templates: string[];
  accent: string;
  gradient: string;
}

const templateAccessData: TemplateAccess[] = [
  {
    emoji: '🆓',
    planName: 'Free',
    planSlug: 'free',
    templates: ['Classic Directory', 'Basic Business Profile'],
    accent: 'border-blue-500/20 text-blue-400',
    gradient: 'from-blue-500/10 to-indigo-500/5',
  },
  {
    emoji: '🥈',
    planName: 'Standard',
    planSlug: 'basic',
    templates: ['Classic Directory', 'Business Directory', 'Modern Portfolio', '5 Color Themes'],
    accent: 'border-slate-400/20 text-slate-300',
    gradient: 'from-slate-400/10 to-slate-500/5',
  },
  {
    emoji: '👑',
    planName: 'Premium',
    planSlug: 'premium',
    templates: [
      'All Standard Templates',
      'E-Commerce Storefront',
      'Service Booking Portal',
      'Corporate Website',
      'Restaurant Template',
      'Healthcare Template',
      'Education Template',
      '15 Premium Themes',
    ],
    accent: 'border-amber-500/20 text-amber-400',
    gradient: 'from-amber-500/10 to-orange-500/5',
  },
  {
    emoji: '💎',
    planName: 'Enterprise',
    planSlug: 'enterprise',
    templates: [
      'Unlimited Templates & Themes',
      'Custom Layout Builder',
      'Custom Sections',
      'White-label Branding',
      'AI Website Builder',
      'Custom Domain',
      'API Integrations',
    ],
    accent: 'border-purple-500/20 text-purple-300',
    gradient: 'from-purple-500/10 to-violet-500/5',
  },
];

// ────────────────────────────────────────────────────────────────────
// Upgrade Highlights Data
// ────────────────────────────────────────────────────────────────────

interface UpgradeHighlight {
  emoji: string;
  planName: string;
  planSlug: VisibleSubscriptionPlanSlug;
  tagline: string;
  highlights: string[];
  gradient: string;
  border: string;
}

const upgradeHighlights: UpgradeHighlight[] = [
  {
    emoji: '🆓',
    planName: 'Free',
    planSlug: 'free',
    tagline: 'Ideal for startups',
    highlights: ['Professional business profile', 'Basic website with mobile support', 'QR code & digital card', 'Community support'],
    gradient: 'from-blue-500/5 to-indigo-500/5',
    border: 'border-blue-500/15',
  },
  {
    emoji: '🥈',
    planName: 'Standard',
    planSlug: 'basic',
    tagline: 'Grow your visibility',
    highlights: ['More jobs, products & services', 'Better branding & themes', 'Enhanced SEO & meta tags', 'Digital brochure & view counters'],
    gradient: 'from-slate-400/5 to-slate-500/5',
    border: 'border-slate-400/15',
  },
  {
    emoji: '👑',
    planName: 'Premium',
    planSlug: 'premium',
    tagline: 'Scale your business',
    highlights: ['Advanced templates & analytics', 'Lead management & CRM', 'Live chat & appointment booking', 'Featured business placement'],
    gradient: 'from-amber-500/5 to-orange-500/5',
    border: 'border-amber-500/15',
  },
  {
    emoji: '💎',
    planName: 'Enterprise',
    planSlug: 'enterprise',
    tagline: 'Ultimate power',
    highlights: ['Unlimited resources & AI tools', 'CRM & multi-admin management', 'Custom domain & branding', 'Highest search priority & 24×7 support'],
    gradient: 'from-purple-500/5 to-violet-500/5',
    border: 'border-purple-500/15',
  },
];

// ────────────────────────────────────────────────────────────────────
// Helper for rendering comparison table cell values
// ────────────────────────────────────────────────────────────────────

function renderCellValue(value: FeatureValue, planSlug: VisibleSubscriptionPlanSlug) {
  if (value === true) {
    const checkColor =
      planSlug === 'premium' ? 'text-amber-400' :
      planSlug === 'enterprise' ? 'text-purple-400' :
      planSlug === 'basic' ? 'text-slate-300' :
      'text-emerald-400';
    return <Check size={16} className={checkColor} />;
  }
  if (value === false) {
    return <X size={14} className="text-slate-500" />;
  }
  return <span className="text-[11px] sm:text-xs font-semibold text-slate-300">{value}</span>;
}

// ────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [selectedUpgrade, setSelectedUpgrade] = useState<'basic' | 'premium' | 'enterprise'>('premium');
  const [currentPlan, setCurrentPlan] = useState<VisibleSubscriptionPlanSlug>('free');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Initialize all groups as expanded
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    comparisonGroups.forEach((g) => { initial[g.name] = true; });
    setExpandedGroups(initial);
  }, []);

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
                                    ? 'bg-slate-100 text-slate-500 border-slate-200'
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
                            <span className={isEnterprise ? 'text-slate-200' : 'text-slate-400'}>
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

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Feature Comparison Table                                    */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="mt-28" id="compare">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 mb-5">
                <Layout size={13} className="text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Full Feature Comparison</span>
              </div>
              <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white leading-tight">
                Compare Every Feature Across Plans
              </h2>
              <p className="mt-3 text-sm text-slate-400 font-semibold max-w-xl mx-auto">
                See exactly what you get with each plan. Every feature has a clear upgrade path.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden backdrop-blur-sm">
              {/* Sticky header */}
              <div className="sticky top-0 z-20 bg-[#0d0d20]/95 backdrop-blur-md border-b border-white/[0.06]">
                <div className="grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] sm:grid-cols-[1.5fr_repeat(4,1fr)]">
                  <div className="p-3 sm:p-4 text-xs font-black uppercase tracking-wider text-slate-500">Feature</div>
                  <div className="p-3 sm:p-4 text-center">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-400">🆓 Free</span>
                  </div>
                  <div className="p-3 sm:p-4 text-center">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-300">🥈 Standard</span>
                  </div>
                  <div className="p-3 sm:p-4 text-center bg-amber-500/5">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400">👑 Premium</span>
                  </div>
                  <div className="p-3 sm:p-4 text-center">
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-purple-300">💎 Enterprise</span>
                  </div>
                </div>
              </div>

              {/* Groups */}
              {comparisonGroups.map((group) => {
                const isExpanded = expandedGroups[group.name] ?? true;

                return (
                  <div key={group.name}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="w-full grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] sm:grid-cols-[1.5fr_repeat(4,1fr)] bg-white/[0.03] border-y border-white/[0.04] cursor-pointer hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="p-3 sm:p-4 flex items-center gap-2 text-sm font-bold text-white col-span-5 sm:col-span-5">
                        <span className="text-violet-400">{group.icon}</span>
                        {group.name}
                        <span className="ml-auto text-slate-500">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </div>
                    </button>

                    {/* Feature rows */}
                    {isExpanded && group.features.map((feature, idx) => (
                      <div
                        key={feature.name}
                        className={`grid grid-cols-[1fr_repeat(4,minmax(80px,1fr))] sm:grid-cols-[1.5fr_repeat(4,1fr)] border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] ${
                          idx % 2 === 0 ? '' : 'bg-white/[0.01]'
                        }`}
                      >
                        <div className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-300">
                          {feature.name}
                        </div>
                        <div className="p-3 sm:p-4 flex items-center justify-center">
                          {renderCellValue(feature.free, 'free')}
                        </div>
                        <div className="p-3 sm:p-4 flex items-center justify-center">
                          {renderCellValue(feature.basic, 'basic')}
                        </div>
                        <div className="p-3 sm:p-4 flex items-center justify-center bg-amber-500/[0.02]">
                          {renderCellValue(feature.premium, 'premium')}
                        </div>
                        <div className="p-3 sm:p-4 flex items-center justify-center">
                          {renderCellValue(feature.enterprise, 'enterprise')}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Template Access Section                                     */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="mt-28" id="templates">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 mb-5">
                <Globe size={13} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Website Templates</span>
              </div>
              <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white leading-tight">
                Templates Included with Each Plan
              </h2>
              <p className="mt-3 text-sm text-slate-400 font-semibold max-w-xl mx-auto">
                Every plan comes with professionally designed templates. Higher plans unlock premium industry-specific layouts.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {templateAccessData.map((tmpl) => (
                <div
                  key={tmpl.planSlug}
                  className={`rounded-2xl border p-6 bg-gradient-to-br ${tmpl.gradient} ${tmpl.accent} backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{tmpl.emoji}</span>
                    <h3 className="text-lg font-black font-outfit text-white">{tmpl.planName}</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {tmpl.templates.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm font-semibold text-slate-300">
                        <Check size={14} className={`mt-0.5 shrink-0 ${tmpl.accent.includes('amber') ? 'text-amber-400' : tmpl.accent.includes('purple') ? 'text-purple-400' : tmpl.accent.includes('slate') ? 'text-slate-400' : 'text-blue-400'}`} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Upgrade Highlights Section                                  */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="mt-28 mb-8" id="highlights">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 mb-5">
                <Zap size={13} className="text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Why Upgrade</span>
              </div>
              <h2 className="font-outfit text-3xl sm:text-4xl font-black text-white leading-tight">
                What You Unlock at Each Level
              </h2>
              <p className="mt-3 text-sm text-slate-400 font-semibold max-w-xl mx-auto">
                Each plan gives your business meaningful new capabilities and stronger incentives to grow.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {upgradeHighlights.map((uh) => (
                <div
                  key={uh.planSlug}
                  className={`rounded-2xl border p-6 bg-gradient-to-br ${uh.gradient} ${uh.border} backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{uh.emoji}</span>
                    <div>
                      <h3 className="text-lg font-black font-outfit text-white">{uh.planName}</h3>
                      <p className="text-xs font-semibold text-slate-400">{uh.tagline}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {uh.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm font-semibold text-slate-300">
                        <ArrowRight size={13} className="mt-0.5 shrink-0 text-cyan-400" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
