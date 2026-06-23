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
