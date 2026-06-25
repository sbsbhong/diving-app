import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SelectorPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { Input, InputField } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import { Textarea, TextareaInput } from '../../components/ui/textarea';
import { VStack } from '../../components/ui/vstack';
import type { DiveEntryStyle, DivePlan, DivePlanStatus, DivePlanValues } from '../../types/dive-plan';
import type { WatchSession } from '../../types/dive-session';
import { createBlankDivePlan } from '../../utils/create-dive-plan';
import { PlanModeFields } from './plan-mode-fields';

type PlanEditorProps = {
  plan?: DivePlan;
  mode?: 'create' | 'edit';
  isSaving?: boolean;
  saveError?: Error | null;
  onCancel: () => void;
  onSave: (plan: DivePlan) => Promise<DivePlan>;
};

export type PlanEditorState = {
  title: string;
  plannedAt: string;
  diveMode: WatchSession['diveMode'] | undefined;
  entryStyle: DiveEntryStyle | '';
  siteName: string;
  buddies: string;
  gearIds: string;
  tags: string;
  objective: string;
  notes: string;
  plannedMaxDepth: string;
  plannedDuration: string;
  gasLabel: string;
  waterCondition: string;
  visibilityExpectation: string;
  perceivedDifficulty: string;
  trainingFocus: string;
  repetitionTarget: string;
};

const diveModes: NonNullable<WatchSession['diveMode']>[] = ['scuba', 'freedive'];
const entryStyles: DiveEntryStyle[] = ['shore', 'boat', 'pool'];

export function PlanEditor(props: PlanEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const basePlan = React.useMemo(() => props.plan ?? createBlankDivePlan(), [props.plan]);
  const [draft, setDraft] = React.useState<PlanEditorState>(() => planToEditorState(basePlan));
  const [localSaveFailed, setLocalSaveFailed] = React.useState(false);
  const activeDiveMode = draft.diveMode ?? 'scuba';
  const mode = props.mode ?? 'create';

  const setValue = React.useCallback(<Key extends keyof PlanEditorState>(key: Key, value: PlanEditorState[Key]) => {
    setDraft(currentDraft => ({ ...currentDraft, [key]: value }));
  }, []);

  const save = React.useCallback(
    async (status: DivePlanStatus) => {
      setLocalSaveFailed(false);
      try {
        await props.onSave(editorStateToPlan(basePlan, draft, status));
      } catch {
        setLocalSaveFailed(true);
      }
    },
    [basePlan, draft, props],
  );

  return (
    <DiveSummaryCard accent="primary">
      <DiveSummaryCard.Header
        eyebrow={t('planning.editorEyebrow', { defaultValue: 'Planbook entry' })}
        title={t(mode === 'edit' ? 'planning.editorEditTitle' : 'planning.editorTitle', {
          defaultValue: mode === 'edit' ? 'Edit dive plan' : 'New dive plan',
        })}
        titleTestID="planning-editor-title"
      />
      <DiveSummaryCard.Body>
        {props.saveError || localSaveFailed ? (
          <Text
            testID="planning-editor-error"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            children={t('planning.saveError', { defaultValue: 'Could not save this plan locally. Try again.' })}
          />
        ) : null}
        <EditorField label={t('planning.planTitle', { defaultValue: 'Plan title' })}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="planning-editor-plan-title"
              value={draft.title}
              onChangeText={value => setValue('title', value)}
              placeholder={t('planning.planTitlePlaceholder', { defaultValue: 'Morning reef plan' })}
            />
          </Input>
        </EditorField>
        <EditorField label={t('planning.plannedAt', { defaultValue: 'Planned date/time' })}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="planning-editor-planned-at"
              value={draft.plannedAt}
              onChangeText={value => setValue('plannedAt', value)}
              placeholder="2026-06-20 09:30"
            />
          </Input>
        </EditorField>
        <EditorField label={t('logbook.diveMode', { defaultValue: 'Dive mode' })}>
          <HStack space="xs" className="rounded-full bg-muted p-1">
            {diveModes.map(diveMode => (
              <SelectorPill
                key={diveMode}
                testID={`planning-editor-mode-${diveMode}`}
                className="flex-1"
                label={t(`diveModes.${diveMode}`, { defaultValue: diveMode })}
                selected={activeDiveMode === diveMode}
                onPress={() => setValue('diveMode', diveMode)}
              />
            ))}
          </HStack>
        </EditorField>
        <EditorField label={t('planning.entryStyle', { defaultValue: 'Entry style' })}>
          <HStack space="xs" className="rounded-full bg-muted p-1">
            {entryStyles.map(entryStyle => (
              <SelectorPill
                key={entryStyle}
                testID={`planning-editor-entry-style-${entryStyle}`}
                className="flex-1"
                label={t(`entryStyles.${entryStyle}`, { defaultValue: entryStyle })}
                selected={draft.entryStyle === entryStyle}
                onPress={() => setValue('entryStyle', entryStyle)}
              />
            ))}
          </HStack>
        </EditorField>
        <EditorField label={t('planning.siteName', { defaultValue: 'Site name' })}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="planning-editor-site-name"
              value={draft.siteName}
              onChangeText={value => setValue('siteName', value)}
              placeholder={t('planning.siteNamePlaceholder', { defaultValue: 'Dive site' })}
            />
          </Input>
        </EditorField>
        <HStack space="md">
          <EditorField className="flex-1" label={t('logbook.buddyNames', { defaultValue: 'Buddies' })}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="planning-editor-buddies"
                value={draft.buddies}
                onChangeText={value => setValue('buddies', value)}
                placeholder={t('logbook.commaSeparatedPlaceholder', { defaultValue: 'Separate with commas' })}
              />
            </Input>
          </EditorField>
          <EditorField className="flex-1" label={t('logbook.gear', { defaultValue: 'Gear' })}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="planning-editor-gear"
                value={draft.gearIds}
                onChangeText={value => setValue('gearIds', value)}
                placeholder={t('logbook.commaSeparatedPlaceholder', { defaultValue: 'Separate with commas' })}
              />
            </Input>
          </EditorField>
        </HStack>
        <EditorField label={t('logbook.tags', { defaultValue: 'Tags' })}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="planning-editor-tags"
              value={draft.tags}
              onChangeText={value => setValue('tags', value)}
              placeholder={t('logbook.commaSeparatedPlaceholder', { defaultValue: 'Separate with commas' })}
            />
          </Input>
        </EditorField>
        <EditorField label={t('planning.objective', { defaultValue: 'Objective' })}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="planning-editor-objective"
              value={draft.objective}
              onChangeText={value => setValue('objective', value)}
              placeholder={t('planning.objectivePlaceholder', { defaultValue: 'What this dive is for' })}
            />
          </Input>
        </EditorField>
        <PlanModeFields draft={draft} diveMode={activeDiveMode} setValue={setValue} />
        <EditorField label={t('logbook.notes', { defaultValue: 'Notes' })}>
          <Textarea className="rounded-xl bg-background">
            <TextareaInput
              testID="planning-editor-notes"
              value={draft.notes}
              onChangeText={value => setValue('notes', value)}
              placeholder={t('planning.notesPlaceholder', { defaultValue: 'Planning notes' })}
            />
          </Textarea>
        </EditorField>
      </DiveSummaryCard.Body>
      <DiveSummaryCard.Footer>
        <VStack space="sm">
          <HStack space="sm">
            <InstrumentButton className="flex-1" label={t('logbook.cancel', { defaultValue: 'Cancel' })} onPress={props.onCancel} />
            <InstrumentButton
              testID="planning-editor-save-draft"
              className="flex-1"
              label={t('planning.saveDraft', { defaultValue: 'Save draft' })}
              onPress={() => save('draft')}
              disabled={props.isSaving}
            />
          </HStack>
          <InstrumentButton
            testID="planning-editor-save-planned"
            label={props.isSaving ? t('planning.saving', { defaultValue: 'Saving' }) : t('planning.setPlanned', { defaultValue: 'Set planned' })}
            variant="primary"
            onPress={() => save('planned')}
            disabled={props.isSaving}
          />
        </VStack>
      </DiveSummaryCard.Footer>
    </DiveSummaryCard>
  );
}

export function EditorField(props: { label: string; children: React.ReactNode; className?: string }): React.JSX.Element {
  return (
    <VStack space="xs" className={props.className}>
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      {props.children}
    </VStack>
  );
}

function planToEditorState(plan: DivePlan): PlanEditorState {
  return {
    title: plan.title ?? '',
    plannedAt: plan.plannedAt === undefined ? '' : formatEditorDate(plan.plannedAt),
    diveMode: plan.diveMode ?? 'scuba',
    entryStyle: plan.entryStyle ?? '',
    siteName: plan.site.name ?? '',
    buddies: plan.buddyIds.join(', '),
    gearIds: plan.gearIds.join(', '),
    tags: plan.tags.join(', '),
    objective: plan.objective ?? '',
    notes: plan.notes ?? '',
    plannedMaxDepth: numberToText(plan.plannedValues.plannedMaxDepthMeters),
    plannedDuration: numberToText(plan.plannedValues.plannedDurationMinutes),
    gasLabel: plan.plannedValues.gasLabel ?? '',
    waterCondition: plan.plannedValues.waterCondition ?? '',
    visibilityExpectation: numberToText(plan.plannedValues.visibilityExpectation),
    perceivedDifficulty: numberToText(plan.plannedValues.perceivedDifficulty),
    trainingFocus: plan.plannedValues.trainingFocus ?? '',
    repetitionTarget: numberToText(plan.plannedValues.repetitionTarget),
  };
}

function editorStateToPlan(plan: DivePlan, draft: PlanEditorState, status: DivePlanStatus): DivePlan {
  const timestamp = Date.now() / 1000;
  const diveMode = draft.diveMode ?? 'scuba';
  const plannedAt = parseEditorDate(draft.plannedAt) ?? (status === 'planned' ? plan.plannedAt ?? timestamp : plan.plannedAt);

  return {
    ...plan,
    status,
    updatedAt: timestamp,
    plannedAt,
    title: emptyToUndefined(draft.title),
    diveMode,
    entryStyle: draft.entryStyle || undefined,
    site: {
      ...plan.site,
      name: emptyToUndefined(draft.siteName),
    },
    buddyIds: splitCommaList(draft.buddies),
    gearIds: splitCommaList(draft.gearIds),
    tags: splitCommaList(draft.tags),
    objective: emptyToUndefined(draft.objective),
    notes: emptyToUndefined(draft.notes),
    plannedValues: getPlannedValues(draft, diveMode),
  };
}

function getPlannedValues(draft: PlanEditorState, diveMode: WatchSession['diveMode']): DivePlanValues {
  const commonValues: DivePlanValues = {
    plannedDurationMinutes: textToNonNegativeNumber(draft.plannedDuration),
    trainingFocus: emptyToUndefined(draft.trainingFocus),
  };

  return {
    ...commonValues,
    plannedMaxDepthMeters: textToNonNegativeNumber(draft.plannedMaxDepth),
    gasLabel: diveMode === 'scuba' ? emptyToUndefined(draft.gasLabel) : undefined,
    waterCondition: textToWaterCondition(draft.waterCondition),
    visibilityExpectation: textToRating(draft.visibilityExpectation),
    perceivedDifficulty: textToRating(draft.perceivedDifficulty),
    repetitionTarget: diveMode === 'freedive' ? textToNonNegativeInteger(draft.repetitionTarget) : undefined,
  };
}

function splitCommaList(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function emptyToUndefined(value: string): string | undefined {
  const trimmedValue = value.trim();
  return trimmedValue.length ? trimmedValue : undefined;
}

function textToNumber(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function textToNonNegativeNumber(value: string): number | undefined {
  const parsedValue = textToNumber(value);
  return parsedValue !== undefined && parsedValue >= 0 ? parsedValue : undefined;
}

function textToNonNegativeInteger(value: string): number | undefined {
  const parsedValue = textToNumber(value);
  return parsedValue !== undefined && Number.isInteger(parsedValue) && parsedValue >= 0 ? parsedValue : undefined;
}

function textToRating(value: string): number | undefined {
  const parsedValue = textToNumber(value);
  return parsedValue !== undefined && Number.isInteger(parsedValue) && parsedValue >= 1 && parsedValue <= 5 ? parsedValue : undefined;
}

function textToWaterCondition(value: string): WatchSession['waterCondition'] | undefined {
  const normalizedValue = value.trim().toLowerCase();
  const waterConditions: NonNullable<WatchSession['waterCondition']>[] = ['calm', 'mild', 'choppy', 'surge', 'current', 'unknown'];
  return waterConditions.find(condition => condition === normalizedValue);
}

function numberToText(value: number | undefined): string {
  return value === undefined ? '' : `${value}`;
}

function formatEditorDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function parseEditorDate(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return undefined;
  }

  const normalizedValue = trimmedValue.includes('T') ? trimmedValue : trimmedValue.replace(' ', 'T');
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.getTime() / 1000;
}
