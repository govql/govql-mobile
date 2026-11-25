# Task 0005: Find my members (address or current location)

**Branch**: `0005-find-my-members`
**Depends on**: 0003
**Source**: Milestone 1
**PR**: link this task file in the PR description

## What to build

A "Find my members" entry on the home screen: the user enters where they live, and the
app shows their two senators and their House member, each opening the task 0004 member
screen. The lookup turns a location into a state and congressional district, then picks
the members serving it from the current-members list the app already has.

## Decisions (2026-11-25)

- **Three ways in**: street address and "Use my location" (main), plus a smaller
  **"Choose my state and district"** fallback: pick a state, then a district from a list
  that shows each district's representative by name. The fallback works offline, needs no
  address or permission, and helps when geocoding fails. Most people don't know their
  district number, and districts get redrawn, so it is not the main path.
- **No new GovQL query**: members come from filtering the cached current-members list by
  state and district. Zero extra requests, and nothing location-related goes near GovQL.
- **District map must match the members shown (option B)**: the Census Geocoder's default
  vintage (`Current_Current`) returns the *next* Congress's districts after an election
  (on 2026-11-25 it returned the 120th; members in office are the 119th, and states such
  as Texas redrew for 2026). The app takes the target Congress from the current House
  members' term start dates in GovQL's data, then uses the Census vintage whose layer
  ("119th Congressional Districts") matches it, trying `Current_Current` first and then
  recent `ACS<year>_Current` vintages. Never assume; check the layer name.
- **Store only `{ state, district, congress }`**, never the address or coordinates. If
  the saved Congress differs from the current one, ask the user to check their district
  again (it may have been redrawn).
- **Storage**: `expo-sqlite`'s key-value store (`expo-sqlite/kv-store`): in Expo Go, has a
  synchronous read (the saved district is ready on first render), and task 0007 can reuse
  it. Alternatives considered: AsyncStorage (async only), SecureStore (meant for secrets),
  MMKV (not in Expo Go).

## Census Geocoder facts (checked 2026-11-25)

- `GET https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=…&benchmark=Public_AR_Current&vintage=…&format=json`
  and `/geographies/coordinates?x=<lon>&y=<lat>&…`. 0.2–0.3 s; no key.
- Address results: `result.addressMatches[]` (0 = not found, >1 = ambiguous); coordinate
  results: `result.geographies`. State code: `geographies.States[0].STUSAB`. District:
  the `"<N>th Congressional Districts"` layer's `GEOID` (state FIPS + 2 digits): `00` =
  at-large (e.g. WY `5600`), `98` = delegate (DC `1198`).
- Vintages: `Current_Current` (newest maps), `ACS2025_Current` (119th),
  `Census2020_Current` (116th), etc.

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

- [x] Location module: address or coordinates → Census Geocoder → `{ state, district }`, with typed errors for "not found", "ambiguous", "permission denied", and "network". Design its input type so task 0006 can add ZIP without reshaping it.
- [x] "Use my location" button via `npx expo install expo-location`; permission message set through its config plugin in `app.json`.
- [x] Pick the members from the cached current-members list (no new query): two senators plus one House member. Reuse the 0003 helpers for names, seat labels, and current terms. For DC and the territories, show the delegate and explain there are no senators.
- [x] Target Congress from GovQL's House term start dates; choose the Census vintage whose district layer matches it.
- [x] "Choose my state and district" fallback: state list, then districts with representatives' names.
- [x] Screen: input, loading state, error states, and the three member cards (name, chamber, party, state/district).
- [x] Persist the last location on the device; offer "change location".
- [x] Unit tests for the location module (stubbed HTTP), including the at-large and DC cases.

## Human-in-the-loop tasks

- [-] [verify] Try your own address, an at-large state (e.g. Wyoming), a DC address, and "Use my location" on a physical phone (allow it once, and deny it once). Checked in the iOS Simulator only; the physical phone is blocked on the Expo Go sign-in.

## Acceptance criteria

- [x] A valid state address shows exactly two senators and one House member, all currently serving; a DC or territory address shows its delegate.
- [x] Ambiguous, unknown, and offline cases each show a clear message instead of failing silently.
- [x] No address is sent to GovQL, stored remotely, or written to logs.

## Log

- 2026-11-25: The Census Geocoder's `Current_Current` vintage already returns the 120th
  Congress's districts, while the members in office are the 119th. Fixed by matching the
  vintage's district layer to the Congress taken from GovQL's House term start dates
  (option B above). When the 120th Congress is sworn in, `Current_Current` will match
  again with no code change.
- 2026-11-25: Saved with `expo-sqlite/kv-store` under the key `myDistrict:v1`; only
  `{ state, district, congress }` is kept. Task 0007 can reuse the same store.
- 2026-11-25: Known gap: vacant House seats (2 at the time of writing) have no member, so
  they don't appear in the "Choose my district" list. The address and location lookups
  still find them and show "This seat is currently vacant."
- 2026-11-25: Checked in the iOS Simulator: address lookup, "Use my location" (the
  Simulator's default San Francisco location returned Pelosi's district), and the
  state-and-district picker. Not checked on a physical phone (Expo Go sign-in) or on a
  small screen.
