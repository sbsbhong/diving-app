# Dive Log Domain

## Summary

The dive log domain currently models recreational watch-captured sessions for historical review, mobile import, and non-critical planning/memory surfaces.

## Current state

The shared watch sync contract uses `WatchSession`, `WatchDepthSample`, `WatchLocation`, and `WatchSyncMessage`. The watch app has local Swift `DiveSession` and `DepthSample` models that map to sync-ready payloads. The mobile app builds `MobileDiveSession` from the generated `WatchSession` type.

## Details

Session identity and timing:

- `localSessionId` identifies the watch-side session in sync contracts.
- `startedAt`, `endedAt`, sample timestamps, and location capture times are Unix timestamps in seconds in the shared contract.
- Watch local models use Swift `Date`.
- Mobile import keys combine `localSessionId` and `endedAt`; open sessions use `open` in the key.

Session metadata:

- `schemaVersion`
- `diveMode`
- `gasLabel`
- `siteId` and `siteName`
- `buddyIds`
- `gearIds`
- `tags`
- `notes`
- `rating`
- `perceivedExertion`
- `visibilityRating`
- `waterCondition`
- `syncStatus`
- `entryLocation` and `exitLocation`

Sample metadata:

- `localSessionId`
- `timestamp`
- `depthMeters`
- optional `pressureKPa`
- optional `waterTemperatureCelsius`

Review summaries include duration, max depth, average depth, sample count, average water temperature, and ascent-rate reminder summaries. These are historical review values, not decompression calculations or emergency guidance.

The mobile model adds `importKey`, `importedAt`, and `mediaPlaceholders` around the imported watch session.

## Related pages

- [[architecture/sync-flow]]
- [[architecture/mobile]]
- [[architecture/watch-app]]
- [[domains/diving-glossary]]
- [[domains/safety-rules]]
