// Remembers the user's seat on the device, so they don't re-enter it each launch.
// Privacy: stores ONLY { state, district, congress }. Never the address or coordinates.

import Storage from 'expo-sqlite/kv-store';

import type { District } from '@/lib/district-lookup';

// Bump the version if the stored shape changes; older values are then ignored.
const KEY = 'myDistrict:v1';

function isDistrict(value: unknown): value is District {
  const v = value as Partial<District> | null;
  return (
    typeof v?.state === 'string' &&
    /^[A-Z]{2}$/.test(v.state) &&
    Number.isInteger(v.district) &&
    Number.isInteger(v.congress)
  );
}

/** The saved seat, or null if none (or if what's stored is unreadable). Synchronous. */
export function loadSavedDistrict(): District | null {
  try {
    const raw = Storage.getItemSync(KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isDistrict(value) ? { state: value.state, district: value.district, congress: value.congress } : null;
  } catch {
    return null;
  }
}

export function saveDistrict(district: District): void {
  // Copy only these three fields, so nothing else can be stored by accident.
  const { state, district: number, congress } = district;
  Storage.setItemSync(KEY, JSON.stringify({ state, district: number, congress }));
}

export function clearSavedDistrict(): void {
  Storage.removeItemSync(KEY);
}
