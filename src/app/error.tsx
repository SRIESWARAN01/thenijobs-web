'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logError } from '@/lib/firebase/errorService';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to admin error monitoring dashboard
    logError({
      errorType: 'runtime',
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      errorMessage: error.message || 'Unknown application error',
      stackTrace: error.stack || '',
      severity: 'high',
      userImpact: 'Page failed to render — user sees error screen',
      metadata: { digest: error.digest },
    }).catch(() => {});
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: '#FEF3C7' }}
        >
          <AlertTriangle size={32} style={{ color: '#D97706' }} />
        </div>

        {/* Heading */}
        <h1
          className="text-2xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Something went wrong
        </h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          An unexpected error occurred. Please try refreshing the page.
          If the problem persists, contact us at{' '}
          <a
            href="https://wa.me/919360519460"
            className="text-blue-600 font-semibold hover:underline"
          >
            WhatsApp
          </a>
          .
        </p>

        {/* Error ID for support */}
        {error.digest && (
          <p className="text-xs text-gray-400 font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            <RefreshCw size={15} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <Home size={15} />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
