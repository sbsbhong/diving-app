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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-3.5 px-4 pb-5 pt-3">
      <DiveSummaryCard accent="primary">
        <HStack className="items-center justify-between">
          <StatusPill label="Watch assistant" />
          <HStack gap={4} className="items-baseline">
            <Text className="font-mono text-2xl font-black text-primary">{props.sessions.length}</Text>
            <Text className="text-xs font-extrabold uppercase text-muted-foreground">logs</Text>
          </HStack>
        </HStack>
        <VStack gap={6}>
          <Text className="text-3xl font-black text-card-foreground">DiveMobile</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Recreational watch log review. Non-certified assistant.
          </Text>
        </VStack>
      </DiveSummaryCard>

      <DiveSummaryCard accent="primary">
        <DiveSummaryCard.Header
          eyebrow="Latest watch import"
          title={recentSession?.siteName ?? 'Import a watch dive'}
          right={<StatusPill label={recentSession?.syncStatus ?? 'pending'} tone="secondary" />}
        />
        <DiveSummaryCard.Body>
          <DiveSummaryCard.Metric label="Date" value={formatDate(recentSession?.startedAt)} />
          <SessionProfile samples={recentSession?.samples ?? []} kind="depth" title="Depth profile" />
        </DiveSummaryCard.Body>
      </DiveSummaryCard>

      <HStack gap={12}>
        <MetricTile label="Max depth" value={formatDepth(recentSummary?.maxDepthMeters)} />
        <MetricTile label="Bottom time" value={formatDuration(recentSummary?.durationSeconds ?? 0)} />
      </HStack>

      <DiveSummaryCard accent="success">
        <HStack gap={14} className="items-center">
          <AssistantRing />
          <VStack gap={7} className="flex-1">
            <StatusPill label="Assistant steady" tone="success" />
            <Text className="font-mono text-xs font-extrabold uppercase text-muted-foreground">Safety assistant</Text>
            <Text className="text-sm leading-5 text-muted-foreground">Monitoring reminders from watch logs.</Text>
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
    </ScrollView>
  );
}

function MetricTile(props: { label: string; value: string }): React.JSX.Element {
  return (
    <DiveSummaryCard className="flex-1">
      <Text className="font-mono text-xs font-extrabold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="font-mono text-2xl font-black text-card-foreground">{props.value}</Text>
    </DiveSummaryCard>
  );
}

function AssistantRing(): React.JSX.Element {
  return (
    <VStack className="h-20 w-20 items-center justify-center rounded-full border-8 border-primary bg-muted">
      <Text className="font-mono text-xl font-black text-primary">OK</Text>
      <Text className="text-center text-xs font-black uppercase text-muted-foreground">ASSIST</Text>
    </VStack>
  );
}
