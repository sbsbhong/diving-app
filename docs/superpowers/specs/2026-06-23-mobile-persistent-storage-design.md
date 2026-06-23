# Mobile Persistent Storage Design

Date: 2026-06-23

## Summary

Add production mobile persistence for the current local-first app data before WatchConnectivity, Supabase, or authentication work. The approved direction is to use `@react-native-async-storage/async-storage` as the first React Native storage dependency, with a small versioned JSON adapter shared by Logbook, Planbook, and app preferences.

The goal is not to build a full database layer. The goal is to stop losing user-created logs, plans, and display preferences after app restart while preserving the repository boundaries that already exist.

## Approved Scope

Persist these mobile data groups:

- Logbook entries managed through `DiveLogRepository`.
- Planbook entries managed through `DivePlanRepository`.
- App display preferences managed by `AppPreferencesProvider`.

Implement them in a staged order:

1. Create a shared key-value storage adapter and migration helper.
2. Add persistent Logbook repository and tests.
3. Add persistent Planbook repository and tests.
4. Add persistent app preferences loading/saving and tests.
5. Wire the app provider/navigation layer to use persistent implementations by default.

## Non-Goals

- Do not add WatchConnectivity.
- Do not add Supabase, authentication, cloud backup, or account UI.
- Do not add SQLite or a query database in this phase.
- Do not make watch sensor data or mobile-entered data safety-critical truth.
- Do not rewrite generated contract output.
- Do not remove the in-memory repositories; keep them for tests, fallback, and focused unit coverage.

## Current Context

The mobile app already has good app-facing boundaries:

- `apps/mobile/src/repositories/dive-log-repository.ts` defines `DiveLogRepository`.
- `apps/mobile/src/repositories/local-dive-log-repository.ts` stores `DiveLogEntry` values in memory.
- `apps/mobile/src/repositories/dive-plan-repository.ts` defines `DivePlanRepository`.
- `apps/mobile/src/repositories/local-dive-plan-repository.ts` stores `DivePlan` values in memory.
- `apps/mobile/src/states/app-preferences.tsx` stores theme and language in React state.
- `apps/mobile/src/providers.tsx` wires React Query, safe area, preferences, Gluestack, and status bar.

The problem is that all three user-facing data groups are currently lost when the app process restarts.

## Storage Library Choice

Use `@react-native-async-storage/async-storage`.

Reasons:

- It is a React Native persistent asynchronous key-value storage library.
- Its async API fits the existing repository interfaces.
- It is simple enough for the current JSON document style.
- It supports iOS and Android, matching the mobile app target.
- It avoids choosing a structured database before query, migration, and sync needs are real.

Alternatives considered:

- `react-native-mmkv`: fast key-value storage with synchronous native bindings, encryption support, multiple instances, and React hooks. It adds more native complexity because current V4 uses Nitro Modules. That is unnecessary for the current app shape.
- SQLite-style storage: better for future structured queries and sync queues, but too heavy before the local domain model and Supabase mapping are stable.

Sources checked:

- `https://github.com/react-native-async-storage/async-storage`
- `https://github.com/mrousavy/react-native-mmkv`

## Architecture

Add a small storage boundary under mobile source, for example:

```txt
apps/mobile/src/storage/
  persistent-key-value-store.ts
  persistent-json-store.ts
  storage-migrations.ts
```

The adapter should hide the storage library from repositories and providers:

```ts
type PersistentKeyValueStore = {
  getString(key: string): Promise<string | undefined>;
  setString(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};
```

`AsyncStorage` should be wrapped behind this interface. Tests can pass an in-memory implementation of the same interface.

Use versioned JSON envelopes:

```ts
type StoredEnvelope<T> = {
  schemaVersion: number;
  updatedAt: number;
  value: T;
};
```

Use domain keys:

```txt
dive-app:logbook:v1
dive-app:planbook:v1
dive-app:preferences:v1
```

The `:v1` suffix is the storage key namespace. The JSON payload still carries `schemaVersion` so future migrations can read old payloads without changing every call site.

## Logbook Persistence

Add a persistent repository that implements `DiveLogRepository` and delegates domain behavior to the same rules used by `LocalDiveLogRepository`.

Recommended shape:

```txt
PersistentDiveLogRepository
  -> PersistentJsonStore<DiveLogEntry[]>
  -> PersistentKeyValueStore
```

Behavior:

- `list()` reads, migrates, clones, and sorts entries.
- `get(localId)` reads from persisted entries.
- `save(entry)` upserts the entry and persists the full collection.
- `delete(localId)` removes and persists.
- `importWatchMessages(messages)` preserves current deduplication and merge semantics.

The existing `LocalDiveLogRepository` can remain the in-memory behavior reference. If duplication grows, extract pure helper functions for clone, sort, and watch import merge instead of changing screen code.

## Planbook Persistence

Add a persistent repository that implements `DivePlanRepository`.

Behavior:

- `list()` reads, migrates, clones, and sorts plans using the same relevance order as the current local repository.
- `get(localId)` reads from persisted plans.
- `save(plan)` upserts and persists.
- `delete(localId)` removes and persists.

The Planbook should not create log entries automatically. The existing plan-to-log draft flow remains a navigation-level handoff.

## Preferences Persistence

Persist only user preferences, not derived values:

```ts
type StoredAppPreferences = {
  themePreference: ThemePreference;
  language: SupportedLanguage;
};
```

`resolvedTheme` remains derived from `themePreference` plus device color scheme.

Provider behavior:

- Initial state uses defaults until storage loads.
- After storage loads, apply persisted `themePreference`.
- Apply persisted `language` by calling `i18n.changeLanguage`.
- When setting theme or language, update React state and persist the new value.
- If language persistence succeeds but `i18n.changeLanguage` fails, keep the previous language state and do not claim the new language is active.

The provider may expose a short loading state internally, but the app should still render with defaults while preferences load.

## Data Flow

At app startup:

1. `Providers` creates React Query and app providers.
2. Repositories read persisted JSON on first query.
3. Screens receive data through existing hooks.
4. Preferences provider loads persisted preferences and updates theme/language state.

On mutation:

1. Screen calls existing hook action.
2. React Query mutation calls persistent repository.
3. Repository writes the updated JSON envelope through the storage adapter.
4. React Query invalidates or updates the relevant query.
5. Screen re-renders from repository-backed query data.

## Error Handling

Storage failures should not crash the whole app.

Read behavior:

- Missing value means empty/default domain state.
- Invalid JSON means empty/default domain state plus a recoverable error value where the current hook can expose one.
- Unsupported future `schemaVersion` should be treated as unreadable and reported as a storage compatibility error.

Write behavior:

- Failed writes should reject the repository method.
- Existing React Query mutation error surfaces should show save errors in Logbook and Planbook.
- Preferences write failures should keep the runtime preference state if the state change already succeeded, but future restart may fall back to the old persisted value.

Migration behavior:

- Add a migration function per domain even if only version 1 exists.
- Migrations must be pure and covered by unit tests.
- Do not silently mutate watch-captured raw payload fields during migration unless the contract requires it.

## Testing

Add focused tests before wiring the app to defaults:

- Persistent key-value adapter test with an in-memory fake.
- Logbook persistence saves, reloads, deletes, sorts, and preserves watch import merge behavior.
- Planbook persistence saves, reloads, deletes, and preserves sort behavior.
- Preferences persistence loads defaults, restores saved theme/language, and handles `i18n.changeLanguage` failure.
- Migration tests for valid v1 payload, missing payload, invalid JSON, and unsupported future version.

Verification gates:

```bash
yarn workspace @repo/mobile test
yarn mobile:typecheck
```

Because adding a React Native native dependency changes iOS/Android native setup, run this when the environment has CocoaPods/Xcode ready:

```bash
yarn ios:build
```

If pods or local Xcode setup are unavailable, report that accurately instead of treating the native build as passed.

## Follow-Up Boundaries

After this design is implemented, later work can use the persistent local store as the guest/offline source of truth. Watch sync validation, WatchConnectivity, Supabase/Auth, and cloud sync remain separate phases and should not be folded into the storage implementation.
