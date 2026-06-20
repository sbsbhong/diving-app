---
name: xcode-harness
description: Use for iOS, watchOS, Xcode project, scheme, entitlement, signing, or native module changes in this repository. Prioritizes CLI inspection and simulator builds over Xcode GUI workflows.
---

# Xcode Harness

Use this skill before editing `*.xcodeproj`, `*.xcworkspace`, entitlements, Swift native code, signing settings, or watchOS/iOS build scripts.

## Git Context

Apps under `apps/` use the super-repo root `.git`; they do not own independent Git repositories. Run `git status`, `git diff`, and touched-file reporting from the super-repo root. If `git rev-parse --show-toplevel` fails inside this checkout, locate the super-repo root before claiming Git metadata is unavailable.

## Procedure

1. Identify the native surface:
   - List projects/workspaces with `rg --files -g '*.xcodeproj' -g '*.xcworkspace' -g 'Podfile'`.
   - Confirm schemes with `xcodebuild -list -project <project>`.
   - Inspect project settings for bundle IDs, platforms, deployment targets, and signing before editing.
2. Plan the smallest native change:
   - Prefer source changes under active target folders.
   - When adding files, ensure the Xcode project includes them in the intended target build phase.
   - Do not change bundle IDs, provisioning profiles, teams, signing style, or entitlements without explicit approval.
3. Validate from CLI:
   - For watchOS simulator builds, prefer `CODE_SIGNING_ALLOWED=NO`.
   - Use a repo-writable or temp derived data path such as `/private/tmp/DiveWatchAppDerivedData`.
   - Do not require a physical Apple Watch as an automated gate.
4. Report native status:
   - Include the project, scheme, destination, command, and result.
   - If simulator services fail, separate environment failure from compile failure.
   - Sandbox warnings about CoreSimulator logs, FS event streams, or unavailable simulator runtimes are not compile failures when `xcodebuild` exits 0.

## Current Repo Facts

- Current project: `apps/watch-ios/DiveWatchApp.xcodeproj`
- Confirmed target and scheme: `DiveWatchApp`
- Current platform: watchOS/watchOS Simulator
- Active app source: `apps/watch-ios/DiveWatchApp`

## Preferred Commands

```bash
xcodebuild -list -project apps/watch-ios/DiveWatchApp.xcodeproj
yarn watch:build
```
