# 동기화 흐름 구조

## 요약

현재 동기화 모델은 계약을 먼저 정의하는 방식이지만 전송 계층까지 완성된 상태는 아니다. `packages/contracts`가 watch sync message를 정의하고, watch 앱은 동기화 가능한 JSON을 encode할 수 있으며, 모바일 앱은 local fixture message를 `DiveLogEntry`로 변환해 in-memory repository에 import한다.

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
- `watch-session-to-dive-log-entry.ts`는 `WatchSession`을 watch source `DiveLogEntry`로 변환한다.
- `LocalDiveLogRepository.importWatchMessages`는 local watch fixture message를 import한다.
- Import는 `localSessionId`와 `endedAt` 기반 key로 deduplicate하고, 기존 manual/mobile field와 `importedAt`을 보존하며, 누락된 watch 동기화 상태를 `pending`으로 기본값 처리하고, 최신 항목이 먼저 오도록 정렬한다.
- `useDiveLogbook`은 React Query hook을 통해 repository list/save/delete/import mutation을 호출한다.

현재 비어 있는 부분은 다음과 같다.

- WatchConnectivity transport 없음.
- Background sync 없음.
- Supabase upload 없음.
- 인증된 사용자 연결 없음.
- 모바일 production storage engine 없음. 현재 repository는 앱 실행 중 메모리 저장소다.
- Generated Swift contract는 현재 watch target에 compile되지 않음.

## 관련 문서

- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/supabase]]
- [[domains/dive-log]]
