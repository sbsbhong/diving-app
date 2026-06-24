# Watch Sync JSON Validation Design

## Summary

모바일 앱에 watch sync contract의 runtime JSON 검증 경로를 추가한다. 목표는 fixture object가 아니라 raw JSON payload를 받아 `WatchSyncMessage`인지 검증한 뒤 기존 `DiveLogRepository.importWatchMessages` 흐름으로 넘기는 것이다.

## Scope

- 모바일 TypeScript 코드에 dependency 없는 validator를 추가한다.
- `packages/contracts/fixtures/*.json` payload를 실제 raw JSON input처럼 통과시킨다.
- 현재 앱의 fixture import도 검증 경로를 지나게 한다.
- WatchConnectivity, entitlement, native transport, generated Swift target membership은 이번 범위에 포함하지 않는다.

## Design

`apps/mobile/src/utils/watch-sync-message-validation.ts`는 `unknown` value와 JSON string을 검증한다. 성공하면 typed `WatchSyncMessage`를 반환하고, 실패하면 path가 포함된 error message를 반환한다.

검증 범위는 현재 JSON Schema v1과 맞춘다. Top-level `type`은 `sessionCreated`, `sessionUpdated`, `sessionEnded`만 허용한다. `session.localSessionId`, `session.startedAt`, `session.samples`는 필수다. Optional enum, numeric rating range, watch location, depth sample 필드는 schema와 같은 shape로 검사한다. `additionalProperties: false`도 반영해 알 수 없는 key는 거부한다.

`apps/mobile/src/utils/watch-fixtures.ts`는 contract fixture JSON을 import하고 validator를 통해 `watchFixtureMessages`를 만든다. 앱 내부 import action은 계속 `WatchSyncMessage[]`를 repository에 넘기지만, fixture 생성 시점에 runtime contract 검증이 수행된다.

## Error Handling

JSON parse 실패와 schema 검증 실패는 throw-free result API로 표현한다. 앱 fixture는 startup fixture이므로 invalid fixture가 있으면 module load에서 명확한 error를 throw한다. 향후 WatchConnectivity 수신자는 result API를 사용해 실패 payload를 `failed` 상태나 sync error로 매핑할 수 있다.

## Tests

- Contract fixture JSON을 `parseWatchSyncMessageValue`로 검증하고 `PersistentDiveLogRepository.importWatchMessages`로 import한다.
- JSON string parsing이 성공 path를 반환하는지 확인한다.
- invalid payload는 실패하고 path가 포함된 message를 반환한다.
- `watchFixtureMessages`가 runtime validator를 지난 payload이며 기존 import action과 호환되는지 확인한다.

## Verification

- `yarn workspace @repo/mobile test --runTestsByPath __tests__/watch-sync-message-validation.test.ts __tests__/use-dive-logbook.test.ts --runInBand`
- `yarn mobile:typecheck`
- `yarn check:quick`

