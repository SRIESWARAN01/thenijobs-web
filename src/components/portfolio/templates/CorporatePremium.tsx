'use client';
import { Phone, MessageCircle, ChevronRight, Users, Briefcase, Star, MapPin, Mail, ArrowUpRight } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ProductItem, TeamMember, TestimonialItem, ProjectItem, GalleryImage, CareerOpening, ContactSectionData } from '@/lib/types/portfolio';
interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function CorporatePremium({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const products = getS<{ items: ProductItem[] }>(s, 'products');
  const team = getS<{ members: TeamMember[] }>(s, 'team');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const projects = getS<{ items: ProjectItem[] }>(s, 'projects');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const careers = getS<{ openings: CareerOpening[] }>(s, 'careers');
  const contact = getS<ContactSectionData>(s, 'contact');
  const p = th.primaryColor || '#1D4ED8', p2 = th.secondaryColor || '#7C3AED';
  const bg = th.backgroundColor || '#FFF', tx = th.textColor || '#111', m = th.textMutedColor || '#64748B', sf = th.surfaceColor || '#F8FAFC';
  const hf = th.headingFont || 'Poppins', f = th.fontFamily || 'Inter';
  const r = '16px';
  const grad = `linear-gradient(135deg, ${p}, ${p2})`;

  return (
    <div style={{ fontFamily: `'${f}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* Premium Nav */}
      <nav className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: `${bg}F0`, borderColor: `${m}08` }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[68px]">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-10 w-auto" /> : <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: grad }}>{b.companyName?.[0]||'C'}</div>}
            <div className="hidden sm:block"><h1 className="text-sm font-bold" style={{ fontFamily: `'${hf}'` }}>{b.companyName}</h1>{b.tagline && <p className="text-[9px]" style={{ color: m }}>{b.tagline}</p>}</div>
          </div>
          <div className="hidden lg:flex gap-5 text-xs font-medium" style={{ color: m }}>
            {['About','Services','Team','Projects','Careers','Contact'].map(i => <a key={i} href={`#${i.toLowerCase()}`} className="hover:opacity-70 transition">{i}</a>)}
          </div>
          <div className="flex items-center gap-2">
            {contact?.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="px-5 py-2.5 text-xs font-bold text-white" style={{ borderRadius: r, background: grad }}>Get Started</a>}
          </div>
        </div>
      </nav>

      {/* Animated Hero */}
      {hero && (
        <section className="relative py-24 sm:py-32 overflow-hidden" style={{ background: grad }}>
          <div className="absolute inset-0 opacity-10"><div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/20 blur-3xl animate-pulse" /><div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-white/15 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} /></div>
          {hero.backgroundImage && <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          <div className="relative max-w-7xl mx-auto px-6 text-center text-white">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{ fontFamily: `'${hf}'` }}>{hero.headline || b.companyName}</h1>
            <p className="text-sm sm:text-lg mt-4 max-w-2xl mx-auto opacity-90">{hero.subheadline || b.tagline}</p>
            <div className="flex justify-center gap-3 mt-8">
              <a href="#services" className="px-7 py-3.5 bg-white text-sm font-bold flex items-center gap-2 hover:shadow-lg transition-all" style={{ borderRadius: r, color: p }}>{hero.ctaText || 'Explore'} <ArrowUpRight size={14} /></a>
              <a href="#contact" className="px-7 py-3.5 text-sm font-semibold border-2 border-white/40 text-white hover:bg-white/10 transition-all" style={{ borderRadius: r }}>Contact Us</a>
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {about && (<section className="py-16 sm:py-20" id="about"><div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {about.image && <div className="overflow-hidden shadow-2xl" style={{ borderRadius: r }}><img src={about.image} alt="" className="w-full h-80 object-cover" /></div>}
        <div><p className="text-[10px] font-bold uppercase tracking-[3px] mb-2" style={{ color: p }}>About Us</p><h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: `'${hf}'` }}>{about.mission || 'Company Overview'}</h2><p className="text-sm leading-relaxed" style={{ color: m }}>{about.content}</p></div>
      </div></section>)}

      {/* Services */}
      {(services?.items?.length ?? 0) > 0 && (<section className="py-16 sm:py-20" id="services" style={{ background: sf }}><div className="max-w-7xl mx-auto px-6">
        <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Services</p>
        <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>What We Offer</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{services?.items?.map((svc,i) => (
          <div key={svc.id} className="bg-white p-6 border hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{ borderRadius: r, borderColor: `${m}08` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold mb-4" style={{ background: grad }}>{String(i+1).padStart(2,'0')}</div>
            <h4 className="text-base font-bold mb-2" style={{ fontFamily: `'${hf}'` }}>{svc.name}</h4>
            <p className="text-xs leading-relaxed" style={{ color: m }}>{svc.description}</p>
          </div>
        ))}</div>
      </div></section>)}

      {/* Team */}
      {(team?.members?.length ?? 0) > 0 && (<section className="py-16 sm:py-20" id="team"><div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Our Team</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">{team?.members?.map(mem => (
          <div key={mem.id} className="text-center group">
            <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-md mb-3 group-hover:shadow-lg transition-all">{mem.photo ? <img src={mem.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: grad }}>{mem.name[0]}</div>}</div>
            <h4 className="text-sm font-bold">{mem.name}</h4>
            <p className="text-[10px]" style={{ color: m }}>{mem.role}</p>
          </div>
        ))}</div>
      </div></section>)}

      {/* Projects */}
      {(projects?.items?.length ?? 0) > 0 && (<section className="py-16 sm:py-20" id="projects" style={{ background: sf }}><div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Our Projects</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{projects?.items?.map(proj => (
          <div key={proj.id} className="bg-white border overflow-hidden group hover:shadow-xl transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
            {proj.image && <div className="overflow-hidden"><img src={proj.image} alt="" className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" /></div>}
            <div className="p-5"><h4 className="text-sm font-bold">{proj.title}</h4><p className="text-xs mt-1" style={{ color: m }}>{proj.description}</p><div className="flex items-center gap-2 mt-2 text-[10px]" style={{ color: m }}>{proj.client && <span>Client: {proj.client}</span>}{proj.year && <span>• {proj.year}</span>}</div></div>
          </div>
        ))}</div>
      </div></section>)}

      {/* Testimonials */}
      {(testimonials?.items?.length ?? 0) > 0 && (<section className="py-16 sm:py-20"><div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Client Testimonials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{testimonials?.items?.map(t2 => (
          <div key={t2.id} className="p-6 border" style={{ borderRadius: r, borderColor: `${m}08` }}>
            <div className="flex gap-0.5 mb-3">{Array.from({length:t2.rating||5}).map((_,i) => <Star key={i} size={13} fill="#FBBF24" className="text-yellow-400" />)}</div>
            <p className="text-sm italic leading-relaxed" style={{ color: m }}>"{t2.content}"</p>
            <div className="flex items-center gap-3 mt-4">{t2.photo && <img src={t2.photo} alt="" className="w-10 h-10 rounded-full object-cover" />}<div><p className="text-xs font-bold">{t2.name}</p><p className="text-[10px]" style={{ color: m }}>{t2.role}{t2.company ? `, ${t2.company}` : ''}</p></div></div>
          </div>
        ))}</div>
      </div></section>)}

      {/* Careers */}
      {(careers?.openings?.length ?? 0) > 0 && (<section className="py-16 sm:py-20" id="careers" style={{ background: sf }}><div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${hf}'` }}>Join Our Team</h2>
        <div className="max-w-3xl mx-auto space-y-3">{careers?.openings?.map(job => (
          <div key={job.id} className="bg-white p-5 border flex items-center justify-between hover:shadow-md transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
            <div><h4 className="text-sm font-bold">{job.title}</h4><p className="text-[10px]" style={{ color: m }}>{job.department} · {job.location} · {job.type}</p></div>
            <a href={job.link || '#contact'} className="px-4 py-2 text-xs font-bold text-white" style={{ borderRadius: r, background: p }}>Apply</a>
          </div>
        ))}</div>
      </div></section>)}

      {/* Contact */}
      {contact && (<section className="py-16 sm:py-20" id="contact"><div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div><h2 className="text-2xl font-bold mb-4" style={{ fontFamily: `'${hf}'` }}>Contact Us</h2>
          {contact.address && <p className="text-sm flex items-start gap-2 mb-3" style={{ color: m }}><MapPin size={14} style={{ color: p }} className="flex-shrink-0 mt-0.5" />{contact.address}</p>}
          {contact.phone && <a href={`tel:${contact.phone}`} className="text-sm flex items-center gap-2 mb-2" style={{ color: p }}><Phone size={14} />{contact.phone}</a>}
          {contact.email && <a href={`mailto:${contact.email}`} className="text-sm flex items-center gap-2 mb-2" style={{ color: p }}><Mail size={14} />{contact.email}</a>}
          {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 text-white text-xs font-bold" style={{ borderRadius: r, background: '#25D366' }}><MessageCircle size={14} />WhatsApp</a>}
        </div>
        {contact.googleMapsEmbed && <div className="overflow-hidden shadow-lg" style={{ borderRadius: r }}><iframe src={contact.googleMapsEmbed} width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy" /></div>}
      </div></section>)}

      <footer className="py-8 border-t" style={{ borderColor: `${m}08` }}><div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: m }}><span>© {new Date().getFullYear()} {b.companyName}</span><span>Powered by <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a></span></div></footer>
    </div>
  );
}
