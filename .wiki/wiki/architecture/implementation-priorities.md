# 구현 우선순위 기록

## 요약

이 문서는 현재 앱에서 나중에 다시 확인해야 할 구현 우선순위를 기록한다. 모바일 영구 저장소와 Watch-mobile sync contract 검증 경로는 완료됐고, 이 문서는 남은 후속 항목을 구현하지 않은 상태로 남긴다.

## 현재 상태

모바일 앱은 `DiveLogRepository`와 `DivePlanRepository` 경계를 갖고 AsyncStorage 기반 persistent repository를 기본으로 사용한다. 모바일은 원시 watch sync JSON을 실행 시점에 검증한 뒤 `WatchSyncMessage`로 좁혀 import할 수 있다. Watch 앱은 sync-ready JSON encoder, 로컬 저장 흐름, WatchConnectivity `transferUserInfo` enqueue PoC를 갖는다. 모바일 iOS app도 WatchConnectivity userInfo를 React Native로 넘기는 PoC receiver를 갖는다. 다만 pairing, entitlement, background delivery, retry behavior, 실기기 검증은 아직 완료되지 않았다. `RealDepthSensorProvider`는 자리 표시자이며 실제 Apple Watch underwater sensor behavior는 검증되지 않았다. Supabase, 인증, cloud backup은 아직 구현되어 있지 않다.

## 상세

완료된 항목은 다음과 같다.

1. Watch-mobile sync contract 검증 경로
   - 모바일은 `watch-sync-message-validation.ts`를 통해 원시 JSON string이나 `unknown` payload를 실행 시점에 검증하고, 통과한 `WatchSyncMessage`만 기존 `DiveLogEntry` import 흐름으로 넘긴다.
   - 앱 fixture import도 `packages/contracts/fixtures/metadata-rich-watch-sync-message.json`을 validator에 통과시킨 뒤 사용한다.
   - Generated Swift contract를 watch target에서 직접 사용하는 결정은 아직 남아 있으며, 현재 watch 앱은 `DiveSession.syncMessageData` encoder를 유지한다.
   - 관련 문서: [[architecture/sync-flow]]

2. WatchConnectivity 전송 계층 PoC
   - Watch 앱은 저장된 `DiveSession`을 `WatchSyncTransport`로 `transferUserInfo`에 enqueue한다.
   - 모바일 iOS native code는 `WatchConnectivityInbox`와 `WatchConnectivityModule`로 envelope를 raw JSON payload로 복원해 React Native에 전달한다.
   - 모바일 JS는 `WatchConnectivitySyncProvider`에서 pending payload와 event payload를 받아 기존 runtime validator와 repository import 흐름으로 넘긴다.
   - 이 항목은 전송 계층 code boundary와 build/import behavior를 만든 상태이며, paired-device delivery 검증 완료를 뜻하지 않는다.
   - 관련 문서: [[architecture/watch-app]], [[architecture/sync-flow]]

후속으로 확인할 우선순위는 다음과 같다.

2 후속. WatchConnectivity 실기기 검증과 sync 상태 확정
   - watch 로컬 세션이 실제 paired iPhone으로 전달되는지 지원 hardware에서 검증해야 한다.
   - 모바일에서 `pending`, `synced`, `failed` 상태를 실제 동기화 상태로 갱신하는 durable 상태 모델과 retry policy는 아직 남아 있다.
   - pairing, entitlement, background delivery, retry behavior는 simulator만으로 검증됐다고 쓰면 안 된다.
   - 관련 문서: [[architecture/watch-app]], [[architecture/sync-flow]]

3. 실제 Apple Watch 수심 센서 provider
   - `RealDepthSensorProvider`를 실제 sensor API 기반으로 구현하고 지원 Apple Watch hardware에서 수동 검증해야 한다.
   - 수중 센서값은 공개 배포 전까지 safety-critical truth로 표현하지 않는다.
   - 관련 문서: [[architecture/watch-app]], [[domains/safety-rules]]

4. 모바일 로그 상세와 리뷰 고도화
   - 로그 작성과 수정의 기본 흐름 이후 depth/temperature profile, provenance 표시, mode별 summary, 검색과 filter UX를 다듬는 영역이다.
   - Watch 측정값은 원본 출처를 보존하고 인증된 장비값처럼 표현하지 않는다.
   - 관련 문서: [[architecture/mobile]], [[domains/dive-log]]

5. 계획에서 로그북으로 이어지는 흐름 정리
   - Planbook에서 완료한 계획이 Logbook 초안으로 이어지는 흐름은 존재하지만, production persistence와 반복 사용 UX는 아직 다음 단계다.
   - 계획값은 의도와 준비 맥락이며 실제 측정값으로 자동 승격하지 않는다.
   - 관련 문서: [[domains/dive-planning]], [[architecture/mobile]]

6. Memory/share 화면 복구 또는 재설계
   - `src/screens/memory` source는 남아 있지만 현재 bottom tab에는 연결되어 있지 않다.
   - 사진/영상 첨부, share card export, 색 보정 같은 기능은 로그 리뷰와 추억 기록 범위에서 다시 설계해야 한다.
   - 관련 문서: [[architecture/mobile]]

7. Auth와 Supabase 기반
   - Local-first 모델이 안정된 뒤 Supabase Auth, user-owned table, RLS, generated database type, remote repository를 설계한다.
   - Mobile code는 direct SQL을 사용하지 않고 repository 경계 뒤에서 remote storage를 다룬다.
   - 관련 문서: [[architecture/supabase]], [[architecture/mobile-logbook-roadmap]]

8. 문서와 agent guide 정리
   - `apps/mobile/AGENTS.md`에는 별도 UI/styling framework가 없다고 쓰여 있지만 현재 mobile code는 Gluestack UI v4/NativeWind stack을 사용한다.
   - 현재 코드와 guide가 어긋나는 부분을 정리해야 다음 작업자가 잘못된 전제로 시작하지 않는다.
   - 관련 문서: [[questions/open-questions]], [[architecture/mobile]]

9. 출시 전 안전과 실기기 검증 체크리스트
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
