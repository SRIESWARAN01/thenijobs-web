/**
 * Security utilities for input sanitization, rate limiting, and XSS prevention.
 */

// ===== INPUT SANITIZATION =====

/**
 * Strip HTML tags from a string to prevent XSS.
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize user input: strip HTML, limit length, trim whitespace.
 */
export function sanitizeInput(input: string, maxLength = 500): string {
  if (!input) return '';
  return stripHtml(input).slice(0, maxLength).trim();
}

/**
 * Sanitize a URL — only allow http/https protocols.
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.href;
  } catch {
    // If it doesn't start with http, try prepending https
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return sanitizeUrl(`https://${trimmed}`);
    }
    return '';
  }
}

/**
 * Sanitize a phone number — keep only digits, +, and spaces.
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d\s+()-]/g, '').trim();
}

/**
 * Sanitize an email — basic validation and lowercase.
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : '';
}

// ===== RATE LIMITING =====

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Client-side rate limiter. Returns true if the action is allowed.
 * @param key - Unique identifier for the rate limit (e.g., 'submit-review')
 * @param maxRequests - Maximum allowed requests in the window
 * @param windowMs - Time window in milliseconds (default: 60 seconds)
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Get remaining time in seconds before rate limit resets.
 */
export function getRateLimitRemaining(key: string): number {
  const entry = rateLimitMap.get(key);
  if (!entry) return 0;
  const remaining = Math.max(0, entry.resetTime - Date.now());
  return Math.ceil(remaining / 1000);
}

// ===== CONTENT VALIDATION =====

/**
 * Check if text contains suspicious patterns (SQL injection, script injection, etc.)
 */
export function hasSuspiciousContent(text: string): boolean {
  if (!text) return false;
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /data:text\/html/i,
    /eval\s*\(/i,
    /document\.(cookie|write|location)/i,
    /window\.(location|open)/i,
  ];
  return patterns.some((p) => p.test(text));
}

/**
 * Validate and sanitize a complete form payload.
 * Returns sanitized data and an array of issues found.
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  rules?: Partial<Record<keyof T, { maxLength?: number; type?: 'text' | 'email' | 'phone' | 'url' | 'number' }>>,
): { sanitized: T; issues: string[] } {
  const sanitized = { ...data };
  const issues: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') continue;

    const rule = rules?.[key as keyof T];

    // Check for suspicious content
    if (hasSuspiciousContent(value)) {
      issues.push(`Suspicious content detected in ${key}`);
      (sanitized as any)[key] = stripHtml(value);
    }

    // Apply type-specific sanitization
    if (rule?.type === 'email') {
      (sanitized as any)[key] = sanitizeEmail(value);
    } else if (rule?.type === 'phone') {
      (sanitized as any)[key] = sanitizePhone(value);
    } else if (rule?.type === 'url') {
      (sanitized as any)[key] = sanitizeUrl(value);
    } else if (rule?.type !== 'number') {
      (sanitized as any)[key] = sanitizeInput(value, rule?.maxLength || 1000);
    }
  }

  return { sanitized, issues };
}
