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
