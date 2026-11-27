# Task 0006: ZIP code entry with district disambiguation

**Branch**: `0006-zip-lookup`
**Depends on**: 0005
**Source**: Milestone 1
**PR**: link this task file in the PR description

## What to build

A third way to find your members, next to the address field and "Use my location" from
task 0005: type a 5-digit ZIP. If the ZIP lies in one congressional district, show the
members right away. If it spans several, ask the user to pick one, or to enter an address
or use their location to settle it.

## Decisions (2026-11-25)

- **The table must match the members shown (same rule as 0005)**: the table records its
  Congress. When the members in office are from a different Congress, ZIP entry says it
  isn't updated for the new districts yet and points to the address or location instead.
  It never falls back to old districts. Rebuild the table when Census publishes the new
  file.
- **Multi-district ZIPs list every district** the ZIP touches, each with its
  representative's name, plus "Not sure? Enter your street address." No percentages, no
  "likely" district: the file has land area but not population, and land area misleads in
  cities. Drop only zero-land parts (when the ZIP has land elsewhere) and Census's `ZZ`
  parts (water, not a district).
- **One field**: the address field also accepts a ZIP (5 digits, or ZIP+4, of which only
  the first 5 are used), rather than adding a second text field.
- **Format**: a generated TypeScript file holding one string, parsed into a lookup on first
  use, so `tsc` doesn't have to type a 33,000-key JSON object.

## Census relationship file facts (checked 2026-11-25)

- 119th: `https://www2.census.gov/geo/docs/maps-data/data/rel2020/cd-sld/tab20_cd11920_zcta520_natl.txt`
  (6.2 MB, pipe-delimited, last modified 2024-10-24). No 120th file published yet; only
  118th and 119th exist in that folder.
- 33,791 ZCTAs; 5,882 (17%) touch more than one district. Columns used:
  `GEOID_CD119_20` (state FIPS + district: `00` at-large, `98` delegate, `ZZ` water),
  `GEOID_ZCTA5_20`, `AREALAND_PART`. Rows with an empty ZCTA are district parts outside
  any ZCTA; skip them.
- Example gaps: 20500 (White House) has no ZCTA. Territories are included (e.g. 96910 Guam,
  00601 Puerto Rico).

## Design notes

- **The Census Geocoder can't look up a ZIP code.** Instead, ship the Census
  ZCTA-to-congressional-district relationship file for the current (119th) congress,
  turned into a compact JSON lookup bundled with the app. The lookup happens entirely on
  the device, with no network call and nothing sent anywhere.
- **ZCTAs are not exactly USPS ZIP codes.** Some ZIPs (PO boxes, single buildings) have
  no ZCTA. Treat these as "not found" and point the user to the address field.
- **Picking a district**: list the districts as "STATE-district" (e.g. "TX-7"). Don't
  claim one is more likely unless the file gives a basis for it (e.g. land-area share).
- **Redistricting**: record the file's source and congress in a header, and add a script
  to rebuild it, so it can be refreshed when districts change.
- Reuse the 0005 location module: ZIP becomes another input to it, producing the same
  `{ state, district }` result.

## AFK tasks

- [x] Script (in `scripts/`) that downloads the relationship file and writes the compact lookup; commit the output.
- [x] Add ZIP support to the location module, including the "ambiguous" and "not found" results.
- [x] Add the ZIP field and the district picker to the "Find my members" screen.
- [x] Unit tests: a single-district ZIP, a multi-district ZIP, an at-large state, an unknown ZIP.
- [x] Check how much the data file adds to the app bundle; record it in this file's log.

## Human-in-the-loop tasks

- [x] [verify] Try your own ZIP, a ZIP known to span two districts, and a Wyoming ZIP.

## Acceptance criteria

- [x] A single-district ZIP shows the members with no extra step.
- [x] A multi-district ZIP always asks the user, and never guesses silently.
- [x] The ZIP lookup itself works offline (the GovQL members query still needs a connection).

## Log

- 2026-11-25: Built from the 119th file: 33,791 ZIPs, 5,829 in more than one district once
  zero-land and water (`ZZ`) parts are dropped (5,882 before). `src/data/zip-districts.ts`
  is 340 KB (84 KB gzipped). In the iOS Hermes bundle (`npx expo export --platform ios`)
  the table takes about 340 KB of 3.1 MB.
- 2026-11-25: No 120th Congress relationship file published yet. From January 3, 2027,
  ZIP entry will show "not updated for the new districts" until the table is rebuilt with
  `npm run build:zip-districts -- --congress 120`.
- 2026-11-25: Checked in the iOS Simulator: own ZIP, 77002 (lists TX-7 and TX-18), 82001
  (Wyoming at-large), 20500 (not found), a full street address, and a ZIP lookup with
  Wi-Fi off after the members list had loaded (works). Not checked on a physical phone
  or a small screen.
