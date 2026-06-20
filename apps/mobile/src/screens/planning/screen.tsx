import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, SelectorPill, StatusPill } from '../../components/ui/instrument';
import { HStack, Text, VStack } from '../../components/ui/primitives';
import type { DivePlanningItem, MobileDiveSession } from '../../types/dive-session';
import { formatDate, formatDuration } from '../../utils/dive-formatters';

type PlanningScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
};

export default function PlanningScreen(props: PlanningScreenProps): React.JSX.Element {
  const lastDive = props.sessions[0];
  const [mode, setMode] = React.useState<'shore' | 'boat' | 'pool'>('shore');
  const [plannedMaxDepthMeters, setPlannedMaxDepthMeters] = React.useState(() =>
    Math.max(3, Math.round(lastDive?.maxDepthMeters ?? 18)),
  );
  const surfaceIntervalSeconds = lastDive?.endedAt ? Date.now() / 1000 - lastDive.endedAt : 0;
  const checklist = buildChecklist(lastDive);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack gap={16}>
        <VStack gap={7}>
          <HStack className="items-center justify-between">
            <StatusPill label="Planning" />
            <StatusPill label="Assist" tone="secondary" />
          </HStack>
          <Text className="text-3xl font-semibold text-foreground">Next Recreational Dive</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Manual reminders from recent watch logs. Non-certified assistant.
          </Text>
        </VStack>

        <DiveSummaryCard accent="secondary">
          <DiveSummaryCard.Header eyebrow="Recent context" title={lastDive?.siteName ?? 'Choose site'} />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label="Last dive" value={formatDate(lastDive?.startedAt)} />
            <DiveSummaryCard.Metric label="Surface interval" value={formatDuration(surfaceIntervalSeconds)} />
            <DiveSummaryCard.Metric label="No-fly" value="Manual reminder" />
          </DiveSummaryCard.Body>
          <DiveSummaryCard.Footer>
            <Text className="text-sm font-semibold leading-5 text-primary">
              Confirm with training and certified equipment.
            </Text>
          </DiveSummaryCard.Footer>
        </DiveSummaryCard>

        <DiveSummaryCard accent="primary">
          <DiveSummaryCard.Header eyebrow="Plan inputs" title="Manual setup" />
          <DiveSummaryCard.Body>
            <HStack gap={4} className="rounded-full bg-muted p-1">
              <ModeSegment label="Shore" selected={mode === 'shore'} onPress={() => setMode('shore')} />
              <ModeSegment label="Boat" selected={mode === 'boat'} onPress={() => setMode('boat')} />
              <ModeSegment label="Pool" selected={mode === 'pool'} onPress={() => setMode('pool')} />
            </HStack>

            <HStack className="items-center justify-between rounded-2xl bg-muted px-4 py-4">
              <VStack gap={3}>
                <Text className="text-xs font-semibold uppercase text-muted-foreground">Planned max</Text>
                <Text className="text-2xl font-semibold text-foreground">{plannedMaxDepthMeters} m</Text>
              </VStack>
              <HStack gap={8}>
                <StepperButton label="-" onPress={() => setPlannedMaxDepthMeters(value => Math.max(3, value - 1))} />
                <StepperButton label="+" onPress={() => setPlannedMaxDepthMeters(value => Math.min(40, value + 1))} />
              </HStack>
            </HStack>

            <FieldRow label="Gas" value={lastDive?.gasLabel ?? 'Air'} />
            <FieldRow label="Site" value={lastDive?.siteName ?? 'Munseom Wall'} />
            <FieldRow label="Buddy" value={lastDive?.buddyIds?.[0] ?? 'Add buddy'} />
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent="secondary">
          <DiveSummaryCard.Header eyebrow="Trip prep" title="Checklist" />
          <DiveSummaryCard.Body>
            {checklist.map(item => (
              <ChecklistRow key={item.id} item={item} />
            ))}
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard variant="parchment">
          <HStack gap={14} className="items-center">
            <AssistantMark />
            <VStack gap={8} className="flex-1">
              <DiveSummaryCard.Metric label="Safety stop" value="Planning reminder" />
              <DiveSummaryCard.Metric label="Ascent" value="Review only" />
              <DiveSummaryCard.Metric label="No-fly" value="Manual reminder" />
            </VStack>
          </HStack>
        </DiveSummaryCard>

        <VStack gap={10}>
          <InstrumentButton label="Save Plan" variant="primary" onPress={() => undefined} />
          <InstrumentButton label="Open Logbook" onPress={props.onOpenLogbook} />
        </VStack>

        <SafetyText>PLANNING REMINDERS ONLY. NON-CERTIFIED ASSISTANT.</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function ModeSegment(props: { label: string; selected: boolean; onPress: () => void }): React.JSX.Element {
  return <SelectorPill className="flex-1" label={props.label} selected={props.selected} onPress={props.onPress} />;
}

function StepperButton(props: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      onPress={props.onPress}
      className="h-11 w-11 items-center justify-center rounded-full bg-card"
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      <Text className="text-2xl font-semibold text-primary">{props.label}</Text>
    </Pressable>
  );
}

function FieldRow(props: { label: string; value: string }): React.JSX.Element {
  return (
    <HStack className="min-h-12 items-center justify-between rounded-2xl bg-muted px-4 py-3">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-right text-sm font-semibold text-foreground">{props.value}</Text>
    </HStack>
  );
}

function ChecklistRow(props: { item: DivePlanningItem }): React.JSX.Element {
  return (
    <HStack className="min-h-9 items-center justify-between">
      <Text className="flex-1 pr-3 text-sm font-semibold text-card-foreground">{props.item.label}</Text>
      <StatusPill label={props.item.completed ? 'Ready' : 'Plan'} tone={props.item.completed ? 'primary' : 'secondary'} />
    </HStack>
  );
}

function AssistantMark(): React.JSX.Element {
  return (
    <VStack className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
      <Text className="text-lg font-semibold text-primary">REM</Text>
    </VStack>
  );
}

const buildChecklist = (session?: MobileDiveSession): DivePlanningItem[] => [
  {
    id: 'site-notes',
    label: `Site notes${session?.siteName ? ` · ${session.siteName}` : ''}`,
    completed: Boolean(session?.siteName),
  },
  {
    id: 'buddy',
    label: `Buddy history${session?.buddyIds?.[0] ? ` · ${session.buddyIds[0]}` : ''}`,
    completed: Boolean(session?.buddyIds?.length),
  },
  {
    id: 'gear',
    label: `Gear checklist${session?.gearIds?.length ? ` · ${session.gearIds.length} items` : ''}`,
    completed: Boolean(session?.gearIds?.length),
  },
  {
    id: 'gas',
    label: `Gas label${session?.gasLabel ? ` · ${session.gasLabel}` : ''}`,
    completed: Boolean(session?.gasLabel),
  },
];
