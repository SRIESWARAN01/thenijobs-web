'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, BadgeCheck, Briefcase, Download, GraduationCap, Mail, MapPin, Phone, ShieldCheck, Star } from 'lucide-react';
import { useDocument } from '@/hooks/useFirestore';

interface PublicProfile {
  name?: string;
  displayName?: string;
  currentRole?: string;
  qualification?: string;
  district?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  profilePhotoUrl?: string;
  photoURL?: string;
  skills?: string[];
  education?: any[];
  experience?: any[];
  achievements?: any[];
  certifications?: any[];
  resumeUrl?: string;
  isOpenToWork?: boolean;
  profileStrength?: number;
  role?: string;
  candidateId?: string;
}

function getText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function getEntryTitle(entry: any, fallback: string) {
  return getText(entry?.degree || entry?.role || entry?.name || entry?.title, fallback);
}

function getEntrySubtitle(entry: any) {
  return getText(entry?.institution || entry?.company || entry?.organization || entry?.field || entry?.description);
}

export default function PublicProfilePageClient({ uid }: { uid: string }) {
  // Cascading fallback: publicProfiles → seekerProfiles → users
  const { data: publicProfile, loading: l1 } = useDocument<PublicProfile>('publicProfiles', uid);
  const { data: seekerProfile, loading: l2 } = useDocument<PublicProfile>('seekerProfiles', uid);
  const { data: userProfile, loading: l3 } = useDocument<PublicProfile>('users', uid);

  const loading = l1 || ((!publicProfile) && l2) || ((!publicProfile && !seekerProfile) && l3);

  const profile = useMemo(() => {
    if (publicProfile) return publicProfile;
    if (seekerProfile) return seekerProfile;
    if (userProfile) return userProfile;
    return null;
  }, [publicProfile, seekerProfile, userProfile]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-400" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a1a] px-6 text-center text-white">
        <div>
          <h1 className="text-xl font-bold">Portfolio not available</h1>
          <p className="mt-2 text-sm text-gray-400">This private profile link is not active yet.</p>
        </div>
      </main>
    );
  }

  const name = profile.name || profile.displayName || 'THENIJOBS Member';
  const photoUrl = profile.photoUrl || profile.profilePhotoUrl || (profile as any).photoURL || '';
  const role = profile.currentRole || profile.qualification || profile.role || 'Job Seeker';

  return (
    <main className="min-h-screen bg-[#0a0a1a] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="h-36 bg-[linear-gradient(135deg,#0f766e,#2563eb)]" />
          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative h-28 w-28 overflow-hidden rounded-3xl border-4 border-[#0a0a1a] bg-slate-800">
                {photoUrl ? (
                  <Image src={photoUrl} alt={name} fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-outfit text-3xl font-black">{name}</h1>
                  {profile.candidateId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                      <ShieldCheck size={12} className="text-cyan-400 fill-cyan-400/20 shrink-0" /> Verified Candidate
                    </span>
                  )}
                  {profile.isOpenToWork !== false && (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      Open to Work
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-emerald-300">
                  {role} {profile.candidateId && <span className="text-xs text-gray-500 font-mono ml-2">({profile.candidateId})</span>}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-400">
                  {profile.district && <span className="flex items-center gap-1.5"><MapPin size={14} />{profile.district}</span>}
                  {profile.email && <span className="flex items-center gap-1.5"><Mail size={14} />{profile.email}</span>}
                  {profile.phone && <span className="flex items-center gap-1.5"><Phone size={14} />{profile.phone}</span>}
                </div>
              </div>
              <Link
                href={`/id?uid=${uid}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950"
              >
                <ShieldCheck size={16} /> Digital ID
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <Star size={18} className="text-amber-300" />
            <div className="mt-3 text-2xl font-black">{Number(profile.profileStrength || 0)}%</div>
            <p className="text-sm text-gray-500">Profile completion</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <BadgeCheck size={18} className="text-emerald-300" />
            <div className="mt-3 text-2xl font-black">{profile.skills?.length || 0}</div>
            <p className="text-sm text-gray-500">Skills listed</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <Award size={18} className="text-cyan-300" />
            <div className="mt-3 text-2xl font-black">{profile.certifications?.length || 0}</div>
            <p className="text-sm text-gray-500">Certifications</p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-base font-bold">Skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(profile.skills || []).length > 0 ? profile.skills?.map((skill) => (
              <span key={skill} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-200">
                {skill}
              </span>
            )) : <p className="text-sm text-gray-500">No skills added yet.</p>}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {[
            { title: 'Education', icon: GraduationCap, items: profile.education || [] },
            { title: 'Experience', icon: Briefcase, items: profile.experience || [] },
            { title: 'Achievements', icon: Star, items: profile.achievements || [] },
            { title: 'Certifications', icon: Award, items: profile.certifications || [] },
          ].map(({ title, icon: Icon, items }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="flex items-center gap-2 text-base font-bold">
                <Icon size={17} className="text-emerald-300" /> {title}
              </h2>
              <div className="mt-4 space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-gray-500">No records added yet.</p>
                ) : items.map((item: any, index: number) => (
                  <div key={item?.id || index} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="font-semibold">{getEntryTitle(item, `${title} ${index + 1}`)}</div>
                    {getEntrySubtitle(item) && <div className="mt-1 text-sm text-gray-500">{getEntrySubtitle(item)}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {profile.resumeUrl && (
          <a
            href={profile.resumeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-white"
          >
            <Download size={16} /> Resume
          </a>
        )}
      </div>
    </main>
  );
}
