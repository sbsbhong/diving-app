# Watch 앱 구조

## 요약

`apps/watch-ios`는 현재 동작하는 SwiftUI watchOS 앱을 담는다. Xcode project는 `DiveWatchApp.xcodeproj`이고, 확인된 target과 scheme은 모두 `DiveWatchApp`이다.

## 현재 상태

현재 watch 앱 source는 `apps/watch-ios/DiveWatchApp`이다. App entry는 `DiveSessionStore`를 만들고 `HomeView`를 render한다.

`apps/watch-ios/Sources`에는 이전 standalone Swift source가 남아 있다. 현재 `DiveWatchApp.xcodeproj`는 이 `Sources` path를 참조하지 않으므로, Xcode project가 바뀌기 전까지 컴파일되는 앱 코드로 취급하지 않는다.

## 상세

현재 source 영역은 다음과 같다.

- `Models`: `DepthSample`, `DiveSession`, `DiveSessionSummary`, sync payload helper, dive mode, water condition, sync status, pre-dive plan, location type.
- `Sensors`: `DepthSensorProvider`, `MockDepthSensorProvider`, `RealDepthSensorProvider`.
- `Recording`: `DiveSessionRecorder`.
- `Storage`: `DiveSessionStore`.
- `Sync`: `WatchSyncEnvelope`, `WatchSyncTransport`.
- `Views`: home, recording, summary, saved session, detail view, formatter, 재사용 watch UI.

현재 watch flow는 다음과 같다.

1. Home에서 mode, gas label, site, buddy, quick note, planned max depth 같은 pre-dive metadata를 입력한다.
2. `RecordingView`가 나타나면 기록이 자동으로 시작되고, 현재 `MockDepthSensorProvider`를 사용한다.
3. Recorder는 sample, current depth, max depth, water temperature, elapsed time, ascent-rate reminder state, safety-stop assistant state를 추적한다.
4. 기록을 끝내면 post-dive rating, exertion, visibility, water condition, note field가 있는 summary를 보여준다.
5. 저장된 세션은 `UserDefaults`의 `savedDiveSessions` key에 저장되고 list/detail view에서 확인한다.
6. `DiveSessionStore`는 저장 시 `WatchSyncTransport`를 통해 `DiveSession.syncMessageData()` 결과를 WatchConnectivity `transferUserInfo` envelope로 enqueue한다.

`RealDepthSensorProvider`는 향후 `CMWaterSubmersionManager` 지원을 위한 자리 표시자다. 실제 underwater sensor behavior, haptics, wet control, readability는 지원되는 Apple Watch hardware에서 수동 검증이 필요하다.

watch 앱은 local Swift model과 동기화 가능한 JSON을 만들기 위한 `DiveSession.syncMessageData` encoder를 갖는다. WatchConnectivity 전송 PoC는 이 encoder 결과를 base64 payload로 감싸며, generated Swift contract를 직접 compile하지 않는다. `packages/contracts/generated/swift` 아래 generated Swift contract는 현재 Xcode project에서 참조되지 않는다.

WatchConnectivity 전송 PoC는 build 가능한 code boundary이며, 실제 paired iPhone 전달, entitlement, background delivery, retry behavior는 아직 지원 hardware에서 검증되지 않았다.

## 관련 문서

- [[architecture/sync-flow]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
- [[design/mobile-watch-ui-language]]
- [[questions/open-questions]]
