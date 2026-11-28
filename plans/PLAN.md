# Plan: GovQL Mobile

> Source: GitHub proposal issue `govql/govql#<n>` (mobile app) · design discussion 2026-11.

This is the project's master plan: a durable architectural header plus an ordered
list of task pointers. Each task is one feature on its own branch, ending in a PR.
Task bodies live in `plans/tasks/`; finished tasks move to `plans/tasks/done/`.

The format mirrors `govql/govql`'s `plans/PLAN.md`, so the two repos work the same way
for humans and coding agents alike. This file is pointed to from `AGENTS.md`
("Active plan").

## Goal

Answer one question for everyday voters: **"How do my members of Congress vote?"**
Every feature should serve that question.

**Data scope**: milestone 1 covers only the **current (119th) Congress and currently
serving members**, including the non-voting delegates. The API holds every member since
1789 and votes since 1989, so every query must filter to current members. How far back
later features go (e.g. the 109th Congress, 2005) is decided when one needs it.

Out of scope until the first milestone ships:
user accounts, AI-generated text, committee pages, and any change to how GovQL ingests data.

## Workflow

- New work is a self-contained task file `plans/tasks/NNNN-<slug>.md` plus a pointer
  below. No GitHub issues: branch names follow `NNNN-<slug>` (the task file's name), and
  each PR description links its task file.
- One task at a time: branch from the latest `main`, open a PR, and merge it before
  starting a task that depends on it. Mark the pointer `[x]` and move the task file to
  `done/` in that same PR.
- A pointer has five states: `[ ]` todo · `[~]` in progress · `[>]` PR open ·
  `[x]` merged to `main` · `[-]` paused (skip when picking the next task).
- Pointers list direct prerequisites as `(after NNNN, …)`. A task is ready only once every listed prerequisite is `[x]`.

## Architectural decisions

Durable decisions that apply across all tasks:

- **GraphQL client**: urql. Screens never call it directly; each query has its own hook
  in `src/hooks/`, so the client could be swapped by editing only the hooks.
- **Stack**: Expo SDK 58 (React Native 0.88), Expo Router, TypeScript (strict), Node 24
  (pinned in `.nvmrc`). Install native packages with `npx expo install`, not `npm install`,
  so versions match the SDK. Prefer the official SDK 58 docs; older tutorials may not apply.
- **The API is someone else's repo**: all data comes from the public GovQL GraphQL API
  (`EXPO_PUBLIC_API_URL`, default `https://api.govql.us/graphql`), owned by `govql/govql`.
  This app never talks to the database. Anything the app needs that the API lacks is a
  separate issue and PR in `govql/govql`.
- **Typed queries via codegen**: GraphQL Code Generator (client preset) reads the live API
  schema and the app's queries and writes types to `src/gql/`. Generated files are
  committed and never edited by hand. CI regenerates and type-checks on every PR **and on
  a daily schedule**, because the API can change without any commit to this repo.
- **No secrets in the app**: everything shipped in the app is public. Only `EXPO_PUBLIC_*`
  non-secret settings; `.env` is git-ignored and `.env.example` documents every setting.
- **Neutral presentation**: show records, not judgments. No good/bad scores, the same
  layout for every member, and party colour is never the only way information is shown.
- **Privacy**: no accounts and no server-side user data in the first milestone. Location
  lookups happen from the device, and addresses are never stored or logged.
- **Data facts to design around** (from the `govql/govql` schema):
  - `votes.chamber` is `h` / `s`. Only the Senate votes on nominations.
  - House positions are stored as `Aye`/`No`, Senate as `Yea`/`Nay`, plus `Present`,
    `Not Voting`, impeachment `Guilty`/`Not Guilty`, and named candidates in Speaker
    elections. Group positions by meaning, not by literal text (see the MCP server's
    `get_voting_record` tool).
  - Full bill data exists only for the current congress (119). Older bills are stub rows
    with an ID but no title or summary; screens must handle the missing text.
  - `legislator_terms.district` uses `0` for at-large seats. A member's current seat is
    their latest term whose `end_date` is in the future.
  - The committee tables exist but are empty (nothing ingests them yet).
  - `legislators.official_full` is `null` for many older members. Show it when present
    and fall back to `first_name last_name` otherwise.
  - Delegates (DC, GU, VI, AS, MP) and Puerto Rico's Resident Commissioner are stored as
    House terms (`rep`). Identify them by state code and label them with their title;
    they don't vote on final passage.
- **API limits**: the API rate-limits by IP (100 requests/minute). Keep requests per screen
  low and cache on the device. Shared mobile IPs make this a known problem to solve before
  any public release (tracked separately).

---

## Tasks

Milestone 1: a thin, end-to-end slice. Browse the current Congress, tap a member, see
their recent votes; then find your own members by address, location, or ZIP.

- [x] 0001 · GraphQL client, codegen, and API-compatibility CI → tasks/done/0001-api-client-and-codegen.md
- [x] 0002 · Clear out the starter template and add a basic app shell (after 0001) → tasks/done/0002-app-shell.md
- [x] 0003 · Browse the current Congress (home screen) (after 0001, 0002) → tasks/done/0003-browse-congress.md
- [x] 0004 · Member screen with recent votes (after 0002, 0003) → tasks/done/0004-member-recent-votes.md
- [x] 0005 · Find my members: address or current location (after 0003) → tasks/done/0005-find-my-members.md
- [x] 0006 · ZIP code entry with district disambiguation (after 0005) → tasks/done/0006-zip-lookup.md
- [x] 0007 · Keep data across app restarts (after 0003, 0004) → tasks/done/0007-persist-cache.md
