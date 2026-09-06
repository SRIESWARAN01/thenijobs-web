'use client';

/**
 * THENIJOBS — Global Error Tracker
 * Sets up global error handlers for unhandled errors and promise rejections.
 * Initialize once in the root layout via <GlobalErrorTracker />.
 */

import { useEffect } from 'react';
import { logError } from '@/lib/firebase/errorService';

/**
 * React component that installs global error handlers on mount.
 * Place once in root layout.
 */
// ERRORS-1: this handler is a blanket `window` listener — it sees every uncaught error on the
// page, including ones this app's own code never caused. "Cannot read properties of null
// (reading 'removeChild'/'insertBefore')" is the textbook signature of a browser extension
// (Google Translate is the classic case) mutating the DOM behind React's back; React later tries
// to reconcile a node the extension already moved or removed and throws on a null parent.
// Confirmed here, not assumed: this exact message was logged against five completely unrelated
// pages (a services listing, a businesses listing, a district page, two different company
// profiles) with no component boundary ever attached, and a repo-wide grep found no app code
// that manually calls appendChild/removeChild/createElement anywhere near those pages. Filtering
// it here stops it from crowding out real defects on this dashboard; it does not suppress a
// removeChild error genuinely raised by this app's own DOM code, since none exists.
const KNOWN_NOISE_PATTERNS = [
  /reading '(removeChild|insertBefore|appendChild)'/i,
  /The node to be removed is not a child of this node/i,
  /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i,
];

function isKnownNoise(message: string): boolean {
  return KNOWN_NOISE_PATTERNS.some((pattern) => pattern.test(message));
}

export function GlobalErrorTracker() {
  useEffect(() => {
    // Handle unhandled JS errors
    const handleError = (event: ErrorEvent) => {
      if (isKnownNoise(event.message || '')) return;

      logError({
        errorType: 'runtime',
        page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        errorMessage: event.message || 'Unknown error',
        stackTrace: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        severity: 'high',
        userImpact: 'Page may not function correctly',
      }).catch(() => {});
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : '';

      if (isKnownNoise(message)) return;

      logError({
        errorType: 'runtime',
        page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        errorMessage: `Unhandled Promise Rejection: ${message}`,
        stackTrace: stack || '',
        severity: 'high',
        userImpact: 'Background operation may have failed',
      }).catch(() => {});
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component renders nothing
}

/**
 * Wrapper for fetch that automatically tracks API errors.
 * Use instead of raw fetch() for API calls that should be monitored.
 */
export async function trackedFetch(
  url: string,
  options?: RequestInit,
  context?: { page?: string; userId?: string }
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      // Log non-OK responses as API errors
      logError({
        errorType: 'api',
        page: context?.page || (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
        apiEndpoint: url,
        errorMessage: `API Error: ${response.status} ${response.statusText}`,
        severity: response.status >= 500 ? 'critical' : 'medium',
        userId: context?.userId,
        userImpact: 'Data may not load correctly',
      }).catch(() => {});
    }

    return response;
  } catch (error: any) {
    // Log network failures
    logError({
      errorType: 'network',
      page: context?.page || (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
      apiEndpoint: url,
      errorMessage: `Network Error: ${error.message}`,
      stackTrace: error.stack,
      severity: 'high',
      userId: context?.userId,
      userImpact: 'Request failed — user may see missing data',
    }).catch(() => {});

    throw error; // Re-throw so calling code can handle it
  }
}
