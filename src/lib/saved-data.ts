// Pure helpers for API data saved on the device (task 0007). The storage itself is in
// saved-store.ts; these have no storage or React, so they are unit-tested directly.
// Only public API data is ever saved this way, never anything about the user.

/** A saved query result and when it was fetched (milliseconds since 1970). */
export type Saved<T> = { fetchedAt: number; data: T };

export const HOUR = 60 * 60 * 1000;

/**
 * A short, stable fingerprint of a query's text. Saved data is keyed by it, so editing a
 * query (and running codegen) makes the app ignore data saved by the old query.
 */
export function fingerprint(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
}

/** True if data fetched at `fetchedAt` is younger than `maxAgeMs`. A future time is not fresh. */
export function isFresh(fetchedAt: number, now: number, maxAgeMs: number): boolean {
  const age = now - fetchedAt;
  return age >= 0 && age < maxAgeMs;
}

/** Parse what storage returned; null if missing, unreadable, or not the expected shape. */
export function parseSaved<T>(raw: string | null, isValid: (data: unknown) => data is T): Saved<T> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Saved<unknown>> | null;
    if (typeof value?.fetchedAt !== 'number' || !Number.isFinite(value.fetchedAt)) return null;
    return isValid(value.data) ? { fetchedAt: value.fetchedAt, data: value.data } : null;
  } catch {
    return null;
  }
}

/** "Nov 26, 2:15 PM" in the phone's time zone, for the "showing saved data" notice. */
export function formatSavedAt(fetchedAt: number): string {
  return new Date(fetchedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
