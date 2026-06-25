'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const SPLASH_KEY = 'thenijobs.splash.seen';

export default function SplashIntro() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || window.sessionStorage.getItem(SPLASH_KEY)) {
      return;
    }

    setVisible(true);
    window.sessionStorage.setItem(SPLASH_KEY, 'true');

    const timer = window.setTimeout(() => setVisible(false), 1650);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a1a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.18),transparent_48%)]" />
      <div className="relative flex flex-col items-center gap-5">
        <div className="thenijobs-logo-reveal rounded-3xl border border-white/10 bg-white p-5 shadow-2xl">
          <Image src="/logo.png" alt="THENIJOBS" width={210} height={54} priority className="h-12 w-auto object-contain" />
        </div>
        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <div className="thenijobs-loading-bar h-full rounded-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400" />
        </div>
      </div>
    </div>
  );
}
