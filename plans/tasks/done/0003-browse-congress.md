# Task 0003: Browse the current Congress (home screen)

**Branch**: `0003-browse-congress`
**Depends on**: 0001, 0002
**Source**: Milestone 1
**PR**: link this task file in the PR description

## What to build

The home screen: every currently serving member of Congress, in House and Senate
sections, searchable by name or state. Tapping a member opens their screen (task 0004).
This makes members reachable without a location lookup, so voting records can be built
and tested before task 0005.

## Design notes

- **One request**: fetch all current members (about 541) with task 0001's
  `CurrentMembers` query, cached in memory by urql (one request per app launch; moving
  between screens makes none). Keeping it across restarts is task 0007. Search and
  sectioning happen on the device, with no request per keystroke.
- **Rows**: name (`officialFull`, falling back to `firstName lastName`), chamber, party,
  state, and district. Party is spelled out in text, never shown by colour alone.
- **Delegates are included**: DC, Guam, the U.S. Virgin Islands, American Samoa, and the
  Northern Mariana Islands each have a Delegate, and Puerto Rico has a Resident
  Commissioner. They are stored as House terms (`termType` `rep`) with `district: 0`,
  the same as at-large seats, so check the state code **before** treating 0 as at-large
  (`seatLabel()` in `src/lib/members.ts` does this), and label them with their title. They can vote in committee but not on final
  passage, so don't compare their vote counts with other members'.
- **At-large seats** (`district = 0`) show as "At-large", not "District 0".
- **Ordering**: alphabetical by state, then by district (House) or by last name (Senate).
  No ranking or sorting by any score.
- Use a virtualized list (`FlatList` / `SectionList`) since there are hundreds of rows.

## AFK tasks

- [x] Home screen using `useCurrentMembers()`: House and Senate sections.
- [x] Search box filtering by name or state (full name and two-letter code).
- [x] Row component, with the delegate and at-large labels.
- [x] Helpers with unit tests: display name, seat label (district / at-large / delegate title), current-term selection.
- [x] Loading, error-with-retry, and "no matches" states; pull to refresh.
- [x] Tap a row → `/member/[bioguideId]`.

## Human-in-the-loop tasks

- [x] [verify] Counts look right: Senate 100, House 439 (433 voting seats, 2 vacancies, 6 delegates).
- [-] [verify] Spot-check a few members against congress.gov. Not done.
- [x] [verify] Search works for a name, a state name, and a state code, and tapping a row opens the member (iOS Simulator). Small-screen (SE) check skipped at the owner's request.

## Log

- 2026-11-25: The list is cached in memory only (one request per launch); keeping it
  across restarts moved to task 0007.
- 2026-11-25: Added Jest (`jest-expo`, Jest 30 as SDK 58 requires) and an `npm test` step
  in CI. `@parcel/watcher`'s install script is left unapproved; only codegen's watch mode
  uses it.

## Acceptance criteria

- [x] The home screen lists every currently serving member, including delegates, and no former members.
- [x] The screen makes one API request per app launch, and none when returning from a member screen.
- [x] Tapping a member opens the member route.
