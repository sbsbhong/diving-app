# Sync Flow Architecture

## Summary

The current sync model is contract-first but not transport-complete. `packages/contracts` defines watch sync messages; the watch app can encode sync-ready JSON; the mobile app imports local fixture messages into in-memory logbook state.

## Current state

Contract source files:

- `packages/contracts/schemas/watch-sync-message.schema.json`
- `packages/contracts/schemas/watch-session.schema.json`
- `packages/contracts/schemas/watch-depth-sample.schema.json`

Generated outputs:

- `packages/contracts/generated/typescript/index.ts`
- `packages/contracts/generated/swift/WatchContracts.swift`

`WatchSyncMessage` types are `sessionCreated`, `sessionUpdated`, and `sessionEnded`. A `WatchSession` requires `localSessionId`, `startedAt`, and `samples`; most metadata is optional.

## Details

The session contract supports:

- dive mode: `scuba`, `freedive`, `snorkel`, `pool`, `unknown`
- gas label, site id/name, buddies, gear, tags, notes
- rating, perceived exertion, visibility rating, and water condition
- sync status: `pending`, `synced`, `failed`
- entry and exit location placeholders
- Unix-second start/end timestamps
- max depth, average depth, water temperature, and depth samples

Depth samples require `localSessionId`, Unix-second `timestamp`, and `depthMeters`; pressure and water temperature are optional.

Mobile import behavior:

- `src/types/dive-session.ts` imports generated TypeScript contract types.
- `useDiveLogbook` initializes from local watch fixture messages.
- `importWatchMessages` deduplicates by `localSessionId` and `endedAt`, preserves existing import metadata, defaults missing sync status to `pending`, and sorts newest first.

Current gaps:

- No WatchConnectivity transport.
- No background sync.
- No Supabase upload.
- No authenticated user association.
- Generated Swift contracts are not currently compiled into the watch target.

## Related pages

- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[architecture/supabase]]
- [[domains/dive-log]]
