'use client';

import { LayoutGrid, Check, Lock, Sparkles } from 'lucide-react';
import { hasFeaturePermission } from '@/lib/plans';
import Link from 'next/link';

export const ALL_COMPANY_SECTIONS = [
  { key: 'home', label: 'Home / Hero Banner', desc: 'Cover image, company logo, tagline, and direct contact buttons' },
  { key: 'about', label: 'About Us & History', desc: 'Full company description, established year, and company size' },
  { key: 'products', label: 'Products Catalogue', desc: 'Showcase physical or digital products with pricing and WhatsApp enquiry' },
  { key: 'services', label: 'Services Directory', desc: 'List commercial, industrial, or trade services with starting rates' },
  { key: 'whyChooseUs', label: 'Why Choose Us', desc: 'Trust badges, guarantees, and value propositions' },
  { key: 'founder', label: 'Founder / Leadership', desc: 'Founder bio, photo, message, and social links' },
  { key: 'portfolio', label: 'Portfolio & Projects', desc: 'Completed works, client contracts, and achievements' },
  { key: 'gallery', label: 'Photo & Video Gallery', desc: 'Company photos, office, factory, or farmland visuals' },
  { key: 'reviews', label: 'Customer & Employee Reviews', desc: 'Star ratings, reviews, and verified job seeker feedback' },
  { key: 'jobs', label: 'Active Open Jobs', desc: 'Current job openings in Theni & surrounding regions' },
  { key: 'contact', label: 'Contact Us & Direct Action', desc: 'Call Now, WhatsApp, Email, and Location map embed' },
] as const;

interface CompanySectionTogglerProps {
  enabledSections?: Record<string, boolean>;
  planSlug?: string;
  onChange: (sections: Record<string, boolean>) => void;
}

export default function CompanySectionToggler({
  enabledSections = {},
  planSlug = 'free',
  onChange,
}: CompanySectionTogglerProps) {
  const isCustomSectionsEnabled = hasFeaturePermission(planSlug, 'customSections');

  const toggleSection = (key: string) => {
    if (!isCustomSectionsEnabled && ['products', 'services', 'founder', 'portfolio'].includes(key)) {
      return;
    }
    const updated = {
      ...enabledSections,
      [key]: enabledSections[key] !== false ? false : true,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <LayoutGrid size={20} className="text-blue-600" /> Modular Website Sections
        </h3>
        <p className="text-xs text-slate-500">Enable or disable specific sections on your public company website</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_COMPANY_SECTIONS.map(sec => {
          const isEnabled = enabledSections[sec.key] !== false;
          const isLocked = !isCustomSectionsEnabled && ['products', 'services', 'founder', 'portfolio'].includes(sec.key);

          return (
            <div
              key={sec.key}
              onClick={() => !isLocked && toggleSection(sec.key)}
              className={`rounded-2xl border p-4 transition-all flex items-start justify-between gap-3 ${
                isLocked
                  ? 'border-amber-200/60 bg-amber-50/30 opacity-75 cursor-not-allowed'
                  : isEnabled
                  ? 'border-blue-200 bg-blue-50/30 cursor-pointer shadow-sm'
                  : 'border-slate-200 bg-white cursor-pointer hover:border-slate-300'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{sec.label}</h4>
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      <Lock size={10} /> Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{sec.desc}</p>
              </div>

              <div className="flex-shrink-0 pt-0.5">
                {isLocked ? (
                  <Link
                    href="/employer/subscription"
                    onClick={e => e.stopPropagation()}
                    className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all"
                    title="Upgrade plan to unlock section"
                  >
                    <Lock size={14} />
                  </Link>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isEnabled ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isEnabled && <Check size={14} />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
