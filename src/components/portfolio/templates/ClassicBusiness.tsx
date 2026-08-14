'use client';

import { MapPin, Phone, Mail, MessageCircle, Globe, Clock, ChevronRight, Star } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, GalleryImage, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }

function getSectionData<T>(sections: PortfolioSection[], type: string): T | null {
  const section = sections.find(s => s.type === type && s.visible);
  return section ? (section.data as T) : null;
}

export default function ClassicBusiness({ site }: Props) {
  const { theme, branding, sections } = site;
  const visibleSections = sections.filter(s => s.visible).sort((a, b) => a.order - b.order);

  const heroData = getSectionData<any>(sections, 'hero');
  const aboutData = getSectionData<any>(sections, 'about');
  const servicesData = getSectionData<{ items: ServiceItem[] }>(sections, 'services');
  const galleryData = getSectionData<{ images: GalleryImage[] }>(sections, 'gallery');
  const contactData = getSectionData<ContactSectionData>(sections, 'contact');

  const font = theme.fontFamily || 'Inter';
  const headingFont = theme.headingFont || 'Poppins';
  const primary = theme.primaryColor || '#2563EB';
  const bg = theme.backgroundColor || '#FFFFFF';
  const text = theme.textColor || '#111827';
  const muted = theme.textMutedColor || '#6B7280';
  const surface = theme.surfaceColor || '#F8FAFC';
  const radius = theme.borderRadius === 'full' ? '9999px' : theme.borderRadius === 'large' ? '16px' : theme.borderRadius === 'small' ? '6px' : '12px';

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: text }} className="min-h-screen">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 backdrop-blur-md border-b" style={{ background: `${bg}F5`, borderColor: `${muted}20` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {branding.logo ? (
              <img src={branding.logo} alt={branding.companyName} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: primary }}>
                {branding.companyName?.[0]?.toUpperCase() || 'C'}
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                {branding.companyName || 'Company Name'}
              </h1>
              {branding.tagline && <p className="text-[10px]" style={{ color: muted }}>{branding.tagline}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {contactData?.phone && (
              <a href={`tel:${contactData.phone}`} className="p-2 rounded-lg border text-sm hover:opacity-80 transition-all hidden sm:flex items-center gap-1.5" style={{ borderColor: `${muted}30`, color: primary }}>
                <Phone size={14} /> Call
              </a>
            )}
            {contactData?.whatsapp && (
              <a href={`https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                className="px-3 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5" style={{ background: '#25D366' }}>
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      {heroData && (
        <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}DD)` }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: heroData.backgroundImage ? `url(${heroData.backgroundImage})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
            <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight" style={{ fontFamily: `'${headingFont}', sans-serif` }}>
              {heroData.headline || branding.companyName || 'Welcome'}
            </h2>
            <p className="text-sm sm:text-base text-white/80 mt-3 max-w-xl mx-auto leading-relaxed">
              {heroData.subheadline || branding.tagline || 'Your trusted business partner'}
            </p>
            {heroData.ctaText && (
              <a href={heroData.ctaLink || '#contact'} className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-white font-semibold text-sm hover:shadow-lg transition-all" style={{ color: primary, borderRadius: radius }}>
                {heroData.ctaText} <ChevronRight size={14} />
              </a>
            )}
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      {aboutData && (
        <section className="py-12 sm:py-16" id="about">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {aboutData.image && (
                <div className="rounded-2xl overflow-hidden shadow-lg" style={{ borderRadius: radius }}>
                  <img src={aboutData.image} alt="About" className="w-full h-64 sm:h-80 object-cover" />
                </div>
              )}
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                  About Us
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: muted }}>
                  {aboutData.content || 'We are a professional company committed to delivering excellence.'}
                </p>
                {(aboutData.founded || aboutData.industry) && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    {aboutData.founded && (
                      <div className="px-3 py-2 rounded-lg" style={{ background: surface }}>
                        <p className="text-[10px] font-semibold" style={{ color: muted }}>Founded</p>
                        <p className="text-sm font-bold" style={{ color: text }}>{aboutData.founded}</p>
                      </div>
                    )}
                    {aboutData.industry && (
                      <div className="px-3 py-2 rounded-lg" style={{ background: surface }}>
                        <p className="text-[10px] font-semibold" style={{ color: muted }}>Industry</p>
                        <p className="text-sm font-bold" style={{ color: text }}>{aboutData.industry}</p>
                      </div>
                    )}
                    {aboutData.employees && (
                      <div className="px-3 py-2 rounded-lg" style={{ background: surface }}>
                        <p className="text-[10px] font-semibold" style={{ color: muted }}>Employees</p>
                        <p className="text-sm font-bold" style={{ color: text }}>{aboutData.employees}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICES ── */}
      {servicesData?.items && servicesData.items.length > 0 && (
        <section className="py-12 sm:py-16" id="services" style={{ background: surface }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
              Our Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicesData?.items?.map((svc) => (
                <div key={svc.id} className="bg-white p-5 shadow-sm border hover:shadow-md transition-all" style={{ borderRadius: radius, borderColor: `${muted}15` }}>
                  {svc.image && <img src={svc.image} alt={svc.name} className="w-full h-36 object-cover rounded-lg mb-3" />}
                  <h4 className="text-sm font-bold mb-1" style={{ color: text }}>{svc.name}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: muted }}>{svc.description}</p>
                  {svc.ctaText && (
                    <a href={svc.ctaLink || '#contact'} className="inline-flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: primary }}>
                      {svc.ctaText} <ChevronRight size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      {galleryData?.images && galleryData.images.length > 0 && (
        <section className="py-12 sm:py-16" id="gallery">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
              Gallery
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryData.images.slice(0, 6).map((img) => (
                <div key={img.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all" style={{ borderRadius: radius }}>
                  <img src={img.url} alt={img.caption || 'Gallery'} className="w-full h-40 sm:h-48 object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ── */}
      {contactData && (
        <section className="py-12 sm:py-16" id="contact" style={{ background: surface }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-8" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
              Contact Us
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info */}
              <div className="space-y-3">
                {contactData.address && (
                  <div className="flex items-start gap-3 bg-white p-4 shadow-sm" style={{ borderRadius: radius }}>
                    <MapPin size={18} style={{ color: primary }} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: muted }}>Address</p>
                      <p className="text-sm" style={{ color: text }}>{contactData.address}</p>
                    </div>
                  </div>
                )}
                {contactData.phone && (
                  <a href={`tel:${contactData.phone}`} className="flex items-center gap-3 bg-white p-4 shadow-sm hover:shadow-md transition-all" style={{ borderRadius: radius }}>
                    <Phone size={18} style={{ color: primary }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: muted }}>Phone</p>
                      <p className="text-sm font-medium" style={{ color: primary }}>{contactData.phone}</p>
                    </div>
                  </a>
                )}
                {contactData.email && (
                  <a href={`mailto:${contactData.email}`} className="flex items-center gap-3 bg-white p-4 shadow-sm hover:shadow-md transition-all" style={{ borderRadius: radius }}>
                    <Mail size={18} style={{ color: primary }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: muted }}>Email</p>
                      <p className="text-sm font-medium" style={{ color: primary }}>{contactData.email}</p>
                    </div>
                  </a>
                )}
                {contactData.whatsapp && (
                  <a href={`https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                    className="flex items-center gap-3 p-4 text-white shadow-sm hover:shadow-md transition-all" style={{ borderRadius: radius, background: '#25D366' }}>
                    <MessageCircle size={18} />
                    <div>
                      <p className="text-xs font-semibold text-white/80">WhatsApp</p>
                      <p className="text-sm font-medium">{contactData.whatsapp}</p>
                    </div>
                  </a>
                )}
              </div>

              {/* Map */}
              {contactData.googleMapsEmbed && (
                <div className="overflow-hidden shadow-sm" style={{ borderRadius: radius }}>
                  <iframe
                    src={contactData.googleMapsEmbed}
                    width="100%" height="300" style={{ border: 0 }}
                    allowFullScreen loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-6 border-t" style={{ borderColor: `${muted}15` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: muted }}>
            © {new Date().getFullYear()} {branding.companyName || 'Company'}. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-[10px]" style={{ color: muted }}>Powered by</span>
            <a href="https://thenijobs.com" className="text-[10px] font-bold" style={{ color: primary }}>THENIJOBS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
