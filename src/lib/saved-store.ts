// Reads and writes saved API data in expo-sqlite's key-value store (the same store as the
// saved district). Reads are synchronous, so saved data is ready on the first render.
// Each key is read from storage once per app session, then served from memory.

import Storage from 'expo-sqlite/kv-store';

import { parseSaved, type Saved } from '@/lib/saved-data';

const memory = new Map<string, Saved<unknown> | null>();

export function loadSaved<T>(key: string, isValid: (data: unknown) => data is T): Saved<T> | null {
  if (!memory.has(key)) {
    let raw: string | null = null;
    try {
      raw = Storage.getItemSync(key);
    } catch {
      raw = null;
    }
    memory.set(key, parseSaved(raw, isValid));
  }
  return memory.get(key) as Saved<T> | null;
}

export function saveData<T>(key: string, data: T, now = Date.now()): void {
  const saved: Saved<T> = { fetchedAt: now, data };
  memory.set(key, saved);
  try {
    Storage.setItemSync(key, JSON.stringify(saved));
  } catch {
    // Saving is best effort: the app still works, it just refetches next launch.
  }
}
