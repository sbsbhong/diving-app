import React from 'react';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack, Text, VStack } from '../../components/ui/primitives';
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="p-4 pb-5">
      <VStack gap={14}>
        <DiveSummaryCard accent="primary">
          <DiveSummaryCard.Header
            eyebrow="Log review"
            title="Imported Dives"
            right={<InstrumentButton label="Import" onPress={props.onImportFixtures} className="min-h-9 px-3 py-2" />}
          />
          <DiveSummaryCard.Body>
            <TextInput
              placeholder="Search site, buddy, gear, tag, note"
              value={props.filter.query}
              onChangeText={query => props.onFilterChange({ ...props.filter, query })}
              className="rounded-md border border-input bg-muted px-3.5 py-2.5 text-sm font-bold text-foreground placeholder:text-muted-foreground"
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
    <Pressable
      onPress={props.onPress}
      className={`flex-1 items-center rounded-full border px-2.5 py-2 ${
        props.selected ? 'border-primary bg-primary/15' : 'border-border bg-muted'
      }`}>
      <Text className={`font-mono text-xs font-extrabold uppercase ${props.selected ? 'text-primary' : 'text-muted-foreground'}`}>
        {props.label}
      </Text>
    </Pressable>
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
      className={`rounded-lg border p-3.5 ${props.selected ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
      <VStack gap={7}>
        <HStack className="items-center justify-between">
          <VStack gap={3} className="flex-1 pr-2.5">
            <Text className="text-lg font-black text-card-foreground">{props.session.siteName ?? 'Untitled dive'}</Text>
            <Text className="text-sm leading-5 text-muted-foreground">{formatDate(props.session.startedAt)}</Text>
          </VStack>
          <VStack gap={4} className="items-end">
            <StatusPill label={status} tone={syncStatusTone(status)} />
            <Text className="font-mono text-lg font-black text-card-foreground">{formatDepth(summary.maxDepthMeters)}</Text>
          </VStack>
        </HStack>
        <Text className="text-sm leading-5 text-muted-foreground">
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
        right={<Text className="font-mono text-sm font-black text-accent-foreground">{formatRating(props.session.rating)}</Text>}
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
    <VStack gap={5} className="flex-1 rounded-md border border-border bg-muted p-3">
      <Text className="font-mono text-xs font-black uppercase text-muted-foreground">{props.label}</Text>
      <Text className="font-mono text-lg font-black text-foreground">{props.value}</Text>
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
