import React from 'react';
import { ScrollView } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack, Text, VStack } from '../../components/ui/primitives';
import { SessionProfile } from '../../components/ui/session-profile';
import type { MobileDiveSession } from '../../types/dive-session';
import { formatDate, formatDepth, formatDuration, formatRating } from '../../utils/dive-formatters';
import { summarizeSession } from '../../utils/session-summary';

type MemoryScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
};

export default function MemoryScreen(props: MemoryScreenProps): React.JSX.Element {
  const session = props.sessions[0];
  const summary = session ? summarizeSession(session) : undefined;
  const totalDuration = props.sessions.reduce((sum, currentSession) => {
    return sum + summarizeSession(currentSession).durationSeconds;
  }, 0);
  const averageMaxDepth =
    props.sessions.length === 0
      ? undefined
      : props.sessions.reduce((sum, currentSession) => {
          return sum + summarizeSession(currentSession).maxDepthMeters;
        }, 0) / props.sessions.length;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack gap={16}>
        <VStack gap={7}>
          <HStack className="items-center justify-between">
            <StatusPill label="Memory" />
            <StatusPill label="Static" tone="secondary" />
          </HStack>
          <Text className="text-3xl font-semibold text-foreground">Share Card Preview</Text>
          <Text className="text-sm leading-5 text-muted-foreground">Preview a recreational log story from watch data.</Text>
        </VStack>

        <DiveSummaryCard accent="primary">
          <DiveSummaryCard.Header
            eyebrow="Static preview"
            title={session?.siteName ?? 'Import a dive'}
            right={<Text className="text-sm font-semibold text-muted-foreground">{formatDate(session?.startedAt)}</Text>}
          />
          <DiveSummaryCard.Body>
            <HStack gap={10}>
              <ShareMetric label="Max" value={formatDepth(summary?.maxDepthMeters)} />
              <ShareMetric label="Time" value={formatDuration(summary?.durationSeconds ?? 0)} />
            </HStack>
            <SessionProfile samples={session?.samples ?? []} kind="depth" title="Depth profile" />
            <HStack className="items-center justify-between">
              <Text className="text-sm font-semibold text-primary">{formatRating(session?.rating)}</Text>
              <Text className="flex-1 text-right text-xs font-semibold leading-4 text-muted-foreground">
                {session?.tags?.join(' · ') ?? 'shore · calm · training'}
              </Text>
            </HStack>
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent="secondary">
          <DiveSummaryCard.Header eyebrow="Export status" title="Future workflow" />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label="Image render" value="Placeholder" />
            <DiveSummaryCard.Metric label="Social sharing" value="Separate spec" />
            <DiveSummaryCard.Metric label="Media workflow" value={`${session?.mediaPlaceholders.length ?? 0} placeholders`} />
            <DiveSummaryCard.Metric label="Color correction" value="Research only" />
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent="primary">
          <DiveSummaryCard.Header eyebrow="Safe analytics" title="Review summaries" />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label="Logged dives" value={`${props.sessions.length}`} />
            <DiveSummaryCard.Metric label="Total bottom time" value={formatDuration(totalDuration)} />
            <DiveSummaryCard.Metric label="Avg max depth" value={formatDepth(averageMaxDepth)} />
            <DiveSummaryCard.Metric label="Favorite mode" value={session?.diveMode ?? 'Recreational'} />
          </DiveSummaryCard.Body>
          <DiveSummaryCard.Footer>
            <Text className="text-sm leading-5 text-muted-foreground">Review-only summaries. Non-certified assistant.</Text>
          </DiveSummaryCard.Footer>
        </DiveSummaryCard>

        <VStack gap={10}>
          <InstrumentButton label="Save Preview" variant="primary" onPress={() => undefined} />
          <InstrumentButton label="Open Logbook" onPress={props.onOpenLogbook} />
        </VStack>

        <SafetyText>MEMORY REVIEW ONLY. NON-CERTIFIED ASSISTANT.</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function ShareMetric(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack gap={5} className="flex-1 rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-2xl font-semibold text-foreground">{props.value}</Text>
    </VStack>
  );
}
