import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, SelectorPill, StatusPill } from '../../components/ui/instrument';
import { Box } from '../../components/ui/box';
import { HStack } from '../../components/ui/hstack';
import { Input, InputField } from '../../components/ui/input';
import { Pressable } from '../../components/ui/pressable';
import { ScrollView } from '../../components/ui/scroll-view';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import type { InstrumentTone } from '../../components/ui/theme';
import type { DiveLogEntry } from '../../types/dive-log-entry';
import type { DiveSessionFilter } from '../../types/dive-session';
import { createBlankDiveLogEntry } from '../../utils/create-dive-log-entry';
import { formatDate, formatDepth, formatDuration } from '../../utils/dive-formatters';
import { diveLogEntryToMobileSession } from '../../states/use-dive-logbook';
import { LogEntryDetail } from './log-entry-detail';
import { LogEntryEditor } from './log-entry-editor';

type LogbookScreenProps = {
  entries: DiveLogEntry[];
  filter: DiveSessionFilter;
  onFilterChange: (filter: DiveSessionFilter) => void;
  onImportFixtures: () => void;
  onSaveEntry: (entry: DiveLogEntry) => Promise<DiveLogEntry>;
  onDeleteEntry: (localId: string) => Promise<void>;
  saveError?: Error | null;
  isSaving?: boolean;
};

type SyncFilter = 'all' | 'synced' | 'pending';
type LocalRoute = 'list' | 'create' | 'detail' | 'edit';

export default function LogbookScreen(props: LogbookScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [syncFilter, setSyncFilter] = React.useState<SyncFilter>('all');
  const [route, setRoute] = React.useState<LocalRoute>('list');
  const [draftEntry, setDraftEntry] = React.useState<DiveLogEntry | undefined>();
  const visibleEntries = React.useMemo(() => {
    if (syncFilter === 'all') {
      return props.entries;
    }

    return props.entries.filter(entry => toVisibleSyncStatus(entry.syncStatus) === syncFilter);
  }, [props.entries, syncFilter]);
  const [selectedId, setSelectedId] = React.useState(visibleEntries[0]?.localId);
  const selectedEntry = visibleEntries.find(entry => entry.localId === selectedId);

  React.useEffect(() => {
    if (selectedEntry) {
      return;
    }

    if (visibleEntries[0]) {
      setSelectedId(visibleEntries[0].localId);
    }

    if (route === 'detail') {
      setRoute('list');
    }
  }, [route, selectedEntry, visibleEntries]);

  const openCreate = React.useCallback(() => {
    setDraftEntry(createBlankDiveLogEntry());
    setRoute('create');
  }, []);

  const openEdit = React.useCallback((entry: DiveLogEntry) => {
    setDraftEntry(entry);
    setRoute('edit');
  }, []);

  const saveDraft = React.useCallback(
    async (entry: DiveLogEntry) => {
      const savedEntry = await props.onSaveEntry(entry);
      setSelectedId(savedEntry.localId);
      setDraftEntry(undefined);
      setRoute('list');
      return savedEntry;
    },
    [props],
  );

  const deleteEntry = React.useCallback(
    async (localId: string) => {
      await props.onDeleteEntry(localId);
      setRoute('list');
    },
    [props],
  );

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack space="lg">
        <VStack space="md">
          <HStack className="items-center justify-between">
            <VStack space="xs" className="flex-1">
              <Text className="text-xs font-semibold uppercase text-muted-foreground">{t('logbook.reviewEyebrow')}</Text>
              <Text className="text-3xl font-semibold leading-9 text-foreground">{t('logbook.title')}</Text>
            </VStack>
            <HStack space="sm">
              <InstrumentButton
                testID="logbook-create-action"
                label={t('logbook.createManual')}
                variant="primary"
                onPress={openCreate}
                className="min-h-10 px-4 py-2"
              />
              <InstrumentButton label={t('logbook.import')} onPress={props.onImportFixtures} className="min-h-10 px-4 py-2" />
            </HStack>
          </HStack>
          <VStack space="md" className="rounded-2xl bg-card px-4 py-4">
            <Input className="h-11 rounded-full border-0 bg-muted px-5 shadow-none">
              <InputField
                testID="logbook-search-input"
                placeholder={t('logbook.searchPlaceholder')}
                value={props.filter.query}
                onChangeText={query => props.onFilterChange({ ...props.filter, query })}
                className="px-0 py-0 text-base font-normal"
              />
            </Input>
            <HStack space="xs" className="rounded-full bg-muted p-1">
              <SelectorPill className="flex-1" label={t('logbook.all')} selected={syncFilter === 'all'} onPress={() => setSyncFilter('all')} />
              <SelectorPill
                className="flex-1"
                label={t('logbook.synced')}
                selected={syncFilter === 'synced'}
                onPress={() => setSyncFilter('synced')}
              />
              <SelectorPill
                className="flex-1"
                label={t('logbook.pending')}
                selected={syncFilter === 'pending'}
                onPress={() => setSyncFilter('pending')}
              />
            </HStack>
          </VStack>
        </VStack>

        {(route === 'create' || route === 'edit') && draftEntry ? (
          <LogEntryEditor
            entry={draftEntry}
            mode={route === 'edit' ? 'edit' : 'create'}
            isSaving={props.isSaving}
            saveError={props.saveError}
            onCancel={() => setRoute(route === 'edit' ? 'detail' : 'list')}
            onSave={saveDraft}
          />
        ) : null}

        {route === 'detail' && selectedEntry ? (
          <LogEntryDetail entry={selectedEntry} onBack={() => setRoute('list')} onEdit={openEdit} onDelete={deleteEntry} />
        ) : null}

        {route === 'list' ? (
          visibleEntries.length === 0 ? (
            <EmptyLogbook />
          ) : (
            <VStack space="md">
              {visibleEntries.map(entry => (
                <SessionListItem
                  key={entry.localId}
                  entry={entry}
                  selected={entry.localId === selectedEntry?.localId}
                  onPress={() => {
                    setSelectedId(entry.localId);
                    setRoute('detail');
                  }}
                />
              ))}
            </VStack>
          )
        ) : null}

        <SafetyText>{t('logbook.safetyText')}</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function EmptyLogbook(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DiveSummaryCard>
      <VStack testID="logbook-empty-state" space="lg">
        <DiveSummaryCard.Header eyebrow={t('logbook.emptyEyebrow')} title={t('logbook.noImportedDives')} />
        <DiveSummaryCard.Footer>
          <Text className="text-sm leading-5 text-muted-foreground">{t('logbook.emptyBody')}</Text>
        </DiveSummaryCard.Footer>
      </VStack>
    </DiveSummaryCard>
  );
}

function SessionListItem(props: {
  entry: DiveLogEntry;
  selected: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const session = diveLogEntryToMobileSession(props.entry);
  const listMetrics = getListMetrics(props.entry);
  const status = toVisibleSyncStatus(props.entry.syncStatus);
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const tags = session.tags?.length ? session.tags.join(', ') : t('logbook.noTags');
  const siteName = session.siteName ?? t('logbook.untitledDive');
  const maxDepthLabel = formatDepth(listMetrics.maxDepthMeters);
  const durationLabel = formatListDuration(listMetrics.durationSeconds);

  return (
    <Pressable
      testID={`logbook-list-item-${siteName}`}
      onPress={props.onPress}
      className="rounded-2xl bg-card px-4 py-4"
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      <VStack space="sm">
        <HStack className="items-center justify-between">
          <HStack space="md" className="flex-1 items-center pr-2.5">
            <Box className={`h-2 w-2 rounded-full ${props.selected ? 'bg-primary' : 'bg-muted'}`} />
            <VStack space="xs" className="flex-1">
              <Text className="text-lg font-semibold text-card-foreground">{siteName}</Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                {formatDate(session.startedAt, locale, t('formatters.unknownDate'))}
              </Text>
            </VStack>
          </HStack>
          <VStack space="xs" className="items-end">
            <StatusPill label={t(`status.${status}`, { defaultValue: status })} tone={syncStatusTone(status)} />
            <Text testID={`logbook-list-max-depth-${siteName}-${toTestIdValue(maxDepthLabel)}`} className="text-lg font-semibold text-card-foreground">
              {maxDepthLabel}
            </Text>
          </VStack>
        </HStack>
        <Text className="pl-5 text-sm leading-5 text-muted-foreground">
          {t(`diveModes.${session.diveMode ?? 'unknown'}`, { defaultValue: session.diveMode ?? t('diveModes.unknown') })} ·{' '}
          <Text testID={`logbook-list-duration-${siteName}-${toTestIdValue(durationLabel)}`}>{durationLabel}</Text> · {tags}
        </Text>
      </VStack>
    </Pressable>
  );
}

function getListMetrics(entry: DiveLogEntry): { durationSeconds?: number; maxDepthMeters?: number } {
  if (entry.watchCapture) {
    return {
      durationSeconds: entry.watchCapture.measuredValues.durationSeconds,
      maxDepthMeters: entry.watchCapture.measuredValues.maxDepthMeters,
    };
  }

  return {
    durationSeconds: entry.manual.measuredValues.durationSeconds,
    maxDepthMeters: entry.manual.measuredValues.maxDepthMeters,
  };
}

function formatListDuration(seconds: number | undefined): string {
  return seconds === undefined ? '--:--' : formatDuration(seconds);
}

function toTestIdValue(value: string): string {
  return value.replace(/\s+/g, '');
}

const syncStatusTone = (status: string): InstrumentTone => {
  if (status === 'synced') {
    return 'primary';
  }

  if (status === 'failed') {
    return 'danger';
  }

  return 'secondary';
};

const toVisibleSyncStatus = (syncStatus: DiveLogEntry['syncStatus']): 'synced' | 'pending' | 'failed' => {
  if (syncStatus === 'synced' || syncStatus === 'failed') {
    return syncStatus;
  }

  return 'pending';
};
