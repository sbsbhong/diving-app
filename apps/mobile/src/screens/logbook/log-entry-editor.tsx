import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SelectorPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { Input, InputField } from '../../components/ui/input';
import { Text } from '../../components/ui/text';
import { Textarea, TextareaInput } from '../../components/ui/textarea';
import { VStack } from '../../components/ui/vstack';
import type { DiveLogEntry, DiveLogManualMeasuredValues } from '../../types/dive-log-entry';
import type { WatchSession } from '../../types/dive-session';

type LogEntryEditorProps = {
  entry: DiveLogEntry;
  isSaving?: boolean;
  saveError?: Error | null;
  onCancel: () => void;
  onSave: (entry: DiveLogEntry) => Promise<DiveLogEntry>;
};

type EditorState = {
  startedAt: string;
  diveMode: WatchSession['diveMode'] | undefined;
  siteName: string;
  duration: string;
  maxDepth: string;
  buddies: string;
  tags: string;
  observedMarineLife: string;
  notes: string;
  rating: string;
};

const diveModes: NonNullable<WatchSession['diveMode']>[] = ['scuba', 'freedive', 'snorkel', 'pool'];

export function LogEntryEditor(props: LogEntryEditorProps): React.JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = React.useState<EditorState>(() => entryToEditorState(props.entry));
  const [localSaveFailed, setLocalSaveFailed] = React.useState(false);

  const setValue = React.useCallback((key: keyof EditorState, value: string) => {
    setDraft(currentDraft => ({ ...currentDraft, [key]: value }));
  }, []);

  const save = React.useCallback(async () => {
    setLocalSaveFailed(false);
    try {
      await props.onSave(editorStateToEntry(props.entry, draft));
    } catch {
      setLocalSaveFailed(true);
      // Keep the draft in place while React Query exposes the mutation error state.
    }
  }, [draft, props]);

  return (
    <DiveSummaryCard accent="primary">
      <DiveSummaryCard.Header eyebrow={t('logbook.editorEyebrow')} title={t('logbook.editorTitle')} />
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
                onPress={() => setDraft(currentDraft => ({ ...currentDraft, diveMode }))}
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
            label={props.isSaving ? t('logbook.saving') : t('logbook.saveManualLog')}
            variant="primary"
            onPress={save}
            disabled={props.isSaving}
          />
        </HStack>
      </DiveSummaryCard.Footer>
    </DiveSummaryCard>
  );
}

function EditorField(props: { label: string; children: React.ReactNode; className?: string }): React.JSX.Element {
  return (
    <VStack space="xs" className={props.className}>
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      {props.children}
    </VStack>
  );
}

function entryToEditorState(entry: DiveLogEntry): EditorState {
  return {
    startedAt: formatEditorDate(entry.manual.measuredValues.startedAt ?? entry.createdAt),
    diveMode: entry.manual.measuredValues.diveMode,
    siteName: entry.manual.site.name ?? '',
    duration: secondsToMinutesText(entry.manual.measuredValues.durationSeconds),
    maxDepth: numberToText(entry.manual.measuredValues.maxDepthMeters),
    buddies: entry.manual.buddyIds.join(', '),
    tags: entry.manual.tags.join(', '),
    observedMarineLife: entry.manual.observedMarineLife.join(', '),
    notes: entry.manual.notes ?? '',
    rating: numberToText(entry.manual.rating),
  };
}

function editorStateToEntry(entry: DiveLogEntry, draft: EditorState): DiveLogEntry {
  const measuredValues: DiveLogManualMeasuredValues = {
    ...entry.manual.measuredValues,
    startedAt: parseEditorDate(draft.startedAt) ?? entry.manual.measuredValues.startedAt ?? entry.createdAt,
    durationSeconds: minutesTextToSeconds(draft.duration),
    maxDepthMeters: textToNumber(draft.maxDepth),
    diveMode: draft.diveMode,
  };

  return {
    ...entry,
    source: 'manual',
    syncStatus: 'localOnly',
    updatedAt: Date.now() / 1000,
    manual: {
      ...entry.manual,
      site: {
        ...entry.manual.site,
        name: emptyToUndefined(draft.siteName),
      },
      buddyIds: splitCommaList(draft.buddies),
      tags: splitCommaList(draft.tags),
      observedMarineLife: splitCommaList(draft.observedMarineLife),
      notes: emptyToUndefined(draft.notes),
      rating: textToNumber(draft.rating),
      measuredValues,
    },
    provenance: {
      ...entry.provenance,
      site: 'manual',
      buddyIds: 'manual',
      tags: 'manual',
      observedMarineLife: 'manual',
      notes: 'manual',
      rating: 'manual',
      measuredValues: 'manual',
      startedAt: 'manual',
      durationSeconds: 'manual',
      maxDepthMeters: 'manual',
    },
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
  const parsedValue = Number(value.trim());
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function minutesTextToSeconds(value: string): number | undefined {
  const minutes = textToNumber(value);
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
