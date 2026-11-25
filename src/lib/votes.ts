// Plain helpers for roll-call votes: no React, no network. Unit-tested in __tests__/.

/**
 * What a stored position means. Matches the GovQL MCP server's `get_voting_record`
 * (govql/govql, mcp-server/src/govql_mcp_server/tools/get_voting_record.py), so the app
 * and the MCP tools agree:
 *   yes        = Yea (Senate) | Aye (House) | Guilty (impeachment: convict)
 *   no         = Nay (Senate) | No (House)  | Not Guilty (impeachment: acquit)
 *   present / notVoting = as stored
 *   other      = anything else, e.g. a named candidate in a Speaker election. Still a vote cast.
 */
export type PositionMeaning = 'yes' | 'no' | 'present' | 'notVoting' | 'other';

const MEANINGS: Record<string, PositionMeaning> = {
  Yea: 'yes',
  Aye: 'yes',
  Guilty: 'yes',
  Nay: 'no',
  No: 'no',
  'Not Guilty': 'no',
  Present: 'present',
  'Not Voting': 'notVoting',
};

export function positionMeaning(position: string | null | undefined): PositionMeaning {
  if (!position) return 'notVoting';
  return MEANINGS[position] ?? 'other';
}

/**
 * How a position is shown. Yea/Aye read as "Yes" and Nay/No as "No", so House and Senate
 * read the same. Impeachment verdicts and Speaker-election names are shown as stored,
 * since "Yes"/"No" would lose their meaning.
 */
export function positionLabel(position: string | null | undefined): string {
  if (position === 'Guilty' || position === 'Not Guilty') return position;
  switch (positionMeaning(position)) {
    case 'yes':
      return 'Yes';
    case 'no':
      return 'No';
    case 'present':
      return 'Present';
    case 'notVoting':
      return 'Did not vote';
    case 'other':
      return `Voted for ${position}`;
  }
}

/** "Nov 20, 2026", using the date in Washington, D.C., where the vote happened. */
export function formatVoteDate(votedAt: string | null | undefined): string {
  if (!votedAt) return 'Date unknown';
  const date = new Date(votedAt);
  if (Number.isNaN(date.getTime())) return 'Date unknown';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
}
