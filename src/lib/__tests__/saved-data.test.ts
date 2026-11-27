import { describe, expect, it } from '@jest/globals';

import { membersFromLegislators, type LegislatorNode } from '../members';
import { fingerprint, HOUR, isFresh, parseSaved } from '../saved-data';

type Data = { allLegislators: { nodes: unknown[] } };
const isData = (d: unknown): d is Data => Array.isArray((d as Data | null)?.allLegislators?.nodes);
const NOW = Date.UTC(2026, 10, 26, 12);

describe('isFresh', () => {
  it('is fresh until the refresh age, then not', () => {
    expect(isFresh(NOW - 23 * HOUR, NOW, 24 * HOUR)).toBe(true);
    expect(isFresh(NOW - 24 * HOUR, NOW, 24 * HOUR)).toBe(false);
    expect(isFresh(NOW - 2 * HOUR, NOW, HOUR)).toBe(false);
  });

  it('treats a time in the future (phone clock changed) as not fresh', () => {
    expect(isFresh(NOW + HOUR, NOW, 24 * HOUR)).toBe(false);
  });
});

describe('fingerprint', () => {
  it('is stable for the same query and changes when the query does', () => {
    const query = 'query A { allLegislators { nodes { bioguideId } } }';
    expect(fingerprint(query)).toBe(fingerprint(query));
    expect(fingerprint(query)).not.toBe(fingerprint(query.replace('bioguideId', 'bioguideId lastName')));
  });
});

describe('parseSaved', () => {
  const saved = { fetchedAt: NOW, data: { allLegislators: { nodes: [] } } };

  it('reads a saved value of the expected shape', () => {
    expect(parseSaved(JSON.stringify(saved), isData)).toEqual(saved);
  });

  it('discards a value whose shape no longer matches', () => {
    const old = { fetchedAt: NOW, data: { legislators: [] } };
    expect(parseSaved(JSON.stringify(old), isData)).toBeNull();
  });

  it('discards missing, unreadable, or undated values', () => {
    expect(parseSaved(null, isData)).toBeNull();
    expect(parseSaved('{not json', isData)).toBeNull();
    expect(parseSaved(JSON.stringify({ data: saved.data }), isData)).toBeNull();
  });
});

describe('membersFromLegislators on a saved list', () => {
  const node = (bioguideId: string, endDate: string): LegislatorNode => ({
    bioguideId,
    officialFull: `Member ${bioguideId}`,
    firstName: 'Pat',
    lastName: bioguideId,
    legislatorTermsByBioguideIdList: [
      { termType: 'rep', party: 'Independent', state: 'OH', district: 3, startDate: '2025-01-03', endDate },
    ],
  });

  it('leaves out members whose term has ended since the list was saved', () => {
    const saved = [node('A000001', '2027-01-03'), node('B000002', '2026-11-25'), null];
    const members = membersFromLegislators(saved, '2026-11-26');
    expect(members.map((m) => m.bioguideId)).toEqual(['A000001']);
  });
});
