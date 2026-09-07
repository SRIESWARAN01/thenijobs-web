'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export interface AdminContextBannerProps {
  /** The company whose data this admin route is currently reading/writing on its behalf. */
  companyName: string;
}

/**
 * Shown on every admin-context route that edits a specific company's own data without an
 * employer login (the "manage as company" pattern from ADMINWEB-1/ADMINIMP-1) -- makes clear
 * this is an admin-owned view, not a real session swap, and gives a one-click way back.
 */
export default function AdminContextBanner({ companyName }: AdminContextBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs sm:text-sm">
      <div className="flex items-center gap-2 font-bold text-amber-900 min-w-0">
        <ShieldAlert size={15} className="text-amber-600 shrink-0" />
        <span className="truncate">
          Managing <span className="font-black">{companyName}</span> as Admin — no employer login used
        </span>
      </div>
      <Link
        href="/admin/businesses"
        className="flex shrink-0 items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 font-bold text-amber-800 transition-colors hover:bg-amber-100"
      >
        <ArrowLeft size={13} /> Exit
      </Link>
    </div>
  );
}
