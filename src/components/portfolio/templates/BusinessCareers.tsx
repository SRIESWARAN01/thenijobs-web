'use client';

import { Phone, Mail, MessageCircle, Briefcase, MapPin, Users, ArrowRight, Building2, Heart, Clock, ChevronRight, Star, Award, Globe } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, CareerOpening, ServiceItem, TeamMember, TestimonialItem, GalleryImage, ContactSectionData, FAQItem } from '@/lib/types/portfolio';
import { safeExternalUrl } from '@/lib/safeUrl';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function BusinessCareers({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const careers = getS<{ openings: CareerOpening[] }>(s, 'careers');
  const services = getS<{ items: ServiceItem[] }>(s, 'services');
  const team = getS<{ members: TeamMember[] }>(s, 'team');
  const testimonials = getS<{ items: TestimonialItem[] }>(s, 'testimonials');
  const gallery = getS<{ images: GalleryImage[] }>(s, 'gallery');
  const contact = getS<ContactSectionData>(s, 'contact');
  const faq = getS<{ items: FAQItem[] }>(s, 'faq');

  const p = th.primaryColor || '#2563EB', p2 = th.secondaryColor || '#7C3AED';
  const bg = th.backgroundColor || '#FFFFFF', tx = th.textColor || '#0F172A';
  const m = th.textMutedColor || '#64748B', sf = th.surfaceColor || '#F8FAFC';
  const hf = th.headingFont || 'Poppins', font = th.fontFamily || 'Inter';
  const r = '16px';
  const grad = `linear-gradient(135deg, ${p}, ${p2})`;

  const openingsCount = careers?.openings?.length ?? 0;
  const departments = [...new Set((careers?.openings || []).map(j => j.department).filter(Boolean))];

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: tx }} className="min-h-screen">
      {/* Careers Nav */}
      <header className="border-b sticky top-0 z-30 backdrop-blur-md" style={{ background: `${bg}F2`, borderColor: `${m}10` }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-10 w-auto" /> : (
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: grad }}>
                <Briefcase size={20} />
              </div>
            )}
            <div>
              <span className="text-sm font-bold" style={{ fontFamily: `'${hf}'` }}>{b.companyName}</span>
              <span className="ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${p}10`, color: p }}>CAREERS</span>
            </div>
          </div>
          <nav className="hidden lg:flex gap-5 text-xs font-medium" style={{ color: m }}>
            {['Culture', 'Openings', 'Team', 'Perks', 'Contact'].map(i => <a key={i} href={`#${i.toLowerCase()}`} className="hover:opacity-70 transition">{i}</a>)}
          </nav>
          <a href="#openings" className="px-5 py-2.5 text-xs font-bold text-white flex items-center gap-1.5" style={{ borderRadius: r, background: grad }}>
            View Positions {openingsCount > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">{openingsCount}</span>}
          </a>
        </div>
      </header>

      {/* Hero — "Join Us" */}
      {hero && (
        <section className="relative py-24 sm:py-36 overflow-hidden" style={{ background: grad }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/30 blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-white/20 blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
          {hero.backgroundImage && <div className="absolute inset-0 opacity-15" style={{ backgroundImage: `url(${hero.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          <div className="relative max-w-5xl mx-auto px-6 text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold mb-6 border border-white/20">
              <Heart size={12} /> We&apos;re Hiring!
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight" style={{ fontFamily: `'${hf}'` }}>
              {hero.headline || `Build Your Career at ${b.companyName}`}
            </h1>
            <p className="text-sm sm:text-lg mt-5 max-w-2xl mx-auto text-white/80 leading-relaxed">
              {hero.subheadline || 'Join our passionate team and help shape the future of our industry.'}
            </p>
            <div className="flex justify-center flex-wrap gap-3 mt-9">
              <a href="#openings" className="px-8 py-3.5 bg-white text-sm font-bold flex items-center gap-2 hover:shadow-xl transition-all" style={{ borderRadius: r, color: p }}>
                View Open Positions <ArrowRight size={14} />
              </a>
              <a href="#culture" className="px-8 py-3.5 text-sm font-semibold border-2 border-white/30 text-white hover:bg-white/10 transition-all" style={{ borderRadius: r }}>
                Our Culture
              </a>
            </div>
            {/* Quick Stats */}
            {(openingsCount > 0 || departments.length > 0) && (
              <div className="flex justify-center gap-8 mt-12 pt-8 border-t border-white/15">
                {openingsCount > 0 && <div><p className="text-3xl font-bold">{openingsCount}</p><p className="text-[10px] uppercase tracking-[2px] text-white/60">Open Positions</p></div>}
                {departments.length > 0 && <div><p className="text-3xl font-bold">{departments.length}</p><p className="text-[10px] uppercase tracking-[2px] text-white/60">Departments</p></div>}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Company Culture */}
      {about && (
        <section className="py-20 sm:py-24" id="culture">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {about.image && <div className="overflow-hidden shadow-2xl" style={{ borderRadius: r }}><img src={about.image} alt="" className="w-full h-80 object-cover" /></div>}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2" style={{ color: p }}>Our Culture</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: `'${hf}'` }}>Why Work With Us?</h2>
              <p className="text-sm leading-relaxed mb-5" style={{ color: m }}>{about.content}</p>
              {about.mission && (
                <div className="p-4 border-l-4 mt-4" style={{ borderColor: p, background: `${p}05` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[2px] mb-1" style={{ color: p }}>Our Mission</p>
                  <p className="text-sm" style={{ color: m }}>{about.mission}</p>
                </div>
              )}
              {about.vision && (
                <div className="p-4 border-l-4 mt-3" style={{ borderColor: p2, background: `${p2}05` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[2px] mb-1" style={{ color: p2 }}>Our Vision</p>
                  <p className="text-sm" style={{ color: m }}>{about.vision}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Perks & Benefits */}
      {(services?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="perks" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Perks & Benefits</p>
            <h2 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: `'${hf}'` }}>What We Offer</h2>
            <p className="text-sm text-center max-w-xl mx-auto mb-12" style={{ color: m }}>We invest in our people with comprehensive benefits and growth opportunities.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{services?.items?.map((svc, i) => (
              <div key={svc.id} className="bg-white p-6 border hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold mb-3 text-xs" style={{ background: grad }}>{String(i+1).padStart(2,'0')}</div>
                <h4 className="text-sm font-bold mb-2" style={{ fontFamily: `'${hf}'` }}>{svc.name}</h4>
                <p className="text-xs leading-relaxed" style={{ color: m }}>{svc.description}</p>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Job Openings */}
      {openingsCount > 0 && (
        <section className="py-20 sm:py-24" id="openings">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Open Positions</p>
            <h2 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: `'${hf}'` }}>Current Job Openings</h2>
            <p className="text-sm text-center max-w-xl mx-auto mb-10" style={{ color: m }}>Find your perfect role and apply today. We review every application personally.</p>

            {/* Department filters */}
            {departments.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {departments.map(dept => (
                  <span key={dept} className="px-3 py-1.5 text-[10px] font-bold rounded-full" style={{ background: `${p}10`, color: p }}>{dept}</span>
                ))}
              </div>
            )}

            <div className="space-y-4">{careers!.openings.map(job => (
              <div key={job.id} className="p-6 border hover:border-blue-300 hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderRadius: r, borderColor: `${m}10` }}>
                <div className="flex-1">
                  <h3 className="text-base font-bold" style={{ fontFamily: `'${hf}'` }}>{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <span className="text-[10px] flex items-center gap-1" style={{ color: m }}><Users size={10} /> {job.department}</span>
                    <span className="text-[10px] flex items-center gap-1" style={{ color: m }}><MapPin size={10} /> {job.location}</span>
                    <span className="text-[10px] flex items-center gap-1" style={{ color: m }}><Clock size={10} /> {job.type}</span>
                  </div>
                  {job.description && <p className="text-xs mt-2 line-clamp-2" style={{ color: m }}>{job.description}</p>}
                </div>
                <a href={safeExternalUrl(job.link) || '#contact'} className="px-6 py-3 text-xs font-bold text-white flex items-center justify-center gap-1.5 flex-shrink-0 hover:shadow-md transition-all" style={{ borderRadius: r, background: grad }}>
                  Apply Now <ArrowRight size={14} />
                </a>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Meet the Team */}
      {(team?.members?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" id="team" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-center" style={{ color: p }}>Your Future Colleagues</p>
            <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: `'${hf}'` }}>Meet the Team</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">{team?.members?.map(mem => (
              <div key={mem.id} className="text-center group bg-white p-5 border hover:shadow-lg transition-all" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden mb-3 group-hover:shadow-md transition-all">
                  {mem.photo ? <img src={mem.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white" style={{ background: grad }}>{mem.name[0]}</div>}
                </div>
                <h4 className="text-sm font-bold">{mem.name}</h4>
                <p className="text-[10px] font-medium" style={{ color: p }}>{mem.role}</p>
                {mem.bio && <p className="text-[10px] mt-1.5 line-clamp-2" style={{ color: m }}>{mem.bio}</p>}
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Employee Testimonials */}
      {(testimonials?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>What Our Team Says</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{testimonials?.items?.map(t2 => (
              <div key={t2.id} className="p-6 border" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <div className="flex gap-0.5 mb-3">{Array.from({length: t2.rating || 5}).map((_, i) => <Star key={i} size={12} fill="#FBBF24" className="text-yellow-400" />)}</div>
                <p className="text-sm italic leading-relaxed" style={{ color: m }}>&ldquo;{t2.content}&rdquo;</p>
                <div className="flex items-center gap-3 mt-4">
                  {t2.photo && <img src={t2.photo} alt="" className="w-9 h-9 rounded-full object-cover" />}
                  <div><p className="text-xs font-bold">{t2.name}</p><p className="text-[10px]" style={{ color: m }}>{t2.role}{t2.company ? `, ${t2.company}` : ''}</p></div>
                </div>
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* Gallery — Life at Company */}
      {(gallery?.images?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24" style={{ background: sf }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Life at {b.companyName}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{gallery?.images?.map(img => (
              <div key={img.id} className="overflow-hidden group" style={{ borderRadius: r }}>
                <img src={img.url} alt={img.caption} className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ))}</div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {(faq?.items?.length ?? 0) > 0 && (
        <section className="py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: `'${hf}'` }}>Hiring FAQ</h2>
            <div className="space-y-3">{faq?.items?.map(item => (
              <details key={item.id} className="group border p-5" style={{ borderRadius: r, borderColor: `${m}08` }}>
                <summary className="flex items-center justify-between cursor-pointer text-sm font-bold list-none">
                  {item.question}
                  <ChevronRight size={14} className="group-open:rotate-90 transition-transform" style={{ color: m }} />
                </summary>
                <p className="text-xs mt-3 leading-relaxed" style={{ color: m }}>{item.answer}</p>
              </details>
            ))}</div>
          </div>
        </section>
      )}

      {/* Contact */}
      {contact && (
        <section className="py-20 sm:py-24" id="contact" style={{ background: grad }}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="text-white">
              <p className="text-[10px] font-bold uppercase tracking-[3px] mb-2 text-white/60">Ready to Join?</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: `'${hf}'` }}>Get in Touch With Our HR Team</h2>
              <p className="text-sm text-white/70 mb-6">Have questions about our openings? We&apos;d love to hear from you.</p>
              {contact.address && <p className="text-sm flex items-start gap-2 mb-3 text-white/80"><MapPin size={14} className="flex-shrink-0 mt-0.5" />{contact.address}</p>}
              {contact.phone && <a href={`tel:${contact.phone}`} className="text-sm flex items-center gap-2 mb-3 text-white/90 hover:text-white transition"><Phone size={14} />{contact.phone}</a>}
              {contact.email && <a href={`mailto:${contact.email}`} className="text-sm flex items-center gap-2 mb-3 text-white/90 hover:text-white transition"><Mail size={14} />{contact.email}</a>}
              {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 mt-4 px-6 py-3 text-sm font-bold rounded-xl bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30 transition-all"><MessageCircle size={14} />WhatsApp HR</a>}
            </div>
            {contact.googleMapsEmbed && <div className="overflow-hidden shadow-2xl" style={{ borderRadius: r }}><iframe src={contact.googleMapsEmbed} width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy" /></div>}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t" style={{ borderColor: `${m}08` }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ color: m }}>
          <span>© {new Date().getFullYear()} {b.companyName} · Careers Portal</span>
          <span>Powered by <a href="https://thenijobs.com" className="font-bold" style={{ color: p }}>THENIJOBS</a></span>
        </div>
      </footer>
    </div>
  );
}
