# Sync Flow Architecture

## Summary

현재 sync model은 contract-first이지만 transport-complete 상태는 아니다. `packages/contracts`가 watch sync message를 정의하고, watch app은 sync-ready JSON을 encode할 수 있으며, mobile app은 local fixture message를 in-memory logbook state로 import한다.

## Current state

Contract source file은 다음과 같다.

- `packages/contracts/schemas/watch-sync-message.schema.json`
- `packages/contracts/schemas/watch-session.schema.json`
- `packages/contracts/schemas/watch-depth-sample.schema.json`

Generated output은 다음과 같다.

- `packages/contracts/generated/typescript/index.ts`
- `packages/contracts/generated/swift/WatchContracts.swift`

`WatchSyncMessage` type은 `sessionCreated`, `sessionUpdated`, `sessionEnded`를 지원한다. `WatchSession`은 `localSessionId`, `startedAt`, `samples`를 require하고, 대부분의 metadata는 optional이다.

## Details

Session contract가 지원하는 값은 다음과 같다.

- dive mode: `scuba`, `freedive`, `snorkel`, `pool`, `unknown`
- gas label, site id/name, buddy, gear, tag, note
- rating, perceived exertion, visibility rating, water condition
- sync status: `pending`, `synced`, `failed`
- entry/exit location placeholder
- Unix-second 기반 start/end timestamp
- max depth, average depth, water temperature, depth sample

Depth sample은 `localSessionId`, Unix-second `timestamp`, `depthMeters`를 require한다. `pressureKPa`와 `waterTemperatureCelsius`는 optional이다.

Mobile import behavior는 다음과 같다.

- `src/types/dive-session.ts`는 generated TypeScript contract type을 import한다.
- `useDiveLogbook`은 local watch fixture message에서 initial state를 만든다.
- `importWatchMessages`는 `localSessionId`와 `endedAt` 기반 key로 deduplicate하고, existing import metadata를 보존하며, missing sync status를 `pending`으로 default하고, newest first로 정렬한다.

현재 gap은 다음과 같다.

- WatchConnectivity transport 없음.
- Background sync 없음.
- Supabase upload 없음.
- Authenticated user association 없음.
- Generated Swift contract는 현재 watch target에 compile되지 않음.

## Related pages

- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/supabase]]
- [[domains/dive-log]]
