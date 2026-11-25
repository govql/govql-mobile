import { describe, expect, it, jest } from '@jest/globals';

import {
  congressOfLayer,
  districtFromGeographies,
  lookupDistrict,
  vintagesToTry,
} from '../district-lookup';

const TODAY = '2026-11-25';

// Shapes copied from real Census Geocoder responses (2026-11-25), trimmed.
function geographies(congress: number, state: string, geoid: string) {
  return {
    States: [{ STUSAB: state, GEOID: geoid.slice(0, 2) }],
    [`${congress}th Congressional Districts`]: [{ GEOID: geoid }],
  };
}
const addressResponse = (...matches: object[]) => ({
  result: { addressMatches: matches.map((g) => ({ geographies: g })) },
});
const coordinatesResponse = (g: object) => ({ result: { geographies: g } });

/** A fetch stub that returns each body in turn and records the URLs it was called with. */
function stubFetch(...bodies: unknown[]) {
  const urls: string[] = [];
  const fetchFn = jest.fn(async (url: string) => {
    urls.push(url);
    const body = bodies.shift();
    return { ok: true, json: async () => body };
  });
  return { fetchFn, urls };
}

describe('congressOfLayer', () => {
  it('reads the Congress from a district layer name', () => {
    expect(congressOfLayer('119th Congressional Districts')).toBe(119);
    expect(congressOfLayer('121st Congressional Districts')).toBe(121);
    expect(congressOfLayer('States')).toBeNull();
  });
});

describe('districtFromGeographies', () => {
  it('reads a numbered district', () => {
    expect(districtFromGeographies(geographies(119, 'TX', '4807'), 119)).toEqual({
      state: 'TX',
      district: 7,
      congress: 119,
    });
  });

  it('treats 00 (at-large) and 98 (delegate) as district 0', () => {
    expect(districtFromGeographies(geographies(119, 'WY', '5600'), 119)?.district).toBe(0);
    expect(districtFromGeographies(geographies(119, 'DC', '1198'), 119)?.district).toBe(0);
  });

  it('returns null when the layer for that Congress is missing', () => {
    expect(districtFromGeographies(geographies(120, 'TX', '4807'), 119)).toBeNull();
  });
});

describe('vintagesToTry', () => {
  it('tries the newest maps first, then recent ACS vintages', () => {
    expect(vintagesToTry(TODAY)).toEqual([
      'Current_Current',
      'ACS2026_Current',
      'ACS2025_Current',
      'ACS2024_Current',
    ]);
  });
});

describe('lookupDistrict', () => {
  it('returns the district when the first vintage has the right Congress', async () => {
    const { fetchFn, urls } = stubFetch(addressResponse(geographies(119, 'TX', '4807')));
    const result = await lookupDistrict({ kind: 'address', address: '1 Main St' }, 119, {
      today: TODAY,
      fetchFn,
    });
    expect(result).toEqual({ ok: true, district: { state: 'TX', district: 7, congress: 119 } });
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('/onelineaddress?');
    expect(urls[0]).toContain('vintage=Current_Current');
  });

  it('skips vintages with the next Congress’s maps until one matches', async () => {
    const { fetchFn, urls } = stubFetch(
      addressResponse(geographies(120, 'TX', '4818')),
      addressResponse(geographies(120, 'TX', '4818')),
      addressResponse(geographies(119, 'TX', '4807'))
    );
    const result = await lookupDistrict({ kind: 'address', address: '1 Main St' }, 119, {
      today: TODAY,
      fetchFn,
    });
    expect(result).toEqual({ ok: true, district: { state: 'TX', district: 7, congress: 119 } });
    expect(urls.map((u) => new URL(u).searchParams.get('vintage'))).toEqual([
      'Current_Current',
      'ACS2026_Current',
      'ACS2025_Current',
    ]);
  });

  it('uses the coordinates endpoint with x = longitude and y = latitude', async () => {
    const { fetchFn, urls } = stubFetch(coordinatesResponse(geographies(119, 'WY', '5600')));
    const result = await lookupDistrict({ kind: 'coordinates', latitude: 41.14, longitude: -104.82 }, 119, {
      today: TODAY,
      fetchFn,
    });
    expect(result).toEqual({ ok: true, district: { state: 'WY', district: 0, congress: 119 } });
    const params = new URL(urls[0]).searchParams;
    expect(urls[0]).toContain('/coordinates?');
    expect(params.get('x')).toBe('-104.82');
    expect(params.get('y')).toBe('41.14');
  });

  it('finds DC’s delegate district', async () => {
    const { fetchFn } = stubFetch(addressResponse(geographies(119, 'DC', '1198')));
    const result = await lookupDistrict({ kind: 'address', address: '1600 Pennsylvania Ave NW' }, 119, {
      today: TODAY,
      fetchFn,
    });
    expect(result).toEqual({ ok: true, district: { state: 'DC', district: 0, congress: 119 } });
  });

  it('reports not found for no matches or a blank address', async () => {
    const { fetchFn } = stubFetch(addressResponse());
    expect(await lookupDistrict({ kind: 'address', address: 'nowhere' }, 119, { today: TODAY, fetchFn })).toEqual({
      ok: false,
      error: 'notFound',
    });
    expect(await lookupDistrict({ kind: 'address', address: '  ' }, 119, { today: TODAY, fetchFn })).toEqual({
      ok: false,
      error: 'notFound',
    });
  });

  it('reports ambiguous when matches fall in different districts, but not when they agree', async () => {
    const differing = stubFetch(
      addressResponse(geographies(119, 'TX', '4807'), geographies(119, 'TX', '4809'))
    );
    expect(
      await lookupDistrict({ kind: 'address', address: 'Main St' }, 119, { today: TODAY, fetchFn: differing.fetchFn })
    ).toEqual({ ok: false, error: 'ambiguous' });

    const agreeing = stubFetch(
      addressResponse(geographies(119, 'TX', '4807'), geographies(119, 'TX', '4807'))
    );
    expect(
      await lookupDistrict({ kind: 'address', address: 'Main St' }, 119, { today: TODAY, fetchFn: agreeing.fetchFn })
    ).toEqual({ ok: true, district: { state: 'TX', district: 7, congress: 119 } });
  });

  it('reports network errors for a thrown fetch or a failed response', async () => {
    const throwing = jest.fn(async () => {
      throw new Error('offline');
    });
    expect(
      await lookupDistrict({ kind: 'address', address: 'x' }, 119, { today: TODAY, fetchFn: throwing })
    ).toEqual({ ok: false, error: 'network' });

    const failing = jest.fn(async () => ({ ok: false, json: async () => ({}) }));
    expect(
      await lookupDistrict({ kind: 'address', address: 'x' }, 119, { today: TODAY, fetchFn: failing })
    ).toEqual({ ok: false, error: 'network' });
  });

  it('reports no matching map when no vintage has the target Congress', async () => {
    const { fetchFn } = stubFetch(
      ...Array.from({ length: 4 }, () => addressResponse(geographies(120, 'TX', '4818')))
    );
    expect(await lookupDistrict({ kind: 'address', address: 'x' }, 119, { today: TODAY, fetchFn })).toEqual({
      ok: false,
      error: 'noMatchingMap',
    });
  });
});
