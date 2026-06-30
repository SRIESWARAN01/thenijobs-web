'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, BookOpen, Clock, Award, Search, Loader2, ArrowUpRight } from 'lucide-react';
import { getAdminLMSStats, getLeaderboard } from '@/lib/firebase/lmsService';
import type { AdminLMSStats, GamificationProfile } from '@/lib/types/lms';

export default function LMSAnalyticsPage() {
  const [stats, setStats] = useState<AdminLMSStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<GamificationProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [lmsStats, users] = await Promise.all([
          getAdminLMSStats(),
          getLeaderboard(100),
        ]);
        setStats(lmsStats);
        setLeaderboard(users);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  const filteredUsers = leaderboard.filter(u => {
    const name = u.userId; // fallback if no name loaded
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           u.level.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-white font-outfit">Academy Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">Detailed performance and engagement metrics across courses and learners</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white font-outfit">
          <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
          <p className="text-sm text-gray-400">Compiling performance analytics...</p>
        </div>
      ) : (
        <>
          {/* Detailed stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Learners', value: stats?.totalLearners || 0, icon: Users, desc: 'Enrolled students' },
              { label: 'Active Learners', value: stats?.activeLearners || 0, icon: Clock, desc: 'In progress status' },
              { label: 'Completion Rate', value: `${stats?.courseCompletionRate || 0}%`, icon: Award, desc: 'Courses successfully finished' },
              { label: 'Total Watch Time', value: `${stats?.totalWatchTime || 0} hrs`, icon: BookOpen, desc: 'Total learning time spent' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-2xl font-bold text-white font-outfit">{s.value}</p>
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Icon size={15} className="text-violet-400" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{s.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Courses listing */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-1 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Popularity Leaderboard</h2>
              <div className="space-y-3">
                {stats?.mostPopularCourses.map((c, idx) => (
                  <div key={c.courseId} className="p-3 rounded-xl bg-white/[0.02] flex items-center justify-between border border-white/[0.04]">
                    <div>
                      <span className="text-[10px] text-violet-400 font-black uppercase block">Rank #{idx + 1}</span>
                      <span className="text-sm text-white font-semibold block mt-0.5">{c.courseName}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-white/[0.05] px-2.5 py-1 rounded-lg">
                      {c.enrollments} users
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Learner Performance Directory */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Learner Directory</h2>
                <div className="relative max-w-xs w-full">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by ID or level..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="search-input w-full pl-9 pr-4 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-gray-500 font-bold">
                      <th className="text-left py-2 pb-3">Learner ID</th>
                      <th className="text-center py-2 pb-3">XP Total</th>
                      <th className="text-center py-2 pb-3">Level</th>
                      <th className="text-center py-2 pb-3">Active Streak</th>
                      <th className="text-right py-2 pb-3">Badges</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-gray-300">
                    {filteredUsers.map(user => (
                      <tr key={user.userId} className="hover:bg-white/[0.01]">
                        <td className="py-3 font-mono text-[11px] text-white">{user.userId.slice(0, 12)}...</td>
                        <td className="py-3 text-center font-bold text-violet-400">{user.xpTotal || 0} XP</td>
                        <td className="py-3 text-center capitalize">{user.level || 'beginner'}</td>
                        <td className="py-3 text-center text-amber-500 font-bold">🔥 {user.currentStreak || 0} days</td>
                        <td className="py-3 text-right text-gray-400">{(user.badges || []).length} badges</td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">No learners found matching search query.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
