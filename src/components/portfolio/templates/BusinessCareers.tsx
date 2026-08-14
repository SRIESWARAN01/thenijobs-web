'use client';

import { Phone, Mail, MessageCircle, Briefcase, MapPin, Users, ArrowRight } from 'lucide-react';
import type { PortfolioSite, PortfolioSection, CareerOpening, ServiceItem, ContactSectionData } from '@/lib/types/portfolio';

interface Props { site: PortfolioSite; }
function getS<T>(s: PortfolioSection[], t: string): T | null { const f = s.find(x => x.type === t && x.visible); return f ? (f.data as T) : null; }

export default function BusinessCareers({ site }: Props) {
  const { theme: th, branding: b, sections: s } = site;
  const hero = getS<any>(s, 'hero'), about = getS<any>(s, 'about');
  const careers = getS<{ openings: CareerOpening[] }>(s, 'careers');
  const contact = getS<ContactSectionData>(s, 'contact');

  const p = th.primaryColor || '#2563EB';
  const font = th.fontFamily || 'Inter';

  return (
    <div style={{ fontFamily: `'${font}', sans-serif` }} className="min-h-screen bg-white text-slate-900">
      <header className="border-b sticky top-0 z-30 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            {b.logo ? <img src={b.logo} alt="" className="h-10 w-auto" /> : (
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <Briefcase size={20} />
              </div>
            )}
            <div>
              <span className="text-base font-bold">{b.companyName}</span>
              <span className="ml-2 px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">CAREERS</span>
            </div>
          </div>
          <a href="#openings" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">View Open Positions</a>
        </div>
      </header>

      {hero && (
        <section className="py-24 bg-gradient-to-b from-blue-50 to-white text-center">
          <div className="max-w-4xl mx-auto px-6">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">WE ARE HIRING</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-4">{hero.headline || `Build Your Career at ${b.companyName}`}</h1>
            <p className="text-base text-slate-600 mt-4 max-w-2xl mx-auto">{hero.subheadline || 'Join our passionate team and help shape the future of our industry.'}</p>
          </div>
        </section>
      )}

      {(careers?.openings?.length ?? 0) > 0 && (
        <section className="py-20" id="openings">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-center mb-10">Current Job Openings</h2>
            <div className="space-y-4">
              {careers!.openings.map(job => (
                <div key={job.id} className="p-6 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{job.department} • {job.location} • {job.type}</p>
                  </div>
                  <a href={job.link || '#contact'} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-700">
                    Apply Now <ArrowRight size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="py-8 border-t text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {b.companyName} • Careers Portal
      </footer>
    </div>
  );
}
