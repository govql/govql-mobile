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

- [ ] Script (in `scripts/`) that downloads the relationship file and writes the compact lookup; commit the output.
- [ ] Add ZIP support to the location module, including the "ambiguous" and "not found" results.
- [ ] Add the ZIP field and the district picker to the "Find my members" screen.
- [ ] Unit tests: a single-district ZIP, a multi-district ZIP, an at-large state, an unknown ZIP.
- [ ] Check how much the data file adds to the app bundle; record it in this file's log.

## Human-in-the-loop tasks

- [ ] [verify] Try your own ZIP, a ZIP known to span two districts, and a Wyoming ZIP.

## Acceptance criteria

- [ ] A single-district ZIP shows the members with no extra step.
- [ ] A multi-district ZIP always asks the user, and never guesses silently.
- [ ] The ZIP lookup itself works offline (the GovQL members query still needs a connection).
