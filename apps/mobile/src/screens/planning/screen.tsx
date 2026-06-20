import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
  const { i18n, t } = useTranslation();
  const lastDive = props.sessions[0];
  const [mode, setMode] = React.useState<'shore' | 'boat' | 'pool'>('shore');
  const [plannedMaxDepthMeters, setPlannedMaxDepthMeters] = React.useState(() =>
    Math.max(3, Math.round(lastDive?.maxDepthMeters ?? 18)),
  );
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const surfaceIntervalSeconds = lastDive?.endedAt ? Date.now() / 1000 - lastDive.endedAt : 0;
  const checklist = buildChecklist(lastDive, t);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack gap={16}>
        <VStack gap={7}>
          <HStack className="items-center justify-between">
            <StatusPill label={t('status.planning')} />
            <StatusPill label={t('status.assist')} tone="secondary" />
          </HStack>
          <Text className="text-3xl font-semibold text-foreground">{t('planning.title')}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">{t('planning.subtitle')}</Text>
        </VStack>

        <DiveSummaryCard accent="secondary">
          <DiveSummaryCard.Header eyebrow={t('planning.recentContext')} title={lastDive?.siteName ?? t('planning.chooseSite')} />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric
              label={t('planning.lastDive')}
              value={formatDate(lastDive?.startedAt, locale, t('formatters.unknownDate'))}
            />
            <DiveSummaryCard.Metric label={t('planning.surfaceInterval')} value={formatDuration(surfaceIntervalSeconds)} />
            <DiveSummaryCard.Metric label={t('planning.noFly')} value={t('planning.manualReminder')} />
          </DiveSummaryCard.Body>
          <DiveSummaryCard.Footer>
            <Text className="text-sm font-semibold leading-5 text-primary">
              {t('planning.confirmTraining')}
            </Text>
          </DiveSummaryCard.Footer>
        </DiveSummaryCard>

        <DiveSummaryCard accent="primary">
          <DiveSummaryCard.Header eyebrow={t('planning.planInputs')} title={t('planning.manualSetup')} />
          <DiveSummaryCard.Body>
            <HStack gap={4} className="rounded-full bg-muted p-1">
              <ModeSegment label={t('planning.modes.shore')} selected={mode === 'shore'} onPress={() => setMode('shore')} />
              <ModeSegment label={t('planning.modes.boat')} selected={mode === 'boat'} onPress={() => setMode('boat')} />
              <ModeSegment label={t('planning.modes.pool')} selected={mode === 'pool'} onPress={() => setMode('pool')} />
            </HStack>

            <HStack className="items-center justify-between rounded-2xl bg-muted px-4 py-4">
              <VStack gap={3}>
                <Text className="text-xs font-semibold uppercase text-muted-foreground">{t('planning.plannedMax')}</Text>
                <Text className="text-2xl font-semibold text-foreground">{plannedMaxDepthMeters} m</Text>
              </VStack>
              <HStack gap={8}>
                <StepperButton label="-" onPress={() => setPlannedMaxDepthMeters(value => Math.max(3, value - 1))} />
                <StepperButton label="+" onPress={() => setPlannedMaxDepthMeters(value => Math.min(40, value + 1))} />
              </HStack>
            </HStack>

            <FieldRow label={t('planning.gas')} value={lastDive?.gasLabel ?? t('planning.air')} />
            <FieldRow label={t('planning.site')} value={lastDive?.siteName ?? t('planning.defaultSite')} />
            <FieldRow label={t('planning.buddy')} value={lastDive?.buddyIds?.[0] ?? t('planning.addBuddy')} />
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent="secondary">
          <DiveSummaryCard.Header eyebrow={t('planning.tripPrep')} title={t('planning.checklist')} />
          <DiveSummaryCard.Body>
            {checklist.map(item => (
              <ChecklistRow key={item.id} item={item} />
            ))}
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard variant="parchment">
          <HStack gap={14} className="items-center">
            <AssistantMark label={t('planning.assistantMark')} />
            <VStack gap={8} className="flex-1">
              <DiveSummaryCard.Metric label={t('planning.safetyStop')} value={t('planning.planningReminder')} />
              <DiveSummaryCard.Metric label={t('planning.ascent')} value={t('planning.reviewOnly')} />
              <DiveSummaryCard.Metric label={t('planning.noFly')} value={t('planning.manualReminder')} />
            </VStack>
          </HStack>
        </DiveSummaryCard>

        <VStack gap={10}>
          <InstrumentButton label={t('planning.savePlan')} variant="primary" onPress={() => undefined} />
          <InstrumentButton label={t('planning.openLogbook')} onPress={props.onOpenLogbook} />
        </VStack>

        <SafetyText>{t('planning.safetyText')}</SafetyText>
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
  const { t } = useTranslation();

  return (
    <HStack className="min-h-9 items-center justify-between">
      <Text className="flex-1 pr-3 text-sm font-semibold text-card-foreground">{props.item.label}</Text>
      <StatusPill label={props.item.completed ? t('planning.ready') : t('planning.plan')} tone={props.item.completed ? 'primary' : 'secondary'} />
    </HStack>
  );
}

function AssistantMark(props: { label: string }): React.JSX.Element {
  return (
    <VStack className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
      <Text className="text-lg font-semibold text-primary">{props.label}</Text>
    </VStack>
  );
}

const buildChecklist = (session: MobileDiveSession | undefined, t: TFunction): DivePlanningItem[] => [
  {
    id: 'site-notes',
    label: session?.siteName ? t('planning.checklistItems.siteNotesWithSite', { siteName: session.siteName }) : t('planning.checklistItems.siteNotes'),
    completed: Boolean(session?.siteName),
  },
  {
    id: 'buddy',
    label: session?.buddyIds?.[0]
      ? t('planning.checklistItems.buddyHistoryWithBuddy', { buddyName: session.buddyIds[0] })
      : t('planning.checklistItems.buddyHistory'),
    completed: Boolean(session?.buddyIds?.length),
  },
  {
    id: 'gear',
    label: session?.gearIds?.length
      ? t('planning.checklistItems.gearChecklistWithCount', { count: session.gearIds.length })
      : t('planning.checklistItems.gearChecklist'),
    completed: Boolean(session?.gearIds?.length),
  },
  {
    id: 'gas',
    label: session?.gasLabel
      ? t('planning.checklistItems.gasLabelWithGas', { gasLabel: session.gasLabel })
      : t('planning.checklistItems.gasLabel'),
    completed: Boolean(session?.gasLabel),
  },
];
