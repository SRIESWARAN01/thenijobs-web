'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('tnj-announce-dismissed');
      if (dismissed) setVisible(false);
    } catch {}
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem('tnj-announce-dismissed', '1');
    } catch {}
  };

  if (!visible) return null;

  return (
    <div
      className="sticky top-16 z-40 text-white"
      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
      role="banner"
      aria-label="Site announcement"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3 px-3 sm:px-6 py-1.5 sm:py-2">
        {/* Text + CTA — flex-1 so it never fights the close button for space.
            Short mobile copy + no pill button keeps this a single compact row;
            the full copy and Browse-Jobs link only appear once there's room. */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-x-2 text-center overflow-hidden">
          <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-sm font-semibold leading-tight truncate">
            <span aria-hidden="true" className="shrink-0">🔥</span>
            <span className="sm:hidden truncate">New jobs added daily in Theni</span>
            <span className="hidden sm:inline truncate">New local jobs added regularly — Find your next opportunity.</span>
          </span>
          <Link
            href="/jobs"
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white hover:bg-white/30 transition-colors shrink-0"
          >
            Browse Jobs <ArrowRight size={12} />
          </Link>
        </div>

        {/* Close button — a real flex item, not absolutely positioned, so it
            always has its own reserved space and text can never overlap it. */}
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-white/80 hover:text-white hover:bg-white/15 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
