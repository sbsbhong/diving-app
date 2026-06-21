import React from 'react';
import { useTranslation } from 'react-i18next';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { ScrollView } from '../../components/ui/scroll-view';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import { SessionProfile } from '../../components/ui/session-profile';
import type { MobileDiveSession } from '../../types/dive-session';
import { formatDate, formatDepth, formatDuration, formatRating } from '../../utils/dive-formatters';
import { summarizeSession } from '../../utils/session-summary';

type MemoryScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
};

export default function MemoryScreen(props: MemoryScreenProps): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const session = props.sessions[0];
  const summary = session ? summarizeSession(session) : undefined;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const totalDuration = props.sessions.reduce((sum, currentSession) => {
    return sum + summarizeSession(currentSession).durationSeconds;
  }, 0);
  const averageMaxDepth =
    props.sessions.length === 0
      ? undefined
      : props.sessions.reduce((sum, currentSession) => {
          return sum + summarizeSession(currentSession).maxDepthMeters;
        }, 0) / props.sessions.length;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack space="lg">
        <VStack space="sm">
          <HStack className="items-center justify-between">
            <StatusPill label={t('status.memory')} />
            <StatusPill label={t('status.static')} tone="secondary" />
          </HStack>
          <Text className="text-3xl font-semibold text-foreground">{t('memory.title')}</Text>
          <Text className="text-sm leading-5 text-muted-foreground">{t('memory.subtitle')}</Text>
        </VStack>

        <DiveSummaryCard accent="primary">
          <DiveSummaryCard.Header
            eyebrow={t('memory.staticPreview')}
            title={session?.siteName ?? t('memory.importDive')}
            right={
              <Text className="text-sm font-semibold text-muted-foreground">
                {formatDate(session?.startedAt, locale, t('formatters.unknownDate'))}
              </Text>
            }
          />
          <DiveSummaryCard.Body>
            <HStack space="md">
              <ShareMetric label={t('memory.max')} value={formatDepth(summary?.maxDepthMeters)} />
              <ShareMetric label={t('memory.time')} value={formatDuration(summary?.durationSeconds ?? 0)} />
            </HStack>
            <SessionProfile samples={session?.samples ?? []} kind="depth" title={t('logbook.depthProfile')} />
            <HStack className="items-center justify-between">
              <Text className="text-sm font-semibold text-primary">{formatRating(session?.rating, t('formatters.notRated'))}</Text>
              <Text className="flex-1 text-right text-xs font-semibold leading-4 text-muted-foreground">
                {session?.tags?.join(' · ') ?? t('memory.fallbackTags')}
              </Text>
            </HStack>
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent="secondary">
          <DiveSummaryCard.Header eyebrow={t('memory.exportStatus')} title={t('memory.futureWorkflow')} />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label={t('memory.imageRender')} value={t('memory.placeholder')} />
            <DiveSummaryCard.Metric label={t('memory.socialSharing')} value={t('memory.separateSpec')} />
            <DiveSummaryCard.Metric
              label={t('memory.mediaWorkflow')}
              value={t('memory.placeholders', { count: session?.mediaPlaceholders.length ?? 0 })}
            />
            <DiveSummaryCard.Metric label={t('memory.colorCorrection')} value={t('memory.researchOnly')} />
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard accent="primary">
          <DiveSummaryCard.Header eyebrow={t('memory.safeAnalytics')} title={t('memory.reviewSummaries')} />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric label={t('memory.loggedDives')} value={`${props.sessions.length}`} />
            <DiveSummaryCard.Metric label={t('memory.totalBottomTime')} value={formatDuration(totalDuration)} />
            <DiveSummaryCard.Metric label={t('memory.avgMaxDepth')} value={formatDepth(averageMaxDepth)} />
            <DiveSummaryCard.Metric
              label={t('memory.favoriteMode')}
              value={
                session?.diveMode
                  ? t(`diveModes.${session.diveMode}`, { defaultValue: session.diveMode })
                  : t('memory.recreational')
              }
            />
          </DiveSummaryCard.Body>
          <DiveSummaryCard.Footer>
            <Text className="text-sm leading-5 text-muted-foreground">{t('memory.reviewOnlySummaries')}</Text>
          </DiveSummaryCard.Footer>
        </DiveSummaryCard>

        <VStack space="md">
          <InstrumentButton label={t('memory.savePreview')} variant="primary" onPress={() => undefined} />
          <InstrumentButton label={t('memory.openLogbook')} onPress={props.onOpenLogbook} />
        </VStack>

        <SafetyText>{t('memory.safetyText')}</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function ShareMetric(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack space="xs" className="flex-1 rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-2xl font-semibold text-foreground">{props.value}</Text>
    </VStack>
  );
}
