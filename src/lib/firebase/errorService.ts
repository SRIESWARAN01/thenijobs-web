'use client';

/**
 * THENIJOBS — Error Tracking Service
 * Logs errors to Firestore 'errors' collection for admin dashboard visibility.
 * Provides error severity classification, deduplication, and status management.
 */

import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs, updateDoc, doc, getCountFromServer } from 'firebase/firestore';
import { db } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ErrorStatus = 'open' | 'investigating' | 'fixed' | 'ignored';
export type ErrorType = 'runtime' | 'api' | 'component' | 'auth' | 'database' | 'validation' | 'network' | 'build' | 'unknown';

export interface ErrorLogData {
  errorId?: string;
  errorType: ErrorType;
  page: string;
  component?: string;
  apiEndpoint?: string;
  errorMessage: string;
  stackTrace?: string;
  severity: ErrorSeverity;
  affectedUsers?: number;
  userImpact?: string;
  browserInfo?: string;
  userId?: string;
  status: ErrorStatus;
  fixedAt?: string;
  fixedBy?: string;
  lastOccurred: any;
  occurrenceCount: number;
  metadata?: Record<string, any>;
}

export interface ErrorRecord extends ErrorLogData {
  id: string;
  createdAt: any;
  updatedAt: any;
}

// ─── Deduplication Cache ──────────────────────────────────────────────────────

const recentErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000; // Don't log same error twice within 1 minute

function getErrorFingerprint(errorMessage: string, page: string, component?: string): string {
  return `${page}|${component || ''}|${errorMessage.slice(0, 100)}`;
}

// ─── Auto-classify severity ──────────────────────────────────────────────────

function classifySeverity(error: Error, context?: { page?: string; component?: string }): ErrorSeverity {
  const msg = error.message.toLowerCase();

  // Critical: auth, data loss, payment
  if (msg.includes('auth') || msg.includes('payment') || msg.includes('data loss') || msg.includes('firebase')) {
    return 'critical';
  }
  // High: API failures, database errors
  if (msg.includes('api') || msg.includes('fetch') || msg.includes('firestore') || msg.includes('network')) {
    return 'high';
  }
  // Medium: component rendering, validation
  if (msg.includes('render') || msg.includes('validation') || msg.includes('undefined') || msg.includes('null')) {
    return 'medium';
  }
  // Low: UI glitches, non-critical
  return 'low';
}

function classifyErrorType(error: Error, context?: { apiEndpoint?: string; component?: string }): ErrorType {
  if (context?.apiEndpoint) return 'api';
  if (context?.component) return 'component';

  const msg = error.message.toLowerCase();
  if (msg.includes('auth') || msg.includes('login') || msg.includes('permission')) return 'auth';
  if (msg.includes('firestore') || msg.includes('database') || msg.includes('firebase')) return 'database';
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('cors')) return 'network';
  if (msg.includes('validation') || msg.includes('invalid') || msg.includes('required')) return 'validation';
  return 'runtime';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Log an error to Firestore errors collection.
 * Includes deduplication to prevent flooding.
 */
export async function logError(data: Partial<ErrorLogData> & { errorMessage: string; page: string }): Promise<string | null> {
  try {
    // Deduplication check
    const fingerprint = getErrorFingerprint(data.errorMessage, data.page, data.component);
    const lastLogged = recentErrors.get(fingerprint);
    if (lastLogged && Date.now() - lastLogged < DEDUP_WINDOW_MS) {
      return null; // Skip duplicate
    }
    recentErrors.set(fingerprint, Date.now());

    // Clean up old cache entries
    if (recentErrors.size > 100) {
      const cutoff = Date.now() - DEDUP_WINDOW_MS;
      for (const [key, time] of recentErrors) {
        if (time < cutoff) recentErrors.delete(key);
      }
    }

    const errorDoc: any = {
      errorType: data.errorType || 'unknown',
      page: data.page,
      component: data.component || '',
      apiEndpoint: data.apiEndpoint || '',
      errorMessage: data.errorMessage.slice(0, 2000), // Truncate very long messages
      stackTrace: (data.stackTrace || '').slice(0, 5000),
      severity: data.severity || 'medium',
      affectedUsers: data.affectedUsers || 1,
      userImpact: data.userImpact || '',
      browserInfo: data.browserInfo || (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : ''),
      userId: data.userId || '',
      status: 'open',
      lastOccurred: serverTimestamp(),
      occurrenceCount: 1,
      metadata: data.metadata || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'errors'), errorDoc);
    return docRef.id;
  } catch (err) {
    // Silently fail — don't let error logging cause more errors
    console.error('[ErrorService] Failed to log error:', err);
    return null;
  }
}

/**
 * Track API errors with endpoint context
 */
export async function trackApiError(
  endpoint: string,
  error: Error,
  context?: { page?: string; userId?: string }
): Promise<string | null> {
  return logError({
    errorType: 'api',
    page: context?.page || 'unknown',
    apiEndpoint: endpoint,
    errorMessage: error.message,
    stackTrace: error.stack,
    severity: classifySeverity(error),
    userId: context?.userId,
  });
}

/**
 * Track React component errors (from ErrorBoundary)
 */
export async function trackComponentError(
  component: string,
  error: Error,
  componentStack?: string
): Promise<string | null> {
  const page = typeof window !== 'undefined' ? window.location.pathname : 'unknown';

  return logError({
    errorType: 'component',
    page,
    component,
    errorMessage: error.message,
    stackTrace: componentStack || error.stack,
    severity: classifySeverity(error, { component }),
  });
}

/**
 * Fetch errors from Firestore with filters
 */
export async function getErrors(filters?: {
  status?: ErrorStatus;
  severity?: ErrorSeverity;
  errorType?: ErrorType;
  limitCount?: number;
}): Promise<ErrorRecord[]> {
  const constraints: any[] = [];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.severity) {
    constraints.push(where('severity', '==', filters.severity));
  }
  if (filters?.errorType) {
    constraints.push(where('errorType', '==', filters.errorType));
  }

  constraints.push(orderBy('lastOccurred', 'desc'));
  constraints.push(limit(filters?.limitCount || 50));

  const q = query(collection(db, 'errors'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as ErrorRecord[];
}

/**
 * Update error status (for admin workflow)
 */
export async function updateErrorStatus(
  errorId: string,
  status: ErrorStatus,
  fixedBy?: string
): Promise<void> {
  const updateData: any = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'fixed' && fixedBy) {
    updateData.fixedAt = serverTimestamp();
    updateData.fixedBy = fixedBy;
  }

  await updateDoc(doc(db, 'errors', errorId), updateData);
}

/**
 * Get error statistics for dashboard
 */
export async function getErrorStats(): Promise<{
  total: number;
  open: number;
  critical: number;
  investigating: number;
}> {
  const [total, open, critical, investigating] = await Promise.all([
    getCountFromServer(collection(db, 'errors')).then(s => s.data().count),
    getCountFromServer(query(collection(db, 'errors'), where('status', '==', 'open'))).then(s => s.data().count),
    getCountFromServer(query(collection(db, 'errors'), where('severity', '==', 'critical'), where('status', '==', 'open'))).then(s => s.data().count),
    getCountFromServer(query(collection(db, 'errors'), where('status', '==', 'investigating'))).then(s => s.data().count),
  ]);

  return { total, open, critical, investigating };
}
