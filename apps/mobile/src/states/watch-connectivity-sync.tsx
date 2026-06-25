import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import React from 'react';
import {
  acknowledgeImportedWatchConnectivityPayloads,
  acknowledgeWatchConnectivityPayloads,
  drainPendingWatchConnectivityPayloads,
  subscribeToWatchConnectivityPayloads,
  type WatchConnectivityPayload,
  type WatchConnectivitySubscription,
} from '../native/watch-connectivity';
import { defaultDiveLogRepository } from '../repositories/default-dive-log-repository';
import type { DiveLogRepository } from '../repositories/dive-log-repository';
import type { DiveLogEntry } from '../types/dive-log-entry';
import type { WatchSyncMessage } from '../types/dive-session';
import { parseWatchSyncMessageJson } from '../utils/watch-sync-message-validation';
import { diveLogbookQueryKeys } from './use-dive-logbook-queries';

type WatchConnectivitySyncProviderProps = {
  children?: React.ReactNode;
  repository?: DiveLogRepository;
  drainPendingPayloads?: () => Promise<WatchConnectivityPayload[]>;
  acknowledgePayloads?: (payloadIds: readonly string[]) => Promise<void>;
  acknowledgeImportedPayloads?: (payloadIds: readonly string[]) => Promise<void>;
  onImportedEntry?: (entry: DiveLogEntry) => void;
  subscribeToPayloads?: (handler: (payload: WatchConnectivityPayload) => void) => WatchConnectivitySubscription;
};

type WatchConnectivityImportOptions = {
  repository: DiveLogRepository;
  queryClient: QueryClient;
  queryScope?: string;
  drainPendingPayloads?: () => Promise<WatchConnectivityPayload[]>;
  acknowledgePayloads?: (payloadIds: readonly string[]) => Promise<void>;
  acknowledgeImportedPayloads?: (payloadIds: readonly string[]) => Promise<void>;
};

export type WatchConnectivityImportSummary = {
  receivedCount: number;
  importedCount: number;
};

type WatchConnectivityAcknowledgement = (payloadIds: readonly string[]) => Promise<void>;

type WatchConnectivityPayloadImportOptions = {
  payload: WatchConnectivityPayload;
  repository: DiveLogRepository;
  queryClient: QueryClient;
  queryScope?: string;
  acknowledgePayloads: WatchConnectivityAcknowledgement;
  acknowledgeImportedPayloads: WatchConnectivityAcknowledgement;
};

export function WatchConnectivitySyncProvider({
  children,
  repository = defaultDiveLogRepository,
  drainPendingPayloads = drainPendingWatchConnectivityPayloads,
  acknowledgePayloads = acknowledgeWatchConnectivityPayloads,
  acknowledgeImportedPayloads = acknowledgeImportedWatchConnectivityPayloads,
  onImportedEntry,
  subscribeToPayloads = subscribeToWatchConnectivityPayloads,
}: WatchConnectivitySyncProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const importPayload = React.useCallback(
    async (payload: WatchConnectivityPayload) => {
      const importedEntry = await importWatchConnectivityPayload({
        payload,
        repository,
        queryClient,
        acknowledgePayloads,
        acknowledgeImportedPayloads,
      });

      if (importedEntry) {
        onImportedEntry?.(importedEntry);
      }
    },
    [acknowledgeImportedPayloads, acknowledgePayloads, onImportedEntry, queryClient, repository],
  );

  const importPayloadSafely = React.useCallback(
    (payload: WatchConnectivityPayload) => {
      void importPayload(payload).catch(error => {
        console.warn('Failed to import watch sync payload', error);
      });
    },
    [importPayload],
  );

  React.useEffect(() => {
    let isMounted = true;

    drainPendingPayloads()
      .then(payloads => {
        if (!isMounted) {
          return;
        }

        for (const payload of payloads) {
          importPayloadSafely(payload);
        }
      })
      .catch(error => {
        console.warn('Failed to drain pending watch sync payloads', error);
      });

    const subscription = subscribeToPayloads(payload => {
      importPayloadSafely(payload);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [drainPendingPayloads, importPayloadSafely, subscribeToPayloads]);

  return <>{children}</>;
}

export async function importPendingWatchConnectivityPayloads({
  repository,
  queryClient,
  queryScope,
  drainPendingPayloads = drainPendingWatchConnectivityPayloads,
  acknowledgePayloads = acknowledgeWatchConnectivityPayloads,
  acknowledgeImportedPayloads = acknowledgeImportedWatchConnectivityPayloads,
}: WatchConnectivityImportOptions): Promise<WatchConnectivityImportSummary> {
  const payloads = await drainPendingPayloads();
  let importedCount = 0;

  for (const payload of payloads) {
    const importedEntry = await importWatchConnectivityPayload({
      payload,
      repository,
      queryClient,
      queryScope,
      acknowledgePayloads,
      acknowledgeImportedPayloads,
    });

    if (importedEntry) {
      importedCount += 1;
    }
  }

  return {
    receivedCount: payloads.length,
    importedCount,
  };
}

async function importWatchConnectivityPayload({
  payload,
  repository,
  queryClient,
  queryScope,
  acknowledgePayloads,
  acknowledgeImportedPayloads,
}: WatchConnectivityPayloadImportOptions): Promise<DiveLogEntry | undefined> {
  const result = parseWatchSyncMessageJson(payload.payloadJson);

  if (!result.ok) {
    console.warn('Dropped invalid watch sync payload', result.error);
    await acknowledgePayload(payload, acknowledgePayloads);
    return undefined;
  }

  const entries = await repository.importWatchMessages([result.message]);
  const { importedEntry, syncedEntries } = await markWatchConnectivityImportSynced(repository, entries, result.message, payload);
  queryClient.setQueryData(diveLogbookQueryKeys.list(repository, queryScope), syncedEntries);
  queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all(repository, queryScope) });
  await acknowledgePayload(payload, acknowledgeImportedPayloads);
  return importedEntry;
}

async function acknowledgePayload(
  payload: WatchConnectivityPayload,
  acknowledgePayloads: WatchConnectivityAcknowledgement,
): Promise<void> {
  if (!payload.payloadId) {
    return;
  }

  await acknowledgePayloads([payload.payloadId]);
}

async function markWatchConnectivityImportSynced(
  repository: DiveLogRepository,
  entries: DiveLogEntry[],
  message: WatchSyncMessage,
  payload: WatchConnectivityPayload,
): Promise<{ importedEntry?: DiveLogEntry; syncedEntries: DiveLogEntry[] }> {
  const importedEntry = entries.find(entry => {
    const session = entry.watchCapture?.session;
    return (
      session?.localSessionId === message.session.localSessionId &&
      session?.endedAt === message.session.endedAt
    );
  });

  if (!importedEntry || importedEntry.syncStatus === 'synced') {
    return { syncedEntries: entries };
  }

  const syncedEntry = await repository.save({
    ...importedEntry,
    syncStatus: 'synced',
    updatedAt: payload.receivedAt ?? Date.now() / 1000,
  });

  const syncedEntries = await repository.list();
  const currentImportedEntry = syncedEntries.find(entry => entry.localId === syncedEntry.localId) ?? syncedEntry;

  return {
    importedEntry: currentImportedEntry,
    syncedEntries,
  };
}
