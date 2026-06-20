# Supabase Architecture

## Summary

There is no implemented Supabase surface in the current repository.

## Current state

The repository does not contain a root `supabase/` directory or a `packages/supabase` workspace. Current code has no Supabase client initialization, generated database types, migrations, RLS policies, repository layer, edge functions, or auth flow.

## Details

When Supabase is introduced, intended responsibilities are:

- `supabase/`: migrations, RLS policies, seed data, database functions, and edge functions if needed.
- `packages/supabase`: Supabase client initialization, generated database types, repository/query functions, and Supabase-specific mapping logic.

Schema changes should be migration-driven. New or changed tables should be paired with RLS policies, generated type updates where supported, repository updates, and wiki updates for Supabase architecture and dive-log domain meaning.

The watch sync contract currently omits `userId`. User ownership should be attached later through authenticated mobile/server context rather than by watch-side capture.

## Related pages

- [[architecture/mobile]]
- [[architecture/sync-flow]]
- [[domains/dive-log]]
- [[questions/open-questions]]
