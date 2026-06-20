# Watch App Architecture

## Summary

`apps/watch-ios` contains the active SwiftUI watchOS app. The Xcode project is `DiveWatchApp.xcodeproj`; the confirmed target and scheme are both `DiveWatchApp`.

## Current state

The active watch app source is `apps/watch-ios/DiveWatchApp`. The app entry creates a `DiveSessionStore` and renders `HomeView`.

`apps/watch-ios/Sources` contains earlier standalone Swift source files. Current project inspection found no references from `DiveWatchApp.xcodeproj` to that `Sources` path, so it should not be treated as compiled app code unless the Xcode project is changed.

## Details

Active source areas:

- `Models`: `DepthSample`, `DiveSession`, `DiveSessionSummary`, sync payload helpers, dive mode, water condition, sync status, pre-dive plan, and location types.
- `Sensors`: `DepthSensorProvider`, `MockDepthSensorProvider`, and `RealDepthSensorProvider`.
- `Recording`: `DiveSessionRecorder`.
- `Storage`: `DiveSessionStore`.
- `Views`: home, recording, summary, saved sessions, detail views, formatters, and reusable watch UI.

Current watch flow:

1. Home collects pre-dive metadata: mode, gas label, site, buddy, quick note, and planned max depth.
2. Recording starts automatically when `RecordingView` appears and currently uses `MockDepthSensorProvider`.
3. Recorder tracks samples, current depth, max depth, water temperature, elapsed time, ascent-rate reminder state, and safety-stop assistant state.
4. Ending a recording shows a summary with post-dive rating, exertion, visibility, water condition, and note fields.
5. Saved sessions are persisted to `UserDefaults` under `savedDiveSessions` and shown in list/detail views.

`RealDepthSensorProvider` is a placeholder for future `CMWaterSubmersionManager` support. Real underwater sensor behavior, haptics, wet controls, and readability require manual validation on supported Apple Watch hardware.

The watch app has local Swift models and a `DiveSession.syncMessageData` encoder for sync-ready JSON. The generated Swift contracts under `packages/contracts/generated/swift` are not referenced by the current Xcode project.

## Related pages

- [[architecture/sync-flow]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
- [[questions/open-questions]]
