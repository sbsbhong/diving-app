# Watch App Mobile Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the watchOS app into the mobile iOS workspace and make the mobile iOS target embed the watch app as its companion.

**Architecture:** `apps/mobile/ios/DiveMobile.xcodeproj` owns both the React Native iOS target and a new watchOS companion app target. Existing watch Swift source moves under `apps/mobile/ios/DiveWatchApp`, and the old standalone watch workspace stops being active.

**Tech Stack:** Yarn 1 workspaces, React Native iOS app, SwiftUI watchOS app, Xcode project target/build phase configuration, WatchConnectivity, llm-wiki docs.

---

### Task 1: Move Watch Source Ownership

**Files:**
- Move: retired standalone watch source -> `apps/mobile/ios/DiveWatchApp`
- Move: retired standalone watch UI check script -> `apps/mobile/scripts/check-watch-ui-language.mjs`
- Remove active standalone watch workspace files after docs/scripts point to mobile.

- [ ] Move active watch Swift source into `apps/mobile/ios/DiveWatchApp`.
- [ ] Move the watch UI language check script into mobile scripts.
- [ ] Confirm no active build/documentation path still points to the retired standalone watch source.

Gate:

```bash
test -f apps/mobile/ios/DiveWatchApp/DiveWatchApp.swift
```

### Task 2: Add Mobile-Owned Watch Target

**Files:**
- Modify: `apps/mobile/ios/DiveMobile.xcodeproj/project.pbxproj`
- Create: `apps/mobile/ios/DiveMobile.xcodeproj/xcshareddata/xcschemes/DiveWatchApp.xcscheme`

- [ ] Add `DiveWatchApp` as a watchOS app target in `DiveMobile.xcodeproj`.
- [ ] Add all moved Swift files to the watch target sources.
- [ ] Add `Localizable.xcstrings` to the watch target resources.
- [ ] Set generated watch Info.plist keys for display name, orientations, and `WKCompanionAppBundleIdentifier`.
- [ ] Set watch bundle id to the mobile app bundle id plus `.watchkitapp`.
- [ ] Add `DiveWatchApp` target dependency to `DiveMobile`.
- [ ] Add `Embed Watch Content` copy phase to `DiveMobile`.
- [ ] Add a shared `DiveWatchApp` scheme for CLI watch builds.

Gate:

```bash
xcodebuild -list -project apps/mobile/ios/DiveMobile.xcodeproj
```

Expected: schemes include `DiveMobile` and `DiveWatchApp`.

### Task 3: Update Scripts and Guides

**Files:**
- Modify: `package.json`
- Modify: `apps/mobile/package.json`
- Modify: `AGENTS.md`
- Modify: `apps/mobile/AGENTS.md`
- Delete or replace: retired standalone watch `AGENTS.md`
- Modify: `README.md`
- Modify: `apps/mobile/README.md`
- Delete or replace: retired standalone watch `README.md`

- [ ] Point root `watch:build` to `@repo/mobile watch:build`.
- [ ] Add mobile scripts for `watch:build`, `watch:list`, and `watch:ui:check`.
- [ ] Update guides so active watch app ownership is under `apps/mobile`.
- [ ] Remove active workspace claims for the retired standalone watch workspace.

Gate:

```bash
yarn workspace @repo/mobile watch:list
```

Expected: `DiveWatchApp` scheme is visible in the mobile iOS project.

### Task 4: Update Wiki and Project Knowledge

**Files:**
- Modify: `.wiki/wiki/index.md`
- Modify: `.wiki/wiki/overview.md`
- Modify: `.wiki/wiki/architecture/monorepo.md`
- Modify: `.wiki/wiki/architecture/mobile.md`
- Modify: `.wiki/wiki/architecture/watch-app.md`
- Modify: `.wiki/wiki/architecture/sync-flow.md`
- Modify: `.wiki/wiki/architecture/implementation-priorities.md`
- Modify: `.wiki/wiki/questions/open-questions.md`
- Modify: `.wiki/wiki/log.md`

- [ ] Record that watchOS active source moved into `apps/mobile/ios/DiveWatchApp`.
- [ ] Record that `DiveMobile.xcodeproj` owns both iOS and watch targets.
- [ ] Record that the standalone watch workspace is retired or removed.
- [ ] Keep unresolved items limited to actual simulator/device/runtime validation and future sensor work.

Gate:

```bash
rg -n "retired standalone watch workspace|standalone watch workspace" README.md AGENTS.md apps .wiki/wiki docs
```

Expected: no active-path references remain except migration history or retired-path notes.

### Task 5: Verification

**Files:**
- No new implementation files unless gates expose required fixes.

- [ ] Run focused mobile tests.
- [ ] Run `yarn mobile:typecheck`.
- [ ] Run `yarn watch:build`.
- [ ] Run `yarn codex:check`.
- [ ] Run `yarn ios:build` as best effort and report environment failures separately.
- [ ] Clean generated cache/log churn that is not part of the migration.

Gate:

```bash
yarn codex:check
```

Expected: pass. If `yarn ios:build` fails only due local Xcode runtime/platform state, report that separately.
