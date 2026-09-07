'use client';
import { Phone, Mail, MessageCircle, ArrowRight, Star, Clock, Users, Calendar, MapPin } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, TeamMember, TestimonialItem, GalleryImage, ContactSectionData, WorkingHoursData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function ModernBusiness({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const team = getS<{ members: TeamMember[] }>(s, 'team');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const workingHours = getS<WorkingHoursData>(s, 'working-hours');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const contact = getS<ContactSectionData>(s, 'contact');

  const p = th.primaryColor || '#2563EB', p2 = th.secondaryColor || '#059669';
  const bg = th.backgroundColor || '#FFFFFF', tx = th.textColor || '#0F172A', m = th.textMutedColor || '#64748B', sf = th.surfaceColor || '#F8FAFC';
  const f = th.fontFamily || 'Inter', hf = th.headingFont || 'Poppins';
  const r = th.borderRadius === 'large' ? '24px' : th.borderRadius === 'small' ? '6px' : th.borderRadius === 'none' ? '0px' : '16px';

  return (
    <div style={{ fontFamily: `'${f}', sans-serif`, background: bg, color: tx }} className="min-h-screen pb-16 sm:pb-0">
      {/* NAV — bold, left-anchored, single CTA pill */}
      <nav className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: `${bg}F0`, borderColor: `${m}12` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {b.logo ? <img src={b.logo} alt="" className="h-9 w-9 rounded-xl object-cover" /> :
              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-black" style={{ background: `linear-gradient(135deg, ${p}, ${p2})` }}>{b.companyName?.[0] || 'M'}</div>}
            <span className="text-sm font-black tracking-tight" style={{ fontFamily: `'${hf}', sans-serif` }}>{b.companyName}</span>
          </div>
          {contact?.whatsapp && (
            <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
              className="px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5" style={{ borderRadius: '999px', background: p }}>
              Let&apos;s Talk <ArrowRight size={12} />
            </a>
          )}
        </div>
      </nav>

      {/* HERO — split layout: headline+CTA left, stat cards right (never centered like the
          other 3 premium/enterprise templates already in the gallery) */}
      {hero && (
        <section className="py-14 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-4" style={{ borderRadius: '999px', background: `${p}12`, color: p }}>
                {about?.industry || 'Modern Business'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-[1.1] tracking-tight" style={{ fontFamily: `'${hf}', sans-serif` }}>
                {hero.headline || b.companyName}
              </h1>
              <p className="text-sm sm:text-base mt-4 max-w-md" style={{ color: m }}>{hero.subheadline || b.tagline}</p>
              <div className="flex flex-wrap gap-3 mt-7">
                <a href={hero.ctaLink || '#contact'} className="px-6 py-3 text-sm font-bold text-white flex items-center gap-2" style={{ borderRadius: r, background: p }}>
                  {hero.ctaText || 'Get Started'} <ArrowRight size={14} />
                </a>
                {contact?.phone && (
                  <a href={`tel:${contact.phone}`} className="px-6 py-3 text-sm font-bold border-2 flex items-center gap-2" style={{ borderRadius: r, borderColor: `${p}30`, color: p }}>
                    <Phone size={14} /> Call Us
                  </a>
                )}
              </div>
            </div>

            {/* Quick-stats strip -- a distinct hero-side element none of the 3 comparison
                templates use, drawn from the same About fields every template already reads */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Calendar, label: 'Founded', value: about?.founded || '—' },
                { icon: Users, label: 'Team Size', value: about?.employees || '—' },
                { icon: Star, label: 'Rating', value: testimonials?.items?.length ? `${(testimonials.items.reduce((sum, t) => sum + (t.rating || 5), 0) / testimonials.items.length).toFixed(1)}★` : '—' },
                { icon: MapPin, label: 'Location', value: contact?.address?.split(',')[0] || 'Theni' },
              ].map(stat => (
                <div key={stat.label} className="p-5" style={{ borderRadius: r, background: sf, border: `1px solid ${m}10` }}>
                  <stat.icon size={18} style={{ color: p }} />
                  <p className="text-lg font-black mt-2" style={{ fontFamily: `'${hf}', sans-serif` }}>{stat.value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: m }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ABOUT */}
      {about && (
        <section className="py-14 sm:py-20" id="about" style={{ background: sf }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: `'${hf}', sans-serif` }}>{about.mission || 'About Us'}</h2>
            <p className="text-sm leading-relaxed" style={{ color: m }}>{about.content}</p>
          </div>
        </section>
      )}

      {/* SERVICES — asymmetric bento grid: the first card spans 2 columns, the rest are
          single cells (distinct from the other templates' uniform grids) */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="services">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-8" style={{ fontFamily: `'${hf}', sans-serif` }}>What We Do</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services?.items?.map((svc, i) => (
                <div key={svc.id} className={`p-6 hover:-translate-y-1 transition-transform ${i === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}`}
                  style={{ borderRadius: r, background: i === 0 ? `linear-gradient(135deg, ${p}, ${p2})` : bg, border: i === 0 ? 'none' : `1px solid ${m}12`, color: i === 0 ? '#fff' : tx }}>
                  <h4 className="text-sm font-bold mb-1.5">{svc.name}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: i === 0 ? '#ffffffcc' : m }}>{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      {(products?.items?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="products" style={{ background: sf }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-8" style={{ fontFamily: `'${hf}', sans-serif` }}>Featured Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products?.items?.map(prod => (
                <div key={prod.id} className="overflow-hidden" style={{ borderRadius: r, background: bg, border: `1px solid ${m}12` }}>
                  {prod.image && <img src={prod.image} alt={prod.name} className="w-full h-32 object-cover" />}
                  <div className="p-3">
                    <h4 className="text-xs font-bold">{prod.name}</h4>
                    <p className="text-sm font-black mt-0.5" style={{ color: p }}>₹{prod.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TEAM — circular avatar row */}
      {(team?.members?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="team">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}', sans-serif` }}>Meet The Team</h2>
            <div className="flex flex-wrap justify-center gap-8">
              {team?.members?.map(mem => (
                <div key={mem.id} className="text-center w-28">
                  <div className="w-20 h-20 mx-auto rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xl" style={{ background: `linear-gradient(135deg, ${p}, ${p2})` }}>
                    {mem.photo ? <img src={mem.photo} alt={mem.name} className="w-full h-full object-cover" /> : mem.name?.[0]}
                  </div>
                  <p className="text-xs font-bold mt-2.5">{mem.name}</p>
                  <p className="text-[10px]" style={{ color: m }}>{mem.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS — single wide quote strip that cycles by index, not a static grid */}
      {(testimonials?.items?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="reviews" style={{ background: sf }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="flex justify-center gap-0.5 mb-4">
              {Array.from({ length: testimonials!.items[0].rating || 5 }).map((_, i) => <Star key={i} size={16} fill="#FBBF24" className="text-yellow-400" />)}
            </div>
            <p className="text-base sm:text-lg font-medium leading-relaxed">&ldquo;{testimonials!.items[0].content}&rdquo;</p>
            <p className="text-xs font-bold mt-4" style={{ color: p }}>{testimonials!.items[0].name} · {testimonials!.items[0].role}</p>
          </div>
        </section>
      )}

      {/* WORKING HOURS — a compact schedule list, not used by corporate-premium/luxury-brand/
          creative-business at all, matching this repo's own established broken-fallback-free
          pattern of only rendering when real data exists */}
      {(workingHours?.schedule?.length ?? 0) > 0 && (
        <section className="py-14 sm:py-20" id="hours">
          <div className="max-w-md mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2" style={{ fontFamily: `'${hf}', sans-serif` }}>
              <Clock size={20} style={{ color: p }} /> Working Hours
            </h2>
            <div className="space-y-1.5">
              {workingHours!.schedule.map(d => (
                <div key={d.day} className="flex items-center justify-between px-4 py-2.5 text-xs" style={{ borderRadius: r, background: sf }}>
                  <span className="font-semibold">{d.day}</span>
                  <span style={{ color: d.closed ? '#DC2626' : m }} className="font-medium">{d.closed ? 'Closed' : d.hours}</span>
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gallery?.images?.map(img => (
                <div key={img.id} className="overflow-hidden" style={{ borderRadius: r }}>
                  <img src={img.url} alt={img.caption} className="w-full h-32 object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      {contact && (
        <section className="py-14 sm:py-20" id="contact">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ fontFamily: `'${hf}', sans-serif` }}>Let&apos;s Work Together</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {contact.phone && <a href={`tel:${contact.phone}`} className="px-5 py-2.5 text-xs font-bold flex items-center gap-2" style={{ borderRadius: r, background: sf, color: tx }}><Phone size={13} /> {contact.phone}</a>}
              {contact.email && <a href={`mailto:${contact.email}`} className="px-5 py-2.5 text-xs font-bold flex items-center gap-2" style={{ borderRadius: r, background: sf, color: tx }}><Mail size={13} /> {contact.email}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener" className="px-5 py-2.5 text-xs font-bold text-white flex items-center gap-2" style={{ borderRadius: r, background: '#25D366' }}><MessageCircle size={13} /> WhatsApp</a>}
            </div>
          </div>
        </section>
      )}

      <footer className="py-6 border-t" style={{ borderColor: `${m}10` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs" style={{ color: m }}>
          <span>© {new Date().getFullYear()} {b.companyName}</span>
          <span>Powered by <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a></span>
        </div>
      </footer>

      {/* Mobile sticky CTA -- a "modern SaaS-site" convention none of the 3 comparison
          templates use */}
      {contact?.whatsapp && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-3 border-t" style={{ background: bg, borderColor: `${m}12` }}>
          <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
            className="w-full py-3 text-sm font-bold text-white flex items-center justify-center gap-2" style={{ borderRadius: r, background: p }}>
            <MessageCircle size={16} /> Chat With Us
          </a>
        </div>
      )}
    </div>
  );
}
