'use client';

import { Phone, Mail, MessageCircle, ChevronRight, ArrowUpRight } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, ServiceItem, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }

function getSection<T>(sections: PortfolioSection[], type: string): T | null {
  const s = sections.find(s => s.type === type && s.visible);
  return s ? (s.data as T) : null;
}

/* Inline SVG social icons – lucide-react doesn't ship brand icons */
const SvgIcon = ({ d, size = 16, ...rest }: { d: string; size?: number } & React.SVGAttributes<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...rest}><path d={d} /></svg>
);

const LinkedinIcon = (p: any) => <SvgIcon {...p} d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />;
const FacebookIcon = (p: any) => <SvgIcon {...p} d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />;
const InstagramIcon = (p: any) => <SvgIcon {...p} d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />;
const TwitterIcon = (p: any) => <SvgIcon {...p} d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />;

const SOCIAL_ICONS: Record<string, React.ComponentType<any>> = {
  linkedin: LinkedinIcon, facebook: FacebookIcon, instagram: InstagramIcon, twitter: TwitterIcon,
};

export default function CleanCorporate({ site }: Props) {
  const { theme, branding, sections } = site;
  const heroData = getSection<any>(sections, 'hero');
  const aboutData = getSection<any>(sections, 'about');
  const servicesData = getSection<{ items: ServiceItem[] }>(sections, 'services');
  const contactData = getSection<ContactSectionData>(sections, 'contact');
  const socialData = getSection<{ links: { platform: string; url: string }[] }>(sections, 'social-links');

  const p = theme.primaryColor || '#1E3A5F';
  const bg = theme.backgroundColor || '#FFFFFF';
  const text = theme.textColor || '#111827';
  const muted = theme.textMutedColor || '#64748B';
  const surface = theme.surfaceColor || '#F1F5F9';
  const font = theme.fontFamily || 'Inter';
  const hFont = theme.headingFont || 'Poppins';
  const r = theme.borderRadius === 'full' ? '9999px' : theme.borderRadius === 'large' ? '20px' : theme.borderRadius === 'small' ? '4px' : '10px';

  return (
    <div style={{ fontFamily: `'${font}', sans-serif`, background: bg, color: text }} className="min-h-screen">
      {/* ── NAV ── */}
      <nav className="border-b" style={{ borderColor: `${muted}12`, background: bg }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-3">
            {branding.logo ? (
              <img src={branding.logo} alt="" className="h-10 w-auto" />
            ) : (
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ background: p }}>
                {branding.companyName?.[0] || 'C'}
              </div>
            )}
            <span className="text-base font-bold hidden sm:block" style={{ fontFamily: `'${hFont}', sans-serif`, color: text }}>
              {branding.companyName}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-medium" style={{ color: muted }}>
            {['About', 'Services', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:opacity-70 transition-opacity">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {contactData?.phone && (
              <a href={`tel:${contactData.phone}`} className="px-4 py-2 border text-xs font-semibold hidden sm:flex items-center gap-1.5 transition-all hover:shadow-sm" style={{ borderRadius: r, borderColor: `${muted}25`, color: p }}>
                <Phone size={13} /> {contactData.phone}
              </a>
            )}
            {contactData?.whatsapp && (
              <a href={`https://wa.me/${contactData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener"
                className="px-4 py-2 text-xs font-semibold text-white flex items-center gap-1.5" style={{ borderRadius: r, background: p }}>
                <MessageCircle size={13} /> Enquire
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      {heroData && (
        <section className="relative" style={{ background: surface }}>
          <div className="max-w-7xl mx-auto px-6 py-20 sm:py-28 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold mb-4" style={{ background: `${p}10`, color: p }}>
                ● Trusted since {aboutData?.founded || '2020'}
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold leading-tight" style={{ fontFamily: `'${hFont}', sans-serif`, color: text }}>
                {heroData.headline || branding.companyName || 'Corporate Excellence'}
              </h1>
              <p className="text-sm sm:text-base mt-4 max-w-lg leading-relaxed" style={{ color: muted }}>
                {heroData.subheadline || branding.tagline || 'Delivering professional services with integrity and innovation.'}
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {heroData.ctaText && (
                  <a href={heroData.ctaLink || '#contact'} className="px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 transition-all" style={{ borderRadius: r, background: p }}>
                    {heroData.ctaText} <ArrowUpRight size={14} />
                  </a>
                )}
                <a href="#services" className="px-6 py-3 text-sm font-semibold border flex items-center gap-2 hover:shadow-sm transition-all" style={{ borderRadius: r, borderColor: `${muted}25`, color: text }}>
                  Our Services
                </a>
              </div>
            </div>
            {heroData.backgroundImage && (
              <div className="overflow-hidden shadow-2xl" style={{ borderRadius: r }}>
                <img src={heroData.backgroundImage} alt="" className="w-full h-[350px] object-cover" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      {aboutData && (
        <section className="py-16 sm:py-20" id="about">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3" style={{ color: p }}>ABOUT US</p>
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: `'${hFont}', sans-serif` }}>
                {aboutData.mission || 'Our Story'}
              </h2>
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: muted }}>
                {aboutData.content || 'We are committed to providing exceptional services to our clients.'}
              </p>
            </div>
            {(aboutData.founded || aboutData.employees || aboutData.industry) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
                {[
                  { label: 'Founded', value: aboutData.founded },
                  { label: 'Industry', value: aboutData.industry },
                  { label: 'Team Size', value: aboutData.employees },
                  { label: 'Location', value: contactData?.address?.split(',').pop()?.trim() },
                ].filter(d => d.value).map(d => (
                  <div key={d.label} className="p-4 border" style={{ borderRadius: r, borderColor: `${muted}15` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: muted }}>{d.label}</p>
                    <p className="text-lg font-bold" style={{ color: text }}>{d.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SERVICES ── */}
      {servicesData?.items && servicesData.items.length > 0 && (
        <section className="py-16 sm:py-20" id="services" style={{ background: surface }}>
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3 text-center" style={{ color: p }}>WHAT WE DO</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ fontFamily: `'${hFont}', sans-serif` }}>
              Our Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicesData?.items?.map((svc, i) => (
                <div key={svc.id} className="bg-white p-6 border hover:shadow-lg hover:-translate-y-1 transition-all duration-300" style={{ borderRadius: r, borderColor: `${muted}10` }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-4" style={{ background: p }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h4 className="text-base font-bold mb-2" style={{ fontFamily: `'${hFont}', sans-serif` }}>{svc.name}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: muted }}>{svc.description}</p>
                  {svc.ctaText && (
                    <a href={svc.ctaLink || '#contact'} className="inline-flex items-center gap-1 mt-4 text-xs font-semibold" style={{ color: p }}>
                      {svc.ctaText} <ChevronRight size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CONTACT ── */}
      {contactData && (
        <section className="py-16 sm:py-20" id="contact">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[3px] mb-3" style={{ color: p }}>GET IN TOUCH</p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: `'${hFont}', sans-serif` }}>
                  Contact Us
                </h2>
                <div className="space-y-4">
                  {contactData.address && (
                    <p className="text-sm" style={{ color: muted }}>{contactData.address}</p>
                  )}
                  {contactData.email && (
                    <a href={`mailto:${contactData.email}`} className="text-sm font-medium flex items-center gap-2 hover:opacity-80" style={{ color: p }}>
                      <Mail size={14} /> {contactData.email}
                    </a>
                  )}
                  {contactData.phone && (
                    <a href={`tel:${contactData.phone}`} className="text-sm font-medium flex items-center gap-2 hover:opacity-80" style={{ color: p }}>
                      <Phone size={14} /> {contactData.phone}
                    </a>
                  )}
                </div>

                {/* Social */}
                {socialData?.links && socialData.links.length > 0 && (
                  <div className="flex items-center gap-2 mt-6">
                    {socialData?.links?.map(link => {
                      const Icon = SOCIAL_ICONS[link.platform.toLowerCase()];
                      return Icon ? (
                        <a key={link.platform} href={link.url} target="_blank" rel="noopener"
                          className="p-2 border rounded-lg hover:shadow-sm transition-all" style={{ borderColor: `${muted}20`, color: muted }}>
                          <Icon size={16} />
                        </a>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {contactData.googleMapsEmbed && (
                <div className="overflow-hidden shadow-lg" style={{ borderRadius: r }}>
                  <iframe src={contactData.googleMapsEmbed} width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy" />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t" style={{ borderColor: `${muted}12` }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: muted }}>© {new Date().getFullYear()} {branding.companyName}. All rights reserved.</p>
          <div className="flex items-center gap-1 text-[10px]" style={{ color: muted }}>
            Powered by <a href="https://thenijobs.com" className="font-bold ml-0.5" style={{ color: p }}>THENIJOBS</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
