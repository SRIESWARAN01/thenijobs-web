'use client';

import React from 'react';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type StatusBadgeVariant = 'solid' | 'outline' | 'dot';
export type StatusBadgeSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps {
  status: string;
  size?: StatusBadgeSize;
  variant?: StatusBadgeVariant;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Color mapping                                                      */
/* ------------------------------------------------------------------ */

type ColorKey = 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'gray';

const STATUS_COLOR_MAP: Record<string, ColorKey> = {
  active: 'emerald',
  approved: 'emerald',
  verified: 'emerald',
  completed: 'emerald',
  success: 'emerald',
  open: 'emerald',

  pending: 'amber',
  review: 'amber',
  processing: 'amber',
  'in-progress': 'amber',
  'in progress': 'amber',
  warning: 'amber',

  rejected: 'rose',
  suspended: 'rose',
  expired: 'rose',
  closed: 'rose',
  failed: 'rose',
  error: 'rose',
  blocked: 'rose',
  inactive: 'rose',

  featured: 'purple',
  premium: 'purple',
  promoted: 'purple',
  pro: 'purple',

  new: 'cyan',
  info: 'cyan',
  updated: 'cyan',

  draft: 'gray',
  archived: 'gray',
  unknown: 'gray',
};

const COLOR_STYLES: Record<
  ColorKey,
  { bg: string; border: string; text: string; dot: string }
> = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    dot: 'bg-cyan-500',
  },
  gray: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
};

const SIZE_CLASSES: Record<StatusBadgeSize, string> = {
  sm: 'text-[10px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

const DOT_SIZE: Record<StatusBadgeSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StatusBadge({
  status,
  size = 'md',
  variant = 'solid',
  className = '',
}: StatusBadgeProps) {
  const colorKey: ColorKey =
    STATUS_COLOR_MAP[status.toLowerCase()] ?? 'gray';
  const colors = COLOR_STYLES[colorKey];

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  const baseClasses = `inline-flex items-center rounded-full font-semibold tracking-wide whitespace-nowrap ${SIZE_CLASSES[size]}`;

  let variantClasses = '';
  switch (variant) {
    case 'solid':
      variantClasses = `${colors.bg} ${colors.text}`;
      break;
    case 'outline':
      variantClasses = `border ${colors.border} ${colors.text} bg-transparent`;
      break;
    case 'dot':
      variantClasses = `${colors.text} bg-transparent`;
      break;
  }

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {variant === 'dot' && (
        <span className={`${DOT_SIZE[size]} rounded-full ${colors.dot} shrink-0`} />
      )}
      {label}
    </motion.span>
  );
}

export default StatusBadge;
