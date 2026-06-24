import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import {
  drainPendingWatchConnectivityPayloads,
  subscribeToWatchConnectivityPayloads,
  type WatchConnectivityPayload,
  type WatchConnectivitySubscription,
} from '../native/watch-connectivity';
import { defaultDiveLogRepository } from '../repositories/default-dive-log-repository';
import type { DiveLogRepository } from '../repositories/dive-log-repository';
import { parseWatchSyncMessageJson } from '../utils/watch-sync-message-validation';
import { diveLogbookQueryKeys } from './use-dive-logbook-queries';

type WatchConnectivitySyncProviderProps = {
  children?: React.ReactNode;
  repository?: DiveLogRepository;
  drainPendingPayloads?: () => Promise<WatchConnectivityPayload[]>;
  subscribeToPayloads?: (handler: (payload: WatchConnectivityPayload) => void) => WatchConnectivitySubscription;
};

export function WatchConnectivitySyncProvider({
  children,
  repository = defaultDiveLogRepository,
  drainPendingPayloads = drainPendingWatchConnectivityPayloads,
  subscribeToPayloads = subscribeToWatchConnectivityPayloads,
}: WatchConnectivitySyncProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const importPayload = React.useCallback(
    async (payload: WatchConnectivityPayload) => {
      const result = parseWatchSyncMessageJson(payload.payloadJson);

      if (!result.ok) {
        console.warn('Dropped invalid watch sync payload', result.error);
        return;
      }

      const entries = await repository.importWatchMessages([result.message]);
      queryClient.setQueryData(diveLogbookQueryKeys.list(repository), entries);
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all(repository) });
    },
    [queryClient, repository],
  );

  React.useEffect(() => {
    let isMounted = true;

    drainPendingPayloads()
      .then(payloads => {
        if (!isMounted) {
          return;
        }

        for (const payload of payloads) {
          void importPayload(payload);
        }
      })
      .catch(error => {
        console.warn('Failed to drain pending watch sync payloads', error);
      });

    const subscription = subscribeToPayloads(payload => {
      void importPayload(payload);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [drainPendingPayloads, importPayload, subscribeToPayloads]);

  return <>{children}</>;
}
