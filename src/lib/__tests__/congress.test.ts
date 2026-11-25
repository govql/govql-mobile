import { describe, expect, it } from '@jest/globals';

import { congressForDate, congressOfHouseTerms, ordinal } from '../congress';

describe('congressForDate', () => {
  it.each([
    ['1789-03-04', 1],
    ['2025-01-03', 119],
    ['2026-11-25', 119],
    ['2027-01-02', 119],
    ['2027-01-03', 120],
    ['2028-06-01', 120],
  ])('%s is in the %ith Congress', (date, congress) => {
    expect(congressForDate(date)).toBe(congress);
  });
});

describe('congressOfHouseTerms', () => {
  it('uses the most common Congress, so special-election dates do not matter', () => {
    expect(congressOfHouseTerms(['2025-01-03', '2025-01-03', '2026-04-15', null])).toBe(119);
  });

  it('returns null with no dates', () => {
    expect(congressOfHouseTerms([null])).toBeNull();
  });
});

describe('ordinal', () => {
  it.each([
    [119, '119th'],
    [120, '120th'],
    [121, '121st'],
    [122, '122nd'],
    [123, '123rd'],
    [111, '111th'],
    [112, '112th'],
  ])('%i → %s', (n, text) => {
    expect(ordinal(n)).toBe(text);
  });
});
