const mockStores = new Map<string, Map<string, string>>();
const mockAllStores = new Set<Map<string, string>>();

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
  mockAllStores.add(next);
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
      for (const store of mockAllStores.values()) {
        store.clear();
      }
      mockStores.clear();
    },
  };
});
