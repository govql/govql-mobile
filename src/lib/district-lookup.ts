// Location → state and congressional district, via the U.S. Census Bureau Geocoder
// (free, no key). Called from the device only. Never log or store the address or
// coordinates passed in here. Unit-tested in __tests__/ with a stubbed fetch.

import { ordinal } from '@/lib/congress';

const CENSUS_BASE = 'https://geocoding.geo.census.gov/geocoder/geographies';

/** Where the user is. Task 0006 adds a ZIP variant handled on the device. */
export type LocationQuery =
  | { kind: 'address'; address: string }
  | { kind: 'coordinates'; latitude: number; longitude: number };

/** A congressional seat. District 0 = at-large state, or a delegate (DC, territories). */
export type District = { state: string; district: number; congress: number };

export type LookupError =
  /** The address or point isn't in the U.S. or couldn't be matched. */
  | 'notFound'
  /** The address matched places in different districts. */
  | 'ambiguous'
  /** No Census district map for the Congress the app is showing. */
  | 'noMatchingMap'
  /** Offline, timed out, or the Census service failed. */
  | 'network';

export type LookupResult = { ok: true; district: District } | { ok: false; error: LookupError };

type Fetch = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

type Geographies = Record<string, { STUSAB?: string; GEOID?: string }[] | undefined>;

/**
 * Census vintages to try, newest first. The default (`Current_Current`) switches to the
 * next Congress's maps right after an election, so older ACS vintages are fallbacks.
 */
export function vintagesToTry(today: string): string[] {
  const year = Number(today.slice(0, 4));
  return ['Current_Current', `ACS${year}_Current`, `ACS${year - 1}_Current`, `ACS${year - 2}_Current`];
}

/** "119th Congressional Districts" → 119; anything else → null. */
export function congressOfLayer(layerName: string): number | null {
  const match = /^(\d+)(?:st|nd|rd|th) Congressional Districts$/.exec(layerName);
  return match ? Number(match[1]) : null;
}

/** The seat a set of Census geographies falls in, for the given Congress (null if absent). */
export function districtFromGeographies(geographies: Geographies, congress: number): District | null {
  const state = geographies.States?.[0]?.STUSAB;
  const geoid = geographies[`${ordinal(congress)} Congressional Districts`]?.[0]?.GEOID;
  if (!state || !geoid || geoid.length < 4) return null;
  const code = geoid.slice(-2);
  // 00 = at-large state; 98 = delegate district (DC, territories). Both are stored as 0.
  if (code === '00' || code === '98') return { state, district: 0, congress };
  const district = Number(code);
  return Number.isInteger(district) && district > 0 ? { state, district, congress } : null;
}

/** The Congress whose district layer a response includes, or null. */
function layerCongress(geographies: Geographies): number | null {
  for (const name of Object.keys(geographies)) {
    const congress = congressOfLayer(name);
    if (congress !== null) return congress;
  }
  return null;
}

function buildUrl(query: LocationQuery, vintage: string): string {
  const params = new URLSearchParams({ benchmark: 'Public_AR_Current', vintage, format: 'json' });
  if (query.kind === 'address') {
    params.set('address', query.address);
    return `${CENSUS_BASE}/onelineaddress?${params}`;
  }
  params.set('x', String(query.longitude));
  params.set('y', String(query.latitude));
  return `${CENSUS_BASE}/coordinates?${params}`;
}

/** The geographies of every match in a response (address: 0..n; coordinates: 0 or 1). */
function matchesOf(body: unknown): Geographies[] {
  const result = (body as { result?: Record<string, unknown> } | null)?.result;
  if (!result) return [];
  const addressMatches = result.addressMatches as { geographies?: Geographies }[] | undefined;
  if (Array.isArray(addressMatches)) {
    return addressMatches.flatMap((m) => (m.geographies ? [m.geographies] : []));
  }
  const geographies = result.geographies as Geographies | undefined;
  return geographies && Object.keys(geographies).length > 0 ? [geographies] : [];
}

/**
 * Look up the seat for a location, using a Census map for `targetCongress` (the Congress
 * whose members the app shows). Tries vintages newest first until one has that Congress.
 */
export async function lookupDistrict(
  query: LocationQuery,
  targetCongress: number,
  options: { today: string; fetchFn?: Fetch }
): Promise<LookupResult> {
  const fetchFn: Fetch = options.fetchFn ?? ((url) => fetch(url));
  if (query.kind === 'address' && !query.address.trim()) return { ok: false, error: 'notFound' };

  for (const vintage of vintagesToTry(options.today)) {
    let body: unknown;
    try {
      const response = await fetchFn(buildUrl(query, vintage));
      if (!response.ok) return { ok: false, error: 'network' };
      body = await response.json();
    } catch {
      return { ok: false, error: 'network' };
    }

    const matches = matchesOf(body);
    if (matches.length === 0) return { ok: false, error: 'notFound' };

    // This vintage has another Congress's maps: try the next one.
    if (layerCongress(matches[0]) !== targetCongress) continue;

    const seats = matches.map((g) => districtFromGeographies(g, targetCongress));
    const first = seats[0];
    if (!first || seats.some((s) => !s)) return { ok: false, error: 'notFound' };
    const allSame = seats.every((s) => s!.state === first.state && s!.district === first.district);
    return allSame ? { ok: true, district: first } : { ok: false, error: 'ambiguous' };
  }

  return { ok: false, error: 'noMatchingMap' };
}
