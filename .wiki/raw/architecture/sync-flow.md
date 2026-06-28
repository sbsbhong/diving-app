Source URL: .wiki/wiki/architecture/sync-flow.md
Collected: 2026-06-28
Published: Unknown

# Pre-Karpathy: 동기화 흐름 구조

# 동기화 흐름 구조

## 요약

현재 동기화 모델은 계약을 먼저 정의하는 방식이다. `packages/contracts`가 watch sync message를 정의하고, watch 앱은 동기화 가능한 JSON을 encode한 뒤 WatchConnectivity `transferUserInfo` envelope로 enqueue한다. 양쪽 앱이 reachable이면 같은 envelope를 `sendMessage`로도 보내 활성 상태의 수신 지연을 줄인다. 모바일 iOS native code는 WatchConnectivity userInfo와 message를 원시 JSON payload로 복원해 durable inbox에 저장하고 React Native로 전달한다. 모바일 JS는 payload를 실행 시점에 검증한 뒤 `DiveLogEntry`로 변환해 영구 저장 repository에 import하고, import가 끝난 payload는 native inbox에서 제거하면서 watch에 `watchSyncAcknowledgement`를 돌려보낸다. 반대 방향으로는 모바일의 실행하지 않은 planned dive 목록을 `watchPlannedDives` envelope로 watch companion에 전달해 watch Dive Plan setup 화면에서 선택해 recording을 시작할 수 있게 한다.

## 현재 상태

Contract source file은 다음과 같다.

- `packages/contracts/schemas/watch-sync-message.schema.json`
- `packages/contracts/schemas/watch-session.schema.json`
- `packages/contracts/schemas/watch-depth-sample.schema.json`

Generated output은 다음과 같다.

- `packages/contracts/generated/typescript/index.ts`
- `packages/contracts/generated/swift/WatchContracts.swift`

`WatchSyncMessage` type은 `sessionCreated`, `sessionUpdated`, `sessionEnded`를 지원한다. `WatchSession`은 `localSessionId`, `startedAt`, `samples`를 require하고, 대부분의 metadata는 optional이다. 모바일 계획에서 시작한 watch session은 `sourcePlanLocalId`와 `planTitle`을 포함해 import 시점에 원본 계획과 다시 연결할 수 있다.

## 상세

Session contract가 지원하는 값은 다음과 같다.

- dive mode: `scuba`, `freedive`
- gas label, site id/name, buddy, gear, tag, note
- source plan local id와 plan title
- rating, perceived exertion, visibility rating, water condition
- sync status: `pending`, `synced`, `failed`
- entry/exit location placeholder
- Unix-second 기반 시작/종료 timestamp
- max depth, average depth, water temperature, depth sample

Depth sample은 `localSessionId`, Unix-second `timestamp`, `depthMeters`를 require한다. `pressureKPa`와 `waterTemperatureCelsius`는 optional이다.

Mobile import 동작은 다음과 같다.

- `src/types/dive-session.ts`는 generated TypeScript contract type을 import한다.
- `src/utils/watch-sync-message-validation.ts`는 원시 JSON string이나 `unknown` value가 `WatchSyncMessage` contract를 만족하는지 실행 시점에 검증한다.
- `src/utils/watch-fixtures.ts`는 `packages/contracts/fixtures/metadata-rich-watch-sync-message.json`을 import하고 validator를 통과한 message만 앱 fixture로 export한다.
- `src/native/watch-connectivity.ts`는 iOS native `WatchConnectivityModule`에서 전달되는 raw JSON payload를 React Native event와 drain method로 받고, 무효 payload drop acknowledge와 import 완료 acknowledge를 구분한다. 또한 planned dive update와 linked watch status query를 노출한다.
- `src/states/watch-connectivity-sync.tsx`는 pending native payload를 drain하고 새 event를 구독한 뒤, validator를 통과한 payload를 repository import로 넘긴다. 저장에 성공한 WatchConnectivity 수신 항목은 mobile top-level `syncStatus`를 `synced`로 보정하고, raw watch capture 안의 원본 `session.syncStatus`는 보존한다. 새 entry를 자동 import한 경우 root navigation으로 imported entry를 전달해 safe-area 안쪽 toast를 띄우고, 사용자는 toast의 로그 작성 action으로 해당 Logbook detail route를 열거나 닫을 수 있다. Settings opt-in이 켜져 있고 앱이 foreground가 아니면 Notifee local notification도 요청한다.
- `watch-session-to-dive-log-entry.ts`는 `WatchSession`을 watch source `DiveLogEntry`로 변환한다.
- 모바일 계획에서 시작한 watch session은 import 중 `sourcePlanLocalId`로 원본 `DivePlan`을 조회한다. 찾은 계획의 title, site, buddy, gear, tags, notes, dive mode, gas label, training metadata를 imported log의 manual overlay에 합치고, 원본 계획은 `status: completed`, `completedAt`, `convertedLogLocalId`를 저장한다. 계획 최대 수심과 계획 시간은 실제 측정값이 아니므로 watch capture의 실측 summary를 대체하지 않는다.
- `DiveLogRepository.importWatchMessages`는 validator를 통과해 typed `WatchSyncMessage[]`가 된 payload를 import한다.
- Import는 `localSessionId`와 `endedAt` 기반 key로 deduplicate하고, 기존 manual/mobile field와 `importedAt`을 보존하며, 누락된 watch 동기화 상태를 `pending`으로 기본값 처리하고, 최신 항목이 먼저 오도록 정렬한다.
- `useDiveLogbook`은 React Query hook을 통해 repository list/save/delete/import mutation을 호출한다.
- `useDivePlans`는 아직 완료되지 않았고 로그로 전환되지 않은 `DivePlan`을 watch에 전달한다. `draft`와 `planned` 상태는 watch Home의 실행 전 계획 후보가 되고, `completed`나 `convertedLogLocalId`가 있는 계획은 제외된다. 모바일 payload는 plan local id, title, site, dive mode, entry style, planned timestamp, planned max depth, planned duration, gas label, buddy ids, gear ids, tags, objective/training focus/notes를 합친 notes를 포함한다.

WatchConnectivity PoC 동작은 다음과 같다.

- Watch app의 `WatchSyncTransport`는 `WCSession`을 activate하고, 저장된 `DiveSession`의 `syncMessageData()` 결과를 base64로 감싼 property-list userInfo를 `transferUserInfo`로 enqueue한다. `WCSession.isReachable`이면 같은 payload를 `sendMessage`로도 보낸다. activation 완료와 reachability 변경 시 아직 `synced`가 아닌 저장 세션을 다시 enqueue한다. WatchConnectivity가 user info transfer 오류를 알리면 watch local `DiveSessionStore`의 저장 세션 `syncStatus`를 `failed`로 갱신하되, 이미 `synced`인 세션을 뒤늦은 failed 결과로 내리지 않는다. 전송 완료 자체는 모바일 import 완료가 아니므로 `synced`로 바꾸지 않는다.
- iOS app의 `WatchConnectivityInbox`는 앱 시작 시 `WCSession`을 activate하고, `didReceiveUserInfo`와 `didReceiveMessage`에서 `kind: watchSyncMessage`와 `payloadBase64` envelope를 해독한다.
- Native inbox는 pending payload를 `UserDefaults`에 저장하고 payload별 `payloadId`를 붙인다. `WatchConnectivityModule`은 `drainPendingPayloads`, `DiveWatchSyncPayloadReceived` event, `acknowledgePayloads`, `acknowledgeImportedPayloads` method로 JS에 전달한다.
- JS provider는 repository import 성공 시 `acknowledgeImportedPayloads`를 호출해 mobile inbox에서 payload를 제거하고 watch에 `watchSyncAcknowledgement`를 보낸다. iOS native acknowledgement도 `transferUserInfo`를 기본으로 쓰고, watch가 reachable이면 `sendMessage`로도 보낸다. Watch transport는 acknowledgement를 `didReceiveUserInfo`와 `didReceiveMessage` 양쪽에서 처리한다. Contract validation 실패처럼 재시도해도 의미가 없는 payload는 mobile inbox에서만 acknowledge한다. Repository save/import 실패는 acknowledge하지 않아 앱 재시작 뒤 다시 drain될 수 있다.
- iOS app의 `WatchConnectivityInbox.updatePlannedDives`는 planned dive JSON을 `watchPlannedDives` application context로 갱신하고, watch가 reachable이면 같은 context를 `sendMessage`로도 보낸다. `WCSession` activation 전이나 일시 실패 시 최신 planned dive JSON을 보관했다가 activation 완료, reachability 변경, watch state 변경 뒤 다시 application context와 queued user info fallback으로 flush한다. Watch app의 `WatchSyncTransport`는 application context와 message 양쪽에서 planned dives를 decode해 `DiveSessionStore`로 넘기며, activation 완료 시 이미 저장된 `receivedApplicationContext`도 한 번 읽어 watch 앱 시작 시점을 놓치지 않게 한다.
- 활성 iPhone/watch simulator 조합에서는 watch pending 세션의 mobile import, mobile durable inbox 비움, watch `syncStatus: "synced"` acknowledgement까지 확인됐다. 이 경로는 compile과 활성 simulator import behavior를 확인하기 위한 PoC이며, background delivery가 실제 기기에서 검증됐다는 뜻은 아니다.

Watch sync notification 동작은 다음과 같다.

- `src/notifications/watch-sync-notification-service.ts`는 Notifee permission request, local notification display, notification press data를 다룬다.
- Settings의 watch sync notification opt-in은 사용자가 켤 때 permission을 요청하고, 거부되면 preference를 켜지 않는다.
- Notification은 `WatchConnectivitySyncProvider`가 payload를 local repository에 저장하고 imported acknowledge까지 처리한 뒤 best-effort로 요청한다. Notification 실패는 repository import나 native inbox acknowledgement를 되돌리지 않는다.
- Foreground 사용자는 local notification 대신 사용자가 닫기 전까지 유지되는 in-app toast를 본다.
- Notification 문구는 local repository 저장 결과만 뜻하며 Supabase upload, cloud backup, certified dive computer data verification을 뜻하지 않는다.

현재 비어 있는 부분은 다음과 같다.

- WatchConnectivity entitlement, background delivery, 장시간 retry, 실기기 paired delivery 검증 없음. Companion embed 구조는 `apps/mobile/ios/DiveMobile.xcodeproj`에 포함되어 있고 활성 simulator 전송은 확인됐지만, 실제 설치/전송은 아직 지원 hardware에서 검증되지 않았다.
- Durable native inbox, reachable live message, acknowledgement 기반 재처리 경로가 있고, Logbook import action은 pending native inbox를 수동 drain한다. Planned dive context는 mobile-to-watch로 전달되지만 사용자-facing retry status와 backoff policy는 아직 없다.
- Watch sync notification code boundary와 Settings opt-in은 구현됐지만, background/killed 상태의 실제 OS delivery와 local notification 표시가 physical paired device에서 검증되지는 않았다.
- Supabase upload 없음.
- 인증된 사용자 연결 없음.
- Generated Swift contract는 현재 watch target에 compile되지 않음.

## 관련 문서

- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/supabase]]
- [[domains/dive-log]]
