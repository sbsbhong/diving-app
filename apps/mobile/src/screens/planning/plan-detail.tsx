import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, StatusPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import type { DivePlan } from '../../types/dive-plan';
import { formatDate, formatDepth, formatLength } from '../../utils/dive-formatters';

type PlanDetailProps = {
  plan: DivePlan;
  onBack: () => void;
  onEdit: (plan: DivePlan) => void;
  onComplete: (plan: DivePlan) => Promise<void>;
  onDelete?: (localId: string) => Promise<void>;
  onCreateLogFromPlan: (plan: DivePlan) => void;
};

export function PlanDetail(props: PlanDetailProps): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const title = props.plan.title ?? props.plan.site.name ?? t('planning.untitledPlan', { defaultValue: 'Untitled plan' });
  const canComplete = props.plan.status !== 'completed';
  const canCreateLog = props.plan.status === 'completed';

  return (
    <DiveSummaryCard accent="primary">
      <DiveSummaryCard.Header
        eyebrow={t('planning.detailEyebrow', { defaultValue: 'Plan detail' })}
        title={title}
        right={<StatusPill label={t(`planning.status.${props.plan.status}`, { defaultValue: props.plan.status })} tone="secondary" />}
      />
      <DiveSummaryCard.Body>
        <Text className="text-sm leading-5 text-muted-foreground">
          {formatDate(props.plan.plannedAt, locale, t('formatters.unknownDate', { defaultValue: 'Unknown date' }))}
        </Text>
        <HStack space="md">
          <PlanFact label={t('logbook.diveMode', { defaultValue: 'Dive mode' })} value={props.plan.diveMode ?? t('diveModes.unknown')} />
          <PlanFact
            label={t('planning.entryStyle', { defaultValue: 'Entry style' })}
            value={props.plan.entryStyle ? t(`entryStyles.${props.plan.entryStyle}`, { defaultValue: props.plan.entryStyle }) : t('logbook.none')}
          />
        </HStack>
        <ModeFacts plan={props.plan} />
        <VStack space="xs" className="rounded-2xl bg-muted px-4 py-4">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">{t('planning.checklist', { defaultValue: 'Checklist' })}</Text>
          {props.plan.checklistItems.length ? (
            props.plan.checklistItems.map(item => (
              <HStack key={item.id} className="items-center justify-between">
                <Text className="text-sm text-card-foreground">{item.label}</Text>
                <StatusPill
                  label={item.completed ? t('planning.ready', { defaultValue: 'Ready' }) : t('planning.plan', { defaultValue: 'Plan' })}
                  tone={item.completed ? 'primary' : 'secondary'}
                />
              </HStack>
            ))
          ) : (
            <Text className="text-sm text-muted-foreground">{t('planning.noChecklist', { defaultValue: 'No checklist items' })}</Text>
          )}
        </VStack>
      </DiveSummaryCard.Body>
      <DiveSummaryCard.Footer>
        <VStack space="sm">
          <Text className="text-sm leading-5 text-card-foreground">
            {props.plan.notes ?? props.plan.objective ?? t('planning.noNotes', { defaultValue: 'No planning notes yet.' })}
          </Text>
          {canCreateLog ? (
            <InstrumentButton
              testID="planning-detail-create-log"
              label={t('planning.createLogFromPlan', { defaultValue: 'Create log from plan' })}
              variant="primary"
              onPress={() => props.onCreateLogFromPlan(props.plan)}
            />
          ) : null}
          {canComplete ? (
            <InstrumentButton
              testID="planning-detail-complete"
              label={t('planning.markCompleted', { defaultValue: 'Mark completed' })}
              variant="primary"
              onPress={() => props.onComplete(props.plan)}
            />
          ) : null}
          <InstrumentButton testID="planning-detail-edit" label={t('planning.editPlan', { defaultValue: 'Edit plan' })} onPress={() => props.onEdit(props.plan)} />
          {props.onDelete ? (
            <InstrumentButton
              label={t('planning.deletePlan', { defaultValue: 'Delete plan' })}
              variant="danger"
              onPress={() => props.onDelete?.(props.plan.localId)}
            />
          ) : null}
          <InstrumentButton testID="planning-detail-back" label={t('logbook.backToList', { defaultValue: 'Back to list' })} onPress={props.onBack} />
        </VStack>
      </DiveSummaryCard.Footer>
    </DiveSummaryCard>
  );
}

function ModeFacts(props: { plan: DivePlan }): React.JSX.Element {
  const { t } = useTranslation();
  const values = props.plan.plannedValues;
  const facts = [
    props.plan.diveMode !== 'pool'
      ? { id: 'planned-max', label: t('planning.plannedMax', { defaultValue: 'Planned max' }), value: formatDepth(values.plannedMaxDepthMeters) }
      : undefined,
    values.plannedDurationMinutes !== undefined
      ? { id: 'duration', label: t('planning.plannedDurationMinutes', { defaultValue: 'Planned duration (min)' }), value: `${values.plannedDurationMinutes} min` }
      : undefined,
    values.gasLabel ? { id: 'gas', label: t('planning.gasLabel', { defaultValue: 'Gas label' }), value: values.gasLabel } : undefined,
    values.poolLengthMeters !== undefined
      ? { id: 'pool-length', label: t('planning.poolLengthMeters', { defaultValue: 'Pool length (m)' }), value: formatLength(values.poolLengthMeters) }
      : undefined,
    values.lapTarget !== undefined ? { id: 'lap-target', label: t('planning.lapTarget', { defaultValue: 'Lap target' }), value: `${values.lapTarget}` } : undefined,
    values.trainingFocus ? { id: 'training-focus', label: t('planning.trainingFocus', { defaultValue: 'Training focus' }), value: values.trainingFocus } : undefined,
  ].filter((fact): fact is { id: string; label: string; value: string } => Boolean(fact));

  return (
    <VStack space="xs" className="rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{t('planning.plannedValues', { defaultValue: 'Planned values' })}</Text>
      {facts.map(fact => (
        <HStack key={fact.id} className="items-center justify-between">
          <Text className="text-sm text-muted-foreground">{fact.label}</Text>
          <Text className="text-sm font-semibold text-card-foreground">{fact.value}</Text>
        </HStack>
      ))}
    </VStack>
  );
}

function PlanFact(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack space="xs" className="flex-1 rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-sm font-semibold text-card-foreground">{props.value}</Text>
    </VStack>
  );
}
