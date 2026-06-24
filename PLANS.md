# Epic Planning Template

Use this template before starting large features, cross-package work, native project changes, or any task with unclear sequencing.

## Stop Rule

Every phase must have a verification gate. If the same gate fails three times with the same root cause, stop implementation and report a blocker with:

- Failing command or manual gate
- Short error summary
- Fixes already attempted
- Suspected owner or environment dependency
- Safest next action for a human

## Epic: <name>

### Phase 0 Investigation

- Goal:
- Files to inspect:
- Implementation notes:
- Verification gate:
- Risk:

### Phase 1 Contract

- Goal:
- Files to create or update:
- Implementation notes:
- Verification gate:
- Risk:

### Phase 2 Core Implementation

- Goal:
- Files to create or update:
- Implementation notes:
- Verification gate:
- Risk:

### Phase 3 Integration

- Goal:
- Files to create or update:
- Implementation notes:
- Verification gate:
- Risk:

### Phase 4 Cleanup/Review

- Goal:
- Files to review:
- Implementation notes:
- Verification gate:
- Risk:

## Reporting Checklist

- Completed phases:
- Commands run and results:
- Failed or skipped gates:
- Remaining risks:
- Manual setup required:

## Epic: Watch app mobile migration

### Phase 0 Investigation

- Goal: Confirm the current standalone watch workspace, mobile iOS workspace, scripts, and docs that will change when watch ownership moves to mobile.
- Files to inspect:
  - `AGENTS.md`
  - `README.md`
  - `package.json`
  - `apps/mobile/AGENTS.md`
  - `apps/mobile/README.md`
  - `apps/mobile/package.json`
  - `apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj`
  - retired standalone watch workspace files
  - `.wiki/wiki/architecture/*.md`
  - `.wiki/wiki/questions/open-questions.md`
- Implementation notes:
  - Treat the retired standalone watch app source as active only for pre-migration comparison.
  - Treat the old standalone `Sources` area as inactive legacy source that should not remain active.
  - Use local Xcode watch app templates and `xcodeproj` structure to avoid unusual project settings.
- Verification gate: `xcodebuild -list -project apps/mobile/ios/DiveMobile.xcodeproj`; pre-migration standalone project listing was used only to compare target/scheme settings.
- Risk: The local Xcode runtime currently reports CoreSimulator/platform warnings; separate environment failures from project structure failures.

### Phase 1 Contract

- Goal: Define the new ownership contract: mobile owns the watch app source, target, scripts, and docs.
- Files to create or update:
  - `docs/superpowers/specs/2026-06-24-watch-app-mobile-migration-design.md`
  - `docs/superpowers/plans/2026-06-24-watch-app-mobile-migration.md`
  - `PLANS.md`
- Implementation notes:
  - Active watch source becomes `apps/mobile/ios/DiveWatchApp`.
  - Active watch target becomes `DiveWatchApp` inside `apps/mobile/ios/DiveMobile.xcodeproj`.
  - Root `watch:build` points to mobile workspace scripts.
  - The standalone watch workspace stops being active.
- Verification gate: Spec and plan exist and contain no placeholder markers.
- Risk: Removing the standalone workspace before mobile-owned watch build is stable could make rollback harder; use git status and focused diffs throughout.

### Phase 2 Core Implementation

- Goal: Move source files and add the watch target/embed structure to the mobile Xcode project.
- Files to create or update:
  - `apps/mobile/ios/DiveWatchApp/**`
  - `apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj`
  - `apps/mobile/ios/DiveMobile.xcodeproj/xcshareddata/xcschemes/DiveWatchApp.xcscheme`
  - `apps/mobile/scripts/check-watch-ui-language.mjs`
  - `apps/mobile/package.json`
  - `package.json`
- Implementation notes:
  - Add the watch target as a watchOS app target in `DiveMobile.xcodeproj`.
  - Add a target dependency from `DiveMobile` to `DiveWatchApp`.
  - Add `Embed Watch Content` to `DiveMobile`.
  - Keep WatchConnectivity code in the same files after moving.
  - Do not change developer team or provisioning settings.
- Verification gate: `yarn workspace @repo/mobile watch:list`, then `yarn watch:build`.
- Risk: Xcode project mutation may produce noisy diffs; review target/product/build phase settings before running broad gates.

### Phase 3 Integration

- Goal: Update repository guides and wiki so future agents no longer use the retired standalone watch workspace as active watch ownership.
- Files to create or update:
  - `AGENTS.md`
  - `README.md`
  - `apps/mobile/AGENTS.md`
  - `apps/mobile/README.md`
  - `.wiki/wiki/index.md`
  - `.wiki/wiki/overview.md`
  - `.wiki/wiki/architecture/monorepo.md`
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/watch-app.md`
  - `.wiki/wiki/architecture/sync-flow.md`
  - `.wiki/wiki/architecture/implementation-priorities.md`
  - `.wiki/wiki/questions/open-questions.md`
  - `.wiki/wiki/log.md`
- Implementation notes:
  - Explain that the mobile iOS project owns both iOS and companion watch targets.
  - Remove active references to the retired standalone watch workspace package.
  - Keep historical/migration references only where explicitly labeled.
- Verification gate: search active docs and package scripts for stale standalone watch workspace references.
- Risk: Some historical docs may intentionally mention old paths; do not rewrite unrelated old specs unless they would mislead active workflow.

### Phase 4 Cleanup/Review

- Goal: Verify tests/builds and remove stale standalone workspace artifacts from active source.
- Files to review:
  - retired standalone watch workspace deletion
  - `apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj`
  - `apps/mobile/ios/DiveMobile.xcodeproj/xcshareddata/xcschemes/`
  - `package.json`
  - `apps/mobile/package.json`
- Implementation notes:
  - Run focused Jest tests for WatchConnectivity import.
  - Run mobile typecheck.
  - Run mobile-owned watch build.
  - Run `codex:check`.
  - Run `ios:build` as best effort and report Xcode runtime/platform blockers separately.
- Verification gate: `yarn codex:check`
- Risk: `yarn ios:build` may continue to fail due local `iOS 26.5 Platform Not Installed`; do not treat that as proof of watch project failure unless compile errors point to migrated files.

## Epic: Mobile logbook local-first foundation

### Phase 0 Investigation

- Goal: Confirm the first executable boundary for mobile manual log creation and choose the local persistence approach.
- Files to inspect:
  - `apps/mobile/src/states/use-dive-logbook.ts`
  - `apps/mobile/src/types/dive-session.ts`
  - `apps/mobile/src/utils/import-watch-session.ts`
  - `apps/mobile/src/screens/logbook/screen.tsx`
  - `apps/mobile/src/components/navigation/index.tsx`
  - `apps/mobile/package.json`
  - `packages/contracts/schemas/*.schema.json`
  - `apps/mobile/ios/DiveWatchApp/Models/DiveSession.swift`
- Implementation notes:
  - Compare a simple key-value JSON local store against a structured local database before adding dependencies.
  - Confirm whether `@tanstack/react-query` is present in the mobile workspace and plan the smallest provider/dependency addition if absent.
  - Confirm the first manual-log field set.
  - Confirm whether watch fixture import should become a repository action in the same phase.
  - Write the exact touched-file list for Phase 1 before coding.
- Verification gate: `yarn mobile:typecheck`
- Risk: Selecting a storage dependency before the data model is stable can create unnecessary native setup and migration work.

### Phase 1 Contract

- Goal: Introduce the mobile logbook domain model and repository interface without adding auth or Supabase.
- Files to create or update:
  - `apps/mobile/src/types/dive-log-entry.ts`
  - `apps/mobile/src/repositories/dive-log-repository.ts`
  - `apps/mobile/src/repositories/local-dive-log-repository.ts`
  - `apps/mobile/src/states/use-dive-logbook-queries.ts`
  - `apps/mobile/src/providers.tsx`
  - `apps/mobile/src/utils/create-dive-log-entry.ts`
  - `apps/mobile/src/utils/watch-session-to-dive-log-entry.ts`
  - `apps/mobile/src/states/use-dive-logbook.ts`
  - relevant mobile tests
- Implementation notes:
  - Add `DiveLogEntry`, `DiveLogSource`, `DiveFieldSource`, and `DiveLogSyncStatus`.
  - Keep `WatchSession` as the watch sync contract, not the final mobile logbook item.
  - Preserve watch-captured values and provenance.
  - Add repository methods for list/get/save/delete/import watch session.
  - Use React Query for logbook reads, mutations, invalidation, loading states, and errors.
  - Keep React Query cache as cache only; local storage and future Supabase remain durable stores.
  - Do not add Zustand in the first pass unless editor state complexity proves it is needed.
- Verification gate: `yarn workspace @repo/mobile test` for touched tests, then `yarn mobile:typecheck`
- Risk: Over-modeling future Supabase tables at this stage can make the local app harder to ship.

### Phase 2 Core Implementation

- Goal: Add login-free local manual log creation in the mobile app.
- Files to create or update:
  - `apps/mobile/src/screens/logbook/*`
  - `apps/mobile/src/states/use-dive-logbook.ts`
  - `apps/mobile/src/repositories/local-dive-log-repository.ts`
  - `apps/mobile/src/i18n/resources.ts`
  - relevant mobile tests
- Implementation notes:
  - Add a Logbook create action and manual editor.
  - Use React Query mutations for save/delete/import and invalidate relevant logbook queries.
  - Save manual logs with `source: 'manual'` and `syncStatus: 'localOnly'`.
  - Display manual and watch-sourced entries in one logbook.
  - Keep mobile-assisted location optional and editable.
  - Do not add login, Supabase, cloud backup, or account UI in this phase.
- Verification gate: `yarn workspace @repo/mobile test` for touched tests, then `yarn mobile:typecheck`
- Risk: The editor can expand quickly; defer media, advanced taxonomy, and complex validation until the save/list/detail path is stable.

### Phase 3 Integration

- Goal: Validate watch data movement into mobile and then support watch-based log authoring.
- Files to create or update:
  - `packages/contracts/schemas/*.schema.json` only if the contract must change
  - `apps/mobile/ios/DiveWatchApp/*` transport-related files
  - `apps/mobile/src/utils/import-watch-session.ts`
  - `apps/mobile/src/utils/watch-session-to-dive-log-entry.ts`
  - `apps/mobile/src/screens/logbook/*`
- Implementation notes:
  - Decide whether the validation path is WatchConnectivity, debug JSON export/import, or both.
  - Confirm contract-valid payload parsing on mobile.
  - Lock watch-captured measured values in mobile editing.
  - Let the user add missing context such as buddy, gear, notes, tags, and observed marine life.
- Verification gate: `yarn check:quick`, `yarn mobile:typecheck`, and `yarn watch:build` if watchOS or contract files change.
- Risk: WatchConnectivity and underwater sensor behavior may need physical device validation.

### Phase 4 Cleanup/Review

- Goal: Prepare the local-first logbook for auth and Supabase without implementing cloud sync prematurely.
- Files to review:
  - `docs/superpowers/specs/2026-06-21-mobile-logbook-local-first-design.md`
  - `docs/superpowers/plans/2026-06-21-mobile-logbook-local-first.md`
  - `.wiki/wiki/architecture/mobile-logbook-roadmap.md`
  - `.wiki/wiki/decisions/adr-local-first-mobile-logbook.md`
  - `.wiki/wiki/domains/dive-log.md`
  - `.wiki/wiki/architecture/supabase.md`
- Implementation notes:
  - Confirm guest/local-only behavior.
  - Confirm future signed-in local-plus-Supabase sync behavior.
  - Record unresolved storage, transport, and Supabase schema decisions before starting auth work.
- Verification gate: `yarn codex:check`
- Risk: Adding auth before the local domain model stabilizes can force avoidable rewrites.
