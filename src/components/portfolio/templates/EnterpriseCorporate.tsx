'use client';

import { Phone, Mail, MessageCircle, Building2, Globe, Shield, ArrowUpRight } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, TeamMember, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function EnterpriseCorporate({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const contact = getS<ContactSectionData>(s, 'contact');

  const p = th.primaryColor || '#1E40AF', bg = th.backgroundColor || '#FFFFFF', tx = th.textColor || '#0F172A';
  const m = th.textMutedColor || '#64748B', sf = th.surfaceColor || '#F8FAFC';
  const font = th.fontFamily || 'Inter';

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      <header className="border-b sticky top-0 z-30 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-10 w-auto" /> : (
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: p }}>
                <Building2 size={20} />
              </div>
            )}
            <span className="text-base font-bold text-slate-900">{b.companyName}</span>
          </div>
          <div className="flex items-center gap-3">
            {contact?.phone && <a href={`tel:${contact.phone}`} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: p }}>Contact Corporate</a>}
          </div>
        </div>
      </header>

      {hero && (
        <section className="py-24 bg-slate-900 text-white text-center">
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold">{hero.headline || b.companyName}</h1>
            <p className="text-base mt-4 text-slate-300 max-w-2xl mx-auto">{hero.subheadline || b.tagline}</p>
          </div>
        </section>
      )}

      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-20" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10">Enterprise Solutions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services?.items?.map(svc => (
                <div key={svc.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-base font-bold mb-2">{svc.name}</h3>
                  <p className="text-xs text-slate-500">{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-8 border-t text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {b.companyName} • Enterprise Portal
      </footer>
    </div>
  );
}
