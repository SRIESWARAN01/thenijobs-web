'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { db, functions } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import FloatingWhatsApp from '@/components/ui/FloatingWhatsApp';
import ShareModal from '@/components/ui/ShareModal';
import {
  MapPin, Phone, Mail, Globe, MessageCircle, Share2, Heart, X,
  Star, BadgeCheck, Clock, Users, Eye, TrendingUp, ChevronRight,
  Briefcase, Navigation, Building2,
  ShieldCheck, FileCheck, Award, ExternalLink,
  BellRing, Send, Quote, Newspaper, PackagePlus, Crown, UserCheck,
  Lock, Sparkles, Copy, Check, ShieldAlert,
  Calendar, ShoppingBag, Filter, ShoppingCart,
  Image as ImageIcon, FileDown, ThumbsUp, UserPlus, UserMinus, BarChart3, Loader2
} from 'lucide-react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from '@/components/ui/BrandIcons';
import { trackAnalyticsEvent } from '@/lib/analytics';
import { useAuth } from '@/hooks/useAuth';
import { trackProductOrServiceAnalytics } from '@/lib/firebase/firestoreService';
import { followCompany, unfollowCompany, useIsFollowing, useFollowerCount } from '@/lib/firebase/followService';
import { likeProduct, unlikeProduct, useUserProductLikes } from '@/lib/firebase/likeService';
import { getCompanyActivePlan, getPlanRank } from '@/lib/subscriptions';
import { downloadVCard } from '@/lib/vcf';
import { downloadCompanyPdf } from '@/lib/companyPdf';
import TrustScoreBadge from '@/components/company/TrustScoreBadge';
import { CustomTemplateWrapper } from '@/components/company/CustomTemplates';
import {
  getCompanyBannerUrl,
  getCompanyPortfolioUrl,
  normalizeExternalUrl,
} from '@/lib/companyPortfolio';

function getCleanCallUrl(num: string | undefined | null): string {
  const clean = String(num || '').replace(/[^\d+]/g, '');
  return `tel:${clean}`;
}

function getCleanWhatsAppUrl(num: string | undefined | null, text: string): string {
  const clean = String(num || '').replace(/\D/g, '');
  const formatted = clean.length === 10 ? `91${clean}` : clean;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
}

function getGoogleMapsUrl(company: any): string {
  if (company.googleMapsUrl) return company.googleMapsUrl;
  if (company.mapsUrl) return company.mapsUrl;
  if (company.mapUrl) return company.mapUrl;
  const query = `${company.name || ''} ${company.address || ''} ${company.district || ''}`.trim();
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}



// ──────────────────────────────────────────────────────────────────
// SERVICES SHOWCASE COMPONENT
// ──────────────────────────────────────────────────────────────────
function ServicesShowcaseSection({ company, services, currentTheme }: { company: any; services: any[]; currentTheme: any }) {
  const { user } = useAuth();
  
  if (!services || services.length === 0) return null;

  const handleServiceAction = async (service: any, eventType: 'whatsapp' | 'call' | 'email') => {
    try {
      const customerData = {
        name: user?.displayName || (user as any)?.fullName || 'Anonymous Guest',
        phone: user?.phone || '',
        email: user?.email || '',
      };

      await trackProductOrServiceAnalytics(
        service.id,
        'service',
        company.id || '',
        eventType,
        customerData
      );
    } catch (err) {
      console.error('Error tracking service action:', err);
    }

    if (eventType === 'whatsapp') {
      const serviceUrl = `${getCompanyPortfolioUrl(
        company,
        typeof window !== 'undefined' ? window.location.origin : undefined,
      )}#services`;
      const visitor = user?.displayName || user?.email?.split('@')[0] || 'Visitor';
      
      const text = formatProductWhatsApp(company, { name: service.name, id: service.id, description: service.description, price: service.price });
      
      const rawNum = company.whatsapp || company.phone || '917094826586';
      const cleanPhone = String(rawNum).replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      
      window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
    } else if (eventType === 'call') {
      window.location.assign(`tel:${company.phone || ''}`);
    } else if (eventType === 'email') {
      window.location.assign(`mailto:${company.email || ''}?subject=Enquiry regarding ${encodeURIComponent(service.name)}`);
    }
  };

  return (
    <div className={`${currentTheme.card || 'bg-white/[0.02] border border-white/5'} rounded-3xl p-6 space-y-6`}>
      <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
        <Briefcase size={16} className={currentTheme.accent || 'text-rose-400'} /> Our Services Showcase
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service: any) => {
          const priceText = service.price ? `Starting at ₹${service.price}` : 'Price on request';
          const availability = service.availability || 'Available';
          const imageUrl = service.imageUrl || '';

          return (
            <div key={service.id} className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between gap-4">
              <div className="flex gap-4">
                {imageUrl ? (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-white/10">
                    <img src={imageUrl} alt={service.name} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-xl shrink-0 bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500">
                    <Briefcase size={24} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{service.name}</h4>
                  </div>
                  {service.category && (
                    <span className="text-[8px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                      {service.category}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap text-[9px] text-slate-500 font-medium">
                    <span className="text-slate-300">{priceText}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{availability}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-white/5">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleServiceAction(service, 'call')}
                    className="flex-1 py-1.5 rounded-lg border border-white/10 text-[9px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/5 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Phone size={10} /> Call
                  </button>
                  <button
                    onClick={() => handleServiceAction(service, 'whatsapp')}
                    className="flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-white hover:opacity-90 flex items-center justify-center gap-1 transition-all"
                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                  >
                    <MessageCircle size={10} /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleServiceAction(service, 'email')}
                    className="flex-1 py-1.5 rounded-lg border border-white/10 text-[9px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/5 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Mail size={10} /> Email
                  </button>
                </div>
                
                <Link
                  href={`/services/${service.id}`}
                  className="w-full py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[9px] font-bold uppercase tracking-wider text-white flex items-center justify-center gap-1 border border-white/5 transition-all text-center"
                >
                  View Details <ChevronRight size={10} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const renderVerificationBadge = (company: any, size = 18) => {
  if (!company || company.verificationStatus !== 'verified') return null;

  const plan = getCompanyActivePlan(company);

  if (plan === 'free') return null;

  if (plan === 'basic') {
    // Grey Verified Style Badge
    return (
      <span title="Standard Business" className="shrink-0 inline-block align-middle ml-1.5 animate-fade-in">
        <BadgeCheck size={size} className="text-slate-400 fill-slate-400/10" />
      </span>
    );
  }

  if (plan === 'premium') {
    // Blue Premium Verified Badge
    return (
      <span title="Premium Verified Business" className="shrink-0 inline-block align-middle ml-1.5 animate-fade-in">
        <BadgeCheck size={size} className="text-blue-500 fill-blue-500/10" />
      </span>
    );
  }

  if (plan === 'enterprise') {
    // Gold Verified Badge + Crown Icon
    return (
      <span className="inline-flex items-center gap-0.5 align-middle ml-1.5 shrink-0 animate-fade-in">
        <span title="Enterprise Verified Business">
          <BadgeCheck size={size} className="text-amber-500 fill-amber-500/10" />
        </span>
        <span className="text-xs text-amber-500 font-extrabold" style={{ fontSize: size * 0.65 }} title="Enterprise Crown VIP">👑</span>
      </span>
    );
  }

  return null;
};

// ──────────────────────────────────────────────────────────────────
// SUBSCRIPTION PLAN BADGE
// ──────────────────────────────────────────────────────────────────
function SubscriptionPlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { label: string; emoji: string; style: string }> = {
    free: { label: 'Free Member', emoji: '🌱', style: 'bg-slate-800/60 border-slate-700 text-slate-400' },
    basic: { label: 'Standard Business', emoji: '⚙️', style: 'bg-slate-700/40 border-slate-600/30 text-slate-300' },
    premium: { label: 'Premium Verified Business', emoji: '💎', style: 'bg-blue-500/10 border-blue-400/30 text-blue-400' },
    enterprise: { label: 'Enterprise Verified Business', emoji: '👑', style: 'bg-amber-500/10 border-amber-400/30 text-amber-400 font-extrabold' },
  };
  const c = config[plan] || config.free;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${c.style}`}>
      <span>{c.emoji}</span> {c.label}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────
// COMPANY STATS BAR
// ──────────────────────────────────────────────────────────────────
function CompanyStatsBar({ company, jobs, reviews, accentColor = 'text-cyan-400' }: { company: any; jobs: any[]; reviews: any[]; accentColor?: string }) {
  const formatJoinDate = (dateVal: any) => {
    if (!dateVal) return 'Recently';
    let d: Date;
    if (dateVal instanceof Date) d = dateVal;
    else if (typeof dateVal === 'object' && dateVal.seconds) d = new Date(dateVal.seconds * 1000);
    else if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') d = dateVal.toDate();
    else d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const stats = [
    { label: 'Jobs', value: company.totalJobsPosted || jobs.length, icon: <Briefcase size={13} /> },
    { label: 'Products', value: company.totalProducts || company.products?.length || 0, icon: <ShoppingBag size={13} /> },
    { label: 'Followers', value: company.followerCount || 0, icon: <Users size={13} /> },
    { label: 'Reviews', value: company.reviewCount || reviews.length, icon: <Star size={13} /> },
    { label: 'Rating', value: company.rating > 0 ? `${company.rating}★` : 'N/A', icon: <ThumbsUp size={13} /> },
    { label: 'Visitors', value: company.totalVisitors || 0, icon: <Eye size={13} /> },
    { label: 'Joined', value: formatJoinDate(company.joinedDate), icon: <Calendar size={13} /> },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {stats.map(s => (
        <div key={s.label} className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <span className={`${accentColor}`}>{s.icon}</span>
          <span className="text-sm font-bold text-white">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</span>
          <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// FOLLOW BUTTON
// ──────────────────────────────────────────────────────────────────
function FollowButton({ companyId, accentStyle = '' }: { companyId: string; accentStyle?: string }) {
  const { user } = useAuth();
  const { following, loading } = useIsFollowing(user?.uid, companyId);
  const followerCount = useFollowerCount(companyId);
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    if (!user?.uid) {
      alert('Please login to follow this company.');
      return;
    }
    setBusy(true);
    try {
      if (following) {
        await unfollowCompany(user.uid, companyId);
      } else {
        await followCompany(user.uid, companyId);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy || loading}
      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 disabled:opacity-50 ${
        following
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300'
          : `border-white/10 hover:bg-white/5 text-white ${accentStyle}`
      }`}
    >
      {busy ? (
        <Loader2 size={13} className="animate-spin" />
      ) : following ? (
        <UserMinus size={13} />
      ) : (
        <UserPlus size={13} />
      )}
      {following ? 'Following' : 'Follow'}
      {followerCount > 0 && <span className="text-[10px] opacity-70">({followerCount.toLocaleString()})</span>}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────
// PRODUCT LIKE BUTTON (inline, for product cards)
// ──────────────────────────────────────────────────────────────────
function ProductLikeButton({ productId, companyId, likeCount = 0, isLiked, accentColor = 'text-rose-400' }: {
  productId: string; companyId: string; likeCount?: number; isLiked: boolean; accentColor?: string;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    if (!user?.uid) {
      alert('Please login to like products.');
      return;
    }
    setBusy(true);
    try {
      if (isLiked) {
        await unlikeProduct(user.uid, productId);
      } else {
        await likeProduct(user.uid, productId, companyId);
      }
    } catch (err) {
      console.error('Like toggle error:', err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`flex items-center gap-1 text-[10px] font-bold transition-all disabled:opacity-50 ${
        isLiked ? accentColor : 'text-slate-500 hover:text-rose-400'
      }`}
    >
      <Heart size={13} className={isLiked ? 'fill-current' : ''} />
      {(likeCount || 0) > 0 && <span>{likeCount}</span>}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────
// REVIEW SUBMIT FORM
// ──────────────────────────────────────────────────────────────────
function ReviewSubmitForm({ companyId, companyName, reviews = [], accentColor = 'text-cyan-400', btnStyle = 'bg-gradient-to-r from-cyan-500 to-blue-500', theme = 'dark' }: {
  companyId: string; companyName: string; reviews?: any[]; accentColor?: string; btnStyle?: string; theme?: 'light' | 'dark';
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingReview = user ? reviews.find((r: any) => r.userId === user.uid) : null;

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setContent(existingReview.comment || existingReview.content || '');
    }
  }, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user?.uid) {
      setError('Please login to submit a review.');
      return;
    }
    const cleanComment = content.trim();
    if (!cleanComment) {
      setError('Please write your review.');
      return;
    }
    // Spam and fake review validation checks on client
    if (/(.)\1{4,}/.test(cleanComment)) {
      setError('Spam detected! Repetitive characters are not allowed.');
      return;
    }
    if (/https?:\/\/[^\s]+/.test(cleanComment) || /www\.[^\s]+/.test(cleanComment)) {
      setError('Links/URLs are not allowed in reviews.');
      return;
    }
    if (cleanComment.length < 5) {
      setError('Comment must be at least 5 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const submitCallable = httpsCallable<any, { success: boolean; reviewId: string; updated?: boolean }>(
        functions,
        'submitBusinessReview'
      );
      await submitCallable({
        companyId,
        rating,
        comment: cleanComment,
        userName: user.displayName || (user as any).fullName || 'Anonymous',
        userPhoto: user.photoURL || '',
      });
      trackAnalyticsEvent({ companyId, eventType: 'review_submit' });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Review submit error:', err);
      setError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`text-center py-8 px-4 rounded-2xl border ${theme === 'light' ? 'bg-emerald-50/50 border-emerald-100 text-slate-800' : 'bg-emerald-950/15 border-emerald-500/20 text-white'} space-y-4 animate-fadeIn`}>
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
          <Check size={26} className="text-emerald-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-emerald-500">
            {existingReview ? 'Review Updated Successfully!' : 'Review Submitted Successfully!'}
          </p>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Your review is now live on the platform.
          </p>
        </div>
        <button
          onClick={() => {
            setSubmitted(false);
            window.location.reload();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${theme === 'light' ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-300'}`}
        >
          Close & Refresh
        </button>
      </div>
    );
  }

  const isLight = theme === 'light';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 animate-slideDown ${isLight ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="opacity-60 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      {existingReview && (
        <div className={`p-3 rounded-xl border text-[11px] font-bold ${isLight ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}>
          ✏️ You have already reviewed this company. Submitting this form will update your existing rating and review comments.
        </div>
      )}

      <div>
        <label className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Your Rating
        </label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map(n => {
            const active = n <= (hoveredRating ?? rating);
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoveredRating(n)}
                onMouseLeave={() => setHoveredRating(null)}
                className="transition-all hover:scale-125 focus:outline-none"
              >
                <Star
                  size={24}
                  className={`transition-colors duration-150 ${
                    active
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.35)]'
                      : isLight
                        ? 'text-slate-300 fill-slate-50'
                        : 'text-slate-700 fill-slate-900/40'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          placeholder="Share your experience with this business..."
          value={content}
          onChange={e => {
            setContent(e.target.value);
            if (error) setError(null);
          }}
          rows={3}
          required
          className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none focus:ring-2 transition-all resize-none ${
            isLight
              ? 'bg-slate-100 border-slate-200 focus:border-slate-400 focus:bg-white text-slate-900 placeholder:text-slate-500 focus:ring-slate-500/10'
              : 'bg-white/[0.02] border-white/[0.08] focus:border-white/20 focus:bg-white/[0.04] text-white placeholder:text-slate-450 focus:ring-white/5'
          }`}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all hover:brightness-105 active:scale-[0.98] focus:ring-2 focus:ring-purple-500/20 focus:outline-none flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-md ${btnStyle}`}
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {submitting ? 'Submitting...' : existingReview ? 'Update My Review' : 'Submit Review'}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────
// ENHANCED ENQUIRY FORM
// ──────────────────────────────────────────────────────────────────
function EnhancedEnquiryForm({ companyId, companyName, btnStyle = 'bg-gradient-to-r from-cyan-500 to-blue-500', variant = 'dark' }: {
  companyId: string; companyName: string; btnStyle?: string; variant?: 'light' | 'dark';
}) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, 'leads'), {
        companyId,
        companyName,
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        message: message.trim(),
        type,
        source: 'company_profile',
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch (err) {
      console.error(err);
      alert('Failed to send enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Light variant styles (for white backgrounds like Free template)
  const isLight = variant === 'light';
  const inputCls = isLight
    ? 'w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-blue-400 outline-none'
    : 'w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-xs rounded-xl text-white placeholder:text-slate-600 focus:border-white/20 outline-none';
  const selectCls = isLight
    ? 'w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl text-slate-900 focus:border-blue-400 outline-none appearance-none cursor-pointer'
    : 'w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-xs rounded-xl text-white focus:border-white/20 outline-none appearance-none cursor-pointer';

  if (sent) {
    return (
      <div className="text-center py-6 space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto animate-bounce">
          <Check size={20} className="text-emerald-400" />
        </div>
        <p className={`text-xs font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>Enquiry sent successfully!</p>
        <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>The business will contact you soon.</p>
        <button onClick={() => setSent(false)} className={`text-[10px] underline mt-2 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>Send another enquiry</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <select value={type} onChange={e => setType(e.target.value)} className={selectCls}>
        <option value="general">General Enquiry</option>
        <option value="product">Product Enquiry</option>
        <option value="service">Service Enquiry</option>
        <option value="job">Job Application</option>
        <option value="partnership">Partnership</option>
      </select>
      <input type="text" placeholder="Your Name *" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-xs rounded-xl text-white placeholder:text-slate-600 focus:border-white/20 outline-none" />
      <input type="tel" placeholder="Mobile Number *" value={mobile} onChange={e => setMobile(e.target.value)} required className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-xs rounded-xl text-white placeholder:text-slate-600 focus:border-white/20 outline-none" />
      <input type="email" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-xs rounded-xl text-white placeholder:text-slate-600 focus:border-white/20 outline-none" />
      <textarea placeholder="Your requirement *" value={message} onChange={e => setMessage(e.target.value)} rows={2} required className="w-full bg-white/[0.03] border border-white/[0.08] px-3 py-2 text-xs rounded-xl text-white placeholder:text-slate-600 focus:border-white/20 outline-none resize-none" />
      <button type="submit" disabled={submitting} className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-40 ${btnStyle}`}>
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {submitting ? 'Sending...' : 'Send Enquiry'}
      </button>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────
// SOCIAL MEDIA LINKS
// ──────────────────────────────────────────────────────────────────
function SocialMediaLinks({ company, accentColor = 'text-cyan-400' }: { company: any; accentColor?: string }) {
  const links = [
    { key: 'facebook', url: company.facebook, icon: <FacebookIcon size={16} />, label: 'Facebook' },
    { key: 'instagram', url: company.instagram, icon: <InstagramIcon size={16} />, label: 'Instagram' },
    { key: 'linkedin', url: company.linkedin, icon: <LinkedinIcon size={16} />, label: 'LinkedIn' },
    { key: 'youtube', url: company.youtube, icon: <YoutubeIcon size={16} />, label: 'YouTube' },
    { key: 'twitter', url: company.twitter, icon: <span className="text-xs font-black">𝕏</span>, label: 'X / Twitter' },
    { key: 'website', url: company.website, icon: <Globe size={16} />, label: 'Website' },
  ].filter(l => !!l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map(l => (
        <a
          key={l.key}
          href={l.url.startsWith('http') ? l.url : `https://${l.url}`}
          target="_blank"
          rel="noopener noreferrer"
          title={l.label}
          className={`w-9 h-9 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center ${accentColor} hover:bg-white/[0.06] transition-all`}
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// VERIFIED DOCUMENT BADGES
// ──────────────────────────────────────────────────────────────────
function VerifiedDocBadges({ company }: { company: any }) {
  const plan = getCompanyActivePlan(company);

  const trustItems = [
    { key: 'adminApproved', label: 'Admin Approved', verified: company.verificationStatus === 'verified' },
    { key: 'premiumBadge', label: 'Premium Tier', verified: plan === 'premium' || plan === 'enterprise' },
    { key: 'gstVerified', label: 'GST Verified', verified: company.verificationBadges?.gstVerified || company.verification?.gst },
    { key: 'emailVerified', label: 'Email Verified', verified: company.verificationBadges?.emailVerified || company.verification?.email },
    { key: 'mobileVerified', label: 'Mobile Verified', verified: company.verificationBadges?.mobileVerified || !!company.phone },
    { key: 'websiteVerified', label: 'Website Verified', verified: !!company.website },
  ];

  const joinedStr = company.joinedDate
    ? new Date(company.joinedDate.seconds ? company.joinedDate.seconds * 1000 : company.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'June 2026';

  const lastActiveStr = company.lastActive
    ? new Date(company.lastActive.seconds ? company.lastActive.seconds * 1000 : company.lastActive).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    : 'Today';

  const responseRate = company.responseRate || '95%';
  const responseTime = company.responseTime || 'Under 1 hour';

  const score = company.trustScore || 50;
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
  const progressBg = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="space-y-4">
      {/* Dynamic Trust Score Progress Bar */}
      <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <span className="flex items-center gap-1">🛡️ Trust Index</span>
          <span className={`font-mono ${scoreColor}`}>{score}/100</span>
        </div>
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div className={`h-full ${progressBg} transition-all duration-500`} style={{ width: `${score}%` }} />
        </div>
        <p className="text-[9px] text-slate-500 leading-normal">
          Verified through profile completion, GST documents, client reviews, and response benchmarks.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {trustItems.map(b => (
          <span
            key={b.key}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
              b.verified
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-white/[0.02] border-white/[0.06] text-slate-500'
            }`}
          >
            <span className="text-[11px]">{b.verified ? '✓' : '🔒'}</span> {b.label}
          </span>
        ))}
      </div>

      <div className="pt-3 border-t border-white/5 space-y-2 text-[11px] text-slate-400">
        <div className="flex justify-between">
          <span className="text-slate-500">Joined Date</span>
          <span className="text-slate-350 font-semibold">{joinedStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Last Active</span>
          <span className="text-slate-355 font-semibold">{lastActiveStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Response Rate</span>
          <span className="text-emerald-450 font-semibold">{responseRate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Response Time</span>
          <span className="text-slate-355 font-semibold">{responseTime}</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// COMPANY BIO SECTION (Mission, Vision, Working Hours, etc.)
// ──────────────────────────────────────────────────────────────────
function CompanyBioSection({ company, cardStyle = '' }: { company: any; cardStyle?: string }) {
  const sections = [
    { key: 'mission', label: 'Our Mission', value: company.mission, icon: <Navigation size={14} /> },
    { key: 'vision', label: 'Our Vision', value: company.vision, icon: <Eye size={14} /> },
    { key: 'workingHours', label: 'Working Hours', value: company.workingHours, icon: <Clock size={14} /> },
    { key: 'experience', label: 'Experience', value: company.experience, icon: <Award size={14} /> },
    { key: 'teamSize', label: 'Team Size', value: company.teamSize, icon: <Users size={14} /> },
  ].filter(s => !!s.value);

  if (sections.length === 0) return null;

  return (
    <div className={`${cardStyle} rounded-2xl p-5 space-y-4`}>
      {sections.map(s => (
        <div key={s.key}>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
            <span className="text-slate-500">{s.icon}</span> {s.label}
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function formatWhatsAppMessage(
  templateString: string | undefined, 
  context: {
    visitorName?: string;
    companyName: string;
    portfolioLink: string;
    productServiceName?: string;
    enquiryMessage?: string;
  }
): string {
  const visitor = context.visitorName || 'Visitor';
  const companyName = context.companyName || 'this company';
  const link = context.portfolioLink;
  const item = context.productServiceName || 'General Enquiry';
  const msg = context.enquiryMessage || 'I would like to enquire about your products and services.';

  // Default template if none configured
  let tpl = templateString;
  if (!tpl) {
    tpl = `Hello, my name is {{visitorName}}. I am interested in {{productServiceName}} from {{companyName}}.\nLink: {{portfolioLink}}\nEnquiry: {{enquiryMessage}}`;
  }

  return tpl
    .replace(/\{\{visitorName\}\}/g, visitor)
    .replace(/\{\{companyName\}\}/g, companyName)
    .replace(/\{\{portfolioLink\}\}/g, link)
    .replace(/\{\{productServiceName\}\}/g, item)
    .replace(/\{\{enquiryMessage\}\}/g, msg);
}

/** Get current IST date and time strings */
function getISTDateTime(): { date: string; time: string } {
  const now = new Date();
  const istOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata' };
  const date = now.toLocaleDateString('en-IN', { ...istOptions, day: '2-digit', month: 'short', year: 'numeric' });
  const time = now.toLocaleTimeString('en-IN', { ...istOptions, hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time };
}

/** Generate a rich general company enquiry WhatsApp message */
function formatCompanyWhatsApp(company: any): string {
  const { date, time } = getISTDateTime();
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/company/${company.slug || company.id}`
    : `https://thenijobs.com/company/${company.slug || company.id}`;
  const website = company.website || company.portfolioUrl || '';
  const pageUrl = typeof window !== 'undefined' ? window.location.href : profileUrl;

  return [
    'Hello 👋',
    '',
    'I found your business through THENIJOBS.',
    '',
    `📌 Company Name:`,
    company.name || 'Verified Business',
    '',
    `🏢 Company Profile:`,
    profileUrl,
    '',
    ...(website ? [`🌐 Website / Portfolio:`, website, ''] : []),
    `📄 Page Viewed:`,
    pageUrl,
    '',
    `📅 Enquiry Date:`,
    date,
    '',
    `🕒 Enquiry Time:`,
    time,
    '',
    'I would like to know more about your products/services.',
    '',
    'Thank you.',
  ].join('\n');
}

/** Generate a rich product enquiry/order WhatsApp message */
function formatProductWhatsApp(company: any, product: any, quantity?: number): string {
  const { date, time } = getISTDateTime();
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/company/${company.slug || company.id}`
    : `https://thenijobs.com/company/${company.slug || company.id}`;
  const productUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/shop/products/${product.id || ''}`
    : `https://thenijobs.com/shop/products/${product.id || ''}`;
  const website = company.website || company.portfolioUrl || '';
  const priceStr = product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : 'Price on request';
  const weightStr = product.weight || product.size || product.unit || '';
  const descStr = product.description ? String(product.description).slice(0, 200) : '';

  return [
    'Hello 👋',
    '',
    'I found this product through THENIJOBS.',
    '',
    `🛍 Product Name:`,
    product.name || 'Product',
    '',
    `🔗 Product Link:`,
    productUrl,
    '',
    ...(weightStr ? [`⚖ Weight / Size:`, weightStr, ''] : []),
    ...(quantity && quantity > 1 ? [`📦 Quantity:`, String(quantity), ''] : []),
    `💰 Price:`,
    priceStr,
    '',
    ...(descStr ? [`📝 Product Description:`, descStr, ''] : []),
    `🏢 Company:`,
    company.name || 'Verified Business',
    '',
    `🏢 Company Profile:`,
    profileUrl,
    '',
    ...(website ? [`🌐 Website:`, website, ''] : []),
    `📅 Enquiry Date:`,
    date,
    '',
    `🕒 Enquiry Time:`,
    time,
    '',
    'Reference:',
    'THENIJOBS',
    '',
    'I am interested in purchasing this product.',
    'Please provide more details.',
    '',
    'Thank you.',
  ].join('\n');
}

export default function CompanyProfileClient({ company: rawCompany, jobs, reviews }: {
  company: any; jobs: any[]; reviews: any[];
}) {
  const company = {
    ...rawCompany,
    coverImageUrl: getCompanyBannerUrl(rawCompany),
    galleryImages: rawCompany.galleryImages || rawCompany.gallery || [],
    website: normalizeExternalUrl(rawCompany.website),
  };

  // Determine plan type: free, basic (Standard), premium, enterprise
  const plan = getCompanyActivePlan(company);
  const planRank = getPlanRank(plan);

  useEffect(() => {
    if (company?.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'visit'
      });
    }
  }, [company?.id]);

  // If company configured the Website Builder template
  if (company.websiteTemplate) {
    // Validate subscription limitations client-side
    let resolvedTheme = company.websiteTheme || 'classic-blue';
    let resolvedTemplate = company.websiteTemplate || 'classic-directory';

    // Theme plan ranking restrictions
    const themeRankRequirement: Record<string, number> = {
      'classic-blue': 0, 'emerald-growth': 0, 'royal-purple': 0,
      'sunset-amber': 2, 'ocean-cyan': 2, 'ruby-red': 2, 'midnight-dark': 2, 'forest-green': 2,
      'royal-gold': 3, 'modern-gray': 3, 'rose-pink': 3, 'indigo': 3
    };
    const requiredThemeRank = themeRankRequirement[resolvedTheme] || 0;
    if (planRank < requiredThemeRank) {
      resolvedTheme = 'classic-blue';
    }

    // Template plan ranking restrictions
    const templateRankRequirement: Record<string, number> = {
      'classic-directory': 0,
      'business-directory': 0,
      'corporate': 2, 'startup': 2, 'portfolio': 2, 'agency': 2, 'construction': 2, 'agriculture': 2,
      'hospital': 3, 'education': 3, 'restaurant': 3, 'ecommerce-storefront': 3, 'service-booking': 3, 'real-estate': 3
    };
    const requiredTemplateRank = templateRankRequirement[resolvedTemplate] || 0;
    if (planRank < requiredTemplateRank) {
      resolvedTemplate = 'classic-directory';
    }

    const customization = {
      websiteTheme: resolvedTheme,
      websiteTemplate: resolvedTemplate,
      customPrimaryColor: company.customPrimaryColor || '',
      fontFamily: company.fontFamily || 'Inter',
      buttonStyle: company.buttonStyle || 'rounded',
      cardStyle: company.cardStyle || 'flat',
      borderRadius: company.borderRadius || '12px',
      enableDarkMode: company.enableDarkMode || false,
      enableAnimations: company.enableAnimations !== false,
      sectionsVisible: {
        hero: company.sectionsVisible?.hero !== false,
        about: company.sectionsVisible?.about !== false,
        stats: company.sectionsVisible?.stats !== false,
        services: company.sectionsVisible?.services !== false,
        products: company.sectionsVisible?.products !== false,
        jobs: company.sectionsVisible?.jobs !== false,
        gallery: company.sectionsVisible?.gallery !== false,
        reviews: company.sectionsVisible?.reviews !== false,
        faq: company.sectionsVisible?.faq !== false,
        booking: company.sectionsVisible?.booking !== false,
        team: company.sectionsVisible?.team !== false,
        contact: company.sectionsVisible?.contact !== false,
      },
      homepageSectionsOrder: company.homepageSectionsOrder || ['hero', 'about', 'stats', 'services', 'products', 'jobs', 'gallery', 'reviews', 'faq', 'booking', 'team', 'contact'],
      fontSize: company.fontSize || '14px',
      headingSize: company.headingSize || '32px',
      lineHeight: company.lineHeight || '1.6',
      letterSpacing: company.letterSpacing || 'normal',
      fontWeight: company.fontWeight || 'normal',
      uppercaseToggle: !!company.uppercaseToggle,
      stickyHeader: company.stickyHeader !== false,
      transparentHeader: !!company.transparentHeader,
      logoPosition: company.logoPosition || 'left',
      menuPosition: company.menuPosition || 'right',
      showHeaderSearch: company.showHeaderSearch !== false,
      showHeaderWhatsApp: company.showHeaderWhatsApp !== false,
      showHeaderCall: company.showHeaderCall !== false,
      showHeaderLanguage: !!company.showHeaderLanguage,
      showHeaderThemeSwitch: !!company.showHeaderThemeSwitch,
      showHeaderLogin: !!company.showHeaderLogin,
      footerAbout: company.footerAbout !== false,
      footerHours: company.footerHours !== false,
      footerLinks: company.footerLinks !== false,
      footerProducts: company.footerProducts !== false,
      footerServices: company.footerServices !== false,
      footerMap: company.footerMap !== false,
      footerSocials: company.footerSocials !== false,
      footerNewsletter: !!company.footerNewsletter,
      footerPrivacyLinks: company.footerPrivacyLinks !== false,
    };

    return (
      <CustomTemplateWrapper
        company={company}
        jobs={jobs}
        reviews={reviews}
        customization={customization as any}
        isPreview={false}
      />
    );
  }

  // Fallback to legacy templates based on plan
  if (plan === 'enterprise') {
    return <TemplateEnterprise company={company} jobs={jobs} reviews={reviews} />;
  } else if (plan === 'premium') {
    return <TemplatePremium company={company} jobs={jobs} reviews={reviews} />;
  } else if (plan === 'basic') {
    return <TemplateStandard company={company} jobs={jobs} reviews={reviews} />;
  } else {
    return <TemplateFree company={company} jobs={jobs} reviews={reviews} />;
  }
}

// ──────────────────────────────────────────────────────────────────
// MINI DIGITAL ID CARD COMPONENT
// ──────────────────────────────────────────────────────────────────
function MiniDigitalIDCard({ company, plan }: { company: any; plan: string }) {
  const name = company.name || 'Business Partner';
  const logoUrl = company.logoUrl || '';
  const email = company.email || 'contact@business.com';
  const phone = company.phone || 'N/A';
  const category = company.category || 'Business Services';
  const address = company.address || 'Tamil Nadu';
  const uniqueId = `TNI-BUS-${company.id ? company.id.slice(0, 8).toUpperCase() : 'XXXX'}`;

  // Theme configuration for the card preview
  let cardBg = 'bg-gradient-to-br from-slate-900 to-slate-950 border-blue-900/10';
  let badgeStyle = 'bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold px-2 py-0.5 text-[9px] rounded';
  let badgeText = 'FREE TIER';
  let borderStyle = 'border-slate-800';
  let accentText = 'text-slate-400';
  let borderLeft = 'border-slate-500';

  if (plan === 'enterprise') {
    cardBg = 'bg-gradient-to-br from-[#050b18] via-[#10192e] to-[#1a2d52] border-violet-400/40 shadow-[0_0_20px_rgba(139,92,246,0.3)]';
    badgeStyle = 'bg-gradient-to-r from-violet-400 via-purple-500 to-indigo-500 text-white font-black px-2.5 py-0.5 text-[9px] rounded-full shadow-[0_0_12px_rgba(139,92,246,0.4)]';
    badgeText = '👑 ENTERPRISE VIP';
    borderStyle = 'border-violet-500/40';
    accentText = 'text-violet-400';
    borderLeft = 'border-violet-400';
  } else if (plan === 'premium') {
    cardBg = 'bg-gradient-to-br from-[#06060c] via-[#161208] to-[#2b1f09] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]';
    badgeStyle = 'bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 text-[9px] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    badgeText = '👑 PREMIUM VIP';
    borderStyle = 'border-amber-500/40';
    accentText = 'text-amber-400';
    borderLeft = 'border-amber-400';
  } else if (plan === 'basic') {
    cardBg = 'bg-gradient-to-br from-[#070b19] via-[#0b1433] to-[#142357] border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]';
    badgeStyle = 'bg-blue-500/25 border border-blue-400/30 text-white font-bold px-2 py-0.5 text-[9px] rounded-full';
    badgeText = 'STANDARD';
    borderStyle = 'border-blue-500/30';
    accentText = 'text-blue-400';
    borderLeft = 'border-blue-500';
  }

  return (
    <Link href={`/id/company/${encodeURIComponent(company.slug || company.id)}`} className="block group">
      <div className={`w-full rounded-2xl border p-4 flex flex-col justify-between min-h-[190px] relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${cardBg} ${borderStyle}`}>
        {/* Top row */}
        <div className="flex items-center justify-between z-10">
          <div className={`flex flex-col border-l-2 pl-1.5 ${borderLeft}`}>
            <span className="text-[8px] tracking-[0.2em] font-black text-slate-400 uppercase">THENIJOBS</span>
            <span className="text-[9px] font-extrabold tracking-wide text-white uppercase">VERIFIED PARTNER</span>
          </div>
          <span className={badgeStyle}>{badgeText}</span>
        </div>

        {/* Middle details */}
        <div className="my-3 flex gap-3 items-center z-10">
          <div className={`relative h-12 w-12 overflow-hidden rounded-xl border bg-[#070714] shrink-0 flex items-center justify-center ${borderStyle}`}>
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="object-cover w-full h-full" />
            ) : (
              <Building2 size={20} className={accentText} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-white truncate leading-tight">{name}</h4>
            <p className={`text-[10px] font-semibold truncate ${accentText}`}>{category}</p>
            <div className="text-[9px] font-mono text-slate-400 mt-1 font-bold">
              {uniqueId}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t border-white/5 pt-2 flex flex-col gap-0.5 z-10 text-[9px] text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <Phone size={9} className={accentText} />
            <span className="truncate">{phone}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <Mail size={9} className={accentText} />
            <span className="truncate">{email}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin size={9} className={accentText} />
            <span className="truncate">{address}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────────
// 1. FREE TEMPLATE (Clean, Minimalist, Slate/Gray Neutral)
// ──────────────────────────────────────────────────────────────────
function TemplateFree({ company, jobs, reviews }: { company: any; jobs: any[]; reviews: any[] }) {
  const [activeTab, setActiveTab] = useState('about');
  const [shareOpen, setShareOpen] = useState(false);

  const scrollToReview = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      const elem = document.getElementById('review-form-anchor');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  const { user } = useAuth();
  const { likedProductIds } = useUserProductLikes(user?.uid, company.id);
  const visitorNameVal = user?.displayName || user?.email?.split('@')[0] || 'Visitor';
  const whatsappText = formatCompanyWhatsApp(company);
  const whatsappUrl = getCleanWhatsAppUrl(company.whatsapp || company.phone, whatsappText);

  const handleProductWhatsApp = (productName: string, productId?: string, product?: any) => {
    const text = product
      ? formatProductWhatsApp(company, product)
      : formatCompanyWhatsApp(company);
    if (company.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'whatsapp_click',
        targetId: productId || null,
        targetName: productName
      });
    }
    window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
  };

  const portfolioUrl = getCompanyPortfolioUrl(company, typeof window !== 'undefined' ? window.location.origin : undefined);

  // Free Plan Gated Tabs: Simple Minimal Layout (About, Jobs, Products/Services, Gallery, Reviews only)
  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'jobs', label: `Jobs (${jobs.length})` },
    { id: 'products', label: `Shop & Services (${(company.products?.length || 0) + (company.services?.length || 0)})` },
    { id: 'gallery', label: `Gallery (${Math.min(company.galleryImages?.length || 0, 6)}/6)` },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <main id="company-profile-content" className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Header />

      <section className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        <div className="h-40 rounded-2xl relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/60 shadow-sm">
          {company.coverImageUrl && company.coverImageUrl.startsWith('http') && (
            <Image src={company.coverImageUrl} alt={company.name} fill className="object-cover opacity-60" unoptimized={company.coverImageUrl.includes('firebasestorage.googleapis.com')} />
          )}
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute top-3 right-3">
            <SubscriptionPlanBadge plan="free" />
          </div>
        </div>

        {/* Basic Brand Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6 mb-4">
          <div className="relative w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.name} fill className="object-cover rounded-xl" />
            ) : (
              <Building2 size={24} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center flex-wrap gap-1">
              {company.name}
              {renderVerificationBadge(company, 16)}
            </h1>
            <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-blue-600 font-semibold bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100/50">{company.category}</span>
              <span className="text-slate-400">·</span>
              <span className="flex items-center gap-1"><MapPin size={10} className="text-slate-400" />{company.district}</span>
              <span className="text-slate-400">·</span>
              <button 
                onClick={scrollToReview}
                className="flex items-center gap-1 hover:text-amber-500 transition-colors bg-amber-50/80 text-amber-800 border border-amber-100/50 px-2 py-0.5 rounded font-bold"
              >
                <Star size={10} className="fill-amber-400 text-amber-400" />
                {company.averageRating || company.rating || '0'} ({reviews.length} Reviews)
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <a href={getCleanCallUrl(company.phone)} onClick={() => trackAnalyticsEvent({ companyId: company.id, eventType: 'call_click' })} className="px-4 py-2 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-blue-700 shadow-sm">
            <Phone size={13} className="text-blue-600" /> Call Now
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackAnalyticsEvent({ companyId: company.id, eventType: 'whatsapp_click' })} className="px-4 py-2 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-emerald-700 shadow-sm">
            <MessageCircle size={13} className="text-emerald-600" /> WhatsApp Chat
          </a>
          <a href={getGoogleMapsUrl(company)} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-slate-700 shadow-sm">
            <MapPin size={13} className="text-slate-500" /> Open in Google Maps
          </a>
          <FollowButton companyId={company.id} />
          <button onClick={() => setShareOpen(true)} className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-slate-700 shadow-sm">
            <Share2 size={13} className="text-slate-500" /> Share
          </button>
          <button onClick={() => downloadVCard({ name: company.name || 'Business', organization: company.name, phone: company.phone, whatsapp: company.whatsapp, email: company.email, website: company.website, address: company.address, district: company.district, category: company.category })} className="px-4 py-2 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 text-emerald-700 shadow-sm">
            <UserPlus size={13} className="text-emerald-600" /> Save Contact
          </button>
          {company.brochureUrl && (
            <a href={company.brochureUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-slate-700 shadow-sm">
              <FileDown size={13} className="text-slate-500" /> Brochure
            </a>
          )}
          <button onClick={() => downloadCompanyPdf(company.name || 'Business')} className="px-4 py-2 rounded-xl text-xs font-bold border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5 text-blue-700 shadow-sm">
            <FileDown size={13} className="text-blue-600" /> Save PDF
          </button>
        </div>

        {/* Trust Score */}
        <div className="mb-4">
          <TrustScoreBadge company={company} variant="badge" />
        </div>

        {/* Company Stats */}
        <div className="mb-6">
          <CompanyStatsBar company={company} jobs={jobs} reviews={reviews} accentColor="text-blue-600" />
        </div>

        {/* Main Layout Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left / Middle: Tabs & Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Row */}
            <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-200">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white border border-blue-500 shadow-sm shadow-blue-500/10'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Switcher */}
            {activeTab === 'about' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">About the Company</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{company.description}</p>
                </div>
                {company.companyServicesTags?.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-slate-900 mb-2">Services</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {company.companyServicesTags.map((svc: string) => (
                        <span key={svc} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Active Jobs</h3>
                {jobs.length > 0 ? (
                  jobs.slice(0, 1).map(job => ( // Gated to 1 active job for Free plan
                    <Link key={job.id} href={`/jobs/${job.id}`}
                      className="block p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-400 transition-colors">
                      <div className="text-xs font-bold text-slate-900">{job.title}</div>
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                        <span>{job.type} · {job.salary}</span>
                        <span>{job.posted}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No active jobs listed.</p>
                )}
                {jobs.length > 1 && (
                  <div className="text-[10px] text-slate-500 text-center mt-2 p-2 bg-slate-55 rounded-lg border border-slate-100">
                    💡 1 of {jobs.length} jobs is shown. Upgrade to Standard/Premium to publish multiple jobs.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-5 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Our Services</h3>
                  {company.services?.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {company.services.slice(0, 3).map((service: any) => (
                        <div key={service.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex justify-between items-center gap-3">
                          <div>
                            <div className="text-xs font-bold text-slate-800">{service.name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{service.price ? `Starts at ₹${service.price}` : 'Price on request'}</div>
                          </div>
                          <button
                            onClick={() => window.open(`https://wa.me/${company.whatsapp || company.phone}?text=Hello, I am interested in your service: ${service.name}.`, '_blank')}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100"
                          >
                            Enquire
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No services listed yet.</p>
                  )}
                  {company.services?.length > 3 && (
                    <p className="text-[9px] text-slate-400 mt-2 italic">Showing 3 of {company.services.length} services. Upgrade to Standard/Premium to show all.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Products Catalogue</h3>
                  {company.products?.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {company.products.slice(0, 3).map((product: any) => (
                        <div key={product.id || product.name} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex gap-3">
                          {product.images?.[0] && (
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                              <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{product.name}</h4>
                                {product.price > 0 && <span className="text-xs font-bold text-blue-600">₹{product.price}</span>}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{product.description || product.detail}</p>
                            </div>
                            <button
                              onClick={() => handleProductWhatsApp(product.name, product.id)}
                              className="mt-2 self-start flex items-center gap-1 text-[9px] font-bold uppercase text-slate-600 hover:text-slate-800"
                            >
                              <MessageCircle size={10} /> WhatsApp
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No products listed yet.</p>
                  )}
                  {company.products?.length > 3 && (
                    <p className="text-[9px] text-slate-400 mt-2 italic">Showing 3 of {company.products.length} products. Upgrade to Standard/Premium to show all.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Media Gallery</h3>
                {company.galleryImages?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {company.galleryImages.slice(0, 6).map((src: string, index: number) => (
                      <div key={src || index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                        <img src={src} alt="gallery" className="object-cover w-full h-full" />
                      </div>
                    ))}
                    {company.galleryImages.length > 6 && (
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-3 text-center border-dashed">
                        <Lock size={14} className="text-slate-400 mb-1" />
                        <span className="text-[8px] text-slate-500 leading-tight">Upgrade to Standard to see {company.galleryImages.length - 6} more</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No gallery media uploaded.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Customer Reviews</h3>
                {reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(n => <Star key={n} size={11} className={n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />)}
                          </div>
                          <span className="text-[10px] text-slate-400">{review.date}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">{review.title || review.name}</p>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{review.content}</p>
                        {review.ownerReply && (
                          <div className="mt-2 ml-3 pl-3 border-l-2 border-slate-200">
                            <p className="text-[10px] text-slate-500 font-bold">Owner Reply:</p>
                            <p className="text-[10px] text-slate-600">{review.ownerReply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No reviews yet. Be the first!</p>
                )}
                <div id="review-form-anchor" className="pt-4 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-3">Write a Review</h4>
                  <ReviewSubmitForm companyId={company.id} companyName={company.name} reviews={reviews} btnStyle="bg-slate-800 hover:bg-slate-900 text-white" theme="light" />
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Contact Card */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Contact Info</h3>
              <div className="space-y-3 text-xs text-slate-700">
                <a href={getCleanCallUrl(company.phone)} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  <Phone size={13} className="text-slate-400" />
                  <span>{company.phone}</span>
                </a>
                <a href={company.email ? `mailto:${company.email}` : undefined} className="flex items-center gap-2 hover:text-blue-600 transition-colors truncate">
                  <Mail size={13} className="text-slate-400" />
                  <span className="truncate">{company.email}</span>
                </a>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-colors truncate">
                    <Globe size={13} className="text-slate-400" />
                    <span className="truncate">{company.website}</span>
                  </a>
                )}
                <a href={getGoogleMapsUrl(company)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 pt-2 border-t border-slate-100 hover:text-blue-600 transition-colors">
                  <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-slate-500">{company.address}</span>
                </a>
              </div>
            </div>

            {/* Digital ID Card Preview */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Digital Business ID Card</span>
              <MiniDigitalIDCard company={company} plan="free" />
            </div>

            {/* Enhanced Enquiry Form */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Send Enquiry</h3>
              <EnhancedEnquiryForm companyId={company.id} companyName={company.name} btnStyle="bg-slate-800 hover:bg-slate-900 text-white" variant="light" />
            </div>

            {/* Verified Badges */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Trust & Verification</h3>
              <VerifiedDocBadges company={company} />
            </div>

            {/* Social Media Links */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Connect With Us</h3>
              <SocialMediaLinks company={company} accentColor="text-blue-600" />
            </div>
          </div>
        </div>
      </section>

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} url={portfolioUrl} title={company.name} description={company.description} />
      <BottomNav />
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────
// 2. STANDARD TEMPLATE (Modern Professional, Blue/Indigo Gradients & Ticks)
// ──────────────────────────────────────────────────────────────────
function TemplateStandard({ company, jobs, reviews }: { company: any; jobs: any[]; reviews: any[] }) {
  const [activeTab, setActiveTab] = useState('about');
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewType, setReviewType] = useState('company');
  const { user } = useAuth();

  const scrollToReview = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      const elem = document.getElementById('review-form-anchor');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const { likedProductIds } = useUserProductLikes(user?.uid, company.id);
  const portfolioUrl = getCompanyPortfolioUrl(company, typeof window !== 'undefined' ? window.location.origin : undefined);

  const handleProductWhatsApp = (productName: string, productId?: string, product?: any) => {
    const text = product
      ? formatProductWhatsApp(company, product)
      : formatCompanyWhatsApp(company);
    if (company.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'whatsapp_click',
        targetId: productId || null,
        targetName: productName
      });
    }
    window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
  };

  const activeTheme = company.customTheme && ['corporate_blue', 'green_business', 'orange_startup', 'purple_modern', 'dark_classic'].includes(company.customTheme)
    ? company.customTheme
    : 'corporate_blue';
  
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
    corporate_blue: {
      bg: 'bg-[#070b19]',
      accent: 'text-blue-400',
      border: 'border-blue-900/30',
      btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white shadow-blue-500/10',
      badge: 'bg-blue-500/10 border-blue-400/30 text-blue-300',
      card: 'bg-[#0b1433]/40 border border-blue-900/20',
      bullet: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
      gradient: 'from-blue-700/80 via-indigo-900 to-[#070b19]',
    },
    green_business: {
      bg: 'bg-[#030d08]',
      accent: 'text-emerald-400',
      border: 'border-emerald-900/30',
      btn: 'bg-gradient-to-r from-emerald-600 to-teal-650 hover:opacity-90 text-white shadow-emerald-500/10',
      badge: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300',
      card: 'bg-[#061c10]/40 border border-emerald-900/20',
      bullet: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
      gradient: 'from-emerald-700/80 via-teal-900 to-[#030d08]',
    },
    orange_startup: {
      bg: 'bg-[#0b0905]',
      accent: 'text-orange-400',
      border: 'border-orange-900/30',
      btn: 'bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-90 text-white shadow-orange-500/10',
      badge: 'bg-orange-500/10 border-orange-400/30 text-orange-355',
      card: 'bg-[#1c150a]/40 border border-orange-900/20',
      bullet: 'bg-orange-500/10 text-orange-300 border border-orange-500/20',
      gradient: 'from-orange-700/80 via-amber-900 to-[#0b0905]',
    },
    purple_modern: {
      bg: 'bg-[#0b0312]',
      accent: 'text-purple-400',
      border: 'border-purple-900/30',
      btn: 'bg-gradient-to-r from-purple-600 to-pink-650 hover:opacity-90 text-white shadow-purple-500/10',
      badge: 'bg-purple-500/10 border-purple-400/30 text-purple-300',
      card: 'bg-[#140620]/40 border border-purple-900/20',
      bullet: 'bg-purple-500/10 text-purple-300 border border-purple-500/20',
      gradient: 'from-purple-700/80 via-violet-900 to-[#0b0312]',
    },
    dark_classic: {
      bg: 'bg-[#09090b]',
      accent: 'text-zinc-300',
      border: 'border-zinc-800',
      btn: 'bg-gradient-to-r from-zinc-700 to-zinc-800 hover:opacity-90 text-white shadow-zinc-550/10',
      badge: 'bg-zinc-800 border border-zinc-700 text-zinc-300',
      card: 'bg-[#18181b]/50 border border-zinc-800',
      bullet: 'bg-zinc-850 text-zinc-300 border border-zinc-850',
      gradient: 'from-zinc-800 via-zinc-900 to-[#09090b]',
    }
  };
  
  const currentTheme = themeMap[activeTheme] || themeMap.corporate_blue;

  const isModern = company.websiteTemplate === 'modern';

  const whatsappText = formatCompanyWhatsApp(company);
  const whatsappUrl = getCleanWhatsAppUrl(company.whatsapp || company.phone, whatsappText);

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'jobs', label: `Jobs (${jobs.length})` },
    { id: 'products', label: 'Products & Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: `Reviews (${reviews.length})` },
  ];

  return (
    <main id="company-profile-content" className={`min-h-screen ${currentTheme.bg} text-white font-outfit`}>
      <Header />

      <section className="pt-16 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
        {/* Cover Block with dynamic gradient styling */}
        <div className={`h-44 sm:h-56 relative overflow-hidden rounded-2xl bg-gradient-to-br ${currentTheme.gradient} border ${currentTheme.border}`}>
          {company.coverImageUrl && company.coverImageUrl.startsWith('http') && (
            <Image src={company.coverImageUrl} alt={company.name} fill className="object-cover opacity-65 mix-blend-overlay" unoptimized={company.coverImageUrl.includes('firebasestorage.googleapis.com')} />
          )}
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-4 right-4">
            <SubscriptionPlanBadge plan="basic" />
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
                {renderVerificationBadge(company, 18)}
              </h1>
            </div>
            <div className="text-xs text-slate-450 mt-1.5 flex items-center flex-wrap gap-2">
              <span className={`font-semibold ${currentTheme.accent}`}>{company.category}</span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1"><MapPin size={11} className={currentTheme.accent} />{company.district}</span>
              <span className="text-slate-600">·</span>
              <button 
                onClick={scrollToReview}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-amber-400/30 hover:text-amber-400 transition-all font-bold text-slate-200"
              >
                <Star size={11} className="fill-amber-400 text-amber-400" />
                {company.averageRating || company.rating || '0'} ({reviews.length} reviews)
              </button>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <a href={getCleanCallUrl(company.phone)} onClick={() => trackAnalyticsEvent({ companyId: company.id, eventType: 'call_click' })} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${currentTheme.btn}`}>
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
          <a href={getGoogleMapsUrl(company)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-colors">
            <MapPin size={13} className={currentTheme.accent} /> Open in Google Maps
          </a>
          <FollowButton companyId={company.id} />
          <button onClick={() => setShareOpen(true)} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <Share2 size={13} /> Share
          </button>
          {company.brochureUrl && (
            <a href={company.brochureUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1.5">
              <FileDown size={13} /> Brochure
            </a>
          )}
        </div>

        {/* Company Stats */}
        <div className="mb-6">
          <CompanyStatsBar company={company} jobs={jobs} reviews={reviews} accentColor={currentTheme.accent} />
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
                {company.companyServicesTags?.length > 0 && (
                  <div className={`${currentTheme.card} rounded-2xl p-5`}>
                    <h2 className="text-sm font-semibold text-white mb-3">Listed Services</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {company.companyServicesTags.map((svc: string) => (
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

                 {/* Services Showcase */}
                 <ServicesShowcaseSection company={company} services={company.services} currentTheme={currentTheme} />

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

                    {company.companyServicesTags?.length > 0 && (
                      <div className={`${currentTheme.card} rounded-2xl p-5`}>
                        <h2 className="text-sm font-semibold text-white mb-3">Listed Services</h2>
                        <div className="flex flex-wrap gap-1.5">
                          {company.companyServicesTags.map((svc: string) => (
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
                  <div className="space-y-6">
                    <ServicesShowcaseSection company={company} services={company.services} currentTheme={currentTheme} />
                    <div className={`${currentTheme.card} rounded-2xl p-5`}>
                      <h3 className="text-sm font-semibold text-white mb-4">Products Showcase Catalogue</h3>
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
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div className={`${currentTheme.card} rounded-2xl p-5`}>
                    <h3 className="text-sm font-semibold text-white mb-4">Gallery Images ({Math.min(company.galleryImages?.length || 0, 12)}/12)</h3>
                    {company.galleryImages?.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {company.galleryImages.slice(0, 12).map((src: string, index: number) => (
                          <div key={src || index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/5">
                            <Image src={src} alt="gallery" fill className="object-cover" />
                          </div>
                        ))}
                        {company.galleryImages.length > 12 && (
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-white/5 flex flex-col items-center justify-center p-3 text-center border-dashed border-slate-750">
                            <Lock size={14} className="text-slate-500 mb-1" />
                            <span className="text-[8px] text-slate-500 leading-tight">Upgrade to Premium to see {company.galleryImages.length - 12} more</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No gallery media uploaded.</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {/* Write Review Form */}
                    <div id="review-form-anchor" className={`${currentTheme.card} rounded-2xl p-5`}>
                      <h3 className="text-xs font-bold text-white mb-3">Submit a Verified Review</h3>
                      <ReviewSubmitForm companyId={company.id} companyName={company.name} reviews={reviews} btnStyle={currentTheme.btn} />
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
                        {review.ownerReply && (
                          <div className="mt-2 ml-3 pl-3 border-l-2 border-white/10">
                            <p className="text-[10px] text-slate-500 font-bold">Owner Reply:</p>
                            <p className="text-[10px] text-slate-400">{review.ownerReply}</p>
                          </div>
                        )}
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
                <a href={getCleanCallUrl(company.phone)} className="flex items-center gap-2 hover:text-white transition-colors">
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
                <a href={getGoogleMapsUrl(company)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 pt-2 border-t border-white/5 hover:text-white transition-colors">
                  <MapPin size={12} className={`${currentTheme.accent} shrink-0 mt-0.5`} />
                  <span>{company.address}</span>
                </a>
              </div>
            </div>

            {/* Digital ID Card Preview */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Digital Business ID Card</span>
              <MiniDigitalIDCard company={company} plan="basic" />
            </div>

            {/* Enhanced Business Enquiry */}
            <div className={`${currentTheme.card} rounded-2xl p-5 space-y-3`}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Business Enquiry</h3>
              <p className="text-[10px] text-slate-500">Quotes are directly routed to provider dashboard CRM.</p>
              <EnhancedEnquiryForm companyId={company.id} companyName={company.name} btnStyle={currentTheme.btn} />
            </div>

            {/* Verified Badges */}
            <div className={`${currentTheme.card} rounded-2xl p-5 space-y-3`}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Trust & Verification</h3>
              <VerifiedDocBadges company={company} />
            </div>

            {/* Social Media Links */}
            <SocialMediaLinks company={company} accentColor={currentTheme.accent} />

            {/* Bio Section */}
            <CompanyBioSection company={company} cardStyle={currentTheme.card} />
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

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} url={portfolioUrl} title={company.name} description={company.description} />
      <BottomNav />
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────
// FLAGSHIP ENTERPRISE LAYOUT
// ──────────────────────────────────────────────────────────────────
type EnterpriseThemeName = 
  | 'luxury_gold' | 'midnight_purple' | 'mint_emerald' | 'sunset_amber' | 'classic_blue'
  | 'glass_ui' | 'neo_corporate' | 'elegant_black' | 'creative_agency' | 'tech_startup'
  | 'medical_clinic' | 'education_academy' | 'retail_shop' | 'industrial_plant' | 'real_estate'
  | 'food_beverage' | 'fashion_studio' | 'wealth_management' | 'high_luxury' | 'titanium_platinum';

function TemplateEnterprise({ company, jobs, reviews }: { company: any; jobs: any[]; reviews: any[] }) {
  const [activeTheme, setActiveTheme] = useState<EnterpriseThemeName>(() => {
    const defaultTheme = company.customTheme as EnterpriseThemeName;
    if ([
      'luxury_gold', 'midnight_purple', 'mint_emerald', 'sunset_amber', 'classic_blue',
      'glass_ui', 'neo_corporate', 'elegant_black', 'creative_agency', 'tech_startup',
      'medical_clinic', 'education_academy', 'retail_shop', 'industrial_plant', 'real_estate',
      'food_beverage', 'fashion_studio', 'wealth_management', 'high_luxury', 'titanium_platinum'
    ].includes(defaultTheme)) {
      return defaultTheme;
    }
    return 'titanium_platinum';
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuth();

  const scrollToReview = () => {
    setActiveTab('testimonials');
    setTimeout(() => {
      const elem = document.getElementById('review-form-anchor');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const { likedProductIds } = useUserProductLikes(user?.uid, company.id);
  const portfolioUrl = getCompanyPortfolioUrl(company, typeof window !== 'undefined' ? window.location.origin : undefined);

  // Theme styling map
  const themeConfigs: Record<EnterpriseThemeName, {
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
      gradient: 'from-violet-500 via-purple-600 to-indigo-650',
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
    titanium_platinum: {
      bg: 'bg-[#0a0a0d]',
      accent: 'text-slate-200',
      border: 'border-slate-400/20 hover:border-slate-400/40',
      bgGlow: 'bg-slate-400/10',
      badge: 'bg-slate-350/20 border-slate-350/30 text-slate-100',
      gradient: 'from-slate-200 via-slate-400 to-slate-600',
      button: 'bg-gradient-to-r from-slate-200 via-slate-400 to-slate-600 text-slate-950 shadow-slate-400/20 hover:shadow-slate-400/30 font-black',
      bgText: 'text-slate-250',
      card: 'bg-[#141418]/60 border border-slate-800/40 shadow-[0_0_15px_rgba(255,255,255,0.02)]',
      textMuted: 'text-slate-300',
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
    glass_ui: {
      bg: 'bg-[#030712]',
      accent: 'text-white',
      border: 'border-white/10 hover:border-white/20',
      bgGlow: 'bg-white/5',
      badge: 'bg-white/15 border-white/20 text-white',
      gradient: 'from-slate-800 via-slate-700 to-slate-900',
      button: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-white/5',
      bgText: 'text-white/80',
      card: 'bg-white/[0.03] backdrop-blur-md border border-white/10',
      textMuted: 'text-white/60',
    },
    neo_corporate: {
      bg: 'bg-[#0b0f19]',
      accent: 'text-indigo-400',
      border: 'border-indigo-500/15 hover:border-indigo-500/30',
      bgGlow: 'bg-indigo-500/5',
      badge: 'bg-indigo-400/10 border-indigo-400/20 text-indigo-300',
      gradient: 'from-indigo-650 via-slate-700 to-cyan-700',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-550/15',
      bgText: 'text-indigo-300/80',
      card: 'bg-[#121929]/75 border border-indigo-950/40',
      textMuted: 'text-slate-400',
    },
    elegant_black: {
      bg: 'bg-[#09090b]',
      accent: 'text-rose-300',
      border: 'border-zinc-800 hover:border-zinc-700',
      bgGlow: 'bg-rose-500/5',
      badge: 'bg-rose-950/30 border-rose-800/40 text-rose-300',
      gradient: 'from-zinc-900 via-black to-zinc-800',
      button: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 shadow-lg',
      bgText: 'text-rose-300/80',
      card: 'bg-[#18181b]/70 border border-zinc-850',
      textMuted: 'text-zinc-400',
    },
    creative_agency: {
      bg: 'bg-[#080205]',
      accent: 'text-pink-400',
      border: 'border-pink-500/15 hover:border-pink-500/30',
      bgGlow: 'bg-pink-550/5',
      badge: 'bg-pink-400/10 border-pink-400/20 text-pink-300',
      gradient: 'from-pink-500 via-purple-700 to-orange-500',
      button: 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-pink-500/20',
      bgText: 'text-pink-450/80',
      card: 'bg-[#14060d]/70 border border-pink-950/40',
      textMuted: 'text-pink-100/60',
    },
    tech_startup: {
      bg: 'bg-[#01080e]',
      accent: 'text-cyan-400',
      border: 'border-cyan-500/15 hover:border-cyan-500/30',
      bgGlow: 'bg-cyan-500/5',
      badge: 'bg-cyan-450/10 border-cyan-400/20 text-cyan-300',
      gradient: 'from-cyan-500 via-blue-750 to-indigo-800',
      button: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20',
      bgText: 'text-cyan-300/80',
      card: 'bg-[#031524]/75 border border-cyan-950/40',
      textMuted: 'text-cyan-100/60',
    },
    medical_clinic: {
      bg: 'bg-[#030c0c]',
      accent: 'text-teal-400',
      border: 'border-teal-500/15 hover:border-teal-500/30',
      bgGlow: 'bg-teal-500/5',
      badge: 'bg-teal-400/10 border-teal-400/20 text-teal-300',
      gradient: 'from-teal-500 via-emerald-600 to-cyan-600',
      button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-550/15',
      bgText: 'text-teal-300/80',
      card: 'bg-[#071919]/70 border border-teal-950/40',
      textMuted: 'text-teal-100/60',
    },
    education_academy: {
      bg: 'bg-[#050814]',
      accent: 'text-sky-400',
      border: 'border-sky-500/15 hover:border-sky-500/30',
      bgGlow: 'bg-sky-500/5',
      badge: 'bg-sky-400/10 border-sky-400/20 text-sky-300',
      gradient: 'from-sky-500 via-blue-700 to-indigo-900',
      button: 'bg-blue-650 hover:bg-blue-700 text-white shadow-blue-500/15',
      bgText: 'text-sky-300/80',
      card: 'bg-[#0c142e]/70 border border-sky-950/40',
      textMuted: 'text-sky-100/60',
    },
    retail_shop: {
      bg: 'bg-[#0a0403]',
      accent: 'text-red-400',
      border: 'border-red-500/15 hover:border-red-500/30',
      bgGlow: 'bg-red-500/5',
      badge: 'bg-red-400/10 border-red-400/20 text-red-300',
      gradient: 'from-red-500 via-orange-655 to-amber-600',
      button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-550/15',
      bgText: 'text-red-350/80',
      card: 'bg-[#190b08]/70 border border-red-950/40',
      textMuted: 'text-red-100/60',
    },
    industrial_plant: {
      bg: 'bg-[#0c0c0e]',
      accent: 'text-amber-500',
      border: 'border-slate-800 hover:border-slate-700',
      bgGlow: 'bg-amber-550/5',
      badge: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      gradient: 'from-slate-700 via-zinc-800 to-slate-900',
      button: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold',
      bgText: 'text-amber-450/80',
      card: 'bg-[#18181c]/70 border border-zinc-800',
      textMuted: 'text-slate-400',
    },
    real_estate: {
      bg: 'bg-[#0a0a0f]',
      accent: 'text-yellow-500',
      border: 'border-yellow-500/15 hover:border-yellow-500/30',
      bgGlow: 'bg-yellow-500/5',
      badge: 'bg-yellow-500/10 border-yellow-550/20 text-yellow-355',
      gradient: 'from-slate-800 via-[#1d1d29] to-yellow-600',
      button: 'bg-yellow-550 hover:bg-yellow-600 text-slate-950 font-bold',
      bgText: 'text-yellow-450/80',
      card: 'bg-[#13131f]/75 border border-yellow-950/30',
      textMuted: 'text-slate-400',
    },
    food_beverage: {
      bg: 'bg-[#0f0302]',
      accent: 'text-orange-500',
      border: 'border-orange-500/15 hover:border-orange-500/30',
      bgGlow: 'bg-orange-555/5',
      badge: 'bg-orange-500/10 border-orange-550/20 text-orange-355',
      gradient: 'from-red-600 via-orange-600 to-yellow-550',
      button: 'bg-orange-600 hover:bg-orange-700 text-white font-bold',
      bgText: 'text-orange-450/80',
      card: 'bg-[#210906]/75 border border-orange-950/30',
      textMuted: 'text-orange-100/60',
    },
    fashion_studio: {
      bg: 'bg-[#0f020a]',
      accent: 'text-pink-400',
      border: 'border-pink-500/15 hover:border-pink-500/30',
      bgGlow: 'bg-pink-550/5',
      badge: 'bg-pink-400/10 border-pink-400/20 text-pink-300',
      gradient: 'from-pink-500 via-rose-600 to-purple-800',
      button: 'bg-gradient-to-r from-pink-500 to-purple-650 text-white font-bold',
      bgText: 'text-pink-455/80',
      card: 'bg-[#210617]/75 border border-pink-950/30',
      textMuted: 'text-pink-100/60',
    },
    wealth_management: {
      bg: 'bg-[#020806]',
      accent: 'text-emerald-400',
      border: 'border-emerald-500/15 hover:border-emerald-500/30',
      bgGlow: 'bg-emerald-555/5',
      badge: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300',
      gradient: 'from-[#0a2f1d] via-[#103a24] to-[#041a0f]',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
      bgText: 'text-emerald-450/80',
      card: 'bg-[#04170f]/75 border border-emerald-950/30',
      textMuted: 'text-emerald-100/60',
    },
    high_luxury: {
      bg: 'bg-[#050505]',
      accent: 'text-slate-100',
      border: 'border-zinc-800 hover:border-zinc-700',
      bgGlow: 'bg-white/5',
      badge: 'bg-zinc-800 border border-zinc-700 text-slate-100',
      gradient: 'from-black via-zinc-900 to-zinc-950',
      button: 'bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest',
      bgText: 'text-slate-200/80',
      card: 'bg-zinc-950/70 border border-zinc-900 shadow-xl',
      textMuted: 'text-zinc-500',
    },
  };

  const currentTheme = themeConfigs[activeTheme] || themeConfigs.titanium_platinum;

  const handleProductWhatsApp = (productName: string, productId?: string, product?: any) => {
    const text = product
      ? formatProductWhatsApp(company, product)
      : formatCompanyWhatsApp(company);
    if (company.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'whatsapp_click',
        targetId: productId || null,
        targetName: productName
      });
    }
    window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
  };

  // Mock Blog/News Data (or read from company if exists)
  const blogs = company.blogs || [
    {
      id: 'blog-1',
      title: 'Expanding Our Operations in Theni District',
      excerpt: 'We are thrilled to announce new branches and services matching local demand...',
      date: 'June 18, 2026',
      readTime: '3 min read'
    },
    {
      id: 'blog-2',
      title: 'Our Commitment to Quality & Customer Trust',
      excerpt: 'Discover the processes behind our verified badge and customer service levels...',
      date: 'May 24, 2026',
      readTime: '5 min read'
    }
  ];

  // Testimonials Data
  const testimonials = reviews.length > 0 ? reviews : [
    {
      id: 't-1',
      name: 'Ramesh Kumar',
      title: 'Managing Director, RK Exports',
      content: 'Excellent service! Extremely professional team. Highly recommend their services.',
      rating: 5,
      date: 'June 10, 2026'
    },
    {
      id: 't-2',
      name: 'Deepa Rajan',
      title: 'Founder, Eco Organic Farms',
      content: 'Very reliable and prompt responses. Doing business with them has been a delight.',
      rating: 5,
      date: 'May 15, 2026'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Company Overview' },
    { id: 'jobs', label: `Careers (${jobs.length})` },
    { id: 'portfolio', label: 'Portfolio & News' },
    { id: 'testimonials', label: 'Testimonials' },
  ];

  const whatsappText = formatCompanyWhatsApp(company);
  const whatsappUrl = getCleanWhatsAppUrl(company.whatsapp || company.phone, whatsappText);

  return (
    <main id="company-profile-content" className={`min-h-screen ${currentTheme.bg} text-white overflow-x-hidden relative font-outfit pb-16`}>
      <Header />

      {/* Dynamic Background Glowing Circles */}
      <div className={`absolute top-20 right-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] transition-colors duration-1000 ${currentTheme.bgGlow} pointer-events-none`} />
      <div className={`absolute bottom-20 left-[-10%] w-[500px] h-[500px] rounded-full blur-[140px] transition-colors duration-1000 ${currentTheme.bgGlow} pointer-events-none`} />

      <section className="pt-24 pb-16 max-w-5xl mx-auto px-4 relative z-10">
        {/* Dynamic Cover Block */}
        <div className={`h-56 sm:h-72 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${currentTheme.gradient} shadow-[0_20px_50px_rgba(0,0,0,0.5)] border ${currentTheme.border}`}>
          {company.coverImageUrl && company.coverImageUrl.startsWith('http') && (
            <Image src={company.coverImageUrl} alt={company.name} fill className="object-cover opacity-45 mix-blend-overlay" unoptimized={company.coverImageUrl.includes('firebasestorage.googleapis.com')} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          {/* Top Badge Panel */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            <SubscriptionPlanBadge plan="enterprise" />
          </div>

          {/* Theme Selector Toggle (Memory-based) */}
          <div className="absolute bottom-6 right-6 bg-black/75 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col gap-1.5 max-w-[200px] sm:max-w-[280px] no-print z-30">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block border-b border-white/5 pb-1">Live Theme Designer</span>
            <div className="flex flex-wrap gap-1">
              {([
                'luxury_gold', 'midnight_purple', 'mint_emerald', 'sunset_amber', 'classic_blue',
                'glass_ui', 'neo_corporate', 'elegant_black', 'creative_agency', 'tech_startup',
                'medical_clinic', 'education_academy', 'retail_shop', 'industrial_plant', 'real_estate',
                'food_beverage', 'fashion_studio', 'wealth_management', 'high_luxury', 'titanium_platinum'
              ] as EnterpriseThemeName[]).map(t => {
                let colorClass = 'bg-blue-500 border-blue-450';
                if (t === 'luxury_gold') colorClass = 'bg-amber-400 border-amber-300';
                else if (t === 'midnight_purple') colorClass = 'bg-purple-500 border-purple-400';
                else if (t === 'mint_emerald') colorClass = 'bg-emerald-500 border-emerald-400';
                else if (t === 'sunset_amber') colorClass = 'bg-orange-500 border-orange-400';
                else if (t === 'classic_blue') colorClass = 'bg-blue-500 border-blue-400';
                else if (t === 'glass_ui') colorClass = 'bg-slate-300 border-white';
                else if (t === 'neo_corporate') colorClass = 'bg-indigo-600 border-indigo-400';
                else if (t === 'elegant_black') colorClass = 'bg-zinc-950 border-rose-450';
                else if (t === 'creative_agency') colorClass = 'bg-pink-500 border-pink-400';
                else if (t === 'tech_startup') colorClass = 'bg-cyan-400 border-cyan-300';
                else if (t === 'medical_clinic') colorClass = 'bg-teal-500 border-teal-400';
                else if (t === 'education_academy') colorClass = 'bg-sky-500 border-sky-400';
                else if (t === 'retail_shop') colorClass = 'bg-red-650 border-red-400';
                else if (t === 'industrial_plant') colorClass = 'bg-slate-500 border-slate-400';
                else if (t === 'real_estate') colorClass = 'bg-yellow-600 border-yellow-450';
                else if (t === 'food_beverage') colorClass = 'bg-orange-600 border-orange-500';
                else if (t === 'fashion_studio') colorClass = 'bg-pink-650 border-pink-450';
                else if (t === 'wealth_management') colorClass = 'bg-emerald-600 border-emerald-450';
                else if (t === 'high_luxury') colorClass = 'bg-zinc-200 border-zinc-400';
                else if (t === 'titanium_platinum') colorClass = 'bg-slate-300 border-slate-100';

                return (
                  <button
                    key={t}
                    onClick={() => setActiveTheme(t)}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 cursor-pointer ${colorClass} ${activeTheme === t ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'}`}
                    title={t.replace('_', ' ')}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Brand Details Block */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 mb-10 relative z-20 px-8">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-[#05050a] border-2 border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex items-center justify-center shrink-0 overflow-hidden group">
            {company.logoUrl ? (
              <Image src={company.logoUrl} alt={company.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <Building2 size={44} className={currentTheme.accent} />
            )}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center flex-wrap gap-2.5 tracking-tight">
              {company.name}
              {renderVerificationBadge(company, 28)}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-slate-400">
              <span className={`font-black uppercase tracking-widest text-xs px-2.5 py-1 rounded bg-white/[0.03] border border-white/5 ${currentTheme.accent}`}>{company.category}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} className={currentTheme.accent} />{company.district}, {company.state}</span>
              <button 
                onClick={scrollToReview}
                className="flex items-center gap-1 font-bold text-white bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/20 hover:border-amber-400/40 hover:text-amber-400 transition-all text-xs"
              >
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {company.averageRating || company.rating || '0'} <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Contact Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <a href={getCleanCallUrl(company.phone)} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider text-center transition-all hover:scale-[1.03] ${currentTheme.button}`}>
            <Phone size={14} /> Call Provider
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider text-white text-center transition-all hover:scale-[1.03]" style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
            <MessageCircle size={14} /> WhatsApp Chat
          </a>
          <a href={`mailto:${company.email}`} className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-center transition-all hover:scale-[1.03]">
            <Mail size={14} /> Email Us
          </a>
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-center transition-all hover:scale-[1.03]">
              <Globe size={14} /> Visit Website
            </a>
          )}
          <a href={getGoogleMapsUrl(company)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-center transition-all hover:scale-[1.03]">
            <MapPin size={14} className={currentTheme.accent} /> Maps Location
          </a>
        </div>

        {/* Follow, Share & Brochure Actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <FollowButton companyId={company.id} accentStyle={currentTheme.button} />
          <button onClick={() => setShareOpen(true)} className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <Share2 size={13} /> Share
          </button>
          {company.brochureUrl && (
            <a href={company.brochureUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1.5">
              <FileDown size={13} /> Download Brochure
            </a>
          )}
        </div>

        {/* Company Stats */}
        <div className="mb-8">
          <CompanyStatsBar company={company} jobs={jobs} reviews={reviews} accentColor={currentTheme.accent} />
        </div>

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Core Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Tabs Row */}
            <div className="flex gap-1 overflow-x-auto pb-1 border-b border-white/[0.06] no-print">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 rounded-2xl text-xs font-extrabold tracking-wider uppercase transition-all duration-300 ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${currentTheme.gradient} text-white shadow-xl scale-[1.02]`
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Blocks */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Promo Code Coupon block */}
                <div className={`rounded-[2rem] border ${currentTheme.border} ${currentTheme.bgGlow} p-6 relative overflow-hidden group`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black text-white uppercase tracking-widest inline-flex items-center gap-1">
                        <Sparkles size={10} className="text-amber-400" /> FLAGSHIP SERVICE COMPLIMENT
                      </span>
                      <h3 className="text-sm font-black text-white mt-2">15% Exclusive Discount Code</h3>
                      <p className="text-xs text-slate-350 mt-1">Get priority premium service quotes and discount rates immediately.</p>
                    </div>
                    <span className="bg-slate-900 border border-white/15 px-4 py-2 rounded-xl text-xs font-mono font-black text-slate-100 tracking-wider">
                      TNI-ENT-DISC
                    </span>
                  </div>
                </div>

                {/* About Detail */}
                <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-4`}>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Building2 size={18} className={currentTheme.accent} /> Company Portfolio Profile
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line text-justify">{company.description}</p>
                </div>

                {/* CEO / Founder Biography & Profile */}
                {(company.ceoName || company.ceoPhotoUrl || company.ceoMessage || company.aboutFounder) && (
                  <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-6 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Crown size={18} className={currentTheme.accent} /> Leadership & Founder Message
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      {company.ceoPhotoUrl && (
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white/10 shrink-0 self-center sm:self-start bg-slate-900 shadow-lg">
                          <img src={company.ceoPhotoUrl} alt={company.ceoName || 'CEO'} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="space-y-3 flex-1">
                        {company.ceoName && (
                          <div>
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-black block">CEO / Founder</span>
                            <h4 className="text-sm font-extrabold text-white mt-0.5">{company.ceoName}</h4>
                          </div>
                        )}
                        {company.ceoMessage && (
                          <blockquote className="text-xs text-slate-300 italic border-l-2 border-amber-500/40 pl-4 py-1 leading-relaxed">
                            &ldquo;{company.ceoMessage}&rdquo;
                          </blockquote>
                        )}
                      </div>
                    </div>
                    {company.aboutFounder && (
                      <div className="pt-4 border-t border-white/[0.04] space-y-2">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">About the Founder</span>
                        <p className="text-xs text-slate-300 leading-relaxed text-justify">{company.aboutFounder}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Company Story, Vision, Mission & Core Values */}
                {(company.companyStory || company.vision || company.mission || company.coreValues) && (
                  <div className="space-y-6">
                    {company.companyStory && (
                      <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-4`}>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          <Sparkles size={18} className={currentTheme.accent} /> Our Legacy & Story
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed text-justify whitespace-pre-line">{company.companyStory}</p>
                      </div>
                    )}

                    {(company.vision || company.mission) && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {company.vision && (
                          <div className={`${currentTheme.card} rounded-[2rem] p-6 space-y-3`}>
                            <div className="flex items-center gap-2 text-white">
                              <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/5 ${currentTheme.accent}`}>
                                <Globe size={16} />
                              </div>
                              <h4 className="text-xs font-black uppercase tracking-wider">Our Vision</h4>
                            </div>
                            <p className="text-xs text-slate-350 leading-relaxed">{company.vision}</p>
                          </div>
                        )}
                        {company.mission && (
                          <div className={`${currentTheme.card} rounded-[2rem] p-6 space-y-3`}>
                            <div className="flex items-center gap-2 text-white">
                              <div className={`p-2 rounded-xl bg-white/[0.03] border border-white/5 ${currentTheme.accent}`}>
                                <Star size={16} />
                              </div>
                              <h4 className="text-xs font-black uppercase tracking-wider">Our Mission</h4>
                            </div>
                            <p className="text-xs text-slate-350 leading-relaxed">{company.mission}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {company.coreValues && (
                      <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-4`}>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Core Corporate Values</span>
                        <div className="flex flex-wrap gap-2">
                          {company.coreValues.split(',').map((val: string) => (
                            <span key={val} className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-slate-200 transition-colors hover:bg-white/[0.06] hover:${currentTheme.accent}`}>
                              {val.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Milestones */}
                {company.timeline && company.timeline.length > 0 && (
                  <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-6`}>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <TrendingUp size={18} className={currentTheme.accent} /> Historic Milestones
                    </h3>
                    <div className="relative border-l border-white/[0.08] ml-4 pl-6 space-y-6">
                      {company.timeline.map((event: any, idx: number) => (
                        <div key={event.id || idx} className="relative group">
                          {/* Timeline Dot */}
                          <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-slate-950 transition-all group-hover:scale-125 ${
                            idx === 0 
                              ? 'bg-amber-400 ring-4 ring-amber-400/20' 
                              : 'bg-slate-700'
                          }`} />
                          
                          <div className="space-y-1">
                            <span className={`text-xs font-black font-mono tracking-wider ${currentTheme.accent}`}>{event.year}</span>
                            <h4 className="text-xs font-extrabold text-white">{event.title}</h4>
                            {event.description && (
                              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements & CSR Activities */}
                {(company.achievements || company.csrActivities) && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {company.achievements && (
                      <div className={`${currentTheme.card} rounded-[2rem] p-6 space-y-3`}>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                          <Award size={15} className={currentTheme.accent} /> Awards & Accreditations
                        </h4>
                        <p className="text-xs text-slate-350 leading-relaxed">{company.achievements}</p>
                      </div>
                    )}
                    {company.csrActivities && (
                      <div className={`${currentTheme.card} rounded-[2rem] p-6 space-y-3`}>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                          <Heart size={15} className={currentTheme.accent} /> Corporate Social Responsibility
                        </h4>
                        <p className="text-xs text-slate-350 leading-relaxed">{company.csrActivities}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Partners & Clients Logotypes */}
                {((company.clients && company.clients.length > 0) || (company.partners && company.partners.length > 0)) && (
                  <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-6`}>
                    {company.clients && company.clients.length > 0 && (
                      <div className="space-y-4">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Trusted by Prestigious Clients</span>
                        <div className="flex gap-4 items-center flex-wrap">
                          {company.clients.map((url: string, idx: number) => (
                            <div key={idx} className="h-10 w-24 relative bg-white/5 rounded-xl border border-white/5 p-2 overflow-hidden flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-white/20 transition-all duration-300">
                              <img src={url} alt="client logo" className="max-h-full max-w-full object-contain" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {company.partners && company.partners.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block">Corporate Alliance Partners</span>
                        <div className="flex gap-4 items-center flex-wrap">
                          {company.partners.map((url: string, idx: number) => (
                            <div key={idx} className="h-10 w-24 relative bg-white/5 rounded-xl border border-white/5 p-2 overflow-hidden flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:border-white/20 transition-all duration-300">
                              <img src={url} alt="partner logo" className="max-h-full max-w-full object-contain" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Services/Specials List */}
                {company.companyServicesTags?.length > 0 && (
                  <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-4`}>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Award size={18} className={currentTheme.accent} /> Listed Services & Core Specialties
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {company.companyServicesTags.map((svc: string) => (
                        <div key={svc} className={`flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-all hover:-translate-y-0.5 hover:bg-white/[0.04]`}>
                          <BadgeCheck size={14} className={currentTheme.accent} />
                          <span className="text-xs font-bold text-slate-200 truncate">{svc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services showcase */}
                <ServicesShowcaseSection company={company} services={company.services} currentTheme={currentTheme} />

                {/* Products showcase */}
                {company.products?.length > 0 && (
                  <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-6`}>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <ShoppingBag size={18} className={currentTheme.accent} /> Products Showcase Catalog
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {company.products.map((product: any) => (
                        <div key={product.id || product.name} className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-slate-500/20 transition-all flex flex-col gap-4">
                          {product.images?.[0] && (
                            <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-900 border border-white/10">
                              <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-white truncate">{product.name}</h4>
                                {product.price > 0 && <span className={`text-[10px] font-black ${currentTheme.accent}`}>₹{product.price}</span>}
                              </div>
                              {product.category && <span className="text-[8px] text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded uppercase mt-1 inline-block">{product.category}</span>}
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{product.description || product.detail}</p>
                            </div>
                            <button
                              onClick={() => handleProductWhatsApp(product.name, product.id)}
                              className="mt-3 w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-white"
                              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                            >
                              <MessageCircle size={12} /> Contact on WhatsApp
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-4`}>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Briefcase size={18} className={currentTheme.accent} /> Careers & Live Job Vacancies
                  </h3>
                  <p className="text-xs text-slate-400">Apply to open vacancies directly. Enterprise postings receive immediate review priority.</p>
                  
                  {jobs.length > 0 ? (
                    <div className="space-y-3.5 pt-2">
                      {jobs.map(job => (
                        <Link key={job.id} href={`/jobs/${job.id}`}
                          className={`flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group`}>
                          <div>
                            <div className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">{job.title}</div>
                            <div className="text-[10px] text-slate-500 mt-2 flex gap-3">
                              <span className="bg-white/[0.04] px-2 py-0.5 rounded text-slate-400 font-bold">{job.type}</span>
                              <span className="flex items-center">{job.salary}</span>
                              <span className="flex items-center font-bold text-slate-400">Openings: {job.openings}</span>
                            </div>
                          </div>
                          <span className={`px-4 py-2 rounded-xl font-black text-xs uppercase ${currentTheme.button}`}>Apply Now</span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-8 text-center bg-white/[0.01] rounded-2xl border border-white/5">No active jobs posted currently. Check back soon!</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                
                {/* Video Embedding Area */}
                {company.videoUrl && (
                  <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-4`}>
                    <h3 className="text-base font-black text-white font-outfit">Featured Video Presentation</h3>
                    <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black relative">
                      {company.videoUrl.includes('youtube.com') || company.videoUrl.includes('youtu.be') ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${company.videoUrl.split('v=')[1] || company.videoUrl.split('/').pop()}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      ) : (
                        <video src={company.videoUrl} controls className="w-full h-full" />
                      )}
                    </div>
                  </div>
                )}

                {/* Gallery showcase */}
                {company.galleryImages?.length > 0 && (
                  <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-4`}>
                    <h3 className="text-base font-black text-white">Media Portfolio Gallery</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {company.galleryImages.map((src: string, index: number) => (
                        <div key={src || index} className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/5 group">
                          <Image src={src} alt="portfolio gallery" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* News & Blogs Section */}
                <div className={`${currentTheme.card} rounded-[2rem] p-7 space-y-4`}>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Newspaper size={18} className={currentTheme.accent} /> Latest Announcements & Company Blog
                  </h3>
                  <div className="space-y-4 pt-2">
                    {blogs.map((blog: any) => (
                      <div key={blog.id} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/15 transition-all">
                        <div className="flex justify-between items-center text-[10px] text-slate-550 mb-1.5 font-bold">
                          <span>{blog.date}</span>
                          <span>{blog.readTime}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white hover:text-amber-300 transition-colors cursor-pointer">{blog.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{blog.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'testimonials' && (
              <div className="space-y-4">
                <div id="review-form-anchor" className={`${currentTheme.card} rounded-[2rem] p-7 space-y-6`}>
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Quote size={18} className={currentTheme.accent} /> Testimonials & Client Endorsements
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Verified reviews submitted by clients and partners.</p>
                  </div>

                  {/* Reviews Form Container */}
                  <div className="bg-white/[0.01] rounded-2xl border border-white/[0.04] p-5 mb-6">
                    <ReviewSubmitForm 
                      companyId={company.id} 
                      companyName={company.name} 
                      reviews={reviews} 
                      btnStyle={currentTheme.button || 'bg-white/10 text-white'} 
                      theme="dark" 
                    />
                  </div>

                  <div className="space-y-4">
                    {testimonials.map((test: any) => (
                      <div key={test.id} className="bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5 space-y-3 relative">
                        <Quote size={24} className={`absolute top-4 right-4 opacity-5 ${currentTheme.accent}`} />
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-extrabold text-white block">{test.name}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{test.title || 'Verified Partner'}</span>
                          </div>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={11} className={i <= test.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-350 leading-relaxed italic">&quot;{test.content}&quot;</p>
                        <div className="flex items-center justify-between text-[9px] font-bold">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                            ✓ Verified Feedback
                          </span>
                          <span className="text-slate-500">{test.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Mini Digital Card, Enquiry Form, Verification metrics */}
          <div className="space-y-6">
            
            {/* Embedded Digital ID Card Preview */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Digital Business Identity</h3>
              <MiniDigitalIDCard company={company} plan="enterprise" />
            </div>

            {/* Enterprise Lead Generation / Contact CRM form */}
            <div className={`${currentTheme.card} rounded-[2rem] p-6 space-y-4`}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Direct Enquiry Portal</h3>
                <p className="text-[10px] text-slate-500 mt-1">Quotes write directly to Provider CRM database.</p>
              </div>
              <EnhancedEnquiryForm companyId={company.id} companyName={company.name} btnStyle={currentTheme.button} />
            </div>

            {/* Social Media Links */}
            <div className={`${currentTheme.card} rounded-[2rem] p-6 space-y-3`}>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Connect With Us</h3>
              <SocialMediaLinks company={company} accentColor={currentTheme.accent} />
            </div>

            {/* Company Bio */}
            <CompanyBioSection company={company} cardStyle={`${currentTheme.card} rounded-[2rem]`} />

            {/* Document Verifications Checklist */}
            <div className={`${currentTheme.card} rounded-[2rem] p-6 space-y-4`}>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                <ShieldCheck size={15} className="text-emerald-400" /> Trust Score Check
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
              <div className="text-[10px] text-slate-500 text-center mt-2 italic">
                Trust Index Score: {company.trustScore || '95'}%
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Flagship enterprise VIP footer */}
      {!company.hideBranding && (
        <div className="py-12 text-center border-t border-white/5 bg-black/40 mt-16">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <Crown size={14} className={currentTheme.accent} />
            Powered by <Link href="/" className={`font-black tracking-widest hover:opacity-85 ${currentTheme.accent}`}>THENIJOBS</Link> · Enterprise Gold Partner VIP
          </p>
        </div>
      )}

      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} url={portfolioUrl} title={company.name} description={company.description} />
      <BottomNav />
      <FloatingWhatsApp number={company.whatsapp} />
    </main>
  );
}

type PremiumThemeName = 
  | 'luxury_gold' | 'midnight_purple' | 'mint_emerald' | 'sunset_amber' | 'classic_blue'
  | 'glass_ui' | 'neo_corporate' | 'elegant_black' | 'creative_agency' | 'tech_startup'
  | 'medical_clinic' | 'education_academy' | 'retail_shop' | 'industrial_plant' | 'real_estate'
  | 'food_beverage' | 'fashion_studio' | 'wealth_management' | 'high_luxury';

function TemplatePremium({ company, jobs, reviews }: { company: any; jobs: any[]; reviews: any[] }) {
  const [activeTab, setActiveTab] = useState('about');
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [reviewType, setReviewType] = useState('company');
  const { user } = useAuth();

  const scrollToReview = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      const elem = document.getElementById('review-form-anchor');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const { likedProductIds } = useUserProductLikes(user?.uid, company.id);
  const portfolioUrl = getCompanyPortfolioUrl(company, typeof window !== 'undefined' ? window.location.origin : undefined);

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
    if ([
      'luxury_gold', 'midnight_purple', 'mint_emerald', 'sunset_amber', 'classic_blue',
      'glass_ui', 'neo_corporate', 'elegant_black', 'creative_agency', 'tech_startup',
      'medical_clinic', 'education_academy', 'retail_shop', 'industrial_plant', 'real_estate',
      'food_beverage', 'fashion_studio', 'wealth_management', 'high_luxury'
    ].includes(defaultTheme)) {
      return defaultTheme;
    }
    return 'classic_blue';
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
    glass_ui: {
      bg: 'bg-[#030712]',
      accent: 'text-white',
      border: 'border-white/10 hover:border-white/20',
      bgGlow: 'bg-white/5',
      badge: 'bg-white/15 border-white/20 text-white',
      gradient: 'from-slate-800 via-slate-700 to-slate-900',
      button: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md shadow-white/5',
      bgText: 'text-white/80',
      card: 'bg-white/[0.03] backdrop-blur-md border border-white/10',
      textMuted: 'text-white/60',
    },
    neo_corporate: {
      bg: 'bg-[#0b0f19]',
      accent: 'text-indigo-400',
      border: 'border-indigo-500/15 hover:border-indigo-500/30',
      bgGlow: 'bg-indigo-500/5',
      badge: 'bg-indigo-400/10 border-indigo-400/20 text-indigo-300',
      gradient: 'from-indigo-650 via-slate-700 to-cyan-700',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-550/15',
      bgText: 'text-indigo-300/80',
      card: 'bg-[#121929]/75 border border-indigo-950/40',
      textMuted: 'text-slate-400',
    },
    elegant_black: {
      bg: 'bg-[#09090b]',
      accent: 'text-rose-300',
      border: 'border-zinc-800 hover:border-zinc-700',
      bgGlow: 'bg-rose-500/5',
      badge: 'bg-rose-950/30 border-rose-800/40 text-rose-300',
      gradient: 'from-zinc-900 via-black to-zinc-800',
      button: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 shadow-lg',
      bgText: 'text-rose-300/80',
      card: 'bg-[#18181b]/70 border border-zinc-850',
      textMuted: 'text-zinc-400',
    },
    creative_agency: {
      bg: 'bg-[#080205]',
      accent: 'text-pink-400',
      border: 'border-pink-500/15 hover:border-pink-500/30',
      bgGlow: 'bg-pink-550/5',
      badge: 'bg-pink-400/10 border-pink-400/20 text-pink-300',
      gradient: 'from-pink-500 via-purple-700 to-orange-500',
      button: 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-pink-500/20',
      bgText: 'text-pink-450/80',
      card: 'bg-[#14060d]/70 border border-pink-950/40',
      textMuted: 'text-pink-100/60',
    },
    tech_startup: {
      bg: 'bg-[#01080e]',
      accent: 'text-cyan-400',
      border: 'border-cyan-500/15 hover:border-cyan-500/30',
      bgGlow: 'bg-cyan-500/5',
      badge: 'bg-cyan-450/10 border-cyan-400/20 text-cyan-300',
      gradient: 'from-cyan-500 via-blue-750 to-indigo-800',
      button: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20',
      bgText: 'text-cyan-300/80',
      card: 'bg-[#031524]/75 border border-cyan-950/40',
      textMuted: 'text-cyan-100/60',
    },
    medical_clinic: {
      bg: 'bg-[#030c0c]',
      accent: 'text-teal-400',
      border: 'border-teal-500/15 hover:border-teal-500/30',
      bgGlow: 'bg-teal-500/5',
      badge: 'bg-teal-400/10 border-teal-400/20 text-teal-300',
      gradient: 'from-teal-500 via-emerald-600 to-cyan-600',
      button: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-550/15',
      bgText: 'text-teal-300/80',
      card: 'bg-[#071919]/70 border border-teal-950/40',
      textMuted: 'text-teal-100/60',
    },
    education_academy: {
      bg: 'bg-[#050814]',
      accent: 'text-sky-400',
      border: 'border-sky-500/15 hover:border-sky-500/30',
      bgGlow: 'bg-sky-500/5',
      badge: 'bg-sky-400/10 border-sky-400/20 text-sky-300',
      gradient: 'from-sky-500 via-blue-700 to-indigo-900',
      button: 'bg-blue-650 hover:bg-blue-700 text-white shadow-blue-500/15',
      bgText: 'text-sky-300/80',
      card: 'bg-[#0c142e]/70 border border-sky-950/40',
      textMuted: 'text-sky-100/60',
    },
    retail_shop: {
      bg: 'bg-[#0a0403]',
      accent: 'text-red-400',
      border: 'border-red-500/15 hover:border-red-500/30',
      bgGlow: 'bg-red-500/5',
      badge: 'bg-red-400/10 border-red-400/20 text-red-300',
      gradient: 'from-red-500 via-orange-655 to-amber-600',
      button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-550/15',
      bgText: 'text-red-350/80',
      card: 'bg-[#190b08]/70 border border-red-950/40',
      textMuted: 'text-red-100/60',
    },
    industrial_plant: {
      bg: 'bg-[#0c0c0e]',
      accent: 'text-amber-500',
      border: 'border-slate-800 hover:border-slate-700',
      bgGlow: 'bg-amber-550/5',
      badge: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      gradient: 'from-slate-700 via-zinc-800 to-slate-900',
      button: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold',
      bgText: 'text-amber-450/80',
      card: 'bg-[#18181c]/70 border border-zinc-800',
      textMuted: 'text-slate-400',
    },
    real_estate: {
      bg: 'bg-[#0a0a0f]',
      accent: 'text-yellow-500',
      border: 'border-yellow-500/15 hover:border-yellow-500/30',
      bgGlow: 'bg-yellow-500/5',
      badge: 'bg-yellow-500/10 border-yellow-550/20 text-yellow-355',
      gradient: 'from-slate-800 via-[#1d1d29] to-yellow-600',
      button: 'bg-yellow-550 hover:bg-yellow-600 text-slate-950 font-bold',
      bgText: 'text-yellow-450/80',
      card: 'bg-[#13131f]/75 border border-yellow-950/30',
      textMuted: 'text-slate-400',
    },
    food_beverage: {
      bg: 'bg-[#0f0302]',
      accent: 'text-orange-500',
      border: 'border-orange-500/15 hover:border-orange-500/30',
      bgGlow: 'bg-orange-555/5',
      badge: 'bg-orange-500/10 border-orange-550/20 text-orange-355',
      gradient: 'from-red-600 via-orange-600 to-yellow-550',
      button: 'bg-orange-600 hover:bg-orange-700 text-white font-bold',
      bgText: 'text-orange-450/80',
      card: 'bg-[#210906]/75 border border-orange-950/30',
      textMuted: 'text-orange-100/60',
    },
    fashion_studio: {
      bg: 'bg-[#0f020a]',
      accent: 'text-pink-400',
      border: 'border-pink-500/15 hover:border-pink-500/30',
      bgGlow: 'bg-pink-550/5',
      badge: 'bg-pink-400/10 border-pink-400/20 text-pink-300',
      gradient: 'from-pink-500 via-rose-600 to-purple-800',
      button: 'bg-gradient-to-r from-pink-500 to-purple-650 text-white font-bold',
      bgText: 'text-pink-455/80',
      card: 'bg-[#210617]/75 border border-pink-950/30',
      textMuted: 'text-pink-100/60',
    },
    wealth_management: {
      bg: 'bg-[#020806]',
      accent: 'text-emerald-400',
      border: 'border-emerald-500/15 hover:border-emerald-500/30',
      bgGlow: 'bg-emerald-555/5',
      badge: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300',
      gradient: 'from-[#0a2f1d] via-[#103a24] to-[#041a0f]',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
      bgText: 'text-emerald-450/80',
      card: 'bg-[#04170f]/75 border border-emerald-950/30',
      textMuted: 'text-emerald-100/60',
    },
    high_luxury: {
      bg: 'bg-[#050505]',
      accent: 'text-slate-100',
      border: 'border-zinc-800 hover:border-zinc-700',
      bgGlow: 'bg-white/5',
      badge: 'bg-zinc-800 border border-zinc-700 text-slate-100',
      gradient: 'from-black via-zinc-900 to-zinc-950',
      button: 'bg-white hover:bg-slate-200 text-black font-black uppercase tracking-widest',
      bgText: 'text-slate-200/80',
      card: 'bg-zinc-950/70 border border-zinc-900 shadow-xl',
      textMuted: 'text-zinc-500',
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

  const whatsappText = formatCompanyWhatsApp(company);
  const whatsappUrl = getCleanWhatsAppUrl(company.whatsapp || company.phone, whatsappText);

  // WhatsApp helper for specific products
  const handleProductWhatsApp = (productName: string, productId?: string, product?: any) => {
    const text = product
      ? formatProductWhatsApp(company, product)
      : formatCompanyWhatsApp(company);
    if (company.id) {
      trackAnalyticsEvent({
        companyId: company.id,
        eventType: 'whatsapp_click',
        targetId: productId || null,
        targetName: productName
      });
    }
    window.open(getCleanWhatsAppUrl(company.whatsapp || company.phone, text), '_blank');
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
    window.open(getCleanWhatsAppUrl(company.whatsapp, msg), '_blank');
    setBookingSuccess(true);
  };

  // Filter products by search and category
  const filteredProducts = (company.products || []).filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
                          product.detail?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesSearch;
  });

  return (
    <main id="company-profile-content" className={`min-h-screen ${currentTheme.bg} text-white overflow-x-hidden relative font-outfit pb-12`}>
      <Header />

      {/* Dynamic Background Glowing Circles */}
      <div className={`absolute top-20 right-[-10%] w-96 h-96 rounded-full blur-[120px] transition-colors duration-1000 ${currentTheme.bgGlow} pointer-events-none`} />
      <div className={`absolute bottom-20 left-[-10%] w-96 h-96 rounded-full blur-[120px] transition-colors duration-1000 ${currentTheme.bgGlow} pointer-events-none`} />

      <section className="pt-20 pb-16 max-w-5xl mx-auto px-4 relative z-10">
        {/* Dynamic Cover Block */}
        <div className={`h-48 sm:h-64 relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${currentTheme.gradient} shadow-2xl border border-white/10`}>
          {company.coverImageUrl && company.coverImageUrl.startsWith('http') && (
            <Image src={company.coverImageUrl} alt={company.name} fill className="object-cover opacity-55 mix-blend-overlay" unoptimized={company.coverImageUrl.includes('firebasestorage.googleapis.com')} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          
          {/* Top Badge Panel */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <SubscriptionPlanBadge plan="premium" />
          </div>

          {/* Theme Selector (Unique Premium Theme Selection) */}
          <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-md rounded-2xl p-2 border border-white/10 flex flex-col gap-1.5 max-w-[200px] sm:max-w-[280px] no-print z-30">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block border-b border-white/5 pb-1">Live Theme Designer</span>
            <div className="flex flex-wrap gap-1">
              {([
                'luxury_gold', 'midnight_purple', 'mint_emerald', 'sunset_amber', 'classic_blue',
                'glass_ui', 'neo_corporate', 'elegant_black', 'creative_agency', 'tech_startup',
                'medical_clinic', 'education_academy', 'retail_shop', 'industrial_plant', 'real_estate',
                'food_beverage', 'fashion_studio', 'wealth_management', 'high_luxury'
              ] as PremiumThemeName[]).map(t => {
                let colorClass = 'bg-blue-500 border-blue-450';
                if (t === 'luxury_gold') colorClass = 'bg-amber-400 border-amber-300';
                else if (t === 'midnight_purple') colorClass = 'bg-purple-500 border-purple-400';
                else if (t === 'mint_emerald') colorClass = 'bg-emerald-500 border-emerald-400';
                else if (t === 'sunset_amber') colorClass = 'bg-orange-500 border-orange-400';
                else if (t === 'classic_blue') colorClass = 'bg-blue-500 border-blue-400';
                else if (t === 'glass_ui') colorClass = 'bg-slate-300 border-white';
                else if (t === 'neo_corporate') colorClass = 'bg-indigo-600 border-indigo-400';
                else if (t === 'elegant_black') colorClass = 'bg-zinc-950 border-rose-450';
                else if (t === 'creative_agency') colorClass = 'bg-pink-500 border-pink-400';
                else if (t === 'tech_startup') colorClass = 'bg-cyan-400 border-cyan-300';
                else if (t === 'medical_clinic') colorClass = 'bg-teal-500 border-teal-400';
                else if (t === 'education_academy') colorClass = 'bg-sky-500 border-sky-400';
                else if (t === 'retail_shop') colorClass = 'bg-red-650 border-red-400';
                else if (t === 'industrial_plant') colorClass = 'bg-slate-500 border-slate-400';
                else if (t === 'real_estate') colorClass = 'bg-yellow-600 border-yellow-450';
                else if (t === 'food_beverage') colorClass = 'bg-orange-600 border-orange-500';
                else if (t === 'fashion_studio') colorClass = 'bg-pink-650 border-pink-450';
                else if (t === 'wealth_management') colorClass = 'bg-emerald-600 border-emerald-450';
                else if (t === 'high_luxury') colorClass = 'bg-zinc-200 border-zinc-400';

                return (
                  <button
                    key={t}
                    onClick={() => setActiveTheme(t)}
                    className={`w-3.5 h-3.5 rounded-full border transition-all duration-300 cursor-pointer ${colorClass} ${activeTheme === t ? 'scale-125 ring-2 ring-white/50' : 'opacity-70 hover:opacity-100'}`}
                    title={t.replace('_', ' ')}
                  />
                );
              })}
            </div>
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
                {renderVerificationBadge(company, 24)}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-slate-400">
              <span className={`font-bold uppercase tracking-wider text-xs ${currentTheme.accent}`}>{company.category}</span>
              <span className="flex items-center gap-1"><MapPin size={13} className={currentTheme.accent} />{company.district}, Tamil Nadu</span>
              <button 
                onClick={scrollToReview}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 hover:border-amber-400/30 hover:text-amber-400 transition-all font-bold text-white text-xs"
              >
                <Star size={13} className="fill-amber-400 text-amber-400" />
                {company.averageRating || company.rating || '0'} <span className="text-slate-500 font-normal">({reviews.length} feedback)</span>
              </button>
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
              <a href={getCleanCallUrl(company.phone)} onClick={() => trackAnalyticsEvent({ companyId: company.id, eventType: 'call_click' })} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-transform hover:scale-105 active:scale-95 ${currentTheme.button}`}>
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
              <a href={getGoogleMapsUrl(company)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border border-white/10 hover:bg-white/5 transition-colors">
                <MapPin size={13} className={currentTheme.accent} /> Open in Google Maps
              </a>
              <FollowButton companyId={company.id} />
              <button onClick={() => setShareOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border border-white/10 hover:bg-white/5 transition-colors">
                <Share2 size={13} /> Share
              </button>
              {company.brochureUrl && (
                <a href={company.brochureUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border border-white/10 hover:bg-white/5 transition-colors">
                  <FileDown size={13} /> Brochure
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

        {/* Company Stats */}
        <div className="mb-6">
          <CompanyStatsBar company={company} jobs={jobs} reviews={reviews} accentColor={currentTheme.accent} />
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
                    {company.companyServicesTags?.length > 0 && (
                      <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Award size={16} className={currentTheme.accent} /> Professional Services & Specializations
                        </h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {company.companyServicesTags.map((svc: string) => (
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
                  <div className="space-y-6">
                    <ServicesShowcaseSection company={company} services={company.services} currentTheme={currentTheme} />
                    <div className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6">
                      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
                        <PackagePlus size={16} className={currentTheme.accent} /> Products Catalogue
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
                    <div id="review-form-anchor" className="bg-white/[0.01] rounded-3xl border border-white/[0.06] p-6 space-y-3 bg-gradient-to-r from-white/[0.02] to-transparent">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                        <UserCheck size={14} className={currentTheme.accent} /> Submit Verified Client Feedback
                      </h3>
                      <ReviewSubmitForm 
                        companyId={company.id} 
                        companyName={company.name} 
                        reviews={reviews} 
                        btnStyle={currentTheme.button || 'bg-white/10 text-white'} 
                        theme="dark" 
                      />
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
                  
                  {company.companyServicesTags?.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold text-white mb-2">Our Specializations:</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {company.companyServicesTags.map((svc: string) => (
                          <span key={svc} className={`text-xs px-2.5 py-1 rounded-lg bg-white/[0.02] border ${currentTheme.border} text-slate-300`}>
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Services Showcase */}
                <ServicesShowcaseSection company={company} services={company.services} currentTheme={currentTheme} />

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
                <a href={getCleanCallUrl(company.phone)} className="flex items-center gap-2 hover:text-white transition-colors">
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
                <a href={getGoogleMapsUrl(company)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 pt-3 border-t border-white/5 hover:text-white transition-colors">
                  <MapPin size={13} className={`${currentTheme.accent} shrink-0 mt-0.5`} />
                  <span className="leading-relaxed text-slate-400">{company.address}</span>
                </a>
              </div>

              {/* Social Channels */}
              <div className="pt-3 border-t border-white/5">
                <SocialMediaLinks company={company} accentColor={currentTheme.accent} />
              </div>

              {/* Digital ID Card Preview */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Digital Business ID Card</span>
                <MiniDigitalIDCard company={company} plan="premium" />
              </div>
            </div>

            {/* Enhanced Lead Form */}
            <div className="bg-white/[0.01] backdrop-blur-md rounded-3xl border border-white/[0.06] p-5 space-y-4 bg-gradient-to-br from-white/[0.01] to-transparent">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Premium RFQ Lead Capture</h3>
                <p className="text-[10px] text-slate-550 mt-1">Get custom pricing quotes directly from our sales desks.</p>
              </div>
              <EnhancedEnquiryForm companyId={company.id} companyName={company.name} btnStyle={currentTheme.button} />
            </div>

            {/* Trust & Verification Badges */}
            <div className="bg-white/[0.01] backdrop-blur-md rounded-3xl border border-white/[0.06] p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-2">
                <ShieldCheck size={14} className="text-emerald-400" /> Trust Score Check
              </h3>
              <VerifiedDocBadges company={company} />
            </div>

            {/* Company Bio */}
            <CompanyBioSection company={company} cardStyle="bg-white/[0.01] backdrop-blur-md rounded-3xl border border-white/[0.06]" />
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
