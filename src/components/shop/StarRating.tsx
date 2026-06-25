'use client';

import React, { useState, useCallback, useId } from 'react';

// ─────────────────────────────────── Types ───────────────────────────────────

type StarSize = 'sm' | 'md' | 'lg';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: StarSize;
}

// ─────────────────────── Constants ───────────────────────────────────────────

const SIZE_MAP: Record<StarSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

const COLOR_FILLED = '#f59e0b';   // amber-400
const COLOR_EMPTY  = '#374151';   // gray-700

// ─────────────────────── SVG Star ─────────────────────────────────────────────

interface SvgStarProps {
  px: number;
  fill: 'full' | 'half' | 'empty';
  color: string;
}

/**
 * Renders a single star SVG. For half-fill we use a linear-gradient definition
 * scoped within the SVG element so there are no global ID collisions.
 */
function SvgStar({ px, fill, color }: SvgStarProps) {
  const reactId = useId();
  const gradId = `half-${px}-${reactId.replace(/:/g, '')}`;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      {fill === 'half' && (
        <defs>
          <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor={COLOR_FILLED} />
            <stop offset="50%" stopColor={COLOR_EMPTY} />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={
          fill === 'full'
            ? color
            : fill === 'half'
            ? `url(#${gradId})`
            : COLOR_EMPTY
        }
      />
    </svg>
  );
}

// ──────────────────────────────── Component ──────────────────────────────────

export default function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  onRate,
  size = 'md',
}: StarRatingProps) {
  const px = SIZE_MAP[size];
  const [hovered, setHovered] = useState<number | null>(null);

  const activeRating = hovered ?? rating;

  const getStarType = useCallback(
    (index: number): 'full' | 'half' | 'empty' => {
      const starValue = index + 1;
      if (activeRating >= starValue) return 'full';
      if (activeRating >= starValue - 0.5) return 'half';
      return 'empty';
    },
    [activeRating],
  );

  if (!interactive) {
    return (
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`${rating} out of ${maxRating} stars`}
      >
        {Array.from({ length: maxRating }, (_, i) => {
          const type = getStarType(i);
          const color = type !== 'empty' ? COLOR_FILLED : COLOR_EMPTY;
          return <SvgStar key={i} px={px} fill={type} color={color} />;
        })}
      </div>
    );
  }

  // ── Interactive mode ──────────────────────────────────────────────────────
  return (
    <div
      className="flex items-center gap-0.5"
      role="radiogroup"
      aria-label="Rate this product"
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isActive = (hovered ?? rating) >= starValue;

        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={Math.round(rating) === starValue}
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
            className="focus:outline-none cursor-pointer transition-transform duration-100 hover:scale-110"
            onMouseEnter={() => setHovered(starValue)}
            onClick={() => onRate?.(starValue)}
          >
            <SvgStar
              px={px}
              fill={isActive ? 'full' : 'empty'}
              color={isActive ? COLOR_FILLED : COLOR_EMPTY}
            />
          </button>
        );
      })}
    </div>
  );
}
