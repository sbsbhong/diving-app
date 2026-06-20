# Open Questions

## Summary

These are durable unknowns or unimplemented areas that should not be presented as completed behavior.

## Current state

- Real Apple Watch underwater sensor behavior is not implemented or validated. `RealDepthSensorProvider` is a placeholder, and mock samples drive the current recording flow.
- WatchConnectivity pairing, entitlement setup, and phone transport are not implemented.
- Supabase schema, RLS policies, auth, repositories, and cloud backup are not implemented.
- Mobile imported sessions are held in React state only; production persistence and migration behavior are undecided.
- Generated Swift contracts exist but are not referenced by the active watch Xcode project.
- `apps/watch-ios/Sources` contains earlier standalone Swift files that are not referenced by the current Xcode project; future cleanup or migration ownership is undecided.

## Details

Before marking any of these areas resolved, inspect the relevant code and update the linked architecture/domain pages.

## Related pages

- [[architecture/watch-app]]
- [[architecture/mobile]]
- [[architecture/supabase]]
- [[architecture/sync-flow]]
- [[domains/safety-rules]]
