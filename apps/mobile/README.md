# @repo/mobile

React Native mobile app for the dive-app monorepo.

This app tracks React Native `0.85.3`, the latest official `Active` support line checked on 2026-06-13. React Native does not publish an LTS label; treat `0.85.x` as the current conservative support target until the repo intentionally moves to a newer active line.

This app was initialized from the React Native CLI template and then adapted for this Yarn 1 workspace. It follows the local RN UI guide:

- `src/App.tsx` is the app UI entry.
- `src/providers.tsx` owns top-level providers.
- `src/components/navigation` is the navigation boundary.
- `src/components/ui` contains reusable UI primitives and composed components.
- `src/screens/<area>/screen.tsx` contains route-level screen containers.

## Scripts

From the repo root:

```bash
yarn workspace @repo/mobile start
yarn workspace @repo/mobile typecheck
yarn workspace @repo/mobile test
yarn workspace @repo/mobile lint
yarn workspace @repo/mobile ios
yarn workspace @repo/mobile android
```

Root aliases:

```bash
yarn mobile:typecheck
yarn ios:build
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

## Android Setup

Android builds require Android Studio, Android SDK, `ANDROID_HOME`, and an emulator or connected device. The Gradle files are adjusted for this monorepo's hoisted root `node_modules`.

## Current Scope

The initial screen is scaffold-only. It does not implement watch sync, dive log persistence, auth, cloud backup, or production dive-computer behavior.
