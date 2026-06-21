import type { DiveLogEntry } from '../types/dive-log-entry';
import type { WatchSyncMessage } from '../types/dive-session';
import { watchFixtureMessages } from '../utils/watch-fixtures';
import { watchSessionToDiveLogEntry } from '../utils/watch-session-to-dive-log-entry';
import type { DiveLogRepository } from './dive-log-repository';

export class LocalDiveLogRepository implements DiveLogRepository {
  private entriesByLocalId = new Map<string, DiveLogEntry>();

  constructor(initialEntries: DiveLogEntry[] = []) {
    for (const entry of initialEntries) {
      this.entriesByLocalId.set(entry.localId, cloneEntry(entry));
    }
  }

  async list(): Promise<DiveLogEntry[]> {
    return this.listSync();
  }

  async get(localId: string): Promise<DiveLogEntry | undefined> {
    return this.getSync(localId);
  }

  async save(entry: DiveLogEntry): Promise<DiveLogEntry> {
    this.entriesByLocalId.set(entry.localId, cloneEntry(entry));
    return cloneEntry(entry);
  }

  async delete(localId: string): Promise<void> {
    this.entriesByLocalId.delete(localId);
  }

  async importWatchMessages(messages: WatchSyncMessage[]): Promise<DiveLogEntry[]> {
    const now = Date.now() / 1000;

    for (const message of messages) {
      const nextEntry = watchSessionToDiveLogEntry({ session: message.session, now });
      const currentEntry = this.findByImportKey(nextEntry.watchCapture?.importKey);

      this.entriesByLocalId.set(currentEntry?.localId ?? nextEntry.localId, {
        ...nextEntry,
        localId: currentEntry?.localId ?? nextEntry.localId,
        createdAt: currentEntry?.createdAt ?? nextEntry.createdAt,
        mobile: currentEntry?.mobile ?? nextEntry.mobile,
        watchCapture: nextEntry.watchCapture
          ? {
              ...nextEntry.watchCapture,
              importedAt: currentEntry?.watchCapture?.importedAt ?? nextEntry.watchCapture.importedAt,
            }
          : undefined,
      });
    }

    return this.listSync();
  }

  listSync(): DiveLogEntry[] {
    return Array.from(this.entriesByLocalId.values()).map(cloneEntry).sort(compareEntries);
  }

  getSync(localId: string): DiveLogEntry | undefined {
    const entry = this.entriesByLocalId.get(localId);
    return entry ? cloneEntry(entry) : undefined;
  }

  private findByImportKey(importKey: string | undefined): DiveLogEntry | undefined {
    if (!importKey) {
      return undefined;
    }

    return Array.from(this.entriesByLocalId.values()).find(entry => entry.watchCapture?.importKey === importKey);
  }
}

export const createDefaultDiveLogRepository = (): LocalDiveLogRepository => {
  const now = Date.now() / 1000;
  const entries = watchFixtureMessages.map(message => watchSessionToDiveLogEntry({ session: message.session, now }));

  return new LocalDiveLogRepository(entries);
};

export const defaultDiveLogRepository = createDefaultDiveLogRepository();

const cloneEntry = (entry: DiveLogEntry): DiveLogEntry => JSON.parse(JSON.stringify(entry)) as DiveLogEntry;

const compareEntries = (left: DiveLogEntry, right: DiveLogEntry) => {
  return getEntrySortTimestamp(right) - getEntrySortTimestamp(left);
};

const getEntrySortTimestamp = (entry: DiveLogEntry) => {
  return entry.watchCapture?.session.startedAt ?? entry.manual.measuredValues.startedAt ?? entry.createdAt;
};
