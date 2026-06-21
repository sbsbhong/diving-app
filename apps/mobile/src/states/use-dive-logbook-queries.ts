import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DiveLogEntry } from '../types/dive-log-entry';
import type { WatchSyncMessage } from '../types/dive-session';
import type { DiveLogRepository } from '../repositories/dive-log-repository';
import { defaultDiveLogRepository } from '../repositories/local-dive-log-repository';

export type DiveLogbookQueryOptions = {
  queryScope?: string;
};

const DEFAULT_QUERY_SCOPE = 'default';

export const diveLogbookQueryKeys = {
  all: (queryScope: string = DEFAULT_QUERY_SCOPE) => ['diveLogbook', queryScope] as const,
  list: (queryScope: string = DEFAULT_QUERY_SCOPE) => [...diveLogbookQueryKeys.all(queryScope), 'list'] as const,
  detail: (localId: string, queryScope: string = DEFAULT_QUERY_SCOPE) =>
    [...diveLogbookQueryKeys.all(queryScope), 'detail', localId] as const,
};

export const useDiveLogEntriesQuery = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  const queryScope = options.queryScope ?? DEFAULT_QUERY_SCOPE;

  return useQuery({
    queryKey: diveLogbookQueryKeys.list(queryScope),
    queryFn: () => repository.list(),
  });
};

export const useDiveLogEntryQuery = (
  localId: string,
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  const queryScope = options.queryScope ?? DEFAULT_QUERY_SCOPE;

  return useQuery({
    queryKey: diveLogbookQueryKeys.detail(localId, queryScope),
    queryFn: () => repository.get(localId),
  });
};

export const useSaveDiveLogEntryMutation = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  const queryClient = useQueryClient();
  const queryScope = options.queryScope ?? DEFAULT_QUERY_SCOPE;

  return useMutation({
    mutationFn: (entry: DiveLogEntry) => repository.save(entry),
    onSuccess: entry => {
      queryClient.setQueryData(diveLogbookQueryKeys.detail(entry.localId, queryScope), entry);
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.list(queryScope) });
    },
  });
};

export const useDeleteDiveLogEntryMutation = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  const queryClient = useQueryClient();
  const queryScope = options.queryScope ?? DEFAULT_QUERY_SCOPE;

  return useMutation({
    mutationFn: (localId: string) => repository.delete(localId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all(queryScope) });
    },
  });
};

export const useImportWatchMessagesMutation = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  const queryClient = useQueryClient();
  const queryScope = options.queryScope ?? DEFAULT_QUERY_SCOPE;

  return useMutation({
    mutationFn: (messages: WatchSyncMessage[]) => repository.importWatchMessages(messages),
    onSuccess: entries => {
      queryClient.setQueryData(diveLogbookQueryKeys.list(queryScope), entries);
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all(queryScope) });
    },
  });
};
