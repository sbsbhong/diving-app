import React from 'react';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, SelectorPill, StatusPill } from '../../components/ui/instrument';
import { Box, HStack, Text, VStack } from '../../components/ui/primitives';
import { SessionProfile } from '../../components/ui/session-profile';
import type { InstrumentTone } from '../../components/ui/theme';
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack gap={16}>
        <VStack gap={12}>
          <HStack className="items-center justify-between">
            <VStack gap={4} className="flex-1">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">Log review</Text>
              <Text className="text-3xl font-semibold leading-9 text-foreground">Imported Dives</Text>
            </VStack>
            <InstrumentButton label="Import" onPress={props.onImportFixtures} className="min-h-10 px-4 py-2" />
          </HStack>
          <VStack gap={12} className="rounded-2xl bg-card px-4 py-4">
            <TextInput
              placeholder="Search site, buddy, gear, tag, note"
              value={props.filter.query}
              onChangeText={query => props.onFilterChange({ ...props.filter, query })}
              className="min-h-11 rounded-full bg-muted px-5 py-3 text-base font-normal text-foreground placeholder:text-muted-foreground"
            />
            <HStack gap={4} className="rounded-full bg-muted p-1">
              <SelectorPill className="flex-1" label="All" selected={syncFilter === 'all'} onPress={() => setSyncFilter('all')} />
              <SelectorPill
                className="flex-1"
                label="Synced"
                selected={syncFilter === 'synced'}
                onPress={() => setSyncFilter('synced')}
              />
              <SelectorPill
                className="flex-1"
                label="Pending"
                selected={syncFilter === 'pending'}
                onPress={() => setSyncFilter('pending')}
              />
            </HStack>
          </VStack>
        </VStack>

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

function EmptyLogbook(): React.JSX.Element {
  return (
    <DiveSummaryCard>
      <DiveSummaryCard.Header eyebrow="Empty" title="No imported dives yet" />
      <DiveSummaryCard.Footer>
        <Text className="text-sm leading-5 text-muted-foreground">Import a watch sync fixture to preview the logbook flow.</Text>
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
    <Pressable
      onPress={props.onPress}
      className="rounded-2xl bg-card px-4 py-4"
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      <VStack gap={7}>
        <HStack className="items-center justify-between">
          <HStack gap={10} className="flex-1 items-center pr-2.5">
            <Box className={`h-2 w-2 rounded-full ${props.selected ? 'bg-primary' : 'bg-muted'}`} />
            <VStack gap={3} className="flex-1">
              <Text className="text-lg font-semibold text-card-foreground">{props.session.siteName ?? 'Untitled dive'}</Text>
              <Text className="text-sm leading-5 text-muted-foreground">{formatDate(props.session.startedAt)}</Text>
            </VStack>
          </HStack>
          <VStack gap={4} className="items-end">
            <StatusPill label={status} tone={syncStatusTone(status)} />
            <Text className="text-lg font-semibold text-card-foreground">{formatDepth(summary.maxDepthMeters)}</Text>
          </VStack>
        </HStack>
        <Text className="pl-5 text-sm leading-5 text-muted-foreground">
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
    <DiveSummaryCard accent="primary">
      <DiveSummaryCard.Header
        eyebrow={props.session.diveMode ?? 'unknown'}
        title={props.session.siteName ?? 'Dive detail'}
        right={<Text className="text-sm font-semibold text-primary">{formatRating(props.session.rating)}</Text>}
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
          <Text className="text-sm leading-5 text-card-foreground">{props.session.notes ?? 'No notes yet.'}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">Tags: {(props.session.tags ?? ['none']).join(', ')}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">Media: {props.session.mediaPlaceholders.join(', ')}</Text>
        </VStack>
      </DiveSummaryCard.Footer>
    </DiveSummaryCard>
  );
}

function DetailMetric(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack gap={5} className="flex-1 rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-lg font-semibold text-foreground">{props.value}</Text>
    </VStack>
  );
}

const syncStatusTone = (status: string): InstrumentTone => {
  if (status === 'synced') {
    return 'primary';
  }

  if (status === 'failed') {
    return 'danger';
  }

  return 'secondary';
};
