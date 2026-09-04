'use client';

import { FounderProfile } from '@/lib/types';
import { hasFeaturePermission } from '@/lib/plans';
import {
  User, Lock, Sparkles, MapPin, Briefcase, Globe,
  Quote, ImagePlus, Save
} from 'lucide-react';
import { FacebookIcon, LinkedinIcon } from '@/components/ui/BrandIcons';
import Link from 'next/link';

interface CompanyFounderManagerProps {
  founder?: FounderProfile;
  planSlug?: string;
  onChange: (founder: FounderProfile) => void;
}

export default function CompanyFounderManager({
  founder = { name: '', designation: '' },
  planSlug = 'free',
  onChange,
}: CompanyFounderManagerProps) {
  const isEnabled = hasFeaturePermission(planSlug, 'founderProfile');

  const updateField = (key: keyof FounderProfile, value: string) => {
    onChange({ ...founder, [key]: value });
  };

  if (!isEnabled) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 p-8 text-center shadow-md font-outfit">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30">
          <Lock size={32} />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
          <Sparkles size={13} /> Premium Feature
        </span>
        <h3 className="mt-3 text-xl font-bold text-slate-900">Founder & Leadership Profile Disabled</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Upgrade to our <strong className="text-slate-900 font-semibold">Standard Package (₹480/yr)</strong> or higher to feature Founder details, leadership messages, native location, experience, and LinkedIn links.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/employer/subscription"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
          >
            <span>Upgrade Subscription</span>
            <Sparkles size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit">
      {/* Header */}
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <User size={20} className="text-blue-600" /> Founder & Owner Profile
        </h3>
        <p className="text-xs text-slate-500">Showcase company leadership, experience, native origin, and founder&apos;s message</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photo & Basic Details */}
        <div className="space-y-4 md:col-span-1">
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-center space-y-3">
            <div className="w-24 h-24 mx-auto rounded-full bg-slate-200 overflow-hidden relative border-2 border-white shadow-md">
              {founder.photoUrl ? (
                <img src={founder.photoUrl} alt="Founder" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <User size={36} />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Founder Photo URL</label>
              <input
                type="url"
                value={founder.photoUrl || ''}
                onChange={e => updateField('photoUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Detailed Form */}
        <div className="space-y-4 md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Founder Name *</label>
              <input
                type="text"
                value={founder.name || ''}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Designation *</label>
              <input
                type="text"
                value={founder.designation || ''}
                onChange={e => updateField('designation', e.target.value)}
                placeholder="Designation or title"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Native Place / Location</label>
              <input
                type="text"
                value={founder.nativePlace || ''}
                onChange={e => updateField('nativePlace', e.target.value)}
                placeholder="Location"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Experience Years</label>
              <input
                type="text"
                value={founder.experienceYears || ''}
                onChange={e => updateField('experienceYears', e.target.value)}
                placeholder="Years of experience"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Short Biography</label>
            <textarea
              rows={3}
              value={founder.bio || ''}
              onChange={e => updateField('bio', e.target.value)}
              placeholder="Background, qualifications, and journey..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Founder&apos;s Message to Clients & Candidates</label>
            <textarea
              rows={3}
              value={founder.message || ''}
              onChange={e => updateField('message', e.target.value)}
              placeholder="&quot;Our mission is to empower local agriculture and trade...&quot;"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={founder.linkedinUrl || ''}
                onChange={e => updateField('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Twitter / X URL</label>
              <input
                type="url"
                value={founder.twitterUrl || ''}
                onChange={e => updateField('twitterUrl', e.target.value)}
                placeholder="https://x.com/..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
