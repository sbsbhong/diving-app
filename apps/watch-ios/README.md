# DiveWatchApp

Minimal standalone SwiftUI watchOS PoC for recording mock dive sessions.

## Run
Open the Xcode project:

```bash
open apps/watch-ios/DiveWatchApp.xcodeproj
```

Select the `DiveWatchApp` scheme and a watchOS Simulator, then run.

CLI build check:

```bash
xcodebuild -project apps/watch-ios/DiveWatchApp.xcodeproj -scheme DiveWatchApp -destination 'generic/platform=watchOS Simulator' -derivedDataPath /private/tmp/DiveWatchAppDerivedData CODE_SIGNING_ALLOWED=NO build
```

## Structure
- `DiveWatchApp/DiveWatchApp.swift`: app entry point
- `DiveWatchApp/Models`: `DepthSample`, `DiveSession`, `DiveSessionSummary`
- `DiveWatchApp/Sensors`: mock and real sensor provider interfaces
- `DiveWatchApp/Recording`: live session recorder view model
- `DiveWatchApp/Storage`: UserDefaults-backed session store
- `DiveWatchApp/Views`: Home, recording, summary, saved sessions, and detail screens

## Sensor Swap Point
The app currently creates `DiveSessionRecorder(sensorProvider: MockDepthSensorProvider())` in `DiveWatchApp/Views/RecordingView.swift`.
Replace that provider with `RealDepthSensorProvider` after implementing CoreMotion `CMWaterSubmersionManager` support.
