# 모바일 로그북 로드맵

## 요약

모바일 앱은 로그북의 중심이 되고, watch 앱은 측정 가능한 세션 데이터를 제공하는 캡처 source가 된다. 승인된 방향은 local-first 모바일 로그북을 먼저 만들고, 이후 로그인과 Supabase 동기화를 같은 저장소 경계 위에 붙이는 것이다.

## 현재 상태

현재 모바일 로그북은 `WatchSession` 기반 `MobileDiveSession`을 React state에 보관한다. Fixture import는 가능하지만 production mobile persistence, 실제 WatchConnectivity, 인증, Supabase sync는 구현되어 있지 않다.

승인된 방향은 다음과 같다.

- 모바일 수동 로그 등록과 watch 기반 로그 작성을 모두 지원한다.
- 첫 구현은 로그인 없는 local-only 저장으로 진행한다.
- 저장소 인터페이스를 먼저 만들어 화면이 로컬 저장소와 future Supabase 저장소를 직접 구분하지 않게 한다.
- Watch에서 가져온 측정값은 원본 출처를 보존하고 수정 불가능한 값으로 표시한다.
- 로그인 이후에는 signed-in 사용자가 local write 후 Supabase sync를 사용하고, 비로그인 사용자는 local-only로 계속 사용한다.

## 단계별 TODO

이 TODO는 단기 작업 메모가 아니라 승인된 구현 순서다. 각 단계는 관련 spec과 plan을 확인하고 진행한다.

- [ ] Phase 0: 현재 모바일 로그북, watch payload, local storage 후보를 조사하고 첫 구현 file list를 확정한다.
- [ ] Phase 1: `DiveLogEntry`, field provenance, sync status, `DiveLogRepository` 인터페이스를 만든다.
- [ ] Phase 2: 로그인 없이 모바일에서 수동 로그를 만들고 로컬 저장소에 저장한다.
- [ ] Phase 3: Watch에서 만든 contract-valid payload가 모바일로 들어올 수 있는지 검증한다.
- [ ] Phase 4: Watch 기반 로그 작성 화면에서 측정값을 잠금 처리하고 누락된 맥락을 모바일에서 채운다.
- [ ] Phase 5: Supabase Auth, user-owned table, RLS, generated type, remote repository를 추가한다.
- [ ] Phase 6: 로그인 상태에 따라 guest local-only와 signed-in local-plus-sync 저장 전략을 적용한다.

## 상세

모바일 로그 항목은 `WatchSession`과 분리된 `DiveLogEntry`가 되어야 한다. `WatchSession`은 watch-to-mobile sync contract이고, `DiveLogEntry`는 사용자가 보는 최종 로그북 항목이다.

오래 유지할 핵심 개념은 다음과 같다.

- `source`: `manual` 또는 `watch`.
- `fieldSource`: `manual`, `mobile`, `watch` provenance.
- `syncStatus`: `localOnly`, `pending`, `synced`, `failed`.
- `localId`: 로컬 저장과 offline-first 동작의 기준.
- `remoteId`: Supabase sync 이후 remote row와 연결하는 선택 값.
- `ownerUserId`: 인증된 사용자 연결이 생긴 뒤 붙는 선택 값.

Watch-captured field는 원본을 덮어쓰지 않는다. 사용자가 틀렸다고 느끼는 경우에는 원본 수정 대신 메모, 표시 제외, 또는 별도 보정 계층을 검토한다.

모바일 수동 로그는 site, date/time, dive mode, duration, max depth, buddy, gear, tags, observed marine life, notes, rating 같은 field를 우선 다룬다. 모바일 위치 정보는 제안값일 뿐이며 로그 작성의 필수 조건이 아니다.

Supabase는 모델과 로컬 저장이 안정된 뒤 도입한다. Mobile code는 direct SQL을 사용하지 않고 repository 함수를 통해 접근한다. Public schema table을 만들 경우 RLS와 user ownership policy가 함께 필요하다.

## 관련 문서

- [[architecture/mobile]]
- [[architecture/sync-flow]]
- [[architecture/supabase]]
- [[domains/dive-log]]
- [[decisions/adr-local-first-mobile-logbook]]
- `docs/superpowers/specs/2026-06-21-mobile-logbook-local-first-design.md`
- `docs/superpowers/plans/2026-06-21-mobile-logbook-local-first.md`
- `docs/mobile-logbook-local-first-roadmap.html`
