'use client';

import { useState } from 'react';
import { Search, MapPin, Lock, User, Award, Clock, Loader2, Phone, Mail, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import Link from 'next/link';
import { EmptyState } from '@/components/dashboard';

export default function TalentSearchPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All Districts');
  const [expFilter, setExpFilter] = useState('All Experience');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 1. Fetch employer's company to check premium status
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const isPremiumCompany = company?.isPremium === true;

  // 2. Fetch seeker profiles
  const { data: seekerProfiles, loading: profilesLoading } = useCollection<any>('seekerProfiles');

  const districts = ['All Districts', ...Array.from(new Set(seekerProfiles.map((p: any) => p.district).filter(Boolean)))];
  
  const filtered = seekerProfiles.filter((c: any) => {
    // Text search (name / skills / currentRole)
    const matchesSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.currentRole?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));

    // District filter
    const matchesDistrict =
      districtFilter === 'All Districts' ||
      c.district === districtFilter;

    // Experience filter
    let matchesExp = true;
    if (expFilter !== 'All Experience') {
      const expCount = c.experience?.length || 0;
      if (expFilter === 'Fresher') {
        matchesExp = expCount === 0;
      } else if (expFilter === '1-3 Years') {
        matchesExp = expCount >= 1 && expCount <= 2;
      } else if (expFilter === '3+ Years') {
        matchesExp = expCount >= 3;
      }
    }

    return matchesSearch && matchesDistrict && matchesExp;
  });

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'C';
  };

  const loading = companyLoading || profilesLoading;

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-outfit">Candidate Resume Bank</h1>
        <p className="text-sm text-slate-500 mt-1">Skill, location, experience filter மூலம் suitable candidates-ஐ வேகமாக கண்டுபிடிக்கலாம்.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Award, label: 'Skill Filter', text: 'Role, trade, tools அடிப்படையில் search' },
          { icon: MapPin, label: 'Location Filter', text: 'District / nearby candidate shortlist' },
          { icon: Clock, label: 'Experience Filter', text: 'Fresher முதல் experienced வரை' },
        ].map(({ icon: Icon, label, text }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{label}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Banner */}
      {!isPremiumCompany && (
        <div className="glass-card rounded-2xl p-4 bg-gradient-to-r from-violet-500/10 to-amber-500/10 border border-violet-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Lock size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                  Premium Search Mode <Sparkles size={13} className="text-amber-600" />
                </p>
                <p className="text-[11px] text-slate-500">Upgrade your company listing to Premium to contact candidates directly and view full portfolios.</p>
              </div>
            </div>
            <Link
              href="/employer/billing"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Upgrade Listing
            </Link>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skill, role, candidate name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 outline-none focus:border-blue-500"
            >
              <option value="All Districts">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={expFilter}
              onChange={(e) => setExpFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-slate-500 outline-none focus:border-blue-500"
            >
              <option value="All Experience">All Experience</option>
              <option value="Fresher">Fresher (No Experience)</option>
              <option value="1-3 Years">1-3 Years Experience</option>
              <option value="3+ Years">3+ Years Experience</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
          <p className="text-sm text-slate-500">Searching profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Results List */}
          <div className="lg:col-span-2 space-y-3">
            {filtered.map((c) => {
              const experienceCount = c.experience?.length || 0;
              const hasExperience = experienceCount > 0;
              const educationText = c.education?.[0] ? `${c.education[0].degree} ${c.education[0].field || ''}` : 'N/A';

              // Calculate profile strength
              const email = c.email || 'N/A';
              const phone = c.phone || 'N/A';
              const experienceList = c.experience || [];
              const educationList = c.education || [];
              const skillsList = c.skills || [];
              const strengthItems = [
                { label: 'Photo', done: !!c.photoUrl },
                { label: 'Contact', done: !!phone && phone !== 'N/A' && !!email && email !== 'N/A' },
                { label: 'Education', done: educationList.length > 0 },
                { label: 'Experience', done: experienceList.length > 0 },
                { label: 'Skills', done: skillsList.length >= 3 },
              ];
              const strength = Math.round((strengthItems.filter(i => i.done).length / strengthItems.length) * 100);

              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selectedCandidate?.id === c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className={`tap-target-auto w-full rounded-2xl border bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    selectedCandidate?.id === c.id ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-gray-900">{getInitials(c.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-gray-900">{c.name}</p>
                        <span className="text-xs text-gray-500">
                          · {hasExperience ? `${experienceCount} work place(s)` : 'Fresher'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-blue-700">{c.currentRole || 'Job Seeker'}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> {c.district || 'Theni'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award size={11} /> {educationText}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {skillsList.slice(0, 5).map((s: string) => (
                          <span
                            key={s}
                            className="rounded-lg bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-medium text-[#1E40AF]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-medium">Profile Strength</span>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              strength >= 80 ? 'bg-emerald-500' : strength >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${strength}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums text-slate-600">{strength}%</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <EmptyState
                icon={User}
                title="No candidates found"
                description="Reset the filters or try another keyword."
              />
            )}
          </div>

          {/* Details Sidebar / Modal */}
          <div className="lg:col-span-1">
            {selectedCandidate ? (
              <div className="glass-card rounded-2xl p-5 space-y-5 sticky top-24">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{getInitials(selectedCandidate.name)}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{selectedCandidate.name}</h3>
                      <p className="text-xs text-gray-500">{selectedCandidate.currentRole || 'Job Seeker'}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="text-gray-500 hover:text-white p-1">
                    <X size={16} />
                  </button>
                </div>

                {/* Candidate Overview */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin size={13} className="text-blue-600" />
                    <span>Resident of {selectedCandidate.district || 'Theni'}</span>
                  </div>
                  {selectedCandidate.address && (
                    <p className="text-xs text-gray-500 pl-5">{selectedCandidate.address}</p>
                  )}
                </div>

                {/* Contact Card */}
                <div className="p-4 rounded-xl bg-[#0e0e22] border border-white/[0.04] space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Information</h4>
                  {isPremiumCompany ? (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-blue-600" />
                        <span className="text-white font-medium">{selectedCandidate.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-blue-600" />
                        <span className="text-white font-medium truncate block max-w-[180px]">{selectedCandidate.email || 'N/A'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 py-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500 blur-[3px] select-none">
                        <Phone size={13} />
                        <span>+91 99999 99999</span>
                      </div>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Lock size={12} /> Unlock Contact Info
                      </button>
                    </div>
                  )}
                </div>

                {/* Experience details */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-slate-500">Experience History</h4>
                  {(selectedCandidate.experience || []).length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No experience documented</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCandidate.experience.map((exp: any, idx: number) => (
                        <div key={idx} className="text-xs pl-2.5 border-l border-violet-500/30">
                          <p className="font-semibold text-gray-900">{exp.role}</p>
                          <p className="text-slate-500">{exp.company} ({exp.startDate} - {exp.endDate})</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Education details */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-slate-500">Education Details</h4>
                  {(selectedCandidate.education || []).length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No education documented</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCandidate.education.map((edu: any, idx: number) => (
                        <div key={idx} className="text-xs pl-2.5 border-l border-emerald-500/30">
                          <p className="font-semibold text-gray-900">{edu.degree} in {edu.field}</p>
                          <p className="text-slate-500">{edu.institution} ({edu.year})</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center text-gray-500 sticky top-24 hidden lg:block">
                <User size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs">Select a candidate profile to view details and contact info.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full border border-violet-200 text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto text-violet-600">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Unlock Candidate Contact</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Contacting candidates directly requires a Premium Listing plan.
                Upgrade today to unlock unlimited candidates, WhatsApp triggers, and get featured placement.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Link
                href="/employer/billing"
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Upgrade Now
              </Link>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2 rounded-xl bg-white text-slate-500 text-xs font-medium hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
