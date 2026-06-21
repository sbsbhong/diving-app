import { createDefaultDiveLogRepository, LocalDiveLogRepository } from '../src/repositories/local-dive-log-repository';
import type { WatchSyncMessage } from '../src/types/dive-session';

describe('LocalDiveLogRepository', () => {
  const watchMessage: WatchSyncMessage = {
    type: 'sessionEnded',
    session: {
      localSessionId: 'repo-watch-session-1',
      schemaVersion: 1,
      siteName: 'Repository Reef',
      syncStatus: 'pending',
      startedAt: 1781352000,
      endedAt: 1781352600,
      maxDepthMeters: 10,
      averageDepthMeters: 6,
      samples: [],
    },
  };

  it('uses an injected clock for deterministic repeated imports and dedupes by import key', async () => {
    const repository = new LocalDiveLogRepository([], { now: () => 1781354000 });

    const firstImport = await repository.importWatchMessages([watchMessage]);
    const secondImport = await repository.importWatchMessages([
      {
        ...watchMessage,
        session: {
          ...watchMessage.session,
          syncStatus: 'synced',
          siteName: 'Updated Repository Reef',
        },
      },
    ]);

    expect(firstImport).toHaveLength(1);
    expect(secondImport).toHaveLength(1);
    expect(secondImport[0]).toMatchObject({
      localId: 'watch:repo-watch-session-1:1781352600',
      createdAt: 1781354000,
      updatedAt: 1781354000,
      syncStatus: 'synced',
      manual: {
        site: {
          name: 'Updated Repository Reef',
        },
      },
    });
    expect(secondImport[0].watchCapture).toMatchObject({
      importKey: 'repo-watch-session-1:1781352600',
      importedAt: 1781354000,
    });
  });

  it('seeds default fixture entries with stable timestamps instead of wall-clock time', () => {
    const dateNow = jest.spyOn(Date, 'now');
    dateNow.mockReturnValueOnce(1000);
    const firstRepository = createDefaultDiveLogRepository();
    dateNow.mockReturnValueOnce(999999999);
    const secondRepository = createDefaultDiveLogRepository();

    expect(firstRepository.listSync()[0].createdAt).toBe(secondRepository.listSync()[0].createdAt);
    expect(firstRepository.listSync()[0].watchCapture?.importedAt).toBe(secondRepository.listSync()[0].watchCapture?.importedAt);

    dateNow.mockRestore();
  });
});
