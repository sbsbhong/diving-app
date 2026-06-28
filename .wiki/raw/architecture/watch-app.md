Source URL: .wiki/wiki/architecture/watch-app.md
Collected: 2026-06-28
Published: Unknown

# Pre-Karpathy: Watch 앱 구조

# Watch 앱 구조

## 요약

`apps/mobile/ios/DiveWatchApp`는 현재 동작하는 SwiftUI watchOS companion 앱 source를 담는다. Xcode project는 `apps/mobile/ios/DiveMobile.xcodeproj`이고, watch target과 scheme은 `DiveWatchApp`이다.

## 현재 상태

현재 watch 앱 source는 `apps/mobile/ios/DiveWatchApp`이다. App entry는 `DiveSessionStore`를 만들고 `HomeView`를 render한다.

Watch 앱은 더 이상 별도 Yarn workspace나 standalone Xcode project를 사용하지 않는다. iPhone app 설치와 함께 배포될 companion embed 구조를 유지하기 위해 watch target membership은 `apps/mobile/ios/DiveMobile.xcodeproj`에서 관리한다.

## 상세

현재 source 영역은 다음과 같다.

- `Models`: `DepthSample`, `DiveSession`, `DiveSessionSummary`, sync payload helper, dive mode, water condition, sync status, pre-dive plan, location type.
- `Sensors`: `DepthSensorProvider`, `MockDepthSensorProvider`, `RealDepthSensorProvider`.
- `Recording`: `DiveSessionRecorder`.
- `Storage`: `DiveSessionStore`.
- `Sync`: `WatchSyncEnvelope`, `WatchSyncTransport`.
- `Views`: home, recording, summary, saved session, detail view, formatter, 재사용 watch UI.

현재 watch flow는 다음과 같다.

1. Home에서는 선택 가능한 입력을 dive type selector 하나로 제한하고, active mode는 `scuba`와 `freedive`만 둔다. 바로 `Start Dive`를 누를 수 있다. `Dive Plan`을 누르면 별도 setup 화면에서 site, buddy, quick note, planned max depth를 수정하고, scuba plan에서만 gas label을 보여준다. 모바일에서 전달된 실행하지 않은 planned dive를 선택해 현재 plan에 반영한 뒤 `Start Dive`로 recording을 시작한다. 사용자가 선택한 mode는 `UserDefaults`에 선호 다이빙 형태로 저장되고, 아직 선택한 적이 없거나 제거된 legacy mode를 읽으면 `.scuba`를 fallback으로 사용한다.
2. Home은 `RealDepthSensorProvider`를 통해 자동 시작을 감시한다. 수심 sample이 3m 이상이면 현재 pre-dive plan으로 `RecordingView`를 열어 기록을 시작한다. 이 동작은 기록 편의를 위한 trigger이며 safety 판단이 아니다.
3. `RecordingView`가 나타나면 기록이 자동으로 시작되고, 현재 `MockDepthSensorProvider`를 사용한다.
4. Recorder는 sample, current depth, max depth, water temperature, elapsed time, ascent-rate reminder state, safety-stop assistant state를 추적한다. Recording 화면은 scuba일 때 air scuba reference assistant 문구와 ascent/safety-stop 참고 상태를 보여주고, freedive일 때 세션 시간, 최대 수심, 반복/훈련 맥락 중심의 참고 화면을 보여준다.
5. 기록을 끝내면 post-dive rating, exertion, visibility를 별점 컨트롤로 남기고, water condition과 note field가 있는 summary를 보여준다.
6. 저장된 세션은 `UserDefaults`의 `savedDiveSessions` key에 저장되고 list/detail view에서 확인한다.
7. `DiveSessionStore`는 저장 시 `WatchSyncTransport`를 통해 `DiveSession.syncMessageData()` 결과를 WatchConnectivity `transferUserInfo` envelope로 enqueue한다. `WCSession.isReachable`이면 같은 payload를 `sendMessage`로도 보낸다. activation 완료와 reachability 변경 시 아직 `synced`가 아닌 저장 세션을 다시 enqueue한다. WatchConnectivity transfer 오류가 나면 저장된 세션의 `syncStatus`를 `failed`로 갱신하고, 모바일 앱이 repository import 뒤 보낸 `watchSyncAcknowledgement`를 받으면 `synced`로 갱신한다.
8. 모바일 계획에서 시작한 세션은 `plan-<localId>` tag로 source plan을 보존하고, 저장 후 해당 planned dive를 watch Home에서 숨긴다.

모바일에서 전달된 planned dive는 `watchPlannedDives` envelope의 JSON으로 수신된다. `WatchSyncTransport`는 `didReceiveApplicationContext`와 `didReceiveMessage` 양쪽에서 이를 처리하고, `WCSession` activation 완료 시 `receivedApplicationContext`도 다시 읽는다. `DiveSessionStore`는 `savedWatchPlannedDives`와 `executedWatchPlanIds`를 `UserDefaults`에 저장한다. 실행 전 planned dive는 Home이 아니라 Dive Plan setup 화면에서 선택하며, 실행된 plan id는 이후 planned dive 목록에서 제외한다.

`RealDepthSensorProvider`는 향후 `CMWaterSubmersionManager` 지원을 위한 자리 표시자다. 실제 underwater sensor behavior, haptics, wet control, readability는 지원되는 Apple Watch hardware에서 수동 검증이 필요하다.

watch 앱은 local Swift model과 동기화 가능한 JSON을 만들기 위한 `DiveSession.syncMessageData` encoder를 갖는다. WatchConnectivity 전송 PoC는 이 encoder 결과를 base64 payload로 감싸며, generated Swift contract를 직접 compile하지 않는다. `packages/contracts/generated/swift` 아래 generated Swift contract는 현재 Xcode project에서 참조되지 않는다.

WatchConnectivity 전송 PoC는 build 가능한 code boundary이며, companion embed 구조도 Xcode project에 포함되어 있다. Watch local session status는 `didFinishUserInfoTransfer`의 오류 callback과 모바일 import acknowledgement 수신을 통해 갱신된다. 활성 simulator에서 watch-to-mobile import와 mobile-to-watch acknowledgement는 확인됐지만, entitlement, background delivery, 장시간 retry behavior, 실기기 paired iPhone 전달은 아직 지원 hardware에서 검증되지 않았다.

Watch `DiveMode`는 현재 `scuba`와 `freedive` 두 모드로 축소됐다. Scuba recording 화면은 현재 수심, 경과 시간, 최대 수심, 상승 속도 참고값, 세이프티 스톱 참고 상태, 비인증 참고 문구를 보여준다. Freedive recording 화면은 현재 수심, 세션 시간, 최대 수심, 반복/훈련 맥락을 중심으로 구성하고 scuba-only gas/safety-stop 정보는 숨긴다.

## 관련 문서

- [[architecture/sync-flow]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
- [[design/mobile-watch-ui-language]]
- [[questions/open-questions]]
