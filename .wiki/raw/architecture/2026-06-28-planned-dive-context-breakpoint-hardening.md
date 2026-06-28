Source URL: apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift; apps/mobile/__tests__/watch-connectivity-native-source.test.ts; /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/System/Library/Frameworks/WatchConnectivity.framework/Headers/WCError.h
Collected: 2026-06-28
Published: 2026-06-28

# Planned dive context breakpoint hardening

User report:

`flushPendingPlannedDivesContextOnMainQueue` still stops at `try connectivitySession.updateApplicationContext(context)` while switching between mobile app and watch app builds.

Relevant SDK error codes in `WCError.h` include:

- `WCErrorCodeSessionNotActivated`
- `WCErrorCodeDeviceNotPaired`
- `WCErrorCodeWatchAppNotInstalled`
- `WCErrorCodeInvalidParameter`
- `WCErrorCodePayloadTooLarge`
- `WCErrorCodePayloadUnsupportedTypes`
- `WCErrorCodeSessionInactive`
- `WCErrorCodeCompanionAppNotInstalled`

Relevant local causes:

- `updateApplicationContext` is imported into Swift as a throwing API. Even if the app catches the error, Xcode Swift Error breakpoints can stop on the throwing line.
- Mobile/watch rebuild or reinstall can temporarily leave WatchConnectivity state inconsistent. The source may see activation, pairing, and installed-watch state, but the actual application-context update can still be rejected by WatchConnectivity.
- The old planned-dive context included a fresh `updatedAt` on every flush, so the same planned-dive JSON could be treated as a new application context during activation, reachability, and watch-state callbacks.

Applied source behavior:

- Planned dive context update is called through the Objective-C `updateApplicationContext:error:` selector and captures `NSError` without creating a Swift throw.
- If the local `WCSession.applicationContext` already has the same planned-dive JSON, mobile skips rewriting the application context while still allowing reachable `sendMessage`.
- The native planned-dive status includes optional `lastContextErrorDomain`, `lastContextErrorCode`, and `lastContextErrorDescription` fields for diagnosis.
- Watch-to-mobile session transfer and mobile import acknowledgement still use queued `transferUserInfo` where event-style delivery is appropriate.
