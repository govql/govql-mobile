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

- [ ] Remove the starter template's demo screens, components, and assets that won't be used (one commit, so the cleanup is easy to review). Keep the home screen from task 0001, which task 0003 builds on.
- [ ] Set up Expo Router routes: `/` (current Congress) and `/member/[bioguideId]`.
- [ ] Shared components: loading indicator, error message with retry, empty state.
- [ ] Basic theme tokens with light and dark mode. Party is never shown by colour alone.
- [ ] In `app.json`: display name `GovQL`, `ios.bundleIdentifier` `com.chasephilpot.govqlmobile`, `ios.supportsTablet: false`; keep `userInterfaceStyle: "automatic"` (light + dark).
- [ ] Add the standard `eas.json` (development / preview / production profiles, remote app versioning).
- [ ] Lint and typecheck pass.

## Human-in-the-loop tasks

- [ ] [verify] The app opens to the home route on a phone and a simulator, in light and dark mode.

## Decisions

- **Bundle ID** `com.chasephilpot.govqlmobile`, display name `GovQL` (2026-11-24).
- **Theme**: follow the system setting, with light and dark tokens (2026-11-24).
- **Home route**: the current-Congress list (2026-11-24), subject to change.

## Acceptance criteria

- [ ] No starter-template demo code remains.
- [ ] Both routes exist and navigate, ready for tasks 0003 and 0004.
- [ ] The home route still shows the current-members list from task 0001.
