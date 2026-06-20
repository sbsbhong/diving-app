import React from 'react';
import type { DiveSessionFilter, MobileDiveSession } from '../types/dive-session';
import { importWatchMessages } from '../utils/import-watch-session';
import { watchFixtureMessages } from '../utils/watch-fixtures';

const initialSessions = importWatchMessages([], watchFixtureMessages);

export const useDiveLogbook = () => {
  const [sessions, setSessions] = React.useState<MobileDiveSession[]>(initialSessions);
  const [filter, setFilter] = React.useState<DiveSessionFilter>({ query: '' });

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
    setSessions(currentSessions => importWatchMessages(currentSessions, watchFixtureMessages));
  }, []);

  return {
    sessions,
    filteredSessions,
    filter,
    setFilter,
    importFixtures,
  };
};

