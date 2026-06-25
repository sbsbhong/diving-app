import metadataRichFixture from '../../../packages/contracts/fixtures/metadata-rich-watch-sync-message.json';
import minimalFixture from '../../../packages/contracts/fixtures/minimal-watch-sync-message.json';
import { PersistentDiveLogRepository } from '../src/repositories/persistent-dive-log-repository';
import { InMemoryKeyValueStore } from '../src/storage/in-memory-key-value-store';
import {
  parseWatchSyncMessageJson,
  parseWatchSyncMessagesValue,
  parseWatchSyncMessageValue,
} from '../src/utils/watch-sync-message-validation';
import { watchFixtureMessages } from '../src/utils/watch-fixtures';

describe('watch sync message validation', () => {
  it('validates contract fixture JSON and imports it into the persistent repository', async () => {
    const result = parseWatchSyncMessageValue(metadataRichFixture);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    const repository = new PersistentDiveLogRepository({
      storage: new InMemoryKeyValueStore(),
      now: () => 1781354000,
      initialEntries: [],
    });

    const [entry] = await repository.importWatchMessages([result.message]);

    expect(entry.localId).toBe('watch:fixture-rich-session:1781352600');
    expect(entry.watchCapture?.session.localSessionId).toBe('fixture-rich-session');
    expect(entry.watchCapture?.samples).toHaveLength(4);
  });

  it('parses raw JSON strings into watch sync messages', () => {
    const result = parseWatchSyncMessageJson(JSON.stringify(minimalFixture));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(result.message.session.localSessionId).toBe('fixture-minimal-session');
  });

  it('accepts source plan metadata from watch sessions', () => {
    const result = parseWatchSyncMessageValue({
      type: 'sessionEnded',
      session: {
        localSessionId: 'planned-session-1',
        sourcePlanLocalId: 'plan-1',
        planTitle: 'Blue Wall morning',
        startedAt: 1781352000,
        endedAt: 1781352600,
        samples: [{ localSessionId: 'planned-session-1', timestamp: 1781352000, depthMeters: 0 }],
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(result.message.session.sourcePlanLocalId).toBe('plan-1');
    expect(result.message.session.planTitle).toBe('Blue Wall morning');
  });

  it('validates arrays for transport batches', () => {
    const result = parseWatchSyncMessagesValue([minimalFixture, metadataRichFixture]);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }
    expect(result.messages).toHaveLength(2);
  });

  it('rejects payloads that do not match the contract', () => {
    const result = parseWatchSyncMessageValue({
      type: 'sessionEnded',
      session: {
        startedAt: 1781352000,
        samples: [{ localSessionId: 'sample-1', timestamp: 1781352000, depthMeters: 0 }],
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('expected invalid payload');
    }
    expect(result.error.message).toContain('session.localSessionId');
  });

  it.each(['snorkel', 'pool', 'unknown'])('rejects removed dive mode %s', diveMode => {
    const result = parseWatchSyncMessageValue({
      type: 'sessionEnded',
      session: {
        localSessionId: `removed-mode-${diveMode}`,
        startedAt: 1781352000,
        diveMode,
        samples: [{ localSessionId: `removed-mode-${diveMode}`, timestamp: 1781352000, depthMeters: 0 }],
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('expected removed dive mode to be invalid');
    }
    expect(result.error.message).toContain('session.diveMode');
  });

  it('builds app fixture messages through the runtime validator', () => {
    expect(watchFixtureMessages.map(message => message.session.localSessionId)).toEqual(['fixture-rich-session']);
  });
});
