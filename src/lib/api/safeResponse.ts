/**
 * THENIJOBS Safe API Response Parser
 *
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
 * by reading the response body once as text and safely parsing JSON.
 * Gracefully handles:
 * - Empty bodies (0 bytes, 204 No Content, empty error responses)
 * - HTML error pages (404, 502, 504 from CDNs, proxies, or static hosts)
 * - Valid JSON success & error payloads
 * - Network or unexpected server response errors
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/**
 * Safely parse a fetch Response object without throwing unhandled JSON exceptions.
 */
export async function safeParseResponse<T = any>(res: Response): Promise<SafeApiResponse<T>> {
  if (!res) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: 'Network request failed: No response received from server.',
    };
  }

  const status = res.status || 0;
  let rawText = '';

  try {
    rawText = await res.text();
  } catch (textErr: any) {
    return {
      ok: false,
      status,
      data: null,
      error: textErr?.message || 'Failed to read response body from server.',
    };
  }

  // Handle empty bodies (0 bytes or whitespace only)
  const trimmed = rawText ? rawText.trim() : '';
  if (!trimmed) {
    if (res.ok) {
      return {
        ok: true,
        status,
        data: null,
        error: null,
      };
    }
    return {
      ok: false,
      status,
      data: null,
      error: `Server returned empty response (HTTP ${status}).`,
    };
  }

  // Attempt JSON parse
  let parsedJson: any = null;
  let isJson = false;

  try {
    parsedJson = JSON.parse(trimmed);
    isJson = true;
  } catch {
    // Non-JSON response (e.g. 404 HTML page or plain text)
    isJson = false;
  }

  if (isJson) {
    if (res.ok) {
      return {
        ok: true,
        status,
        data: parsedJson as T,
        error: null,
      };
    }
    // Server returned a handled error with JSON body
    const errMsg =
      parsedJson?.error ||
      parsedJson?.message ||
      `Server request failed with HTTP ${status}.`;
    return {
      ok: false,
      status,
      data: parsedJson as T,
      error: errMsg,
    };
  }

  // Handled non-JSON payload
  const contentType = res.headers?.get ? (res.headers.get('content-type') || '') : '';
  const looksLikeJson = contentType.includes('application/json') || trimmed.startsWith('{') || trimmed.startsWith('[');

  if (!isJson && looksLikeJson) {
    return {
      ok: false,
      status,
      data: null,
      error: 'Invalid server response format: Malformed JSON payload received.',
    };
  }

  if (res.ok) {
    return {
      ok: true,
      status,
      data: trimmed as unknown as T,
      error: null,
    };
  }

  // Clean error message without exposing HTML tags or internal stack traces
  let sanitizedError = `Server request failed (HTTP ${status}).`;
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
    if (status === 404) {
      sanitizedError = 'The requested authentication endpoint is not available (HTTP 404).';
    } else if (status >= 500) {
      sanitizedError = `Server temporarily unavailable (HTTP ${status}). Please retry in a moment.`;
    }
  } else if (trimmed.length < 150) {
    sanitizedError = trimmed;
  }

  return {
    ok: false,
    status,
    data: null,
    error: sanitizedError,
  };
}
