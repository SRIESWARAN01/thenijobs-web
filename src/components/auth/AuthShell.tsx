'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useKeyboardAwareScroll } from '@/hooks/useKeyboardAwareScroll';

interface AuthShellProps {
  /** Small uppercase label above the heading, e.g. "MEMBER SIGN IN" */
  eyebrow?: string;
  /** Large editorial heading, desktop-only column. Pass a <span> for an accent word. */
  heading?: ReactNode;
  /** Supporting copy under the heading */
  subheading?: string;
  /** Short trust signals rendered as a dot-separated row at the bottom of the desktop column */
  trustRow?: string[];
  /** Max width of the content card on the right (login vs. register need different widths) */
  maxWidthClassName?: string;
  children: ReactNode;
}

const DEFAULT_TRUST_ROW = ['1,200+ Active Jobs', '500+ Verified Companies', '98% Placement Rate'];

/**
 * Shared shell for every auth surface (login, register, forgot-password).
 * One persistent top-left logo header at every breakpoint (never repositioned or hidden).
 * >=1024px: editorial two-column layout — copy left, form card right, no color-block panel.
 * <1024px: single column — logo header, then the form card (which renders its own heading).
 */
export default function AuthShell({
  eyebrow = 'MEMBER SIGN IN',
  heading = (
    <>
      Find your next <span className="text-blue-600">opportunity</span> in Theni
    </>
  ),
  subheading = 'Connect with verified local employers across Theni, Cumbum, Periyakulam, Bodinayakanur & Tamil Nadu.',
  trustRow = DEFAULT_TRUST_ROW,
  maxWidthClassName = 'max-w-md',
  children,
}: AuthShellProps) {
  useKeyboardAwareScroll();

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden" style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      {/* Soft decorative glow behind the copy column — gives the left side visual weight
          without a hard color-block panel */}
      <div
        className="hidden lg:block absolute -top-24 -left-32 w-[560px] h-[560px] rounded-full opacity-[0.07] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
        aria-hidden
      />

      {/* Persistent header — identical position at every breakpoint. Fluid vertical padding
          (clamp against dvh) so it never eats into a short viewport's budget. */}
      <header
        className="w-full px-5 sm:px-8 lg:px-12 shrink-0 relative z-10"
        style={{ paddingBlock: 'clamp(0.375rem, 1.3dvh, 1.75rem)' }}
      >
        <Link href="/" className="inline-flex items-center gap-2.5 select-none">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
            <img src="/logo.png" alt="THENIJOBS" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            THENI<span className="text-blue-600">JOBS</span>
          </span>
        </Link>
      </header>

      {/* min-h-0 lets this flex child actually shrink below its content size, which is
          required for overflow-y-auto to engage as a fallback — the whole page/URL bar
          never has to scroll; only this region would, and only in genuinely extreme cases
          (huge OS font-size accessibility settings, a very short landscape viewport) since
          the content below is already sized to fit a normal viewport without it. */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16 px-5 sm:px-8 lg:px-12 relative z-10"
        style={{ paddingBottom: 'clamp(0.375rem, 1.3dvh, 4rem)' }}>
        {/* Editorial copy column — desktop/tablet-landscape only. flex-1 so it absorbs all
            extra width; the card column stays a fixed size and sits right next to it. */}
        <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:min-w-0 lg:max-w-xl lg:min-h-[480px] lg:justify-between lg:py-6">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-blue-600 uppercase mb-4">{eyebrow}</p>
            <h1
              className="text-4xl xl:text-[2.75rem] font-extrabold text-slate-900 leading-[1.15] mb-5 text-balance"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {heading}
            </h1>
            <p className="text-slate-500 text-base leading-relaxed max-w-md">{subheading}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {trustRow.map((t, i) => (
              <span key={t} className="flex items-center gap-2.5 text-xs font-semibold text-slate-400">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden />}
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Form card column. A width:100%+max-width flex item with shrink:0 resolves
            predictably (fills up to the cap); nesting the max-width on a plain-block
            child of an auto-width flex item does not — percentages can't size an
            auto flex item, so it silently collapses well below its intended cap. */}
        <div className={`w-full mx-auto lg:mx-0 lg:shrink-0 ${maxWidthClassName}`}>{children}</div>
      </div>
    </div>
  );
}
