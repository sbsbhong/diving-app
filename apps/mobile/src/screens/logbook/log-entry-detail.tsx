import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, StatusPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import { SessionProfile } from '../../components/ui/session-profile';
import type { DiveFieldSource, DiveLogEntry } from '../../types/dive-log-entry';
import {
  formatDate,
  formatDepth,
  formatDuration,
  formatRating,
  formatTemperature,
} from '../../utils/dive-formatters';

type LogEntryDetailProps = {
  entry: DiveLogEntry;
  onBack?: () => void;
  onDelete?: (localId: string) => Promise<void>;
};

export function LogEntryDetail(props: LogEntryDetailProps): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const summary = getEntrySummary(props.entry);
  const tags = props.entry.manual.tags.length ? props.entry.manual.tags.join(', ') : t('logbook.none');
  const buddies = props.entry.manual.buddyIds.length ? props.entry.manual.buddyIds.join(', ') : t('logbook.none');
  const marineLife = props.entry.manual.observedMarineLife.length ? props.entry.manual.observedMarineLife.join(', ') : t('logbook.none');
  const sourceLabel = props.entry.source === 'watch' ? t('logbook.watchCaptured') : t('logbook.manualValue');

  return (
    <DiveSummaryCard accent="primary">
      <DiveSummaryCard.Header
        eyebrow={sourceLabel}
        title={props.entry.manual.site.name ?? t('logbook.detailTitle')}
        right={<StatusPill label={props.entry.source === 'watch' ? t('logbook.watchSource') : t('logbook.manualSource')} tone="secondary" />}
      />
      <DiveSummaryCard.Body>
        <Text className="text-sm leading-5 text-muted-foreground">
          {formatDate(summary.startedAt, locale, t('formatters.unknownDate'))}
        </Text>
        <HStack space="md">
          <DetailMetric
            label={t('logbook.maxDepth')}
            value={formatDepth(summary.maxDepthMeters)}
            source={measurementSource(props.entry, 'maxDepthMeters')}
            testID="log-entry-detail-provenance-max-depth"
          />
          <DetailMetric
            label={t('logbook.avgDepth')}
            value={formatDepth(summary.averageDepthMeters)}
            source={measurementSource(props.entry, 'averageDepthMeters')}
          />
        </HStack>
        <HStack space="md">
          <DetailMetric
            label={t('logbook.waterTemp')}
            value={formatTemperature(summary.waterTemperatureCelsius)}
            source={measurementSource(props.entry, 'waterTemperatureCelsius')}
          />
          <DetailMetric
            label={t('logbook.duration')}
            value={formatDuration(summary.durationSeconds)}
            source={measurementSource(props.entry, 'durationSeconds')}
          />
        </HStack>
        {props.entry.watchCapture?.samples.length ? (
          <>
            <SessionProfile samples={props.entry.watchCapture.samples} kind="depth" title={t('logbook.depthProfile')} />
            <SessionProfile samples={props.entry.watchCapture.samples} kind="temperature" title={t('logbook.temperatureProfile')} />
          </>
        ) : null}
      </DiveSummaryCard.Body>
      <DiveSummaryCard.Footer>
        <VStack space="sm">
          <Text className="text-sm leading-5 text-card-foreground">{props.entry.manual.notes ?? t('logbook.noNotes')}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            {t('logbook.buddyNames')}: {buddies}
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            {t('logbook.tags')}: {tags}
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            {t('logbook.observedMarineLife')}: {marineLife}
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            {t('logbook.rating')}: {formatRating(props.entry.manual.rating, t('formatters.notRated'))}
          </Text>
          {props.onBack ? <InstrumentButton testID="log-entry-detail-back" label={t('logbook.backToList')} onPress={props.onBack} /> : null}
          {props.onDelete ? (
            <InstrumentButton
              label={t('logbook.deleteLog')}
              variant="danger"
              onPress={() => props.onDelete?.(props.entry.localId)}
            />
          ) : null}
        </VStack>
      </DiveSummaryCard.Footer>
    </DiveSummaryCard>
  );
}

function DetailMetric(props: { label: string; value: string; source: DiveFieldSource; testID?: string }): React.JSX.Element {
  const { t } = useTranslation();
  const sourceLabel = props.source === 'watch' ? t('logbook.watchCaptured') : t('logbook.manualValue');
  const testID = props.testID ? `${props.testID}-${props.source}` : undefined;

  return (
    <VStack testID={testID} space="xs" className="flex-1 rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-lg font-semibold text-foreground">{props.value}</Text>
      <ProvenanceLabel provenanceLabel={sourceLabel} />
    </VStack>
  );
}

function ProvenanceLabel(props: { provenanceLabel: string }): React.JSX.Element {
  return (
    <Text accessibilityLabel={props.provenanceLabel} className="text-xs font-semibold uppercase text-muted-foreground">
      {props.provenanceLabel}
    </Text>
  );
}

function getEntrySummary(entry: DiveLogEntry) {
  if (entry.watchCapture) {
    return entry.watchCapture.measuredValues;
  }

  return {
    startedAt: entry.manual.measuredValues.startedAt ?? entry.createdAt,
    endedAt: entry.manual.measuredValues.endedAt,
    durationSeconds: entry.manual.measuredValues.durationSeconds ?? 0,
    maxDepthMeters: entry.manual.measuredValues.maxDepthMeters ?? 0,
    averageDepthMeters: entry.manual.measuredValues.averageDepthMeters ?? 0,
    waterTemperatureCelsius: entry.manual.measuredValues.waterTemperatureCelsius,
  };
}

function measurementSource(
  entry: DiveLogEntry,
  field: 'durationSeconds' | 'maxDepthMeters' | 'averageDepthMeters' | 'waterTemperatureCelsius',
): DiveFieldSource {
  return entry.provenance[field] ?? (entry.watchCapture ? 'watch' : 'manual');
}
