# 동기화 흐름 구조

## 요약

현재 동기화 모델은 계약을 먼저 정의하는 방식이다. `packages/contracts`가 watch sync message를 정의하고, watch 앱은 동기화 가능한 JSON을 encode한 뒤 WatchConnectivity `transferUserInfo` envelope로 enqueue할 수 있다. 모바일 iOS native code는 WatchConnectivity userInfo를 원시 JSON payload로 복원해 React Native로 전달하고, 모바일 JS는 payload를 실행 시점에 검증한 뒤 `DiveLogEntry`로 변환해 영구 저장 repository에 import할 수 있다.

## 현재 상태

Contract source file은 다음과 같다.

- `packages/contracts/schemas/watch-sync-message.schema.json`
- `packages/contracts/schemas/watch-session.schema.json`
- `packages/contracts/schemas/watch-depth-sample.schema.json`

Generated output은 다음과 같다.

- `packages/contracts/generated/typescript/index.ts`
- `packages/contracts/generated/swift/WatchContracts.swift`

`WatchSyncMessage` type은 `sessionCreated`, `sessionUpdated`, `sessionEnded`를 지원한다. `WatchSession`은 `localSessionId`, `startedAt`, `samples`를 require하고, 대부분의 metadata는 optional이다.

## 상세

Session contract가 지원하는 값은 다음과 같다.

- dive mode: `scuba`, `freedive`, `snorkel`, `pool`, `unknown`
- gas label, site id/name, buddy, gear, tag, note
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
- `src/native/watch-connectivity.ts`는 iOS native `WatchConnectivityModule`에서 전달되는 raw JSON payload를 React Native event와 drain method로 받는다.
- `src/states/watch-connectivity-sync.tsx`는 pending native payload를 drain하고 새 event를 구독한 뒤, validator를 통과한 payload만 repository import로 넘긴다.
- `watch-session-to-dive-log-entry.ts`는 `WatchSession`을 watch source `DiveLogEntry`로 변환한다.
- `DiveLogRepository.importWatchMessages`는 validator를 통과해 typed `WatchSyncMessage[]`가 된 payload를 import한다.
- Import는 `localSessionId`와 `endedAt` 기반 key로 deduplicate하고, 기존 manual/mobile field와 `importedAt`을 보존하며, 누락된 watch 동기화 상태를 `pending`으로 기본값 처리하고, 최신 항목이 먼저 오도록 정렬한다.
- `useDiveLogbook`은 React Query hook을 통해 repository list/save/delete/import mutation을 호출한다.

WatchConnectivity PoC 동작은 다음과 같다.

- Watch app의 `WatchSyncTransport`는 `WCSession`을 activate하고, 저장된 `DiveSession`의 `syncMessageData()` 결과를 base64로 감싼 property-list userInfo를 `transferUserInfo`로 enqueue한다.
- iOS app의 `WatchConnectivityInbox`는 앱 시작 시 `WCSession`을 activate하고, `didReceiveUserInfo`에서 `kind: watchSyncMessage`와 `payloadBase64` envelope를 해독한다.
- Native inbox는 process memory 안에 pending payload를 보관하고, `WatchConnectivityModule`은 `drainPendingPayloads`와 `DiveWatchSyncPayloadReceived` event로 JS에 전달한다.
- 이 경로는 compile과 JS import behavior를 확인하기 위한 PoC이며, pairing과 background delivery가 실제 기기에서 검증됐다는 뜻은 아니다.

현재 비어 있는 부분은 다음과 같다.

- WatchConnectivity pairing, entitlement, app embedding, background delivery 실기기 검증 없음.
- Durable native inbox와 retry policy 없음.
- Supabase upload 없음.
- 인증된 사용자 연결 없음.
- Generated Swift contract는 현재 watch target에 compile되지 않음.

## 관련 문서

- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/supabase]]
- [[domains/dive-log]]
