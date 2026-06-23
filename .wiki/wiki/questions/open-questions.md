# 열린 질문

## 요약

이 문서는 완료된 동작처럼 쓰면 안 되는 오래 유지할 미확정 사항과 미구현 영역을 기록한다.

## 현재 상태

- 실제 Apple Watch underwater sensor behavior는 구현되거나 검증되지 않았다. `RealDepthSensorProvider`는 자리 표시자이고, 현재 기록 흐름은 mock sample을 사용한다.
- WatchConnectivity pairing, entitlement setup, phone transport는 구현되지 않았다.
- Supabase schema, RLS policy, auth, repository, cloud backup은 구현되지 않았다.
- 모바일 Logbook, Planbook, 설정 선호는 AsyncStorage 기반 versioned JSON store에 저장된다. 다만 version 1 이후의 schema migration behavior와 guest data retention 정책은 아직 추가 설계가 필요하다.
- Generated Swift contract는 존재하지만 현재 watch Xcode project에서 참조되지 않는다.
- `apps/watch-ios/Sources`에는 이전 standalone Swift file이 남아 있으나 현재 Xcode project에서 참조되지 않는다. 향후 cleanup 또는 migration ownership은 결정되지 않았다.
- `apps/mobile/AGENTS.md`의 stack 설명은 별도 UI/styling framework가 없다고 쓰지만, 현재 mobile code는 Gluestack UI v4/NativeWind stack을 사용한다. 이 guide 불일치의 정리 방식은 아직 결정되지 않았다.

## 상세

위 항목을 resolved로 옮기기 전에는 관련 코드를 직접 확인하고 연결된 architecture/domain page를 함께 수정한다.

## 관련 문서

- [[architecture/watch-app]]
- [[architecture/mobile]]
- [[architecture/mobile-logbook-roadmap]]
- [[architecture/supabase]]
- [[architecture/sync-flow]]
- [[domains/safety-rules]]
