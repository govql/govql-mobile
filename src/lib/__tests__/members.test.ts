import { describe, expect, it } from '@jest/globals';

import {
  currentTerm,
  displayName,
  groupByChamber,
  matchesSearch,
  seatLabel,
  toMember,
  type Member,
} from '../members';

const TODAY = '2026-11-24';

function member(overrides: Partial<Member>): Member {
  return {
    bioguideId: 'X000001',
    name: 'Test Member',
    lastName: 'Member',
    chamber: 'house',
    party: 'Independent',
    state: 'TX',
    district: 7,
    ...overrides,
  };
}

describe('displayName', () => {
  it('uses officialFull when present', () => {
    expect(displayName({ officialFull: 'Ryan K. Zinke', firstName: 'Ryan', lastName: 'Zinke' })).toBe(
      'Ryan K. Zinke'
    );
  });

  it('falls back to first and last name when officialFull is blank or null', () => {
    expect(displayName({ officialFull: null, firstName: 'Fred', lastName: 'Aandahl' })).toBe('Fred Aandahl');
    expect(displayName({ officialFull: '  ', firstName: 'Fred', lastName: 'Aandahl' })).toBe('Fred Aandahl');
  });

  it('never returns an empty string', () => {
    expect(displayName({})).toBe('Name unavailable');
  });
});

describe('seatLabel', () => {
  it('labels senators by state, ignoring district', () => {
    expect(seatLabel({ chamber: 'senate', state: 'WY', district: null })).toBe('Senator, WY');
  });

  it('labels numbered House districts', () => {
    expect(seatLabel({ chamber: 'house', state: 'TX', district: 7 })).toBe('Representative, TX-7');
  });

  it('labels district 0 in a state as at-large', () => {
    expect(seatLabel({ chamber: 'house', state: 'WY', district: 0 })).toBe('Representative, WY at-large');
  });

  it('labels delegates by title, not as at-large, though they also have district 0', () => {
    expect(seatLabel({ chamber: 'house', state: 'DC', district: 0 })).toBe('Delegate, DC');
    expect(seatLabel({ chamber: 'house', state: 'GU', district: 0 })).toBe('Delegate, GU');
    expect(seatLabel({ chamber: 'house', state: 'PR', district: 0 })).toBe('Resident Commissioner, PR');
  });
});

describe('currentTerm', () => {
  it('picks the term ending latest, if it ends after today', () => {
    const terms = [
      { termType: 'rep', endDate: '2025-01-03' },
      { termType: 'sen', endDate: '2031-01-03' },
      { termType: 'sen', endDate: '2027-01-03' },
    ];
    expect(currentTerm(terms, TODAY)?.endDate).toBe('2031-01-03');
  });

  it('returns null when every term has ended', () => {
    expect(currentTerm([{ endDate: '2019-01-03' }, { endDate: TODAY }], TODAY)).toBeNull();
  });

  it('skips null terms and terms without an end date', () => {
    expect(currentTerm([null, { endDate: null }, { endDate: '2027-01-03' }], TODAY)?.endDate).toBe(
      '2027-01-03'
    );
  });
});

describe('toMember', () => {
  it('maps a current senator', () => {
    expect(
      toMember(
        {
          bioguideId: 'B001261',
          officialFull: 'John Barrasso',
          firstName: 'John',
          lastName: 'Barrasso',
          terms: [{ termType: 'sen', party: 'Republican', state: 'WY', district: null, endDate: '2031-01-03' }],
        },
        TODAY
      )
    ).toEqual({
      bioguideId: 'B001261',
      name: 'John Barrasso',
      lastName: 'Barrasso',
      chamber: 'senate',
      party: 'Republican',
      state: 'WY',
      district: null,
    });
  });

  it('returns null for someone no longer serving', () => {
    expect(
      toMember({ bioguideId: 'A000001', terms: [{ termType: 'rep', endDate: '1953-01-03' }] }, TODAY)
    ).toBeNull();
  });
});

describe('matchesSearch', () => {
  const norton = member({ name: 'Eleanor Holmes Norton', state: 'DC', district: 0 });
  const hernandez = member({ name: 'Pablo José Hernández', state: 'PR', district: 0 });

  it('matches part of a name, ignoring case and accents', () => {
    expect(matchesSearch(norton, 'holmes')).toBe(true);
    expect(matchesSearch(hernandez, 'jose hernandez')).toBe(true);
  });

  it('matches a state name or two-letter code', () => {
    expect(matchesSearch(norton, 'columbia')).toBe(true);
    expect(matchesSearch(norton, 'dc')).toBe(true);
    expect(matchesSearch(member({ state: 'TX' }), 'Texas')).toBe(true);
  });

  it('matches everything for an empty query, and nothing unrelated', () => {
    expect(matchesSearch(norton, '  ')).toBe(true);
    expect(matchesSearch(norton, 'wyoming')).toBe(false);
  });
});

describe('groupByChamber', () => {
  it('puts the Senate first, sorts by state name, then last name or district', () => {
    const sections = groupByChamber([
      member({ bioguideId: 'h2', chamber: 'house', state: 'AL', district: 2 }),
      member({ bioguideId: 's2', chamber: 'senate', state: 'WY', lastName: 'Lummis', district: null }),
      member({ bioguideId: 'h1', chamber: 'house', state: 'AL', district: 1 }),
      member({ bioguideId: 's1', chamber: 'senate', state: 'WY', lastName: 'Barrasso', district: null }),
      member({ bioguideId: 'h3', chamber: 'house', state: 'AK', district: 0 }),
    ]);
    expect(sections.map((s) => s.title)).toEqual(['Senate', 'House']);
    expect(sections[0].data.map((m) => m.bioguideId)).toEqual(['s1', 's2']);
    // Alabama before Alaska (by name), then by district.
    expect(sections[1].data.map((m) => m.bioguideId)).toEqual(['h1', 'h2', 'h3']);
  });

  it('leaves out an empty chamber', () => {
    expect(groupByChamber([member({ chamber: 'house' })]).map((s) => s.title)).toEqual(['House']);
  });
});
