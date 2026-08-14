'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type StatsCardColor = 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose';

export interface StatsCardTrend {
  value: number;
  isPositive: boolean;
}

export interface StatsCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: StatsCardTrend;
  color?: StatsCardColor;
  loading?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Color map                                                          */
/* ------------------------------------------------------------------ */

const COLOR_MAP: Record<
  StatsCardColor,
  {
    gradient: string;
    border: string;
    iconBg: string;
    iconColor: string;
    glow: string;
    trendPositive: string;
    trendNegative: string;
  }
> = {
  purple: {
    gradient: 'from-purple-500/10 to-indigo-500/5',
    border: 'border-purple-500/15 hover:border-purple-500/30',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
    glow: '0 0 30px rgba(124,58,237,0.15)',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-rose-400',
  },
  cyan: {
    gradient: 'from-cyan-500/10 to-blue-500/5',
    border: 'border-cyan-500/15 hover:border-cyan-500/30',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    glow: '0 0 30px rgba(6,182,212,0.15)',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-rose-400',
  },
  emerald: {
    gradient: 'from-emerald-500/10 to-teal-500/5',
    border: 'border-emerald-500/15 hover:border-emerald-500/30',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    glow: '0 0 30px rgba(16,185,129,0.15)',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-rose-400',
  },
  amber: {
    gradient: 'from-amber-500/10 to-orange-500/5',
    border: 'border-amber-500/15 hover:border-amber-500/30',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    glow: '0 0 30px rgba(245,158,11,0.15)',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-rose-400',
  },
  rose: {
    gradient: 'from-rose-500/10 to-pink-500/5',
    border: 'border-rose-500/15 hover:border-rose-500/30',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-400',
    glow: '0 0 30px rgba(244,63,94,0.15)',
    trendPositive: 'text-emerald-400',
    trendNegative: 'text-rose-400',
  },
};

/* ------------------------------------------------------------------ */
/*  Count-up hook                                                      */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    function step(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);
      setCount(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

/* ------------------------------------------------------------------ */
/*  Shimmer skeleton                                                   */
/* ------------------------------------------------------------------ */

function StatsCardSkeleton({ color = 'purple' }: { color?: StatsCardColor }) {
  const c = COLOR_MAP[color];
  return (
    <div
      className={`rounded-2xl p-5 bg-gradient-to-br ${c.gradient} border ${c.border}
        backdrop-blur-md`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-3.5 w-24 rounded bg-white shimmer" />
        <div className="h-10 w-10 rounded-xl bg-white shimmer" />
      </div>
      <div className="h-8 w-28 rounded bg-white shimmer mb-3" />
      <div className="h-3 w-20 rounded bg-white shimmer" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StatsCard({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  trend,
  color = 'purple',
  loading = false,
  className = '',
}: StatsCardProps) {
  const animatedValue = useCountUp(loading ? 0 : value);
  const c = COLOR_MAP[color];

  if (loading) return <StatsCardSkeleton color={color} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -3, boxShadow: c.glow }}
      className={`rounded-2xl p-5 bg-gradient-to-br ${c.gradient} border ${c.border}
        backdrop-blur-md transition-colors duration-300 cursor-default ${className}`}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/50 font-medium">{title}</span>
        <div className={`${c.iconBg} rounded-xl p-2.5`}>
          <Icon className={`w-5 h-5 ${c.iconColor}`} strokeWidth={1.8} />
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-gray-900 tracking-tight font-[Outfit] mb-1">
        {prefix}
        {animatedValue.toLocaleString()}
        {suffix && <span className="text-lg text-white/60 ml-1">{suffix}</span>}
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1.5 mt-1">
          {trend.isPositive ? (
            <TrendingUp className={`w-3.5 h-3.5 ${c.trendPositive}`} />
          ) : (
            <TrendingDown className={`w-3.5 h-3.5 ${c.trendNegative}`} />
          )}
          <span
            className={`text-xs font-semibold ${
              trend.isPositive ? c.trendPositive : c.trendNegative
            }`}
          >
            {trend.value}%
          </span>
          <span className="text-xs text-white/30">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

export default StatsCard;
