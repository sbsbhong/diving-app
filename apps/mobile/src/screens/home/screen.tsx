import React from 'react';
import { ScrollView } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack, Text, VStack } from '../../components/ui/primitives';
import { SessionProfile } from '../../components/ui/session-profile';
import type { MobileDiveSession } from '../../types/dive-session';
import { formatDate, formatDepth, formatDuration } from '../../utils/dive-formatters';
import { summarizeSession } from '../../utils/session-summary';

type HomeScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
  onOpenPlanning: () => void;
  onOpenMemory: () => void;
};

export default function HomeScreen(props: HomeScreenProps): React.JSX.Element {
  const recentSession = props.sessions[0];
  const recentSummary = recentSession ? summarizeSession(recentSession) : undefined;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack gap={16}>
        <VStack gap={10} className="pt-2">
          <StatusPill label="Watch assistant" />
          <Text className="text-4xl font-semibold leading-10 text-foreground">DiveMobile</Text>
          <Text className="text-base leading-6 text-muted-foreground">
            Review recreational watch logs. Non-certified assistant.
          </Text>
          <HStack gap={5} className="items-baseline">
            <Text className="text-2xl font-semibold text-primary">{props.sessions.length}</Text>
            <Text className="text-sm font-semibold text-muted-foreground">logs imported</Text>
          </HStack>
        </VStack>

        <DiveSummaryCard>
          <DiveSummaryCard.Header
            eyebrow="Latest watch import"
            title={recentSession?.siteName ?? 'Import a watch dive'}
            right={<StatusPill label={recentSession?.syncStatus ?? 'pending'} tone="secondary" />}
          />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label="Date" value={formatDate(recentSession?.startedAt)} />
            <SessionProfile samples={recentSession?.samples ?? []} kind="depth" title="Depth profile" />
            <HStack gap={10}>
              <MetricTile label="Max depth" value={formatDepth(recentSummary?.maxDepthMeters)} />
              <MetricTile label="Bottom time" value={formatDuration(recentSummary?.durationSeconds ?? 0)} />
            </HStack>
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard>
          <HStack gap={12} className="items-center">
            <AssistantMark />
            <VStack gap={4} className="flex-1">
              <Text className="text-base font-semibold text-card-foreground">Assistant steady</Text>
              <Text className="text-sm leading-5 text-muted-foreground">Reminder review from watch logs only.</Text>
            </VStack>
          </HStack>
          <DiveSummaryCard.Metric label="Ascent" value="Review only" />
          <DiveSummaryCard.Metric label="Safety stop" value="Planning reminder" />
        </DiveSummaryCard>

        <VStack gap={10}>
          <InstrumentButton label="Open Logbook" variant="primary" onPress={props.onOpenLogbook} />
          <InstrumentButton label="Plan Next Dive" onPress={props.onOpenPlanning} />
          <InstrumentButton label="Preview Memory" onPress={props.onOpenMemory} />
        </VStack>

        <SafetyText>RECREATIONAL USE ONLY. NON-CERTIFIED ASSISTANT.</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function MetricTile(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack gap={5} className="flex-1 rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-2xl font-semibold text-card-foreground">{props.value}</Text>
    </VStack>
  );
}

function AssistantMark(): React.JSX.Element {
  return (
    <VStack className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
      <Text className="text-lg font-semibold text-primary">OK</Text>
    </VStack>
  );
}
