Source URL: apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift; apps/mobile/__tests__/watch-connectivity-native-source.test.ts; user request
Collected: 2026-06-28
Published: 2026-06-28

# Planned dive application context delivery

User report:

`flushPendingPlannedDivesContextOnMainQueue`의 `connectivitySession.transferUserInfo(context)`에서 breakpoint가 걸린다.

Relevant source paths:

- `apps/mobile/ios/DiveMobile/WatchConnectivityInbox.swift`
- `apps/mobile/__tests__/watch-connectivity-native-source.test.ts`

Previous planned-dive flush path:

```swift
if connectivitySession.isReachable {
  connectivitySession.sendMessage(context, replyHandler: nil) { _ in }
}
connectivitySession.transferUserInfo(context)

do {
  try connectivitySession.updateApplicationContext(context)
} catch {
  pendingPlannedDivesJson = plannedDivesJson
}
```

Updated planned-dive flush path:

```swift
if connectivitySession.isReachable {
  connectivitySession.sendMessage(context, replyHandler: nil) { _ in }
}

do {
  try connectivitySession.updateApplicationContext(context)
} catch {
  pendingPlannedDivesJson = plannedDivesJson
}
```

The planned dive list is latest mobile state, not an event history. Mobile still persists the latest planned-dive JSON and retries after activation, reachability, and watch-state changes. When the watch is reachable, mobile also sends the same context with `sendMessage` as the live fast path. The durable latest-state channel is `updateApplicationContext`; mobile does not enqueue planned-dive snapshots through `transferUserInfo(context)`.

This does not change watch-to-mobile session transfer or import acknowledgement behavior. Watch session payloads and mobile import acknowledgements may still use queued `transferUserInfo` envelopes where event-style delivery is appropriate.
