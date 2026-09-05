'use client';

import { useState } from 'react';
import { Sparkles, X, Search, UserCheck, Loader2, ShieldCheck } from 'lucide-react';
import { requestAIService } from '@/lib/ai/aiClient';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';

interface CandidateMatch {
  name: string;
  role: string;
  matchScore: number;
  skills: string[];
  district: string;
  experience: string;
  reason?: string;
}

export default function AITalentMatcherModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CandidateMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return;
    setSearching(true);
    setHasSearched(true);

    try {
      // 1. Send query to central AI service to parse employer candidate search intent
      const searchIntentRes = await requestAIService({
        feature: 'candidate_search',
        userId: user?.uid,
        userRole: 'COMPANY',
        payload: { query: searchQuery },
      });

      // 2. Fetch real seeker profiles from Firestore
      const seekersRef = collection(db, 'seekerProfiles');
      const q = query(seekersRef, limit(30));
      const snapshot = await getDocs(q);

      const matches: CandidateMatch[] = [];

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.name) return;

        const candidateSkills: string[] = (data.skills || []).map((s: any) =>
          typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()
        );
        const searchTerms = (searchQuery.toLowerCase().split(/\s+/)).filter(w => w.length > 2);
        
        const matchedSkillsCount = candidateSkills.filter(s =>
          searchTerms.some(term => s.includes(term) || term.includes(s))
        ).length;

        const baseScore = Math.min(95, Math.round(50 + matchedSkillsCount * 15));

        const expEntries = data.experience || [];
        const expYears = Array.isArray(expEntries) && expEntries.length > 0
          ? `${expEntries.length} role${expEntries.length > 1 ? 's' : ''}`
          : 'Fresher';

        matches.push({
          name: data.name,
          role: data.currentRole || 'Job Seeker',
          matchScore: baseScore,
          skills: (data.skills || []).slice(0, 4),
          district: data.district || 'Theni',
          experience: expYears,
        });
      });

      matches.sort((a, b) => b.matchScore - a.matchScore);
      setResults(matches.slice(0, 10));
    } catch (err) {
      console.error('AI Talent Search error:', err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 font-sans border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">AI Employer Talent Search</h3>
              <p className="text-[11px] text-gray-500">Natural Language Candidate Search</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-gray-600 font-bold">×</button>
        </div>

        {/* Query Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 block">Describe what talent you need:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              aria-label="Describe the candidate you're looking for" placeholder="Describe the candidate you're looking for..."
              className="flex-1 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-base sm:text-xs text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-xs disabled:opacity-50"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
            </button>
          </div>
        </div>

        {/* Results List */}
        {hasSearched && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
              {searching ? 'Searching candidates...' : results.length > 0 ? `Top AI Candidate Matches (${results.length})` : 'No matching candidates found'}
            </h4>
            {!searching && results.length === 0 && (
              <p className="text-xs text-gray-500">Try broadening your search criteria or using different keywords.</p>
            )}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {results.map((c, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs">{c.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        {c.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{c.role} • {c.experience} • {c.district}</p>
                    <div className="flex flex-wrap gap-1">
                      {c.skills.map((s, j) => (
                        <span key={j} className="px-1.5 py-0.5 rounded bg-white border border-purple-200 text-[9px] font-semibold text-purple-900">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-[11px] hover:bg-purple-700 transition-colors shrink-0"
                  >
                    Shortlist
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
