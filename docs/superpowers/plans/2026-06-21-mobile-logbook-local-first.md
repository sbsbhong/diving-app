# Mobile Logbook Local-First Implementation Plan

> **For agentic workers:** This is an epic plan. Implement it phase by phase. The detailed checkbox tasks are intentionally deepest for Phase 0 through Phase 2 because those are the next executable implementation units. Later phases define goals and gates without pretending future Supabase/auth details are already settled.

**Goal:** Build a local-first mobile logbook that supports manual logs now, watch-captured log drafts next, and Supabase sync later without rewriting the screen layer.

**Final Goal:** Mobile owns the logbook. Watch contributes measured capture data. Guest users keep data on-device. Signed-in users eventually sync the same log model to Supabase.

**Architecture:** Screens call React Query-backed mobile hooks. Those hooks call a `DiveLogRepository` interface. The first implementation uses `LocalDiveLogRepository`. Future authenticated mode adds a syncing repository that writes locally first and pushes to Supabase through a Supabase-specific repository layer. React Query handles async cache, mutations, invalidation, loading states, and errors; repositories remain the durable data access boundary.

**Verification Stop Rule:** If the same gate fails three times with the same root cause, stop and report the failing command, error summary, attempted fixes, suspected owner or environment dependency, and safest human next action.

---

## Phase 0: Investigation

**Goal:** Confirm exact implementation boundaries and choose the local persistence backend for the first implementation.

**Files to inspect:**

- `apps/mobile/src/states/use-dive-logbook.ts`
- `apps/mobile/src/types/dive-session.ts`
- `apps/mobile/src/utils/import-watch-session.ts`
- `apps/mobile/src/screens/logbook/screen.tsx`
- `apps/mobile/src/screens/home/screen.tsx`
- `apps/mobile/src/components/navigation/index.tsx`
- `apps/mobile/package.json`
- `packages/contracts/schemas/*.schema.json`
- `apps/watch-ios/DiveWatchApp/Models/DiveSession.swift`
- `apps/watch-ios/DiveWatchApp/Storage/DiveSessionStore.swift`

**Implementation notes:**

- [ ] Confirm whether the next implementation should add a new top-level create flow in Logbook, a modal editor, or a pushed screen inside custom navigation.
- [ ] Decide whether local persistence should use a new dependency or a temporary deterministic in-repo adapter.
- [ ] Compare at least two local persistence candidates:
  - Simple key-value JSON storage for the first logbook version.
  - SQLite-style structured storage if query or migration needs are already real.
- [ ] Confirm whether current fixture import should become a repository-level watch import action.
- [ ] Confirm `@tanstack/react-query` is absent or present in `apps/mobile/package.json`, then plan the smallest dependency/provider addition if absent.
- [ ] Confirm the first manual-log field set and which fields can be deferred.
- [ ] Identify all current tests that assume `MobileDiveSession` equals the logbook item.
- [ ] Write the exact first-phase file list before implementation starts.

**Gate:**

```bash
yarn mobile:typecheck
```

**Risk:**

Choosing a local storage library too early can add native setup and migration work before the logbook model is stable. Avoid this unless the first implementation actually needs it.

---

## Phase 1: Domain and Repository Contract

**Goal:** Make the mobile logbook model independent from `WatchSession` while preserving watch payloads.

**Files to create or update:**

- `apps/mobile/src/types/dive-log-entry.ts`
- `apps/mobile/src/repositories/dive-log-repository.ts`
- `apps/mobile/src/repositories/local-dive-log-repository.ts`
- `apps/mobile/src/states/use-dive-logbook-queries.ts`
- `apps/mobile/src/providers.tsx`
- `apps/mobile/src/utils/create-dive-log-entry.ts`
- `apps/mobile/src/utils/watch-session-to-dive-log-entry.ts`
- `apps/mobile/src/states/use-dive-logbook.ts`
- `apps/mobile/src/types/dive-session.ts`
- `apps/mobile/__tests__/dive-log-entry.test.ts`
- `apps/mobile/__tests__/watch-session-to-dive-log-entry.test.ts`

**Implementation notes:**

- [ ] Define `DiveLogSource = 'manual' | 'watch'`.
- [ ] Define `DiveFieldSource = 'manual' | 'mobile' | 'watch'`.
- [ ] Define `DiveLogSyncStatus = 'localOnly' | 'pending' | 'synced' | 'failed'`.
- [ ] Define a stable `DiveLogEntry` with `localId`, optional `remoteId`, optional `ownerUserId`, `source`, `syncStatus`, timestamps, editable manual fields, optional mobile-assisted fields, optional watch capture, and field provenance.
- [ ] Define manual-field types for site, buddy, gear, tags, observed marine life, notes, rating, and optional manually entered measured values.
- [ ] Define watch-capture type that stores the imported `WatchSession` or a lossless normalized equivalent.
- [ ] Add helper to create a blank manual draft.
- [ ] Add helper to convert a `WatchSession` into a watch-sourced `DiveLogEntry`.
- [ ] Ensure watch-captured measured fields are represented as locked/provenance `watch`.
- [ ] Keep generated `packages/contracts/generated/typescript` untouched.
- [ ] Create a repository interface with list/get/save/delete/import watch methods.
- [ ] Add React Query provider wiring at the app provider layer if not already present.
- [ ] Add query keys for logbook list/detail reads.
- [ ] Add React Query hooks for list, detail, save, delete, and watch import mutation.
- [ ] Keep React Query cache as a cache only; local storage and future Supabase remain the durable source of truth.
- [ ] Implement an in-memory or local adapter only as far as needed to preserve current app behavior in tests.
- [ ] Adjust `useDiveLogbook` to consume repository-shaped actions without changing all screens in one pass.
- [ ] Do not add Zustand in this phase; revisit only if editor UI state becomes too complex for local component state.

**Gate:**

```bash
yarn workspace @repo/mobile test dive-log-entry.test.ts watch-session-to-dive-log-entry.test.ts
yarn mobile:typecheck
```

**Risk:**

If `DiveLogEntry` tries to model every future Supabase table now, it will become over-designed. Keep it app-facing and map to Supabase later.

---

## Phase 2: Local Manual Log Creation

**Goal:** Let users create and persist manual logs on mobile without login.

**Files to create or update:**

- `apps/mobile/src/screens/logbook/screen.tsx`
- `apps/mobile/src/screens/logbook/log-entry-editor.tsx`
- `apps/mobile/src/screens/logbook/log-entry-detail.tsx`
- `apps/mobile/src/states/use-dive-logbook.ts`
- `apps/mobile/src/repositories/local-dive-log-repository.ts`
- `apps/mobile/src/i18n/resources.ts`
- `apps/mobile/__tests__/logbook-manual-entry.test.tsx`
- `apps/mobile/__tests__/local-dive-log-repository.test.ts`

**Implementation notes:**

- [ ] Add a Logbook create action that starts a manual draft.
- [ ] Add a manual editor using existing UI primitives and semantic token styling.
- [ ] Use React Query mutations for save and delete, then invalidate relevant logbook queries.
- [ ] Keep the first editor field set focused:
  - date/time
  - dive mode
  - site name
  - duration
  - max depth
  - buddy names
  - tags
  - observed marine life
  - notes
  - rating
- [ ] Treat mobile location as optional and permission-gated; do not block log creation on location.
- [ ] Save manual logs with `source: 'manual'` and `syncStatus: 'localOnly'`.
- [ ] Display manual logs and watch-imported logs in the same list.
- [ ] Show provenance in detail: manual values should not look like watch-measured values.
- [ ] Add empty/error states for failed local save.
- [ ] Preserve current fixture import while adapting it to produce watch-sourced `DiveLogEntry` items.
- [ ] Do not add login, Supabase, cloud backup, or account UI in this phase.

**Gate:**

```bash
yarn workspace @repo/mobile test logbook-manual-entry.test.tsx local-dive-log-repository.test.ts
yarn mobile:typecheck
```

**Risk:**

Adding a rich editor can expand UI scope quickly. The first version should prove data model, save flow, and list/detail integration before adding media, advanced taxonomy, or complex validation.

---

## Phase 3: Watch Import Validation

**Goal:** Prove that watch-captured data can reach mobile as a contract-valid payload.

**Files to inspect or update:**

- `packages/contracts/schemas/*.schema.json`
- `packages/contracts/generated/typescript/index.ts`
- `packages/contracts/generated/swift/WatchContracts.swift`
- `apps/watch-ios/DiveWatchApp/Models/DiveSession.swift`
- `apps/watch-ios/DiveWatchApp/Storage/DiveSessionStore.swift`
- `apps/watch-ios/DiveWatchApp.xcodeproj/project.pbxproj`
- `apps/mobile/src/utils/import-watch-session.ts`
- future watch transport files

**Implementation notes:**

- [ ] Decide whether the validation path is WatchConnectivity, debug JSON export/import, or both.
- [ ] Confirm the active watch target can encode contract-compatible JSON.
- [ ] Confirm the mobile app can parse and map that payload into `DiveLogEntry`.
- [ ] Add contract fixture tests if the payload shape changes.
- [ ] Record any real-device validation steps that simulator cannot cover.
- [ ] Keep cloud sync out of this phase.

**Gate:**

```bash
yarn check:quick
yarn mobile:typecheck
yarn watch:build
```

**Risk:**

WatchConnectivity entitlement, pairing, and background behavior may require physical devices and Xcode account state.

---

## Phase 4: Watch-Based Log Authoring

**Goal:** Turn imported watch sessions into editable log entries with locked measured values.

**Files to update:**

- `apps/mobile/src/screens/logbook/*`
- `apps/mobile/src/states/use-dive-logbook.ts`
- `apps/mobile/src/utils/watch-session-to-dive-log-entry.ts`
- `apps/mobile/src/i18n/resources.ts`
- relevant tests

**Implementation notes:**

- [ ] Add an imported-session review or draft state if needed.
- [ ] Mark watch-captured fields as locked in the editor.
- [ ] Show clear provenance copy such as "워치 측정값".
- [ ] Allow missing manual context to be added.
- [ ] Preserve raw watch payload values.
- [ ] Allow user notes about inaccurate watch values without overwriting the raw data.

**Gate:**

```bash
yarn workspace @repo/mobile test
yarn mobile:typecheck
```

**Risk:**

The UI must not imply certified dive-computer verification. Use provenance language, not certification language.

---

## Phase 5: Auth and Supabase Foundation

**Goal:** Add account identity and remote persistence after the local log model is stable.

**Files to create or update:**

- future `supabase/`
- future `packages/supabase/`
- `apps/mobile/src/providers.tsx`
- `apps/mobile/src/repositories/*`
- `apps/mobile/src/states/*`
- `.wiki/wiki/architecture/supabase.md`
- `.wiki/wiki/domains/dive-log.md`

**Implementation notes:**

- [ ] Use current Supabase docs before implementation.
- [ ] Create migrations with RLS for authenticated user-owned logs.
- [ ] Generate database types through the chosen Supabase workflow.
- [ ] Add Supabase-specific mappers outside UI code.
- [ ] Keep `service_role` and secret keys out of mobile code.
- [ ] Add auth session provider.
- [ ] Keep guest mode available.

**Gate:**

```bash
yarn mobile:typecheck
```

Plus Supabase-specific migration/type/advisor gates selected during that phase.

**Risk:**

RLS or ownership mistakes can expose user data. This phase must use the Supabase skill and current Supabase docs.

---

## Phase 6: Login-Aware Storage Strategy

**Goal:** Use local-only storage for guests and local-plus-Supabase sync for signed-in users.

**Files to update:**

- `apps/mobile/src/repositories/*`
- `apps/mobile/src/states/*`
- `apps/mobile/src/screens/settings/*` or future account screen
- `apps/mobile/src/i18n/resources.ts`
- Supabase repository files

**Implementation notes:**

- [ ] Keep "continue without login" as local-only.
- [ ] On login, offer to upload existing local logs to the account.
- [ ] Write locally first, then enqueue/push remote sync.
- [ ] Track `localOnly`, `pending`, `synced`, and `failed`.
- [ ] Do not delete local entries when remote sync fails.
- [ ] Add retry behavior after remote failures.
- [ ] Add conflict behavior only when a real conflict source exists.

**Gate:**

```bash
yarn mobile:typecheck
```

Plus Supabase-specific verification and any relevant mobile tests.

**Risk:**

Uploading pre-login local logs needs a clear user consent flow. Do not silently attach guest data to a newly signed-in account.

---

## Reporting Checklist

- Completed phases:
- Commands run and results:
- Failed or skipped gates:
- Remaining risks:
- Manual setup required:
- Wiki pages updated:
- Docs updated:
