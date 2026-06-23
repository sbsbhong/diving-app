# Mobile Persistent Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist mobile Logbook, Planbook, and app preferences across app restarts using `@react-native-async-storage/async-storage`.

**Architecture:** Add a small versioned JSON storage adapter behind existing mobile repository/provider boundaries. Keep in-memory repositories for tests and fallback, add persistent repositories for app defaults, and preserve current React Query screen APIs.

**Tech Stack:** React Native 0.85.3, Yarn 1 workspaces, TypeScript, Jest, React Query, `@react-native-async-storage/async-storage`.

---

## Source Spec

- `docs/superpowers/specs/2026-06-23-mobile-persistent-storage-design.md`

## File Map

- Create: `apps/mobile/src/storage/persistent-key-value-store.ts`
  - Defines a small string key-value interface and wraps AsyncStorage.
- Create: `apps/mobile/src/storage/persistent-json-store.ts`
  - Reads/writes versioned JSON envelopes and handles missing, invalid, and unsupported payloads.
- Create: `apps/mobile/src/storage/in-memory-key-value-store.ts`
  - Test-friendly implementation of the key-value interface.
- Create: `apps/mobile/src/storage/storage-keys.ts`
  - Defines storage database and domain keys.
- Create: `apps/mobile/src/repositories/persistent-dive-log-repository.ts`
  - Implements `DiveLogRepository` using `PersistentJsonStore<DiveLogEntry[]>`.
- Create: `apps/mobile/src/repositories/default-dive-log-repository.ts`
  - Exports the app default persistent Logbook repository.
- Create: `apps/mobile/src/repositories/persistent-dive-plan-repository.ts`
  - Implements `DivePlanRepository` using `PersistentJsonStore<DivePlan[]>`.
- Create: `apps/mobile/src/repositories/default-dive-plan-repository.ts`
  - Exports the app default persistent Planbook repository.
- Create: `apps/mobile/src/states/app-preferences-storage.ts`
  - Persists `themePreference` and `language`.
- Modify: `apps/mobile/src/repositories/local-dive-log-repository.ts`
  - Export clone/sort/merge helpers for the persistent repository.
- Modify: `apps/mobile/src/repositories/local-dive-plan-repository.ts`
  - Export clone/sort helpers for the persistent repository.
- Modify: `apps/mobile/src/states/use-dive-logbook.ts`
  - Use the default persistent Logbook repository.
- Modify: `apps/mobile/src/states/use-dive-logbook-queries.ts`
  - Use the default persistent Logbook repository for default query keys.
- Modify: `apps/mobile/src/states/use-dive-plans.ts`
  - Use the default persistent Planbook repository.
- Modify: `apps/mobile/src/states/use-dive-plan-queries.ts`
  - Use the default persistent Planbook repository for default query keys.
- Modify: `apps/mobile/src/states/app-preferences.tsx`
  - Load and save persisted preferences.
- Modify: `apps/mobile/jest.config.js`
  - Add setup file for the AsyncStorage mock.
- Create: `apps/mobile/jest.setup.ts`
  - Mock `@react-native-async-storage/async-storage` for app-level Jest tests.
- Create: `apps/mobile/__tests__/persistent-json-store.test.ts`
- Create: `apps/mobile/__tests__/persistent-dive-log-repository.test.ts`
- Create: `apps/mobile/__tests__/persistent-dive-plan-repository.test.ts`
- Modify: `apps/mobile/__tests__/app-preferences.test.tsx`
- Modify: `apps/mobile/__tests__/App.test.tsx`
- Modify: `.wiki/wiki/architecture/mobile.md`
- Modify: `.wiki/wiki/architecture/mobile-logbook-roadmap.md`
- Modify: `.wiki/wiki/questions/open-questions.md`
- Modify: `.wiki/wiki/log.md`

## Task 1: Add AsyncStorage Dependency And Jest Setup

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `yarn.lock`
- Modify: `apps/mobile/jest.config.js`
- Create: `apps/mobile/jest.setup.ts`

- [ ] **Step 1: Add the mobile storage dependency**

Run from the repo root:

```bash
yarn workspace @repo/mobile add @react-native-async-storage/async-storage@^3.1.1
```

Expected:

- `apps/mobile/package.json` includes `@react-native-async-storage/async-storage`.
- `yarn.lock` is updated.
- No `package-lock.json`, `pnpm-lock.yaml`, or `bun.lockb` is created.

- [ ] **Step 2: Add the Jest setup file**

Create `apps/mobile/jest.setup.ts`:

```ts
const mockStores = new Map<string, Map<string, string>>();

type AsyncStorageInstance = {
  getItem: jest.Mock<Promise<string | null>, [string]>;
  setItem: jest.Mock<Promise<void>, [string, string]>;
  removeItem: jest.Mock<Promise<void>, [string]>;
  clear: jest.Mock<Promise<void>, []>;
};

const mockGetStore = (databaseName: string): Map<string, string> => {
  const current = mockStores.get(databaseName);

  if (current) {
    return current;
  }

  const next = new Map<string, string>();
  mockStores.set(databaseName, next);
  return next;
};

jest.mock('@react-native-async-storage/async-storage', () => {
  const createAsyncStorage = (databaseName = 'default'): AsyncStorageInstance => {
    const store = mockGetStore(databaseName);

    return {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      clear: jest.fn(async () => {
        store.clear();
      }),
    };
  };

  return {
    createAsyncStorage,
    __resetAsyncStorageMock: () => {
      mockStores.clear();
    },
  };
});
```

- [ ] **Step 3: Wire the setup file into Jest**

Modify `apps/mobile/jest.config.js`:

```js
module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve(
      '@react-native/jest-preset/jest/assetFileTransformer.js',
    ),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|nativewind|react-native-css-interop|@gluestack-ui|@legendapp)/)',
  ],
  watchman: false,
};
```

- [ ] **Step 4: Run app smoke tests**

Run:

```bash
yarn workspace @repo/mobile test App.test.tsx
```

Expected: PASS. If Jest cannot resolve the AsyncStorage module, stop and fix the setup before continuing.

- [ ] **Step 5: Commit dependency and Jest setup**

```bash
git add apps/mobile/package.json yarn.lock apps/mobile/jest.config.js apps/mobile/jest.setup.ts
git commit -m "chore: add mobile async storage dependency"
```

## Task 2: Add Versioned JSON Storage Adapter

**Files:**
- Create: `apps/mobile/src/storage/persistent-key-value-store.ts`
- Create: `apps/mobile/src/storage/in-memory-key-value-store.ts`
- Create: `apps/mobile/src/storage/storage-keys.ts`
- Create: `apps/mobile/src/storage/persistent-json-store.ts`
- Create: `apps/mobile/__tests__/persistent-json-store.test.ts`

- [ ] **Step 1: Write failing storage adapter tests**

Create `apps/mobile/__tests__/persistent-json-store.test.ts`:

```ts
import { InMemoryKeyValueStore } from '../src/storage/in-memory-key-value-store';
import { PersistentJsonStore, UnsupportedStorageVersionError } from '../src/storage/persistent-json-store';

type StoredValue = {
  label: string;
};

const createStore = (storage = new InMemoryKeyValueStore()) => {
  const readErrors: Error[] = [];

  return {
    storage,
    readErrors,
    jsonStore: new PersistentJsonStore<StoredValue>({
      key: 'test:value:v1',
      schemaVersion: 1,
      defaultValue: () => ({ label: 'default' }),
      migrate: envelope => {
        if (envelope.schemaVersion !== 1) {
          throw new UnsupportedStorageVersionError('test:value:v1', envelope.schemaVersion);
        }

        return envelope.value as StoredValue;
      },
      now: () => 1234,
      onReadError: error => readErrors.push(error),
      storage,
    }),
  };
};

describe('PersistentJsonStore', () => {
  it('returns the default value when no payload exists', async () => {
    const { jsonStore } = createStore();

    await expect(jsonStore.read()).resolves.toEqual({ label: 'default' });
  });

  it('writes and reads a versioned envelope', async () => {
    const { jsonStore, storage } = createStore();

    await jsonStore.write({ label: 'saved' });

    expect(await storage.getString('test:value:v1')).toBe(
      JSON.stringify({
        schemaVersion: 1,
        updatedAt: 1234,
        value: { label: 'saved' },
      }),
    );
    await expect(jsonStore.read()).resolves.toEqual({ label: 'saved' });
  });

  it('returns the default value and records a read error for invalid JSON', async () => {
    const { jsonStore, storage, readErrors } = createStore();

    await storage.setString('test:value:v1', '{bad json');

    await expect(jsonStore.read()).resolves.toEqual({ label: 'default' });
    expect(readErrors[0]).toBeInstanceOf(Error);
  });

  it('returns the default value and records a read error for unsupported future versions', async () => {
    const { jsonStore, storage, readErrors } = createStore();

    await storage.setString(
      'test:value:v1',
      JSON.stringify({
        schemaVersion: 99,
        updatedAt: 1234,
        value: { label: 'future' },
      }),
    );

    await expect(jsonStore.read()).resolves.toEqual({ label: 'default' });
    expect(readErrors[0]).toBeInstanceOf(UnsupportedStorageVersionError);
  });

  it('removes a stored payload', async () => {
    const { jsonStore, storage } = createStore();

    await jsonStore.write({ label: 'saved' });
    await jsonStore.remove();

    await expect(storage.getString('test:value:v1')).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the failing storage tests**

Run:

```bash
yarn workspace @repo/mobile test persistent-json-store.test.ts
```

Expected: FAIL because `../src/storage/in-memory-key-value-store` and `../src/storage/persistent-json-store` do not exist.

- [ ] **Step 3: Implement the key-value store interface and AsyncStorage wrapper**

Create `apps/mobile/src/storage/persistent-key-value-store.ts`:

```ts
import { createAsyncStorage } from '@react-native-async-storage/async-storage';
import { MOBILE_STORAGE_DATABASE_NAME } from './storage-keys';

export type PersistentKeyValueStore = {
  getString(key: string): Promise<string | undefined>;
  setString(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

export const createAsyncStorageKeyValueStore = (
  databaseName: string = MOBILE_STORAGE_DATABASE_NAME,
): PersistentKeyValueStore => {
  const storage = createAsyncStorage(databaseName);

  return {
    async getString(key: string): Promise<string | undefined> {
      const value = await storage.getItem(key);
      return value ?? undefined;
    },
    async setString(key: string, value: string): Promise<void> {
      await storage.setItem(key, value);
    },
    async remove(key: string): Promise<void> {
      await storage.removeItem(key);
    },
  };
};
```

Create `apps/mobile/src/storage/in-memory-key-value-store.ts`:

```ts
import type { PersistentKeyValueStore } from './persistent-key-value-store';

export class InMemoryKeyValueStore implements PersistentKeyValueStore {
  private readonly values = new Map<string, string>();

  async getString(key: string): Promise<string | undefined> {
    return this.values.get(key);
  }

  async setString(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }
}
```

Create `apps/mobile/src/storage/storage-keys.ts`:

```ts
export const MOBILE_STORAGE_DATABASE_NAME = 'dive-app-mobile';

export const mobileStorageKeys = {
  logbook: 'dive-app:logbook:v1',
  planbook: 'dive-app:planbook:v1',
  preferences: 'dive-app:preferences:v1',
} as const;
```

- [ ] **Step 4: Implement the JSON store**

Create `apps/mobile/src/storage/persistent-json-store.ts`:

```ts
import type { PersistentKeyValueStore } from './persistent-key-value-store';

export type StoredEnvelope<T> = {
  schemaVersion: number;
  updatedAt: number;
  value: T;
};

export type PersistentJsonStoreOptions<T> = {
  key: string;
  schemaVersion: number;
  defaultValue: () => T;
  migrate: (envelope: StoredEnvelope<unknown>) => T;
  storage: PersistentKeyValueStore;
  now?: () => number;
  onReadError?: (error: Error) => void;
};

export class UnsupportedStorageVersionError extends Error {
  constructor(key: string, schemaVersion: number) {
    super(`Unsupported storage schema version ${schemaVersion} for ${key}`);
    this.name = 'UnsupportedStorageVersionError';
  }
}

export class PersistentJsonStore<T> {
  private readonly key: string;
  private readonly schemaVersion: number;
  private readonly defaultValue: () => T;
  private readonly migrate: (envelope: StoredEnvelope<unknown>) => T;
  private readonly storage: PersistentKeyValueStore;
  private readonly now: () => number;
  private readonly onReadError?: (error: Error) => void;

  constructor(options: PersistentJsonStoreOptions<T>) {
    this.key = options.key;
    this.schemaVersion = options.schemaVersion;
    this.defaultValue = options.defaultValue;
    this.migrate = options.migrate;
    this.storage = options.storage;
    this.now = options.now ?? (() => Date.now() / 1000);
    this.onReadError = options.onReadError;
  }

  async read(): Promise<T> {
    const rawValue = await this.storage.getString(this.key);

    if (rawValue === undefined) {
      return this.defaultValue();
    }

    try {
      const envelope = JSON.parse(rawValue) as StoredEnvelope<unknown>;
      return this.migrate(envelope);
    } catch (error) {
      this.onReadError?.(toError(error));
      return this.defaultValue();
    }
  }

  async write(value: T): Promise<void> {
    const envelope: StoredEnvelope<T> = {
      schemaVersion: this.schemaVersion,
      updatedAt: this.now(),
      value,
    };

    await this.storage.setString(this.key, JSON.stringify(envelope));
  }

  async remove(): Promise<void> {
    await this.storage.remove(this.key);
  }
}

export function migrateVersionedValue<T>(key: string, schemaVersion: number, envelope: StoredEnvelope<unknown>): T {
  if (envelope.schemaVersion !== schemaVersion) {
    throw new UnsupportedStorageVersionError(key, Number(envelope.schemaVersion));
  }

  return envelope.value as T;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
```

- [ ] **Step 5: Run storage tests**

Run:

```bash
yarn workspace @repo/mobile test persistent-json-store.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit storage adapter**

```bash
git add apps/mobile/src/storage apps/mobile/__tests__/persistent-json-store.test.ts
git commit -m "feat: add mobile persistent json storage"
```

## Task 3: Add Persistent Logbook Repository

**Files:**
- Modify: `apps/mobile/src/repositories/local-dive-log-repository.ts`
- Create: `apps/mobile/src/repositories/persistent-dive-log-repository.ts`
- Create: `apps/mobile/src/repositories/default-dive-log-repository.ts`
- Create: `apps/mobile/__tests__/persistent-dive-log-repository.test.ts`

- [ ] **Step 1: Write failing persistent Logbook tests**

Create `apps/mobile/__tests__/persistent-dive-log-repository.test.ts`:

```ts
import { InMemoryKeyValueStore } from '../src/storage/in-memory-key-value-store';
import { PersistentDiveLogRepository } from '../src/repositories/persistent-dive-log-repository';
import type { DiveLogEntry } from '../src/types/dive-log-entry';
import type { WatchSyncMessage } from '../src/types/dive-session';

const manualEntry = (overrides: Partial<DiveLogEntry> = {}): DiveLogEntry => ({
  localId: 'manual-1',
  source: 'manual',
  syncStatus: 'localOnly',
  createdAt: 100,
  updatedAt: 100,
  manual: {
    site: { name: 'Manual Reef' },
    buddyIds: [],
    gearIds: [],
    tags: [],
    observedMarineLife: [],
    measuredValues: {
      startedAt: 100,
      maxDepthMeters: 12,
    },
  },
  mobile: {
    mediaPlaceholders: [],
  },
  provenance: {
    site: 'manual',
    measuredValues: 'manual',
  },
  ...overrides,
});

const watchMessage: WatchSyncMessage = {
  type: 'sessionEnded',
  session: {
    localSessionId: 'persistent-watch-1',
    schemaVersion: 1,
    siteName: 'Watch Reef',
    syncStatus: 'pending',
    startedAt: 200,
    endedAt: 260,
    maxDepthMeters: 14,
    averageDepthMeters: 8,
    samples: [],
  },
};

describe('PersistentDiveLogRepository', () => {
  it('saves, reloads, sorts, and deletes persisted entries', async () => {
    const storage = new InMemoryKeyValueStore();
    const repository = new PersistentDiveLogRepository({ storage, now: () => 999 });

    await repository.save(manualEntry({ localId: 'older', manual: { ...manualEntry().manual, measuredValues: { startedAt: 100 } } }));
    await repository.save(manualEntry({ localId: 'newer', manual: { ...manualEntry().manual, measuredValues: { startedAt: 300 } } }));

    const reloadedRepository = new PersistentDiveLogRepository({ storage, now: () => 999 });

    expect((await reloadedRepository.list()).map(entry => entry.localId)).toEqual(['newer', 'older']);

    await reloadedRepository.delete('newer');

    expect((await new PersistentDiveLogRepository({ storage, now: () => 999 }).list()).map(entry => entry.localId)).toEqual(['older']);
  });

  it('dedupes watch imports while preserving manual edits after reload', async () => {
    const storage = new InMemoryKeyValueStore();
    const repository = new PersistentDiveLogRepository({ storage, now: () => 500 });
    const [importedEntry] = await repository.importWatchMessages([watchMessage]);

    await repository.save({
      ...importedEntry,
      manual: {
        ...importedEntry.manual,
        site: { name: 'Edited Reef' },
        notes: 'Keep mobile edits.',
      },
      provenance: {
        ...importedEntry.provenance,
        site: 'manual',
        notes: 'manual',
      },
    });

    const reloadedRepository = new PersistentDiveLogRepository({ storage, now: () => 700 });
    const [reimportedEntry] = await reloadedRepository.importWatchMessages([
      {
        ...watchMessage,
        session: {
          ...watchMessage.session,
          syncStatus: 'synced',
          siteName: 'Updated Watch Reef',
          maxDepthMeters: 18,
        },
      },
    ]);

    expect((await reloadedRepository.list())).toHaveLength(1);
    expect(reimportedEntry.localId).toBe(importedEntry.localId);
    expect(reimportedEntry.manual.site.name).toBe('Edited Reef');
    expect(reimportedEntry.manual.notes).toBe('Keep mobile edits.');
    expect(reimportedEntry.syncStatus).toBe('synced');
    expect(reimportedEntry.watchCapture?.session.siteName).toBe('Updated Watch Reef');
    expect(reimportedEntry.watchCapture?.measuredValues.maxDepthMeters).toBe(18);
  });

  it('returns cloned entries so callers cannot mutate persisted state', async () => {
    const repository = new PersistentDiveLogRepository({ storage: new InMemoryKeyValueStore(), now: () => 500 });

    const saved = await repository.save(manualEntry());
    saved.manual.site.name = 'Mutated Reef';

    const [listed] = await repository.list();
    listed.manual.site.name = 'Listed Mutation';

    expect((await repository.get('manual-1'))?.manual.site.name).toBe('Manual Reef');
  });
});
```

- [ ] **Step 2: Run the failing persistent Logbook tests**

Run:

```bash
yarn workspace @repo/mobile test persistent-dive-log-repository.test.ts
```

Expected: FAIL because `persistent-dive-log-repository` does not exist.

- [ ] **Step 3: Export local Logbook helper functions**

Modify `apps/mobile/src/repositories/local-dive-log-repository.ts`:

```ts
// Keep existing imports and class body. Rename private helper functions to exports:

export function cloneDiveLogEntry(entry: DiveLogEntry): DiveLogEntry {
  return JSON.parse(JSON.stringify(entry)) as DiveLogEntry;
}

export function mergeWatchImport(currentEntry: DiveLogEntry | undefined, nextEntry: DiveLogEntry): DiveLogEntry {
  if (!currentEntry) {
    return nextEntry;
  }

  return {
    ...nextEntry,
    localId: currentEntry.localId,
    remoteId: currentEntry.remoteId,
    ownerUserId: currentEntry.ownerUserId,
    createdAt: currentEntry.createdAt,
    manual: currentEntry.manual,
    mobile: currentEntry.mobile,
    watchCapture: nextEntry.watchCapture
      ? {
          ...nextEntry.watchCapture,
          importedAt: currentEntry.watchCapture?.importedAt ?? nextEntry.watchCapture.importedAt,
        }
      : undefined,
    provenance: {
      ...nextEntry.provenance,
      site: currentEntry.provenance.site,
      buddyIds: currentEntry.provenance.buddyIds,
      gearIds: currentEntry.provenance.gearIds,
      tags: currentEntry.provenance.tags,
      observedMarineLife: currentEntry.provenance.observedMarineLife,
      notes: currentEntry.provenance.notes,
      rating: currentEntry.provenance.rating,
      measuredValues: currentEntry.provenance.measuredValues,
      mediaPlaceholders: currentEntry.provenance.mediaPlaceholders,
    },
  };
}

export function compareDiveLogEntries(left: DiveLogEntry, right: DiveLogEntry): number {
  return getEntrySortTimestamp(right) - getEntrySortTimestamp(left);
}
```

Then replace internal calls:

```ts
cloneEntry(entry) -> cloneDiveLogEntry(entry)
compareEntries -> compareDiveLogEntries
```

Remove the old private `cloneEntry`, private `mergeWatchImport`, and private `compareEntries` declarations after the exported versions compile.

- [ ] **Step 4: Implement the persistent Logbook repository**

Create `apps/mobile/src/repositories/persistent-dive-log-repository.ts`:

```ts
import type { DiveLogEntry } from '../types/dive-log-entry';
import type { WatchSyncMessage } from '../types/dive-session';
import { watchSessionToDiveLogEntry } from '../utils/watch-session-to-dive-log-entry';
import type { DiveLogRepository } from './dive-log-repository';
import {
  cloneDiveLogEntry,
  compareDiveLogEntries,
  createDefaultDiveLogRepository,
  DEFAULT_FIXTURE_IMPORTED_AT,
  mergeWatchImport,
} from './local-dive-log-repository';
import { createAsyncStorageKeyValueStore, type PersistentKeyValueStore } from '../storage/persistent-key-value-store';
import { PersistentJsonStore, migrateVersionedValue } from '../storage/persistent-json-store';
import { mobileStorageKeys } from '../storage/storage-keys';

export type PersistentDiveLogRepositoryOptions = {
  storage?: PersistentKeyValueStore;
  now?: () => number;
  initialEntries?: DiveLogEntry[];
  onReadError?: (error: Error) => void;
};

export class PersistentDiveLogRepository implements DiveLogRepository {
  private readonly store: PersistentJsonStore<DiveLogEntry[]>;
  private readonly now: () => number;

  constructor(options: PersistentDiveLogRepositoryOptions = {}) {
    const initialEntries = options.initialEntries ?? [];
    this.now = options.now ?? getCurrentTimestampSeconds;
    this.store = new PersistentJsonStore<DiveLogEntry[]>({
      key: mobileStorageKeys.logbook,
      schemaVersion: 1,
      defaultValue: () => initialEntries.map(cloneDiveLogEntry),
      migrate: envelope => migrateVersionedValue<DiveLogEntry[]>(mobileStorageKeys.logbook, 1, envelope),
      storage: options.storage ?? createAsyncStorageKeyValueStore(),
      now: this.now,
      onReadError: options.onReadError,
    });
  }

  async list(): Promise<DiveLogEntry[]> {
    return (await this.readEntries()).map(cloneDiveLogEntry).sort(compareDiveLogEntries);
  }

  async get(localId: string): Promise<DiveLogEntry | undefined> {
    const entry = (await this.readEntries()).find(currentEntry => currentEntry.localId === localId);
    return entry ? cloneDiveLogEntry(entry) : undefined;
  }

  async save(entry: DiveLogEntry): Promise<DiveLogEntry> {
    const entries = await this.readEntries();
    const nextEntries = entries.some(currentEntry => currentEntry.localId === entry.localId)
      ? entries.map(currentEntry => (currentEntry.localId === entry.localId ? cloneDiveLogEntry(entry) : currentEntry))
      : [...entries, cloneDiveLogEntry(entry)];

    await this.writeEntries(nextEntries);
    return cloneDiveLogEntry(entry);
  }

  async delete(localId: string): Promise<void> {
    const entries = await this.readEntries();
    await this.writeEntries(entries.filter(entry => entry.localId !== localId));
  }

  async importWatchMessages(messages: WatchSyncMessage[]): Promise<DiveLogEntry[]> {
    const now = this.now();
    let entries = await this.readEntries();

    for (const message of messages) {
      const nextEntry = watchSessionToDiveLogEntry({ session: message.session, now });
      const currentEntry = findByImportKey(entries, nextEntry.watchCapture?.importKey);
      const mergedEntry = mergeWatchImport(currentEntry, nextEntry);

      entries = currentEntry
        ? entries.map(entry => (entry.localId === currentEntry.localId ? mergedEntry : entry))
        : [...entries, mergedEntry];
    }

    await this.writeEntries(entries);
    return this.list();
  }

  private async readEntries(): Promise<DiveLogEntry[]> {
    return (await this.store.read()).map(cloneDiveLogEntry);
  }

  private async writeEntries(entries: DiveLogEntry[]): Promise<void> {
    await this.store.write(entries.map(cloneDiveLogEntry).sort(compareDiveLogEntries));
  }
}

export const createDefaultPersistentDiveLogRepository = (
  options: PersistentDiveLogRepositoryOptions = {},
): PersistentDiveLogRepository => {
  return new PersistentDiveLogRepository({
    initialEntries: createDefaultDiveLogRepository({ now: () => DEFAULT_FIXTURE_IMPORTED_AT }).listSync(),
    ...options,
  });
};

export const defaultPersistentDiveLogRepository = createDefaultPersistentDiveLogRepository();

function findByImportKey(entries: DiveLogEntry[], importKey: string | undefined): DiveLogEntry | undefined {
  if (!importKey) {
    return undefined;
  }

  return entries.find(entry => entry.watchCapture?.importKey === importKey);
}

function getCurrentTimestampSeconds(): number {
  return Date.now() / 1000;
}
```

Create `apps/mobile/src/repositories/default-dive-log-repository.ts`:

```ts
export { defaultPersistentDiveLogRepository as defaultDiveLogRepository } from './persistent-dive-log-repository';
```

- [ ] **Step 5: Run persistent Logbook tests**

Run:

```bash
yarn workspace @repo/mobile test persistent-dive-log-repository.test.ts local-dive-log-repository.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit persistent Logbook repository**

```bash
git add apps/mobile/src/repositories/local-dive-log-repository.ts apps/mobile/src/repositories/persistent-dive-log-repository.ts apps/mobile/src/repositories/default-dive-log-repository.ts apps/mobile/__tests__/persistent-dive-log-repository.test.ts
git commit -m "feat: persist mobile logbook entries"
```

## Task 4: Add Persistent Planbook Repository

**Files:**
- Modify: `apps/mobile/src/repositories/local-dive-plan-repository.ts`
- Create: `apps/mobile/src/repositories/persistent-dive-plan-repository.ts`
- Create: `apps/mobile/src/repositories/default-dive-plan-repository.ts`
- Create: `apps/mobile/__tests__/persistent-dive-plan-repository.test.ts`

- [ ] **Step 1: Write failing persistent Planbook tests**

Create `apps/mobile/__tests__/persistent-dive-plan-repository.test.ts`:

```ts
import { LocalDivePlanRepository } from '../src/repositories/local-dive-plan-repository';
import { PersistentDivePlanRepository } from '../src/repositories/persistent-dive-plan-repository';
import { InMemoryKeyValueStore } from '../src/storage/in-memory-key-value-store';
import type { DivePlan } from '../src/types/dive-plan';

const plan = (overrides: Partial<DivePlan>): DivePlan => ({
  localId: 'plan-base',
  status: 'draft',
  createdAt: 100,
  updatedAt: 100,
  site: {},
  buddyIds: [],
  gearIds: [],
  tags: [],
  plannedValues: {},
  checklistItems: [],
  ...overrides,
});

describe('PersistentDivePlanRepository', () => {
  it('saves, reloads, sorts, and deletes persisted plans', async () => {
    const storage = new InMemoryKeyValueStore();
    const repository = new PersistentDivePlanRepository({ storage, now: () => 350 });

    await repository.save(plan({ localId: 'completed', status: 'completed', completedAt: 210, updatedAt: 210 }));
    await repository.save(plan({ localId: 'future-planned', status: 'planned', plannedAt: 500, updatedAt: 150 }));
    await repository.save(plan({ localId: 'draft', status: 'draft', updatedAt: 300 }));
    await repository.save(plan({ localId: 'near-planned', status: 'planned', plannedAt: 400, updatedAt: 180 }));

    const reloadedRepository = new PersistentDivePlanRepository({ storage, now: () => 350 });

    expect((await reloadedRepository.list()).map(currentPlan => currentPlan.localId)).toEqual([
      'near-planned',
      'future-planned',
      'draft',
      'completed',
    ]);

    await reloadedRepository.delete('draft');

    expect((await new PersistentDivePlanRepository({ storage, now: () => 350 }).list()).map(currentPlan => currentPlan.localId)).toEqual([
      'near-planned',
      'future-planned',
      'completed',
    ]);
  });

  it('matches the local repository sort order', async () => {
    const plans = [
      plan({ localId: 'completed', status: 'completed', completedAt: 210, updatedAt: 210 }),
      plan({ localId: 'future-planned', status: 'planned', plannedAt: 500, updatedAt: 150 }),
      plan({ localId: 'draft', status: 'draft', updatedAt: 300 }),
      plan({ localId: 'near-planned', status: 'planned', plannedAt: 400, updatedAt: 180 }),
    ];
    const persistentRepository = new PersistentDivePlanRepository({ storage: new InMemoryKeyValueStore(), now: () => 350 });
    const localRepository = new LocalDivePlanRepository(plans, { now: () => 350 });

    for (const currentPlan of plans) {
      await persistentRepository.save(currentPlan);
    }

    expect((await persistentRepository.list()).map(currentPlan => currentPlan.localId)).toEqual(
      (await localRepository.list()).map(currentPlan => currentPlan.localId),
    );
  });

  it('returns cloned plans so callers cannot mutate persisted state', async () => {
    const repository = new PersistentDivePlanRepository({ storage: new InMemoryKeyValueStore(), now: () => 350 });

    const saved = await repository.save(
      plan({
        localId: 'plan-1',
        site: { name: 'Original Reef' },
        checklistItems: [{ id: 'gear', label: 'Gear', completed: false }],
      }),
    );

    saved.site.name = 'Mutated Reef';
    saved.checklistItems[0].completed = true;

    expect((await repository.get('plan-1'))?.site.name).toBe('Original Reef');
    expect((await repository.get('plan-1'))?.checklistItems[0].completed).toBe(false);
  });
});
```

- [ ] **Step 2: Run the failing persistent Planbook tests**

Run:

```bash
yarn workspace @repo/mobile test persistent-dive-plan-repository.test.ts
```

Expected: FAIL because `persistent-dive-plan-repository` does not exist.

- [ ] **Step 3: Export local Planbook helper functions**

Modify `apps/mobile/src/repositories/local-dive-plan-repository.ts`:

```ts
export function cloneDivePlan(plan: DivePlan): DivePlan {
  return JSON.parse(JSON.stringify(plan)) as DivePlan;
}

export function compareDivePlans(left: DivePlan, right: DivePlan, now: number): number {
  const leftBucket = getSortBucket(left, now);
  const rightBucket = getSortBucket(right, now);

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket;
  }

  return getSortTimestamp(left, now) - getSortTimestamp(right, now);
}
```

Then replace internal calls:

```ts
clonePlan(plan) -> cloneDivePlan(plan)
comparePlans(left, right, this.now()) -> compareDivePlans(left, right, this.now())
```

Remove the old private `clonePlan` and private `comparePlans` declarations after the exported helpers compile.

- [ ] **Step 4: Implement the persistent Planbook repository**

Create `apps/mobile/src/repositories/persistent-dive-plan-repository.ts`:

```ts
import type { DivePlan } from '../types/dive-plan';
import type { DivePlanRepository } from './dive-plan-repository';
import { cloneDivePlan, compareDivePlans } from './local-dive-plan-repository';
import { createAsyncStorageKeyValueStore, type PersistentKeyValueStore } from '../storage/persistent-key-value-store';
import { PersistentJsonStore, migrateVersionedValue } from '../storage/persistent-json-store';
import { mobileStorageKeys } from '../storage/storage-keys';

export type PersistentDivePlanRepositoryOptions = {
  storage?: PersistentKeyValueStore;
  now?: () => number;
  initialPlans?: DivePlan[];
  onReadError?: (error: Error) => void;
};

export class PersistentDivePlanRepository implements DivePlanRepository {
  private readonly store: PersistentJsonStore<DivePlan[]>;
  private readonly now: () => number;

  constructor(options: PersistentDivePlanRepositoryOptions = {}) {
    const initialPlans = options.initialPlans ?? [];
    this.now = options.now ?? getCurrentTimestampSeconds;
    this.store = new PersistentJsonStore<DivePlan[]>({
      key: mobileStorageKeys.planbook,
      schemaVersion: 1,
      defaultValue: () => initialPlans.map(cloneDivePlan),
      migrate: envelope => migrateVersionedValue<DivePlan[]>(mobileStorageKeys.planbook, 1, envelope),
      storage: options.storage ?? createAsyncStorageKeyValueStore(),
      now: this.now,
      onReadError: options.onReadError,
    });
  }

  async list(): Promise<DivePlan[]> {
    return (await this.readPlans()).map(cloneDivePlan).sort((left, right) => compareDivePlans(left, right, this.now()));
  }

  async get(localId: string): Promise<DivePlan | undefined> {
    const plan = (await this.readPlans()).find(currentPlan => currentPlan.localId === localId);
    return plan ? cloneDivePlan(plan) : undefined;
  }

  async save(plan: DivePlan): Promise<DivePlan> {
    const plans = await this.readPlans();
    const nextPlans = plans.some(currentPlan => currentPlan.localId === plan.localId)
      ? plans.map(currentPlan => (currentPlan.localId === plan.localId ? cloneDivePlan(plan) : currentPlan))
      : [...plans, cloneDivePlan(plan)];

    await this.writePlans(nextPlans);
    return cloneDivePlan(plan);
  }

  async delete(localId: string): Promise<void> {
    const plans = await this.readPlans();
    await this.writePlans(plans.filter(plan => plan.localId !== localId));
  }

  private async readPlans(): Promise<DivePlan[]> {
    return (await this.store.read()).map(cloneDivePlan);
  }

  private async writePlans(plans: DivePlan[]): Promise<void> {
    await this.store.write(plans.map(cloneDivePlan).sort((left, right) => compareDivePlans(left, right, this.now())));
  }
}

export const createDefaultPersistentDivePlanRepository = (
  options: PersistentDivePlanRepositoryOptions = {},
): PersistentDivePlanRepository => new PersistentDivePlanRepository(options);

export const defaultPersistentDivePlanRepository = createDefaultPersistentDivePlanRepository();

function getCurrentTimestampSeconds(): number {
  return Date.now() / 1000;
}
```

Create `apps/mobile/src/repositories/default-dive-plan-repository.ts`:

```ts
export { defaultPersistentDivePlanRepository as defaultDivePlanRepository } from './persistent-dive-plan-repository';
```

- [ ] **Step 5: Run persistent Planbook tests**

Run:

```bash
yarn workspace @repo/mobile test persistent-dive-plan-repository.test.ts local-dive-plan-repository.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit persistent Planbook repository**

```bash
git add apps/mobile/src/repositories/local-dive-plan-repository.ts apps/mobile/src/repositories/persistent-dive-plan-repository.ts apps/mobile/src/repositories/default-dive-plan-repository.ts apps/mobile/__tests__/persistent-dive-plan-repository.test.ts
git commit -m "feat: persist mobile dive plans"
```

## Task 5: Persist App Preferences

**Files:**
- Create: `apps/mobile/src/states/app-preferences-storage.ts`
- Modify: `apps/mobile/src/states/app-preferences.tsx`
- Modify: `apps/mobile/__tests__/app-preferences.test.tsx`

- [ ] **Step 1: Add failing preferences persistence tests**

Append these tests to `apps/mobile/__tests__/app-preferences.test.tsx`:

```ts
import { InMemoryKeyValueStore } from '../src/storage/in-memory-key-value-store';
import { createAppPreferencesStorage } from '../src/states/app-preferences-storage';
```

Add these tests inside `describe('app preferences', () => { ... })`:

```ts
  test('restores saved preferences from persistent storage', async () => {
    const storage = createAppPreferencesStorage({ storage: new InMemoryKeyValueStore(), now: () => 1000 });
    await storage.save({ themePreference: 'dark', language: 'en' });
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider storage={storage}>
          <Probe onValue={jest.fn()} />
        </AppPreferencesProvider>,
      );
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:en');
    expect(i18n.language).toBe('en');
  });

  test('persists runtime preference changes', async () => {
    const storage = createAppPreferencesStorage({ storage: new InMemoryKeyValueStore(), now: () => 1000 });
    const snapshots: AppPreferences[] = [];
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider storage={storage}>
          <Probe onValue={value => snapshots.push(value)} />
        </AppPreferencesProvider>,
      );
    });

    await ReactTestRenderer.act(async () => {
      snapshots[snapshots.length - 1].setThemePreference('dark');
    });
    await ReactTestRenderer.act(async () => {
      await snapshots[snapshots.length - 1].setLanguage('en');
    });

    expect(await storage.load()).toEqual({ themePreference: 'dark', language: 'en' });
    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:en');
  });

  test('does not persist a language selection when i18next rejects it', async () => {
    const storage = createAppPreferencesStorage({ storage: new InMemoryKeyValueStore(), now: () => 1000 });
    const snapshots: AppPreferences[] = [];
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider storage={storage}>
          <Probe onValue={value => snapshots.push(value)} />
        </AppPreferencesProvider>,
      );
    });

    const changeLanguageSpy = jest
      .spyOn(i18n, 'changeLanguage')
      .mockRejectedValueOnce(new Error('language change failed'));

    try {
      await ReactTestRenderer.act(async () => {
        await snapshots[snapshots.length - 1].setLanguage('en');
      });

      expect(await storage.load()).toEqual({ themePreference: 'system', language: 'ko' });
      expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko');
    } finally {
      changeLanguageSpy.mockRestore();
    }
  });
```

- [ ] **Step 2: Run the failing preferences tests**

Run:

```bash
yarn workspace @repo/mobile test app-preferences.test.tsx
```

Expected: FAIL because `app-preferences-storage` does not exist and `AppPreferencesProvider` has no `storage` prop.

- [ ] **Step 3: Implement preferences storage**

Create `apps/mobile/src/states/app-preferences-storage.ts`:

```ts
import type { SupportedLanguage } from '../i18n';
import { resolveSupportedLanguage } from '../i18n';
import type { ThemePreference } from './app-preferences';
import { createAsyncStorageKeyValueStore, type PersistentKeyValueStore } from '../storage/persistent-key-value-store';
import { PersistentJsonStore, migrateVersionedValue } from '../storage/persistent-json-store';
import { mobileStorageKeys } from '../storage/storage-keys';

export type StoredAppPreferences = {
  themePreference: ThemePreference;
  language: SupportedLanguage;
};

export type AppPreferencesStorage = {
  load(): Promise<StoredAppPreferences>;
  save(preferences: StoredAppPreferences): Promise<void>;
};

export type AppPreferencesStorageOptions = {
  storage?: PersistentKeyValueStore;
  now?: () => number;
  onReadError?: (error: Error) => void;
};

const DEFAULT_APP_PREFERENCES: StoredAppPreferences = {
  themePreference: 'system',
  language: 'ko',
};

export const createAppPreferencesStorage = (options: AppPreferencesStorageOptions = {}): AppPreferencesStorage => {
  const store = new PersistentJsonStore<StoredAppPreferences>({
    key: mobileStorageKeys.preferences,
    schemaVersion: 1,
    defaultValue: () => DEFAULT_APP_PREFERENCES,
    migrate: envelope => normalizePreferences(migrateVersionedValue<StoredAppPreferences>(mobileStorageKeys.preferences, 1, envelope)),
    storage: options.storage ?? createAsyncStorageKeyValueStore(),
    now: options.now,
    onReadError: options.onReadError,
  });

  return {
    load: () => store.read(),
    save: preferences => store.write(normalizePreferences(preferences)),
  };
};

export const defaultAppPreferencesStorage = createAppPreferencesStorage();

function normalizePreferences(preferences: StoredAppPreferences): StoredAppPreferences {
  return {
    themePreference: normalizeThemePreference(preferences.themePreference),
    language: resolveSupportedLanguage(preferences.language),
  };
}

function normalizeThemePreference(themePreference: ThemePreference): ThemePreference {
  return themePreference === 'light' || themePreference === 'dark' || themePreference === 'system'
    ? themePreference
    : 'system';
}
```

- [ ] **Step 4: Modify the preferences provider**

Modify `apps/mobile/src/states/app-preferences.tsx`:

```ts
import {
  defaultAppPreferencesStorage,
  type AppPreferencesStorage,
} from './app-preferences-storage';
```

Change props:

```ts
type AppPreferencesProviderProps = {
  children?: React.ReactNode;
  storage?: AppPreferencesStorage;
};
```

Inside `AppPreferencesProvider`, add:

```ts
  const storage = props.storage ?? defaultAppPreferencesStorage;
```

Add this effect after state declarations:

```ts
  React.useEffect(() => {
    let isMounted = true;

    storage
      .load()
      .then(async storedPreferences => {
        if (!isMounted) {
          return;
        }

        setThemePreferenceState(storedPreferences.themePreference);
        await i18n.changeLanguage(storedPreferences.language);
        if (isMounted) {
          setLanguageState(storedPreferences.language);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [storage]);
```

Replace `setThemePreference`:

```ts
  const setThemePreference = React.useCallback(
    (nextThemePreference: ThemePreference) => {
      setThemePreferenceState(nextThemePreference);
      void storage.save({ themePreference: nextThemePreference, language });
    },
    [language, storage],
  );
```

Replace `setLanguage`:

```ts
  const setLanguage = React.useCallback(
    async (nextLanguage: SupportedLanguage) => {
      const supportedLanguage = resolveSupportedLanguage(nextLanguage);

      try {
        await i18n.changeLanguage(supportedLanguage);
        setLanguageState(supportedLanguage);
        await storage.save({ themePreference, language: supportedLanguage });
      } catch {
        // Keep the previous language selection when i18next rejects the change.
      }
    },
    [storage, themePreference],
  );
```

Keep the existing `languageChanged` subscription so external i18n updates still update runtime state.

- [ ] **Step 5: Run preferences tests**

Run:

```bash
yarn workspace @repo/mobile test app-preferences.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit preferences persistence**

```bash
git add apps/mobile/src/states/app-preferences-storage.ts apps/mobile/src/states/app-preferences.tsx apps/mobile/__tests__/app-preferences.test.tsx
git commit -m "feat: persist mobile app preferences"
```

## Task 6: Wire Persistent Repositories Into App Defaults

**Files:**
- Modify: `apps/mobile/src/states/use-dive-logbook.ts`
- Modify: `apps/mobile/src/states/use-dive-logbook-queries.ts`
- Modify: `apps/mobile/src/states/use-dive-plans.ts`
- Modify: `apps/mobile/src/states/use-dive-plan-queries.ts`
- Modify: `apps/mobile/__tests__/App.test.tsx`
- Modify: `apps/mobile/__tests__/use-dive-logbook-queries.test.ts`

- [ ] **Step 1: Add app-level persistence smoke tests**

Modify `apps/mobile/__tests__/App.test.tsx`.

Add this import:

```ts
import { defaultDiveLogRepository } from '../src/repositories/default-dive-log-repository';
```

Add this test inside `describe('App navigation', () => { ... })`:

```ts
  test('uses the persistent default logbook repository', async () => {
    const entries = await defaultDiveLogRepository.list();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].watchCapture?.importKey).toBeTruthy();
  });
```

Modify `apps/mobile/__tests__/use-dive-logbook-queries.test.ts` to assert explicit repository scoping still works. Keep the existing tests and add:

```ts
  it('keeps explicit local repositories isolated after persistent defaults are introduced', () => {
    const repository = new LocalDiveLogRepository();

    expect(diveLogbookQueryKeys.list(repository, 'local-test')).toEqual(['diveLogbook', 'local-test', 'list']);
  });
```

- [ ] **Step 2: Run the app wiring tests before wiring**

Run:

```bash
yarn workspace @repo/mobile test App.test.tsx use-dive-logbook-queries.test.ts
```

Expected: PASS. The direct default repository import should already exist from Task 3, and the explicit local repository query-key tests should remain isolated.

- [ ] **Step 3: Update Logbook default imports**

Modify `apps/mobile/src/states/use-dive-logbook.ts`:

```ts
import { defaultDiveLogRepository } from '../repositories/default-dive-log-repository';
```

Remove the import from `../repositories/local-dive-log-repository`.

Modify `apps/mobile/src/states/use-dive-logbook-queries.ts`:

```ts
import { defaultDiveLogRepository } from '../repositories/default-dive-log-repository';
```

Remove the import from `../repositories/local-dive-log-repository`.

- [ ] **Step 4: Update Planbook default imports**

Modify `apps/mobile/src/states/use-dive-plans.ts`:

```ts
import { defaultDivePlanRepository } from '../repositories/default-dive-plan-repository';
```

Remove the import from `../repositories/local-dive-plan-repository`.

Modify `apps/mobile/src/states/use-dive-plan-queries.ts`:

```ts
import { defaultDivePlanRepository } from '../repositories/default-dive-plan-repository';
```

Remove the import from `../repositories/local-dive-plan-repository`.

- [ ] **Step 5: Run app wiring tests**

Run:

```bash
yarn workspace @repo/mobile test App.test.tsx use-dive-logbook-queries.test.ts use-dive-logbook.test.ts planning-screen.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Run mobile typecheck**

Run:

```bash
yarn mobile:typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit default wiring**

```bash
git add apps/mobile/src/states/use-dive-logbook.ts apps/mobile/src/states/use-dive-logbook-queries.ts apps/mobile/src/states/use-dive-plans.ts apps/mobile/src/states/use-dive-plan-queries.ts apps/mobile/__tests__/App.test.tsx apps/mobile/__tests__/use-dive-logbook-queries.test.ts
git commit -m "feat: use persistent mobile repositories by default"
```

## Task 7: Update Wiki And Run Full Verification

**Files:**
- Modify: `.wiki/wiki/architecture/mobile.md`
- Modify: `.wiki/wiki/architecture/mobile-logbook-roadmap.md`
- Modify: `.wiki/wiki/questions/open-questions.md`
- Modify: `.wiki/wiki/log.md`

- [ ] **Step 1: Use the wiki-writing skill**

Before editing wiki pages, read `.agents/skills/wiki-writing/SKILL.md` and follow its workflow. The durable facts to record are:

- Mobile now uses AsyncStorage-backed persistent repositories for app defaults.
- In-memory repositories still exist for tests and focused behavior.
- Preferences persist `themePreference` and `language`; `resolvedTheme` remains derived.
- Production mobile persistence is no longer an open question for Logbook, Planbook, and preferences, but WatchConnectivity, Supabase/Auth, and real watch sensor behavior remain open.

- [ ] **Step 2: Update mobile architecture wiki**

Modify `.wiki/wiki/architecture/mobile.md`:

- Replace statements saying Logbook and Planbook app defaults are only in-memory.
- Add AsyncStorage-backed persistent repositories under current source boundaries.
- Keep the statement that Supabase, Auth, live WatchConnectivity, and certified dive-computer behavior are not implemented.

- [ ] **Step 3: Update roadmap and open questions**

Modify `.wiki/wiki/architecture/mobile-logbook-roadmap.md`:

- Add that mobile production persistence for local Logbook storage is implemented with AsyncStorage-backed repositories.
- Keep future Supabase phases separate.

Modify `.wiki/wiki/questions/open-questions.md`:

- Remove or narrow the open question that says the mobile storage engine is undecided.
- Keep open questions for migration behavior beyond v1, Supabase/Auth, WatchConnectivity, generated Swift contract target membership, and real sensor validation.

- [ ] **Step 4: Append wiki log entry**

Append this entry to `.wiki/wiki/log.md` with the current date:

```md
## 2026-06-23 - 구조 - mobile persistent storage

- 수정:
  - `.wiki/wiki/architecture/mobile.md`
  - `.wiki/wiki/architecture/mobile-logbook-roadmap.md`
  - `.wiki/wiki/questions/open-questions.md`
  - `.wiki/wiki/log.md`
- 근거:
  - `apps/mobile/src/storage/`
  - `apps/mobile/src/repositories/persistent-dive-log-repository.ts`
  - `apps/mobile/src/repositories/persistent-dive-plan-repository.ts`
  - `apps/mobile/src/states/app-preferences-storage.ts`
  - `apps/mobile/src/states/app-preferences.tsx`
- 요약:
  - 모바일 Logbook, Planbook, 설정 선호가 AsyncStorage 기반 versioned JSON 저장소를 통해 앱 재시작 뒤에도 유지되는 구조를 기록했다.
```

- [ ] **Step 5: Run mobile tests**

Run:

```bash
yarn workspace @repo/mobile test
```

Expected: PASS.

- [ ] **Step 6: Run mobile typecheck**

Run:

```bash
yarn mobile:typecheck
```

Expected: PASS.

- [ ] **Step 7: Run native iOS build if local setup allows it**

Run:

```bash
yarn ios:build
```

Expected: PASS if CocoaPods/Xcode setup is available. If this fails because pods, simulator, Xcode, signing, or local environment setup is unavailable, record the exact failure and continue only after deciding whether the failure is environmental or code-related.

- [ ] **Step 8: Run repository-wide handoff check**

Run:

```bash
yarn codex:check
```

Expected: PASS. If `yarn ios:build` failed for a known environment reason, `yarn codex:check` may fail for the same reason; report that as a skipped/blocked native gate instead of claiming pass.

- [ ] **Step 9: Commit wiki and final verification state**

```bash
git add .wiki/wiki/architecture/mobile.md .wiki/wiki/architecture/mobile-logbook-roadmap.md .wiki/wiki/questions/open-questions.md .wiki/wiki/log.md
git commit -m "docs: update mobile persistence wiki"
```

## Final Reporting Checklist

When all tasks are complete, report:

- Commits created.
- Tests and typecheck commands run with results.
- Whether `yarn ios:build` passed, failed, or was skipped due to local native setup.
- Whether `yarn codex:check` passed or inherited a native environment failure.
- Any storage migration risks left for future versions.
