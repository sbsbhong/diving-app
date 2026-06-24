# @repo/mobile

React Native mobile app and iOS/watchOS companion owner for the dive-app monorepo.

This app tracks React Native `0.85.3`, the latest official `Active` support line checked on 2026-06-13. React Native does not publish an LTS label; treat `0.85.x` as the current conservative support target until the repo intentionally moves to a newer active line.

This app was initialized from the React Native CLI template and then adapted for this Yarn 1 workspace. It follows the local RN UI guide:

- `src/App.tsx` is the app UI entry.
- `src/providers.tsx` owns top-level providers.
- `src/components/navigation` is the navigation boundary.
- `src/components/ui` contains reusable UI primitives and composed components.
- `src/screens/<area>/screen.tsx` contains route-level screen containers.
- `ios/DiveMobile.xcodeproj` owns the iPhone app target `DiveMobile` and the embedded watchOS companion target `DiveWatchApp`.
- `ios/DiveWatchApp` contains the SwiftUI watchOS companion source.

## Scripts

From the repo root:

```bash
yarn workspace @repo/mobile start
yarn workspace @repo/mobile typecheck
yarn workspace @repo/mobile test
yarn workspace @repo/mobile lint
yarn workspace @repo/mobile ios
yarn workspace @repo/mobile android
yarn workspace @repo/mobile watch:build
yarn workspace @repo/mobile watch:list
yarn workspace @repo/mobile watch:ui:check
```

Root aliases:

```bash
yarn mobile:typecheck
yarn ios:build
yarn watch:build
```

## iOS Setup

The iOS project requires CocoaPods before native CLI builds can pass:

```bash
yarn workspace @repo/mobile ios:pods
yarn ios:build
```

`ios:build` uses `CODE_SIGNING_ALLOWED=NO` and a temp DerivedData path. It validates the CocoaPods workspace and the generated React/Codegen pod artifacts before building, then runs `pod install` when those files are missing.

For Xcode builds, open the CocoaPods workspace, not the app project:

```bash
yarn workspace @repo/mobile ios:xcode
```

Opening `ios/DiveMobile.xcodeproj` directly can leave the Swift `AppDelegate` without the React pod modules (`React`, `React_RCTAppDelegate`, and `ReactAppDependencyProvider`).

## watchOS Companion

The watch app is embedded through the mobile iOS project instead of a standalone workspace. Keep watch source under `ios/DiveWatchApp`, and update target membership in `ios/DiveMobile.xcodeproj`.

The watch-only CLI build uses the project directly:

```bash
yarn workspace @repo/mobile watch:build
```

The watch target is not a separate Yarn workspace. Do not recreate a standalone watch workspace unless the project deliberately reverses this companion ownership decision.

## Android Setup

Android builds require Android Studio, Android SDK, `ANDROID_HOME`, and an emulator or connected device. The Gradle files are adjusted for this monorepo's hoisted root `node_modules`.

## Current Scope

The app currently includes local persistent Logbook/Planbook/settings storage, watch fixture import, runtime watch sync JSON validation, and a WatchConnectivity receiver PoC. It does not implement auth, Supabase/cloud backup, verified paired-device delivery, or production dive-computer behavior.
