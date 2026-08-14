'use client';

import { Phone, Mail, MessageCircle, Crown, Award, Users, ChevronRight, Star, MapPin } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, TeamMember, TestimonialItem, ProjectItem, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function ExecutiveCompany({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const team = getS<{ members: TeamMember[] }>(s, 'team');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const projects = getS<{ items: ProjectItem[] }>(s, 'projects');
  const contact = getS<ContactSectionData>(s, 'contact');

  const p = th.primaryColor || '#0F172A', p2 = th.secondaryColor || '#334155';
  const bg = th.backgroundColor || '#FFFFFF', tx = th.textColor || '#0F172A';
  const m = th.textMutedColor || '#64748B', sf = th.surfaceColor || '#F8FAFC';
  const hf = th.headingFont || 'Playfair Display', font = th.fontFamily || 'Inter';
  const r = '8px';

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* Executive Header */}
      <header className="border-b sticky top-0 z-30 backdrop-blur-md" style={{ background: `${bg}F2`, borderColor: `${m}15` }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-10 w-auto" /> : (
              <div className="h-10 w-10 flex items-center justify-center text-white font-bold" style={{ background: p, borderRadius: r }}>
                <Crown size={20} />
              </div>
            )}
            <div>
              <h1 className="text-base font-bold tracking-tight" style={{ fontFamily: `'${hf}', serif` }}>{b.companyName}</h1>
              {b.tagline && <p className="text-[10px] uppercase tracking-widest" style={{ color: m }}>{b.tagline}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {contact?.phone && (
              <a href={`tel:${contact.phone}`} className="px-4 py-2 border text-xs font-semibold uppercase tracking-wider" style={{ borderRadius: r, borderColor: p, color: p }}>
                <Phone size={12} className="inline mr-1.5" /> Call Executive
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      {hero && (
        <section className="py-24 sm:py-32 text-center relative overflow-hidden" style={{ background: p, color: '#FFF' }}>
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <p className="text-xs uppercase tracking-[4px] text-amber-400 font-bold mb-4">EXECUTIVE & CORPORATE ADVISORY</p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{ fontFamily: `'${hf}', serif` }}>
              {hero.headline || b.companyName}
            </h1>
            <p className="text-sm sm:text-base mt-6 opacity-80 max-w-2xl mx-auto leading-relaxed">
              {hero.subheadline || b.tagline}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <a href="#contact" className="px-8 py-3.5 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-all" style={{ borderRadius: r }}>
                Schedule Consultation
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-20" id="services" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-12 uppercase tracking-widest text-xs" style={{ color: m }}>PRACTICE AREAS & SERVICES</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services?.items?.map(svc => (
                <div key={svc.id} className="bg-white p-8 border shadow-sm hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}15` }}>
                  <h3 className="text-lg font-bold mb-3" style={{ fontFamily: `'${hf}', serif` }}>{svc.name}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: m }}>{svc.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      {contact && (
        <section className="py-20 text-center" id="contact">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: `'${hf}', serif` }}>Executive Offices</h2>
            <p className="text-xs mb-8" style={{ color: m }}>{contact.address}</p>
            <div className="flex justify-center gap-4">
              {contact.phone && <a href={`tel:${contact.phone}`} className="px-6 py-3 bg-slate-900 text-white text-xs uppercase font-bold tracking-wider" style={{ borderRadius: r }}>Phone: {contact.phone}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-6 py-3 bg-emerald-600 text-white text-xs uppercase font-bold tracking-wider" style={{ borderRadius: r }}>WhatsApp</a>}
            </div>
          </div>
        </section>
      )}

      <footer className="py-8 border-t text-center text-[10px] uppercase tracking-widest" style={{ borderColor: `${m}15`, color: m }}>
        © {new Date().getFullYear()} {b.companyName} • EXECUTIVE PORTFOLIO
      </footer>
    </div>
  );
}
