/**
 * Firestore timestamps reach these pages in three shapes depending on whether
 * the document came from a live snapshot, a cached read, or a REST payload:
 * a Timestamp with `toMillis()`, a Date, or a raw number/string.
 *
 * The dashboards each open-coded `new Date(x?.toMillis?.() || x)`, which
 * silently produces an Invalid Date for the shapes it does not expect and then
 * renders the string "Invalid Date" to the user.
 */
export type FirestoreTime =
  | { toMillis?: () => number; toDate?: () => Date }
  | Date
  | number
  | string
  | null
  | undefined;

export function toDate(value: FirestoreTime): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') return new Date(value.toMillis());
    if (typeof value.toDate === 'function') return value.toDate();
    return null;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Short date, or `fallback` when the value is missing or unparseable. */
export function formatDate(value: FirestoreTime, fallback = 'Recently'): string {
  const d = toDate(value);
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : fallback;
}

/** Date and time, or `fallback`. */
export function formatDateTime(value: FirestoreTime, fallback = 'Recently'): string {
  const d = toDate(value);
  return d ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : fallback;
}

/** "3m ago" / "5h ago" / "2d ago". */
export function formatRelative(value: FirestoreTime, fallback = 'Just now'): string {
  const d = toDate(value);
  if (!d) return fallback;
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value, fallback);
}
