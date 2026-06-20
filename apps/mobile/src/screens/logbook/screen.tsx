import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack, Text, VStack } from '../../components/ui/primitives';
import { SessionProfile } from '../../components/ui/session-profile';
import { diveTheme, InstrumentTone } from '../../components/ui/theme';
import type { DiveSessionFilter, MobileDiveSession } from '../../types/dive-session';
import {
  formatDate,
  formatDepth,
  formatDuration,
  formatRating,
  formatTemperature,
} from '../../utils/dive-formatters';
import { summarizeSession } from '../../utils/session-summary';

type LogbookScreenProps = {
  sessions: MobileDiveSession[];
  filter: DiveSessionFilter;
  onFilterChange: (filter: DiveSessionFilter) => void;
  onImportFixtures: () => void;
};

type SyncFilter = 'all' | 'synced' | 'pending';

export default function LogbookScreen(props: LogbookScreenProps): React.JSX.Element {
  const [syncFilter, setSyncFilter] = React.useState<SyncFilter>('all');
  const visibleSessions = React.useMemo(() => {
    if (syncFilter === 'all') {
      return props.sessions;
    }

    return props.sessions.filter(session => (session.syncStatus ?? 'pending') === syncFilter);
  }, [props.sessions, syncFilter]);
  const [selectedId, setSelectedId] = React.useState(props.sessions[0]?.importKey);
  const selectedSession = visibleSessions.find(session => session.importKey === selectedId) ?? visibleSessions[0];

  React.useEffect(() => {
    if (!selectedSession && visibleSessions[0]) {
      setSelectedId(visibleSessions[0].importKey);
    }
  }, [selectedSession, visibleSessions]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <VStack gap={14}>
        <DiveSummaryCard accent={diveTheme.colors.primary}>
          <DiveSummaryCard.Header
            eyebrow="Log review"
            title="Imported Dives"
            right={<InstrumentButton label="Import" onPress={props.onImportFixtures} style={styles.importButton} />}
          />
          <DiveSummaryCard.Body>
            <TextInput
              placeholder="Search site, buddy, gear, tag, note"
              placeholderTextColor={diveTheme.colors.mutedText}
              value={props.filter.query}
              onChangeText={query => props.onFilterChange({ ...props.filter, query })}
              style={styles.search}
            />
            <HStack gap={8}>
              <FilterChip label="All" selected={syncFilter === 'all'} onPress={() => setSyncFilter('all')} />
              <FilterChip label="Synced" selected={syncFilter === 'synced'} onPress={() => setSyncFilter('synced')} />
              <FilterChip label="Pending" selected={syncFilter === 'pending'} onPress={() => setSyncFilter('pending')} />
            </HStack>
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        {visibleSessions.length === 0 ? (
          <EmptyLogbook />
        ) : (
          <VStack gap={12}>
            {visibleSessions.map(session => (
              <SessionListItem
                key={session.importKey}
                session={session}
                selected={session.importKey === selectedSession?.importKey}
                onPress={() => setSelectedId(session.importKey)}
              />
            ))}
          </VStack>
        )}

        {selectedSession ? <SessionDetail session={selectedSession} /> : null}

        <SafetyText>LOG REVIEW ONLY. NON-CERTIFIED ASSISTANT.</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function FilterChip(props: { label: string; selected: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.filterChip, props.selected && styles.filterChipSelected]}>
      <Text style={[styles.filterChipText, props.selected && styles.filterChipTextSelected]}>{props.label}</Text>
    </Pressable>
  );
}

function EmptyLogbook(): React.JSX.Element {
  return (
    <DiveSummaryCard>
      <DiveSummaryCard.Header eyebrow="Empty" title="No imported dives yet" />
      <DiveSummaryCard.Footer>
        <Text style={styles.muted}>Import a watch sync fixture to preview the logbook flow.</Text>
      </DiveSummaryCard.Footer>
    </DiveSummaryCard>
  );
}

function SessionListItem(props: {
  session: MobileDiveSession;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const summary = summarizeSession(props.session);
  const status = props.session.syncStatus ?? 'pending';

  return (
    <Pressable onPress={props.onPress} style={[styles.listItem, props.selected && styles.listItemSelected]}>
      <VStack gap={7}>
        <HStack style={styles.row}>
          <VStack gap={3} style={styles.listTitleGroup}>
            <Text style={styles.listTitle}>{props.session.siteName ?? 'Untitled dive'}</Text>
            <Text style={styles.muted}>{formatDate(props.session.startedAt)}</Text>
          </VStack>
          <VStack gap={4} style={styles.listMetricGroup}>
            <StatusPill label={status} tone={syncStatusTone(status)} />
            <Text style={styles.listMetric}>{formatDepth(summary.maxDepthMeters)}</Text>
          </VStack>
        </HStack>
        <Text style={styles.muted}>
          {props.session.diveMode ?? 'unknown'} · {formatDuration(summary.durationSeconds)} ·{' '}
          {props.session.tags?.join(', ') ?? 'no tags'}
        </Text>
      </VStack>
    </Pressable>
  );
}

function SessionDetail(props: { session: MobileDiveSession }): React.JSX.Element {
  const summary = summarizeSession(props.session);

  return (
    <DiveSummaryCard accent={diveTheme.colors.primary}>
      <DiveSummaryCard.Header
        eyebrow={props.session.diveMode ?? 'unknown'}
        title={props.session.siteName ?? 'Dive detail'}
        right={<Text style={styles.rating}>{formatRating(props.session.rating)}</Text>}
      />
      <DiveSummaryCard.Body>
        <HStack gap={10}>
          <DetailMetric label="Max depth" value={formatDepth(summary.maxDepthMeters)} />
          <DetailMetric label="Avg depth" value={formatDepth(summary.averageDepthMeters)} />
        </HStack>
        <HStack gap={10}>
          <DetailMetric label="Water temp" value={formatTemperature(summary.waterTemperatureCelsius)} />
          <DetailMetric label="Duration" value={formatDuration(summary.durationSeconds)} />
        </HStack>
        <SessionProfile samples={props.session.samples} kind="depth" title="Depth profile" />
        <SessionProfile samples={props.session.samples} kind="temperature" title="Temperature profile" />
      </DiveSummaryCard.Body>
      <DiveSummaryCard.Footer>
        <VStack gap={8}>
          <Text style={styles.note}>{props.session.notes ?? 'No notes yet.'}</Text>
          <Text style={styles.muted}>Tags: {(props.session.tags ?? ['none']).join(', ')}</Text>
          <Text style={styles.muted}>Media: {props.session.mediaPlaceholders.join(', ')}</Text>
        </VStack>
      </DiveSummaryCard.Footer>
    </DiveSummaryCard>
  );
}

function DetailMetric(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack gap={5} style={styles.detailMetric}>
      <Text style={styles.detailMetricLabel}>{props.label}</Text>
      <Text style={styles.detailMetricValue}>{props.value}</Text>
    </VStack>
  );
}

const syncStatusTone = (status: string): InstrumentTone => {
  if (status === 'synced') {
    return 'success';
  }

  if (status === 'failed') {
    return 'danger';
  }

  return 'warning';
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: diveTheme.colors.background,
  },
  content: {
    padding: diveTheme.spacing.screen,
    paddingBottom: 18,
  },
  importButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  search: {
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    borderRadius: diveTheme.radii.control,
    backgroundColor: diveTheme.colors.surfaceRaised,
    color: diveTheme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    borderRadius: diveTheme.radii.pill,
    backgroundColor: diveTheme.colors.surfaceRaised,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filterChipSelected: {
    borderColor: diveTheme.colors.primary,
    backgroundColor: `${diveTheme.colors.primary}1f`,
  },
  filterChipText: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  filterChipTextSelected: {
    color: diveTheme.colors.primary,
  },
  listItem: {
    borderRadius: diveTheme.radii.card,
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    backgroundColor: diveTheme.colors.surfaceContainer,
    padding: 13,
  },
  listItemSelected: {
    borderColor: diveTheme.colors.primary,
    backgroundColor: `${diveTheme.colors.primary}12`,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitleGroup: {
    flex: 1,
    paddingRight: 10,
  },
  listTitle: {
    color: diveTheme.colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  listMetricGroup: {
    alignItems: 'flex-end',
  },
  listMetric: {
    color: diveTheme.colors.text,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 17,
    fontWeight: '900',
  },
  muted: {
    color: diveTheme.colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  rating: {
    color: diveTheme.colors.warning,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 14,
    fontWeight: '900',
  },
  detailMetric: {
    flex: 1,
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    borderRadius: diveTheme.radii.control,
    backgroundColor: diveTheme.colors.surfaceRaised,
    padding: 12,
  },
  detailMetricLabel: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  detailMetricValue: {
    color: diveTheme.colors.text,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 18,
    fontWeight: '900',
  },
  note: {
    color: diveTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
