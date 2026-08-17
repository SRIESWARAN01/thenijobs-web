'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function Breadcrumb({ items, showHome = true, className = '' }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl text-sm
        bg-white backdrop-blur-md border border-gray-200 ${className}`}
    >
      {showHome && (
        <>
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-700 transition-colors p-0.5"
            aria-label="Home"
          >
            <Home className="w-3.5 h-3.5" />
          </Link>
          {items.length > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          )}
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {isLast || !item.href ? (
              <span
                className={`px-1 truncate max-w-[200px] ${
                  isLast
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-400'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="px-1 text-gray-400 hover:text-gray-700 transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}

            {!isLast && (
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
