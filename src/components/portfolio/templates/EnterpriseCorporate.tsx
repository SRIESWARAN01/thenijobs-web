'use client';

import { Phone, Mail, MessageCircle, Building2, Globe, Shield, ArrowUpRight, Award, Users, BarChart3, Newspaper, MapPin, Star, ChevronRight, Calendar } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, TeamMember, TestimonialItem, ProjectItem, GalleryImage, CareerOpening, ContactSectionData, NewsItem, ClientLogo, TimelineEvent, FAQItem } from '@/lib/types/portfolio';
import { safeExternalUrl } from '@/lib/safeUrl';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function EnterpriseCorporate({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const team = getS<{ members: TeamMember[] }>(s, 'team');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const projects = getS<{ items: ProjectItem[] }>(s, 'projects');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const careers = getS<{ openings: CareerOpening[] }>(s, 'careers');
  const contact = getS<ContactSectionData>(s, 'contact');
  const news = getS<{ items: NewsItem[] }>(s, 'news');
  const clients = getS<{ logos: ClientLogo[] }>(s, 'clients');
  const timeline = getS<{ events: TimelineEvent[] }>(s, 'timeline');
  const faq = getS<{ items: FAQItem[] }>(s, 'faq');

  const p = th.primaryColor || '#1E40AF', p2 = th.secondaryColor || '#1E3A5F';
  const bg = th.backgroundColor || '#FFFFFF', tx = th.textColor || '#0F172A';
  const m = th.textMutedColor || '#64748B', sf = th.surfaceColor || '#F8FAFC';
  const hf = th.headingFont || 'Inter', font = th.fontFamily || 'Inter';
  const r = '12px';

  const navLinks = ['About', 'Solutions', 'Team', 'Projects', 'News', 'Careers', 'Contact']
    .filter(label => {
      const map: Record<string, boolean> = {
        About: !!about, Solutions: !!(services?.items?.length), Team: !!(team?.members?.length),
        Projects: !!(projects?.items?.length), News: !!(news?.items?.length),
        Careers: !!(careers?.openings?.length), Contact: !!contact
      };
      return map[label];
    });

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* Enterprise Nav */}
      <header className="border-b sticky top-0 z-30 backdrop-blur-md" style={{ background: `${bg}F2`, borderColor: `${m}10` }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-10 w-auto" /> : (
              <div className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: p }}>
                <Building2 size={22} />
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold" style={{ fontFamily: `'${hf}'` }}>{b.companyName}</h1>
              {b.tagline && <p className="text-[9px]" style={{ color: m }}>{b.tagline}</p>}
            </div>
          </div>
          <nav className="hidden lg:flex gap-5 text-xs font-medium" style={{ color: m }}>
            {navLinks.map(i => <a key={i} href={`#${i.toLowerCase()}`} className="hover:opacity-70 transition">{i}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-5 py-2.5 text-xs font-bold text-white" style={{ borderRadius: r, background: p }}>Contact Us</a>}
          </div>
        </div>
      </header>

      {/* Corporate Hero — Dark Gradient with Geometric Pattern */}
      {hero && (
        <section className="relative py-28 sm:py-36 overflow-hidden" style={{ background: `linear-gradient(160deg, ${p}, ${p2}, #0F172A)` }}>
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          {hero.backgroundImage && <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          <div className="relative max-w-5xl mx-auto px-6 text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium mb-6 border border-white/20">
              <Shield size={12} /> Enterprise Solutions
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight" style={{ fontFamily: `'${hf}'` }}>{hero.headline || b.companyName}</h1>
            <p className="text-sm sm:text-lg mt-5 max-w-2xl mx-auto text-slate-300 leading-relaxed">{hero.subheadline || b.tagline}</p>
            <div className="flex justify-center gap-3 mt-9">
              <a href="#solutions" className="px-8 py-3.5 bg-white text-sm font-bold flex items-center gap-2 hover:shadow-xl transition-all" style={{ borderRadius: r, color: p }}>{hero.ctaText || 'Our Solutions'} <ArrowUpRight size={14} /></a>
              <a href="#contact" className="px-8 py-3.5 text-sm font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-all" style={{ borderRadius: r }}>Schedule a Call</a>
            </div>
          </div>
        </section>
      )}

      {/* Trust Bar — Client Logos */}
      {(clients?.logos?.length ?? 0) > 0 && (
        <section className="py-10 border-b" style={{ borderColor: `${m}08` }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] text-center mb-6" style={{ color: m }}>Trusted by Leading Organizations</p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">{clients!.logos.map(c => (
              <div key={c.id} className="flex items-center">
                {c.logo ? <img src={c.logo} alt={c.name} className="h-8 w-auto grayscale hover:grayscale-0 transition-all" /> : <span className="text-sm font-bold" style={{ color: m }}>{c.name}</span>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* About */}
      {about && (
        <section className="py-20 sm:py-24" id="about">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {about.image && <div className="overflow-hidden shadow-2xl" style={{ borderRadius: r }}><img src={about.image} alt="" className="w-full h-80 object-cover" /></div>}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2" style={{ color: p }}>About the Company</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: `'${hf}'` }}>{about.mission || 'Enterprise Overview'}</h2>
              <p className="text-sm leading-relaxed mb-5" style={{ color: m }}>{about.content}</p>
              {(about.founded || about.employees || about.industry) && (
                <div className="grid grid-cols-3 gap-4">
                  {about.founded && <div className="p-3 text-center" style={{ background: sf, borderRadius: r }}><p className="text-base font-bold" style={{ color: p }}>{about.founded}</p><p className="text-[10px]" style={{ color: m }}>Founded</p></div>}
                  {about.employees && <div className="p-3 text-center" style={{ background: sf, borderRadius: r }}><p className="text-base font-bold" style={{ color: p }}>{about.employees}</p><p className="text-[10px]" style={{ color: m }}>Employees</p></div>}
                  {about.industry && <div className="p-3 text-center" style={{ background: sf, borderRadius: r }}><p className="text-base font-bold" style={{ color: p }}>{about.industry}</p><p className="text-[10px]" style={{ color: m }}>Industry</p></div>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Enterprise Solutions */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="solutions" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Enterprise Solutions</p>
            <h2 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: `'${hf}'` }}>What We Deliver</h2>
            <p className="text-sm text-center max-w-2xl mx-auto mb-12" style={{ color: m }}>Comprehensive solutions designed for scale, security, and performance.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{services?.items?.map((svc, i) => (
              <div key={svc.id} className="bg-white p-7 border hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mb-4 text-sm" style={{ background: p }}>{String(i+1).padStart(2,'0')}</div>
                <h4 className="text-base font-bold mb-2" style={{ fontFamily: `'${hf}'` }}>{svc.name}</h4>
                <p className="text-xs leading-relaxed" style={{ color: m }}>{svc.description}</p>
                {svc.ctaText && <a href={safeExternalUrl(svc.ctaLink) || '#contact'} className="inline-flex items-center gap-1 mt-3 text-xs font-bold" style={{ color: p }}>{svc.ctaText} <ChevronRight size={12} /></a>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Products */}
      {(products?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Our Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{products?.items?.map(prod => (
              <div key={prod.id} className="border overflow-hidden hover:shadow-lg transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
                {prod.image && <img src={prod.image} alt="" className="w-full h-48 object-cover" />}
                <div className="p-5">
                  <h4 className="text-sm font-bold mb-1">{prod.name}</h4>
                  <p className="text-xs mb-2" style={{ color: m }}>{prod.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: p }}>₹{prod.price}</span>
                    {prod.whatsappLink && <a href={prod.whatsappLink} target="_blank" rel="noopener" className="px-3 py-1.5 text-[10px] font-bold text-white rounded-lg bg-green-600">Enquire</a>}
                  </div>
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Leadership Team */}
      {(team?.members?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="team" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Leadership</p>
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Our Executive Team</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">{team?.members?.map(mem => (
              <div key={mem.id} className="text-center group bg-white p-5 border hover:shadow-lg transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-md mb-3 group-hover:shadow-lg transition-all">
                  {mem.photo ? <img src={mem.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: p }}>{mem.name[0]}</div>}
                </div>
                <h4 className="text-sm font-bold">{mem.name}</h4>
                <p className="text-[10px] font-medium" style={{ color: p }}>{mem.role}</p>
                {mem.bio && <p className="text-[10px] mt-2 line-clamp-2" style={{ color: m }}>{mem.bio}</p>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Projects / Case Studies */}
      {(projects?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="projects">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Case Studies & Projects</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{projects?.items?.map(proj => (
              <div key={proj.id} className="bg-white border overflow-hidden group hover:shadow-xl transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
                {proj.image && <div className="overflow-hidden"><img src={proj.image} alt="" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                <div className="p-5">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: `${p}10`, color: p }}>{proj.category}</span>
                  <h4 className="text-sm font-bold mt-2">{proj.title}</h4>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: m }}>{proj.description}</p>
                  {proj.client && <p className="text-[10px] mt-2" style={{ color: m }}>Client: {proj.client} {proj.year ? `• ${proj.year}` : ''}</p>}
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {(gallery?.images?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{gallery?.images?.map(img => (
              <div key={img.id} className="overflow-hidden group" style={{ borderRadius: r }}>
                <img src={img.url} alt={img.caption} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {(testimonials?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Client Testimonials</p>
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Trusted by Industry Leaders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{testimonials?.items?.map(t2 => (
              <div key={t2.id} className="p-6 border" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <div className="flex gap-0.5 mb-3">{Array.from({length: t2.rating || 5}).map((_, i) => <Star key={i} size={13} fill="#FBBF24" className="text-yellow-400" />)}</div>
                <p className="text-sm italic leading-relaxed" style={{ color: m }}>&ldquo;{t2.content}&rdquo;</p>
                <div className="flex items-center gap-3 mt-4">
                  {t2.photo && <img src={t2.photo} alt="" className="w-10 h-10 rounded-full object-cover" />}
                  <div><p className="text-xs font-bold">{t2.name}</p><p className="text-[10px]" style={{ color: m }}>{t2.role}{t2.company ? `, ${t2.company}` : ''}</p></div>
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* News & Updates */}
      {(news?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="news" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>News & Updates</p>
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Latest from {b.companyName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{news?.items?.map(item => (
              <a key={item.id} href={safeExternalUrl(item.link) || '#'} className="bg-white border overflow-hidden group hover:shadow-lg transition-all block" style={{ borderRadius: r, borderColor: `${m}08` }}>
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

      {/* Company Timeline */}
      {(timeline?.events?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Our Journey</h2>
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: `${p}20` }} />
              {timeline?.events?.map(ev => (
                <div key={ev.id} className="relative pl-14 pb-10">
                  <div className="absolute left-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: p }}>{ev.year?.slice(-2)}</div>
                  <div className="p-4 border" style={{ borderRadius: r, borderColor: `${m}08` }}>
                    <p className="text-[10px] font-bold uppercase" style={{ color: p }}>{ev.year}</p>
                    <h4 className="text-sm font-bold mt-1">{ev.title}</h4>
                    <p className="text-xs mt-1" style={{ color: m }}>{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {(faq?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" style={{ background: sf }}>
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Frequently Asked Questions</h2>
            <div className="space-y-3">{faq?.items?.map(item => (
              <details key={item.id} className="group bg-white border p-5" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <summary className="flex items-center justify-between cursor-pointer text-sm font-bold list-none">
                  {item.question}
                  <ChevronRight size={14} className="group-open:rotate-90 transition-transform" style={{ color: m }} />
                </summary>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: m }}>{item.answer}</p>
              </details>
            ))}</div>
          </div>
        </section>
      )}

      {/* Careers */}
      {(careers?.openings?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="careers">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Careers</p>
            <h2 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: `'${hf}'` }}>Join Our Team</h2>
            <p className="text-sm text-center max-w-xl mx-auto mb-10" style={{ color: m }}>Build your career with a company that values innovation and growth.</p>
            <div className="max-w-3xl mx-auto space-y-3">{careers?.openings?.map(job => (
              <div key={job.id} className="bg-white p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <div>
                  <h4 className="text-sm font-bold">{job.title}</h4>
                  <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: m }}>
                    <Users size={10} /> {job.department} · <MapPin size={10} /> {job.location} · {job.type}
                  </p>
                </div>
                <a href={safeExternalUrl(job.link) || '#contact'} className="px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1" style={{ borderRadius: r, background: p }}>Apply <ArrowUpRight size={12} /></a>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Contact */}
      {contact && (
        <section className="py-20 sm:py-24" id="contact" style={{ background: `linear-gradient(160deg, ${p}, ${p2})` }}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="text-white">
              <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-white/60">Get in Touch</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: `'${hf}'` }}>Let&apos;s Discuss Your Requirements</h2>
              {contact.address && <p className="text-sm flex items-start gap-2 mb-4 text-white/80"><MapPin size={14} className="flex-shrink-0 mt-0.5" />{contact.address}</p>}
              {contact.phone && <a href={`tel:${contact.phone}`} className="text-sm flex items-center gap-2 mb-3 text-white/90 hover:text-white transition"><Phone size={14} />{contact.phone}</a>}
              {contact.email && <a href={`mailto:${contact.email}`} className="text-sm flex items-center gap-2 mb-3 text-white/90 hover:text-white transition"><Mail size={14} />{contact.email}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 mt-4 px-6 py-3 text-sm font-bold rounded-xl bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-all"><MessageCircle size={14} />WhatsApp Us</a>}
            </div>
            {contact.googleMapsEmbed && <div className="overflow-hidden shadow-2xl" style={{ borderRadius: r }}><iframe src={contact.googleMapsEmbed} width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy" /></div>}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 border-t" style={{ borderColor: `${m}08` }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: m }}>
          <div className="flex items-center gap-2">
            {b.logo ? <img src={b.logo} alt="" className="h-6 w-auto opacity-60" /> : <Building2 size={16} style={{ color: p }} />}
            <span>© {new Date().getFullYear()} {b.companyName}. All rights reserved.</span>
          </div>
          <span>Powered by <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a></span>
        </div>
      </footer>
    </div>
  );
}
