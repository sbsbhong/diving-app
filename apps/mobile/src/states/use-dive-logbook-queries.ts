import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DiveLogEntry } from '../types/dive-log-entry';
import type { WatchSyncMessage } from '../types/dive-session';
import type { DiveLogRepository } from '../repositories/dive-log-repository';
import { defaultDiveLogRepository } from '../repositories/local-dive-log-repository';

export const diveLogbookQueryKeys = {
  all: ['diveLogbook'] as const,
  list: () => [...diveLogbookQueryKeys.all, 'list'] as const,
  detail: (localId: string) => [...diveLogbookQueryKeys.all, 'detail', localId] as const,
};

export const useDiveLogEntriesQuery = (repository: DiveLogRepository = defaultDiveLogRepository) => {
  return useQuery({
    queryKey: diveLogbookQueryKeys.list(),
    queryFn: () => repository.list(),
  });
};

export const useDiveLogEntryQuery = (localId: string, repository: DiveLogRepository = defaultDiveLogRepository) => {
  return useQuery({
    queryKey: diveLogbookQueryKeys.detail(localId),
    queryFn: () => repository.get(localId),
  });
};

export const useSaveDiveLogEntryMutation = (repository: DiveLogRepository = defaultDiveLogRepository) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: DiveLogEntry) => repository.save(entry),
    onSuccess: entry => {
      queryClient.setQueryData(diveLogbookQueryKeys.detail(entry.localId), entry);
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.list() });
    },
  });
};

export const useDeleteDiveLogEntryMutation = (repository: DiveLogRepository = defaultDiveLogRepository) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (localId: string) => repository.delete(localId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all });
    },
  });
};

export const useImportWatchMessagesMutation = (repository: DiveLogRepository = defaultDiveLogRepository) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messages: WatchSyncMessage[]) => repository.importWatchMessages(messages),
    onSuccess: entries => {
      queryClient.setQueryData(diveLogbookQueryKeys.list(), entries);
      queryClient.invalidateQueries({ queryKey: diveLogbookQueryKeys.all });
    },
  });
};
