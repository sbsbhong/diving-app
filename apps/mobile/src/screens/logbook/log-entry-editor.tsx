import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, ScreenBackButton, SelectorPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { Input, InputField } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import { Textarea, TextareaInput } from '../../components/ui/textarea';
import type { DiveEntryStyle } from '../../types/dive-plan';
import type { DiveLogEntry, DiveLogFieldProvenance, DiveLogManualMeasuredValues } from '../../types/dive-log-entry';
import type { WatchSession } from '../../types/dive-session';
import { EditorField, ModeSpecificFields, type LogEntryEditorState } from './log-entry-mode-fields';

type LogEntryEditorProps = {
  entry: DiveLogEntry;
  mode?: 'create' | 'edit';
  isSaving?: boolean;
  saveError?: Error | null;
  onCancel: () => void;
  onSave: (entry: DiveLogEntry) => Promise<DiveLogEntry>;
};

const diveModes: NonNullable<WatchSession['diveMode']>[] = ['scuba', 'freedive'];
const entryStyles: DiveEntryStyle[] = ['shore', 'boat', 'pool'];
const waterConditions: NonNullable<WatchSession['waterCondition']>[] = ['calm', 'mild', 'choppy', 'surge', 'current', 'unknown'];
type TouchedEditorFields = ReadonlySet<keyof LogEntryEditorState>;

export function LogEntryEditor(props: LogEntryEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState<LogEntryEditorState>(() => entryToEditorState(props.entry));
  const [touchedFields, setTouchedFields] = React.useState<TouchedEditorFields>(() => new Set());
  const [localSaveFailed, setLocalSaveFailed] = React.useState(false);
  const activeDiveMode = draft.diveMode ?? 'scuba';
  const mode = props.mode ?? 'create';

  const setValue = React.useCallback(<Key extends keyof LogEntryEditorState>(key: Key, value: LogEntryEditorState[Key]) => {
    setDraft(currentDraft => ({ ...currentDraft, [key]: value }));
    setTouchedFields(currentFields => new Set(currentFields).add(key));
  }, []);

  const save = React.useCallback(async () => {
    setLocalSaveFailed(false);
    try {
      await props.onSave(editorStateToEntry(props.entry, draft, touchedFields));
    } catch {
      setLocalSaveFailed(true);
      // Keep the draft in place while React Query exposes the mutation error state.
    }
  }, [draft, props, touchedFields]);

  return (
    <DiveSummaryCard accent="primary">
      <ScreenBackButton
        testID="log-entry-editor-back"
        accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        onPress={props.onCancel}
      />
      <DiveSummaryCard.Header
        eyebrow={t('logbook.editorEyebrow')}
        title={t(mode === 'edit' ? 'logbook.editorEditTitle' : 'logbook.editorTitle')}
        titleTestID="log-entry-editor-title"
      />
      <DiveSummaryCard.Body>
        {props.saveError || localSaveFailed ? (
          <Text
            testID="log-entry-editor-error"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            children={t('logbook.saveError')}
          />
        ) : null}
        <EditorField label={t('logbook.startedAt')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-started-at"
              value={draft.startedAt}
              onChangeText={value => setValue('startedAt', value)}
              placeholder={t('logbook.startedAtPlaceholder')}
            />
          </Input>
        </EditorField>
        <EditorField label={t('logbook.diveMode')}>
          <HStack space="xs" className="rounded-full bg-muted p-1">
            {diveModes.map(diveMode => (
              <SelectorPill
                key={diveMode}
                testID={`log-entry-editor-mode-${diveMode}`}
                className="flex-1"
                label={t(`diveModes.${diveMode}`)}
                selected={draft.diveMode === diveMode}
                onPress={() => setValue('diveMode', diveMode)}
              />
            ))}
          </HStack>
        </EditorField>
        <EditorField label={t('logbook.entryStyle', { defaultValue: 'Entry style' })}>
          <HStack space="xs" className="rounded-full bg-muted p-1">
            {entryStyles.map(entryStyle => (
              <SelectorPill
                key={entryStyle}
                testID={`log-entry-editor-entry-style-${entryStyle}`}
                className="flex-1"
                label={t(`entryStyles.${entryStyle}`, { defaultValue: entryStyle })}
                selected={draft.entryStyle === entryStyle}
                onPress={() => setValue('entryStyle', entryStyle)}
              />
            ))}
          </HStack>
        </EditorField>
        <EditorField label={t('logbook.siteName')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-site-name"
              value={draft.siteName}
              onChangeText={value => setValue('siteName', value)}
              placeholder={t('logbook.siteNamePlaceholder')}
            />
          </Input>
        </EditorField>
        <HStack space="md">
          <EditorField className="flex-1" label={t('logbook.durationMinutes')}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="log-entry-editor-duration"
                value={draft.duration}
                onChangeText={value => setValue('duration', value)}
                keyboardType="numeric"
                placeholder="47"
              />
            </Input>
          </EditorField>
          <EditorField className="flex-1" label={t('logbook.maxDepthMeters')}>
            <Input className="h-11 rounded-xl bg-background">
              <InputField
                testID="log-entry-editor-max-depth"
                value={draft.maxDepth}
                onChangeText={value => setValue('maxDepth', value)}
                keyboardType="numeric"
                placeholder="18.6"
              />
            </Input>
          </EditorField>
        </HStack>
        <ModeSpecificFields draft={draft} diveMode={activeDiveMode} setValue={setValue} />
        <EditorField label={t('logbook.buddyNames')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-buddies"
              value={draft.buddies}
              onChangeText={value => setValue('buddies', value)}
              placeholder={t('logbook.commaSeparatedPlaceholder')}
            />
          </Input>
        </EditorField>
        <EditorField label={t('logbook.tags')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-tags"
              value={draft.tags}
              onChangeText={value => setValue('tags', value)}
              placeholder={t('logbook.commaSeparatedPlaceholder')}
            />
          </Input>
        </EditorField>
        <EditorField label={t('logbook.observedMarineLife')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-marine-life"
              value={draft.observedMarineLife}
              onChangeText={value => setValue('observedMarineLife', value)}
              placeholder={t('logbook.commaSeparatedPlaceholder')}
            />
          </Input>
        </EditorField>
        <EditorField label={t('logbook.notes')}>
          <Textarea className="rounded-xl bg-background">
            <TextareaInput
              testID="log-entry-editor-notes"
              value={draft.notes}
              onChangeText={value => setValue('notes', value)}
              placeholder={t('logbook.notesPlaceholder')}
            />
          </Textarea>
        </EditorField>
        <EditorField label={t('logbook.rating')}>
          <Input className="h-11 rounded-xl bg-background">
            <InputField
              testID="log-entry-editor-rating"
              value={draft.rating}
              onChangeText={value => setValue('rating', value)}
              keyboardType="numeric"
              placeholder="5"
            />
          </Input>
        </EditorField>
      </DiveSummaryCard.Body>
      <DiveSummaryCard.Footer>
        <HStack space="sm">
          <InstrumentButton className="flex-1" label={t('logbook.cancel')} onPress={props.onCancel} />
          <InstrumentButton
            testID="log-entry-editor-save"
            className="flex-1"
            label={props.isSaving ? t('logbook.saving') : t(mode === 'edit' ? 'logbook.saveChanges' : 'logbook.saveManualLog')}
            variant="primary"
            onPress={save}
            disabled={props.isSaving}
          />
        </HStack>
      </DiveSummaryCard.Footer>
    </DiveSummaryCard>
  );
}

function entryToEditorState(entry: DiveLogEntry): LogEntryEditorState {
  return {
    startedAt: formatEditorDate(getEditorStartedAt(entry)),
    diveMode: entry.manual.measuredValues.diveMode ?? 'scuba',
    entryStyle: entry.manual.entryStyle ?? '',
    siteName: entry.manual.site.name ?? '',
    duration: secondsToMinutesText(getEditorNumber(entry, 'durationSeconds')),
    maxDepth: numberToText(getEditorNumber(entry, 'maxDepthMeters')),
    gasLabel: entry.manual.measuredValues.gasLabel ?? '',
    gearIds: entry.manual.gearIds.join(', '),
    waterCondition: entry.manual.measuredValues.waterCondition ?? '',
    visibilityRating: numberToText(entry.manual.measuredValues.visibilityRating),
    perceivedExertion: numberToText(entry.manual.measuredValues.perceivedExertion),
    repetitionCount: numberToText(entry.manual.measuredValues.repetitionCount),
    trainingFocus: entry.manual.measuredValues.trainingFocus ?? '',
    buddies: entry.manual.buddyIds.join(', '),
    tags: entry.manual.tags.join(', '),
    observedMarineLife: entry.manual.observedMarineLife.join(', '),
    notes: entry.manual.notes ?? '',
    rating: numberToText(entry.manual.rating),
  };
}

function editorStateToEntry(entry: DiveLogEntry, draft: LogEntryEditorState, touchedFields: TouchedEditorFields): DiveLogEntry {
  const diveMode = draft.diveMode ?? 'scuba';
  const measuredValues: DiveLogManualMeasuredValues = {
    averageDepthMeters: entry.manual.measuredValues.averageDepthMeters,
    endedAt: entry.manual.measuredValues.endedAt,
    waterTemperatureCelsius: entry.manual.measuredValues.waterTemperatureCelsius,
    diveMode,
  };
  const provenance: DiveLogFieldProvenance = {
    ...entry.provenance,
    site: 'manual',
    buddyIds: 'manual',
    gearIds: 'manual',
    tags: 'manual',
    observedMarineLife: 'manual',
    notes: 'manual',
    rating: 'manual',
    measuredValues: 'manual',
  };

  applyStartedAtValue(entry, measuredValues, provenance, draft, touchedFields);
  applyEditableNumberValue(entry, measuredValues, provenance, {
    field: 'durationSeconds',
    draftKey: 'duration',
    value: minutesTextToSeconds(draft.duration),
    touchedFields,
    visible: true,
  });
  applyEditableNumberValue(entry, measuredValues, provenance, {
    field: 'maxDepthMeters',
    draftKey: 'maxDepth',
    value: textToNonNegativeNumber(draft.maxDepth),
    touchedFields,
    visible: true,
  });
  applyModeSpecificValues(entry, measuredValues, provenance, draft, diveMode, touchedFields);

  return {
    ...entry,
    source: entry.watchCapture ? 'watch' : 'manual',
    syncStatus: entry.watchCapture ? 'pending' : 'localOnly',
    updatedAt: Date.now() / 1000,
    manual: {
      ...entry.manual,
      site: {
        ...entry.manual.site,
        name: emptyToUndefined(draft.siteName),
      },
      entryStyle: draft.entryStyle || undefined,
      buddyIds: splitCommaList(draft.buddies),
      gearIds: diveMode === 'scuba' ? splitCommaList(draft.gearIds) : [],
      tags: splitCommaList(draft.tags),
      observedMarineLife: splitCommaList(draft.observedMarineLife),
      notes: emptyToUndefined(draft.notes),
      rating: textToRating(draft.rating),
      measuredValues,
    },
    provenance,
  };
}

function getEditorStartedAt(entry: DiveLogEntry): number {
  if (entry.provenance.startedAt === 'manual' && entry.manual.measuredValues.startedAt !== undefined) {
    return entry.manual.measuredValues.startedAt;
  }

  return entry.watchCapture?.measuredValues.startedAt ?? entry.manual.measuredValues.startedAt ?? entry.createdAt;
}

function getEditorNumber(entry: DiveLogEntry, field: 'durationSeconds' | 'maxDepthMeters'): number | undefined {
  const manualValue = entry.manual.measuredValues[field];

  if (entry.provenance[field] === 'manual' && manualValue !== undefined) {
    return manualValue;
  }

  return entry.watchCapture?.measuredValues[field] ?? manualValue;
}

function applyStartedAtValue(
  entry: DiveLogEntry,
  measuredValues: DiveLogManualMeasuredValues,
  provenance: DiveLogFieldProvenance,
  draft: LogEntryEditorState,
  touchedFields: TouchedEditorFields,
): void {
  const parsedStartedAt = parseEditorDate(draft.startedAt);

  if (!entry.watchCapture) {
    measuredValues.startedAt = parsedStartedAt ?? entry.manual.measuredValues.startedAt ?? entry.createdAt;
    provenance.startedAt = 'manual';
    return;
  }

  if (touchedFields.has('startedAt')) {
    if (parsedStartedAt !== undefined) {
      measuredValues.startedAt = parsedStartedAt;
      provenance.startedAt = 'manual';
    } else {
      provenance.startedAt = 'watch';
    }
    return;
  }

  if (entry.provenance.startedAt === 'manual' && entry.manual.measuredValues.startedAt !== undefined) {
    measuredValues.startedAt = entry.manual.measuredValues.startedAt;
    provenance.startedAt = 'manual';
    return;
  }

  provenance.startedAt = 'watch';
}

function applyEditableNumberValue(
  entry: DiveLogEntry,
  measuredValues: DiveLogManualMeasuredValues,
  provenance: DiveLogFieldProvenance,
  options: {
    field: 'durationSeconds' | 'maxDepthMeters';
    draftKey: keyof LogEntryEditorState;
    value: number | undefined;
    touchedFields: TouchedEditorFields;
    visible: boolean;
  },
): void {
  if (!options.visible) {
    setWatchFallbackProvenance(entry, provenance, options.field);
    return;
  }

  if (!entry.watchCapture) {
    measuredValues[options.field] = options.value;
    provenance[options.field] = 'manual';
    return;
  }

  if (options.touchedFields.has(options.draftKey)) {
    if (options.value !== undefined) {
      measuredValues[options.field] = options.value;
      provenance[options.field] = 'manual';
    } else {
      setWatchFallbackProvenance(entry, provenance, options.field);
    }
    return;
  }

  const manualValue = entry.manual.measuredValues[options.field];

  if (entry.provenance[options.field] === 'manual' && manualValue !== undefined) {
    measuredValues[options.field] = manualValue;
    provenance[options.field] = 'manual';
    return;
  }

  setWatchFallbackProvenance(entry, provenance, options.field);
}

function setWatchFallbackProvenance(
  entry: DiveLogEntry,
  provenance: DiveLogFieldProvenance,
  field: 'durationSeconds' | 'maxDepthMeters',
): void {
  if (entry.watchCapture?.measuredValues[field] !== undefined) {
    provenance[field] = 'watch';
  } else {
    delete provenance[field];
  }
}

type ModeSpecificMeasuredField =
  | 'gasLabel'
  | 'perceivedExertion'
  | 'visibilityRating'
  | 'waterCondition'
  | 'repetitionCount'
  | 'trainingFocus';

function applyModeMeasuredValue<Field extends ModeSpecificMeasuredField>(
  entry: DiveLogEntry,
  measuredValues: DiveLogManualMeasuredValues,
  provenance: DiveLogFieldProvenance,
  touchedFields: TouchedEditorFields,
  field: Field,
  draftKey: keyof LogEntryEditorState,
  value: DiveLogManualMeasuredValues[Field],
): void {
  if (!entry.watchCapture || touchedFields.has(draftKey)) {
    measuredValues[field] = value;
    provenance[field] = 'manual';
    return;
  }

  const previousValue = entry.manual.measuredValues[field];

  if (previousValue !== undefined) {
    measuredValues[field] = previousValue;
  }
}

function applyModeSpecificValues(
  entry: DiveLogEntry,
  measuredValues: DiveLogManualMeasuredValues,
  provenance: DiveLogFieldProvenance,
  draft: LogEntryEditorState,
  diveMode: NonNullable<WatchSession['diveMode']>,
  touchedFields: TouchedEditorFields,
): void {
  if (diveMode === 'scuba') {
    applyModeMeasuredValue(entry, measuredValues, provenance, touchedFields, 'gasLabel', 'gasLabel', emptyToUndefined(draft.gasLabel));
    applyModeMeasuredValue(
      entry,
      measuredValues,
      provenance,
      touchedFields,
      'waterCondition',
      'waterCondition',
      textToWaterCondition(draft.waterCondition),
    );
    applyModeMeasuredValue(
      entry,
      measuredValues,
      provenance,
      touchedFields,
      'visibilityRating',
      'visibilityRating',
      textToRating(draft.visibilityRating),
    );
    applyModeMeasuredValue(
      entry,
      measuredValues,
      provenance,
      touchedFields,
      'perceivedExertion',
      'perceivedExertion',
      textToRating(draft.perceivedExertion),
    );
  }

  if (diveMode === 'freedive') {
    applyModeMeasuredValue(
      entry,
      measuredValues,
      provenance,
      touchedFields,
      'repetitionCount',
      'repetitionCount',
      textToNonNegativeInteger(draft.repetitionCount),
    );
    applyModeMeasuredValue(
      entry,
      measuredValues,
      provenance,
      touchedFields,
      'trainingFocus',
      'trainingFocus',
      emptyToUndefined(draft.trainingFocus),
    );
    applyModeMeasuredValue(
      entry,
      measuredValues,
      provenance,
      touchedFields,
      'perceivedExertion',
      'perceivedExertion',
      textToRating(draft.perceivedExertion),
    );
  }

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
  return waterConditions.find(condition => condition === normalizedValue);
}

function minutesTextToSeconds(value: string): number | undefined {
  const minutes = textToNonNegativeNumber(value);
  return minutes === undefined ? undefined : Math.round(minutes * 60);
}

function secondsToMinutesText(value: number | undefined): string {
  return value === undefined ? '' : `${Math.round(value / 60)}`;
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
