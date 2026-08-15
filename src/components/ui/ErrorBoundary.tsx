'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { trackComponentError } from '@/lib/firebase/errorService';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
  /** Optional fallback UI. If not provided, uses the default error card. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called when an error is caught — useful for logging to Sentry etc. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for development
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    // Persist to Firestore for admin dashboard visibility
    trackComponentError('ErrorBoundary', error, info.componentStack || undefined).catch(() => {});
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <DefaultErrorUI error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

// ─── Default Error UI ────────────────────────────────────────────────────────

function DefaultErrorUI({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: '#FEF3C7' }}>
          <AlertTriangle size={32} style={{ color: '#D97706' }} />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}>
          Something went wrong
        </h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          An unexpected error occurred. Please try refreshing the page.
          If the problem persists, contact support.
        </p>

        {/* Error detail (dev-friendly) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-left bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6 text-xs text-red-700 font-mono break-all">
            {error.message}
          </div>
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

// ─── Inline variant for smaller sections ─────────────────────────────────────

export function InlineError({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border"
      style={{ background: '#FEF2F2', borderColor: '#FCA5A5' }}>
      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-700 font-medium">{message}</p>
      </div>
      {retry && (
        <button
          onClick={retry}
          className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 flex-shrink-0"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
