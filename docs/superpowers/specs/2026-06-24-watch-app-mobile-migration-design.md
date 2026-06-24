# Watch App Mobile Migration Design

## Goal

Move the watchOS app from the retired standalone watch workspace into the mobile iOS workspace so the watch app is built, embedded, and tested as the iPhone app's companion watch app.

## Direction

The user explicitly chose full mobile ownership because this is the first watch app in the project and the repository should avoid unusual split-project deployment structure.

The new ownership model is:

- Active mobile app: `apps/mobile`.
- Active iOS project: `apps/mobile/ios/DiveMobile.xcodeproj`.
- Active watch source: `apps/mobile/ios/DiveWatchApp`.
- Active watch target: `DiveWatchApp` inside `DiveMobile.xcodeproj`.
- Retired standalone watch workspace: removed from active ownership.

## Scope

In scope:

- Move active watch source files from the retired standalone watch source into `apps/mobile/ios/DiveWatchApp`.
- Add a watchOS companion app target to `apps/mobile/ios/DiveMobile.xcodeproj`.
- Add an iOS target dependency on the watch target.
- Add `Embed Watch Content` to the iOS app target.
- Set the watch target bundle identifier to the iOS app bundle identifier plus `.watchkitapp`.
- Set `WKCompanionAppBundleIdentifier` through generated Info.plist build settings.
- Move watch UI check/build scripts into `@repo/mobile`.
- Update root scripts so `watch:build` builds the mobile-owned watch target.
- Remove or retire standalone watch workspace code paths from active docs.
- Update `AGENTS.md`, app guides, README files, wiki, and durable planning notes.

Out of scope:

- Apple Developer Team, provisioning profile, manual signing setup, or physical device validation.
- Changing the watch sync contract schema.
- Moving watch Swift source into a shared package.
- Rewriting watch UI or sensor behavior.
- Supabase/auth/cloud sync.

## Architecture

The mobile iOS Xcode project becomes the native owner for both the iOS app and the companion watch app. The watch app remains a separate watchOS target, but it lives in the same Xcode project as the iOS target and is embedded by the iOS target.

The watch source stays SwiftUI-only and keeps the existing structure:

- `Models`
- `Sensors`
- `Recording`
- `Storage`
- `Sync`
- `Views`

The iOS target still owns React Native and the native WatchConnectivity receiver. The watch target owns recording and outbound WatchConnectivity enqueue.

## Build Model

`DiveMobile.xcodeproj` will contain:

- `DiveMobile`: iOS React Native app target.
- `DiveWatchApp`: watchOS companion app target.

The iOS target gets:

- Target dependency on `DiveWatchApp`.
- `Embed Watch Content` copy phase with `DiveWatchApp.app`.

The watch target gets:

- `SDKROOT = watchos`.
- `SUPPORTED_PLATFORMS = watchos watchsimulator`.
- `TARGETED_DEVICE_FAMILY = 4`.
- `WATCHOS_DEPLOYMENT_TARGET = 10.0`.
- `PRODUCT_BUNDLE_IDENTIFIER = org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier).watchkitapp` resolved from the iOS bundle base.
- `INFOPLIST_KEY_WKCompanionAppBundleIdentifier = org.reactjs.native.example.DiveMobile`.

## Documentation Model

Repository docs should no longer present the retired standalone watch workspace as the active watch app workspace. They should explain that watchOS code is under `apps/mobile/ios/DiveWatchApp` and built from the mobile iOS project.

The retired standalone watch workspace should not remain as an active workspace package after the migration. If any old standalone files remain temporarily, docs must call them retired and not part of active builds.

## Verification

Required automated gates:

- `yarn workspace @repo/mobile test --runTestsByPath __tests__/watch-connectivity-sync.test.tsx __tests__/watch-sync-message-validation.test.ts __tests__/use-dive-logbook-queries.test.ts --runInBand`
- `yarn mobile:typecheck`
- `yarn watch:build`
- `yarn codex:check`

Best-effort native gate:

- `yarn ios:build`

Known environment risk:

- Current local Xcode/Simulator state may fail iOS storyboard compilation with `iOS 26.5 Platform Not Installed`.
- That failure should be reported separately from watch target project structure and Swift compile errors.
