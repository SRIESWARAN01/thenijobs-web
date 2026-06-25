'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, SearchX, AlertTriangle, type LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EmptyStateVariant = 'default' | 'search' | 'error';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: EmptyStateVariant;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Variant defaults                                                   */
/* ------------------------------------------------------------------ */

const VARIANT_ICONS: Record<EmptyStateVariant, LucideIcon> = {
  default: Inbox,
  search: SearchX,
  error: AlertTriangle,
};

const VARIANT_COLORS: Record<EmptyStateVariant, string> = {
  default: 'text-purple-400',
  search: 'text-cyan-400',
  error: 'text-rose-400',
};

const VARIANT_GLOW: Record<EmptyStateVariant, string> = {
  default: 'rgba(124,58,237,0.15)',
  search: 'rgba(6,182,212,0.15)',
  error: 'rgba(244,63,94,0.15)',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const Icon = icon ?? VARIANT_ICONS[variant];
  const colorClass = VARIANT_COLORS[variant];
  const glowColor = VARIANT_GLOW[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
    >
      {/* Floating icon */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-6 rounded-2xl p-5"
        style={{
          background: `linear-gradient(145deg, ${glowColor}, transparent)`,
          boxShadow: `0 0 40px ${glowColor}`,
        }}
      >
        <Icon className={`w-12 h-12 ${colorClass}`} strokeWidth={1.5} />
      </motion.div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-white mb-2 font-[Outfit]">
        {title}
      </h3>
      <p className="text-sm text-white/50 max-w-sm leading-relaxed mb-6">
        {description}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-gradient px-6 py-2.5 text-sm rounded-xl relative z-10"
        >
          <span className="relative z-10">{actionLabel}</span>
        </button>
      )}
    </motion.div>
  );
}

export default EmptyState;
