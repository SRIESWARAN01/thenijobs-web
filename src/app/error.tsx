'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Next.js Error Boundary — catches runtime errors in any route.
 * This replaces the default Next.js error page with a branded one.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={36} className="text-rose-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3 font-outfit">
          Something went wrong
        </h1>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          We encountered an unexpected error. This has been logged and our team will look into it. You can try again or go back to the home page.
        </p>

        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 text-sm font-bold transition-colors"
          >
            <RefreshCw size={16} /> Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:bg-white/[0.08] text-sm font-bold transition-colors"
          >
            <Home size={16} /> Home
          </Link>
        </div>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="text-[10px] text-gray-600 cursor-pointer hover:text-gray-500 mb-2">
              Error details (dev only)
            </summary>
            <pre className="text-[10px] text-rose-300/50 bg-black/30 rounded-xl p-3 overflow-auto max-h-40">
              {error.message}
              {error.stack?.slice(0, 600)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
