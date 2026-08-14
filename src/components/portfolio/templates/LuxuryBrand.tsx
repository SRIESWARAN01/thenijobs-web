'use client';

import { Phone, Mail, MessageCircle, Diamond, Star, Sparkles } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function LuxuryBrand({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const contact = getS<ContactSectionData>(s, 'contact');

  const p = th.primaryColor || '#D97706';
  const hf = th.headingFont || 'Playfair Display', font = th.fontFamily || 'Cinzel';

  return (
    <div style={{ fontFamily: `'${font}', serif`, background: '#050505', color: '#F5F5F5' }} className="min-h-screen">
      <header className="border-b border-amber-900/30 sticky top-0 z-30 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-24">
          <div className="flex items-center gap-3">
            <Diamond size={24} className="text-amber-500" />
            <span className="text-xl font-bold tracking-widest uppercase" style={{ fontFamily: `'${hf}', serif` }}>{b.companyName}</span>
          </div>
          {contact?.phone && <a href={`tel:${contact.phone}`} className="px-6 py-2.5 border border-amber-500/50 text-amber-400 text-xs tracking-widest uppercase hover:bg-amber-500/10">Private Concierge</a>}
        </div>
      </header>

      {hero && (
        <section className="py-32 text-center relative">
          <div className="max-w-3xl mx-auto px-6">
            <p className="text-xs uppercase tracking-[6px] text-amber-500 mb-4">LUXURY & EXCELLENCE</p>
            <h1 className="text-4xl sm:text-6xl font-normal tracking-wide leading-tight" style={{ fontFamily: `'${hf}', serif` }}>
              {hero.headline || b.companyName}
            </h1>
            <p className="text-sm mt-6 text-neutral-400 max-w-xl mx-auto tracking-widest leading-relaxed">
              {hero.subheadline || b.tagline}
            </p>
          </div>
        </section>
      )}

      {(products?.items?.length ?? 0) > 0 && (
        <section className="py-24 border-t border-amber-900/20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-xl font-normal text-center tracking-[4px] uppercase text-amber-500 mb-16" style={{ fontFamily: `'${hf}', serif` }}>The Collection</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products?.items?.map(prod => (
                <div key={prod.id} className="border border-amber-900/30 p-6 bg-neutral-950 text-center hover:border-amber-500/60 transition-all">
                  {prod.image && <img src={prod.image} alt="" className="w-full h-64 object-cover mb-4 filter contrast-105" />}
                  <h3 className="text-base font-normal tracking-wider text-amber-100 mb-1">{prod.name}</h3>
                  <p className="text-sm text-amber-400 tracking-widest">₹{prod.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-12 border-t border-amber-900/30 text-center text-[10px] tracking-[4px] text-neutral-500 uppercase">
        © {new Date().getFullYear()} {b.companyName} • ATELIER
      </footer>
    </div>
  );
}
