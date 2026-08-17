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
    gradient: 'from-purple-50 to-indigo-50',
    border: 'border-purple-200 hover:border-purple-300',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    glow: '0 0 30px rgba(124,58,237,0.12)',
    trendPositive: 'text-emerald-600',
    trendNegative: 'text-rose-600',
  },
  cyan: {
    gradient: 'from-cyan-50 to-blue-50',
    border: 'border-cyan-200 hover:border-cyan-300',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    glow: '0 0 30px rgba(6,182,212,0.12)',
    trendPositive: 'text-emerald-600',
    trendNegative: 'text-rose-600',
  },
  emerald: {
    gradient: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200 hover:border-emerald-300',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    glow: '0 0 30px rgba(16,185,129,0.12)',
    trendPositive: 'text-emerald-600',
    trendNegative: 'text-rose-600',
  },
  amber: {
    gradient: 'from-amber-50 to-orange-50',
    border: 'border-amber-200 hover:border-amber-300',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    glow: '0 0 30px rgba(245,158,11,0.12)',
    trendPositive: 'text-emerald-600',
    trendNegative: 'text-rose-600',
  },
  rose: {
    gradient: 'from-rose-50 to-pink-50',
    border: 'border-rose-200 hover:border-rose-300',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    glow: '0 0 30px rgba(244,63,94,0.12)',
    trendPositive: 'text-emerald-600',
    trendNegative: 'text-rose-600',
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
        <div className="h-3.5 w-24 rounded bg-gray-200 shimmer" />
        <div className="h-10 w-10 rounded-xl bg-gray-200 shimmer" />
      </div>
      <div className="h-8 w-28 rounded bg-gray-200 shimmer mb-3" />
      <div className="h-3 w-20 rounded bg-gray-200 shimmer" />
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
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <div className={`${c.iconBg} rounded-xl p-2.5`}>
          <Icon className={`w-5 h-5 ${c.iconColor}`} strokeWidth={1.8} />
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl font-bold text-gray-900 tracking-tight font-[Outfit] mb-1">
        {prefix}
        {animatedValue.toLocaleString()}
        {suffix && <span className="text-lg text-gray-400 ml-1">{suffix}</span>}
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
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

export default StatsCard;
