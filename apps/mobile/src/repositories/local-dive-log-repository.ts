import type { DiveLogEntry } from '../types/dive-log-entry';
import type { WatchSyncMessage } from '../types/dive-session';
import { watchFixtureMessages } from '../utils/watch-fixtures';
import { watchSessionToDiveLogEntry } from '../utils/watch-session-to-dive-log-entry';
import type { DiveLogRepository } from './dive-log-repository';

export type LocalDiveLogRepositoryOptions = {
  now?: () => number;
};

export class LocalDiveLogRepository implements DiveLogRepository {
  private entriesByLocalId = new Map<string, DiveLogEntry>();
  private readonly now: () => number;

  constructor(initialEntries: DiveLogEntry[] = [], options: LocalDiveLogRepositoryOptions = {}) {
    this.now = options.now ?? getCurrentTimestampSeconds;
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
    const now = this.now();

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

export const DEFAULT_FIXTURE_IMPORTED_AT = 0;

export const createDefaultDiveLogRepository = (options: LocalDiveLogRepositoryOptions = {}): LocalDiveLogRepository => {
  const entries = watchFixtureMessages.map(message =>
    watchSessionToDiveLogEntry({ session: message.session, now: DEFAULT_FIXTURE_IMPORTED_AT }),
  );

  return new LocalDiveLogRepository(entries, options);
};

export const defaultDiveLogRepository = createDefaultDiveLogRepository();

function getCurrentTimestampSeconds(): number {
  return Date.now() / 1000;
}

function cloneEntry(entry: DiveLogEntry): DiveLogEntry {
  return JSON.parse(JSON.stringify(entry)) as DiveLogEntry;
}

function compareEntries(left: DiveLogEntry, right: DiveLogEntry): number {
  return getEntrySortTimestamp(right) - getEntrySortTimestamp(left);
}

function getEntrySortTimestamp(entry: DiveLogEntry): number {
  return entry.watchCapture?.session.startedAt ?? entry.manual.measuredValues.startedAt ?? entry.createdAt;
}
