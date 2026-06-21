# 다이브 로그 도메인

## 요약

Dive log domain은 현재 watch에서 기록한 레크리에이션 세션을 과거 기록 확인, 모바일 import, 비중요 계획/기억 화면에 쓰기 위해 model한다.

## 현재 상태

Shared watch sync contract는 `WatchSession`, `WatchDepthSample`, `WatchLocation`, `WatchSyncMessage`를 사용한다. Watch 앱은 동기화 가능한 payload로 mapping되는 local Swift `DiveSession`, `DepthSample` model을 갖는다. 모바일 앱은 generated `WatchSession` type을 기반으로 `MobileDiveSession`을 만든다.

## 상세

Session 식별과 시간 표현은 다음과 같다.

- `localSessionId`는 sync contract에서 watch-side session을 식별한다.
- Shared contract의 `startedAt`, `endedAt`, sample timestamp, location capture time은 Unix timestamp seconds다.
- Watch local model은 Swift `Date`를 사용한다.
- Mobile import key는 `localSessionId`와 `endedAt`을 조합한다. 열려 있는 세션은 key에 `open`을 사용한다.

Session metadata는 다음 field를 포함한다.

- `schemaVersion`
- `diveMode`
- `gasLabel`
- `siteId`, `siteName`
- `buddyIds`
- `gearIds`
- `tags`
- `notes`
- `rating`
- `perceivedExertion`
- `visibilityRating`
- `waterCondition`
- `syncStatus`
- `entryLocation`, `exitLocation`

Sample metadata는 다음 field를 포함한다.

- `localSessionId`
- `timestamp`
- `depthMeters`
- optional `pressureKPa`
- optional `waterTemperatureCelsius`

Review summary는 duration, max depth, average depth, sample count, average water temperature, ascent-rate reminder summary를 포함할 수 있다. 이 값들은 과거 기록 확인용 값이며 감압 계산이나 비상 지침이 아니다.

Mobile model은 현재 가져온 watch session 위에 `importKey`, `importedAt`, `mediaPlaceholders`를 추가한다.

승인된 다음 모델 방향은 `WatchSession`과 모바일 최종 로그 항목을 분리하는 것이다. `WatchSession`은 watch-to-mobile sync contract로 유지하고, 모바일 로그북은 별도 `DiveLogEntry`를 사용한다.

`DiveLogEntry`는 다음 개념을 보존해야 한다.

- `source`: `manual` 또는 `watch`.
- `fieldSource`: `manual`, `mobile`, `watch` provenance.
- `syncStatus`: `localOnly`, `pending`, `synced`, `failed`.
- `localId`: 로컬 저장 기준 식별자.
- `remoteId`: future Supabase row와 연결하는 선택 식별자.
- `ownerUserId`: future authenticated user 연결.

Watch-captured 측정값은 원본 출처를 보존하고 모바일 편집 화면에서 잠금 값으로 다룬다. Manual field와 mobile-assisted field는 사용자가 수정할 수 있다.

## 관련 문서

- [[architecture/sync-flow]]
- [[architecture/mobile]]
- [[architecture/mobile-logbook-roadmap]]
- [[architecture/watch-app]]
- [[decisions/adr-local-first-mobile-logbook]]
- [[domains/diving-glossary]]
- [[domains/safety-rules]]
