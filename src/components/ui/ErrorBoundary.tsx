'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label for identifying which section crashed */
  section?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * React Error Boundary — catches rendering errors in child components
 * and shows a styled fallback UI with retry, go home, and error details.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`[ErrorBoundary${this.props.section ? ` — ${this.props.section}` : ''}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="max-w-md w-full glass-card rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-rose-400" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {this.props.section
                ? `The ${this.props.section} section encountered an error.`
                : 'An unexpected error occurred.'}
              {' '}Please try again or go back to the home page.
            </p>
            <div className="flex gap-3 justify-center mb-4">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 text-sm font-semibold transition-colors"
              >
                <RefreshCw size={14} /> Try Again
              </button>
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] text-sm font-semibold transition-colors"
              >
                <Home size={14} /> Home
              </a>
            </div>
            {this.state.error && (
              <div>
                <button
                  onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-400 mx-auto transition-colors"
                >
                  <ChevronDown size={10} className={`transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`} />
                  {this.state.showDetails ? 'Hide' : 'Show'} error details
                </button>
                {this.state.showDetails && (
                  <pre className="mt-3 text-left text-[10px] text-rose-300/60 bg-black/30 rounded-xl p-3 overflow-auto max-h-36">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack?.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
