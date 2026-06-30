'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft, Loader2, Star, Flame, Sparkles } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLMS';

export default function LeaderboardPage() {
  const { data: leaderboard, loading } = useLeaderboard(50);

  return (
    <main className="min-h-screen bg-[#070714] text-white font-outfit pb-16">
      {/* Hero Header */}
      <section className="relative pt-24 pb-12 overflow-hidden border-b border-white/[0.04] bg-gradient-to-b from-violet-950/10 via-[#070714] to-[#070714]">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-[120px] bg-violet-600/10 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4 relative z-10">
          <Link href="/academy" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white uppercase font-black mb-2 self-center">
            <ArrowLeft size={14} /> Back to Academy
          </Link>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest mx-auto">
            <Trophy size={12} className="text-amber-450 fill-amber-500/10 animate-pulse" /> Academy Leaderboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Top <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Learners & Achievers</span>
          </h1>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Compare points, challenge friends, keep your daily learning streaks alive, and rise up in rankings!
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin text-violet-400 mb-2" />
            <p className="text-sm">Assembling standings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center text-gray-400">
            <Trophy size={36} className="mx-auto text-gray-600 mb-3" />
            <p className="text-sm">No leaderboard entries found yet.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.01]">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between text-xs text-gray-500 font-bold uppercase">
              <span>Rank & Learner ID</span>
              <div className="flex gap-8">
                <span>Streak</span>
                <span>Badges</span>
                <span>XP Points</span>
              </div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {leaderboard.map((user, idx) => {
                const isTopThree = idx < 3;
                const medalColors = ['text-amber-400', 'text-slate-300', 'text-amber-600'];
                return (
                  <div key={user.userId} className="p-4 flex items-center justify-between hover:bg-white/[0.01] transition-colors text-sm">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${isTopThree ? medalColors[idx] + ' text-base' : 'text-gray-500'}`}>
                        {isTopThree ? '🏆' : `#${idx + 1}`}
                      </span>
                      <div>
                        <span className="font-mono text-xs text-white font-medium">{user.userId.slice(0, 12)}...</span>
                        <span className="text-[10px] text-gray-500 block capitalize mt-0.5">{user.level || 'beginner'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-xs font-bold text-gray-300">
                      <span className="text-orange-400 w-16 text-center">
                        {user.currentStreak > 0 ? `🔥 ${user.currentStreak}` : '—'}
                      </span>
                      <span className="w-12 text-center text-gray-400">
                        {user.badges?.length || 0} 🏅
                      </span>
                      <span className="text-violet-400 font-extrabold w-16 text-right">
                        {user.xpTotal || 0} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
