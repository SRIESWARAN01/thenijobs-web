'use client';

import { useGamification } from '@/hooks/useLMS';
import { Award, Flame, Star, Loader2 } from 'lucide-react';
import { LEVEL_THRESHOLDS } from '@/lib/types/lms';

export default function GamificationWidget() {
  const { profile, loading } = useGamification();

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-4 flex items-center justify-center">
        <Loader2 size={16} className="text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  // Calculate percentage of current level progress
  const currentXP = profile.xpTotal || 0;
  const currentLevel = profile.level || 'beginner';
  
  let nextLevel: string = 'master';
  let thresholdMin = 0;
  let thresholdMax = LEVEL_THRESHOLDS.master;

  if (currentLevel === 'beginner') {
    nextLevel = 'learner';
    thresholdMin = LEVEL_THRESHOLDS.beginner;
    thresholdMax = LEVEL_THRESHOLDS.learner;
  } else if (currentLevel === 'learner') {
    nextLevel = 'achiever';
    thresholdMin = LEVEL_THRESHOLDS.learner;
    thresholdMax = LEVEL_THRESHOLDS.achiever;
  } else if (currentLevel === 'achiever') {
    nextLevel = 'expert';
    thresholdMin = LEVEL_THRESHOLDS.achiever;
    thresholdMax = LEVEL_THRESHOLDS.expert;
  } else if (currentLevel === 'expert') {
    nextLevel = 'master';
    thresholdMin = LEVEL_THRESHOLDS.expert;
    thresholdMax = LEVEL_THRESHOLDS.master;
  }

  const levelProgress = thresholdMax > thresholdMin
    ? Math.min(100, Math.round(((currentXP - thresholdMin) / (thresholdMax - thresholdMin)) * 100))
    : 100;

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/[0.08] bg-white/[0.01] space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Star size={14} className="text-amber-400 fill-amber-400/10" /> My Learning Stats
        </h3>
        {profile.currentStreak > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded-lg border border-orange-500/20">
            <Flame size={13} className="fill-orange-500" /> {profile.currentStreak} Day Streak
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Level: <strong className="capitalize text-white">{currentLevel}</strong></span>
          <span className="font-bold text-violet-400">{currentXP} XP</span>
        </div>
        
        {/* Progress bar */}
        {currentLevel !== 'master' && (
          <div className="space-y-1">
            <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all" style={{ width: `${levelProgress}%` }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-500">
              <span>Next Level: <strong className="capitalize">{nextLevel}</strong></span>
              <span>{thresholdMax - currentXP} XP to go</span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic badges earned */}
      {profile.badges && profile.badges.length > 0 && (
        <div className="pt-2 border-t border-white/[0.04] space-y-2">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Earned Badges ({profile.badges.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.badges.map(badge => (
              <div key={badge.id} className="w-8 h-8 rounded-lg bg-slate-900 border border-white/[0.06] flex items-center justify-center text-base" title={`${badge.name}: ${badge.description}`}>
                {badge.icon || '🏅'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
