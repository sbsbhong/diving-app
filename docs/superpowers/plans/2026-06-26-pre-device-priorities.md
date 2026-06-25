# Pre-device Priorities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the three pre-device-test priorities: two-mode dive contract/UX reset, watch sync local notifications, and a real-device WatchConnectivity validation handoff that does not claim hardware verification.

**Architecture:** Contract changes start in `packages/contracts/schemas/watch-session.schema.json`, then generated TypeScript/Swift, runtime validator, mobile domain/UI, and watch Swift model/UI are aligned around `scuba` and `freedive`. Watch sync notifications stay behind a small JS service boundary and app preference, and fire only after a valid payload is saved to the mobile local repository. Real-device verification is documented as a manual gate with explicit no-claim wording because this environment cannot validate paired hardware behavior.

**Tech Stack:** Yarn 1 workspaces, Turborepo, React Native 0.85, React Query, react-i18next, AsyncStorage, Notifee, SwiftUI watchOS, WatchConnectivity, JSON Schema generated contracts.

---

### Task 1: Two-Mode Contract And Storage Reset

**Files:**
- Modify: `packages/contracts/schemas/watch-session.schema.json`
- Generate: `packages/contracts/generated/typescript/index.ts`
- Generate: `packages/contracts/generated/swift/WatchContracts.swift`
- Modify: `packages/contracts/fixtures/*.json`
- Modify: `apps/mobile/src/utils/watch-sync-message-validation.ts`
- Modify: `apps/mobile/src/storage/storage-keys.ts`
- Modify: `apps/mobile/src/types/dive-session.ts`
- Test: `apps/mobile/__tests__/watch-sync-message-validation.test.ts`
- Test: `apps/mobile/__tests__/persistent-dive-log-repository.test.ts`
- Test: `apps/mobile/__tests__/persistent-dive-plan-repository.test.ts`

- [ ] **Step 1: Write failing validator and storage reset tests**

Add tests that assert `snorkel`, `pool`, and `unknown` dive modes are rejected by `parseWatchSyncMessageValue`, and that storage keys are bumped from v1 to v2 so old local Logbook/Planbook entries are not read by the reset model.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/watch-sync-message-validation.test.ts apps/mobile/__tests__/persistent-dive-log-repository.test.ts apps/mobile/__tests__/persistent-dive-plan-repository.test.ts
```

Expected: FAIL because the validator still accepts removed modes and storage keys still use v1.

- [ ] **Step 3: Implement contract and reset**

Update `watch-session.schema.json` `diveMode` enum to `["scuba", "freedive"]`, update runtime validator `diveModes`, fixtures, and storage keys to `dive-app:logbook:v2` and `dive-app:planbook:v2`. Leave preferences on v1 unless notification preferences require a version bump.

- [ ] **Step 4: Regenerate contracts and run focused tests**

Run:

```bash
yarn check:quick
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/watch-sync-message-validation.test.ts apps/mobile/__tests__/persistent-dive-log-repository.test.ts apps/mobile/__tests__/persistent-dive-plan-repository.test.ts
```

Expected: PASS with generated TypeScript/Swift reflecting two modes only.

### Task 2: Mobile Two-Mode Logbook And Planning UX

**Files:**
- Modify: `apps/mobile/src/types/dive-log-entry.ts`
- Modify: `apps/mobile/src/types/dive-plan.ts`
- Modify: `apps/mobile/src/utils/create-dive-log-entry.ts`
- Modify: `apps/mobile/src/utils/create-dive-plan.ts`
- Modify: `apps/mobile/src/screens/logbook/log-entry-editor.tsx`
- Modify: `apps/mobile/src/screens/logbook/log-entry-mode-fields.tsx`
- Modify: `apps/mobile/src/screens/planning/plan-editor.tsx`
- Modify: `apps/mobile/src/screens/planning/plan-mode-fields.tsx`
- Modify: `apps/mobile/src/i18n/resources.ts`
- Test: `apps/mobile/__tests__/logbook-manual-entry.test.tsx`
- Test: `apps/mobile/__tests__/planning-screen.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Add tests that the Logbook editor exposes only `log-entry-editor-mode-scuba` and `log-entry-editor-mode-freedive`, hides `snorkel`/`pool` mode buttons and pool fields, and defaults scuba gas copy to air. Add matching Planning tests for only two modes and no pool-specific fields.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/logbook-manual-entry.test.tsx apps/mobile/__tests__/planning-screen.test.tsx
```

Expected: FAIL because the current editors still expose removed mode UI.

- [ ] **Step 3: Implement mobile two-mode UI**

Remove user-facing snorkel/pool mode choices and mode sections, keep `DiveEntryStyle` as `shore | boat | pool` because pool remains an entry context, and retain stored optional legacy fields only where needed for type compatibility. Make scuba and freedive labels/copy non-certified and avoid decompression or equipment-replacement claims.

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/logbook-manual-entry.test.tsx apps/mobile/__tests__/planning-screen.test.tsx
yarn mobile:typecheck
```

Expected: PASS.

### Task 3: Watch Two-Mode Model And Recording First Viewport

**Files:**
- Modify: `apps/mobile/ios/DiveWatchApp/Models/DiveSession.swift`
- Modify: `apps/mobile/ios/DiveWatchApp/Views/HomeView.swift`
- Modify: `apps/mobile/ios/DiveWatchApp/Views/RecordingView.swift`
- Modify: `apps/mobile/ios/DiveWatchApp/Localizable.xcstrings`
- Test/source scan: `apps/mobile/__tests__/watch-connectivity-native-source.test.ts` or a new source-scan test

- [ ] **Step 1: Write failing source-scan test**

Add a Jest source-scan test proving active watch source no longer defines `case snorkel`, `case pool`, or `case unknown` in `DiveMode`, and that scuba-only assistant copy does not appear in freedive-specific recording UI.

- [ ] **Step 2: Run focused test and confirm RED**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/watch-connectivity-native-source.test.ts
```

Expected: FAIL because active Swift source still includes removed modes.

- [ ] **Step 3: Implement watch two-mode Swift changes**

Remove removed `DiveMode` cases, default old/unknown decode values to `.scuba`, keep water-condition `.unknown`, and split `RecordingView` so scuba shows current depth, elapsed, max depth, ascent reference, safety-stop reference, and compact non-certified copy while freedive hides gas/safety-stop information.

- [ ] **Step 4: Run watch checks**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/watch-connectivity-native-source.test.ts
yarn workspace @repo/mobile watch:ui:check
yarn watch:build
```

Expected: PASS or report environment-specific simulator/build issues separately from compile errors.

### Task 4: Watch Sync Notification Preference And Service

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `yarn.lock`
- Create: `apps/mobile/src/notifications/watch-sync-notification-service.ts`
- Modify: `apps/mobile/src/states/app-preferences-storage.ts`
- Modify: `apps/mobile/src/states/app-preferences.tsx`
- Modify: `apps/mobile/src/states/watch-connectivity-sync.tsx`
- Modify: `apps/mobile/src/components/navigation/index.tsx`
- Modify: `apps/mobile/src/screens/settings/screen.tsx`
- Modify: `apps/mobile/src/i18n/resources.ts`
- Test: `apps/mobile/__tests__/watch-sync-notification-service.test.ts`
- Test: `apps/mobile/__tests__/watch-connectivity-sync.test.tsx`
- Test: `apps/mobile/__tests__/settings-screen.test.tsx`

- [ ] **Step 1: Install Notifee with Yarn 1**

Run:

```bash
yarn workspace @repo/mobile add @notifee/react-native
```

Expected: `apps/mobile/package.json` and `yarn.lock` update only through Yarn.

- [ ] **Step 2: Write failing notification tests**

Add tests for preference persistence, Settings opt-in invoking permission request, import success invoking notification service, invalid payload/save failure not notifying, and foreground toast persistence without auto-dismiss.

- [ ] **Step 3: Run focused tests and confirm RED**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/watch-sync-notification-service.test.ts apps/mobile/__tests__/watch-connectivity-sync.test.tsx apps/mobile/__tests__/settings-screen.test.tsx
```

Expected: FAIL because notification service/preference integration is not implemented.

- [ ] **Step 4: Implement notification service and UI wiring**

Create a small Notifee adapter with no-op fallback for tests/unsupported environments. Add `watchSyncNotificationsEnabled` to preferences, Settings opt-in row/detail, permission request on enable, local notification after repository import success, and persistent foreground toast close/open actions. Copy must say “Watch log saved” / “A watch dive log was saved on this device.” and must not say cloud synced or uploaded.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/watch-sync-notification-service.test.ts apps/mobile/__tests__/watch-connectivity-sync.test.tsx apps/mobile/__tests__/settings-screen.test.tsx
yarn mobile:typecheck
```

Expected: PASS.

### Task 5: Home Location Conditions Mock Interface

**Files:**
- Create: `apps/mobile/src/conditions/home-conditions.ts`
- Modify: `apps/mobile/src/screens/home/screen.tsx`
- Modify: `apps/mobile/src/i18n/resources.ts`
- Test: `apps/mobile/__tests__/home-conditions.test.tsx`

- [ ] **Step 1: Write failing Home conditions tests**

Add tests for ready snapshot with city/local time/air/water temperature, non-coastal snapshot hiding water temperature, and unavailable state that keeps Home actions visible.

- [ ] **Step 2: Run focused test and confirm RED**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/home-conditions.test.tsx
```

Expected: FAIL because Home conditions interface/UI is not implemented.

- [ ] **Step 3: Implement provider-neutral mock interface and Home band**

Add `HomeConditionsSnapshot`, `HomeConditionsProvider`, a static mock provider, and a compact Home band above the latest log card. Do not add real API calls, location permission code, dive suitability scoring, alerts, tides, route planning, or safety recommendations.

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
yarn workspace @repo/mobile test --runInBand apps/mobile/__tests__/home-conditions.test.tsx
yarn mobile:typecheck
```

Expected: PASS.

### Task 6: Real-Device WatchConnectivity Validation Handoff

**Files:**
- Create: `docs/2026-06-26-pre-device-priorities/watchconnectivity-real-device-checklist.md`
- Create: `docs/2026-06-26-pre-device-priorities/index.html`
- Modify: `.wiki/wiki/architecture/implementation-priorities.md`
- Modify: `.wiki/wiki/architecture/mobile.md`
- Modify: `.wiki/wiki/architecture/watch-app.md`
- Modify: `.wiki/wiki/architecture/sync-flow.md`
- Modify: `.wiki/wiki/domains/dive-log.md`
- Modify: `.wiki/wiki/domains/dive-planning.md`
- Modify: `.wiki/wiki/domains/safety-rules.md`
- Modify: `.wiki/wiki/questions/open-questions.md`
- Modify: `.wiki/wiki/log.md`

- [ ] **Step 1: Write/update handoff docs**

Document manual paired-device checks for install, entitlement, foreground delivery, background/killed delivery, durable inbox drain, reachable `sendMessage`, `transferUserInfo`, import acknowledgement, watch `synced` status, retry/backoff observation, Settings notification opt-in, and notification press routing. State that the agent did not run physical-device validation.

- [ ] **Step 2: Update wiki durable facts**

Record completed two-mode/notification/Home mock interface facts and keep real-device WatchConnectivity, actual underwater sensor behavior, Supabase/auth/cloud sync, and physical background notification delivery as open validation gaps.

- [ ] **Step 3: Run documentation/source checks**

Run:

```bash
rg -n "snorkel|pool|unknown|Cloud synced|Uploaded|Dive computer data verified" apps/mobile/src packages/contracts apps/mobile/ios/DiveWatchApp docs/2026-06-26-pre-device-priorities .wiki/wiki
```

Expected: only allowed matches remain: `pool` entry style/pool context if intentionally retained, `unknown` water condition/unknown placeholders, and safety-boundary statements that do not expose removed dive modes as selectable modes.

### Task 7: Final Verification And Commits

**Files:**
- Review: `git status --short`
- Review: `git diff --stat`
- Review: touched source, test, docs, and wiki files

- [ ] **Step 1: Run full relevant gates**

Run:

```bash
yarn check:quick
yarn workspace @repo/mobile test --runInBand
yarn mobile:typecheck
yarn workspace @repo/mobile watch:ui:check
yarn watch:build
yarn codex:check
git diff --check
```

Expected: PASS, except physical-device validation remains manual and is reported as not run.

- [ ] **Step 2: Commit requirement units**

Create logical commits for contract/two-mode UX, watch notifications, Home conditions, real-device checklist/wiki/handoff, and the pre-existing pending-work skill/spec additions if still staged in this branch.

- [ ] **Step 3: Finish branch**

Use `superpowers:finishing-a-development-branch` after verification. Because this is unattended requested work, preserve the branch unless the user explicitly chooses merge/PR/discard.

