# Supabase 구조

Sources: pre-Karpathy wiki page, 2026-06-28
Raw: [Pre-Karpathy: Supabase 구조](../../raw/architecture/supabase.md)
Updated: 2026-06-28

## 요약

현재 저장소에는 구현된 Supabase 영역이 없다.

## 현재 상태

저장소에는 root `supabase/` directory나 `packages/supabase` workspace가 없다. 현재 코드에는 Supabase client initialization, generated database type, migration, RLS policy, repository layer, edge function, auth flow가 없다.

## 상세

Supabase가 도입될 때 의도된 책임은 다음과 같다.

- `supabase/`: migration, RLS policy, seed data, database function, 필요 시 edge function.
- `packages/supabase`: Supabase client initialization, generated database type, repository/query function, Supabase 전용 mapping logic.

Schema change는 migration 중심으로 진행해야 한다. 새 table이나 변경된 table은 RLS policy, 지원되는 경우 generated type update, repository update, Supabase 구조와 dive-log domain wiki 수정과 함께 다룬다.

Watch sync contract는 현재 `userId`를 생략한다. 사용자 소유권은 watch-side capture가 아니라 인증된 mobile/server context에서 붙여야 한다.

승인된 모바일 로그북 방향은 Supabase를 즉시 도입하지 않고 local-first 저장소 경계를 먼저 만드는 것이다. 이후 Supabase가 들어오면 비로그인 사용자는 `localOnly` 저장을 유지하고, 로그인 사용자는 local write 후 Supabase sync를 사용한다. 기존 local-only 로그를 계정에 연결할 때는 사용자 동의 흐름이 필요하다.

## 관련 문서

- [모바일 구조](mobile.md)
- [모바일 로그북 로드맵](mobile-logbook-roadmap.md)
- [동기화 흐름 구조](sync-flow.md)
- [다이브 로그 도메인](../domains/dive-log.md)
- [ADR: Local-first mobile logbook with future Supabase sync](../decisions/adr-local-first-mobile-logbook.md)
- [열린 질문](../questions/open-questions.md)
