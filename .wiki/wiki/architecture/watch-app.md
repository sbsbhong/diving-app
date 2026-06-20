# Watch App Architecture

## Summary

`apps/watch-ios`는 active SwiftUI watchOS app을 담는다. Xcode project는 `DiveWatchApp.xcodeproj`이고, 확인된 target과 scheme은 모두 `DiveWatchApp`이다.

## Current state

Active watch app source는 `apps/watch-ios/DiveWatchApp`이다. App entry는 `DiveSessionStore`를 만들고 `HomeView`를 render한다.

`apps/watch-ios/Sources`에는 earlier standalone Swift source가 남아 있다. 현재 `DiveWatchApp.xcodeproj`는 이 `Sources` path를 참조하지 않으므로, Xcode project가 바뀌기 전까지 compiled app code로 취급하지 않는다.

## Details

Active source area는 다음과 같다.

- `Models`: `DepthSample`, `DiveSession`, `DiveSessionSummary`, sync payload helper, dive mode, water condition, sync status, pre-dive plan, location type.
- `Sensors`: `DepthSensorProvider`, `MockDepthSensorProvider`, `RealDepthSensorProvider`.
- `Recording`: `DiveSessionRecorder`.
- `Storage`: `DiveSessionStore`.
- `Views`: home, recording, summary, saved session, detail view, formatter, reusable watch UI.

현재 watch flow는 다음과 같다.

1. Home에서 mode, gas label, site, buddy, quick note, planned max depth 같은 pre-dive metadata를 입력한다.
2. `RecordingView`가 나타나면 recording이 자동으로 시작되고, 현재 `MockDepthSensorProvider`를 사용한다.
3. Recorder는 sample, current depth, max depth, water temperature, elapsed time, ascent-rate reminder state, safety-stop assistant state를 추적한다.
4. Recording을 끝내면 post-dive rating, exertion, visibility, water condition, note field가 있는 summary를 보여준다.
5. Saved session은 `UserDefaults`의 `savedDiveSessions` key에 persist되고 list/detail view에서 확인한다.

`RealDepthSensorProvider`는 future `CMWaterSubmersionManager` support를 위한 placeholder다. Real underwater sensor behavior, haptics, wet control, readability는 supported Apple Watch hardware에서 manual validation이 필요하다.

watch app은 local Swift model과 sync-ready JSON을 만들기 위한 `DiveSession.syncMessageData` encoder를 갖는다. `packages/contracts/generated/swift` 아래 generated Swift contract는 현재 Xcode project에서 참조되지 않는다.

## Related pages

- [[architecture/sync-flow]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
- [[questions/open-questions]]
