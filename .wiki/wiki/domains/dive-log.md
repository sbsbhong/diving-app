# 다이브 로그 도메인

## 요약

Dive log domain은 현재 watch에서 기록한 레크리에이션 세션과 모바일에서 직접 작성한 수동 로그를 과거 기록 확인, 모바일 import, 비중요 계획/기억 화면에 쓰기 위해 model한다.

## 현재 상태

Shared watch sync contract는 `WatchSession`, `WatchDepthSample`, `WatchLocation`, `WatchSyncMessage`를 사용한다. Watch 앱은 동기화 가능한 payload로 mapping되는 local Swift `DiveSession`, `DepthSample` model을 갖는다. 모바일 앱의 최종 로그북 항목은 `DiveLogEntry`이며, 기존 Home/Planning 화면을 위해 `MobileDiveSession` compatibility view를 만든다.

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

Mobile model은 `WatchSession`과 모바일 최종 로그 항목을 분리한다. `WatchSession`은 watch-to-mobile sync contract로 유지하고, 모바일 로그북은 별도 `DiveLogEntry`를 사용한다.

`DiveLogEntry`는 다음 개념을 보존한다.

- `source`: `manual` 또는 `watch`.
- `fieldSource`: `manual`, `mobile`, `watch` provenance.
- `syncStatus`: `localOnly`, `pending`, `synced`, `failed`.
- `localId`: 로컬 저장 기준 식별자.
- `remoteId`: future Supabase row와 연결하는 선택 식별자.
- `ownerUserId`: future authenticated user 연결.

Watch-captured 측정값은 원본 출처를 보존하고 모바일 편집 화면에서 잠금 값으로 다룬다. Manual field와 mobile-assisted field는 사용자가 수정할 수 있다.

현재 수동 로그 field는 site, startedAt, dive mode, duration, max depth, buddy, gear, tags, observed marine life, notes, rating을 다룬다. Editor는 `diveMode`별로 다른 metadata를 다룬다. Scuba는 gas label, gear, water condition, visibility rating, perceived exertion을 저장할 수 있고, freedive는 repetition count, training focus, perceived exertion을 저장할 수 있다. Snorkel은 water condition과 visibility rating을 다루고, pool은 pool length, lap count, training focus를 다루며 depth field를 쓰지 않는다. 비어 있거나 유효하지 않은 수치 field는 `0`으로 저장하지 않고 `undefined`로 유지해 알 수 없는 값과 실제 0 값을 구분한다. Review summary와 preview aggregate도 같은 규칙을 따라 unknown duration/depth를 `0`으로 더하지 않고 placeholder로 표시한다.

Watch import는 raw `WatchSession`을 `watchCapture.session`에 보존한다. 같은 watch import key가 다시 들어오면 manual/mobile field는 유지하고 watch capture와 sync status만 최신 payload로 갱신한다. 이렇게 해야 사용자가 모바일에서 보완한 site, notes, tags, rating 같은 맥락이 watch 재가져오기로 사라지지 않는다.

현재 `LocalDiveLogRepository`는 in-memory 저장소다. 로컬 로그 작성과 repository boundary는 구현됐지만, 앱 재시작 뒤 유지되는 device storage engine은 아직 구현되지 않았다.

## 관련 문서

- [[architecture/sync-flow]]
- [[architecture/mobile]]
- [[architecture/mobile-logbook-roadmap]]
- [[architecture/watch-app]]
- [[decisions/adr-local-first-mobile-logbook]]
- [[domains/diving-glossary]]
- [[domains/safety-rules]]
