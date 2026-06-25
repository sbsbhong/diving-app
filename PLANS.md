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

## Epic: Pre-device two-mode, notifications, and validation readiness

### Phase 0 Investigation

- Goal: Confirm current contract, mobile Logbook/Planning/Home/Settings, WatchConnectivity, watchOS source, and documentation state before implementation.
- Files to inspect:
  - `docs/superpowers/specs/2026-06-26-two-mode-dive-contract-and-ux-design.md`
  - `docs/superpowers/specs/2026-06-26-watch-sync-notifications-design.md`
  - `docs/superpowers/specs/2026-06-26-home-location-conditions-design.md`
  - `packages/contracts/schemas/watch-session.schema.json`
  - `apps/mobile/src/utils/watch-sync-message-validation.ts`
  - `apps/mobile/src/screens/logbook/**`
  - `apps/mobile/src/screens/planning/**`
  - `apps/mobile/src/screens/home/screen.tsx`
  - `apps/mobile/src/screens/settings/screen.tsx`
  - `apps/mobile/src/states/watch-connectivity-sync.tsx`
  - `apps/mobile/ios/DiveWatchApp/**`
  - `.wiki/wiki/architecture/*.md`
  - `.wiki/wiki/domains/*.md`
  - `.wiki/wiki/questions/open-questions.md`
- Implementation notes:
  - Preserve the safety boundary: no decompression, no certified dive-computer claims, no emergency instruction.
  - Treat paired iPhone/Watch hardware checks as manual gates only; do not claim physical-device validation from simulator or local builds.
  - Keep local sync notification wording tied to mobile local repository storage, not Supabase/cloud backup.
- Verification gate: plan file exists at `docs/superpowers/plans/2026-06-26-pre-device-priorities.md` and contains task-level gates.
- Risk: Existing wiki/spec changes are uncommitted in the starting workspace; preserve them and do not revert unrelated edits.

### Phase 1 Contract

- Goal: Reduce watch sync `diveMode` to `scuba | freedive` and reset local Logbook/Planbook storage namespace for the PoC reset.
- Files to create or update:
  - `packages/contracts/schemas/watch-session.schema.json`
  - `packages/contracts/generated/typescript/index.ts`
  - `packages/contracts/generated/swift/WatchContracts.swift`
  - `packages/contracts/fixtures/*.json`
  - `apps/mobile/src/utils/watch-sync-message-validation.ts`
  - `apps/mobile/src/storage/storage-keys.ts`
  - `apps/mobile/__tests__/watch-sync-message-validation.test.ts`
  - `apps/mobile/__tests__/persistent-dive-log-repository.test.ts`
  - `apps/mobile/__tests__/persistent-dive-plan-repository.test.ts`
- Implementation notes:
  - Write failing tests before changing validator/storage behavior.
  - Regenerate generated contract output through `yarn check:quick`; do not hand-edit generated files except as generation output.
- Verification gate: `yarn check:quick` and focused mobile tests for validator/storage.
- Risk: Removed mode values in old local v1 data are intentionally not migrated; this must remain documented as a reset.

### Phase 2 Core Implementation

- Goal: Align mobile and watch UX around two dive modes, add watch sync notification preference/service, and add Home conditions mock interface.
- Files to create or update:
  - `apps/mobile/src/screens/logbook/**`
  - `apps/mobile/src/screens/planning/**`
  - `apps/mobile/src/screens/home/screen.tsx`
  - `apps/mobile/src/screens/settings/screen.tsx`
  - `apps/mobile/src/states/app-preferences.tsx`
  - `apps/mobile/src/states/app-preferences-storage.ts`
  - `apps/mobile/src/states/watch-connectivity-sync.tsx`
  - `apps/mobile/src/notifications/watch-sync-notification-service.ts`
  - `apps/mobile/src/conditions/home-conditions.ts`
  - `apps/mobile/src/i18n/resources.ts`
  - `apps/mobile/ios/DiveWatchApp/Models/DiveSession.swift`
  - `apps/mobile/ios/DiveWatchApp/Views/HomeView.swift`
  - `apps/mobile/ios/DiveWatchApp/Views/RecordingView.swift`
  - `apps/mobile/package.json`
  - `yarn.lock`
- Implementation notes:
  - Use TDD for behavior changes where Jest can cover them.
  - Add Notifee as a mobile workspace dependency with Yarn 1.
  - Keep Notifee usage behind an adapter/no-op fallback so tests and unsupported environments do not block local import.
  - Use semantic UI tokens and existing Gluestack/NativeWind primitives.
- Verification gate: focused Jest suites, `yarn mobile:typecheck`, `yarn workspace @repo/mobile watch:ui:check`, and `yarn watch:build`.
- Risk: Adding a native notification dependency may require CocoaPods install for full iOS app builds; report if local pods are not refreshed.

### Phase 3 Integration

- Goal: Document manual real-device validation steps and update durable wiki facts after implementation.
- Files to create or update:
  - `docs/2026-06-26-pre-device-priorities/watchconnectivity-real-device-checklist.md`
  - `docs/2026-06-26-pre-device-priorities/index.html`
  - `.wiki/wiki/architecture/implementation-priorities.md`
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/watch-app.md`
  - `.wiki/wiki/architecture/sync-flow.md`
  - `.wiki/wiki/domains/dive-log.md`
  - `.wiki/wiki/domains/dive-planning.md`
  - `.wiki/wiki/domains/safety-rules.md`
  - `.wiki/wiki/questions/open-questions.md`
  - `.wiki/wiki/log.md`
- Implementation notes:
  - Separate completed implementation facts from remaining physical-device validation.
  - The HTML handoff should summarize commits, gates, manual checks, and residual risks.
- Verification gate: documentation/source search for stale removed-mode and unsafe sync wording, then `yarn codex:check`.
- Risk: Wiki must not overstate background delivery or real Apple Watch underwater sensor behavior.

### Phase 4 Cleanup/Review

- Goal: Verify all relevant gates, create logical commits, and preserve the branch for user review.
- Files to review:
  - `git status --short`
  - `git diff --stat`
  - `docs/superpowers/plans/2026-06-26-pre-device-priorities.md`
  - touched source, tests, generated contracts, docs, wiki, `package.json`, `yarn.lock`
- Implementation notes:
  - Commit by requirement unit: two-mode contract/UX, notification service, Home conditions, handoff/wiki/checklist, pre-existing pending-work skill/specs if appropriate.
  - Do not merge, push, or discard without explicit user choice after verification.
- Verification gate: `yarn check:quick`, `yarn workspace @repo/mobile test --runInBand`, `yarn mobile:typecheck`, `yarn workspace @repo/mobile watch:ui:check`, `yarn watch:build`, `yarn codex:check`, `git diff --check`.
- Risk: Physical paired-device verification remains a manual gate outside this environment.

## Epic: Pre-device-test mobile and watch readiness

### Phase 0 Investigation

- Goal: Map the current mobile navigation, form/input, logbook import, refresh, watch planning, device management, and home status surfaces before editing.
- Files to inspect:
  - `apps/mobile/package.json`
  - `apps/mobile/src/App.tsx`
  - `apps/mobile/src/providers.tsx`
  - `apps/mobile/src/components/navigation/index.tsx`
  - `apps/mobile/src/screens/home/screen.tsx`
  - `apps/mobile/src/screens/logbook/screen.tsx`
  - `apps/mobile/src/screens/planning/screen.tsx`
  - `apps/mobile/src/screens/memory/screen.tsx`
  - `apps/mobile/src/states/use-dive-logbook.ts`
  - `apps/mobile/src/states/watch-connectivity-sync.tsx`
  - `apps/mobile/src/native/watch-connectivity.ts`
  - `apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift`
  - `apps/mobile/ios/DiveWatchApp/**`
- Implementation notes:
  - Keep the existing UI primitives and visual language unless a requirement directly asks for a UX change.
  - Use `@react-navigation/native` as the new navigation state container while preserving the custom tab bar styling.
  - Treat manual import as a user-facing sync affordance, not a second source of truth.
  - Do not introduce Supabase, auth, certified dive-computer copy, or physical-device-only verification gates.
- Verification gate: `yarn workspace @repo/mobile test --runInBand` for focused touched tests and `yarn mobile:typecheck`.
- Risk: React Navigation may require additional peer dependencies for a richer navigator; the first pass should avoid adding extra packages unless the build requires them.

### Phase 1 Contract

- Goal: Define the app-level behavior contracts for navigation, refresh, keyboard avoidance, manual watch sync, formatting, planned dives, and linked watch display.
- Files to create or update:
  - `apps/mobile/__tests__/*.test.tsx`
  - `apps/mobile/__tests__/*.test.ts`
  - `apps/mobile/src/types/*.ts`
  - `apps/mobile/src/native/watch-connectivity.ts`
- Implementation notes:
  - Add or extend tests before behavior changes where the existing Jest setup can exercise the code.
  - Keep native contracts explicit for linked watch metadata and manual sync status.
  - Round display numbers at formatting boundaries so stored/raw watch values remain intact.
- Verification gate: Each requirement gets a focused red/green test run before its commit when testable, then `yarn mobile:typecheck`.
- Risk: Some UI behavior such as keyboard avoidance and pull-to-refresh is partly platform behavior and may need simulator/manual validation after type/test gates.

### Phase 2 Core Implementation

- Goal: Implement requirements 1 through 10 in separate commits.
- Files to create or update:
  - `apps/mobile/package.json`
  - `yarn.lock`
  - `apps/mobile/src/components/navigation/index.tsx`
  - `apps/mobile/src/screens/home/screen.tsx`
  - `apps/mobile/src/screens/logbook/screen.tsx`
  - `apps/mobile/src/screens/planning/screen.tsx`
  - `apps/mobile/src/screens/memory/screen.tsx`
  - `apps/mobile/src/states/use-dive-logbook.ts`
  - `apps/mobile/src/states/watch-connectivity-sync.tsx`
  - `apps/mobile/src/native/watch-connectivity.ts`
  - `apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift`
  - `apps/mobile/ios/DiveWatchApp/**`
- Implementation notes:
  - Commit messages must start with `feat:`, `fix:`, `refactor:`, or `chore:` and use lowercase after the prefix.
  - Keep one requirement per implementation commit so rollback remains practical.
  - Prefer `KeyboardAvoidingView`, `ScrollView`/`FlatList` keyboard props, and `RefreshControl` before custom gesture code.
  - Let active tab reselection trigger refresh and scroll-to-top through a shared route registry instead of duplicated per-tab hacks.
- Verification gate: Focused Jest/typecheck after each high-risk requirement; broader gate in Phase 4.
- Risk: Requirement 8 crosses mobile planning and watch UI; avoid safety-critical planning semantics and frame it as a non-certified reminder.

### Phase 3 Integration

- Goal: Wire the changed app behavior into native/mobile boundaries and durable project knowledge.
- Files to create or update:
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/watch-app.md`
  - `.wiki/wiki/architecture/sync-flow.md`
  - `.wiki/wiki/domains/dive-log.md`
  - `.wiki/wiki/log.md`
  - `README.md`
  - `apps/mobile/README.md`
  - `AGENTS.md`
  - `apps/mobile/AGENTS.md`
- Implementation notes:
  - Update durable docs only for architecture, sync behavior, planning/watch boundary, or recurring pitfalls that actually changed.
  - Keep README/AGENTS concise and focused on active developer workflow.
- Verification gate: Search docs for stale statements after code changes and run `yarn codex:check`.
- Risk: Documentation can overstate simulator or physical-device verification; explicitly separate verified simulator behavior from unverified real-device behavior.

### Phase 4 Cleanup/Review

- Goal: Run final verification, review commit boundaries, and report remaining risks before real-device testing.
- Files to review:
  - `git log --oneline`
  - `git status --short`
  - `git diff --stat main...HEAD`
  - touched source, native, test, and docs files
- Implementation notes:
  - Run `yarn mobile:typecheck`, focused Jest suites, `yarn watch:build`, and `yarn codex:check`.
  - Run `yarn ios:build` if CocoaPods/native workspace is available.
  - Run `git diff --check` before final reporting.
- Verification gate: Final command outputs and exit codes are recorded in the handoff.
- Risk: Physical Apple Watch behavior remains unverified until the user runs real-device testing.

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
