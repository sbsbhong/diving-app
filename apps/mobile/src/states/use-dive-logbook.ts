import React from 'react';
import { defaultDiveLogRepository } from '../repositories/local-dive-log-repository';
import { useDiveLogEntriesQuery, useImportWatchMessagesMutation } from './use-dive-logbook-queries';
import type { DiveLogEntry, DiveLogSyncStatus } from '../types/dive-log-entry';
import type { DiveSessionFilter, MobileDiveSession } from '../types/dive-session';
import { watchFixtureMessages } from '../utils/watch-fixtures';

export const useDiveLogbook = () => {
  const [filter, setFilter] = React.useState<DiveSessionFilter>({ query: '' });
  const initialEntries = React.useMemo(() => defaultDiveLogRepository.listSync(), []);
  const entriesQuery = useDiveLogEntriesQuery(defaultDiveLogRepository, {
    initialData: initialEntries,
    staleTime: Infinity,
  });
  const importWatchMessages = useImportWatchMessagesMutation();
  const entries = entriesQuery.data ?? initialEntries;
  const sessions = React.useMemo(() => entries.map(diveLogEntryToMobileSession), [entries]);

  const filteredSessions = React.useMemo(() => {
    const query = filter.query.trim().toLowerCase();

    return sessions.filter(session => {
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
  }, [filter, sessions]);

  const importFixtures = React.useCallback(() => {
    importWatchMessages.mutate(watchFixtureMessages);
  }, [importWatchMessages]);

  return {
    entries,
    sessions,
    filteredSessions,
    filter,
    setFilter,
    importFixtures,
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

  return {
    localSessionId: entry.localId,
    startedAt: entry.manual.measuredValues.startedAt ?? entry.createdAt,
    endedAt: entry.manual.measuredValues.endedAt,
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
