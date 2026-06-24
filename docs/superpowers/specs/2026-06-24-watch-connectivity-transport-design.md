# WatchConnectivity Transport PoC Design

## Goal

Add the first WatchConnectivity transport boundary between the watchOS app and the React Native mobile app without changing bundle IDs, signing, entitlements, or embedding structure. The result should compile and let the mobile app import a received watch sync JSON payload through the existing runtime contract validator.

## Scope

This is a transport proof of concept, not a paired-device release claim.

In scope:

- Watch app activates `WCSession` when the session store is created.
- Watch app enqueues a saved `DiveSession` as a property-list `transferUserInfo` envelope.
- The envelope carries the existing `DiveSession.syncMessageData()` JSON as base64.
- iOS native code activates `WCSession` during app startup.
- iOS native code receives `didReceiveUserInfo`, decodes the base64 JSON, buffers it in memory, and emits it to React Native.
- Mobile JS drains pending native payloads, subscribes to new payload events, validates JSON with `parseWatchSyncMessageJson`, and imports valid messages through `DiveLogRepository.importWatchMessages`.
- Tests cover the JS receiver/import path.
- Wiki pages record that this is a PoC boundary and that real pairing/background/retry behavior remains unverified.

Out of scope:

- Bundle ID changes.
- Signing team, provisioning, associated app group, or entitlement changes.
- Embedding the watch app into the iOS mobile app target.
- Durable native inbox storage.
- Retry UX or manual resend UI.
- Supabase, auth, cloud backup, or remote sync status.
- Claiming simulator validation proves paired-device delivery.

## Architecture

The watch side owns only outbound enqueue. It serializes the already-existing sync contract JSON and wraps it in a small WatchConnectivity envelope:

```swift
[
  "kind": "watchSyncMessage",
  "payloadBase64": "...",
  "localSessionId": "...",
  "sentAt": 1781354000.0
]
```

The mobile native side owns transport reception only. It does not parse the sync contract itself; it only decodes the envelope and forwards raw JSON strings to JS. This keeps the contract validation in one mobile JS path and avoids duplicating schema checks in Swift.

The mobile JS side owns contract validation and repository import. A provider under `QueryClientProvider` drains pending native payloads on mount, subscribes to native events, validates every JSON string, imports valid messages, updates the React Query list cache, and invalidates the logbook query scope.

## Data Flow

1. User saves a watch session.
2. `DiveSessionStore.save(_:)` asks `WatchSyncTransport` to enqueue the session.
3. `WatchSyncTransport` encodes `session.syncMessageData()` and sends the base64 envelope with `WCSession.transferUserInfo`.
4. iOS `WatchConnectivityInbox` receives `didReceiveUserInfo`.
5. The inbox decodes `payloadBase64` into `payloadJson`, buffers it, and posts an in-process notification.
6. `WatchConnectivityModule` exposes pending payloads and events to React Native.
7. `WatchConnectivitySyncProvider` validates each payload JSON and imports valid messages.
8. The logbook React Query cache is refreshed for the configured repository.

## Error Handling

- If watch JSON encoding or enqueue preparation fails, the saved session is marked `failed`.
- If `WCSession` is unavailable, inactive, or not paired, the watch still saves locally and keeps the sync status as `pending`.
- If mobile native receives an invalid envelope or invalid base64, it drops that envelope.
- If mobile JS receives invalid contract JSON, it logs a warning and does not import.
- The native inbox is memory-only. Payloads received before JS starts are retained only while the app process remains alive.

## Testing

Automated coverage focuses on the JS behavior because native transport requires device pairing and project-level build gates.

- Add a Jest test that drains a pending native payload fixture and verifies repository import plus React Query cache update.
- Add a Jest test that receives an invalid contract payload and verifies no import occurs.
- Run the focused mobile Jest tests.
- Run `yarn mobile:typecheck`.
- Run `yarn watch:build`.
- Run `yarn codex:check`.

## Verification Boundary

Passing automated checks means the code compiles and the JS import path is exercised. It does not prove actual paired Apple Watch delivery, background delivery, retry behavior, or entitlement correctness on hardware.
