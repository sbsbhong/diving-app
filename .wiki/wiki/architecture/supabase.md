# Supabase Architecture

## Summary

현재 repository에는 구현된 Supabase surface가 없다.

## Current state

Repository에는 root `supabase/` directory나 `packages/supabase` workspace가 없다. Current code에는 Supabase client initialization, generated database type, migration, RLS policy, repository layer, edge function, auth flow가 없다.

## Details

Supabase가 도입될 때 의도된 responsibility는 다음과 같다.

- `supabase/`: migration, RLS policy, seed data, database function, 필요 시 edge function.
- `packages/supabase`: Supabase client initialization, generated database type, repository/query function, Supabase-specific mapping logic.

Schema change는 migration-driven이어야 한다. 새 table이나 변경된 table은 RLS policy, 지원되는 경우 generated type update, repository update, Supabase architecture와 dive-log domain wiki update와 함께 다룬다.

Watch sync contract는 현재 `userId`를 생략한다. User ownership은 watch-side capture가 아니라 authenticated mobile/server context에서 붙여야 한다.

## Related pages

- [[architecture/mobile]]
- [[architecture/sync-flow]]
- [[domains/dive-log]]
- [[questions/open-questions]]
