/**
 * THENIJOBS Centralized Safe API Response Handler & Fetch Client
 *
 * Permanently prevents:
 * "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * "SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
 *
 * Features:
 * - Reads the response body safely (via res.text() first).
 * - Checks HTTP status, content-type, and body length.
 * - Handles empty bodies (0 bytes, 204 No Content, empty error responses) without throwing.
 * - Handles valid JSON, malformed JSON, HTML error pages, and plain-text error responses.
 * - Preserves the original HTTP status, structured data, and backend error message.
 * - Attaches and tracks request correlation IDs for production-safe telemetry.
 * - Sanitizes sensitive stack traces, tokens, and database errors.
 * - Provides safeApiFetch to wrap fetch against network dropouts and cold-start failures.
 * - Provides getFriendlyApiErrorMessage for UI components and toast notifications.
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  correlationId?: string | null;
}

const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Generate a production-safe random correlation ID.
 */
export function generateCorrelationId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `req_${ts}_${rand}`;
}

/**
 * Strips sensitive data (passwords, tokens, database details, stack traces) from error messages.
 */
function sanitizeErrorMessage(msg: string): string {
  if (!msg || typeof msg !== 'string') return '';

  let sanitized = msg;

  // Mask Bearer tokens and JWTs
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED]');
  sanitized = sanitized.replace(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, '[REDACTED_JWT]');

  // Strip stack trace paths (e.g. "at /var/task/node_modules/...")
  if (sanitized.includes('    at ') || sanitized.includes('\n    at ')) {
    sanitized = sanitized.split(/\n?\s+at\s+/)[0].trim();
  }

  // Remove internal database or connection strings
  sanitized = sanitized.replace(/(mongodb|postgres|mysql|redis):\/\/[^\s]+/gi, '[DATABASE_URI_REDACTED]');

  return sanitized.trim();
}

/**
 * Produce a clean, user-facing error message based on HTTP status code.
 */
function getStatusErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request data. Please check your inputs and try again (HTTP 400).';
    case 401:
      return 'Your session has expired or authentication is required. Please sign in again (HTTP 401).';
    case 403:
      return 'You do not have permission to perform this action (HTTP 403).';
    case 404:
      return 'The requested service endpoint is not available (HTTP 404).';
    case 405:
      return 'Request method is not supported by the server (HTTP 405).';
    case 409:
      return 'A conflict occurred. A record with identical details already exists (HTTP 409).';
    case 429:
      return 'Too many requests. Please wait a moment before trying again (HTTP 429).';
    case 500:
      return 'Server encountered an unexpected error. Please retry in a moment (HTTP 500).';
    case 502:
      return 'Bad gateway: Upstream server is temporarily unreachable (HTTP 502).';
    case 503:
      return 'Service temporarily unavailable. Please retry shortly (HTTP 503).';
    case 504:
      return 'Gateway timeout: The server took too long to respond. Please check your request (HTTP 504).';
    default:
      if (status >= 500) {
        return `Server temporarily unavailable (HTTP ${status}). Please retry in a moment.`;
      }
      return `Server request failed (HTTP ${status}).`;
  }
}

/**
 * Safely parse a fetch Response object without throwing unhandled JSON exceptions.
 */
export async function safeParseResponse<T = any>(res?: Response | null): Promise<SafeApiResponse<T>> {
  if (!res) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Network request failed: No response received from server.',
      correlationId: null,
    };
  }

  const status = res.status || 0;
  const correlationId =
    typeof res.headers?.get === 'function'
      ? res.headers.get(CORRELATION_HEADER) || res.headers.get('x-request-id') || null
      : null;

  let rawText = '';
  try {
    rawText = await res.text();
  } catch (textErr: any) {
    return {
      ok: false,
      status,
      data: null,
      error: textErr?.message || 'Failed to read response body from server.',
      correlationId,
    };
  }

  const trimmed = rawText ? rawText.trim() : '';

  // 1. Handle empty bodies (0 bytes or whitespace only)
  if (!trimmed) {
    if (res.ok) {
      return {
        ok: true,
        status,
        data: null,
        error: null,
        correlationId,
      };
    }
    return {
      ok: false,
      status,
      data: null,
      error: `Server returned empty response (${getStatusErrorMessage(status)}).`,
      correlationId,
    };
  }

  // 2. Attempt JSON parse
  let parsedJson: any = null;
  let isJson = false;

  try {
    parsedJson = JSON.parse(trimmed);
    isJson = true;
  } catch {
    isJson = false;
  }

  if (isJson) {
    if (res.ok) {
      return {
        ok: true,
        status,
        data: parsedJson as T,
        error: null,
        correlationId,
      };
    }

    // Server returned a handled error with JSON body
    const rawError =
      parsedJson?.error ||
      parsedJson?.message ||
      parsedJson?.details ||
      getStatusErrorMessage(status);

    return {
      ok: false,
      status,
      data: parsedJson as T,
      error: sanitizeErrorMessage(rawError),
      correlationId,
    };
  }

  // 3. Handle non-JSON payload (HTML error pages or plain text)
  const contentType = typeof res.headers?.get === 'function' ? (res.headers.get('content-type') || '') : '';
  const looksLikeJson = contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[');

  if (!isJson && looksLikeJson) {
    return {
      ok: false,
      status,
      data: null,
      error: 'Invalid server response format: Malformed JSON payload received.',
      correlationId,
    };
  }

  if (res.ok) {
    return {
      ok: true,
      status,
      data: trimmed as unknown as T,
      error: null,
      correlationId,
    };
  }

  // Sanitize HTML error pages without leaking HTML tags
  let sanitizedError = getStatusErrorMessage(status);
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('<title>')) {
    if (status === 404) {
      sanitizedError = 'The requested service endpoint is not available (HTTP 404).';
    } else if (status >= 500) {
      sanitizedError = `Server temporarily unavailable (HTTP ${status}). Please retry in a moment.`;
    }
  } else if (trimmed.length < 200 && !trimmed.includes('<')) {
    sanitizedError = sanitizeErrorMessage(trimmed);
  }

  return {
    ok: false,
    status,
    data: null,
    error: sanitizedError,
    correlationId,
  };
}

/**
 * Centralized, safe fetch wrapper that catches network errors and guarantees a SafeApiResponse.
 * Automatically injects a correlation ID and handles all network, HTTP, and parsing edge cases.
 */
export async function safeApiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeApiResponse<T>> {
  const correlationId =
    (init?.headers as Record<string, string>)?.[CORRELATION_HEADER] ||
    generateCorrelationId();

  const headers = new Headers(init?.headers || {});
  if (!headers.has('Content-Type') && !(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has(CORRELATION_HEADER)) {
    headers.set(CORRELATION_HEADER, correlationId);
  }

  try {
    const res = await fetch(input, {
      ...init,
      headers,
    });
    const parsed = await safeParseResponse<T>(res);
    return {
      ...parsed,
      correlationId: parsed.correlationId || correlationId,
    };
  } catch (netErr: any) {
    const errMsg = netErr?.message || '';
    let friendly = 'Network request failed. Please check your internet connection and try again.';
    if (errMsg.includes('aborted') || errMsg.includes('AbortError')) {
      friendly = 'The request took too long or was cancelled. Please try again.';
    }
    return {
      ok: false,
      status: 0,
      data: null,
      error: friendly,
      correlationId,
    };
  }
}

/**
 * Universal user-facing error message normalizer for UI toasts and banners.
 * Converts technical browser exceptions into clear, actionable user messages.
 */
export function getFriendlyApiErrorMessage(
  err: unknown,
  fallback = 'An unexpected error occurred. Please try again.'
): string {
  if (!err) return fallback;
  const rawMsg = typeof err === 'string' ? err : (err as any)?.message || String(err);

  if (
    rawMsg.includes("Failed to execute 'json' on 'Response'") ||
    rawMsg.includes('Unexpected end of JSON input') ||
    rawMsg.includes('is not valid JSON') ||
    rawMsg.includes('JSON.parse') ||
    rawMsg.includes('Unexpected token') ||
    rawMsg.includes('SyntaxError')
  ) {
    return 'The server returned an empty or invalid response. Your request is being handled safely.';
  }

  if (
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('NetworkError') ||
    rawMsg.includes('Load failed')
  ) {
    return 'Unable to reach the server. Please check your internet connection and retry.';
  }

  return sanitizeErrorMessage(rawMsg) || fallback;
}
