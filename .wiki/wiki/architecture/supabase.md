# Supabase 구조

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

## 관련 문서

- [[architecture/mobile]]
- [[architecture/sync-flow]]
- [[domains/dive-log]]
- [[questions/open-questions]]
