'use client';

import { Phone, Mail, MessageCircle, ChevronRight, Sparkles, MapPin, Clock } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, GalleryImage, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }

function getS<T>(sections: PortfolioSection[], type: string): T | null {
  const s = sections.find(s => s.type === type && s.visible);
  return s ? (s.data as T) : null;
}

export default function ModernServices({ site }: Props) {
  const { theme, branding, sections } = site;
  const heroData = getS<any>(sections, 'hero');
  const aboutData = getS<any>(sections, 'about');
  const servicesData = getS<{ items: ServiceItem[] }>(sections, 'services');
  const galleryData = getS<{ images: GalleryImage[] }>(sections, 'gallery');
  const contactData = getS<ContactSectionData>(sections, 'contact');

  const p = theme.primaryColor || '#7C3AED';
  const p2 = theme.secondaryColor || '#EC4899';
  const bg = theme.backgroundColor || '#FFFFFF';
  const text = theme.textColor || '#111827';
  const muted = theme.textMutedColor || '#6B7280';
  const surface = theme.surfaceColor || '#FAF5FF';
  const font = theme.fontFamily || 'Inter';
  const hFont = theme.headingFont || 'Poppins';
  const r = theme.borderRadius === 'full' ? '9999px' : theme.borderRadius === 'large' ? '20px' : theme.borderRadius === 'small' ? '6px' : '14px';

  const gradient = `linear-gradient(135deg, ${p}, ${p2})`;

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: text }} className="min-h-screen">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-30 backdrop-blur-md" style={{ background: `${bg}E8` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            {branding.logo ? (
              <img src={branding.logo} alt="" className="h-8 w-8 rounded-xl object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: gradient }}>
                {branding.companyName?.[0] || 'S'}
              </div>
            )}
            <span className="text-sm font-bold" style={{ fontFamily: `'${hFont}', sans-serif` }}>{branding.companyName}</span>
          </div>
          <div className="flex items-center gap-2">
            {contactData?.phone && (
              <a href={`tel:${contactData.phone}`} className="p-2 rounded-xl hover:opacity-80 transition-all" style={{ color: p }}>
                <Phone size={16} />
              </a>
            )}
            {contactData?.whatsapp && (
              <a href={`https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: gradient }}>
                Get a Quote
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      {heroData && (
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 opacity-5" style={{ background: gradient }} />
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10" style={{ background: gradient }} />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10" style={{ background: gradient }} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold mb-4" style={{ background: `${p}12`, color: p }}>
              <Sparkles size={12} /> {branding.tagline || 'Professional Services'}
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight" style={{ fontFamily: `'${hFont}', sans-serif` }}>
              {heroData.headline || `Welcome to ${branding.companyName}`}
            </h1>
            <p className="text-sm sm:text-base mt-4 max-w-2xl mx-auto leading-relaxed" style={{ color: muted }}>
              {heroData.subheadline || 'We provide top-quality services tailored to your needs.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {heroData.ctaText && (
                <a href={heroData.ctaLink || '#services'} className="px-6 py-3 text-sm font-bold text-white flex items-center gap-2 hover:shadow-lg transition-all" style={{ borderRadius: r, background: gradient }}>
                  {heroData.ctaText} <ChevronRight size={14} />
                </a>
              )}
              <a href="#contact" className="px-6 py-3 text-sm font-semibold border-2 flex items-center gap-2 hover:shadow-sm transition-all" style={{ borderRadius: r, borderColor: `${p}30`, color: p }}>
                Contact Us
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      {aboutData && (
        <section className="py-12 sm:py-16" id="about" style={{ background: surface }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {aboutData.image && (
              <div className="overflow-hidden shadow-xl" style={{ borderRadius: r }}>
                <img src={aboutData.image} alt="" className="w-full h-72 object-cover" />
              </div>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: `'${hFont}', sans-serif` }}>About Our Company</h2>
              <p className="text-sm leading-relaxed" style={{ color: muted }}>{aboutData.content}</p>
              {aboutData.mission && (
                <div className="mt-4 p-4 border-l-4" style={{ borderColor: p, background: `${p}08` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: p }}>Our Mission</p>
                  <p className="text-sm" style={{ color: text }}>{aboutData.mission}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICES (Main Feature) ── */}
      {servicesData?.items && servicesData.items.length > 0 && (
        <section className="py-12 sm:py-16" id="services">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: `'${hFont}', sans-serif` }}>Our Services</h2>
              <p className="text-xs mt-2" style={{ color: muted }}>Professional solutions for every need</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicesData?.items?.map((svc, i) => (
                <div key={svc.id} className="group relative bg-white border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300" style={{ borderRadius: r, borderColor: `${muted}12` }}>
                  {/* Gradient top bar */}
                  <div className="h-1" style={{ background: gradient }} />
                  {svc.image && (
                    <div className="overflow-hidden">
                      <img src={svc.image} alt={svc.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-5">
                    <h4 className="text-sm font-bold mb-1.5" style={{ fontFamily: `'${hFont}', sans-serif` }}>{svc.name}</h4>
                    <p className="text-xs leading-relaxed" style={{ color: muted }}>{svc.description}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <a href={`https://wa.me/${contactData?.whatsapp?.replace(/\D/g, '') || ''}?text=I'm interested in: ${svc.name}`} target="_blank" rel="noopener"
                        className="px-3 py-1.5 text-[10px] font-bold text-white flex items-center gap-1" style={{ borderRadius: r, background: '#25D366' }}>
                        <MessageCircle size={10} /> Enquire
                      </a>
                      {contactData?.phone && (
                        <a href={`tel:${contactData.phone}`} className="px-3 py-1.5 text-[10px] font-semibold border flex items-center gap-1" style={{ borderRadius: r, borderColor: `${muted}25`, color: p }}>
                          <Phone size={10} /> Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {galleryData?.images && galleryData.images.length > 0 && (
        <section className="py-12 sm:py-16" id="gallery" style={{ background: surface }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${hFont}', sans-serif` }}>Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryData?.images?.map(img => (
                <div key={img.id} className="group overflow-hidden shadow-sm hover:shadow-lg transition-all" style={{ borderRadius: r }}>
                  <img src={img.url} alt={img.caption} className="w-full h-40 sm:h-52 object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ── */}
      {contactData && (
        <section className="py-12 sm:py-16" id="contact">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${hFont}', sans-serif` }}>Get In Touch</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {contactData.phone && (
                <a href={`tel:${contactData.phone}`} className="flex flex-col items-center gap-2 p-6 bg-white border hover:shadow-lg transition-all text-center" style={{ borderRadius: r, borderColor: `${muted}12` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: gradient }}>
                    <Phone size={20} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: muted }}>Call Us</p>
                  <p className="text-sm font-bold" style={{ color: p }}>{contactData.phone}</p>
                </a>
              )}
              {contactData.email && (
                <a href={`mailto:${contactData.email}`} className="flex flex-col items-center gap-2 p-6 bg-white border hover:shadow-lg transition-all text-center" style={{ borderRadius: r, borderColor: `${muted}12` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: gradient }}>
                    <Mail size={20} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: muted }}>Email</p>
                  <p className="text-sm font-bold" style={{ color: p }}>{contactData.email}</p>
                </a>
              )}
              {contactData.whatsapp && (
                <a href={`https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                  className="flex flex-col items-center gap-2 p-6 bg-white border hover:shadow-lg transition-all text-center" style={{ borderRadius: r, borderColor: `${muted}12` }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: '#25D366' }}>
                    <MessageCircle size={20} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: muted }}>WhatsApp</p>
                  <p className="text-sm font-bold" style={{ color: '#25D366' }}>Chat Now</p>
                </a>
              )}
            </div>
            {contactData.googleMapsEmbed && (
              <div className="mt-6 overflow-hidden shadow-lg" style={{ borderRadius: r }}>
                <iframe src={contactData.googleMapsEmbed} width="100%" height="300" style={{ border: 0 }} allowFullScreen loading="lazy" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-6" style={{ background: surface }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: muted }}>© {new Date().getFullYear()} {branding.companyName}</p>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: muted }}>
            Powered by <a href="https://thenijobs.com" className="font-bold ml-0.5" style={{ color: p }}>THENIJOBS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
