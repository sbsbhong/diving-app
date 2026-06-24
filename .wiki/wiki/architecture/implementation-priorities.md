# 구현 우선순위 기록

## 요약

이 문서는 현재 앱에서 나중에 다시 확인해야 할 구현 우선순위를 기록한다. 모바일 영구 저장소, Watch-mobile sync contract 검증 경로, WatchConnectivity PoC, watch app mobile migration은 완료됐고, 이 문서는 남은 후속 항목을 구현하지 않은 상태로 남긴다.

## 현재 상태

모바일 앱은 `DiveLogRepository`와 `DivePlanRepository` 경계를 갖고 AsyncStorage 기반 persistent repository를 기본으로 사용한다. 모바일은 원시 watch sync JSON을 실행 시점에 검증한 뒤 `WatchSyncMessage`로 좁혀 import할 수 있다. Watch 앱 source는 `apps/mobile/ios/DiveWatchApp`로 이관됐고, `apps/mobile/ios/DiveMobile.xcodeproj`의 embedded companion target으로 관리된다. Watch 앱은 sync-ready JSON encoder, 로컬 저장 흐름, WatchConnectivity `transferUserInfo` enqueue, reachable `sendMessage`, activation/reachability 기반 pending retry, acknowledgement 기반 local sync status 갱신을 갖는다. 모바일 iOS app도 WatchConnectivity userInfo/message를 durable inbox에 저장한 뒤 React Native로 넘기는 receiver와 JS acknowledge 경로를 갖는다. 다만 entitlement, background delivery, 사용자-facing retry/backoff policy, 실기기 검증은 아직 완료되지 않았다. `RealDepthSensorProvider`는 자리 표시자이며 실제 Apple Watch underwater sensor behavior는 검증되지 않았다. Supabase, 인증, cloud backup은 아직 구현되어 있지 않다.

## 상세

완료된 항목은 다음과 같다.

1. Watch-mobile sync contract 검증 경로
   - 모바일은 `watch-sync-message-validation.ts`를 통해 원시 JSON string이나 `unknown` payload를 실행 시점에 검증하고, 통과한 `WatchSyncMessage`만 기존 `DiveLogEntry` import 흐름으로 넘긴다.
   - 앱 fixture import도 `packages/contracts/fixtures/metadata-rich-watch-sync-message.json`을 validator에 통과시킨 뒤 사용한다.
   - Generated Swift contract를 watch target에서 직접 사용하는 결정은 아직 남아 있으며, 현재 watch 앱은 `DiveSession.syncMessageData` encoder를 유지한다.
   - 관련 문서: [[architecture/sync-flow]]

2. WatchConnectivity 전송 계층 PoC
   - Watch 앱은 저장된 `DiveSession`을 `WatchSyncTransport`로 `transferUserInfo`에 enqueue하고, reachable 상태에서는 `sendMessage`도 병행한다.
   - Watch 앱은 activation 완료와 reachability 변경 시 아직 `synced`가 아닌 저장 세션을 다시 enqueue한다.
   - Watch 앱은 transfer 오류와 모바일 import acknowledgement로 저장된 local session의 `syncStatus`를 갱신한다. `synced` 상태는 뒤늦은 failed 결과로 내리지 않는다.
   - 모바일 iOS native code는 `WatchConnectivityInbox`와 `WatchConnectivityModule`로 userInfo/message envelope를 raw JSON payload로 복원해 durable inbox에 저장하고 React Native에 전달한다.
   - 모바일 JS는 `WatchConnectivitySyncProvider`에서 pending payload와 event payload를 받아 기존 runtime validator와 repository import 흐름으로 넘긴다. 저장 성공 또는 무효 payload drop 이후에는 native inbox에 acknowledge한다. Import 완료 acknowledgement도 `transferUserInfo`와 reachable `sendMessage`를 병행한다.
   - WatchConnectivity로 받아 저장한 모바일 항목은 top-level `syncStatus`를 `synced`로 보정하지만, raw watch capture 안의 원본 `session.syncStatus`는 보존한다.
   - 이 항목은 전송 계층 code boundary와 활성 simulator import/ack behavior를 만든 상태이며, 실기기 paired-device delivery 검증 완료를 뜻하지 않는다.
   - 관련 문서: [[architecture/watch-app]], [[architecture/sync-flow]]

3. Watch app mobile migration
   - Watch source는 `apps/mobile/ios/DiveWatchApp`로 이관됐다.
   - `apps/mobile/ios/DiveMobile.xcodeproj`는 iPhone target `DiveMobile`과 embedded watch target `DiveWatchApp`를 함께 관리한다.
   - Root `yarn watch:build`는 `@repo/mobile`의 watch build script로 위임한다.
   - 별도 watch workspace는 더 이상 active source로 취급하지 않는다.
   - 관련 문서: [[architecture/watch-app]], [[architecture/mobile]], [[architecture/monorepo]]

후속으로 확인할 우선순위는 다음과 같다.

1. WatchConnectivity 실기기 검증과 sync 상태 확정
   - watch 로컬 세션이 실제 paired iPhone으로 전달되는지 지원 hardware에서 검증해야 한다.
   - Durable native inbox, reachable live message, JS acknowledge, 모바일 수신 성공 시 `synced` 표시, watch acknowledgement status 갱신은 구현됐지만, 사용자-facing retry/backoff policy와 manual retry UI는 아직 없다.
   - entitlement, background delivery, 장시간 retry behavior, 실기기 pairing은 simulator만으로 검증됐다고 쓰면 안 된다.
   - 관련 문서: [[architecture/watch-app]], [[architecture/sync-flow]]

2. 실제 Apple Watch 수심 센서 provider
   - `RealDepthSensorProvider`를 실제 sensor API 기반으로 구현하고 지원 Apple Watch hardware에서 수동 검증해야 한다.
   - 수중 센서값은 공개 배포 전까지 safety-critical truth로 표현하지 않는다.
   - 관련 문서: [[architecture/watch-app]], [[domains/safety-rules]]

3. 모바일 로그 상세와 리뷰 고도화
   - 로그 작성과 수정의 기본 흐름 이후 depth/temperature profile, provenance 표시, mode별 summary, 검색과 filter UX를 다듬는 영역이다.
   - Watch 측정값은 원본 출처를 보존하고 인증된 장비값처럼 표현하지 않는다.
   - 관련 문서: [[architecture/mobile]], [[domains/dive-log]]

4. 계획에서 로그북으로 이어지는 흐름 정리
   - Planbook에서 완료한 계획이 Logbook 초안으로 이어지는 흐름은 존재하지만, production persistence와 반복 사용 UX는 아직 다음 단계다.
   - 계획값은 의도와 준비 맥락이며 실제 측정값으로 자동 승격하지 않는다.
   - 관련 문서: [[domains/dive-planning]], [[architecture/mobile]]

5. Memory/share 화면 복구 또는 재설계
   - `src/screens/memory` source는 남아 있지만 현재 bottom tab에는 연결되어 있지 않다.
   - 사진/영상 첨부, share card export, 색 보정 같은 기능은 로그 리뷰와 추억 기록 범위에서 다시 설계해야 한다.
   - 관련 문서: [[architecture/mobile]]

6. Auth와 Supabase 기반
   - Local-first 모델이 안정된 뒤 Supabase Auth, user-owned table, RLS, generated database type, remote repository를 설계한다.
   - Mobile code는 direct SQL을 사용하지 않고 repository 경계 뒤에서 remote storage를 다룬다.
   - 관련 문서: [[architecture/supabase]], [[architecture/mobile-logbook-roadmap]]

7. 출시 전 안전과 실기기 검증 체크리스트
   - ascent, safety stop, no-fly 같은 표현은 non-certified assistant 또는 planning reminder 범위에 둔다.
   - 실제 수중 센서, haptic, 젖은 화면과 crown 조작, 수중 가독성, WatchConnectivity pairing은 지원 hardware에서 별도 수동 검증해야 한다.
   - 관련 문서: [[domains/safety-rules]], [[architecture/watch-app]]

## 관련 문서

- [[architecture/mobile]]
- [[architecture/mobile-logbook-roadmap]]
- [[architecture/watch-app]]
- [[architecture/sync-flow]]
- [[architecture/supabase]]
- [[domains/dive-log]]
- [[domains/dive-planning]]
- [[domains/safety-rules]]
- [[questions/open-questions]]
