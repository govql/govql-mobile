import { describe, expect, it, jest } from '@jest/globals';

import { ZIP_DISTRICTS_CONGRESS } from '@/data/zip-districts';
import { lookupDistrict } from '../district-lookup';
import { lookupZip, parseZip, type ZipTable } from '../zip-lookup';

// A small table in the generated format.
const TABLE: ZipTable = {
  congress: 119,
  entries: ['20001DC0', '43215OH3', '77002TX7,TX18', '82001WY0', '96910GU0'].join(';'),
};

describe('parseZip', () => {
  it('accepts 5-digit ZIPs and ZIP+4, keeping the first 5 digits', () => {
    expect(parseZip('77002')).toBe('77002');
    expect(parseZip(' 77002 ')).toBe('77002');
    expect(parseZip('77002-1234')).toBe('77002');
    expect(parseZip('770021234')).toBe('77002');
  });

  it('rejects anything else, so addresses go to the Census Geocoder', () => {
    expect(parseZip('7700')).toBeNull();
    expect(parseZip('123 Main St, Houston, TX 77002')).toBeNull();
    expect(parseZip('77002-12')).toBeNull();
    expect(parseZip('')).toBeNull();
  });
});

describe('lookupZip', () => {
  it('returns the district for a single-district ZIP', () => {
    expect(lookupZip('43215', 119, TABLE)).toEqual({
      ok: true,
      district: { state: 'OH', district: 3, congress: 119 },
    });
  });

  it('returns every district as choices for a multi-district ZIP, never one of them', () => {
    expect(lookupZip('77002', 119, TABLE)).toEqual({
      ok: false,
      error: 'ambiguous',
      choices: [
        { state: 'TX', district: 7, congress: 119 },
        { state: 'TX', district: 18, congress: 119 },
      ],
    });
  });

  it('handles at-large states and delegates as district 0', () => {
    expect(lookupZip('82001', 119, TABLE)).toEqual({
      ok: true,
      district: { state: 'WY', district: 0, congress: 119 },
    });
    expect(lookupZip('20001', 119, TABLE)).toEqual({
      ok: true,
      district: { state: 'DC', district: 0, congress: 119 },
    });
    expect(lookupZip('96910', 119, TABLE)).toEqual({
      ok: true,
      district: { state: 'GU', district: 0, congress: 119 },
    });
  });

  it('reports an unknown ZIP as not found', () => {
    expect(lookupZip('20500', 119, TABLE)).toEqual({ ok: false, error: 'notFound' });
  });

  it('refuses to answer when the table is for another Congress', () => {
    expect(lookupZip('43215', 120, TABLE)).toEqual({ ok: false, error: 'zipNotUpdated' });
  });
});

describe('the bundled table', () => {
  const congress = ZIP_DISTRICTS_CONGRESS;

  it('has known ZIPs from the Census file', () => {
    expect(lookupZip('82001', congress)).toEqual({ ok: true, district: { state: 'WY', district: 0, congress } });
    expect(lookupZip('20001', congress)).toEqual({ ok: true, district: { state: 'DC', district: 0, congress } });
    expect(lookupZip('77002', congress)).toMatchObject({ ok: false, error: 'ambiguous' });
  });

  it('has no entry for ZIPs without a ZCTA (the White House)', () => {
    expect(lookupZip('20500', congress)).toEqual({ ok: false, error: 'notFound' });
  });
});

describe('lookupDistrict with a ZIP', () => {
  it('answers on the device without calling the network', async () => {
    const fetchFn = jest.fn(async () => ({ ok: true, json: async () => ({}) }));
    const result = await lookupDistrict({ kind: 'zip', zip: '43215' }, 119, {
      today: '2026-11-25',
      fetchFn,
      zipTable: TABLE,
    });
    expect(result).toEqual({ ok: true, district: { state: 'OH', district: 3, congress: 119 } });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
