'use client';
import { Phone, MessageCircle, MapPin, Clock, Navigation, Star, Mail } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, GalleryImage, TestimonialItem, ContactSectionData } from '@/lib/types/portfolio';
interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function LocalBusinessPro({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const hours = getS<{ schedule: { day: string; hours: string; closed: boolean }[] }>(s, 'working-hours');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const contact = getS<ContactSectionData>(s, 'contact');
  const p = th.primaryColor || '#EA580C', bg = th.backgroundColor || '#FFF', tx = th.textColor || '#111';
  const m = th.textMutedColor || '#6B7280', sf = th.surfaceColor || '#FFF7ED', hf = th.headingFont || 'Poppins';
  const r = '12px';

  return (
    <div style={{ fontFamily: `'${th.fontFamily||'Inter'}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* Compact Header */}
      <nav className="sticky top-0 z-30 border-b" style={{ background: bg, borderColor: `${m}10` }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            {b.logo ? <img src={b.logo} alt="" className="h-8 w-auto rounded" /> : <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: p }}>{b.companyName?.[0]||'L'}</div>}
            <span className="text-sm font-bold" style={{ fontFamily: `'${hf}'` }}>{b.companyName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {contact?.phone && <a href={`tel:${contact.phone}`} className="p-2 rounded-lg" style={{ background: `${p}10`, color: p }}><Phone size={16} /></a>}
            {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="p-2 rounded-lg text-white" style={{ background: '#25D366' }}><MessageCircle size={16} /></a>}
            {contact?.googleMapsEmbed && <a href={`https://maps.google.com/?q=${encodeURIComponent(contact.address||b.companyName||'')}`} target="_blank" rel="noopener" className="p-2 rounded-lg" style={{ background: `${p}10`, color: p }}><Navigation size={16} /></a>}
          </div>
        </div>
      </nav>

      {/* Hero with Location Focus */}
      {hero && (
        <section className="relative py-14 sm:py-20" style={{ background: `linear-gradient(135deg, ${p}, ${p}CC)` }}>
          <div className="max-w-5xl mx-auto px-4 text-center text-white">
            <h1 className="text-2xl sm:text-4xl font-bold" style={{ fontFamily: `'${hf}'` }}>{hero.headline || b.companyName}</h1>
            <p className="text-sm mt-2 opacity-90">{hero.subheadline || b.tagline}</p>
            {contact?.address && (
              <div className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-xs">
                <MapPin size={12} /> {contact.address}
              </div>
            )}
            <div className="flex justify-center gap-3 mt-6">
              {contact?.phone && <a href={`tel:${contact.phone}`} className="px-5 py-2.5 bg-white text-sm font-bold flex items-center gap-1.5" style={{ borderRadius: r, color: p }}><Phone size={14} /> Call Now</a>}
              {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-5 py-2.5 text-sm font-bold text-white flex items-center gap-1.5" style={{ borderRadius: r, background: '#25D366' }}><MessageCircle size={14} /> WhatsApp</a>}
            </div>
          </div>
        </section>
      )}

      {/* Working Hours */}
      {(hours?.schedule?.length ?? 0) > 0 && (
        <section className="py-10" style={{ background: sf }}>
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-base font-bold text-center mb-4 flex items-center justify-center gap-2" style={{ fontFamily: `'${hf}'` }}><Clock size={16} style={{ color: p }} /> Working Hours</h2>
            <div className="bg-white border p-4 max-w-md mx-auto" style={{ borderRadius: r, borderColor: `${m}10` }}>
              {hours?.schedule?.map(day => (
                <div key={day.day} className="flex items-center justify-between py-2 border-b last:border-b-0 text-xs" style={{ borderColor: `${m}08` }}>
                  <span className="font-semibold">{day.day}</span>
                  <span style={{ color: day.closed ? '#DC2626' : m }}>{day.closed ? 'Closed' : day.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {about && (
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {about.image && <img src={about.image} alt="" className="w-full h-60 object-cover shadow-lg" style={{ borderRadius: r }} />}
            <div>
              <h2 className="text-lg font-bold mb-2" style={{ fontFamily: `'${hf}'` }}>About Us</h2>
              <p className="text-sm leading-relaxed" style={{ color: m }}>{about.content}</p>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-12" style={{ background: sf }}>
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-lg font-bold text-center mb-6" style={{ fontFamily: `'${hf}'` }}>Our Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services?.items?.map(svc => (
                <div key={svc.id} className="bg-white p-4 border flex items-start gap-3 hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ background: p }}>{svc.name[0]}</div>
                  <div><h4 className="text-xs font-bold">{svc.name}</h4><p className="text-[10px] mt-0.5" style={{ color: m }}>{svc.description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      {(products?.items?.length ?? 0) > 0 && (
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-lg font-bold text-center mb-6" style={{ fontFamily: `'${hf}'` }}>Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{products?.items?.map(prod => (
              <div key={prod.id} className="bg-white border overflow-hidden" style={{ borderRadius: r, borderColor: `${m}10` }}>
                {prod.image && <img src={prod.image} alt="" className="w-full h-32 object-cover" />}
                <div className="p-2.5"><h4 className="text-xs font-bold">{prod.name}</h4><p className="text-sm font-bold mt-0.5" style={{ color: p }}>₹{prod.price}</p></div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Reviews */}
      {(testimonials?.items?.length ?? 0) > 0 && (
        <section className="py-12" style={{ background: sf }}>
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-lg font-bold text-center mb-6" style={{ fontFamily: `'${hf}'` }}>Customer Reviews</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{testimonials?.items?.map(r2 => (
              <div key={r2.id} className="bg-white p-4 border" style={{ borderRadius: r, borderColor: `${m}10` }}>
                <div className="flex gap-0.5 mb-1">{Array.from({length:r2.rating||5}).map((_,i)=><Star key={i} size={11} fill="#FBBF24" className="text-yellow-400" />)}</div>
                <p className="text-xs italic" style={{ color: m }}>&ldquo;{r2.content}&rdquo;</p>
                <p className="text-xs font-bold mt-2">{r2.name}</p>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Map + Contact */}
      {contact && (
        <section className="py-12" id="contact">
          <div className="max-w-5xl mx-auto px-4">
            {contact.googleMapsEmbed && <div className="overflow-hidden shadow-lg mb-6" style={{ borderRadius: r }}><iframe src={contact.googleMapsEmbed} width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy" /></div>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {contact.phone && <a href={`tel:${contact.phone}`} className="p-4 border hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}><Phone size={18} className="mx-auto mb-1" style={{ color: p }} /><p className="text-[10px] font-semibold" style={{ color: m }}>Call</p><p className="text-xs font-bold" style={{ color: p }}>{contact.phone}</p></a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="p-4 border hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}><MessageCircle size={18} className="mx-auto mb-1 text-green-500" /><p className="text-[10px] font-semibold" style={{ color: m }}>WhatsApp</p><p className="text-xs font-bold text-green-600">Chat</p></a>}
              {contact.email && <a href={`mailto:${contact.email}`} className="p-4 border hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}><Mail size={18} className="mx-auto mb-1" style={{ color: p }} /><p className="text-[10px] font-semibold" style={{ color: m }}>Email</p><p className="text-xs font-bold" style={{ color: p }}>Send</p></a>}
              <a href={`https://maps.google.com/?q=${encodeURIComponent(contact.address||'')}`} target="_blank" rel="noopener" className="p-4 border hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}10` }}><Navigation size={18} className="mx-auto mb-1" style={{ color: p }} /><p className="text-[10px] font-semibold" style={{ color: m }}>Directions</p><p className="text-xs font-bold" style={{ color: p }}>Navigate</p></a>
            </div>
          </div>
        </section>
      )}

      <footer className="py-5 border-t text-center text-xs" style={{ borderColor: `${m}10`, color: m }}>
        © {new Date().getFullYear()} {b.companyName} · <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a>
      </footer>
    </div>
  );
}
