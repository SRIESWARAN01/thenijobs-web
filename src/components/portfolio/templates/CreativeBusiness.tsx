'use client';

import { Phone, Mail, MessageCircle, Sparkles, ArrowUpRight, Grid, Play } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProjectItem, GalleryImage, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function CreativeBusiness({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const projects = getS<{ items: ProjectItem[] }>(s, 'projects');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const contact = getS<ContactSectionData>(s, 'contact');

  const p = th.primaryColor || '#EC4899', p2 = th.secondaryColor || '#8B5CF6';
  const bg = th.backgroundColor || '#0F172A', tx = th.textColor || '#F8FAFC';
  const m = th.textMutedColor || '#94A3B8', sf = th.surfaceColor || '#1E293B';
  const hf = th.headingFont || 'Outfit', font = th.fontFamily || 'Inter';
  const r = '20px';
  const grad = `linear-gradient(135deg, ${p}, ${p2})`;

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* Creative Header */}
      <nav className="border-b border-slate-800 sticky top-0 z-30 backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-10 w-auto rounded-xl" /> : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: grad }}>
                <Sparkles size={20} />
              </div>
            )}
            <span className="text-lg font-bold tracking-tight">{b.companyName}</span>
          </div>
          <div className="flex items-center gap-3">
            {contact?.whatsapp && (
              <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-5 py-2.5 rounded-full text-xs font-bold text-white shadow-lg shadow-pink-500/20" style={{ background: grad }}>
                Let's Talk <ArrowUpRight size={14} className="inline ml-1" />
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      {hero && (
        <section className="py-24 sm:py-36 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: grad }} />
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none bg-clip-text text-transparent" style={{ backgroundImage: grad }}>
              {hero.headline || b.companyName}
            </h1>
            <p className="text-base sm:text-lg mt-6 text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {hero.subheadline || b.tagline}
            </p>
          </div>
        </section>
      )}

      {/* Projects Grid */}
      {(projects?.items?.length ?? 0) > 0 && (
        <section className="py-20" id="projects" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold mb-10 text-center">Featured Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects?.items?.map(proj => (
                <div key={proj.id} className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-pink-500/50 transition-all duration-500">
                  {proj.image && <img src={proj.image} alt="" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white">{proj.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{proj.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-10 border-t border-slate-800 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {b.companyName} • Creative Portfolio
      </footer>
    </div>
  );
}
