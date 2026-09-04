'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import CompanyReviewsSection from '@/components/company/CompanyReviewsSection';
import {
  MapPin, Phone, Mail, Globe, MessageCircle, Share2, Heart,
  Star, BadgeCheck, Clock, Users, Eye, TrendingUp, ChevronRight,
  Briefcase, Navigation, ShieldCheck, Smartphone, FileCheck, Award, ExternalLink,
  BellRing, Send, Quote, Newspaper, PackagePlus, Crown, UserCheck, Calendar,
  Building2, CheckCircle2, MessageSquare, Wrench, Package, FolderGit2, User,
  Navigation2, Compass, X, Tag, ArrowLeft, ArrowRight
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon } from '@/components/ui/BrandIcons';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

export default function CompanyProfileClient({ company, jobs = [], reviews = [] }: {
  company: any; jobs: any[]; reviews: any[];
}) {
  const [activeTab, setActiveTab] = useState('about');
  const [saved, setSaved] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedItemType, setSelectedItemType] = useState<'product'|'service'>('product');
  const [showFullDesc, setShowFullDesc] = useState(false);

  // NOTE: SEO meta tags, JSON-LD, and robots directives are now handled
  // exclusively in CompanyProfilePageClient.tsx to avoid duplicate injection.

  const planSlug = (company?.subscriptionPlan || 'free').toLowerCase();
  const themeGradient = planSlug === 'enterprise'
    ? 'from-blue-600 via-blue-700 to-indigo-800'
    : planSlug === 'premium'
      ? 'from-amber-500 via-amber-600 to-yellow-700'
      : planSlug === 'standard'
        ? 'from-emerald-600 via-teal-700 to-green-800'
        : 'from-slate-700 via-gray-800 to-zinc-900';

  const enabledSec = company.enabledSections || {};

  const tabs = [
    { id: 'about', label: 'About', show: enabledSec.about !== false },
    { id: 'products', label: `Products (${company.products?.length ?? 0})`, show: enabledSec.products !== false && (company.products?.length > 0) },
    { id: 'services', label: `Services (${company.services?.length ?? 0})`, show: enabledSec.services !== false && (company.services?.length > 0) },
    { id: 'portfolio', label: `Portfolio (${company.portfolioProjects?.length ?? 0})`, show: enabledSec.portfolio !== false && (company.portfolioProjects?.length > 0) },
    { id: 'jobs', label: `Jobs (${jobs.length})`, show: enabledSec.jobs !== false },
    { id: 'reviews', label: `Reviews (${reviews.length || company.reviewCount || 0})`, show: enabledSec.reviews !== false },
  ].filter(t => t.show);

  const employeesCount = company.employeeCount || company.companySize || company.employees || '10-50';
  const openJobsCount = jobs.length;
  const established = company.foundedYear || company.establishedYear || company.since || '2018';
  const logoChar = company.name?.[0]?.toUpperCase() || 'C';
  const reviewCount = reviews.length || company.reviewCount || 0;

  const googleMapsSearchUrl = company.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.name} ${company.district || 'Theni'} Tamil Nadu`)}`;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 font-sans pb-24 font-outfit">
      <Header />

      {/* Main Container — wider on desktop so the bento grid has room to breathe.
          The bottom clearance lives HERE, not on <main>: globals.css sets
          `main { padding-bottom: 72px }` under 768px as an unlayered rule, which beats a
          Tailwind pb-* utility on the same element. 72px only clears BottomNav, and this
          page also has the sticky action bar above it — hence the extra room on mobile. */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-36 lg:pb-10">

        {/* Card Wrapper for Header + Profile Info */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6 mt-4">
          
          {/* Cover Image / Gradient Banner */}
          <div className="w-full h-48 sm:h-64 md:h-72 relative bg-slate-950 flex items-center justify-center overflow-hidden">
            {company.bannerUrl || company.coverUrl || company.coverImage ? (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-105"
                  style={{ backgroundImage: `url(${company.bannerUrl || company.coverUrl || company.coverImage})` }}
                />
                <img
                  src={company.bannerUrl || company.coverUrl || company.coverImage}
                  alt={company.name}
                  className="relative z-10 w-full h-full object-contain object-center"
                />
              </>
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${themeGradient} relative`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>
            )}
            
            {/* Premium badge sits top-LEFT so it never collides with the save/share
                controls opposite it. */}
            {company.isPremium && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 bg-amber-400 text-amber-950 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold shadow-md flex items-center gap-1">
                <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> PREMIUM
              </div>
            )}

            {/* Save / Share — overlaid on the banner instead of sharing the avatar's row,
                where they floated over the cover photo at an arbitrary height. The frosted
                backdrop keeps them legible against any uploaded image. */}
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex gap-2">
              <button
                onClick={() => setSaved(!saved)}
                aria-label={saved ? 'Remove from saved' : 'Save company'}
                aria-pressed={saved}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-sm border shadow-sm transition-all ${
                  saved ? 'bg-rose-50/95 border-rose-200' : 'bg-white/90 border-white/60 hover:bg-white'
                }`}
                // Inline colour, not a text-* class: globals.css has an unlayered
                // `.bg-slate-950 * { color: inherit }` that forces every descendant of the
                // dark banner to white, which beats Tailwind's utility layer and made these
                // icons white-on-white.
                style={{ color: saved ? '#E11D48' : '#374151' }}
              >
                <Heart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" fill={saved ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: company.name, url: window.location.href });
                  }
                }}
                aria-label="Share profile"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm border border-white/60 hover:bg-white shadow-sm transition-all"
                style={{ color: '#374151' }}
              >
                <Share2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>

          {/* Profile Header Content (Overlapping Avatar) — z-20 so the avatar sits ABOVE the
              banner image, which carries z-10 to clear its own blurred backdrop. Without it
              the cover photo paints over the logo. */}
          <div className="px-6 pb-6 pt-0 relative z-20">
            
            {/* Logo Avatar — now owns its row (save/share moved onto the banner), so it can
                overlap the cover cleanly at any width. */}
            <div className="-mt-10 sm:-mt-16 mb-3 sm:mb-4">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                />
              ) : (
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl sm:text-4xl flex items-center justify-center">
                  {logoChar}
                </div>
              )}
            </div>

            {/* Company Name, then a single meta row.
                The verification badge lives in the meta row rather than beside the heading:
                a long business name fills the line at phone widths, so an inline badge just
                wrapped onto a line of its own and read as a stray button. */}
            <div className="space-y-2">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight break-words">
                {company.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-gray-600">
                {/* Two instances so the badge scales with the breakpoint. */}
                <span className="sm:hidden">
                  <VerifiedBadge
                    tier={company.subscriptionPlan || 'standard'}
                    isVerified={company.verificationStatus === 'verified' || company.isVerified === true}
                    companyName={company.name}
                    size="sm"
                  />
                </span>
                <span className="hidden sm:inline-flex">
                  <VerifiedBadge
                    tier={company.subscriptionPlan || 'standard'}
                    isVerified={company.verificationStatus === 'verified' || company.isVerified === true}
                    companyName={company.name}
                    size="md"
                  />
                </span>

                {/* The rating only appears once there is one — "★ — (0 reviews)" on every
                    new business read as broken. */}
                {reviewCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="font-bold text-gray-900">{Number(company.rating || 0).toFixed(1)}</span>
                    <span className="text-gray-500">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                  </span>
                ) : (
                  <span className="text-gray-400">No reviews yet</span>
                )}

                <span className="flex items-center gap-1 text-gray-600 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{company.district ? `${company.district}, Tamil Nadu` : 'Theni, Tamil Nadu'}</span>
                </span>
              </div>
            </div>

            {/* Key Statistics Grid — sized down hard on phones: at 375px each cell is only
                ~105px wide, where an 18px icon beside text-base was enough to wrap a
                four-digit year onto two lines ("202" / "5"). */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 my-4 sm:my-5">
              <div className="bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center min-w-0">
                <div className="flex items-center justify-center gap-1 text-gray-600 font-bold text-xs sm:text-xl whitespace-nowrap">
                  <Users className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] text-blue-600 shrink-0" />
                  <span className="truncate">{employeesCount}</span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 truncate">Employees</div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center min-w-0">
                <div className="flex items-center justify-center gap-1 text-gray-600 font-bold text-xs sm:text-xl whitespace-nowrap">
                  <Briefcase className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] text-emerald-600 shrink-0" />
                  <span className="truncate">{openJobsCount}</span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 truncate">Open Jobs</div>
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl p-2 sm:p-4 text-center min-w-0">
                <div className="flex items-center justify-center gap-1 text-gray-600 font-bold text-xs sm:text-xl whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px] text-purple-600 shrink-0" />
                  <span className="truncate">{established}</span>
                </div>
                {/* The year is already the value above — repeating it here just overflowed. */}
                <div className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 truncate">Established</div>
              </div>
            </div>

            {/* Official Landing Website Link Banner */}
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Globe size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Explore {company.name}&apos;s Official Landing Website</p>
                  <p className="text-[11px] text-slate-500">Standalone interactive website with story, facilities, gallery &amp; FAQs</p>
                </div>
              </div>
              <Link
                href={`/${company.slug}`}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>Visit Official Website</span>
                <ArrowRight size={13} />
              </Link>
            </div>

          </div>

          {/* Underlined Navigation Tabs */}
          <div className="border-t border-gray-100 px-6 bg-white">
            <div className="flex gap-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3.5 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                      isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Tab Content Section */}
        <div className="space-y-6">

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <>
              {/* ═══ ARCHITECTS — Meet Our Leadership ═══ */}
              {company.founder && company.founder.name && enabledSec.founder !== false && (() => {
                // Collect all leaders: founder first, then team members
                const leaders = [
                  { ...company.founder, isFounder: true },
                  ...(company.teamMembers || []).map((m: any) => ({ ...m, designation: m.role, isFounder: false })),
                ];

                return (
                  <div className="relative overflow-hidden rounded-3xl shadow-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" />
                    <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
                    <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />

                    <div className="relative p-6 sm:p-8 space-y-6">
                      {/* Section Header */}
                      <div className="text-center space-y-2" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm text-xs font-bold uppercase tracking-widest text-blue-300">
                          <Crown size={13} /> Architects
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          Meet Our Leadership
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                          The visionaries driving {company.name} forward
                        </p>
                      </div>

                      {/* Leadership Cards Grid */}
                      <div className={`grid gap-5 ${leaders.length === 1 ? 'max-w-md mx-auto' : leaders.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                        {leaders.map((leader: any, idx: number) => (
                          <div
                            key={idx}
                            className="group relative rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md overflow-hidden hover:border-blue-400/30 hover:bg-white/[0.08] transition-all duration-500"
                            style={{ animation: `fadeInUp 0.6s ease-out ${0.15 * idx}s both` }}
                          >
                            {/* Hover glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative p-5 space-y-4">
                              {/* Photo with click-to-fullview */}
                              <div className="flex justify-center">
                                <button
                                  onClick={() => {
                                    if (leader.photoUrl) {
                                      // Create full-view modal dynamically
                                      const overlay = document.createElement('div');
                                      overlay.id = 'leader-photo-modal';
                                      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);cursor:zoom-out;animation:fadeIn 0.3s ease-out';
                                      overlay.onclick = () => overlay.remove();

                                      const container = document.createElement('div');
                                      container.style.cssText = 'position:relative;max-width:90vw;max-height:85vh;animation:scaleIn 0.3s ease-out';

                                      const img = document.createElement('img');
                                      img.src = leader.photoUrl;
                                      img.alt = leader.name;
                                      img.style.cssText = 'max-width:90vw;max-height:75vh;border-radius:20px;object-fit:contain;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5)';

                                      const caption = document.createElement('div');
                                      caption.style.cssText = 'text-align:center;padding:16px 0 0;color:white';
                                      caption.innerHTML = `<p style="font-size:18px;font-weight:700">${leader.name}</p><p style="font-size:13px;color:#93C5FD;margin-top:4px">${leader.designation}</p>`;

                                      const closeBtn = document.createElement('button');
                                      closeBtn.innerHTML = '✕';
                                      closeBtn.style.cssText = 'position:absolute;top:-12px;right:-12px;width:32px;height:32px;border-radius:50%;background:white;color:#111;font-size:14px;font-weight:bold;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
                                      closeBtn.onclick = (e) => { e.stopPropagation(); overlay.remove(); };

                                      container.appendChild(img);
                                      container.appendChild(caption);
                                      container.appendChild(closeBtn);
                                      overlay.appendChild(container);
                                      document.body.appendChild(overlay);
                                    }
                                  }}
                                  className="relative group/photo cursor-pointer"
                                  title="Click to view full size"
                                >
                                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-[3px] border-blue-400/40 shadow-lg shadow-blue-500/10 group-hover/photo:border-blue-400/70 group-hover/photo:shadow-blue-500/25 transition-all duration-300 group-hover/photo:scale-105">
                                    {leader.photoUrl ? (
                                      <img src={leader.photoUrl} alt={leader.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-2xl">
                                        {leader.name[0]}
                                      </div>
                                    )}
                                  </div>
                                  {/* Expand icon overlay */}
                                  {leader.photoUrl && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 bg-black/20">
                                      <Eye size={20} className="text-white drop-shadow-lg" />
                                    </div>
                                  )}
                                  {/* Founder crown badge */}
                                  {leader.isFounder && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold shadow-md flex items-center gap-0.5 whitespace-nowrap">
                                      <Crown size={10} /> FOUNDER
                                    </div>
                                  )}
                                </button>
                              </div>

                              {/* Name & Designation */}
                              <div className="text-center space-y-1">
                                <h3 className="text-base font-bold text-white">{leader.name}</h3>
                                <p className="text-xs font-semibold text-blue-300">{leader.designation}</p>
                              </div>

                              {/* Experience & Location tags */}
                              <div className="flex items-center justify-center gap-2 flex-wrap">
                                {leader.experienceYears && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                                    <Briefcase size={10} /> {leader.experienceYears}
                                  </span>
                                )}
                                {leader.nativePlace && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-[10px] font-medium">
                                    <MapPin size={10} /> {leader.nativePlace}
                                  </span>
                                )}
                              </div>

                              {/* Bio */}
                              {leader.bio && (
                                <p className="text-xs text-slate-400 leading-relaxed text-center line-clamp-3">
                                  {leader.bio}
                                </p>
                              )}

                              {/* Founder's Quote */}
                              {leader.message && (
                                <div className="relative mt-2 pt-3 border-t border-white/10">
                                  <Quote size={14} className="text-blue-400/40 absolute top-2 left-0" />
                                  <p className="text-xs text-blue-200/80 italic pl-5 leading-relaxed">
                                    &quot;{leader.message}&quot;
                                  </p>
                                </div>
                              )}

                              {/* Social Links */}
                              {(leader.linkedinUrl || leader.twitterUrl || leader.facebookUrl) && (
                                <div className="flex items-center justify-center gap-2 pt-2">
                                  {leader.linkedinUrl && (
                                    <a href={leader.linkedinUrl} target="_blank" rel="noopener noreferrer"
                                      className="w-8 h-8 rounded-full bg-white/10 text-blue-300 hover:bg-[#0A66C2] hover:text-white flex items-center justify-center transition-all duration-300">
                                      <LinkedinIcon size={14} />
                                    </a>
                                  )}
                                  {leader.facebookUrl && (
                                    <a href={leader.facebookUrl} target="_blank" rel="noopener noreferrer"
                                      className="w-8 h-8 rounded-full bg-white/10 text-blue-300 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-300">
                                      <FacebookIcon size={14} />
                                    </a>
                                  )}
                                  {leader.twitterUrl && (
                                    <a href={leader.twitterUrl} target="_blank" rel="noopener noreferrer"
                                      className="w-8 h-8 rounded-full bg-white/10 text-blue-300 hover:bg-gray-800 hover:text-white flex items-center justify-center transition-all duration-300">
                                      <ExternalLink size={14} />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CSS animations (injected inline) */}
                    <style dangerouslySetInnerHTML={{ __html: `
                      @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                      @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                      }
                      @keyframes scaleIn {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                      }
                    `}} />
                  </div>
                );
              })()}

              {/* ═══ BENTO GRID — on desktop the About/Jobs cards stack in a wide left
                  column beside a tall contact+inquiry cell; everything collapses to a
                  single column below lg. ═══ */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 items-start">

              {/* Description & Skill/Category Pills */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">About Company</h3>
                  {(() => {
                    const descText = company.description || `${company.name} is a leading professional business in ${company.district || 'Theni'}, dedicated to providing top-quality products, services, and local career opportunities.`;
                    const isLong = descText.length > 250;
                    return (
                      <div>
                        <p className={`text-gray-700 text-sm sm:text-base leading-relaxed break-words ${!showFullDesc && isLong ? 'line-clamp-4' : ''}`}>
                          {descText}
                        </p>
                        {isLong && (
                          <button onClick={() => setShowFullDesc(!showFullDesc)}
                            className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline focus:outline-none">
                            {showFullDesc ? 'Show Less ▲' : 'Read More ▼'}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Category & Service Pills */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-800 text-xs font-semibold">
                    {company.category || company.businessType || 'Local Business'}
                  </span>
                  {company.services?.slice(0, 4).map((service: any) => (
                    <span key={typeof service === 'string' ? service : service.name} className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-medium">
                      {typeof service === 'string' ? service : service.name}
                    </span>
                  ))}
                </div>

                {/* Website Link */}
                {company.website && (
                  <div className="pt-2">
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline"
                    >
                      <Globe size={15} />
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {/* Social Media Circular Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                  {company.facebook && (
                    <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                      <FacebookIcon size={16} />
                    </a>
                  )}
                  {company.instagram && (
                    <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                      <InstagramIcon size={16} />
                    </a>
                  )}
                  {company.linkedin && (
                    <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                      <LinkedinIcon size={16} />
                    </a>
                  )}
                  {company.whatsapp && (
                    <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
                      <MessageCircle size={16} />
                    </a>
                  )}
                </div>
              </div>

              {/* Open Jobs Section inside About Tab */}
              {jobs.length > 0 && (
                <div className="lg:col-span-2 lg:order-3 bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Open Jobs</h2>
                    <button onClick={() => setActiveTab('jobs')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                      View All {jobs.length} Jobs <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {jobs.slice(0, 4).map((job) => (
                      <div key={job.id} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm truncate">{job.title}</h3>
                          <div className="text-xs font-bold text-emerald-600 mt-1">
                            {job.salary || 'Rs. Negotiable'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <MapPin size={12} className="text-gray-400" />
                            <span>{job.district || company.district || 'Theni'}</span>
                          </div>
                        </div>

                        <Link
                          href={`/jobs/${job.id}`}
                          className="mt-4 w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold text-center hover:bg-blue-700 transition-colors block"
                        >
                          Apply
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact & Location Details — the tall right-hand bento cell on desktop,
                  sticky so the enquiry form follows the reader down the page. */}
              <div className="lg:col-span-1 lg:order-2 lg:sticky lg:top-24 bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Location & Contact</h2>

                {/* Single column inside the narrow bento cell; two columns only on the
                    tablet range where this card is still full width. */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="space-y-3">
                    <a href={`tel:${company.phone}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Phone size={15} />
                      </div>
                      <span>{company.phone || 'Not available'}</span>
                    </a>

                    <a href={`mailto:${company.email}`} className="flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Mail size={15} />
                      </div>
                      <span className="truncate">{company.email || 'Not available'}</span>
                    </a>

                    {company.website && (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-blue-600 hover:underline"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Globe size={15} />
                        </div>
                        <span className="truncate">{company.website}</span>
                      </a>
                    )}

                    {company.workingHours && (
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Clock size={15} />
                        </div>
                        <span>{company.workingHours}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <MapPin size={15} />
                      </div>
                      <span>{company.address || `${company.district}, Tamil Nadu`}</span>
                    </div>

                    {company.proofNumber && (
                      <div className="flex items-center gap-3 text-xs text-blue-900 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                        <ShieldCheck size={16} className="text-blue-600 shrink-0" />
                        <div>
                          <span className="font-bold">{company.proofType || 'Govt Verification Proof'}: </span>
                          <span className="font-mono font-bold">{company.proofNumber}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send Inquiry Box */}
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Send Direct Inquiry</h3>
                    <input type="text" placeholder="Your Name" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                    <input type="tel" placeholder="Mobile Number" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500" />
                    <button
                      onClick={() => setEnquirySent(true)}
                      className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Send size={12} /> Send Inquiry
                    </button>
                    {enquirySent && (
                      <p className="text-[11px] text-emerald-600 font-medium text-center">Inquiry sent to business dashboard!</p>
                    )}
                  </div>
                </div>
              </div>

              </div>{/* ═══ end bento grid ═══ */}
            </>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package size={20} className="text-blue-600" /> Products Catalogue
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {company.products?.map((p: any) => {
                  const phone = p.callNumber || company.whatsapp || company.phone || '';
                  const cleanPhone = phone.replace(/[^0-9+]/g, '');
                  const waNum = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`);
                  return (
                    <div key={p.id || p.name}
                      className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => { setSelectedItem(p); setSelectedItemType('product'); }}
                    >
                      {p.imageUrl ? (
                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                          <Package size={40} className="text-blue-300" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        {p.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#2563EB' }}>{p.category}</span>
                        )}
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{p.name}</h3>
                        <p className="text-xs font-semibold text-emerald-600">{p.priceRange || (p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : 'Price on Request')}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{p.description || ''}</p>
                        {/* Keywords */}
                        {p.keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {p.keywords.slice(0, 4).map((kw: string) => (
                              <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{kw}</span>
                            ))}
                          </div>
                        )}
                        {/* CTA Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                                `🛍️ *PRODUCT ORDER / INQUIRY*\n` +
                                `━━━━━━━━━━━━━━━━━━━━\n` +
                                `🏢 *Company:* ${company.name}\n` +
                                `📦 *Item:* ${p.name}\n` +
                                `💰 *Price:* ${p.priceRange || (p.price ? `₹${Number(p.price).toLocaleString('en-IN')}` : 'Price on Request')}\n` +
                                `📍 *Location:* ${company.district || 'Theni'}, Tamil Nadu\n` +
                                (p.imageUrl ? `🖼️ *Photo:* ${p.imageUrl}\n` : '') +
                                (p.websiteUrl ? `🌐 *Product Link:* ${p.websiteUrl}\n` : '') +
                                `🔗 *THENIJOBS Page:* ${typeof window !== 'undefined' ? window.location.origin : 'https://thenijobs.com'}/company/${company.slug}\n` +
                                `━━━━━━━━━━━━━━━━━━━━\n` +
                                `Hello, I found your product on THENIJOBS Marketplace and would like to order / inquire about this. Please share availability and delivery options.`
                              )}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-all shadow-xs"
                              style={{ background: '#25D366' }}>
                              <MessageCircle size={13} /> Order via WhatsApp
                            </a>
                          )}
                          {cleanPhone && (
                            <a href={`tel:${cleanPhone}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all">
                              <Phone size={13} /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Wrench size={20} className="text-blue-600" /> Services Directory
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {company.services?.map((s: any, idx: number) => {
                  const serviceName = typeof s === 'string' ? s : s.name;
                  const serviceDesc = typeof s === 'string' ? '' : (s.description || '');
                  const servicePrice = typeof s === 'string' ? '' : s.priceRange || (s.startingPrice ? `Starting ₹${Number(s.startingPrice).toLocaleString('en-IN')}` : '');
                  const serviceCategory = typeof s === 'string' ? '' : (s.category || '');
                  const phone = (typeof s !== 'string' ? s.callNumber : '') || company.whatsapp || company.phone || '';
                  const cleanPhone = phone.replace(/[^0-9+]/g, '');
                  const waNum = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`);
                  return (
                    <div key={idx}
                      className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                      onClick={() => { setSelectedItem(typeof s === 'string' ? { name: s } : s); setSelectedItemType('service'); }}
                    >
                      {s.imageUrl ? (
                        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                          <img src={s.imageUrl} alt={serviceName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                          <Wrench size={40} className="text-emerald-300" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        {serviceCategory && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: '#ECFDF5', color: '#059669' }}>{serviceCategory}</span>
                        )}
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{serviceName}</h3>
                        {servicePrice && <p className="text-xs font-semibold text-emerald-600">{servicePrice}</p>}
                        <p className="text-xs text-gray-500 line-clamp-2">{serviceDesc}</p>
                        {/* Keywords */}
                        {s.keywords?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {s.keywords.slice(0, 4).map((kw: string) => (
                              <span key={kw} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{kw}</span>
                            ))}
                          </div>
                        )}
                        {/* CTA Buttons */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          {cleanPhone && (
                            <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Hi, I found your service "${serviceName}" on THENIJOBS. I would like to know more about this service.`)}`}
                              target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-all"
                              style={{ background: '#25D366' }}>
                              <MessageCircle size={13} /> WhatsApp
                            </a>
                          )}
                          {cleanPhone && (
                            <a href={`tel:${cleanPhone}`}
                              onClick={e => e.stopPropagation()}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all">
                              <Phone size={13} /> Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === 'portfolio' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FolderGit2 size={20} className="text-blue-600" /> Portfolio & Projects Showcase
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {company.portfolioProjects?.map((proj: any) => (
                  <div key={proj.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-2 hover:shadow-md transition-all">
                    {proj.imageUrl && (
                      <div className="aspect-video rounded-xl bg-gray-200 overflow-hidden">
                        <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-sm">{proj.title}</h3>
                    {proj.location && <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11} /> {proj.location}</p>}
                    <p className="text-xs text-gray-500 line-clamp-2">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JOBS TAB */}
          {activeTab === 'jobs' && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">All Open Job Vacancies ({jobs.length})</h2>
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{job.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="font-semibold text-emerald-600">{job.salary}</span>
                        <span>•</span>
                        <span>{job.type}</span>
                      </div>
                    </div>
                    <Link href={`/jobs/${job.id}`} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors">
                      Apply
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <CompanyReviewsSection
              companyId={company.id}
              companyName={company.name}
              reviews={reviews}
              averageRating={company.rating || 0}
            />
          )}

        </div>

      </div>

      {/* ═══ STICKY MOBILE ACTION BAR ═══
          The primary contact actions follow the reader down the page on phones, where the
          buttons in the header scroll away almost immediately. Sits directly above
          BottomNav (fixed, ~64px + safe area) and is hidden on lg, where the sticky
          contact cell in the bento grid serves the same purpose. */}
      <div
        className="fixed left-0 right-0 z-40 lg:hidden px-3 pb-2"
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto max-w-md flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur border border-gray-200 shadow-[0_8px_24px_rgba(15,23,42,0.12)] p-2">
          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs"
              style={{ background: '#2563EB' }}
            >
              <Phone size={14} /> Call
            </a>
          )}
          {(company.whatsapp || company.phone) && (
            <a
              href={`https://wa.me/${company.whatsapp || company.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs"
              style={{ background: '#25D366' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
          )}
          {company.email && (
            <a
              href={`mailto:${company.email}`}
              aria-label="Email this business"
              className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-200"
            >
              <Mail size={16} />
            </a>
          )}
          <a
            href={googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get directions"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200"
          >
            <Navigation size={16} />
          </a>
        </div>
      </div>

      <BottomNav />

      {/* ═══ FULL-SCREEN PRODUCT/SERVICE DETAIL MODAL ═══ */}
      {selectedItem && (() => {
        const item = selectedItem;
        const isProduct = selectedItemType === 'product';
        const phone = item.callNumber || company.whatsapp || company.phone || '';
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        const waNum = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : (cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`);
        const itemName = item.name || 'Item';
        const priceDisplay = isProduct
          ? (item.priceRange || (item.price ? `₹${Number(item.price).toLocaleString('en-IN')}` : 'Price on Request'))
          : (item.priceRange || (item.startingPrice ? `Starting ₹${Number(item.startingPrice).toLocaleString('en-IN')}` : ''));

        // Related items: same category OR overlapping keywords
        const allItems = isProduct ? (company.products || []) : (company.services || []).filter((s: any) => typeof s !== 'string');
        const related = allItems.filter((other: any) => {
          if ((other.id || other.name) === (item.id || item.name)) return false;
          if (item.category && other.category && item.category === other.category) return true;
          if (item.keywords?.length && other.keywords?.length) {
            return item.keywords.some((kw: string) => other.keywords.includes(kw));
          }
          return false;
        }).slice(0, 4);

        return (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setSelectedItem(null)}>
            <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>

              {/* Header with close button */}
              <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <ArrowLeft size={18} className="text-gray-700" />
                </button>
                <h3 className="text-sm font-bold text-gray-900 truncate flex-1 text-center px-2">{isProduct ? 'Product Details' : 'Service Details'}</h3>
                <button onClick={() => setSelectedItem(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={18} className="text-gray-700" />
                </button>
              </div>

              {/* Image */}
              {item.imageUrl ? (
                <div className="w-full aspect-square bg-gray-100">
                  <img src={item.imageUrl} alt={itemName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-square bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  {isProduct ? <Package size={64} className="text-blue-300" /> : <Wrench size={64} className="text-emerald-300" />}
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Category badge */}
                {item.category && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: isProduct ? '#EFF6FF' : '#ECFDF5', color: isProduct ? '#2563EB' : '#059669' }}>
                    {item.category}
                  </span>
                )}

                {/* Name & Price */}
                <h2 className="text-xl font-bold text-gray-900">{itemName}</h2>
                {priceDisplay && <p className="text-lg font-bold text-emerald-600">{priceDisplay}</p>}

                {/* Company info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-blue-600 flex-shrink-0"
                    style={{ background: '#EFF6FF' }}>
                    {company.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                      {company.name}
                      {company.verificationStatus === 'verified' && <BadgeCheck size={14} className="text-blue-600" />}
                    </p>
                    <p className="text-xs text-gray-500">{company.district || 'Tamil Nadu'}</p>
                  </div>
                </div>

                {/* Description */}
                {item.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                  </div>
                )}

                {/* Features / Details list */}
                {(item.features?.length > 0 || item.details?.length > 0) && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{isProduct ? 'Features' : 'Details'}</p>
                    <ul className="space-y-1.5">
                      {(isProduct ? item.features : item.details)?.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Keywords */}
                {item.keywords?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keywords.map((kw: string) => (
                        <span key={kw} className="text-[10px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium flex items-center gap-1">
                          <Tag size={9} /> {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Website */}
                {item.websiteUrl && (
                  <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline">
                    <Globe size={14} /> Visit Website <ExternalLink size={12} />
                  </a>
                )}

                {/* Primary CTAs */}
                <div className="flex gap-3 pt-2">
                  {cleanPhone && (
                    <a
                      href={`https://wa.me/${waNum}?text=${encodeURIComponent(
                        `🛍️ *NEW ${isProduct ? 'PRODUCT ORDER' : 'SERVICE BOOKING'}*\n` +
                        `━━━━━━━━━━━━━━━━━━━━\n` +
                        `🏢 *Company:* ${company.name}\n` +
                        `${isProduct ? '📦 *Product:*' : '🔧 *Service:*'} ${itemName}\n` +
                        `💰 *Pricing:* ${priceDisplay}\n` +
                        `📍 *Location:* ${company.district || 'Theni'}, Tamil Nadu\n` +
                        (item.imageUrl ? `🖼️ *Photo Reference:* ${item.imageUrl}\n` : '') +
                        (item.websiteUrl ? `🌐 *Direct Link:* ${item.websiteUrl}\n` : '') +
                        `🔗 *THENIJOBS Page:* ${typeof window !== 'undefined' ? window.location.origin : 'https://thenijobs.com'}/company/${company.slug}\n` +
                        `━━━━━━━━━━━━━━━━━━━━\n` +
                        `Hello, I found your ${isProduct ? 'product' : 'service'} on THENIJOBS Marketplace and would like to order / book this. Please share availability and payment/delivery details.`
                      )}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-bold hover:opacity-90 transition-all shadow-md"
                      style={{ background: '#25D366' }}>
                      <MessageCircle size={16} /> Order / Book via WhatsApp
                    </a>
                  )}
                  {cleanPhone && (
                    <a href={`tel:${cleanPhone}`}
                      className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border-2 border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all">
                      <Phone size={16} /> Call
                    </a>
                  )}
                </div>

                {/* ═══ RELATED PRODUCTS/SERVICES ═══ */}
                {related.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-bold text-gray-900 mb-3">Related {isProduct ? 'Products' : 'Services'}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {related.map((r: any, i: number) => (
                        <div key={r.id || r.name || i}
                          className="rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-all"
                          onClick={() => setSelectedItem(r)}>
                          {r.imageUrl ? (
                            <div className="aspect-square bg-gray-100 overflow-hidden">
                              <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ) : (
                            <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                              {isProduct ? <Package size={24} className="text-gray-300" /> : <Wrench size={24} className="text-gray-300" />}
                            </div>
                          )}
                          <div className="p-2.5">
                            <p className="text-xs font-bold text-gray-900 line-clamp-1">{r.name}</p>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                              {isProduct ? (r.priceRange || (r.price ? `₹${Number(r.price).toLocaleString('en-IN')}` : '')) : (r.priceRange || '')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}

