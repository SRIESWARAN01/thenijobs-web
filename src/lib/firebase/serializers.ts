import type { DocumentData } from 'firebase/firestore';

function isFirestoreTimestamp(value: Record<string, unknown>) {
  return (
    typeof value.toDate === 'function' &&
    typeof value.toMillis === 'function' &&
    typeof value.seconds === 'number'
  );
}

function normaliseValue(value: unknown): unknown {
  if (!value || value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normaliseValue);
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (isFirestoreTimestamp(record)) {
      return (record.toDate as () => Date)();
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype && prototype !== Object.prototype) {
      return value;
    }

    return Object.keys(record).reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = normaliseValue(record[key]);
      return acc;
    }, {});
  }

  return value;
}

export function normaliseTimestamps<T extends DocumentData>(data: T): T {
  return normaliseValue(data) as T;
}

export function toDate(value: unknown): Date | null {
  const normalised = normaliseValue(value);

  if (normalised instanceof Date) {
    return Number.isNaN(normalised.getTime()) ? null : normalised;
  }

  if (typeof normalised === 'number' || typeof normalised === 'string') {
    const date = new Date(normalised);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
