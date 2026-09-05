'use client';
import { Phone, MessageCircle, Search, ShoppingBag, ChevronRight, Star, Filter } from 'lucide-react';
import { useState } from 'react';
import type { PortfolioSite, PortfolioSection, ProductItem, TestimonialItem, ContactSectionData, FAQItem } from '@/lib/types/portfolio';
interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function ProductMarketplace({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero');
  const about = getS<any>(s, 'about');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const faq = getS<{ items: FAQItem[] }>(s, 'faq');
  const contact = getS<ContactSectionData>(s, 'contact');
  const p = th.primaryColor || '#059669', bg = th.backgroundColor || '#FFF', tx = th.textColor || '#111';
  const m = th.textMutedColor || '#6B7280', sf = th.surfaceColor || '#F0FDF4', hf = th.headingFont || 'Poppins';
  const r = '14px';
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const allProducts = products?.items || [];
  const categories = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
  const filtered = allProducts.filter(prod => {
    const matchSearch = !search || prod.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'All' || prod.category === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ fontFamily: `'${th.fontFamily||'Inter'}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      <nav className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: `${bg}F0`, borderColor: `${m}08` }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {b.logo ? <img src={b.logo} alt="" className="h-9 w-auto rounded-lg" /> : <div className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: p }}>{b.companyName?.[0]||'P'}</div>}
            <span className="text-sm font-bold" style={{ fontFamily: `'${hf}'` }}>{b.companyName}</span>
          </div>
          <div className="flex items-center gap-2">
            {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5" style={{ borderRadius: r, background: p }}><ShoppingBag size={13} /> Order Now</a>}
          </div>
        </div>
      </nav>

      {hero && (
        <section className="py-14 sm:py-20 text-center" style={{ background: sf }}>
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ fontFamily: `'${hf}'` }}>{hero.headline || `${b.companyName} Products`}</h1>
            <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: m }}>{hero.subheadline || 'Explore our complete product catalogue'}</p>
          </div>
        </section>
      )}

      {/* Product Search & Filter */}
      {allProducts.length > 0 && (
        <section className="py-10" id="products">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: m }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} aria-label="Search products" placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 border text-base sm:text-sm" style={{ borderRadius: r, borderColor: `${m}20` }} />
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCat(cat)} className={`px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all ${selectedCat === cat ? 'text-white' : ''}`} style={{ borderRadius: r, background: selectedCat === cat ? p : `${m}10`, color: selectedCat === cat ? '#FFF' : m }}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(prod => (
                <div key={prod.id} className="bg-white border overflow-hidden group hover:shadow-xl transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
                  {prod.image && <div className="overflow-hidden relative"><img src={prod.image} alt={prod.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                    {prod.category && <span className="absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold text-white rounded-md" style={{ background: `${p}CC` }}>{prod.category}</span>}
                  </div>}
                  <div className="p-4">
                    <h4 className="text-sm font-bold mb-1">{prod.name}</h4>
                    {prod.description && <p className="text-[10px] line-clamp-2 mb-2" style={{ color: m }}>{prod.description}</p>}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-bold" style={{ color: p }}>₹{prod.price}</span>
                      {prod.originalPrice && <span className="text-xs line-through" style={{ color: m }}>₹{prod.originalPrice}</span>}
                    </div>
                    <div className="flex gap-1.5">
                      <a href={prod.whatsappLink || `https://wa.me/${contact?.whatsapp?.replace(/\D/g,'')}?text=Order: ${prod.name}`} target="_blank" rel="noopener" className="flex-1 py-2 text-[10px] font-bold text-white text-center flex items-center justify-center gap-1" style={{ borderRadius: r, background: '#25D366' }}><MessageCircle size={10} /> WhatsApp</a>
                      {contact?.phone && <a href={`tel:${contact.phone}`} className="py-2 px-3 text-[10px] font-semibold border" style={{ borderRadius: r, borderColor: `${m}15`, color: p }}><Phone size={11} /></a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && <p className="text-center py-12 text-sm" style={{ color: m }}>No products found</p>}
          </div>
        </section>
      )}

      {/* FAQ */}
      {(faq?.items?.length ?? 0) > 0 && (
        <section className="py-14" style={{ background: sf }}>
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}'` }}>Frequently Asked Questions</h2>
            <div className="space-y-3">{faq?.items?.map(q => (
              <details key={q.id} className="bg-white border p-4 group" style={{ borderRadius: r, borderColor: `${m}10` }}>
                <summary className="text-sm font-semibold cursor-pointer list-none flex items-center justify-between">{q.question} <ChevronRight size={14} className="group-open:rotate-90 transition-transform" style={{ color: m }} /></summary>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: m }}>{q.answer}</p>
              </details>
            ))}</div>
          </div>
        </section>
      )}

      {/* Contact */}
      {contact && (
        <section className="py-14" id="contact">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: `'${hf}'` }}>Order Now</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {contact.phone && <a href={`tel:${contact.phone}`} className="px-5 py-3 border text-sm font-semibold" style={{ borderRadius: r, borderColor: `${m}20`, color: p }}><Phone size={14} className="inline mr-1.5" />{contact.phone}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-5 py-3 text-sm font-bold text-white" style={{ borderRadius: r, background: '#25D366' }}><MessageCircle size={14} className="inline mr-1.5" />WhatsApp Order</a>}
            </div>
          </div>
        </section>
      )}
      <footer className="py-6 border-t text-center text-xs" style={{ borderColor: `${m}08`, color: m }}>© {new Date().getFullYear()} {b.companyName} · <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a></footer>
    </div>
  );
}
