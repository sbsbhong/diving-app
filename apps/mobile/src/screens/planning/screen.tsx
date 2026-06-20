import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack, Text, VStack } from '../../components/ui/primitives';
import { diveTheme } from '../../components/ui/theme';
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
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <VStack gap={14}>
        <VStack gap={7}>
          <HStack style={styles.headerRow}>
            <StatusPill label="Planning" />
            <StatusPill label="Assist" tone="secondary" />
          </HStack>
          <Text style={styles.heading}>Next Recreational Dive</Text>
          <Text style={styles.muted}>Manual reminders from recent watch logs. Non-certified assistant.</Text>
        </VStack>

        <DiveSummaryCard accent={diveTheme.colors.secondary}>
          <DiveSummaryCard.Header eyebrow="Recent context" title={lastDive?.siteName ?? 'Choose site'} />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label="Last dive" value={formatDate(lastDive?.startedAt)} />
            <DiveSummaryCard.Metric label="Surface interval" value={formatDuration(surfaceIntervalSeconds)} />
            <DiveSummaryCard.Metric label="No-fly" value="Manual reminder" />
          </DiveSummaryCard.Body>
          <DiveSummaryCard.Footer>
            <Text style={styles.warningText}>Confirm with training and certified equipment.</Text>
          </DiveSummaryCard.Footer>
        </DiveSummaryCard>

        <DiveSummaryCard accent={diveTheme.colors.primary}>
          <DiveSummaryCard.Header eyebrow="Plan inputs" title="Manual setup" />
          <DiveSummaryCard.Body>
            <HStack gap={8}>
              <ModeSegment label="Shore" selected={mode === 'shore'} onPress={() => setMode('shore')} />
              <ModeSegment label="Boat" selected={mode === 'boat'} onPress={() => setMode('boat')} />
              <ModeSegment label="Pool" selected={mode === 'pool'} onPress={() => setMode('pool')} />
            </HStack>

            <HStack style={styles.stepperRow}>
              <VStack gap={3}>
                <Text style={styles.fieldLabel}>Planned max</Text>
                <Text style={styles.depthValue}>{plannedMaxDepthMeters} m</Text>
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

        <DiveSummaryCard accent={diveTheme.colors.success}>
          <DiveSummaryCard.Header eyebrow="Trip prep" title="Checklist" />
          <DiveSummaryCard.Body>
            {checklist.map(item => (
              <ChecklistRow key={item.id} item={item} />
            ))}
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent={diveTheme.colors.warning}>
          <HStack gap={14} style={styles.assistantLayout}>
            <AssistantRing />
            <VStack gap={8} style={styles.assistantRows}>
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
  return (
    <Pressable onPress={props.onPress} style={[styles.modeSegment, props.selected && styles.modeSegmentSelected]}>
      <Text style={[styles.modeSegmentText, props.selected && styles.modeSegmentTextSelected]}>{props.label}</Text>
    </Pressable>
  );
}

function StepperButton(props: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={styles.stepperButton}>
      <Text style={styles.stepperButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function FieldRow(props: { label: string; value: string }): React.JSX.Element {
  return (
    <HStack style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <Text style={styles.fieldValue}>{props.value}</Text>
    </HStack>
  );
}

function ChecklistRow(props: { item: DivePlanningItem }): React.JSX.Element {
  return (
    <HStack style={styles.checklistRow}>
      <Text style={styles.checklistLabel}>{props.item.label}</Text>
      <StatusPill label={props.item.completed ? 'Ready' : 'Plan'} tone={props.item.completed ? 'success' : 'primary'} />
    </HStack>
  );
}

function AssistantRing(): React.JSX.Element {
  return (
    <VStack style={styles.ring}>
      <Text style={styles.ringValue}>REM</Text>
      <Text style={styles.ringLabel}>ASSIST</Text>
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

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: diveTheme.colors.background,
  },
  content: {
    padding: diveTheme.spacing.screen,
    paddingBottom: 18,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    color: diveTheme.colors.text,
    fontSize: 25,
    fontWeight: '900',
  },
  muted: {
    color: diveTheme.colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
  },
  warningText: {
    color: diveTheme.colors.warning,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  modeSegment: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    borderRadius: diveTheme.radii.pill,
    backgroundColor: diveTheme.colors.surfaceRaised,
    paddingVertical: 9,
  },
  modeSegmentSelected: {
    borderColor: diveTheme.colors.primary,
    backgroundColor: diveTheme.colors.primary,
  },
  modeSegmentText: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modeSegmentTextSelected: {
    color: diveTheme.colors.primaryText,
  },
  stepperRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    borderRadius: diveTheme.radii.control,
    backgroundColor: diveTheme.colors.surfaceRaised,
    padding: 12,
  },
  depthValue: {
    color: diveTheme.colors.text,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 22,
    fontWeight: '900',
  },
  stepperButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: diveTheme.colors.primary,
    borderRadius: 19,
    backgroundColor: `${diveTheme.colors.primary}14`,
  },
  stepperButtonText: {
    color: diveTheme.colors.primary,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 22,
    fontWeight: '900',
  },
  fieldRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: diveTheme.colors.outline,
    borderRadius: diveTheme.radii.control,
    backgroundColor: diveTheme.colors.surfaceRaised,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldLabel: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: diveTheme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  checklistRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  checklistLabel: {
    flex: 1,
    color: diveTheme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    paddingRight: 12,
  },
  assistantLayout: {
    alignItems: 'center',
  },
  assistantRows: {
    flex: 1,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 76,
    height: 76,
    borderWidth: 7,
    borderColor: diveTheme.colors.warning,
    borderRadius: 38,
    backgroundColor: diveTheme.colors.surfaceRaised,
  },
  ringValue: {
    color: diveTheme.colors.warning,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 18,
    fontWeight: '900',
  },
  ringLabel: {
    color: diveTheme.colors.mutedText,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
