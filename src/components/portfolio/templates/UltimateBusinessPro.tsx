'use client';

import { Phone, Mail, MessageCircle, ChevronRight, Users, Briefcase, Star, MapPin, ArrowUpRight, Diamond, Award, Globe, Shield, Clock, Calendar, Newspaper, BarChart3, Play, Sparkles, Building2, Heart, Target, Zap } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, TeamMember, TestimonialItem, ProjectItem, GalleryImage, CareerOpening, ContactSectionData, FAQItem, TimelineEvent, AchievementItem, ClientLogo, NewsItem, WorkingHoursData } from '@/lib/types/portfolio';
import { safeExternalUrl } from '@/lib/safeUrl';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

/**
 * UltimateBusinessPro — the most premium template in the system.
 * All 20+ sections, gradient hero with animated orbs, trust bar, achievements counter,
 * CEO message, timeline, FAQ, working hours, news, full contact with map.
 * Designed for Enterprise-plan companies wanting the complete package.
 */
export default function UltimateBusinessPro({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;

  // Section extraction
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const team = getS<{ members: TeamMember[] }>(s, 'team');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const projects = getS<{ items: ProjectItem[] }>(s, 'projects');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const careers = getS<{ openings: CareerOpening[] }>(s, 'careers');
  const contact = getS<ContactSectionData>(s, 'contact');
  const faq = getS<{ items: FAQItem[] }>(s, 'faq');
  const timeline = getS<{ events: TimelineEvent[] }>(s, 'timeline');
  const achievements = getS<{ items: AchievementItem[] }>(s, 'achievements');
  const clients = getS<{ logos: ClientLogo[] }>(s, 'clients');
  const news = getS<{ items: NewsItem[] }>(s, 'news');
  const ceoMessage = getS<any>(s, 'ceo-message');
  const workingHours = getS<WorkingHoursData>(s, 'working-hours');
  const branches = getS<any>(s, 'branches');

  // Theme
  const p = th.primaryColor || '#2563EB', p2 = th.secondaryColor || '#7C3AED', p3 = th.accentColor || '#D97706';
  const bg = th.backgroundColor || '#FFFFFF', tx = th.textColor || '#0F172A';
  const m = th.textMutedColor || '#64748B', sf = th.surfaceColor || '#F8FAFC';
  const hf = th.headingFont || 'Poppins', f = th.fontFamily || 'Inter';
  const r = '16px';
  const grad = `linear-gradient(135deg, ${p}, ${p2})`;
  const grad2 = `linear-gradient(135deg, ${p2}, ${p})`;

  // Build dynamic nav links
  const navItems = [
    about && 'About', services?.items?.length && 'Services', products?.items?.length && 'Products',
    team?.members?.length && 'Team', projects?.items?.length && 'Projects',
    careers?.openings?.length && 'Careers', 'Contact'
  ].filter(Boolean) as string[];

  return (
    <div style={{ fontFamily: `'${f}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* ═══ PREMIUM NAV ═══ */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl border-b" style={{ background: `${bg}F0`, borderColor: `${m}08` }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-11 w-auto" /> : (
              <div className="h-11 w-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ background: grad }}>
                {b.companyName?.[0] || 'U'}
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-sm font-extrabold tracking-tight" style={{ fontFamily: `'${hf}'` }}>{b.companyName}</h1>
              {b.tagline && <p className="text-[9px] font-medium" style={{ color: m }}>{b.tagline}</p>}
            </div>
            <span className="ml-1 px-2 py-0.5 text-[8px] font-bold rounded-md text-white" style={{ background: grad }}>PRO</span>
          </div>
          <div className="hidden lg:flex gap-5 text-xs font-semibold" style={{ color: m }}>
            {navItems.map(i => <a key={i} href={`#${i.toLowerCase()}`} className="hover:opacity-70 transition-all">{i}</a>)}
          </div>
          <div className="flex items-center gap-2">
            {contact?.whatsapp && (
              <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                className="px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all"
                style={{ borderRadius: r, background: grad }}>
                Get Started
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ═══ HERO — Animated Gradient ═══ */}
      {hero && (
        <section className="relative py-28 sm:py-40 overflow-hidden" style={{ background: grad }}>
          {/* Animated orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-[10%] w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse" />
            <div className="absolute bottom-5 left-[5%] w-60 h-60 rounded-full bg-white/8 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          {hero.backgroundImage && <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          <div className="relative max-w-5xl mx-auto px-6 text-center text-white">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold border border-white/20 mb-8">
              <Diamond size={12} /> Premium Business Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1]" style={{ fontFamily: `'${hf}'` }}>
              {hero.headline || b.companyName}
            </h1>
            <p className="text-base sm:text-xl mt-6 max-w-2xl mx-auto text-white/80 leading-relaxed">
              {hero.subheadline || b.tagline}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-10">
              <a href="#services" className="px-9 py-4 bg-white text-sm font-bold flex items-center justify-center gap-2 hover:shadow-2xl transition-all" style={{ borderRadius: r, color: p }}>
                {hero.ctaText || 'Explore Solutions'} <ArrowUpRight size={15} />
              </a>
              <a href="#contact" className="px-9 py-4 text-sm font-bold border-2 border-white/30 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2" style={{ borderRadius: r }}>
                <MessageCircle size={14} /> Talk to Us
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ═══ TRUST BAR — Client Logos ═══ */}
      {(clients?.logos?.length ?? 0) > 0 && (
        <section className="py-10 border-b" style={{ borderColor: `${m}06` }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[9px] font-bold uppercase tracking-[4px] text-center mb-6" style={{ color: m }}>Trusted By Industry Leaders</p>
            <div className="flex flex-wrap items-center justify-center gap-10 opacity-50 hover:opacity-70 transition-all">{clients!.logos.map(c => (
              <div key={c.id}>{c.logo ? <img src={c.logo} alt={c.name} className="h-8 w-auto grayscale hover:grayscale-0 transition-all" /> : <span className="text-sm font-bold" style={{ color: m }}>{c.name}</span>}</div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ ACHIEVEMENTS COUNTER ═══ */}
      {(achievements?.items?.length ?? 0) > 0 && (
        <section className="py-16" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">{achievements?.items?.map(a => (
              <div key={a.id} className="text-center p-6 bg-white border shadow-sm hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}06` }}>
                <p className="text-3xl sm:text-4xl font-extrabold" style={{ background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{a.number}</p>
                <p className="text-xs font-medium mt-2" style={{ color: m }}>{a.label}</p>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ ABOUT ═══ */}
      {about && (
        <section className="py-20 sm:py-28" id="about">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            {about.image && <div className="overflow-hidden shadow-2xl relative" style={{ borderRadius: r }}><img src={about.image} alt="" className="w-full h-96 object-cover" /><div className="absolute bottom-4 left-4 px-4 py-2 text-white text-[10px] font-bold rounded-lg backdrop-blur-md bg-black/30">Est. {about.founded || 'Since founding'}</div></div>}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3" style={{ color: p }}>About Us</p>
              <h2 className="text-2xl sm:text-4xl font-bold mb-5 leading-tight" style={{ fontFamily: `'${hf}'` }}>{about.mission || 'Company Overview'}</h2>
              <p className="text-sm leading-[1.9]" style={{ color: m }}>{about.content}</p>
              {about.vision && <div className="p-4 border-l-4 mt-5" style={{ borderColor: p, background: `${p}05` }}><p className="text-xs italic" style={{ color: m }}>&ldquo;{about.vision}&rdquo;</p></div>}
              {(about.founded || about.employees || about.industry) && (
                <div className="grid grid-cols-3 gap-3 mt-6">{[
                  about.founded && { val: about.founded, label: 'Founded' },
                  about.employees && { val: about.employees, label: 'Team Size' },
                  about.industry && { val: about.industry, label: 'Industry' },
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="p-3 text-center" style={{ background: sf, borderRadius: r }}>
                    <p className="text-sm font-bold" style={{ color: p }}>{item.val}</p>
                    <p className="text-[9px] font-medium uppercase tracking-[1px] mt-0.5" style={{ color: m }}>{item.label}</p>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CEO MESSAGE ═══ */}
      {ceoMessage && (
        <section className="py-20 sm:py-24" style={{ background: sf }}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3" style={{ color: p }}>From Our Leadership</p>
            <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: `'${hf}'` }}>A Message from Our {ceoMessage.title || 'CEO'}</h2>
            <div className="p-8 border bg-white" style={{ borderRadius: r, borderColor: `${m}06` }}>
              {ceoMessage.photo && <img src={ceoMessage.photo} alt="" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover shadow-lg" />}
              <p className="text-sm italic leading-[1.9] max-w-2xl mx-auto" style={{ color: m }}>&ldquo;{ceoMessage.message || ceoMessage.content}&rdquo;</p>
              <div className="mt-4">
                <p className="text-sm font-bold">{ceoMessage.name}</p>
                <p className="text-[10px]" style={{ color: p }}>{ceoMessage.designation || ceoMessage.role || 'CEO & Founder'}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ SERVICES ═══ */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-28" id="services">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Our Services</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4" style={{ fontFamily: `'${hf}'` }}>What We Deliver</h2>
            <p className="text-sm text-center max-w-2xl mx-auto mb-14" style={{ color: m }}>End-to-end solutions engineered for your success.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{services?.items?.map((svc, i) => (
              <div key={svc.id} className="p-7 border bg-white hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group" style={{ borderRadius: r, borderColor: `${m}06` }}>
                <div className="w-13 h-13 rounded-xl flex items-center justify-center text-white font-bold mb-5 text-sm shadow-md group-hover:shadow-lg transition-all" style={{ background: grad, width: 52, height: 52 }}>{String(i+1).padStart(2,'0')}</div>
                <h4 className="text-base font-bold mb-2" style={{ fontFamily: `'${hf}'` }}>{svc.name}</h4>
                <p className="text-xs leading-relaxed" style={{ color: m }}>{svc.description}</p>
                {svc.ctaText && <a href={safeExternalUrl(svc.ctaLink) || '#contact'} className="inline-flex items-center gap-1 mt-4 text-xs font-bold" style={{ color: p }}>{svc.ctaText} <ChevronRight size={12} /></a>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ PRODUCTS ═══ */}
      {(products?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="products" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Our Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{products?.items?.map(prod => (
              <div key={prod.id} className="bg-white border overflow-hidden hover:shadow-lg transition-all group" style={{ borderRadius: r, borderColor: `${m}06` }}>
                {prod.image && <div className="overflow-hidden"><img src={prod.image} alt="" className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                <div className="p-5">
                  <h4 className="text-sm font-bold mb-1">{prod.name}</h4>
                  <p className="text-xs mb-3" style={{ color: m }}>{prod.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold" style={{ color: p }}>₹{prod.price}</span>
                      {prod.originalPrice && <span className="text-xs line-through" style={{ color: m }}>₹{prod.originalPrice}</span>}
                    </div>
                    {prod.whatsappLink && <a href={prod.whatsappLink} target="_blank" rel="noopener" className="px-3 py-1.5 text-[10px] font-bold text-white rounded-lg bg-green-600 hover:bg-green-700 transition">Order</a>}
                  </div>
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ TEAM ═══ */}
      {(team?.members?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="team">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Our Team</p>
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Meet the People Behind the Vision</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">{team?.members?.map(mem => (
              <div key={mem.id} className="text-center group">
                <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-lg mb-3 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  {mem.photo ? <img src={mem.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: grad }}>{mem.name[0]}</div>}
                </div>
                <h4 className="text-sm font-bold">{mem.name}</h4>
                <p className="text-[10px] font-medium" style={{ color: p }}>{mem.role}</p>
                {mem.bio && <p className="text-[10px] mt-1 line-clamp-2" style={{ color: m }}>{mem.bio}</p>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ PROJECTS ═══ */}
      {(projects?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="projects" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Featured Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{projects?.items?.map(proj => (
              <div key={proj.id} className="bg-white border overflow-hidden group hover:shadow-xl transition-all" style={{ borderRadius: r, borderColor: `${m}06` }}>
                {proj.image && <div className="overflow-hidden"><img src={proj.image} alt="" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                <div className="p-5">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: `${p}10`, color: p }}>{proj.category}</span>
                  <h4 className="text-sm font-bold mt-2">{proj.title}</h4>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: m }}>{proj.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: m }}>{proj.client && <span>Client: {proj.client}</span>}{proj.year && <span>• {proj.year}</span>}</div>
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ GALLERY ═══ */}
      {(gallery?.images?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{gallery?.images?.map(img => (
              <div key={img.id} className="overflow-hidden group" style={{ borderRadius: r }}>
                <img src={img.url} alt={img.caption} className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ TESTIMONIALS ═══ */}
      {(testimonials?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Testimonials</p>
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>What Our Clients Say</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{testimonials?.items?.map(t2 => (
              <div key={t2.id} className="p-7 border bg-white hover:shadow-lg transition-all" style={{ borderRadius: r, borderColor: `${m}06` }}>
                <div className="flex gap-0.5 mb-3">{Array.from({length: t2.rating || 5}).map((_, i) => <Star key={i} size={13} fill="#FBBF24" className="text-yellow-400" />)}</div>
                <p className="text-sm italic leading-relaxed" style={{ color: m }}>&ldquo;{t2.content}&rdquo;</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: `${m}06` }}>
                  {t2.photo && <img src={t2.photo} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div><p className="text-xs font-bold">{t2.name}</p><p className="text-[10px]" style={{ color: m }}>{t2.role}{t2.company ? `, ${t2.company}` : ''}</p></div>
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ NEWS ═══ */}
      {(news?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Latest News</p>
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>News & Updates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{news?.items?.map(item => (
              <a key={item.id} href={safeExternalUrl(item.link) || '#'} className="border overflow-hidden group hover:shadow-lg transition-all block" style={{ borderRadius: r, borderColor: `${m}06` }}>
                {item.image && <div className="overflow-hidden"><img src={item.image} alt="" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-[10px] mb-2" style={{ color: m }}><Calendar size={10} /> {item.date}</div>
                  <h4 className="text-sm font-bold">{item.title}</h4>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: m }}>{item.excerpt}</p>
                </div>
              </a>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ TIMELINE ═══ */}
      {(timeline?.events?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" style={{ background: sf }}>
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-14" style={{ fontFamily: `'${hf}'` }}>Our Journey</h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: `${p}20` }} />
              {timeline?.events?.map(ev => (
                <div key={ev.id} className="relative pl-14 pb-10 last:pb-0">
                  <div className="absolute left-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-md" style={{ background: grad }}>{ev.year?.slice(-2)}</div>
                  <div className="p-5 border bg-white hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}06` }}>
                    <p className="text-[10px] font-bold uppercase tracking-[2px]" style={{ color: p }}>{ev.year}</p>
                    <h4 className="text-sm font-bold mt-1">{ev.title}</h4>
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: m }}>{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CAREERS ═══ */}
      {(careers?.openings?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="careers">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Careers</p>
            <h2 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: `'${hf}'` }}>Join Our Team</h2>
            <p className="text-sm text-center max-w-xl mx-auto mb-12" style={{ color: m }}>Grow your career with us — explore open positions below.</p>
            <div className="max-w-3xl mx-auto space-y-3">{careers?.openings?.map(job => (
              <div key={job.id} className="bg-white p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-lg hover:border-blue-200 transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <div>
                  <h4 className="text-sm font-bold">{job.title}</h4>
                  <p className="text-[10px] flex items-center gap-2 mt-0.5" style={{ color: m }}>
                    <Users size={10} /> {job.department} · <MapPin size={10} /> {job.location} · {job.type}
                  </p>
                </div>
                <a href={safeExternalUrl(job.link) || '#contact'} className="px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1" style={{ borderRadius: r, background: grad }}>Apply <ArrowUpRight size={12} /></a>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ FAQ ═══ */}
      {(faq?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" style={{ background: sf }}>
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Frequently Asked Questions</h2>
            <div className="space-y-3">{faq?.items?.map(item => (
              <details key={item.id} className="group bg-white border p-5" style={{ borderRadius: r, borderColor: `${m}06` }}>
                <summary className="flex items-center justify-between cursor-pointer text-sm font-bold list-none">{item.question}<ChevronRight size={14} className="group-open:rotate-90 transition-transform" style={{ color: m }} /></summary>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: m }}>{item.answer}</p>
              </details>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ WORKING HOURS ═══ */}
      {workingHours?.schedule && workingHours.schedule.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-xl mx-auto px-6">
            <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}'` }}>Working Hours</h2>
            <div className="border bg-white p-6" style={{ borderRadius: r, borderColor: `${m}06` }}>
              {workingHours.schedule.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: `${m}06` }}>
                  <span className="text-xs font-bold">{item.day}</span>
                  <span className="text-xs" style={{ color: item.closed ? '#EF4444' : m }}>{item.closed ? 'Closed' : item.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BRANCHES ═══ */}
      {branches?.items && branches.items.length > 0 && (
        <section className="py-16 sm:py-20" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Our Locations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{branches.items.map((branch: any) => (
              <div key={branch.id || branch.name} className="bg-white p-5 border" style={{ borderRadius: r, borderColor: `${m}06` }}>
                <h4 className="text-sm font-bold flex items-center gap-2"><MapPin size={14} style={{ color: p }} /> {branch.name}</h4>
                {branch.address && <p className="text-xs mt-1" style={{ color: m }}>{branch.address}</p>}
                {branch.phone && <a href={`tel:${branch.phone}`} className="text-xs flex items-center gap-1 mt-1" style={{ color: p }}><Phone size={10} /> {branch.phone}</a>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* ═══ CONTACT ═══ */}
      {contact && (
        <section className="py-20 sm:py-28" id="contact" style={{ background: grad }}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14">
            <div className="text-white">
              <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3 text-white/60">Contact Us</p>
              <h2 className="text-2xl sm:text-4xl font-bold mb-6" style={{ fontFamily: `'${hf}'` }}>Let&apos;s Build Something Great Together</h2>
              {contact.address && <p className="text-sm flex items-start gap-3 mb-4 text-white/80"><MapPin size={14} className="flex-shrink-0 mt-0.5" />{contact.address}</p>}
              {contact.phone && <a href={`tel:${contact.phone}`} className="text-sm flex items-center gap-3 mb-3 text-white/90 hover:text-white transition"><Phone size={14} />{contact.phone}</a>}
              {contact.email && <a href={`mailto:${contact.email}`} className="text-sm flex items-center gap-3 mb-3 text-white/90 hover:text-white transition"><Mail size={14} />{contact.email}</a>}
              {contact.whatsapp && (
                <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener"
                  className="inline-flex items-center gap-2 mt-5 px-7 py-3.5 text-sm font-bold rounded-2xl bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-all shadow-lg">
                  <MessageCircle size={15} /> WhatsApp Us
                </a>
              )}
            </div>
            {contact.googleMapsEmbed && <div className="overflow-hidden shadow-2xl" style={{ borderRadius: r }}><iframe src={contact.googleMapsEmbed} width="100%" height="380" style={{ border: 0 }} allowFullScreen loading="lazy" /></div>}
          </div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="py-12 border-t" style={{ borderColor: `${m}06` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: m }}>
            <div className="flex items-center gap-3">
              {b.logo ? <img src={b.logo} alt="" className="h-7 w-auto opacity-60" /> : <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ background: grad }}>{b.companyName?.[0]}</div>}
              <span>© {new Date().getFullYear()} {b.companyName}. All rights reserved.</span>
            </div>
            <span>Powered by <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
