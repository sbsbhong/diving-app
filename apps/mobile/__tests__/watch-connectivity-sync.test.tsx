import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import metadataRichFixture from '../../../packages/contracts/fixtures/metadata-rich-watch-sync-message.json';
import { LocalDiveLogRepository } from '../src/repositories/local-dive-log-repository';
import { diveLogbookQueryKeys } from '../src/states/use-dive-logbook-queries';
import { WatchConnectivitySyncProvider } from '../src/states/watch-connectivity-sync';

const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const queryClients: QueryClient[] = [];
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

const createQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });

  queryClients.push(queryClient);
  return queryClient;
};

describe('WatchConnectivitySyncProvider', () => {
  afterEach(async () => {
    await ReactTestRenderer.act(async () => {
      for (const renderer of renderers.splice(0)) {
        renderer.unmount();
      }
    });

    for (const queryClient of queryClients.splice(0)) {
      queryClient.clear();
    }

    jest.restoreAllMocks();
  });

  it('drains pending native payloads and imports valid watch sync JSON', async () => {
    const repository = new LocalDiveLogRepository([], { now: () => 1781355000 });
    const queryClient = createQueryClient();

    await ReactTestRenderer.act(async () => {
      renderers.push(ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <WatchConnectivitySyncProvider
            repository={repository}
            drainPendingPayloads={async () => [
              {
                payloadId: 'pending-1',
                payloadJson: JSON.stringify(metadataRichFixture),
                localSessionId: 'fixture-rich-session',
                receivedAt: 1781355000,
              },
            ]}
            acknowledgePayloads={jest.fn()}
            subscribeToPayloads={() => ({ remove: jest.fn() })}
          />
        </QueryClientProvider>,
      ));
      await flushPromises();
    });

    const entries = await repository.list();
    expect(entries).toHaveLength(1);
    expect(entries[0].watchCapture?.session.localSessionId).toBe('fixture-rich-session');
    expect(entries[0].syncStatus).toBe('synced');
    expect(entries[0].watchCapture?.session.syncStatus).toBe('pending');
    expect(queryClient.getQueryData(diveLogbookQueryKeys.list(repository))).toEqual(entries);
  });

  it('acknowledges imported durable native payloads after repository save succeeds', async () => {
    const repository = new LocalDiveLogRepository([], { now: () => 1781355000 });
    const queryClient = createQueryClient();
    const acknowledgePayloads = jest.fn().mockResolvedValue(undefined);
    const acknowledgeImportedPayloads = jest.fn().mockResolvedValue(undefined);

    await ReactTestRenderer.act(async () => {
      renderers.push(ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <WatchConnectivitySyncProvider
            repository={repository}
            drainPendingPayloads={async () => [
              {
                payloadId: 'durable-payload-1',
                payloadJson: JSON.stringify(metadataRichFixture),
                localSessionId: 'fixture-rich-session',
                receivedAt: 1781355000,
              },
            ]}
            acknowledgePayloads={acknowledgePayloads}
            acknowledgeImportedPayloads={acknowledgeImportedPayloads}
            subscribeToPayloads={() => ({ remove: jest.fn() })}
          />
        </QueryClientProvider>,
      ));
      await flushPromises();
    });

    expect(await repository.list()).toHaveLength(1);
    expect(acknowledgePayloads).not.toHaveBeenCalled();
    expect(acknowledgeImportedPayloads).toHaveBeenCalledWith(['durable-payload-1']);
  });

  it('imports valid event payloads delivered after subscription', async () => {
    const repository = new LocalDiveLogRepository([], { now: () => 1781355000 });
    const queryClient = createQueryClient();
    let listener: ((payload: { payloadJson: string; localSessionId?: string; receivedAt?: number }) => void) | undefined;

    await ReactTestRenderer.act(async () => {
      renderers.push(ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <WatchConnectivitySyncProvider
            repository={repository}
            drainPendingPayloads={async () => []}
            acknowledgePayloads={jest.fn()}
            subscribeToPayloads={handler => {
              listener = handler;
              return { remove: jest.fn() };
            }}
          />
        </QueryClientProvider>,
      ));
      await flushPromises();
    });

    await ReactTestRenderer.act(async () => {
      listener?.({
        payloadJson: JSON.stringify(metadataRichFixture),
        localSessionId: 'fixture-rich-session',
        receivedAt: 1781355000,
      });
      await flushPromises();
    });

    const entries = await repository.list();
    expect(entries).toHaveLength(1);
    expect(entries[0].watchCapture?.session.localSessionId).toBe('fixture-rich-session');
  });

  it('ignores payloads that fail the watch sync contract validator', async () => {
    const repository = new LocalDiveLogRepository([], { now: () => 1781355000 });
    const queryClient = createQueryClient();
    const acknowledgePayloads = jest.fn().mockResolvedValue(undefined);
    const acknowledgeImportedPayloads = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await ReactTestRenderer.act(async () => {
      renderers.push(ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <WatchConnectivitySyncProvider
            repository={repository}
            drainPendingPayloads={async () => [
              {
                payloadId: 'invalid-payload-1',
                payloadJson: '{"type":"sessionEnded","session":{"startedAt":1781352000,"samples":[]}}',
                localSessionId: 'broken-session',
                receivedAt: 1781355000,
              },
            ]}
            acknowledgePayloads={acknowledgePayloads}
            acknowledgeImportedPayloads={acknowledgeImportedPayloads}
            subscribeToPayloads={() => ({ remove: jest.fn() })}
          />
        </QueryClientProvider>,
      ));
      await flushPromises();
    });

    expect(await repository.list()).toEqual([]);
    expect(queryClient.getQueryData(diveLogbookQueryKeys.list(repository))).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      'Dropped invalid watch sync payload',
      expect.objectContaining({ path: 'session.localSessionId' }),
    );
    expect(acknowledgePayloads).toHaveBeenCalledWith(['invalid-payload-1']);
    expect(acknowledgeImportedPayloads).not.toHaveBeenCalled();
  });

  it('does not acknowledge durable payloads when repository import fails', async () => {
    const repository = new LocalDiveLogRepository([], { now: () => 1781355000 });
    const queryClient = createQueryClient();
    const acknowledgePayloads = jest.fn().mockResolvedValue(undefined);
    jest.spyOn(repository, 'importWatchMessages').mockRejectedValue(new Error('storage unavailable'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    await ReactTestRenderer.act(async () => {
      renderers.push(ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <WatchConnectivitySyncProvider
            repository={repository}
            drainPendingPayloads={async () => [
              {
                payloadId: 'retry-later-payload',
                payloadJson: JSON.stringify(metadataRichFixture),
                localSessionId: 'fixture-rich-session',
                receivedAt: 1781355000,
              },
            ]}
            acknowledgePayloads={acknowledgePayloads}
            subscribeToPayloads={() => ({ remove: jest.fn() })}
          />
        </QueryClientProvider>,
      ));
      await flushPromises();
    });

    expect(acknowledgePayloads).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('Failed to import watch sync payload', expect.any(Error));
  });
});
