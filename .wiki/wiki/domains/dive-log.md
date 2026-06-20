# Dive Log Domain

## Summary

Dive log domain은 현재 recreational watch-captured session을 historical review, mobile import, non-critical planning/memory surface에 쓰기 위해 model한다.

## Current state

Shared watch sync contract는 `WatchSession`, `WatchDepthSample`, `WatchLocation`, `WatchSyncMessage`를 사용한다. Watch app은 sync-ready payload로 mapping되는 local Swift `DiveSession`, `DepthSample` model을 갖는다. Mobile app은 generated `WatchSession` type을 기반으로 `MobileDiveSession`을 만든다.

## Details

Session identity와 timing은 다음과 같다.

- `localSessionId`는 sync contract에서 watch-side session을 식별한다.
- Shared contract의 `startedAt`, `endedAt`, sample timestamp, location capture time은 Unix timestamp seconds다.
- Watch local model은 Swift `Date`를 사용한다.
- Mobile import key는 `localSessionId`와 `endedAt`을 조합한다. Open session은 key에 `open`을 사용한다.

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

Review summary는 duration, max depth, average depth, sample count, average water temperature, ascent-rate reminder summary를 포함할 수 있다. 이 값들은 historical review value이며 decompression calculation이나 emergency guidance가 아니다.

Mobile model은 imported watch session 위에 `importKey`, `importedAt`, `mediaPlaceholders`를 추가한다.

## Related pages

- [[architecture/sync-flow]]
- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[domains/diving-glossary]]
- [[domains/safety-rules]]
