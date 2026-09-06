'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderBy, limit, type QueryConstraint } from 'firebase/firestore';
import { Search, Users, Building2, Briefcase, Loader2 } from 'lucide-react';
import { fetchCollection } from '@/lib/firebase/firestoreService';

/**
 * ADMIN-QS-1 — this exact input (icon, placeholder "Quick search...") already existed in the
 * sidebar with no `value`/`onChange` at all; typing into it did nothing. Wired for real, scoped
 * deliberately narrow: Firestore has no built-in text search and none of users/companies/jobs
 * have a pre-computed lowercase search field, so a properly-indexed search would need a
 * production-data migration or a third-party service — bigger than anything else built
 * autonomously this session. Instead: fetch the 200 most recent documents per collection once
 * (lazily, on first focus, not a permanent listener), then filter client-side per keystroke. Real
 * and useful over recently-active records; explicitly NOT a claim of searching full history —
 * older records outside the most recent 200 per collection are not reachable this way.
 */

const MAX_CANDIDATES = 200;
const MAX_RESULTS_PER_GROUP = 5;

interface Candidate {
  id: string;
  [key: string]: any;
}

interface CandidateSets {
  users: Candidate[];
  companies: Candidate[];
  jobs: Candidate[];
}

interface ResultItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

interface ResultGroup {
  label: string;
  icon: typeof Users;
  items: ResultItem[];
}

const RECENT_FIRST: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(MAX_CANDIDATES)];

function matches(query: string, ...fields: (string | undefined)[]): boolean {
  return fields.some(f => f?.toLowerCase().includes(query));
}

export default function AdminQuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const candidatesRef = useRef<CandidateSets | null>(null);
  const [, forceRerender] = useState(0);

  const ensureCandidatesLoaded = useCallback(async () => {
    if (candidatesRef.current || loading) return;
    setLoading(true);
    try {
      const [users, companies, jobs] = await Promise.all([
        fetchCollection<Candidate>('users', RECENT_FIRST),
        fetchCollection<Candidate>('companies', RECENT_FIRST),
        fetchCollection<Candidate>('jobs', RECENT_FIRST),
      ]);
      candidatesRef.current = { users, companies, jobs };
    } catch (err) {
      console.error('[AdminQuickSearch] Failed to load search candidates:', err);
    } finally {
      setLoading(false);
      forceRerender(n => n + 1);
    }
  }, [loading]);

  const q = query.trim().toLowerCase();
  const groups: ResultGroup[] = [];
  if (q && candidatesRef.current) {
    const { users, companies, jobs } = candidatesRef.current;

    const userItems: ResultItem[] = users
      .filter(u => matches(q, u.displayName, u.name, u.email))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map(u => ({ id: u.id, label: u.displayName || u.name || u.email || 'Unnamed user', sublabel: u.email, href: `/admin/users?q=${encodeURIComponent(query.trim())}` }));

    const companyItems: ResultItem[] = companies
      .filter(c => matches(q, c.name))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map(c => ({ id: c.id, label: c.name || 'Unnamed business', sublabel: c.district, href: `/admin/businesses?q=${encodeURIComponent(query.trim())}` }));

    const jobItems: ResultItem[] = jobs
      .filter(j => matches(q, j.title, j.companyName))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map(j => ({ id: j.id, label: j.title || 'Untitled job', sublabel: j.companyName, href: `/admin/jobs?q=${encodeURIComponent(query.trim())}` }));

    if (userItems.length > 0) groups.push({ label: 'Users', icon: Users, items: userItems });
    if (companyItems.length > 0) groups.push({ label: 'Businesses', icon: Building2, items: companyItems });
    if (jobItems.length > 0) groups.push({ label: 'Jobs', icon: Briefcase, items: jobItems });
  }

  return (
    <div className="relative">
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        aria-label="Quick search"
        placeholder="Quick search..."
        value={query}
        onFocus={() => { setOpen(true); ensureCandidatesLoaded(); }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-base sm:text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-all"
      />
      {open && q && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-3 flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={13} className="animate-spin" /> Loading…
            </div>
          ) : groups.length === 0 ? (
            <div className="p-3 text-xs text-gray-500">No matches in the most recent records.</div>
          ) : (
            groups.map(group => {
              const GroupIcon = group.icon;
              return (
                <div key={group.label} className="py-1">
                  <p className="px-3 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                    <GroupIcon size={11} /> {group.label}
                  </p>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => router.push(item.href)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col"
                    >
                      <span className="text-xs font-semibold text-gray-900 truncate">{item.label}</span>
                      {item.sublabel && <span className="text-[10px] text-gray-500 truncate">{item.sublabel}</span>}
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
