'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import {
  MapPin, Phone, Mail, Globe, MessageCircle, Share2, Heart,
  Star, BadgeCheck, Clock, Users, Eye, TrendingUp, ChevronRight,
  Briefcase, Navigation, Building2,
  ShieldCheck, FileCheck, Award, ExternalLink,
  BellRing, Send, Quote, Newspaper, PackagePlus, Crown, UserCheck,
  Lock, Sparkles, Copy, Check, ShieldAlert,
  Calendar, ShoppingBag, Filter, ShoppingCart,
  Image as ImageIcon
} from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/ui/BrandIcons';
import { trackAnalyticsEvent } from '@/lib/analytics';

const renderVerificationBadge = (level?: string, status?: string, size = 18) => {
  const activeLevel = level || (status === 'verified' ? 'standard' : 'free');
  if (activeLevel === 'free') return null;
  if (activeLevel === 'standard') {
    return <span title="Standard Verified Business" className="shrink-0 inline-block align-middle ml-1.5 animate-fade-in"><BadgeCheck size={size} className="text-blue-400 fill-blue-400/10" /></span>;
  }
  if (activeLevel === 'premium') {
    return <span title="Premium Verified Business" className="shrink-0 inline-block align-middle ml-1.5 animate-fade-in"><BadgeCheck size={size} className="text-amber-400 fill-amber-400/10" /></span>;
  }
  if (activeLevel === 'elite') {
    return (
      <span className="inline-flex items-center gap-0.5 align-middle ml-1.5 shrink-0 animate-fade-in">
        <span title="Elite Verified Business"><BadgeCheck size={size} className="text-violet-400 fill-violet-400/10" /></span>
        <span className="text-xs text-violet-400 font-extrabold" style={{ fontSize: size * 0.65 }} title="Elite Crown VIP">👑</span>
      </span>
    );
  }
  return null;
};

export default function CompanyProfileClient({ company, jobs, reviews }: {
  company: any; jobs: any[]; reviews: any[];
}) {
  // Determine plan type: free, basic (Standard), premium
  const plan = company.subscriptionBadge || 'free';

  useEffect(() => {
    if (company?.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'visit'
      });
    }
  }, [company?.id]);

  if (plan === 'premium') {
    return <TemplatePremium company={company} jobs={jobs} reviews={reviews} />;
  } else if (plan === 'basic') {
    return <TemplateStandard company={company} jobs={jobs} reviews={reviews} />;
  } else {
    return <TemplateFree company={company} jobs={jobs} reviews={reviews} />;
  }
}

// ──────────────────────────────────────────────────────────────────
// 1. FREE TEMPLATE (Clean, Minimalist, Slate/Gray Neutral)
// ──────────────────────────────────────────────────────────────────
function TemplateFree({ company, jobs, reviews }: { company: any; jobs: any[]; reviews: any[] }) {
  const [activeTab, setActiveTab] = useState('about');
  const [saved, setSaved] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);

  const handleProductWhatsApp = (productName: string, productId?: string) => {
    const text = `Hello, I viewed your product ${productName} on THENIJOBS and would like more details.`;
    if (company.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'whatsapp_click',
        targetId: productId || null,
        targetName: productName
      });
    }
    window.open(`https://wa.me/${company.whatsapp || company.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'jobs', label: `Jobs (${jobs.length})` },
    { id: 'products', label: `Products (${company.products?.length || 0})` },
    { id: 'locked_gallery', label: 'Gallery 🔒' },
    { id: 'locked_reviews', label: 'Reviews 🔒' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Header />

      <section className="pt-20 pb-16 px-4 max-w-5xl mx-auto">
        {/* Simple Cover Header */}
        <div className="h-40 rounded-2xl relative overflow-hidden bg-slate-900 border border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900" />
          <div className="absolute top-3 right-3 bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
            FREE PROFILE
          </div>
        </div>

        {/* Basic Brand Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6 mb-8">
          <div className="relative w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.name} fill className="object-cover rounded-xl" />
            ) : (
              <Building2 size={24} className="text-slate-500" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center flex-wrap gap-1">
              {company.name}
              {renderVerificationBadge(company.verificationLevel, company.verificationStatus, 16)}
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-slate-300 font-medium">{company.category}</span> · 
              <span className="flex items-center gap-1"><MapPin size={10} />{company.district}</span>
            </p>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left / Middle: Tabs & Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Row */}
            <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-850">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Switcher */}
            {activeTab === 'about' && (
              <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">About the Company</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{company.description}</p>
                </div>
                {company.services?.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-white mb-2">Services</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {company.services.map((svc: string) => (
                        <span key={svc} className="text-[10px] px-2 py-0.5 rounded bg-slate-850 border border-slate-800 text-slate-400">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white mb-2">Active Jobs</h3>
                {jobs.length > 0 ? (
                  jobs.map(job => (
                    <Link key={job.id} href={`/jobs/${job.id}`}
                      className="block p-3 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 transition-colors">
                      <div className="text-xs font-bold text-white">{job.title}</div>
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                        <span>{job.type} · {job.salary}</span>
                        <span>{job.posted}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No active jobs listed.</p>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white mb-2">Products</h3>
                {company.products?.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {company.products.map((product: any) => (
                      <div key={product.id || product.name} className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row gap-4 hover:border-slate-700 transition-colors">
                        {product.images?.[0] && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-800">
                            <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{product.name}</h4>
                              {product.price > 0 && <span className="text-[10px] font-bold text-slate-300">₹{product.price}</span>}
                            </div>
                            {product.category && <span className="text-[8px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{product.category}</span>}
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                          </div>
                          <button
                            onClick={() => handleProductWhatsApp(product.name, product.id)}
                            className="mt-2.5 self-start flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-slate-850 hover:bg-slate-800 transition-colors text-white"
                          >
                            <MessageCircle size={10} /> Enquire on WhatsApp
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">No products catalogue uploaded.</p>
                )}
                {company.products?.length === 1 && (
                  <div className="text-[10px] text-slate-500 text-center mt-2">
                    Upgrade to Standard or Premium to list more products.
                  </div>
                )}
              </div>
            )}

            {activeTab.startsWith('locked_') && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-850 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Branding Feature Locked</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Products & Services, Gallery, and customer reviews are exclusive to Standard or Premium subscribers.
                  </p>
                </div>
                <Link href="/pricing" className="inline-flex items-center gap-1.5 bg-white text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                  Upgrade Subscription <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </div>

          {/* Right Sidebar: Contact Card */}
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Contact Info</h3>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-500" />
                  <span>{company.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-500" />
                  <span className="truncate">{company.email}</span>
                </div>
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-slate-500" />
                    <span className="truncate">{company.website}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Simple Lead Inquiry Form */}
            <div className="bg-slate-900/50 border border-slate-900 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Send Enquiry</h3>
              <input type="text" placeholder="Name" className="w-full bg-slate-950 border border-slate-850 px-3 py-2 text-xs rounded-lg text-white" />
              <input type="tel" placeholder="Mobile" className="w-full bg-slate-950 border border-slate-850 px-3 py-2 text-xs rounded-lg text-white" />
              <textarea placeholder="Your requirement" rows={2} className="w-full bg-slate-950 border border-slate-850 px-3 py-2 text-xs rounded-lg text-white resize-none" />
              <button onClick={() => setEnquirySent(true)} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg text-xs transition-colors">
                Send Inquiry
              </button>
              {enquirySent && (
                <p className="text-[10px] text-emerald-400 text-center">Inquiry sent successfully.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────
// 2. STANDARD TEMPLATE (Modern Professional, Blue/Indigo Gradients & Ticks)
// ──────────────────────────────────────────────────────────────────
function TemplateStandard({ company, jobs, reviews }: { company: any; jobs: any[]; reviews: any[] }) {
  const [activeTab, setActiveTab] = useState('about');
  const [saved, setSaved] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [reviewType, setReviewType] = useState('company');

  const handleProductWhatsApp = (productName: string, productId?: string) => {
    const text = `Hello, I viewed your product ${productName} on THENIJOBS and would like more details.`;
    if (company.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'whatsapp_click',
        targetId: productId || null,
        targetName: productName
      });
    }
    window.open(`https://wa.me/${company.whatsapp || company.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const activeTheme = company.customTheme || 'classic_blue';
  
  const themeMap: Record<string, {
    bg: string;
    accent: string;
    border: string;
    btn: string;
    badge: string;
    card: string;
    bullet: string;
    gradient: string;
  }> = {
    classic_blue: {
      bg: 'bg-[#070b19]',
      accent: 'text-blue-400',
      border: 'border-blue-900/30',
      btn: 'bg-gradient-to-r from-blue-600 to-indigo-650 hover:opacity-90 text-white shadow-blue-500/10',
      badge: 'bg-blue-500/10 border-blue-400/30 text-blue-300',
      card: 'bg-[#0b1433]/40 border border-blue-900/20',
      bullet: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
      gradient: 'from-blue-700/80 via-indigo-900 to-[#070b19]',
    },
    emerald_growth: {
      bg: 'bg-[#030d08]',
      accent: 'text-emerald-400',
      border: 'border-emerald-900/30',
      btn: 'bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-90 text-white shadow-emerald-500/10',
      badge: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300',
      card: 'bg-[#061c10]/40 border border-emerald-900/20',
      bullet: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
      gradient: 'from-emerald-700/80 via-teal-900 to-[#030d08]',
    },
    royal_purple: {
      bg: 'bg-[#0b0312]',
      accent: 'text-purple-400',
      border: 'border-purple-900/30',
      btn: 'bg-gradient-to-r from-purple-600 to-pink-650 hover:opacity-90 text-white shadow-purple-500/10',
      badge: 'bg-purple-500/10 border-purple-400/30 text-purple-300',
      card: 'bg-[#140620]/40 border border-purple-900/20',
      bullet: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
      gradient: 'from-purple-700/80 via-violet-900 to-[#0b0312]',
    }
  };
  
  const currentTheme = themeMap[activeTheme] || themeMap.classic_blue;

  const isModern = company.websiteTemplate === 'modern';

  const whatsappText = company.whatsappMessageTemplate 
    ? encodeURIComponent(company.whatsappMessageTemplate) 
    : encodeURIComponent(`Hi! I saw your business page on THENIJOBS.`);
  const whatsappUrl = `https://wa.me/${company.whatsapp}?text=${whatsappText}`;

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'jobs', label: `Jobs (${jobs.length})` },
    { id: 'products', label: 'Products & Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <main className={`min-h-screen ${currentTheme.bg} text-white font-outfit`}>
      <Header />

      <section className="pt-16 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Cover Block with dynamic gradient styling */}
        <div className={`h-44 sm:h-56 relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentTheme.gradient} border ${currentTheme.border}`}>
          {company.coverImageUrl && (
            <Image src={company.coverImageUrl} alt={company.name} fill className="object-cover opacity-65 mix-blend-overlay" />
          )}
          <div className="absolute inset-0 bg-black/10" />
          <div className={`absolute top-4 right-4 ${currentTheme.badge} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
            <BadgeCheck size={12} className={`fill-white/10 ${currentTheme.accent}`} /> Standard Partner
          </div>
        </div>

        {/* Brand bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-8 mb-6 z-10 relative px-4">
          <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0a0f1d] border-2 ${currentTheme.border} shadow-2xl flex items-center justify-center shrink-0 overflow-hidden`}>
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.name} fill className="object-cover" />
            ) : (
              <Building2 size={32} className={currentTheme.accent} />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center flex-wrap gap-1">
                {company.name}
                {renderVerificationBadge(company.verificationLevel, company.verificationStatus, 18)}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span className={`font-semibold ${currentTheme.accent}`}>{company.category}</span> · 
              <span className="flex items-center gap-1"><MapPin size={11} className={currentTheme.accent} />{company.district}</span> · 
              <span className="flex items-center gap-1">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                {company.rating} ({reviews.length} reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <a href={`tel:${company.phone}`} onClick={() => trackAnalyticsEvent({ companyId: company.id, eventType: 'call_click' })} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${currentTheme.btn}`}>
            <Phone size={13} /> Call Now
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackAnalyticsEvent({ companyId: company.id, eventType: 'whatsapp_click' })} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
            <MessageCircle size={13} /> WhatsApp
          </a>
          {company.customCtaLabel && company.customCtaUrl && (
            <a href={company.customCtaUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${currentTheme.btn}`}>
              <Sparkles size={13} /> {company.customCtaLabel}
            </a>
          )}
          <button onClick={() => setFollowed(!followed)} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${followed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'border-white/10 hover:bg-white/5'}`}>
            {followed ? '✓ Following' : 'Follow'}
          </button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info Columns */}
          <div className="lg:col-span-2 space-y-6">
            {isModern ? (
              <div className="space-y-6">
                {/* About modern view */}
                <div className={`${currentTheme.card} rounded-2xl p-5`}>
                  <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Building2 size={15} className={currentTheme.accent} /> About {company.name}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">{company.description}</p>
                </div>

                {/* Score boxes */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`${currentTheme.card} rounded-2xl p-4`}>
                    <Clock size={16} className={currentTheme.accent} />
                    <div className="mt-2 text-sm font-bold">{company.responseTime || 'Same Day'}</div>
                    <div className="text-[10px] text-slate-500">Response Speed</div>
                  </div>
                  <div className={`${currentTheme.card} rounded-2xl p-4`}>
                    <ShieldCheck size={16} className={currentTheme.accent} />
                    <div className="mt-2 text-sm font-bold">{company.trustScore || '80'}%</div>
                    <div className="text-[10px] text-slate-500">Verified Score</div>
                  </div>
                </div>

                {/* Services */}
                {company.services?.length > 0 && (
                  <div className={`${currentTheme.card} rounded-2xl p-5`}>
                    <h2 className="text-sm font-semibold text-white mb-3">Listed Services</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {company.services.map((svc: string) => (
                        <span key={svc} className={`text-xs px-2.5 py-1 rounded-lg ${currentTheme.bullet}`}>
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Jobs */}
                <div className={`${currentTheme.card} rounded-2xl p-5 space-y-3`}>
                  <h3 className="text-sm font-semibold text-white mb-2">Jobs from this Company</h3>
                  {jobs.length > 0 ? (
                    jobs.map(job => (
                      <Link key={job.id} href={`/jobs/${job.id}`}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                        <div>
                          <div className="text-xs font-bold text-white">{job.title}</div>
                          <div className="text-[10px] text-slate-550 mt-1">{job.type} · {job.salary}</div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded font-bold ${currentTheme.btn}`}>Apply</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-slate-555 py-2 text-center">No active openings right now.</p>
                  )}
                </div>

                 {/* Products */}
                {company.products?.length > 0 && (
                  <div className={`${currentTheme.card} rounded-2xl p-5`}>
                    <h3 className="text-sm font-semibold text-white mb-4">Products & Services Showcase</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {company.products.map((product: any) => (
                        <div key={product.id || product.name} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row gap-4 hover:border-white/10 transition-colors">
                          {product.images?.[0] && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/10">
                              <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{product.name}</h4>
                                {product.price > 0 && <span className={`text-[10px] font-bold ${currentTheme.accent}`}>₹{product.price}</span>}
                              </div>
                              {product.category && <span className="text-[8px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{product.category}</span>}
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description || product.detail}</p>
                            </div>
                            <button
                              onClick={() => handleProductWhatsApp(product.name, product.id)}
                              className="mt-2.5 self-start flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 transition-colors text-white"
                            >
                              <MessageCircle size={10} /> Enquire on WhatsApp
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {company.galleryImages?.length > 0 && (
                  <div className={`${currentTheme.card} rounded-2xl p-5`}>
                    <h3 className="text-sm font-semibold text-white mb-4">Gallery Showcase</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {company.galleryImages.map((src: string, index: number) => (
                        <div key={src || index} className="relative aspect-square rounded-xl overflow-hidden bg-[#050917] border border-white/5">
                          <Image src={src} alt="gallery" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Classic tabbed layout view
              <>
                {/* Tabs bar */}
                <div className="flex gap-1 overflow-x-auto pb-1 border-b border-white/5">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? `${currentTheme.btn}`
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                {activeTab === 'about' && (
                  <div className="space-y-4">
                    <div className={`${currentTheme.card} rounded-2xl p-5`}>
                      <h2 className="text-sm font-semibold text-white mb-2">About {company.name}</h2>
                      <p className="text-xs text-slate-300 leading-relaxed">{company.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`${currentTheme.card} rounded-2xl p-4`}>
                        <Clock size={16} className={currentTheme.accent} />
                        <div className="mt-2 text-sm font-bold">{company.responseTime || 'Same Day'}</div>
                        <div className="text-[10px] text-slate-500">Response Speed</div>
                      </div>
                      <div className={`${currentTheme.card} rounded-2xl p-4`}>
                        <ShieldCheck size={16} className={currentTheme.accent} />
                        <div className="mt-2 text-sm font-bold">{company.trustScore || '80'}%</div>
                        <div className="text-[10px] text-slate-500">Verified Score</div>
                      </div>
                    </div>

                    {company.services?.length > 0 && (
                      <div className={`${currentTheme.card} rounded-2xl p-5`}>
                        <h2 className="text-sm font-semibold text-white mb-3">Listed Services</h2>
                        <div className="flex flex-wrap gap-1.5">
                          {company.services.map((svc: string) => (
                            <span key={svc} className={`text-xs px-2.5 py-1 rounded-lg ${currentTheme.bullet}`}>
                              {svc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'jobs' && (
                  <div className={`${currentTheme.card} rounded-2xl p-5 space-y-3`}>
                    <h3 className="text-sm font-semibold text-white mb-2">Jobs from this Company</h3>
                    {jobs.length > 0 ? (
                      jobs.map(job => (
                        <Link key={job.id} href={`/jobs/${job.id}`}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                          <div>
                            <div className="text-xs font-bold text-white">{job.title}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{job.type} · {job.salary}</div>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded text-white font-bold ${currentTheme.btn}`}>Apply</span>
                        </Link>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No active openings right now.</p>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className={`${currentTheme.card} rounded-2xl p-5`}>
                    <h3 className="text-sm font-semibold text-white mb-4">Products & Services Showcase</h3>
                    {company.products?.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {company.products.map((product: any) => (
                          <div key={product.id || product.name} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row gap-4 hover:border-white/10 transition-colors">
                            {product.images?.[0] && (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-white/10">
                                <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                              </div>
                            )}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{product.name}</h4>
                                  {product.price > 0 && <span className={`text-[10px] font-bold ${currentTheme.accent}`}>₹{product.price}</span>}
                                </div>
                                {product.category && <span className="text-[8px] text-gray-500 bg-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{product.category}</span>}
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description || product.detail}</p>
                              </div>
                              <button
                                onClick={() => handleProductWhatsApp(product.name, product.id)}
                                className="mt-2.5 self-start flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 transition-colors text-white"
                              >
                                <MessageCircle size={10} /> Enquire on WhatsApp
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No products catalogue uploaded.</p>
                    )}
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div className={`${currentTheme.card} rounded-2xl p-5`}>
                    <h3 className="text-sm font-semibold text-white mb-4">Gallery Images</h3>
                    {company.galleryImages?.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {company.galleryImages.map((src: string, index: number) => (
                          <div key={src || index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/5">
                            <Image src={src} alt="gallery" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No gallery media uploaded.</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Write Review Form */}
                    <div className={`${currentTheme.card} rounded-2xl p-5`}>
                      <h3 className="text-xs font-bold text-white mb-3">Submit a Verified Review</h3>
                      <textarea rows={2} placeholder="Write your review comments here..." className="w-full bg-slate-950 border border-white/10 p-2.5 text-xs rounded-xl text-white resize-none" />
                      <button className={`mt-2 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors ${currentTheme.btn}`}>
                        Submit Verified Review
                      </button>
                    </div>

                    {reviews.map(review => (
                      <div key={review.id} className="bg-white/[0.01] border border-white/[0.05] rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200">{review.name}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={10} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{review.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Sidebar: Contact & Enquiry */}
          <div className="space-y-4">
            <div className={`${currentTheme.card} rounded-2xl p-5 space-y-4`}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Office Details</h3>
              <div className="space-y-3 text-xs text-slate-350">
                <a href={`tel:${company.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={12} className={currentTheme.accent} />
                  <span>{company.phone}</span>
                </a>
                <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail size={12} className={currentTheme.accent} />
                  <span className="truncate">{company.email}</span>
                </a>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Globe size={12} className={currentTheme.accent} />
                    <span>Website Listing</span>
                  </a>
                )}
                <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                  <MapPin size={12} className={`${currentTheme.accent} shrink-0 mt-0.5`} />
                  <span>{company.address}</span>
                </div>
              </div>
            </div>

            {/* Leads Box */}
            <div className={`${currentTheme.card} rounded-2xl p-5 space-y-3`}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Business Enquiry</h3>
              <p className="text-[10px] text-slate-500">Quotes are directly routed to provider dashboard CRM.</p>
              <input type="text" placeholder="Full Name" className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white" />
              <input type="tel" placeholder="Mobile Number" className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white" />
              <textarea placeholder="Describe your requirement..." rows={2} className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white resize-none" />
              <button onClick={() => { setEnquirySent(true); trackAnalyticsEvent({ companyId: company.id, eventType: 'contact_submit' }); }} className={`w-full text-white font-bold py-2.5 rounded-xl text-xs transition-colors ${currentTheme.btn}`}>
                Send Enquiry
              </button>
              {enquirySent && (
                <p className="text-[10px] text-emerald-400 text-center font-bold">Enquiry created successfully!</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Powered by THENIJOBS branding */}
      <div className={`py-8 text-center border-t ${currentTheme.border} bg-[#050814]/40`}>
        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <BadgeCheck size={12} className={currentTheme.accent} />
          Powered by <Link href="/" className={`font-bold hover:underline ${currentTheme.accent}`}>THENIJOBS</Link> · Grow Your Business Online
        </p>
      </div>

      <BottomNav />
    </main>
  );
}

type PremiumThemeName = 'luxury_gold' | 'midnight_purple' | 'mint_emerald' | 'sunset_amber' | 'classic_blue';

function TemplatePremium({ company, jobs, reviews }: { company: any; jobs: any[]; reviews: any[] }) {
  const [activeTab, setActiveTab] = useState('about');
  const [followed, setFollowed] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [reviewType, setReviewType] = useState('company');

  // E-Commerce specific states
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('All');

  // Service Booking specific states
  const [selectedService, setSelectedService] = useState(company.services?.[0] || '');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Initialize theme from company settings or fallback
  const [activeTheme, setActiveTheme] = useState<PremiumThemeName>(() => {
    const defaultTheme = company.customTheme as PremiumThemeName;
    if (['luxury_gold', 'midnight_purple', 'mint_emerald', 'sunset_amber', 'classic_blue'].includes(defaultTheme)) {
      return defaultTheme;
    }
    return 'luxury_gold';
  });

  // Track page layouts: classic, modern, e_commerce, service_booking
  const layout = company.websiteTemplate || 'classic';

  // GA Script Injection
  useEffect(() => {
    if (company.googleAnalyticsId) {
      const gaId = company.googleAnalyticsId;
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      `;
      document.head.appendChild(script2);

      return () => {
        document.head.removeChild(script1);
        document.head.removeChild(script2);
      };
    }
  }, [company.googleAnalyticsId]);

  // Facebook Pixel Injection
  useEffect(() => {
    if (company.facebookPixelId) {
      const pixelId = company.facebookPixelId;
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      const noscript = document.createElement('noscript');
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
      document.body.appendChild(noscript);

      return () => {
        document.head.removeChild(script);
        document.body.removeChild(noscript);
      };
    }
  }, [company.facebookPixelId]);

  // Dynamic Theme Colors map
  const themeConfigs: Record<PremiumThemeName, {
    bg: string;
    accent: string;
    border: string;
    bgGlow: string;
    badge: string;
    gradient: string;
    button: string;
    bgText: string;
    card: string;
    textMuted: string;
  }> = {
    luxury_gold: {
      bg: 'bg-[#070503]',
      accent: 'text-amber-400',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bgGlow: 'bg-amber-500/10',
      badge: 'bg-amber-400/15 border-amber-400/30 text-amber-300',
      gradient: 'from-amber-400 via-orange-500 to-yellow-600',
      button: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-amber-500/20 hover:shadow-amber-500/30',
      bgText: 'text-amber-400/80',
      card: 'bg-[#120e0a]/60 border border-amber-950/30',
      textMuted: 'text-amber-100/70',
    },
    midnight_purple: {
      bg: 'bg-[#050307]',
      accent: 'text-purple-400',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      bgGlow: 'bg-purple-500/10',
      badge: 'bg-purple-400/15 border-purple-400/30 text-purple-300',
      gradient: 'from-violet-500 via-purple-600 to-indigo-600',
      button: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-purple-500/20 hover:shadow-purple-500/30',
      bgText: 'text-purple-400/80',
      card: 'bg-[#0e0a12]/60 border border-purple-950/30',
      textMuted: 'text-purple-100/70',
    },
    mint_emerald: {
      bg: 'bg-[#010503]',
      accent: 'text-emerald-400',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bgGlow: 'bg-emerald-500/10',
      badge: 'bg-emerald-400/15 border-emerald-400/30 text-emerald-300',
      gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
      button: 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-emerald-500/20 hover:shadow-emerald-500/30',
      bgText: 'text-emerald-400/80',
      card: 'bg-[#06120c]/60 border border-emerald-950/30',
      textMuted: 'text-emerald-100/70',
    },
    sunset_amber: {
      bg: 'bg-[#070301]',
      accent: 'text-orange-400',
      border: 'border-orange-500/20 hover:border-orange-500/40',
      bgGlow: 'bg-orange-500/10',
      badge: 'bg-orange-400/15 border-orange-400/30 text-orange-300',
      gradient: 'from-orange-500 via-amber-500 to-red-650',
      button: 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-orange-500/20 hover:shadow-orange-500/30',
      bgText: 'text-orange-400/80',
      card: 'bg-[#120a06]/60 border border-orange-950/30',
      textMuted: 'text-orange-100/70',
    },
    classic_blue: {
      bg: 'bg-[#010307]',
      accent: 'text-blue-400',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      bgGlow: 'bg-blue-500/10',
      badge: 'bg-blue-400/15 border-blue-400/30 text-blue-300',
      gradient: 'from-blue-500 via-indigo-650 to-sky-500',
      button: 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-blue-500/20 hover:shadow-blue-500/30',
      bgText: 'text-blue-400/80',
      card: 'bg-[#060b14]/60 border border-blue-950/30',
      textMuted: 'text-blue-100/70',
    },
  };

  const currentTheme = themeConfigs[activeTheme] || themeConfigs.luxury_gold;

  const tabs = [
    { id: 'about', label: 'Overview' },
    { id: 'jobs', label: `Openings (${jobs.length})` },
    { id: 'products', label: 'Products Catalogue' },
    { id: 'gallery', label: 'Gallery Showcase' },
    { id: 'reviews', label: `Client Testimonials (${reviews.length})` },
  ];

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText('TNI-PREM-DISC');
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const whatsappText = company.whatsappMessageTemplate 
    ? encodeURIComponent(company.whatsappMessageTemplate) 
    : encodeURIComponent(`Hi! I saw your premium page on THENIJOBS.`);
  const whatsappUrl = `https://wa.me/${company.whatsapp}?text=${whatsappText}`;

  // WhatsApp helper for specific products
  const handleProductWhatsApp = (productName: string, productId?: string) => {
    const text = `Hello, I viewed your product ${productName} on THENIJOBS and would like more details.`;
    if (company.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'whatsapp_click',
        targetId: productId || null,
        targetName: productName
      });
    }
    window.open(`https://wa.me/${company.whatsapp || company.phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // WhatsApp helper for service booking
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !bookingDate || !bookingTime || !bookingName || !bookingPhone) {
      alert('Please fill in all booking details.');
      return;
    }
    const msg = `Hi! I would like to book a service:
- Service: ${selectedService}
- Date: ${bookingDate}
- Time: ${bookingTime}
- Name: ${bookingName}
- Phone: ${bookingPhone}
- Notes: ${bookingNotes || 'None'}

Please confirm my booking request. Thanks!`;
    window.open(`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    setBookingSuccess(true);
  };

  // Filter products by search and category
  const filteredProducts = (company.products || []).filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                          product.detail?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesSearch;
  });

  return (
    <main className={`min-h-screen ${currentTheme.bg} text-white overflow-x-hidden relative font-outfit pb-12`}>
      <Header />

      {/* Dynamic Background Glowing Circles */}
      <div className={`absolute top-20 right-[-10%] w-96 h-96 rounded-full blur-[120px] transition-colors duration-1000 ${currentTheme.bgGlow} pointer-events-none`} />
      <div className={`absolute bottom-20 left-[-10%] w-96 h-96 rounded-full blur-[120px] transition-colors duration-1000 ${currentTheme.bgGlow} pointer-events-none`} />

      <section className="pt-20 pb-16 max-w-5xl mx-auto px-4 relative z-10">
        {/* Dynamic Cover Block */}
        <div className={`h-48 sm:h-64 relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${currentTheme.gradient} shadow-2xl border border-white/10`}>
          {company.coverImageUrl && (
            <Image src={company.coverImageUrl} alt={company.name} fill className="object-cover opacity-55 mix-blend-overlay" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          
          {/* Top Badge Panel */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider shadow-lg ${currentTheme.badge}`}>
              <Crown size={12} className="animate-bounce text-yellow-350" /> PREMIUM VERIFIED
            </span>
          </div>

          {/* Theme Selector (Unique Premium Theme Selection) */}
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md rounded-xl p-1.5 border border-white/10 flex items-center gap-1.5 no-print">
            <span className="text-[9px] font-bold text-slate-300 px-1 uppercase">Themes:</span>
            {(['luxury_gold', 'midnight_purple', 'mint_emerald', 'sunset_amber', 'classic_blue'] as PremiumThemeName[]).map(t => (
              <button
                key={t}
                onClick={() => setActiveTheme(t)}
                className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                  t === 'luxury_gold' ? 'bg-amber-400 border-amber-300'
                  : t === 'midnight_purple' ? 'bg-purple-500 border-purple-400'
                  : t === 'mint_emerald' ? 'bg-emerald-500 border-emerald-400'
                  : t === 'sunset_amber' ? 'bg-orange-500 border-orange-400'
                  : 'bg-blue-500 border-blue-400'
                } ${activeTheme === t ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'}`}
                title={t.replace('_', ' ')}
              />
            ))}
          </div>
        </div>

        {/* Brand Details Block */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-5 -mt-10 mb-8 relative z-20 px-6">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#0a0a14] border-2 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex items-center justify-center shrink-0 overflow-hidden group">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <Building2 size={38} className={currentTheme.accent} />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center flex-wrap gap-2 tracking-tight">
                {company.name}
                {renderVerificationBadge(company.verificationLevel, company.verificationStatus, 24)}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-slate-400">
              <span className={`font-bold uppercase tracking-wider text-xs ${currentTheme.accent}`}>{company.category}</span>
              <span className="flex items-center gap-1"><MapPin size={13} className={currentTheme.accent} />{company.district}, Tamil Nadu</span>
              <span className="flex items-center gap-1 font-bold text-white">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {company.rating} <span className="text-slate-500">({reviews.length} feedback)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Priority and Lead Box at Top for Premium layout */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/[0.06] p-6 flex flex-col justify-between">
            <div>
              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-400 uppercase tracking-widest inline-flex items-center gap-1">
                <Crown size={10} /> Priority Listing Rank
              </span>
              <h3 className="text-base font-bold text-white mt-2">👑 #1 Top Ranked Business in Theni</h3>
              <p className="text-xs text-slate-400 mt-1">This luxury dynamic site generates higher customer trust and is highly visible on our search loops.</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
              <a href={`tel:${company.phone}`} onClick={() => trackAnalyticsEvent({ companyId: company.id, eventType: 'call_click' })} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-transform hover:scale-105 active:scale-95 ${currentTheme.button}`}>
                <Phone size={14} /> Contact Now
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackAnalyticsEvent({ companyId: company.id, eventType: 'whatsapp_click' })} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
                <MessageCircle size={14} /> Chat WhatsApp
              </a>
              {company.customCtaLabel && company.customCtaUrl && (
                <a href={company.customCtaUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs border border-white/15 hover:bg-white/5 transition-all`}>
                  <ExternalLink size={13} className={currentTheme.accent} /> {company.customCtaLabel}
                </a>
              )}
            </div>
          </div>

          {/* Premium Engagement Stats Card */}
          <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl border border-white/[0.06] p-5 flex flex-col justify-between bg-gradient-to-br from-white/[0.02] to-transparent">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Analytics</span>
              <TrendingUp size={14} className={currentTheme.accent} />
            </div>
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Profile Views</span>
                <span className="font-bold text-white">{company.viewCount || '1,420+'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Search Appearances</span>
                <span className="font-bold text-emerald-400">+148%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Trust Index Score</span>
                <span className="font-bold text-yellow-400">{company.trustScore || '98'}%</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 italic block text-right mt-1">Updates live daily</span>
          </div>
        </div>

        {/* Dynamic Layout Template Switcher */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. CLASSIC TABBED LAYOUT */}
            {layout === 'classic' && (
              <>
                <div className="flex gap-1 overflow-x-auto pb-1 border-b border-white/[0.06]">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? `bg-gradient-to-r ${currentTheme.gradient} text-white shadow-lg`
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'about' && (
                  <div className="space-y-4">
                    {/* Promo Code Block */}
                    <div className={`rounded-3xl border ${currentTheme.border} ${currentTheme.bgGlow} p-6 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden group`}>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-xl pointer-events-none" />
                      <div>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black text-white uppercase tracking-widest inline-flex items-center gap-1">
                          <Sparkles size={10} className="text-amber-400" /> SPECIAL COMPLIMENTARY OFFER
                        </span>
                        <h3 className="text-sm font-bold text-white mt-2">Get 10% Discount on First Enquiry</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Quote the code below or call directly to avail of this premium benefit.</p>
                      </div>
                      <button onClick={handleCopyCoupon} className="bg-white/10 hover:bg-white/15 border border-white/20 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0">
                        {copiedCoupon ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        {copiedCoupon ? 'Copied' : 'TNI-PREM-DISC'}
                      </button>
                    </div>

                    {/* About Content */}
                    <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-3">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Building2 size={16} className={currentTheme.accent} /> Company Overview
                      </h3>
                      <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-line">{company.description}</p>
                    </div>

                    {/* Service Specialization Tag Grid */}
                    {company.services?.length > 0 && (
                      <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Award size={16} className={currentTheme.accent} /> Professional Services & Specializations
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {company.services.map((svc: string) => (
                            <div key={svc} className={`flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border ${currentTheme.border} transition-transform hover:-translate-y-0.5`}>
                              <Check size={12} className={currentTheme.accent} />
                              <span className="text-xs font-medium text-slate-200 truncate">{svc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'jobs' && (
                  <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white mb-2">Available Job Vacancies</h3>
                    {jobs.length > 0 ? (
                      <div className="space-y-3">
                        {jobs.map(job => (
                          <Link key={job.id} href={`/jobs/${job.id}`}
                            className={`flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all duration-300 group`}>
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{job.title}</div>
                              <div className="text-[10px] text-slate-500 mt-1.5 flex gap-2">
                                <span>{job.type}</span>
                                <span>·</span>
                                <span>{job.salary}</span>
                              </div>
                            </div>
                            <span className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase ${currentTheme.button}`}>Apply Now</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-6 text-center">No active openings at this moment.</p>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                      <PackagePlus size={16} className={currentTheme.accent} /> Products & Services Catalogue
                    </h3>
                    {company.products?.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {company.products.map((product: any) => (
                          <div key={product.id || product.name} className="p-4 rounded-2xl bg-[#0f0b07]/40 border border-white/5 hover:border-amber-500/20 transition-all flex flex-col sm:flex-row gap-4">
                            {product.images?.[0] && (
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#0d0905] border border-white/10">
                                <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                              </div>
                            )}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{product.name}</h4>
                                  {product.price > 0 && <span className={`text-[10px] font-bold ${currentTheme.accent}`}>₹{product.price}</span>}
                                </div>
                                {product.category && <span className="text-[8px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{product.category}</span>}
                                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description || product.detail}</p>
                              </div>
                              <button
                                onClick={() => handleProductWhatsApp(product.name, product.id)}
                                className="mt-2.5 self-start flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 transition-all text-white"
                              >
                                <MessageCircle size={10} /> Buy / Inquire
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-6 text-center">No catalogue items listed.</p>
                    )}
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6">
                    <h3 className="text-sm font-bold text-white mb-4">Gallery Portfolio</h3>
                    {company.galleryImages?.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {company.galleryImages.map((src: string, index: number) => (
                          <div key={src || index} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group">
                            <Image src={src} alt="gallery" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-6 text-center">No portfolio media uploaded.</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Reviews Form */}
                    <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-3 bg-gradient-to-r from-white/[0.02] to-transparent">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <UserCheck size={14} className={currentTheme.accent} /> Submit Verified Client Feedback
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {['Customer Feedback', 'Staff Review', 'General Service'].map(label => (
                          <button key={label} onClick={() => setReviewType(label.toLowerCase())} className={`py-1.5 rounded-xl text-[10px] font-bold border transition-colors ${reviewType === label.toLowerCase() ? 'bg-white/10 border-white/30 text-white' : 'border-white/5 text-slate-400 bg-white/[0.01]'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <textarea rows={2} placeholder="Share your experience with this business..." className="w-full bg-slate-950 border border-white/10 p-3 text-xs rounded-xl text-white resize-none" />
                      <button className={`bg-gradient-to-r ${currentTheme.gradient} text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg transition-transform hover:-translate-y-0.5`}>
                        Submit verified review
                      </button>
                    </div>

                    {reviews.map(review => (
                      <div key={review.id} className="bg-white/[0.01] rounded-3xl border border-white/[0.04] p-5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white">{review.name}</span>
                            <div className="flex gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={10} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'} />
                              ))}
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-600 font-medium">{review.date}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{review.content}</p>
                        <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                          ✓ Verified Reviewer
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 2. MODERN IMMERSIVE LAYOUT (Stacked Sections) */}
            {layout === 'modern' && (
              <div className="space-y-8">
                {/* About Section */}
                <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                    <Building2 size={16} className={currentTheme.accent} /> About {company.name}
                  </h3>
                  <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-line">{company.description}</p>
                  
                  {company.services?.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-white mb-2">Our Specializations:</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {company.services.map((svc: string) => (
                          <span key={svc} className={`text-xs px-2.5 py-1 rounded-lg bg-white/[0.02] border ${currentTheme.border} text-slate-300`}>
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Products Grid */}
                {company.products?.length > 0 && (
                  <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                      <ShoppingBag size={16} className={currentTheme.accent} /> Products Showcase
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {company.products.map((product: any) => (
                        <div key={product.id || product.name} className="p-4 rounded-2xl bg-[#0f0b07]/40 border border-white/5 hover:border-amber-500/20 transition-all flex flex-col sm:flex-row gap-4">
                          {product.images?.[0] && (
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#0d0905] border border-white/10">
                              <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{product.name}</h4>
                                {product.price > 0 && <span className={`text-[10px] font-bold ${currentTheme.accent}`}>₹{product.price}</span>}
                              </div>
                              {product.category && <span className="text-[8px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{product.category}</span>}
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description || product.detail}</p>
                            </div>
                            <button
                              onClick={() => handleProductWhatsApp(product.name, product.id)}
                              className="mt-2.5 self-start flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5 transition-all text-white"
                            >
                              <MessageCircle size={10} /> Buy via WhatsApp
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Jobs Section */}
                <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                    <Briefcase size={16} className={currentTheme.accent} /> Active Careers
                  </h3>
                  {jobs.length > 0 ? (
                    <div className="space-y-3">
                      {jobs.map(job => (
                        <Link key={job.id} href={`/jobs/${job.id}`}
                          className={`flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/25 transition-all group`}>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{job.title}</div>
                            <div className="text-[10px] text-slate-550 mt-1 flex gap-2">
                              <span>{job.type}</span>
                              <span>·</span>
                              <span>{job.salary}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase ${currentTheme.button}`}>Apply</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-2 text-center">No career positions available right now.</p>
                  )}
                </div>

                {/* Gallery Showcase */}
                {company.galleryImages?.length > 0 && (
                  <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                      <ImageIcon size={16} className={currentTheme.accent} /> Media Gallery
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {company.galleryImages.map((src: string, index: number) => (
                        <div key={src || index} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group">
                          <Image src={src} alt="gallery" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews Section */}
                <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
                    <Star size={16} className={currentTheme.accent} /> Client Reviews ({reviews.length})
                  </h3>
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="bg-white/[0.01] rounded-3xl border border-white/[0.04] p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{review.name}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={10} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{review.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. E-COMMERCE STOREFRONT LAYOUT */}
            {layout === 'e_commerce' && (
              <div className="space-y-8">
                {/* Storefront Products Catalog - Placed at top */}
                <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <ShoppingBag size={20} className={currentTheme.accent} /> Storefront Catalog
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Explore our product inventory and buy directly via WhatsApp.</p>
                    </div>
                    {/* Search Field */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="bg-slate-950 border border-white/10 px-3 py-1.5 text-xs rounded-xl text-white placeholder-slate-500 w-full sm:w-44 focus:outline-none focus:border-white/20"
                      />
                    </div>
                  </div>

                  {filteredProducts.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredProducts.map((product: any) => (
                        <div key={product.id || product.name} className="p-4 rounded-2xl bg-[#0f0b07]/40 border border-white/5 hover:border-amber-500/20 transition-all flex flex-col sm:flex-row gap-4">
                          {product.images?.[0] && (
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#0d0905] border border-white/10">
                              <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{product.name}</h4>
                                {product.price > 0 && <span className={`text-[10px] font-bold ${currentTheme.accent}`}>₹{product.price}</span>}
                              </div>
                              {product.category && <span className="text-[8px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{product.category}</span>}
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description || product.detail}</p>
                            </div>
                            <button
                              onClick={() => handleProductWhatsApp(product.name, product.id)}
                              className="mt-2.5 w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-white"
                              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                            >
                              <MessageCircle size={12} /> Purchase on WhatsApp
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-8 text-center">No matching products found in catalog.</p>
                  )}
                </div>

                {/* About & Specializations */}
                <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 size={16} className={currentTheme.accent} /> About the Provider
                  </h3>
                  <p className="text-xs text-slate-350 leading-relaxed whitespace-pre-line">{company.description}</p>
                </div>

                {/* Gallery */}
                {company.galleryImages?.length > 0 && (
                  <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon size={16} className={currentTheme.accent} /> Media Showcase
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {company.galleryImages.map((src: string, index: number) => (
                        <div key={src || index} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group">
                          <Image src={src} alt="gallery" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Star size={16} className={currentTheme.accent} /> Client Reviews
                  </h3>
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map(review => (
                      <div key={review.id} className="bg-white/[0.01] rounded-3xl border border-white/[0.04] p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{review.name}</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={10} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{review.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. SERVICE BOOKING SCHEDULER LAYOUT */}
            {layout === 'service_booking' && (
              <div className="space-y-8">
                {/* Services Catalog & Booking Portal */}
                <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Calendar size={20} className={currentTheme.accent} /> Service Booking Portal
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Select a service and request an appointment instantly.</p>
                  </div>

                  {company.services?.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {company.services.map((svc: string) => (
                        <button
                          key={svc}
                          onClick={() => {
                            setSelectedService(svc);
                            setBookingSuccess(false);
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                            selectedService === svc
                              ? `${currentTheme.border} ${currentTheme.bgGlow} scale-[1.02]`
                              : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{svc}</div>
                            <span className="text-[10px] text-slate-500">Verified Service Provider</span>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-lg font-bold border ${selectedService === svc ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-400'}`}>
                            {selectedService === svc ? 'Selected' : 'Select'}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-550 py-4 text-center">No specialized services catalog listed.</p>
                  )}

                  {/* Inline Booking Form */}
                  <form onSubmit={handleBookingSubmit} className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 space-y-4 mt-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Appointment Details</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Service</label>
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white focus:outline-none"
                        >
                          {company.services?.map((svc: string) => (
                            <option key={svc} value={svc}>{svc}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Selected Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Preferred Time</label>
                        <input
                          type="time"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Your Name</label>
                        <input
                          type="text"
                          placeholder="Your full name"
                          value={bookingName}
                          onChange={(e) => setBookingName(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Contact Mobile</label>
                      <input
                        type="tel"
                        placeholder="Mobile number"
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Additional Requirements</label>
                      <textarea
                        rows={2}
                        placeholder="Any additional details or requirements..."
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 px-3 py-2 text-xs rounded-xl text-white focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${currentTheme.button}`}
                    >
                      <Calendar size={12} /> Confirm Booking on WhatsApp
                    </button>

                    {bookingSuccess && (
                      <p className="text-[10px] text-emerald-400 text-center font-bold">Booking inquiry sent successfully!</p>
                    )}
                  </form>
                </div>

                {/* About */}
                <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6">
                  <h3 className="text-sm font-bold text-white mb-2">About the Business</h3>
                  <p className="text-xs text-slate-350 leading-relaxed">{company.description}</p>
                </div>

                {/* Gallery */}
                {company.galleryImages?.length > 0 && (
                  <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon size={16} className={currentTheme.accent} /> Media Portfolio
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {company.galleryImages.map((src: string, index: number) => (
                        <div key={src || index} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group">
                          <Image src={src} alt="gallery" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column (Office details, Socials, Lead RFQ form, verified badges) */}
          <div className="space-y-4">
            {/* Contact details */}
            <div className="bg-white/[0.01] backdrop-blur-md rounded-3xl border border-white/[0.06] p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Business Cards</h3>
              <div className="space-y-3.5 text-xs text-slate-300">
                <a href={`tel:${company.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone size={13} className={currentTheme.accent} />
                  <span>{company.phone}</span>
                </a>
                <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail size={13} className={currentTheme.accent} />
                  <span className="truncate">{company.email}</span>
                </a>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                    <Globe size={13} className={currentTheme.accent} />
                    <span className="truncate">Official Web Listing</span>
                  </a>
                )}
                <div className="flex items-start gap-2 pt-3 border-t border-white/5">
                  <MapPin size={13} className={`${currentTheme.accent} shrink-0 mt-0.5`} />
                  <span className="leading-relaxed text-slate-400">{company.address}</span>
                </div>
              </div>

              {/* Social Channels */}
              <div className="flex gap-2 pt-3 border-t border-white/5">
                {company.facebook && (
                  <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/[0.03] hover:bg-blue-500/20 border border-white/10 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all">
                    <FacebookIcon size={14} />
                  </a>
                )}
                {company.instagram && (
                  <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-xl bg-white/[0.03] hover:bg-pink-500/20 border border-white/10 flex items-center justify-center text-slate-400 hover:text-pink-400 transition-all">
                    <InstagramIcon size={14} />
                  </a>
                )}
              </div>

              {/* Link to Digital Card */}
              <Link
                href={`/id/company/${encodeURIComponent(company.slug)}`}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-opacity hover:opacity-90 ${currentTheme.button}`}
              >
                <Sparkles size={13} /> View Digital Business Card
              </Link>
            </div>

            {/* Leads Form */}
            <div className="bg-white/[0.01] backdrop-blur-md rounded-3xl border border-white/[0.06] p-5 space-y-4 bg-gradient-to-br from-white/[0.01] to-transparent">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Premium RFQ Lead Capture</h3>
                <p className="text-[10px] text-slate-550 mt-1">Get custom pricing quotes directly from our sales desks.</p>
              </div>
              <div className="space-y-2.5">
                <input type="text" placeholder="Full Name" className="w-full bg-slate-950 border border-white/10 px-3 py-2.5 text-xs rounded-xl text-white focus:outline-none" />
                <input type="tel" placeholder="Mobile Number" className="w-full bg-slate-950 border border-white/10 px-3 py-2.5 text-xs rounded-xl text-white focus:outline-none" />
                <textarea placeholder="Tell us your requirements..." rows={3} className="w-full bg-slate-950 border border-white/10 px-3 py-2.5 text-xs rounded-xl text-white resize-none focus:outline-none" />
                <button onClick={() => setEnquirySent(true)} className={`w-full py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-90 flex items-center justify-center gap-2 ${currentTheme.button}`}>
                  <Send size={13} /> Request Quotes
                </button>
                {enquirySent && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[10px] text-emerald-300 text-center font-bold">
                    Enquiry logged successfully!
                  </div>
                )}
              </div>
            </div>

            {/* Document Verifications Checklist */}
            <div className="bg-white/[0.01] backdrop-blur-md rounded-3xl border border-white/[0.06] p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                <ShieldCheck size={14} className="text-emerald-400" /> Trust Score Check
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Verified Email address', active: company.verificationBadges.emailVerified, icon: Mail },
                  { label: 'GST Tax ID registered', active: company.verificationBadges.gstVerified, icon: FileCheck },
                  { label: 'Business Ownership verify', active: company.verificationBadges.businessVerified, icon: Award },
                ].map(({ label, active, icon: Icon }) => (
                  <div key={label} className={`flex items-center gap-2.5 p-2 rounded-xl text-xs ${active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-white/[0.02] opacity-40'}`}>
                    <Icon size={12} />
                    <span className="truncate">{label}</span>
                    {active && <BadgeCheck size={13} className="ml-auto text-emerald-400" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* White-labeled Footer Branding */}
      {!company.hideBranding && (
        <div className="py-10 text-center border-t border-white/5 bg-black/20 mt-12">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
            <Crown size={12} className={currentTheme.accent} />
            Powered by <Link href="/" className={`font-black tracking-widest hover:opacity-85 ${currentTheme.accent}`}>THENIJOBS</Link> · Verified Premium Partner
          </p>
        </div>
      )}

      <BottomNav />
      <FloatingWhatsApp number={company.whatsapp} />
    </main>
  );
}
