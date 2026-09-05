'use client';
import { Phone, MessageCircle, ChevronRight, Star, Banknote, Search } from 'lucide-react';
import { useState } from 'react';
import type { PortfolioSite, PortfolioSection, ServiceItem, TestimonialItem, ContactSectionData, FAQItem } from '@/lib/types/portfolio';
interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function ServiceMarketplace({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const faq = getS<{ items: FAQItem[] }>(s, 'faq');
  const contact = getS<ContactSectionData>(s, 'contact');
  const p = th.primaryColor || '#7C3AED', bg = th.backgroundColor || '#FFF', tx = th.textColor || '#111';
  const m = th.textMutedColor || '#6B7280', sf = th.surfaceColor || '#F5F3FF', hf = th.headingFont || 'Poppins';
  const r = '16px';
  const [search, setSearch] = useState('');
  const allServices = services?.items || [];
  const filtered = allServices.filter(svc => !search || svc.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: `'${th.fontFamily||'Inter'}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      <nav className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: `${bg}F0`, borderColor: `${m}08` }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {b.logo ? <img src={b.logo} alt="" className="h-9 w-auto rounded-lg" /> : <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: p }}>{b.companyName?.[0]||'S'}</div>}
            <span className="text-sm font-bold" style={{ fontFamily: `'${hf}'` }}>{b.companyName}</span>
          </div>
          <div className="flex gap-2">{contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-4 py-2 text-xs font-bold text-white" style={{ borderRadius: r, background: p }}>Book Now</a>}</div>
        </div>
      </nav>

      {hero && (<section className="py-16 sm:py-24 text-center" style={{ background: `linear-gradient(180deg, ${sf}, ${bg})` }}>
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-3xl sm:text-5xl font-bold" style={{ fontFamily: `'${hf}'` }}>{hero.headline || `${b.companyName} Services`}</h1>
          <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: m }}>{hero.subheadline || 'Professional services tailored to your needs'}</p>
          <div className="relative max-w-md mx-auto mt-6"><Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: m }} /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..." className="w-full pl-10 pr-4 py-3 bg-white border text-base sm:text-sm shadow-sm" style={{ borderRadius: r, borderColor: `${m}15` }} /></div>
        </div>
      </section>)}

      {filtered.length > 0 && (<section className="py-12" id="services">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map(svc => (
            <div key={svc.id} className="bg-white border overflow-hidden group hover:shadow-xl transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${p}, ${th.secondaryColor||'#EC4899'})` }} />
              {svc.image && <div className="overflow-hidden"><img src={svc.image} alt={svc.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
              <div className="p-5">
                <h4 className="text-base font-bold mb-1" style={{ fontFamily: `'${hf}'` }}>{svc.name}</h4>
                <p className="text-xs leading-relaxed mb-3" style={{ color: m }}>{svc.description}</p>
                {svc.price && <div className="flex items-center gap-1.5 mb-3"><Banknote size={13} style={{ color: p }} /><span className="text-sm font-bold" style={{ color: p }}>{svc.price}</span></div>}
                <div className="flex gap-2">
                  <a href={`https://wa.me/${contact?.whatsapp?.replace(/\D/g,'')}?text=Enquiry: ${svc.name}`} target="_blank" rel="noopener" className="flex-1 py-2 text-[10px] font-bold text-white text-center" style={{ borderRadius: r, background: '#25D366' }}>WhatsApp</a>
                  <a href={`tel:${contact?.phone||''}`} className="py-2 px-3 text-[10px] font-bold border" style={{ borderRadius: r, borderColor: `${m}15`, color: p }}><Phone size={11} /></a>
                </div>
              </div>
            </div>
          ))}</div>
        </div>
      </section>)}

      {(testimonials?.items?.length ?? 0) > 0 && (<section className="py-14" style={{ background: sf }}><div className="max-w-7xl mx-auto px-6">
        <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}'` }}>Client Reviews</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{testimonials?.items?.map(t2 => (
          <div key={t2.id} className="bg-white p-5 border" style={{ borderRadius: r, borderColor: `${m}08` }}>
            <div className="flex gap-0.5 mb-2">{Array.from({length:t2.rating||5}).map((_,i) => <Star key={i} size={12} fill="#FBBF24" className="text-yellow-400" />)}</div>
            <p className="text-xs italic" style={{ color: m }}>&ldquo;{t2.content}&rdquo;</p>
            <p className="text-xs font-bold mt-2">{t2.name}</p>
          </div>
        ))}</div>
      </div></section>)}

      {(faq?.items?.length ?? 0) > 0 && (<section className="py-14"><div className="max-w-3xl mx-auto px-6">
        <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}'` }}>FAQ</h2>
        <div className="space-y-3">{faq?.items?.map(q => (
          <details key={q.id} className="bg-white border p-4 group" style={{ borderRadius: r, borderColor: `${m}10` }}>
            <summary className="text-sm font-semibold cursor-pointer list-none flex items-center justify-between">{q.question}<ChevronRight size={14} className="group-open:rotate-90 transition-transform" style={{ color: m }} /></summary>
            <p className="text-xs mt-2" style={{ color: m }}>{q.answer}</p>
          </details>
        ))}</div>
      </div></section>)}

      {contact && (<section className="py-14" id="contact"><div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: `'${hf}'` }}>Book a Service</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {contact.phone && <a href={`tel:${contact.phone}`} className="px-5 py-3 border text-sm font-semibold" style={{ borderRadius: r, borderColor: `${m}20`, color: p }}><Phone size={14} className="inline mr-1.5" />{contact.phone}</a>}
          {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-5 py-3 text-sm font-bold text-white" style={{ borderRadius: r, background: p }}><MessageCircle size={14} className="inline mr-1.5" />Book via WhatsApp</a>}
        </div>
      </div></section>)}
      <footer className="py-6 border-t text-center text-xs" style={{ borderColor: `${m}08`, color: m }}>© {new Date().getFullYear()} {b.companyName} · <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a></footer>
    </div>
  );
}
