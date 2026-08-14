'use client';
import { Phone, MessageCircle, ChevronRight, ShoppingBag, Star, Tag, Grid } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, GalleryImage, TestimonialItem, ContactSectionData } from '@/lib/types/portfolio';
interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function BusinessShowcase({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const contact = getS<ContactSectionData>(s, 'contact');
  const p = th.primaryColor || '#DC2626', bg = th.backgroundColor || '#FFF', tx = th.textColor || '#111';
  const m = th.textMutedColor || '#6B7280', sf = th.surfaceColor || '#FEF2F2', hf = th.headingFont || 'Poppins';
  const r = '14px';

  return (
    <div style={{ fontFamily: `'${th.fontFamily||'Inter'}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* Header */}
      <nav className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: `${bg}F0`, borderColor: `${m}10` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {b.logo ? <img src={b.logo} alt="" className="h-9 w-auto rounded-lg" /> : <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: p }}>{b.companyName?.[0]||'B'}</div>}
            <span className="text-sm font-bold" style={{ fontFamily: `'${hf}'` }}>{b.companyName}</span>
          </div>
          <div className="flex items-center gap-2">
            {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-4 py-2 text-xs font-bold text-white" style={{ borderRadius: r, background: p }}><ShoppingBag size={13} className="inline mr-1" />Shop Now</a>}
          </div>
        </div>
      </nav>
      {/* Hero with product focus */}
      {hero && (
        <section className="py-16 sm:py-24 text-center" style={{ background: `linear-gradient(180deg, ${sf}, ${bg})` }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mb-3" style={{ background: `${p}15`, color: p }}><Tag size={10} /> Best Products & Services</div>
            <h1 className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: `'${hf}'` }}>{hero.headline || b.companyName}</h1>
            <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: m }}>{hero.subheadline || b.tagline}</p>
            <div className="flex justify-center gap-3 mt-6">
              <a href="#products" className="px-6 py-3 text-sm font-bold text-white" style={{ borderRadius: r, background: p }}>View Products</a>
              <a href="#services" className="px-6 py-3 text-sm font-semibold border-2" style={{ borderRadius: r, borderColor: `${p}30`, color: p }}>Our Services</a>
            </div>
          </div>
        </section>
      )}
      {/* Products Grid */}
      {(products?.items?.length ?? 0) > 0 && (
        <section className="py-14" id="products">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold text-center mb-2" style={{ fontFamily: `'${hf}'` }}>Featured Products</h2>
            <p className="text-xs text-center mb-8" style={{ color: m }}>Explore our best-selling products</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products?.items?.map(prod => (
                <div key={prod.id} className="bg-white border overflow-hidden group hover:shadow-xl transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}>
                  {prod.image && <div className="overflow-hidden"><img src={prod.image} alt={prod.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
                  <div className="p-3">
                    {prod.category && <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${p}10`, color: p }}>{prod.category}</span>}
                    <h4 className="text-xs font-bold mt-1.5">{prod.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold" style={{ color: p }}>₹{prod.price}</span>
                      {prod.originalPrice && <span className="text-[10px] line-through" style={{ color: m }}>₹{prod.originalPrice}</span>}
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      <a href={prod.whatsappLink || `https://wa.me/${contact?.whatsapp?.replace(/\D/g,'')}?text=Order: ${prod.name}`} target="_blank" rel="noopener" className="flex-1 py-1.5 text-[10px] font-bold text-white text-center" style={{ borderRadius: r, background: '#25D366' }}>WhatsApp</a>
                      {contact?.phone && <a href={`tel:${contact.phone}`} className="py-1.5 px-2 text-[10px] font-semibold border text-center" style={{ borderRadius: r, borderColor: `${m}20`, color: p }}><Phone size={10} /></a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Services */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-14" id="services" style={{ background: sf }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}'` }}>Our Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services?.items?.map(svc => (
                <div key={svc.id} className="bg-white p-5 border hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}>
                  {svc.image && <img src={svc.image} alt={svc.name} className="w-full h-32 object-cover rounded-lg mb-3" />}
                  <h4 className="text-sm font-bold">{svc.name}</h4>
                  <p className="text-xs mt-1" style={{ color: m }}>{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Testimonials */}
      {(testimonials?.items?.length ?? 0) > 0 && (
        <section className="py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}'` }}>Customer Reviews</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials?.items?.map(r2 => (
                <div key={r2.id} className="bg-white p-5 border" style={{ borderRadius: r, borderColor: `${m}10` }}>
                  <div className="flex gap-0.5 mb-2">{Array.from({length:r2.rating||5}).map((_,i) => <Star key={i} size={12} fill="#FBBF24" className="text-yellow-400" />)}</div>
                  <p className="text-xs italic" style={{ color: m }}>"{r2.content}"</p>
                  <p className="text-xs font-bold mt-2">{r2.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Gallery */}
      {(gallery?.images?.length ?? 0) > 0 && (
        <section className="py-14" style={{ background: sf }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}'` }}>Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{gallery?.images?.map(img => <div key={img.id} className="overflow-hidden shadow-sm" style={{ borderRadius: r }}><img src={img.url} alt="" className="w-full h-44 object-cover hover:scale-105 transition-transform" /></div>)}</div>
          </div>
        </section>
      )}
      {/* Contact + Footer */}
      {contact && (
        <section className="py-14" id="contact">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: `'${hf}'` }}>Get In Touch</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {contact.phone && <a href={`tel:${contact.phone}`} className="px-5 py-3 border text-sm font-semibold" style={{ borderRadius: r, color: p, borderColor: `${m}20` }}><Phone size={14} className="inline mr-1" />{contact.phone}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-5 py-3 text-sm font-bold text-white" style={{ borderRadius: r, background: '#25D366' }}><MessageCircle size={14} className="inline mr-1" />WhatsApp</a>}
            </div>
          </div>
        </section>
      )}
      <footer className="py-6 border-t text-center text-xs" style={{ borderColor: `${m}10`, color: m }}>
        © {new Date().getFullYear()} {b.companyName} · Powered by <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a>
      </footer>
    </div>
  );
}
