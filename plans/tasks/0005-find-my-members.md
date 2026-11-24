# Task 0005: Find my members (address or current location)

**Branch**: `0005-find-my-members`
**Depends on**: 0003
**Source**: Milestone 1
**PR**: link this task file in the PR description

## What to build

A "Find my members" entry on the home screen: the user enters where they live, and the
app shows their two senators and their House member, each opening the task 0004 member
screen. The lookup turns a location into a state and
congressional district, then queries GovQL for the members currently serving it.

## Design notes

- **Input methods (decided 2026-11-24)**: this task does a **street address** field and a
  **"Use my location"** button. ZIP entry is task 0006. A ZIP code is not enough on its
  own, because many span more than one district.
- **Geocoding**: the U.S. Census Bureau Geocoder (free, no key) returns the congressional
  district for an address (`/geographies/onelineaddress`) and for coordinates
  (`/geographies/coordinates`). "Use my location" gets the coordinates from
  `expo-location` (foreground permission only, with a clear iOS permission message), then
  calls the coordinates endpoint. Never store or log the coordinates either.
  `expo-location` needs a development build if Expo Go can't run it. Call it from the device; never send the address
  to GovQL or store it. Confirm which district vintage it returns, since districts change
  after redistricting.
- **Senators** come from the state alone. Six states (AK, DE, ND, SD, VT, WY) have a single
  at-large House member, stored as `district = 0`.
- **Current members**: a term is current when its `end_date` is in the future. Draft query,
  modelled on the MCP server's `find_legislator` tool (verify in the API explorer):

  ```graphql
  query MyMembers($filter: LegislatorFilter) {
    allLegislators(filter: $filter) {
      nodes {
        bioguideId
        officialFull
        legislatorTermsByBioguideIdList(orderBy: END_DATE_DESC, first: 1) {
          termType party state district endDate
        }
      }
    }
  }
  ```

  with a filter on `legislatorTermsByBioguideId: { some: { state, endDate > today, … } }`.
- Remember the user's location on the device (not on a server) so they don't re-enter it
  each launch.

## AFK tasks

- [ ] Location module: address or coordinates → Census Geocoder → `{ state, district }`, with typed errors for "not found", "ambiguous", "permission denied", and "network". Design its input type so task 0006 can add ZIP without reshaping it.
- [ ] "Use my location" button via `npx expo install expo-location`; permission message set through its config plugin in `app.json`.
- [ ] Members query (above) using generated types, through a `useMyMembers()` hook; return two senators plus one House member. Reuse the 0003 helpers for names, seat labels, and current terms. For DC and the territories, show the delegate and explain there are no senators.
- [ ] Screen: input, loading state, error states, and the three member cards (name, chamber, party, state/district).
- [ ] Persist the last location on the device; offer "change location".
- [ ] Unit tests for the location module (stubbed HTTP), including the at-large and DC cases.

## Human-in-the-loop tasks

- [ ] [verify] Try your own address, an at-large state (e.g. Wyoming), a DC address, and "Use my location" on a physical phone (allow it once, and deny it once).

## Acceptance criteria

- [ ] A valid state address shows exactly two senators and one House member, all currently serving; a DC or territory address shows its delegate.
- [ ] Ambiguous, unknown, and offline cases each show a clear message instead of failing silently.
- [ ] No address is sent to GovQL, stored remotely, or written to logs.
