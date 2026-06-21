# Mobile Logbook Local-First Design

Date: 2026-06-21

## Summary

Build the mobile app into the primary dive logbook while keeping the first implementation local-only and login-free. The design must support two first-class log creation paths:

- Manual mobile log creation.
- Watch-captured session review that becomes a log entry after the user fills missing context.

The near-term implementation should not add Supabase or authentication yet. Instead, it should introduce a sync-ready domain model and repository boundary so local storage can later become guest/offline storage under the same app-facing interface. When authentication and Supabase are added, signed-in users can sync local records to remote tables, while users who choose "continue without login" keep local-only behavior.

## Final Goal

The mobile app owns the logbook. The watch app is a capture source for measured session data, not the only way to create logs.

The final system should allow:

- A guest user to record, review, edit, and keep dive logs only on the device.
- A signed-in user to keep the same local-first experience while syncing logs to Supabase.
- A watch user to import measured session data, preserve immutable watch-captured values, add missing context on mobile, and save the result as a normal logbook entry.
- A manual user to create logs without watch data, using mobile-assisted suggestions only where available.

## Goals

- Introduce a mobile dive log domain model that is not just `WatchSession`.
- Preserve watch-captured raw values and provenance.
- Support editable manual fields such as site, buddy, gear, notes, tags, observed marine life, rating, photos, and conditions.
- Support mobile-assisted values such as current location or creation time as suggestions, not certified truths.
- Keep measured watch fields immutable in the mobile review flow.
- Add a repository interface that can be backed by local storage now and Supabase later.
- Keep the app inside the product safety boundary: post-dive logging and review only, no certified dive-computer claims.

## Non-Goals

- Do not add authentication in the first local logbook implementation.
- Do not create Supabase migrations or tables in the first local logbook implementation.
- Do not implement real WatchConnectivity before the watch import validation phase.
- Do not calculate decompression obligations, tissue loading, emergency instructions, or certified dive-computer behavior.
- Do not rewrite generated contract output directly.
- Do not put direct SQL in the mobile app.

## Current Context

The current mobile logbook is in-memory and watch-fixture based:

- `apps/mobile/src/states/use-dive-logbook.ts` owns local React state.
- `apps/mobile/src/types/dive-session.ts` defines `MobileDiveSession` as `WatchSession` plus import metadata.
- `apps/mobile/src/utils/import-watch-session.ts` imports generated watch sync messages and deduplicates by `localSessionId` plus `endedAt`.
- `apps/mobile/src/screens/logbook/screen.tsx` displays imported sessions and detail review.

The current watch app can encode sync-ready JSON, but transport is not implemented:

- `apps/watch-ios/DiveWatchApp/Models/DiveSession.swift` has `syncMessageData(type:)`.
- `apps/watch-ios/DiveWatchApp/Storage/DiveSessionStore.swift` persists local watch sessions in `UserDefaults`.
- `packages/contracts/schemas/*.schema.json` define the watch sync contract.
- There is no WatchConnectivity integration.

The repository has no Supabase implementation:

- No root `supabase/` directory.
- No `packages/supabase` workspace.
- No auth flow, migrations, generated database types, RLS policy, or remote repository.

## Architecture

Use a layered mobile model:

```txt
Screens
  -> React Query logbook hooks
    -> DiveLogRepository interface
      -> LocalDiveLogRepository now
      -> SyncingDiveLogRepository later
        -> SupabaseDiveLogRepository later
```

Screens should call app-level hooks and actions. They should not know whether persistence is local-only, local plus sync, or Supabase-backed.

React Query should be the async query and mutation orchestration layer for logbook data. It can call local repositories and future remote/syncing repositories through the same interface:

- `useQuery` for logbook list/detail reads.
- `useMutation` for save, delete, manual log creation, and watch import.
- Query invalidation after mutations.
- Loading, empty, and error states around repository calls.

React Query cache is not the source of truth. Local storage and future Supabase rows remain the durable stores. The repository layer owns persistence; React Query owns read/mutation cache behavior.

Zustand is not part of the first logbook implementation. Revisit it only if editor state becomes complex enough to justify a separate client-state store, such as multi-step draft state, selected log UI state, or unsaved form state that should not live in React Query cache.

### Core Types

The exact TypeScript names can be refined during implementation, but the model should keep these concepts:

```ts
type DiveLogSource = 'manual' | 'watch';
type DiveFieldSource = 'manual' | 'mobile' | 'watch';
type DiveLogSyncStatus = 'localOnly' | 'pending' | 'synced' | 'failed';

type DiveLogEntry = {
  localId: string;
  remoteId?: string;
  ownerUserId?: string;
  source: DiveLogSource;
  syncStatus: DiveLogSyncStatus;
  createdAt: number;
  updatedAt: number;
  manual: DiveLogManualFields;
  mobileAssisted?: DiveLogMobileAssistedFields;
  watch?: DiveLogWatchCapture;
  fieldSource: Partial<Record<DiveLogFieldKey, DiveFieldSource>>;
};
```

`WatchSession` remains the contract type for watch messages. `DiveLogEntry` becomes the mobile logbook entry that can be created from manual input or from a watch session.

### Field Provenance

Fields fall into three provenance groups:

- Manual fields: user-entered and editable.
- Mobile-assisted fields: suggested by the phone and editable.
- Watch-captured fields: imported from watch data, preserved as immutable source values.

Watch-captured values should be displayed with wording like "Watch-captured" or "워치 측정값". Avoid "certified", "verified", or wording that implies the app replaces a dive computer.

### Repository Boundary

The first repository should support local-only CRUD and later sync metadata:

```ts
type DiveLogRepository = {
  listEntries: () => Promise<DiveLogEntry[]>;
  getEntry: (localId: string) => Promise<DiveLogEntry | undefined>;
  saveEntry: (entry: DiveLogEntry) => Promise<DiveLogEntry>;
  deleteEntry: (localId: string) => Promise<void>;
  importWatchSession: (session: WatchSession) => Promise<DiveLogEntry>;
};
```

The initial local engine is intentionally not fixed in this design. Phase 0 should select the smallest local persistence option that fits the current app and future migration needs.

Phase 1 should add the React Query provider and logbook query/mutation hooks if `@tanstack/react-query` is not already present in the mobile workspace.

## Manual Log Creation

Manual log creation starts from the mobile app. It should allow the user to create a useful log without watch data.

Suggested first fields:

- Date and time.
- Dive mode.
- Site name.
- Location suggestion if supported by the chosen mobile capability.
- Duration.
- Max depth.
- Average depth if the user has it.
- Water temperature if the user has it.
- Buddy names.
- Gear labels.
- Tags.
- Observed marine life.
- Notes.
- Rating.

Manual measured fields are editable because they are user-entered. They should be visually distinct from watch-captured locked fields.

## Watch-Based Log Creation

Watch import should create a draft or incomplete `DiveLogEntry` with `source: 'watch'`.

The following should be locked as watch-captured source values:

- Start time.
- End time.
- Duration derived from start/end.
- Depth samples.
- Max depth.
- Average depth.
- Water temperature values if present.

The following remain editable manual context:

- Site name if not already meaningful.
- Buddy.
- Gear.
- Tags.
- Observed marine life.
- Notes.
- Rating.
- Photos.
- Conditions that were not measured.

If a user believes a watch value is wrong, the app should not overwrite the raw watch value in place. The safer design is to allow a note, a display exclusion, or a future correction layer that preserves the original.

## Watch Import Validation

Before building the real watch-based log authoring flow, validate that watch data can reach mobile through a real transport or a manual import bridge.

Validation should answer:

- Can the active Xcode watch target include and use the generated Swift contract or a compatible encoder?
- Can a saved watch session produce a `WatchSyncMessage` JSON payload matching `packages/contracts`?
- Can the mobile app parse the payload with generated TypeScript types?
- What is the chosen near-term transport: WatchConnectivity, debug export/import, or both?
- What manual device validation is required outside simulator?

This phase should not attempt cloud sync.

## Auth and Supabase Later

Authentication and Supabase should be added after local manual logs and watch-based logs have stable models.

When added:

- Guest mode continues to use local-only storage.
- Signed-in mode writes locally first and syncs to Supabase.
- Existing local logs can be offered for account upload after login.
- Supabase rows are owned by the authenticated user context, not by watch-side payloads.
- RLS must restrict user rows by ownership.
- Mobile code should use repository functions, not direct SQL.

## Error Handling

Local storage errors should surface as save/import failures without data loss. A failed save should keep the draft in memory if possible.

Watch import errors should distinguish:

- Invalid JSON.
- Contract validation or mapping failure.
- Duplicate session already imported.
- Storage failure after successful parsing.

Future sync errors should not delete local data. They should set `syncStatus: 'failed'` or keep `pending` with retry metadata.

## Testing

Use the smallest relevant gates first.

For the first implementation phase:

```bash
yarn mobile:typecheck
yarn workspace @repo/mobile test
```

If contract schemas or generated outputs change:

```bash
yarn check:quick
yarn mobile:typecheck
```

If watchOS transport or Swift/Xcode project files change:

```bash
yarn watch:build
```

For architecture/wiki handoff:

```bash
yarn codex:check
```

## Phasing

### Phase 0: Investigation

Confirm current mobile logbook state, local persistence candidates, watch JSON export state, and exact next-phase dependency choices.

### Phase 1: Domain and Repository Contract

Introduce `DiveLogEntry`, provenance types, draft/input types, repository interface, mapper functions, and tests.

### Phase 2: Local Manual Log Creation

Add local storage repository, manual create/edit flow, and logbook list/detail updates.

### Phase 3: Watch Import Validation

Verify real or debug watch-to-mobile payload movement without turning it into full sync.

### Phase 4: Watch-Based Log Authoring

Use imported watch sessions as locked measured-data drafts and let users complete missing manual context.

### Phase 5: Auth and Supabase Foundation

Add Supabase auth, schema, RLS, generated types, and remote repository.

### Phase 6: Storage Strategy by Login State

Add guest/local-only and signed-in/local-plus-sync behavior, including upload of existing local logs.

## Open Questions

- Which local storage engine should back `LocalDiveLogRepository`?
- Should watch imports be saved as drafts immediately or staged in an import inbox before becoming drafts?
- Which mobile location permission behavior is acceptable for first manual log creation?
- Should observed marine life be a free-text list first, or a structured taxonomy later?
- Which Supabase schema shape best preserves watch raw payloads without over-normalizing the first version?
