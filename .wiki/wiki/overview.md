# Project Overview

## Summary

`diving-app` is a Yarn 1 and Turborepo monorepo for a recreational dive logging companion. The current implementation combines a bare React Native mobile app, a SwiftUI watchOS app, shared watch sync contracts, and an unused shared utilities package.

## Current state

The app is not a certified dive computer, decompression computer, medical device, or life-support system. Current product surfaces focus on watch-captured session recording, local review, mobile logbook previews, planning reminders, and memory/share previews.

The active workspaces are:

- `apps/mobile`: React Native `0.85.3` app with custom tab navigation, local in-memory logbook state, watch fixture import, planning reminders, and memory preview screens.
- `apps/watch-ios`: SwiftUI watchOS app in `DiveWatchApp.xcodeproj` with target and scheme `DiveWatchApp`.
- `packages/contracts`: JSON Schema source of truth for watch sync messages, with generated TypeScript and Swift outputs.
- `packages/shared-utils`: reserved empty shared workspace.

There is no implemented Supabase layer, authentication flow, cloud backup, production persistence on mobile, or WatchConnectivity bridge in the current code.

## Details

The watch app currently records with `MockDepthSensorProvider`. `RealDepthSensorProvider` is a placeholder for future `CMWaterSubmersionManager` work that must be manually validated on supported Apple Watch hardware before public release.

The mobile app imports generated TypeScript watch contract types and local watch fixture messages. Imported sessions stay in React state for the running app process; they are not persisted to a device database or server.

The contracts intentionally omit `userId`. User association is expected to happen later on the mobile/server side after the mobile app owns authentication.

## Related pages

- [[architecture/monorepo]]
- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/sync-flow]]
- [[domains/safety-rules]]
