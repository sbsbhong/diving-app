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
