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

- [ ] Home screen using `useCurrentMembers()`: House and Senate sections.
- [ ] Search box filtering by name or state (full name and two-letter code).
- [ ] Row component, with the delegate and at-large labels.
- [ ] Helpers with unit tests: display name, seat label (district / at-large / delegate title), current-term selection.
- [ ] Loading, error-with-retry, and "no matches" states; pull to refresh.
- [ ] Tap a row → `/member/[bioguideId]`.

## Human-in-the-loop tasks

- [ ] [verify] Counts look right (about 100 senators, 435 representatives, 6 delegates, minus vacancies); spot-check a few members against congress.gov.
- [ ] [verify] Search works for a name, a state name, and a state code, on a small (SE) and a large (Pro Max) simulator.

## Acceptance criteria

- [ ] The home screen lists every currently serving member, including delegates, and no former members.
- [ ] The screen makes one API request per app launch, and none when returning from a member screen.
- [ ] Tapping a member opens the member route.
