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

- [ ] Choose the storage library (check SDK 58 docs); record the choice and reason.
- [ ] Persist and restore the current-members list with `fetchedAt` and a versioned key.
- [ ] Same for each member's recent votes (task 0004).
- [ ] Background refresh when older than the refresh age; pull-to-refresh forces it.
- [ ] Non-blocking "Couldn't refresh" notice when showing saved data after a failed refresh.
- [ ] Unit tests: freshness check, version mismatch discarded, ended terms filtered out of a saved list.

## Human-in-the-loop tasks

- [ ] [verify] Launch, quit, turn on Airplane Mode, relaunch: the list and a previously opened member's votes still show.
- [ ] [verify] With a saved list, pull to refresh while offline: the saved list stays, with the notice.

## Acceptance criteria

- [ ] A relaunch within the refresh age makes no members request.
- [ ] The app shows saved data offline, and never shows a member whose term has ended.
- [ ] Nothing about the user (address, location) is written by this task.
