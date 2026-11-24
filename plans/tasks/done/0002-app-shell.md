# Task 0002: Clear out the starter template and add a basic app shell

**Branch**: `0002-app-shell`
**Depends on**: 0001
**Source**: Milestone 1
**PR**: link this task file in the PR description

## What to build

Replace Expo's starter demo with the app's own structure, so later screens land in a
consistent place: the navigation layout, the home route (the current Congress, started in
task 0001 and finished in task 0003), a member route for task 0004, and shared building
blocks for loading and error states. The home route is the Congress list for now; this
may change later.

## AFK tasks

- [x] Remove the starter template's demo screens, components, and assets that won't be used (one commit, so the cleanup is easy to review). Keep the home screen from task 0001, which task 0003 builds on.
- [x] Set up Expo Router routes: `/` (current Congress) and `/member/[bioguideId]`.
- [x] Shared components: loading indicator, error message with retry, empty state.
- [x] Basic theme tokens with light and dark mode. Party is never shown by colour alone.
- [x] In `app.json`: display name `GovQL`, `ios.bundleIdentifier` `com.chasephilpot.govqlmobile`, `ios.supportsTablet: false`; keep `userInterfaceStyle: "automatic"` (light + dark).
- [x] Add the standard `eas.json` (development / preview / production profiles, remote app versioning).
- [x] Lint and typecheck pass.

## Human-in-the-loop tasks

- [ ] [verify] The app opens to the home route on a phone and a simulator, in light and dark mode.

## Decisions

- **Bundle ID** `com.chasephilpot.govqlmobile`, display name `GovQL` (2026-11-24).
- **Theme**: follow the system setting, with light and dark tokens (2026-11-24).
- **Home route**: the current-Congress list (2026-11-24), subject to change.

## Acceptance criteria

- [x] No starter-template demo code remains.
- [x] Both routes exist and navigate, ready for tasks 0003 and 0004.
- [x] The home route still shows the current-members list from task 0001.

## Log

- 2026-11-24: Replaced the starter's tab bar with a **stack**: with Explore gone there was
  one tab, and members open as pushed screens. Lists use
  `contentInsetAdjustmentBehavior="automatic"` because iOS 26 stack headers are transparent.
- 2026-11-24: The member route is a placeholder that reads the member from the cached
  current-members list (no extra request). Task 0004 adds recent votes.
- 2026-11-24: Kept for later: the app icon and splash images are still Expo's (`app.json`
  needs them until branding exists), and unused starter packages (`expo-symbols`,
  `expo-device`, `expo-glass-effect`, `@expo/ui`, `expo-web-browser`) are still installed.
- 2026-11-24: Not decided yet: which Expo account (personal or company) owns the app.
  Needed before the first `eas init` / EAS build.
- 2026-11-24: Typed routes come from `.expo/types`, which the dev server regenerates. A
  stale copy gives false typecheck errors locally until `npx expo start` runs.
