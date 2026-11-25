import { describe, expect, it } from '@jest/globals';

import { formatVoteDate, positionLabel, positionMeaning } from '../votes';

describe('positionMeaning', () => {
  it.each([
    ['Yea', 'yes'],
    ['Aye', 'yes'],
    ['Guilty', 'yes'],
    ['Nay', 'no'],
    ['No', 'no'],
    ['Not Guilty', 'no'],
    ['Present', 'present'],
    ['Not Voting', 'notVoting'],
  ] as const)('%s means %s', (position, meaning) => {
    expect(positionMeaning(position)).toBe(meaning);
  });

  it('treats a named candidate (Speaker election) as other', () => {
    expect(positionMeaning('Jeffries')).toBe('other');
  });

  it('treats a missing position as not voting', () => {
    expect(positionMeaning(null)).toBe('notVoting');
    expect(positionMeaning(undefined)).toBe('notVoting');
  });
});

describe('positionLabel', () => {
  it('shows House and Senate wording the same way', () => {
    expect(positionLabel('Yea')).toBe('Yes');
    expect(positionLabel('Aye')).toBe('Yes');
    expect(positionLabel('Nay')).toBe('No');
    expect(positionLabel('No')).toBe('No');
  });

  it('keeps Present, and spells out Not Voting', () => {
    expect(positionLabel('Present')).toBe('Present');
    expect(positionLabel('Not Voting')).toBe('Did not vote');
  });

  it('keeps impeachment verdicts and candidate names as stored', () => {
    expect(positionLabel('Guilty')).toBe('Guilty');
    expect(positionLabel('Not Guilty')).toBe('Not Guilty');
    expect(positionLabel('Johnson (LA)')).toBe('Voted for Johnson (LA)');
  });
});

describe('formatVoteDate', () => {
  it('formats the date in Washington, D.C.', () => {
    expect(formatVoteDate('2026-11-20T21:49:00.000000+00:00')).toBe('Nov 20, 2026');
    // 02:30 UTC on Nov 21 is still the evening of Nov 20 in Washington.
    expect(formatVoteDate('2026-11-21T02:30:00+00:00')).toBe('Nov 20, 2026');
  });

  it('handles missing or invalid dates', () => {
    expect(formatVoteDate(null)).toBe('Date unknown');
    expect(formatVoteDate('not a date')).toBe('Date unknown');
  });
});
