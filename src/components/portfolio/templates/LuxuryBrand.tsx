'use client';

import { Phone, Mail, MessageCircle, Diamond, Star, Sparkles, ArrowUpRight, MapPin, ChevronRight } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, TeamMember, TestimonialItem, ProjectItem, GalleryImage, ContactSectionData } from '@/lib/types/portfolio';
import { safeExternalUrl } from '@/lib/safeUrl';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function LuxuryBrand({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const team = getS<{ members: TeamMember[] }>(s, 'team');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const projects = getS<{ items: ProjectItem[] }>(s, 'projects');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const contact = getS<ContactSectionData>(s, 'contact');

  const p = th.primaryColor || '#D97706', p2 = th.secondaryColor || '#92400E';
  const hf = th.headingFont || 'Playfair Display', font = th.fontFamily || 'Cinzel';
  const bg = '#050505', tx = '#F5F5F5', m = '#A3A3A3', sf = '#0A0A0A';
  const gold = p, goldFaint = `${p}15`;
  const borderClr = 'rgba(217,119,6,0.2)';

  return (
    <div style={{ fontFamily: `'${font}', serif`, background: bg, color: tx }} className="min-h-screen">
      {/* Luxury Nav */}
      <header className="border-b sticky top-0 z-30 backdrop-blur-md" style={{ background: 'rgba(5,5,5,0.92)', borderColor: borderClr }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-24">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-10 w-auto" /> : <Diamond size={24} style={{ color: gold }} />}
            <span className="text-lg font-bold tracking-[4px] uppercase" style={{ fontFamily: `'${hf}', serif` }}>{b.companyName}</span>
          </div>
          <nav className="hidden lg:flex gap-6 text-[10px] tracking-[3px] uppercase" style={{ color: m }}>
            {['Collections', 'Atelier', 'Heritage', 'Contact'].map(i => <a key={i} href={`#${i.toLowerCase()}`} className="hover:text-amber-400 transition">{i}</a>)}
          </nav>
          <div className="flex items-center gap-3">
            {contact?.phone && <a href={`tel:${contact.phone}`} className="px-6 py-2.5 border text-xs tracking-[3px] uppercase hover:bg-amber-500/10 transition-all" style={{ borderColor: `${gold}50`, color: gold }}>{contact.whatsapp ? 'Private Concierge' : 'Contact'}</a>}
          </div>
        </div>
      </header>

      {/* Full-Screen Hero */}
      {hero && (
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          {hero.backgroundImage && <div className="absolute inset-0" style={{ backgroundImage: `url(${hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><div className="absolute inset-0 bg-black/70" /></div>}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 25% 25%, ${gold} 1px, transparent 1px), radial-gradient(circle at 75% 75%, ${gold} 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            </div>
            <p className="text-[10px] uppercase tracking-[8px] mb-6" style={{ color: gold }}><Sparkles size={10} className="inline mr-2" />Luxury & Excellence</p>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-wide leading-tight" style={{ fontFamily: `'${hf}', serif` }}>{hero.headline || b.companyName}</h1>
            <p className="text-sm sm:text-base mt-8 max-w-xl mx-auto tracking-widest leading-relaxed" style={{ color: m }}>{hero.subheadline || b.tagline}</p>
            <div className="flex justify-center gap-4 mt-10">
              <a href="#collections" className="px-8 py-3.5 text-xs tracking-[3px] uppercase font-semibold border transition-all hover:bg-amber-500/10" style={{ borderColor: gold, color: gold }}>{hero.ctaText || 'Explore Collection'}</a>
              {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-8 py-3.5 text-xs tracking-[3px] uppercase font-semibold text-black transition-all hover:opacity-90" style={{ background: gold }}>Book Now</a>}
            </div>
            <div className="flex justify-center mt-10">
              <div className="w-16 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
            </div>
          </div>
        </section>
      )}

      {/* Brand Story */}
      {about && (
        <section className="py-24 sm:py-32" id="heritage">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {about.image && (
              <div className="relative">
                <div className="absolute -inset-3 border" style={{ borderColor: borderClr }} />
                <img src={about.image} alt="" className="w-full h-96 object-cover relative z-10" />
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-[6px] mb-4" style={{ color: gold }}>Our Heritage</p>
              <h2 className="text-2xl sm:text-4xl font-normal mb-6 leading-snug" style={{ fontFamily: `'${hf}', serif` }}>{about.mission || 'The Art of Excellence'}</h2>
              <p className="text-sm leading-[1.9] tracking-wide" style={{ color: m }}>{about.content}</p>
              {about.vision && <p className="text-sm leading-[1.9] tracking-wide mt-4 italic" style={{ color: `${gold}80` }}>&ldquo;{about.vision}&rdquo;</p>}
              {(about.founded || about.employees) && (
                <div className="flex gap-8 mt-8 pt-6 border-t" style={{ borderColor: borderClr }}>
                  {about.founded && <div><p className="text-xl font-bold" style={{ color: gold }}>{about.founded}</p><p className="text-[10px] tracking-[3px] uppercase mt-1" style={{ color: m }}>Est.</p></div>}
                  {about.employees && <div><p className="text-xl font-bold" style={{ color: gold }}>{about.employees}</p><p className="text-[10px] tracking-[3px] uppercase mt-1" style={{ color: m }}>Artisans</p></div>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Services — Atelier */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-24 sm:py-32" id="atelier" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] uppercase tracking-[6px] text-center mb-4" style={{ color: gold }}>Atelier Services</p>
            <h2 className="text-2xl sm:text-3xl font-normal text-center mb-16" style={{ fontFamily: `'${hf}', serif` }}>Bespoke Excellence</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">{services?.items?.map(svc => (
              <div key={svc.id} className="p-8 border text-center hover:border-amber-500/50 transition-all" style={{ borderColor: borderClr }}>
                <Sparkles size={20} className="mx-auto mb-4" style={{ color: gold }} />
                <h4 className="text-base font-normal tracking-wider mb-3" style={{ fontFamily: `'${hf}', serif`, color: tx }}>{svc.name}</h4>
                <p className="text-xs leading-relaxed tracking-wide" style={{ color: m }}>{svc.description}</p>
                {svc.price && <p className="text-sm mt-3 tracking-widest" style={{ color: gold }}>From ₹{svc.price}</p>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* The Collection — Products */}
      {(products?.items?.length ?? 0) > 0 && (
        <section className="py-24 sm:py-32" id="collections">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] uppercase tracking-[6px] text-center mb-4" style={{ color: gold }}>The Collection</p>
            <h2 className="text-xl font-normal text-center tracking-[4px] uppercase mb-16" style={{ fontFamily: `'${hf}', serif`, color: gold }}>Curated Selection</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">{products?.items?.map(prod => (
              <div key={prod.id} className="group text-center">
                <div className="border overflow-hidden mb-6 relative" style={{ borderColor: borderClr }}>
                  {prod.image && <img src={prod.image} alt="" className="w-full h-72 object-cover filter contrast-105 group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-base font-normal tracking-wider" style={{ fontFamily: `'${hf}', serif` }}>{prod.name}</h3>
                {prod.description && <p className="text-[10px] mt-1 tracking-wide" style={{ color: m }}>{prod.description}</p>}
                <p className="text-sm mt-2 tracking-[3px]" style={{ color: gold }}>₹{prod.price}</p>
                {prod.whatsappLink && <a href={prod.whatsappLink} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 mt-3 text-[10px] tracking-[2px] uppercase" style={{ color: gold }}>Enquire <ArrowUpRight size={10} /></a>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {(gallery?.images?.length ?? 0) > 0 && (
        <section className="py-24 sm:py-32" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-xl font-normal text-center tracking-[4px] uppercase mb-16" style={{ fontFamily: `'${hf}', serif`, color: gold }}>Visual Story</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{gallery?.images?.map(img => (
              <div key={img.id} className="overflow-hidden border group" style={{ borderColor: borderClr }}>
                <img src={img.url} alt={img.caption} className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-700 filter contrast-105" />
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Projects / Showcase */}
      {(projects?.items?.length ?? 0) > 0 && (
        <section className="py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-xl font-normal text-center tracking-[4px] uppercase mb-16" style={{ fontFamily: `'${hf}', serif`, color: gold }}>Featured Work</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">{projects?.items?.map(proj => (
              <div key={proj.id} className="border overflow-hidden group" style={{ borderColor: borderClr }}>
                {proj.image && <div className="overflow-hidden"><img src={proj.image} alt="" className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-700" /></div>}
                <div className="p-6">
                  <h4 className="text-base font-normal tracking-wider" style={{ fontFamily: `'${hf}', serif` }}>{proj.title}</h4>
                  <p className="text-xs mt-2 tracking-wide leading-relaxed" style={{ color: m }}>{proj.description}</p>
                  {proj.client && <p className="text-[10px] mt-3 tracking-[2px] uppercase" style={{ color: gold }}>For {proj.client}</p>}
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Team */}
      {(team?.members?.length ?? 0) > 0 && (
        <section className="py-24 sm:py-32" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-xl font-normal text-center tracking-[4px] uppercase mb-16" style={{ fontFamily: `'${hf}', serif`, color: gold }}>The Artisans</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">{team?.members?.map(mem => (
              <div key={mem.id} className="text-center group">
                <div className="w-24 h-24 mx-auto overflow-hidden border mb-4" style={{ borderColor: borderClr }}>
                  {mem.photo ? <img src={mem.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ background: goldFaint, color: gold }}>{mem.name[0]}</div>}
                </div>
                <h4 className="text-sm font-normal tracking-wider">{mem.name}</h4>
                <p className="text-[10px] tracking-[2px] uppercase mt-1" style={{ color: gold }}>{mem.role}</p>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {(testimonials?.items?.length ?? 0) > 0 && (
        <section className="py-24 sm:py-32">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-xl font-normal text-center tracking-[4px] uppercase mb-16" style={{ fontFamily: `'${hf}', serif`, color: gold }}>Client Voices</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">{testimonials?.items?.map(t2 => (
              <div key={t2.id} className="p-8 border" style={{ borderColor: borderClr }}>
                <div className="flex gap-1 mb-4">{Array.from({length: t2.rating || 5}).map((_, i) => <Star key={i} size={12} fill={gold} style={{ color: gold }} />)}</div>
                <p className="text-sm italic leading-relaxed tracking-wide" style={{ color: m }}>&ldquo;{t2.content}&rdquo;</p>
                <div className="flex items-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: borderClr }}>
                  {t2.photo && <img src={t2.photo} alt="" className="w-10 h-10 object-cover" style={{ border: `1px solid ${borderClr}` }} />}
                  <div><p className="text-xs tracking-wider">{t2.name}</p><p className="text-[10px] tracking-[2px] uppercase" style={{ color: gold }}>{t2.role}</p></div>
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Contact */}
      {contact && (
        <section className="py-24 sm:py-32" id="contact" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <p className="text-[10px] uppercase tracking-[6px] mb-4" style={{ color: gold }}>Contact</p>
              <h2 className="text-2xl sm:text-3xl font-normal mb-8" style={{ fontFamily: `'${hf}', serif` }}>Private Enquiries</h2>
              {contact.address && <p className="text-sm flex items-start gap-3 mb-4 tracking-wide" style={{ color: m }}><MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: gold }} />{contact.address}</p>}
              {contact.phone && <a href={`tel:${contact.phone}`} className="text-sm flex items-center gap-3 mb-3 tracking-wide hover:opacity-80 transition" style={{ color: gold }}><Phone size={14} />{contact.phone}</a>}
              {contact.email && <a href={`mailto:${contact.email}`} className="text-sm flex items-center gap-3 mb-3 tracking-wide hover:opacity-80 transition" style={{ color: gold }}><Mail size={14} />{contact.email}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 mt-6 px-7 py-3 text-xs tracking-[3px] uppercase border transition-all hover:bg-amber-500/10" style={{ borderColor: gold, color: gold }}><MessageCircle size={14} />WhatsApp</a>}
            </div>
            {contact.googleMapsEmbed && <div className="overflow-hidden border" style={{ borderColor: borderClr }}><iframe src={contact.googleMapsEmbed} width="100%" height="350" style={{ border: 0, filter: 'invert(0.9) hue-rotate(180deg) saturate(0.3)' }} allowFullScreen loading="lazy" /></div>}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-14 border-t" style={{ borderColor: borderClr }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className="flex justify-center"><div className="w-12 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} /></div>
          <span className="text-[10px] tracking-[5px] uppercase" style={{ color: m }}>© {new Date().getFullYear()} {b.companyName}</span>
          <span className="text-[9px] tracking-[3px] uppercase" style={{ color: `${m}60` }}>Powered by <a href="https://thenijobs.com" style={{ color: gold }}>THENIJOBS</a></span>
        </div>
      </footer>
    </div>
  );
}
