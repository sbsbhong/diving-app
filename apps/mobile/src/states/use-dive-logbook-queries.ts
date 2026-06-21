import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DiveLogEntry } from '../types/dive-log-entry';
import type { WatchSyncMessage } from '../types/dive-session';
import type { DiveLogRepository } from '../repositories/dive-log-repository';
import { defaultDiveLogRepository } from '../repositories/local-dive-log-repository';

export type DiveLogbookQueryOptions = {
  queryScope?: string;
  initialData?: DiveLogEntry[];
  staleTime?: number;
};

const DEFAULT_QUERY_SCOPE = 'default';
const repositoryScopes = new WeakMap<DiveLogRepository, string>();
let nextRepositoryScopeId = 1;

export const getDiveLogbookQueryScope = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  queryScope?: string,
): string => {
  if (queryScope) {
    return queryScope;
  }

  if (repository === defaultDiveLogRepository) {
    return DEFAULT_QUERY_SCOPE;
  }

  const currentScope = repositoryScopes.get(repository);

  if (currentScope) {
    return currentScope;
  }

  const nextScope = `repository:${nextRepositoryScopeId}`;
  nextRepositoryScopeId += 1;
  repositoryScopes.set(repository, nextScope);

  return nextScope;
};

export const diveLogbookQueryKeys = {
  all: (repository: DiveLogRepository = defaultDiveLogRepository, queryScope?: string) =>
    ['diveLogbook', getDiveLogbookQueryScope(repository, queryScope)] as const,
  list: (repository: DiveLogRepository = defaultDiveLogRepository, queryScope?: string) =>
    [...diveLogbookQueryKeys.all(repository, queryScope), 'list'] as const,
  detail: (localId: string, repository: DiveLogRepository = defaultDiveLogRepository, queryScope?: string) =>
    [...diveLogbookQueryKeys.all(repository, queryScope), 'detail', localId] as const,
};

export const useDiveLogEntriesQuery = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  return useQuery({
    queryKey: diveLogbookQueryKeys.list(repository, options.queryScope),
    queryFn: () => repository.list(),
    initialData: options.initialData,
    staleTime: options.staleTime,
  });
};

export const useDiveLogEntryQuery = (
  localId: string,
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  return useQuery({
    queryKey: diveLogbookQueryKeys.detail(localId, repository, options.queryScope),
    queryFn: () => repository.get(localId),
  });
};

export const useSaveDiveLogEntryMutation = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: DiveLogEntry) => repository.save(entry),
    onSuccess: entry => {
      queryClient.setQueryData(diveLogbookQueryKeys.detail(entry.localId, repository, options.queryScope), entry);
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.list(repository, options.queryScope) });
    },
  });
};

export const useDeleteDiveLogEntryMutation = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (localId: string) => repository.delete(localId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all(repository, options.queryScope) });
    },
  });
};

export const useImportWatchMessagesMutation = (
  repository: DiveLogRepository = defaultDiveLogRepository,
  options: DiveLogbookQueryOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messages: WatchSyncMessage[]) => repository.importWatchMessages(messages),
    onSuccess: entries => {
      queryClient.setQueryData(diveLogbookQueryKeys.list(repository, options.queryScope), entries);
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all(repository, options.queryScope) });
    },
  });
};
