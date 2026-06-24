import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonText } from '../../components/ui/button';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { HStack } from '../../components/ui/hstack';
import { Menu, MenuItem, MenuItemLabel } from '../../components/ui/menu';
import { RefreshControl } from '../../components/ui/refresh-control';
import { ScrollView } from '../../components/ui/scroll-view';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import { SessionProfile } from '../../components/ui/session-profile';
import { supportedLanguages, type SupportedLanguage } from '../../i18n';
import { useAppPreferences } from '../../states/app-preferences';
import type { MobileDiveSession } from '../../types/dive-session';
import { formatDate, formatDepth, formatDuration } from '../../utils/dive-formatters';
import { getSessionDurationSeconds, getSessionMaxDepthMeters } from '../../utils/session-summary';

type HomeScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
  onOpenPlanning: () => void;
  onRefresh: () => void | Promise<void>;
  isRefreshing?: boolean;
  reselectToken?: number;
};

export default function HomeScreen(props: HomeScreenProps): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const recentSession = props.sessions[0];
  const recentMaxDepthMeters = recentSession ? getSessionMaxDepthMeters(recentSession) : undefined;
  const recentDurationSeconds = recentSession ? getSessionDurationSeconds(recentSession) : undefined;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const syncStatus = recentSession?.syncStatus ?? 'pending';
  const scrollViewRef = React.useRef<React.ComponentRef<typeof ScrollView>>(null);
  const previousReselectToken = React.useRef(props.reselectToken ?? 0);

  React.useEffect(() => {
    const reselectToken = props.reselectToken ?? 0;

    if (reselectToken === previousReselectToken.current) {
      return;
    }

    previousReselectToken.current = reselectToken;
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    void props.onRefresh();
  }, [props]);

  return (
    <ScrollView
      ref={scrollViewRef}
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pt-4 pb-6"
      refreshControl={<RefreshControl refreshing={Boolean(props.isRefreshing)} onRefresh={props.onRefresh} tintColor="#0a84ff" />}
      contentInsetAdjustmentBehavior="automatic">
      <VStack space="lg">
        <VStack space="md" className="pt-2">
          <HStack className="items-start justify-between">
            <StatusPill label={t('status.watchAssistant')} />
            <LanguageMenu />
          </HStack>
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
              <MetricTile label={t('home.maxDepth')} value={formatDepth(recentMaxDepthMeters)} />
              <MetricTile label={t('home.bottomTime')} value={formatOptionalDuration(recentDurationSeconds)} />
            </HStack>
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard>
          <HStack space="md" className="items-center">
            <AssistantMark label={t('home.reminderMark')} />
            <VStack space="xs" className="flex-1">
              <Text className="text-base font-semibold text-card-foreground">{t('home.watchReminderStatus')}</Text>
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

function LanguageMenu(): React.JSX.Element {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppPreferences();
  const [isOpen, setIsOpen] = React.useState(false);
  const activeLabel = getLanguageLabel(language, t);

  const handleSelectLanguage = React.useCallback(
    async (nextLanguage: SupportedLanguage) => {
      await setLanguage(nextLanguage);
      setIsOpen(false);
    },
    [setLanguage],
  );

  return (
    <Menu
      placement="bottom right"
      offset={4}
      closeOnSelect
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      trigger={({ ...triggerProps }) => (
        <Button
          {...triggerProps}
          testID="language-menu-trigger"
          accessibilityLabel={t(isOpen ? 'language.closeMenu' : 'language.openMenu')}
          variant="secondary"
          size="sm"
          className="rounded-full">
          <ButtonText className="text-sm font-semibold text-primary">{activeLabel}</ButtonText>
        </Button>
      )}>
      {supportedLanguages.map(option => {
        const isSelected = language === option;
        const optionLabel = getLanguageLabel(option, t);

        return (
          <MenuItem
            key={option}
            testID={`language-menu-option-${option}`}
            textValue={optionLabel}
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={t('language.switchTo', { language: optionLabel })}
            className={isSelected ? 'bg-primary' : 'bg-transparent'}
            onPress={() => handleSelectLanguage(option)}>
            <MenuItemLabel className={isSelected ? 'font-semibold text-primary-foreground' : 'font-semibold text-popover-foreground'}>
              {optionLabel}
            </MenuItemLabel>
          </MenuItem>
        );
      })}
    </Menu>
  );
}

function getLanguageLabel(language: SupportedLanguage, t: ReturnType<typeof useTranslation>['t']): string {
  return language === 'ko' ? t('settings.language.korean') : t('settings.language.english');
}

function MetricTile(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack space="xs" className="flex-1 rounded-2xl bg-muted px-4 py-4">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{props.label}</Text>
      <Text className="text-2xl font-semibold text-card-foreground">{props.value}</Text>
    </VStack>
  );
}

function formatOptionalDuration(seconds: number | undefined): string {
  return seconds === undefined ? '--:--' : formatDuration(seconds);
}

function AssistantMark(props: { label: string }): React.JSX.Element {
  return (
    <VStack className="h-14 w-14 items-center justify-center rounded-full bg-primary/10">
      <Text className="text-sm font-semibold text-primary">{props.label}</Text>
    </VStack>
  );
}
