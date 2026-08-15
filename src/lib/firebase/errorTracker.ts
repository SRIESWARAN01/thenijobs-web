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
export function GlobalErrorTracker() {
  useEffect(() => {
    // Handle unhandled JS errors
    const handleError = (event: ErrorEvent) => {
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
