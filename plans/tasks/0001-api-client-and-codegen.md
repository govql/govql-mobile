# Task 0001: GraphQL client, codegen, and API-compatibility CI

**Branch**: `0001-api-client-and-codegen`
**Depends on**: none
**Source**: Milestone 1
**PR**: link this task file in the PR description

## What to build

The plumbing every screen relies on: a GraphQL client pointed at `EXPO_PUBLIC_API_URL`,
typed queries generated from the live API schema, and CI that fails when the API changes
in a way that breaks the app's queries. Prove it end to end with one real query: a plain
list of the currently serving members of Congress on the home route, which tasks 0002
and 0003 build on rather than replace.

## AFK tasks

- [ ] Install urql (see Decisions).
- [ ] Create the client module reading `process.env.EXPO_PUBLIC_API_URL`; fail loudly at startup if it is unset.
- [ ] Screens never call urql directly. Each query gets its own hook in `src/hooks/` (e.g. `useCurrentMembers()`) that returns app-shaped data (`{ members, loading, error, refetch }`), so switching clients later would mean editing only the hooks.
- [ ] Install `@graphql-codegen/cli` and `@graphql-codegen/client-preset`; add `codegen.ts` (schema = the live API, documents = the app's queries, output = `src/gql/`).
- [ ] Add npm scripts: `codegen`, `typecheck` (`tsc --noEmit`), `lint`.
- [ ] Add a current-members query and render it as a plain list (name, chamber, party, state/district) on the home route (`src/app/index.tsx`, replacing the starter home content). Task 0003 turns it into the finished home screen. Draft (verify the filter names in the API explorer; they come from PostGraphile):

  ```graphql
  query CurrentMembers($today: Date!) {
    allLegislators(
      filter: { legislatorTermsByBioguideId: { some: { endDate: { greaterThan: $today } } } }
    ) {
      totalCount
      nodes {
        bioguideId officialFull firstName lastName
        legislatorTermsByBioguideIdList(orderBy: END_DATE_DESC, first: 1) {
          termType party state district endDate
        }
      }
    }
  }
  ```

  Expect `totalCount` of about 541 (435 House + 100 Senate + 6 delegates), give or take vacancies.
- [ ] Add `.github/workflows/api-compat.yml`: runs on pull requests, pushes to `main`, a daily `schedule`, and `workflow_dispatch`. Steps: checkout, setup-node with `node-version-file: .nvmrc`, `npm ci`, `npm run codegen`, `npm run typecheck`, `git diff --exit-code src/gql`.
- [ ] Add `CLAUDE.md` containing only "See AGENTS.md", and document the `codegen` workflow in `AGENTS.md`.

## Human-in-the-loop tasks

- [ ] [verify] The list shows real current members in the iOS Simulator (`npx expo start`, press `i`) and on a physical phone in Expo Go (same Wi-Fi, or `--tunnel`). Needs `.env` copied from `.env.example`.
- [ ] [verify] Rename a field in the smoke query to something that doesn't exist; confirm the CI job fails with a clear error, then revert.
- [ ] [verify] Confirm GitHub notifications will email you when a scheduled run fails.

## Acceptance criteria

- [ ] The current-members query goes from the app to the API and back, with generated types, and shows only currently serving members.
- [ ] `src/gql/` is committed and regenerates with no diff.
- [ ] The compatibility workflow runs on PRs and daily, and fails on a broken query.

## Decisions

- **urql, not Apollo** (2026-11-24). The app only reads data (no accounts, no writes in
  milestone 1), and urql is smaller and simpler. Codegen's typed documents work with
  both libraries, and every query goes through its own hook, so switching later means
  editing only those hooks and the provider. If screens later need a shared,
  self-updating cache, urql's Graphcache add-on provides one without changing libraries.

## Log

- 2026-11-24: An unfiltered `allLegislators(first: 3)` returns members from 1817–1951
  with `officialFull: null`, because the API holds every member since 1789. Hence the
  current-members filter above.
