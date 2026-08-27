'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('tnj-announce-dismissed');
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('tnj-announce-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div
      className="relative z-40 flex items-center justify-center gap-3 px-4 py-2.5 text-center text-sm font-semibold text-white"
      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
      role="banner"
      aria-label="Site announcement"
    >
      <span className="flex items-center gap-2 text-xs sm:text-sm">
        <span aria-hidden="true">🔥</span>
        <span>New local jobs added regularly — Find your next opportunity.</span>
      </span>
      <Link
        href="/jobs"
        className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white hover:bg-white/30 transition-colors"
      >
        Browse Jobs <ArrowRight size={12} />
      </Link>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
