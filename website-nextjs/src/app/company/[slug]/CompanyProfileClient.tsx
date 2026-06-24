'use client';

import { useState } from 'react';
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
  BellRing, Send, Quote, Newspaper, PackagePlus, Crown, UserCheck
} from 'lucide-react';
import { FacebookIcon, InstagramIcon } from '@/components/ui/BrandIcons';

export default function CompanyProfileClient({ company, jobs, reviews }: {
  company: any; jobs: any[]; reviews: any[];
}) {
  const [activeTab, setActiveTab] = useState('about');
  const [saved, setSaved] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [reviewType, setReviewType] = useState('company');

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'posts', label: `Posts (${company.posts?.length ?? 0})` },
    { id: 'jobs', label: `Jobs (${jobs.length})` },
    { id: 'products', label: 'Products & Services' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'reviews', label: `Reviews (${company.reviewCount})` },
  ];

  const badges = [
    { key: 'emailVerified', label: 'Email Verified', icon: Mail, color: 'blue' },
    { key: 'gstVerified', label: 'GST Verified', icon: FileCheck, color: 'violet' },
    { key: 'businessVerified', label: 'Business Verified', icon: Award, color: 'amber' },
  ];

  const badgeToneMap: Record<string, { container: string; icon: string }> = {
    blue: {
      container: 'bg-blue-500/10 border border-blue-500/20',
      icon: 'text-blue-400',
    },
    violet: {
      container: 'bg-violet-500/10 border border-violet-500/20',
      icon: 'text-violet-400',
    },
    amber: {
      container: 'bg-amber-500/10 border border-amber-500/20',
      icon: 'text-amber-400',
    },
  };

  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <Header />

      {/* Cover + Logo */}
      <section className="pt-16">
        <div className="h-48 sm:h-64 relative overflow-hidden bg-slate-950">
          {company.coverImageUrl ? (
            <Image
              src={company.coverImageUrl}
              alt={`${company.name} cover image`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#0f766e,#2563eb)]" />
          )}
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
          {company.isPremium && (
            <div className="absolute top-4 right-4 badge-premium px-3 py-1 text-xs">PREMIUM</div>
          )}
          {/* Breadcrumb */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight size={12} />
            <Link href="/businesses" className="hover:text-white">Businesses</Link>
            <ChevronRight size={12} />
            <Link href={`/businesses/${company.category.toLowerCase()}`} className="hover:text-white">{company.category}</Link>
            <ChevronRight size={12} />
            <span className="text-white/80 truncate max-w-[140px]">{company.name}</span>
          </div>
        </div>

        {/* Company Info Bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-end gap-4 -mt-10 mb-6">
            {/* Logo */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl glass-card border-2 border-violet-500/30 flex items-center justify-center shrink-0 shadow-2xl overflow-hidden">
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <Building2 size={34} className="text-violet-300" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-outfit font-bold text-white">{company.name}</h1>
                {company.verificationBadges.gstVerified && (
                  <div className="flex items-center gap-1 badge-verified">
                    <BadgeCheck size={11} /> Verified
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-400">
                <span className="text-violet-400 font-medium">{company.category}</span>
                <span className="flex items-center gap-1"><MapPin size={12} />{company.district}, {company.state}</span>
                <span className="flex items-center gap-1">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {company.rating} ({company.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <a href={`tel:${company.phone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-gradient relative z-10 text-sm font-semibold">
              <Phone size={15} /> Call Now
            </a>
            <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}>
              <MessageCircle size={15} /> WhatsApp
            </a>
            <button
              onClick={() => setFollowed(!followed)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                ${followed ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'btn-outline-glass'}`}>
              <BellRing size={15} className={followed ? 'fill-emerald-300' : ''} />
              {followed ? 'Following' : 'Follow'}
            </button>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-outline-glass text-sm font-semibold">
                <Globe size={15} /> Website
              </a>
            )}
            <button
              onClick={() => setSaved(!saved)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl btn-outline-glass text-sm font-semibold transition-all
                ${saved ? 'border-rose-500/50 text-rose-400' : ''}`}>
              <Heart size={15} className={saved ? 'fill-rose-400 text-rose-400' : ''} />
              {saved ? 'Saved' : 'Save'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl btn-outline-glass text-sm">
              <Share2 size={15} /> Share
            </button>
          </div>

          {followed && (
            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <div className="flex items-start gap-3">
                <BellRing size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                <p>
                  New jobs, company posts, services and offers from {company.name} வந்தவுடன் notification வரும்.
                </p>
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-violet-400 mb-1"><Eye size={16} /></div>
              <div className="text-xl font-bold text-white">{company.viewCount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-gray-500">Profile Views</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-cyan-400 mb-1"><TrendingUp size={16} /></div>
              <div className="text-xl font-bold text-white">{company.enquiryCount}</div>
              <div className="text-xs text-gray-500">Enquiries</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1"><Briefcase size={16} /></div>
              <div className="text-xl font-bold text-white">{jobs.length}</div>
              <div className="text-xs text-gray-500">Open Jobs</div>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1"><Users size={16} /></div>
              <div className="text-xl font-bold text-white">{company.followerCount.toLocaleString('en-IN')}</div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
                  ${activeTab === tab.id
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid lg:grid-cols-3 gap-6 pb-28 md:pb-12">
            <div className="lg:col-span-2 space-y-6">

              {/* ABOUT TAB */}
              {activeTab === 'about' && (
                <>
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-3">About {company.name}</h2>
                    <p className="text-gray-300 text-sm leading-relaxed">{company.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Trust Score', value: `${company.trustScore}%`, icon: ShieldCheck, tone: 'text-emerald-400' },
                      { label: 'Response Time', value: company.responseTime, icon: Clock, tone: 'text-cyan-400' },
                      { label: 'Lead Ready', value: 'Quote + Inquiry', icon: Quote, tone: 'text-amber-400' },
                    ].map(({ label, value, icon: Icon, tone }) => (
                      <div key={label} className="glass-card rounded-2xl p-4">
                        <Icon size={18} className={tone} />
                        <div className="mt-3 text-lg font-bold text-white">{value}</div>
                        <div className="text-xs text-gray-500">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Services */}
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Our Services</h2>
                    <div className="flex flex-wrap gap-2">
                      {company.services.map((service: string) => (
                        <span key={service} className="px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-300 text-sm border border-violet-500/20 font-medium">
                          ✓ {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Map */}
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MapPin size={16} className="text-violet-400" /> Location
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">{company.address}</p>
                    <div className="rounded-xl overflow-hidden h-48 bg-white/5 border border-white/10 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Navigation size={32} className="mx-auto mb-2 text-violet-400" />
                        <p className="text-sm">{company.district}, {company.state}</p>
                        <a href={`https://maps.google.com/?q=${company.latitude},${company.longitude}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 justify-center mt-2">
                          Open in Google Maps <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* POSTS TAB */}
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  <div className="glass-card rounded-2xl p-6">
                    <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-white">
                      <Newspaper size={17} className="text-violet-400" /> Company Posts
                    </h2>
                    <p className="text-sm text-gray-400">
                      Facebook page மாதிரி latest jobs, offers, products and service updates.
                    </p>
                  </div>
                  {company.posts?.map((post: { id: string; type: string; title: string; body: string; time: string; cta: string }) => (
                    <article key={post.id} className="glass-card rounded-2xl p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-300">
                            {post.type}
                          </span>
                          <h3 className="mt-3 text-base font-semibold text-white">{post.title}</h3>
                        </div>
                        <span className="text-xs text-gray-600">{post.time}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-gray-400">{post.body}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href={`https://wa.me/${company.whatsapp}?text=Hi, I saw your ${encodeURIComponent(post.title)} on THENIJOBS`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                        >
                          {post.cta}
                        </a>
                        <button onClick={() => setFollowed(true)} className="rounded-xl btn-outline-glass px-3 py-2 text-xs font-semibold">
                          Follow updates
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* JOBS TAB */}
              {activeTab === 'jobs' && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Active Job Openings</h2>
                  <div className="space-y-3">
                    {jobs.map(job => (
                      <Link key={job.id} href={`/jobs/detail?id=${encodeURIComponent(job.id)}`}
                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-violet-500/30 transition-all group">
                        <div>
                          <div className="font-semibold text-white text-sm group-hover:text-violet-400 transition-colors">{job.title}</div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>{job.type}</span>
                            <span>{job.salary}</span>
                            <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{job.posted}</span>
                          <button className="btn-gradient px-3 py-1.5 text-xs font-semibold rounded-lg relative z-10">
                            Apply
                          </button>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* PRODUCTS TAB */}
              {activeTab === 'products' && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                    <PackagePlus size={17} className="text-cyan-400" /> Products & Services
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {company.products?.map((product: { name: string; detail: string }) => (
                      <div key={product.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="font-semibold text-white">{product.name}</div>
                        <div className="mt-1 text-sm text-gray-500">{product.detail}</div>
                        <button onClick={() => setActiveTab('about')} className="mt-3 rounded-xl bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300">
                          Request quote
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GALLERY TAB */}
              {activeTab === 'gallery' && (
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Company Gallery</h2>
                  {(company.galleryImages?.length || company.galleryVideos?.length) ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {company.galleryImages?.map((src: string, index: number) => (
                        <div key={src || index} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5">
                          <Image
                            src={src}
                            alt={`${company.name} gallery ${index + 1}`}
                            fill
                            sizes="(max-width: 640px) 50vw, 220px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                      {company.galleryVideos?.map((src: string, index: number) => (
                        <video
                          key={src || index}
                          src={src}
                          controls
                          className="aspect-square rounded-xl border border-white/10 bg-black object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm text-gray-500">
                      No gallery media uploaded yet.
                    </div>
                  )}
                </div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {/* Rating Summary */}
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-5xl font-black text-white">{company.rating}</div>
                        <div className="flex gap-0.5 my-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} size={14} className={i <= Math.round(company.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'} />
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">{company.reviewCount} reviews</div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {[5, 4, 3, 2, 1].map(star => (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-2">{star}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-amber-400"
                                style={{ width: `${star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 6 : 2}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Review Cards */}
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="mb-3 font-semibold text-white">Write a verified review</h3>
                    <div className="mb-3 grid grid-cols-3 gap-2">
                      {[
                        { id: 'company', label: 'Company' },
                        { id: 'employee', label: 'Employee' },
                        { id: 'service', label: 'Service' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setReviewType(type.id)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                            reviewType === type.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                    <textarea rows={3} placeholder={`${reviewType} review எழுதுங்கள்...`} className="search-input w-full resize-none px-3 py-2.5 text-sm" />
                    <button className="mt-3 rounded-xl btn-gradient px-4 py-2.5 text-sm font-semibold relative z-10">
                      Submit Review
                    </button>
                  </div>
                  {reviews.map(review => (
                    <div key={review.id} className="glass-card rounded-2xl p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center font-bold text-white text-sm">
                            {review.name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{review.name}</div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={11} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600">{review.date}</span>
                      </div>
                      <h4 className="font-medium text-white text-sm mb-1">{review.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{review.content}</p>
                      <div className="mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                          ${review.type === 'customer' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {review.type === 'customer' ? '👤 Customer Review' : '👷 Employee Review'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Contact Card */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 text-sm">Contact Information</h3>
                <div className="space-y-3">
                  <a href={`tel:${company.phone}`} className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center"><Phone size={14} className="text-violet-400" /></div>
                    {company.phone}
                  </a>
                  <a href={`mailto:${company.email}`} className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center"><Mail size={14} className="text-cyan-400" /></div>
                    {company.email}
                  </a>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Globe size={14} className="text-emerald-400" /></div>
                      Visit Website
                    </a>
                  )}
                  <div className="flex items-start gap-3 text-sm text-gray-400">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0"><MapPin size={14} className="text-amber-400" /></div>
                    {company.address}
                  </div>
                </div>
                {/* Social */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  {company.facebook && <a href={company.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-blue-500/20 flex items-center justify-center text-gray-500 hover:text-blue-400 transition-all"><FacebookIcon size={14} /></a>}
                  {company.instagram && <a href={company.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-pink-500/20 flex items-center justify-center text-gray-500 hover:text-pink-400 transition-all"><InstagramIcon size={14} /></a>}
                </div>

                <Link
                  href={`/services/book?companyId=${encodeURIComponent(company.id)}`}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer"
                >
                  Book Appointment / Service
                </Link>
              </div>

              {/* Follow Signal */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <BellRing size={15} className="text-amber-400" /> Follow Benefits
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2"><UserCheck size={14} className="text-emerald-400" /> New jobs notification</div>
                  <div className="flex items-center gap-2"><Newspaper size={14} className="text-violet-400" /> Company post updates</div>
                  <div className="flex items-center gap-2"><PackagePlus size={14} className="text-cyan-400" /> New service alerts</div>
                </div>
                <button
                  onClick={() => setFollowed(!followed)}
                  className="mt-4 w-full rounded-xl btn-outline-glass py-2.5 text-sm font-semibold"
                >
                  {followed ? 'Following this company' : 'Follow Company'}
                </button>
              </div>

              {/* Verification Badges */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 text-sm flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-400" /> Verification Status
                </h3>
                <div className="space-y-2">
                  {badges.map(({ key, label, icon: Icon, color }) => {
                    const isVerified = company.verificationBadges[key];
                    const tone = badgeToneMap[color];
                    return (
                      <div key={key} className={`flex items-center gap-3 p-2.5 rounded-xl text-sm
                        ${isVerified ? tone.container : 'bg-white/5 border border-white/10 opacity-50'}`}>
                        <Icon size={14} className={isVerified ? tone.icon : 'text-gray-600'} />
                        <span className={isVerified ? 'text-white' : 'text-gray-600'}>{label}</span>
                        {isVerified && <BadgeCheck size={13} className="ml-auto text-emerald-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Company Details */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4 text-sm">Company Details</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Founded</span>
                    <span className="text-white font-medium">{company.foundedYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Size</span>
                    <span className="text-white font-medium">{company.companySize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="text-violet-400 font-medium">{company.category}</span>
                  </div>
                  {company.gstNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">GST</span>
                      <span className="text-emerald-400 font-medium text-xs font-mono">{company.gstNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Send Enquiry */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-1 text-sm">Send Inquiry / Request Quote</h3>
                <p className="mb-4 text-xs text-gray-500">Lead direct company dashboard-க்கு போகும்.</p>
                <div className="space-y-3">
                  <input type="text" placeholder="Your Name" className="search-input w-full px-3 py-2.5 text-sm" />
                  <input type="tel" placeholder="Your Mobile Number" className="search-input w-full px-3 py-2.5 text-sm" />
                  <textarea placeholder="Your requirement..." rows={3} className="search-input w-full px-3 py-2.5 text-sm resize-none" />
                  <button onClick={() => setEnquirySent(true)} className="w-full btn-gradient py-3 text-sm font-semibold rounded-xl relative z-10 flex items-center justify-center gap-2">
                    <Send size={14} /> Send Lead
                  </button>
                  {enquirySent && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                      Lead created. Company dashboard-ல் New Inquiry ஆக தெரியும்.
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl border border-amber-500/20 p-5">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  <Crown size={15} className="text-amber-400" /> Premium Visibility
                </h3>
                <p className="text-sm leading-6 text-gray-400">
                  Featured listing, top search rank, verified badge, more leads and banner promotion.
                </p>
                <Link href="/pricing" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-300">
                  View plans <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
      <FloatingWhatsApp number={company.whatsapp} />
    </main>
  );
}
