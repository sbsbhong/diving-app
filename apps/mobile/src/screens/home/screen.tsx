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
import { formatDate, formatDepth, formatDuration } from '../../utils/dive-formatters';
import { summarizeSession } from '../../utils/session-summary';

type HomeScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
  onOpenPlanning: () => void;
};

export default function HomeScreen(props: HomeScreenProps): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const recentSession = props.sessions[0];
  const recentSummary = recentSession ? summarizeSession(recentSession) : undefined;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const syncStatus = recentSession?.syncStatus ?? 'pending';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack space="lg">
        <VStack space="md" className="pt-2">
          <StatusPill label={t('status.watchAssistant')} />
          <Text className="text-4xl font-semibold leading-10 text-foreground">DiveMobile</Text>
          <Text className="text-base leading-6 text-muted-foreground">{t('home.subtitle')}</Text>
          <HStack space="xs" className="items-baseline">
            <Text className="text-2xl font-semibold text-primary">{props.sessions.length}</Text>
            <Text className="text-sm font-semibold text-muted-foreground">{t('home.logsImported')}</Text>
          </HStack>
        </VStack>

        <DiveSummaryCard>
          <DiveSummaryCard.Header
            eyebrow={t('home.latestWatchImport')}
            title={recentSession?.siteName ?? t('home.importWatchDive')}
            right={<StatusPill label={t(`status.${syncStatus}`, { defaultValue: syncStatus })} tone="secondary" />}
          />
          <DiveSummaryCard.Body>
            <DiveSummaryCard.Metric
              label={t('home.date')}
              value={formatDate(recentSession?.startedAt, locale, t('formatters.unknownDate'))}
            />
            <SessionProfile samples={recentSession?.samples ?? []} kind="depth" title={t('home.depthProfile')} />
            <HStack space="md">
              <MetricTile label={t('home.maxDepth')} value={formatDepth(recentSummary?.maxDepthMeters)} />
              <MetricTile label={t('home.bottomTime')} value={formatDuration(recentSummary?.durationSeconds ?? 0)} />
            </HStack>
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard>
          <HStack space="md" className="items-center">
            <AssistantMark />
            <VStack space="xs" className="flex-1">
              <Text className="text-base font-semibold text-card-foreground">{t('home.assistantSteady')}</Text>
              <Text className="text-sm leading-5 text-muted-foreground">{t('home.reminderReview')}</Text>
            </VStack>
          </HStack>
          <DiveSummaryCard.Metric label={t('home.ascent')} value={t('home.reviewOnly')} />
          <DiveSummaryCard.Metric label={t('home.safetyStop')} value={t('home.planningReminder')} />
        </DiveSummaryCard>

        <VStack space="md">
          <InstrumentButton label={t('home.openLogbook')} variant="primary" onPress={props.onOpenLogbook} />
          <InstrumentButton label={t('home.planNextDive')} onPress={props.onOpenPlanning} />
        </VStack>

        <SafetyText>{t('home.safetyText')}</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function MetricTile(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack space="xs" className="flex-1 rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-2xl font-semibold text-card-foreground">{props.value}</Text>
    </VStack>
  );
}

function AssistantMark(): React.JSX.Element {
  return (
    <VStack className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
      <Text className="text-lg font-semibold text-primary">OK</Text>
    </VStack>
  );
}
