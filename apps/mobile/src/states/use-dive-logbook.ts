import React from 'react';
import { defaultDiveLogRepository } from '../repositories/default-dive-log-repository';
import type { DiveLogRepository } from '../repositories/dive-log-repository';
import {
  useDeleteDiveLogEntryMutation,
  useDiveLogEntriesQuery,
  useImportWatchMessagesMutation,
  useSaveDiveLogEntryMutation,
} from './use-dive-logbook-queries';
import type { DiveLogEntry, DiveLogSyncStatus } from '../types/dive-log-entry';
import type { DiveSessionFilter, MobileDiveSession } from '../types/dive-session';
import { watchFixtureMessages } from '../utils/watch-fixtures';

type UseDiveLogbookOptions = {
  repository?: DiveLogRepository;
  queryScope?: string;
};

type DiveLogRepositoryWithSyncList = DiveLogRepository & {
  listSync?: () => DiveLogEntry[];
};

export const useDiveLogbook = (options: UseDiveLogbookOptions = {}) => {
  const repository = options.repository ?? defaultDiveLogRepository;
  const [filter, setFilter] = React.useState<DiveSessionFilter>({ query: '' });
  const initialEntries = React.useMemo(() => {
    const repositoryWithSyncList = repository as DiveLogRepositoryWithSyncList;

    if (typeof repositoryWithSyncList.listSync === 'function') {
      return repositoryWithSyncList.listSync();
    }

    return undefined;
  }, [repository]);
  const entriesQuery = useDiveLogEntriesQuery(repository, {
    initialData: initialEntries,
    staleTime: Infinity,
    queryScope: options.queryScope,
  });
  const saveEntryMutation = useSaveDiveLogEntryMutation(repository, { queryScope: options.queryScope });
  const deleteEntryMutation = useDeleteDiveLogEntryMutation(repository, { queryScope: options.queryScope });
  const importWatchMessages = useImportWatchMessagesMutation(repository, { queryScope: options.queryScope });
  const entries: DiveLogEntry[] = entriesQuery.data ?? initialEntries ?? [];
  const sessions = React.useMemo(() => entries.map(diveLogEntryToMobileSession), [entries]);

  const filteredEntries = React.useMemo(() => {
    const query = filter.query.trim().toLowerCase();

    return entries.filter(entry => {
      const session = diveLogEntryToMobileSession(entry);
      const searchable = [
        session.siteName,
        session.notes,
        session.gasLabel,
        session.diveMode,
        ...(session.tags ?? []),
        ...(session.buddyIds ?? []),
        ...(session.gearIds ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesQuery = query.length === 0 || searchable.includes(query);
      const matchesTag = !filter.tag || session.tags?.includes(filter.tag);
      return matchesQuery && matchesTag;
    });
  }, [entries, filter]);

  const filteredSessions = React.useMemo(() => filteredEntries.map(diveLogEntryToMobileSession), [filteredEntries]);

  const importFixtures = React.useCallback(() => {
    importWatchMessages.mutate(watchFixtureMessages);
  }, [importWatchMessages]);

  return {
    entries,
    sessions,
    filteredEntries,
    filteredSessions,
    filter,
    setFilter,
    importFixtures,
    saveEntry: saveEntryMutation.mutateAsync,
    deleteEntry: deleteEntryMutation.mutateAsync,
    isLoading: entriesQuery.isLoading,
    isSaving: saveEntryMutation.isPending,
    isDeleting: deleteEntryMutation.isPending,
    listError: entriesQuery.error,
    saveError: saveEntryMutation.error,
    deleteError: deleteEntryMutation.error,
  };
};

export const diveLogEntryToMobileSession = (entry: DiveLogEntry): MobileDiveSession => {
  if (entry.watchCapture) {
    return {
      ...entry.watchCapture.session,
      siteId: entry.manual.site.siteId ?? entry.watchCapture.session.siteId,
      siteName: entry.manual.site.name ?? entry.watchCapture.session.siteName,
      buddyIds: entry.manual.buddyIds,
      gearIds: entry.manual.gearIds,
      tags: entry.manual.tags,
      notes: entry.manual.notes,
      rating: entry.manual.rating,
      diveMode: entry.manual.measuredValues.diveMode ?? entry.watchCapture.session.diveMode,
      gasLabel: entry.manual.measuredValues.gasLabel ?? entry.watchCapture.session.gasLabel,
      syncStatus: toWatchSyncStatus(entry.syncStatus),
      importKey: entry.watchCapture.importKey,
      importedAt: entry.watchCapture.importedAt,
      mediaPlaceholders: entry.mobile.mediaPlaceholders,
    };
  }

  const startedAt = entry.manual.measuredValues.startedAt ?? entry.createdAt;
  const endedAt =
    entry.manual.measuredValues.endedAt ??
    (entry.manual.measuredValues.durationSeconds === undefined ? undefined : startedAt + entry.manual.measuredValues.durationSeconds);

  return {
    localSessionId: entry.localId,
    startedAt,
    endedAt,
    maxDepthMeters: entry.manual.measuredValues.maxDepthMeters,
    averageDepthMeters: entry.manual.measuredValues.averageDepthMeters,
    waterTemperatureCelsius: entry.manual.measuredValues.waterTemperatureCelsius,
    diveMode: entry.manual.measuredValues.diveMode,
    gasLabel: entry.manual.measuredValues.gasLabel,
    siteId: entry.manual.site.siteId,
    siteName: entry.manual.site.name,
    buddyIds: entry.manual.buddyIds,
    gearIds: entry.manual.gearIds,
    tags: entry.manual.tags,
    notes: entry.manual.notes,
    rating: entry.manual.rating,
    syncStatus: toWatchSyncStatus(entry.syncStatus),
    samples: [],
    importKey: entry.localId,
    importedAt: entry.createdAt,
    mediaPlaceholders: entry.mobile.mediaPlaceholders,
  };
};

const toWatchSyncStatus = (syncStatus: DiveLogSyncStatus): MobileDiveSession['syncStatus'] => {
  return syncStatus === 'localOnly' ? undefined : syncStatus;
};
