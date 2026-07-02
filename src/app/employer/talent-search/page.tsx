'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Lock, User, Award, Clock, Loader2, Phone, Mail, Sparkles, X, FileText, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import Link from 'next/link';
import { planHasFeature, selectBestSubscription } from '@/lib/subscriptions';
import { useLocations } from '@/hooks/useLocations';

export default function TalentSearchPage() {
  const { user } = useAuth();
  const { allAreas } = useLocations();
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All Areas');
  const [expFilter, setExpFilter] = useState('All Experience');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // 1. Fetch employer's company to check premium status
  const { data: companies, loading: companyLoading } = useCollection<any>('companies', [
    where('ownerId', '==', user?.uid || '')
  ], { skip: !user?.uid });

  const company = companies[0];
  const companyId = company?.id;

  const { data: subscriptions, loading: subsLoading } = useCollection<any>('subscriptions', [
    where('companyId', '==', companyId || ''),
  ], { skip: !companyId });

  const activeSub = selectBestSubscription(subscriptions);
  const activePlan = activeSub?.plan || company?.subscriptionPlan || (company?.isPremium ? 'premium' : 'free');
  const canContactCandidates = planHasFeature(activePlan, 'direct_candidate_contact');
  const hasApprovedCompany =
    company?.verificationStatus === 'verified' ||
    company?.status === 'approved' ||
    company?.isVerified === true;
  const canSearchCandidates = Boolean(
    user?.uid &&
    (user?.employerVerified || user?.companyVerified || hasApprovedCompany),
  );

  // 2. Fetch employer-readable public seeker profiles via Callable Function
  const [seekerProfiles, setSeekerProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // 3. Cache contacts to avoid repeated backend calls
  const [candidateContacts, setCandidateContacts] = useState<Record<string, { phone: string; email: string; resumeUrl?: string; resumes?: any[] }>>({});
  const [contactLoading, setContactLoading] = useState<string | null>(null);

  const selectedCandidateId = selectedCandidate?.id;
  const contactInfo = selectedCandidateId ? candidateContacts[selectedCandidateId] : null;

  useEffect(() => {
    if (!canSearchCandidates) {
      setSeekerProfiles([]);
      return;
    }

    let active = true;
    const loadProfiles = async () => {
      setProfilesLoading(true);
      setProfilesError(null);
      try {
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('@/lib/firebase/config');
        const talentSearchCallable = httpsCallable<any, { success: boolean; profiles: any[] }>(functions, 'serverTalentSearch');
        const result = await talentSearchCallable();
        if (active && result.data.success) {
          setSeekerProfiles(result.data.profiles || []);
        }
      } catch (err: any) {
        console.error('Failed to search candidates:', err);
        if (active) {
          setProfilesError(err.message || 'Failed to load candidates.');
        }
      } finally {
        if (active) {
          setProfilesLoading(false);
        }
      }
    };

    loadProfiles();
    return () => {
      active = false;
    };
  }, [canSearchCandidates]);

  useEffect(() => {
    if (!selectedCandidateId || !canContactCandidates) return;
    if (candidateContacts[selectedCandidateId] || contactLoading === selectedCandidateId) return;

    let active = true;
    const loadContact = async () => {
      setContactLoading(selectedCandidateId);
      try {
        const { httpsCallable } = await import('firebase/functions');
        const { functions } = await import('@/lib/firebase/config');
        const getContactCallable = httpsCallable<{ candidateId: string }, { success: boolean; phone: string; email: string; resumeUrl?: string; resumes?: any[] }>(
          functions,
          'serverGetCandidateContact'
        );
        const result = await getContactCallable({ candidateId: selectedCandidateId });
        if (active && result.data.success) {
          setCandidateContacts(prev => ({
            ...prev,
            [selectedCandidateId]: {
              phone: result.data.phone,
              email: result.data.email,
              resumeUrl: result.data.resumeUrl,
              resumes: result.data.resumes || [],
            }
          }));
        }
      } catch (err) {
        console.error('Failed to fetch candidate contact:', err);
      } finally {
        if (active) {
          setContactLoading(null);
        }
      }
    };

    loadContact();
    return () => {
      active = false;
    };
  }, [selectedCandidateId, canContactCandidates, candidateContacts, contactLoading]);

  const districts = ['All Areas', ...allAreas];
  
  const filtered = seekerProfiles.filter((c: any) => {
    // Text search (name / skills / currentRole)
    const matchesSearch =
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.currentRole?.toLowerCase().includes(search.toLowerCase()) ||
      c.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()));

    // District filter
    const matchesDistrict =
      districtFilter === 'All Areas' ||
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

  const loading = companyLoading || profilesLoading || subsLoading;

  return (
    <div className="space-y-6 animate-fade-in-up font-outfit">
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Candidate Resume Bank</h1>
        <p className="text-sm text-gray-400 mt-1">Skill, location, experience filter மூலம் suitable candidates-ஐ வேகமாக கண்டுபிடிக்கலாம்.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Award, label: 'Skill Filter', text: 'Role, trade, tools அடிப்படையில் search' },
          { icon: MapPin, label: 'Location Filter', text: 'District / nearby candidate shortlist' },
          { icon: Clock, label: 'Experience Filter', text: 'Fresher முதல் experienced வரை' },
        ].map(({ icon: Icon, label, text }) => (
          <div key={label} className="glass-card rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-cyan-300" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{label}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Premium Banner */}
      {!canContactCandidates && (
        <div className="glass-card rounded-2xl p-4 bg-gradient-to-r from-violet-500/10 to-amber-500/10 border border-violet-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Lock size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                  Premium Search Mode <Sparkles size={13} className="text-amber-400" />
                </p>
                <p className="text-[11px] text-gray-400">Upgrade your company listing to Premium to contact candidates directly and view full portfolios.</p>
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

      {!companyLoading && !canSearchCandidates && (
        <div className="glass-card rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Lock size={18} className="text-amber-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Verified employer access required</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Candidate search unlocks after your company profile is approved by the THENIJOBS team.
              </p>
              <Link
                href="/employer/company-profile"
                className="mt-3 inline-flex rounded-xl bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                Review Company Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      {canSearchCandidates && <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skill, role, candidate name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-gray-500 focus:border-cyan-500/40 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-cyan-500/40"
            >
              <option value="All Areas">All Areas</option>
              {districts.slice(1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={expFilter}
              onChange={(e) => setExpFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-gray-300 outline-none focus:border-cyan-500/40"
            >
              <option value="All Experience">All Experience</option>
              <option value="Fresher">Fresher (No Experience)</option>
              <option value="1-3 Years">1-3 Years Experience</option>
              <option value="3+ Years">3+ Years Experience</option>
            </select>
          </div>
        </div>
      </div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Searching profiles...</p>
        </div>
      ) : canSearchCandidates ? (
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
                <div
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className={`glass-card rounded-2xl p-5 hover:border-white/15 transition-all cursor-pointer ${
                    selectedCandidate?.id === c.id ? 'border-cyan-500/40' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-white">{getInitials(c.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-white">{c.name}</p>
                        <span className="text-xs text-gray-500">
                          · {hasExperience ? `${experienceCount} work place(s)` : 'Fresher'}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-400 mt-0.5 font-medium">{c.currentRole || 'Job Seeker'}</p>
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
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 text-[10px] font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-medium">Profile Strength</span>
                        <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              strength >= 80 ? 'bg-emerald-500' : strength >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${strength}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{strength}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {profilesError && (
              <div className="glass-card rounded-2xl p-6 text-center border-rose-500/20 bg-rose-500/5">
                <p className="text-sm font-semibold text-rose-300">Error searching candidates</p>
                <p className="text-xs text-rose-400/80 mt-1">{profilesError}</p>
              </div>
            )}

            {filtered.length === 0 && !profilesError && (
              <div className="glass-card rounded-2xl p-12 text-center">
                <User size={32} className="text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No candidates found</p>
                <p className="text-xs text-gray-500 mt-1">Try resetting filters or typing another keyword</p>
              </div>
            )}
          </div>

          {/* Details Sidebar / Modal */}
          <div className="lg:col-span-1">
            {selectedCandidate ? (
              <div className="glass-card rounded-2xl p-5 space-y-5 sticky top-24">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{getInitials(selectedCandidate.name)}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedCandidate.name}</h3>
                      <p className="text-xs text-gray-500">{selectedCandidate.currentRole || 'Job Seeker'}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="text-gray-500 hover:text-white p-1">
                    <X size={16} />
                  </button>
                </div>

                {/* Candidate Overview */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin size={13} className="text-cyan-400" />
                    <span>Resident of {selectedCandidate.district || 'Theni'}</span>
                  </div>
                  {selectedCandidate.address && (
                    <p className="text-xs text-gray-500 pl-5">{selectedCandidate.address}</p>
                  )}
                </div>

                {/* Contact Card */}
                <div className="p-4 rounded-xl bg-[#0e0e22] border border-white/[0.04] space-y-3">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h4>
                  {canContactCandidates ? (
                    contactLoading === selectedCandidateId ? (
                      <div className="flex items-center gap-2 py-1 text-xs text-gray-400">
                        <Loader2 size={12} className="animate-spin text-cyan-400" />
                        <span>Contact info loading...</span>
                      </div>
                    ) : contactInfo ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-cyan-400" />
                          <span className="text-white font-medium">{contactInfo.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-cyan-400" />
                          <span className="text-white font-medium truncate block max-w-[180px]">{contactInfo.email || 'N/A'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-400/80">Failed to load contact details.</div>
                    )
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

                {/* Resumes Section */}
                {canContactCandidates && !contactLoading && contactInfo && (contactInfo.resumeUrl || (contactInfo.resumes && contactInfo.resumes.length > 0)) && (
                  <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                    <h4 className="text-xs font-semibold text-gray-400">Candidate Resumes</h4>
                    <div className="space-y-2">
                      {contactInfo.resumeUrl && (
                        <a
                          href={contactInfo.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-cyan-400 flex-shrink-0" />
                            <span className="text-xs text-white truncate font-medium">Primary Resume</span>
                          </div>
                          <Download size={13} className="text-gray-400" />
                        </a>
                      )}
                      {contactInfo.resumes?.map((res: any, idx: number) => (
                        <a
                          key={idx}
                          href={res.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="text-cyan-400 flex-shrink-0" />
                            <span className="text-xs text-white truncate font-medium">{res.name || `Resume ${idx + 1}`}</span>
                          </div>
                          <Download size={13} className="text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience details */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <h4 className="text-xs font-semibold text-gray-400">Experience History</h4>
                  {(selectedCandidate.experience || []).length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No experience documented</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCandidate.experience.map((exp: any, idx: number) => (
                        <div key={idx} className="text-xs pl-2.5 border-l border-violet-500/30">
                          <p className="font-semibold text-white">{exp.role}</p>
                          <p className="text-gray-400">{exp.company} ({exp.startDate} - {exp.endDate})</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Education details */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                  <h4 className="text-xs font-semibold text-gray-400">Education Details</h4>
                  {(selectedCandidate.education || []).length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No education documented</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCandidate.education.map((edu: any, idx: number) => (
                        <div key={idx} className="text-xs pl-2.5 border-l border-emerald-500/30">
                          <p className="font-semibold text-white">{edu.degree} in {edu.field}</p>
                          <p className="text-gray-400">{edu.institution} ({edu.year})</p>
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
      ) : null}

      {/* Upgrade Plan Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 max-w-sm w-full border border-violet-500/20 text-center space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto text-violet-400">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Unlock Candidate Contact</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
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
                className="flex-1 py-2 rounded-xl bg-white/[0.06] text-gray-400 text-xs font-medium hover:text-white transition-colors"
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
