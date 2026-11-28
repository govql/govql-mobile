# Task 0007: Keep data across app restarts

**Branch**: `0007-persist-cache`
**Depends on**: 0003, 0004
**Source**: Milestone 1
**PR**: link this task file in the PR description

## What to build

Save the current-members list (and recent votes, from task 0004) on the device, so the app
opens instantly, works offline, and makes fewer API requests. Today urql caches in memory
only, so every launch refetches.

## Why

- The home screen appears instantly on launch, with no spinner.
- Browsing works offline or on a poor connection.
- Fewer requests: the API limits each IP to 100 requests a minute, and phones on mobile
  networks often share IPs (see "API limits" in `PLAN.md`).

## Decisions (2026-11-26)

- **Storage**: `expo-sqlite/kv-store`, as in task 0005. Each key is read from storage once
  per app session, then served from memory (four screens use the members list).
- **What is saved**: each query's raw API result plus `fetchedAt`. Members are re-mapped
  (and every term re-checked against today) on every read.
- **Keys**: `members:<fingerprint>` and `votes:<bioguideId>:<fingerprint>`, where the
  fingerprint is a hash of the query text. Editing a query makes old saved data be ignored
  automatically, with no manual version bump; a shape check guards the rest.
- **Refresh ages**: members 24 hours, votes 1 hour. Whether to skip the network is decided
  once, when a screen opens; pull to refresh always fetches (it un-pauses a paused query
  rather than relying on how urql treats refetching a paused query).
- **Shared hook**: `src/hooks/use-saved-query.ts` wraps urql's `useQuery`; both data hooks
  use it.
- **Votes are never pruned**: about 3 KB per member opened, so about 1.6 MB if every
  member were opened. Fine for now.

## Design notes

- **Show saved data first, then refresh in the background when it's old.** Proposed
  refresh ages: current members after ~24 hours (membership changes a few times a year);
  recent votes after ~1 hour while Congress is in session. Pull-to-refresh always fetches.
- **Storage**: a key-value store available in Expo Go, e.g. AsyncStorage or
  `expo-sqlite`'s key-value store. Check the SDK 58 docs for the recommended option before
  choosing; record the choice here. Alternatively urql's Graphcache with offline support,
  if a normalized cache is wanted by then.
- **Cache keys**: the members query takes `today` as a variable, so its cache key changes
  daily. Store under a fixed key (e.g. `members:v1`) with a `fetchedAt` timestamp, and
  apply the current-term check (`currentTerm()`) when reading, so someone whose term has
  ended disappears even from a saved list.
- **Versioning**: include a version in each key, and discard saved data whose version or
  shape doesn't match after an app update.
- **Failure while showing saved data**: keep the saved list on screen and show a small,
  non-blocking "Couldn't refresh" notice with the saved date, not a full-screen error.
- **Privacy**: only public API data is stored. This task must not store the user's
  address or location (task 0005 decides how location is remembered).
- Size is small (~60 KB for members).

## AFK tasks

- [x] Storage: reuse `expo-sqlite/kv-store`, chosen in task 0005 (in Expo Go, sync read). Revisit only if the data outgrows key-value storage.
- [x] Persist and restore the current-members list with `fetchedAt` and a versioned key.
- [x] Same for each member's recent votes (task 0004).
- [x] Background refresh when older than the refresh age; pull-to-refresh forces it.
- [x] Non-blocking "Couldn't refresh" notice when showing saved data after a failed refresh.
- [x] Unit tests: freshness check, version mismatch discarded, ended terms filtered out of a saved list.

## Human-in-the-loop tasks

- [x] [verify] Launch, quit, turn on Airplane Mode, relaunch: the list and a previously opened member's votes still show.
- [x] [verify] With a saved list, pull to refresh while offline: the saved list stays, with the notice.

## Acceptance criteria

- [x] A relaunch within the refresh age makes no members request.
- [x] The app shows saved data offline, and never shows a member whose term has ended.
- [x] Nothing about the user (address, location) is written by this task.

## Log

- 2026-11-26: Checked in the iOS Simulator with Wi-Fi off: after a reload, the home list
  showed at once with no "Couldn't refresh" notice (so no members request was made), a
  previously opened member's votes showed, and pull to refresh kept the list and showed
  the notice. Turning Wi-Fi back on and refreshing cleared it.
- 2026-11-26: To reload the app while offline, start the dev server with
  `npx expo start --localhost`. By default Expo Go loads the app over the Mac's network
  address, which goes away with Wi-Fi off, so a reload fails before the app runs.
- 2026-11-26: When the saved members list is older than 24 hours, the pull-to-refresh
  spinner shows briefly at launch while it updates in the background.
- 2026-11-26: Not checked on a physical phone or a small screen.
