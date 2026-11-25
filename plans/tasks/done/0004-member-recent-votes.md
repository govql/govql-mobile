# Task 0004: Member screen with recent votes

**Branch**: `0004-member-recent-votes`
**Depends on**: 0002, 0003
**Source**: Milestone 1
**PR**: link this task file in the PR description

## What to build

Tapping a member (from the Congress list in task 0003, and later from "my members" in
task 0005) opens their screen: who they are, and their 10 most recent roll-call votes,
each with the question, the result, the date, and how this member voted.

Delegates and the Resident Commissioner can't vote on final passage, so their list may be
short or empty. The empty state must say why rather than imply they skipped votes.

## Design notes

- **Ordering by vote date**: `vote_positions` has no date of its own, so query `votes`
  ordered by date and filtered to votes this member took part in. Draft (verify in the
  API explorer; relation and filter names come from PostGraphile and may differ):

  ```graphql
  query RecentVotes($id: String!) {
    allVotes(
      filter: { votePositionsByVoteId: { some: { bioguideId: { equalTo: $id } } } }
      orderBy: VOTED_AT_DESC
      first: 10
    ) {
      nodes {
        voteId votedAt question result category
        votePositionsByVoteId(condition: { bioguideId: $id }) { nodes { position } }
      }
    }
  }
  ```

  Check the query's speed: `vote_positions` has millions of rows. If it's slow, raise an
  issue in `govql/govql` rather than working around it in the app.
- **Positions by meaning**: show "Aye" and "Yea" both as a yes vote, "No" and "Nay" as a
  no, and keep `Present` and `Not Voting` distinct. Follow the MCP server's
  `get_voting_record` mapping so the app and the MCP tools agree.
- **Neutral wording**: a "No" on a motion to recommit is not the same as opposing the
  bill. Show the vote's own `question` text rather than paraphrasing it.
- Link each vote to its official `source_url`.

## AFK tasks

- [x] Member header: name, chamber, party, state/district (reuse the 0003 helpers for name and seat label).
- [x] Recent-votes query with generated types, plus a position-to-meaning helper with unit tests covering every known value.
- [x] Vote rows: date, question, result, this member's position.
- [x] Loading, empty ("no recorded votes"), and error states.
- [x] Pull to refresh.

## Human-in-the-loop tasks

- [x] [verify] Compare one senator's and one representative's recent votes against the official Senate and House Clerk sites.
- [-] [verify] Note the query time from the device. Not recorded on the device; see the command-line timing in the log.

## Acceptance criteria

- [x] Each member screen shows that member's 10 most recent votes, newest first, matching the official record.
- [x] House and Senate position wording is shown consistently.
- [x] The screen makes at most two API requests per visit.

## Log

- 2026-11-25: The draft `RecentVotes` query worked as written. Timed from the command line:
  0.20 s for a senator (B001261), 0.07 s for a House member (F000468). Fast enough; no
  `govql/govql` issue needed.
- 2026-11-25: House votes are stored as both `Yea`/`Nay` and `Aye`/`No`, depending on
  the kind of vote, so grouping by meaning is required, not optional.
- 2026-11-25: Position mapping copied from the MCP server's
  `mcp-server/src/govql_mcp_server/tools/get_voting_record.py` (`_POS_KEY`): yes =
  Yea/Aye/Guilty, no = Nay/No/Not Guilty, Present, Not Voting, anything else = other.
  If that file changes, update `src/lib/votes.ts` to match.
- 2026-11-25: The member screen makes one request per visit (votes); the member's details
  come from the cached members list. Opening a member directly before the list has loaded
  makes two.
- 2026-11-25: Checked in the iOS Simulator against the official Senate and House Clerk
  records; long nomination questions wrap fully.
