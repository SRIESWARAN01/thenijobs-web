'use client';

import { Phone, Mail, MessageCircle, ChevronRight, MapPin, Star, ArrowRight, Quote } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, GalleryImage, TestimonialItem, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function ProfessionalCompany({ site }: Props) {
  const { theme: t, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const contact = getS<ContactSectionData>(s, 'contact');

  const p = t.primaryColor || '#0F766E', bg = t.backgroundColor || '#FFF', tx = t.textColor || '#111827';
  const m = t.textMutedColor || '#6B7280', sf = t.surfaceColor || '#F0FDFA';
  const f = t.fontFamily || 'Inter', hf = t.headingFont || 'Poppins';
  const r = t.borderRadius === 'large' ? '20px' : t.borderRadius === 'small' ? '4px' : '12px';

  return (
    <div style={{ fontFamily: `'${f}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* NAV */}
      <nav className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: `${bg}F0`, borderColor: `${m}10` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {b.logo ? <img src={b.logo} alt="" className="h-9 w-auto rounded-lg" /> :
              <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: p }}>{b.companyName?.[0] || 'P'}</div>}
            <span className="text-sm font-bold" style={{ fontFamily: `'${hf}', sans-serif` }}>{b.companyName}</span>
          </div>
          <div className="hidden md:flex gap-5 text-xs font-medium" style={{ color: m }}>
            {['About', 'Services', 'Products', 'Reviews', 'Contact'].map(i => <a key={i} href={`#${i.toLowerCase()}`} className="hover:opacity-70">{i}</a>)}
          </div>
          <div className="flex items-center gap-2">
            {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: p }}>Get Quote</a>}
          </div>
        </div>
      </nav>

      {/* HERO */}
      {hero && (
        <section className="relative py-20 sm:py-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${p}08, ${p}15)` }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight" style={{ fontFamily: `'${hf}', sans-serif` }}>{hero.headline || b.companyName}</h1>
            <p className="text-sm sm:text-base mt-4 max-w-2xl mx-auto" style={{ color: m }}>{hero.subheadline || b.tagline}</p>
            <div className="flex justify-center gap-3 mt-6">
              <a href="#services" className="px-6 py-3 text-sm font-bold text-white flex items-center gap-2" style={{ borderRadius: r, background: p }}>Our Services <ArrowRight size={14} /></a>
              <a href="#contact" className="px-6 py-3 text-sm font-semibold border-2" style={{ borderRadius: r, borderColor: `${p}30`, color: p }}>Contact Us</a>
            </div>
          </div>
        </section>
      )}

      {/* ABOUT */}
      {about && (
        <section className="py-14 sm:py-20" id="about">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {about.image && <div style={{ borderRadius: r }} className="overflow-hidden shadow-lg"><img src={about.image} alt="" className="w-full h-72 object-cover" /></div>}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[2px] mb-2" style={{ color: p }}>About Us</p>
              <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: `'${hf}', sans-serif` }}>{about.mission || 'Our Story'}</h2>
              <p className="text-sm leading-relaxed" style={{ color: m }}>{about.content}</p>
            </div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="services" style={{ background: sf }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}', sans-serif` }}>Our Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services?.items?.map(svc => (
                <div key={svc.id} className="bg-white p-5 border hover:shadow-lg hover:-translate-y-0.5 transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}>
                  {svc.image && <img src={svc.image} alt={svc.name} className="w-full h-36 object-cover rounded-lg mb-3" />}
                  <h4 className="text-sm font-bold mb-1">{svc.name}</h4>
                  <p className="text-xs" style={{ color: m }}>{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      {(products?.items?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="products">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}', sans-serif` }}>Our Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products?.items?.map(prod => (
                <div key={prod.id} className="bg-white border overflow-hidden hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}>
                  {prod.image && <img src={prod.image} alt={prod.name} className="w-full h-36 object-cover" />}
                  <div className="p-3">
                    <h4 className="text-xs font-bold mb-0.5">{prod.name}</h4>
                    <p className="text-sm font-bold" style={{ color: p }}>₹{prod.price}</p>
                    <a href={prod.whatsappLink || `https://wa.me/${contact?.whatsapp?.replace(/\D/g, '')}?text=I'm interested in: ${prod.name}`} target="_blank" rel="noopener"
                      className="mt-2 w-full py-1.5 text-[10px] font-bold text-white flex items-center justify-center gap-1" style={{ borderRadius: r, background: '#25D366' }}>
                      <MessageCircle size={10} /> Order
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY */}
      {(gallery?.images?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="gallery" style={{ background: sf }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}', sans-serif` }}>Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery?.images?.map(img => (
                <div key={img.id} className="overflow-hidden shadow-sm hover:shadow-lg transition-all" style={{ borderRadius: r }}>
                  <img src={img.url} alt={img.caption} className="w-full h-44 object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {(testimonials?.items?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="reviews">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}', sans-serif` }}>What Our Clients Say</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials?.items?.map(rev => (
                <div key={rev.id} className="bg-white p-5 border" style={{ borderRadius: r, borderColor: `${m}10` }}>
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => <Star key={i} size={12} fill="#FBBF24" className="text-yellow-400" />)}
                  </div>
                  <p className="text-xs italic leading-relaxed" style={{ color: m }}>"{rev.content}"</p>
                  <div className="flex items-center gap-2 mt-3">
                    {rev.photo && <img src={rev.photo} alt="" className="w-8 h-8 rounded-full object-cover" />}
                    <div>
                      <p className="text-xs font-bold">{rev.name}</p>
                      <p className="text-[10px]" style={{ color: m }}>{rev.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      {contact && (
        <section className="py-14 sm:py-20" id="contact" style={{ background: sf }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ fontFamily: `'${hf}', sans-serif` }}>Contact Us</h2>
              {contact.address && <p className="text-sm flex items-start gap-2 mb-2" style={{ color: m }}><MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: p }} /> {contact.address}</p>}
              {contact.phone && <a href={`tel:${contact.phone}`} className="text-sm flex items-center gap-2 mb-2" style={{ color: p }}><Phone size={14} /> {contact.phone}</a>}
              {contact.email && <a href={`mailto:${contact.email}`} className="text-sm flex items-center gap-2 mb-2" style={{ color: p }}><Mail size={14} /> {contact.email}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl text-white text-xs font-bold" style={{ background: '#25D366' }}><MessageCircle size={14} /> WhatsApp Chat</a>}
            </div>
            {contact.googleMapsEmbed && <div className="overflow-hidden shadow-lg" style={{ borderRadius: r }}><iframe src={contact.googleMapsEmbed} width="100%" height="300" style={{ border: 0 }} allowFullScreen loading="lazy" /></div>}
          </div>
        </section>
      )}

      <footer className="py-6 border-t" style={{ borderColor: `${m}10` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs" style={{ color: m }}>
          <span>© {new Date().getFullYear()} {b.companyName}</span>
          <span>Powered by <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a></span>
        </div>
      </footer>
    </div>
  );
}
