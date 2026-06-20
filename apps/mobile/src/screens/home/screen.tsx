import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DiveSummaryCard } from '../../components/ui/dive-summary-card';
import { InstrumentButton, SafetyText, StatusPill } from '../../components/ui/instrument';
import { Box, HStack, Text, VStack } from '../../components/ui/primitives';
import { SessionProfile } from '../../components/ui/session-profile';
import { resolveSupportedLanguage, type SupportedLanguage } from '../../i18n';
import type { MobileDiveSession } from '../../types/dive-session';
import { formatDate, formatDepth, formatDuration } from '../../utils/dive-formatters';
import { summarizeSession } from '../../utils/session-summary';

type HomeScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
  onOpenPlanning: () => void;
  onOpenMemory: () => void;
};

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
] as const satisfies ReadonlyArray<{ code: SupportedLanguage; label: string }>;

const languageStyles = StyleSheet.create({
  mark: {
    paddingHorizontal: 6,
  },
  menu: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  option: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionPressed: {
    opacity: 0.68,
  },
  trigger: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerPressed: {
    transform: [{ scale: 0.96 }],
  },
});

export default function HomeScreen(props: HomeScreenProps): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const recentSession = props.sessions[0];
  const recentSummary = recentSession ? summarizeSession(recentSession) : undefined;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const syncStatus = recentSession?.syncStatus ?? 'pending';

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack gap={16}>
        <VStack gap={10} className="pt-2">
          <HStack className="items-start justify-between">
            <StatusPill label={t('status.watchAssistant')} />
            <LanguageMenu />
          </HStack>
          <Text className="text-4xl font-semibold leading-10 text-foreground">DiveMobile</Text>
          <Text className="text-base leading-6 text-muted-foreground">{t('home.subtitle')}</Text>
          <HStack gap={5} className="items-baseline">
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
            <HStack gap={10}>
              <MetricTile label={t('home.maxDepth')} value={formatDepth(recentSummary?.maxDepthMeters)} />
              <MetricTile label={t('home.bottomTime')} value={formatDuration(recentSummary?.durationSeconds ?? 0)} />
            </HStack>
          </DiveSummaryCard.Body>
        </DiveSummaryCard>

        <DiveSummaryCard>
          <HStack gap={12} className="items-center">
            <AssistantMark />
            <VStack gap={4} className="flex-1">
              <Text className="text-base font-semibold text-card-foreground">{t('home.assistantSteady')}</Text>
              <Text className="text-sm leading-5 text-muted-foreground">{t('home.reminderReview')}</Text>
            </VStack>
          </HStack>
          <DiveSummaryCard.Metric label={t('home.ascent')} value={t('home.reviewOnly')} />
          <DiveSummaryCard.Metric label={t('home.safetyStop')} value={t('home.planningReminder')} />
        </DiveSummaryCard>

        <VStack gap={10}>
          <InstrumentButton label={t('home.openLogbook')} variant="primary" onPress={props.onOpenLogbook} />
          <InstrumentButton label={t('home.planNextDive')} onPress={props.onOpenPlanning} />
          <InstrumentButton label={t('home.previewMemory')} onPress={props.onOpenMemory} />
        </VStack>

        <SafetyText>{t('home.safetyText')}</SafetyText>
      </VStack>
    </ScrollView>
  );
}

function LanguageMenu(): React.JSX.Element {
  const { i18n, t } = useTranslation();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const activeLanguage = resolveSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);
  const activeLanguageLabel = languageOptions.find(option => option.code === activeLanguage)?.label ?? '한국어';

  const handleSelect = React.useCallback(
    async (language: SupportedLanguage) => {
      await i18n.changeLanguage(language);
      setMenuOpen(false);
    },
    [i18n],
  );

  return (
    <VStack gap={6} className="min-w-[136px] items-end">
      <Pressable
        accessibilityLabel={t(menuOpen ? 'language.closeMenu' : 'language.openMenu')}
        accessibilityRole="button"
        accessibilityState={{ expanded: menuOpen }}
        className="min-h-10 items-center justify-center rounded-full bg-card px-3 py-2"
        testID="language-menu-trigger"
        onPress={() => setMenuOpen(open => !open)}
        style={({ pressed }) => [languageStyles.trigger, pressed ? languageStyles.triggerPressed : undefined]}>
        <HStack gap={7} className="items-center">
          <LanguageMark markTestID="language-mark-trigger" selected={menuOpen} />
          <Text className="text-xs font-semibold text-card-foreground">{activeLanguageLabel}</Text>
        </HStack>
      </Pressable>

      {menuOpen ? (
        <VStack gap={4} accessibilityRole="menu" className="w-full bg-card p-1.5" style={languageStyles.menu}>
          {languageOptions.map(option => {
            const selected = option.code === activeLanguage;

            return (
              <Pressable
                accessibilityLabel={t('language.switchTo', { language: option.label })}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={
                  selected
                    ? 'min-h-11 overflow-hidden rounded-xl bg-primary/10 px-3 py-2'
                    : 'min-h-11 overflow-hidden rounded-xl px-3 py-2'
                }
                hitSlop={4}
                key={option.code}
                testID={`language-option-${option.code}`}
                onPress={() => handleSelect(option.code)}
                style={({ pressed }) => [languageStyles.option, pressed ? languageStyles.optionPressed : undefined]}>
                <HStack className="items-center justify-between">
                  <HStack gap={8} className="items-center">
                    <LanguageMark selected={selected} />
                    <Text
                      className={
                        selected ? 'text-sm font-semibold text-primary' : 'text-sm font-semibold text-card-foreground'
                      }>
                      {option.label}
                    </Text>
                  </HStack>
                  <Box className={selected ? 'h-2 w-2 rounded-full bg-primary' : 'h-2 w-2 rounded-full bg-transparent'} />
                </HStack>
              </Pressable>
            );
          })}
        </VStack>
      ) : null}
    </VStack>
  );
}

function LanguageMark(props: { selected: boolean; markTestID?: string }): React.JSX.Element {
  return (
    <Box
      testID={props.markTestID}
      style={languageStyles.mark}
      className={
        props.selected
          ? 'h-7 min-w-10 items-center justify-center rounded-full bg-primary'
          : 'h-7 min-w-10 items-center justify-center rounded-full bg-primary/10'
      }>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        className={
          props.selected ? 'text-[11px] font-semibold text-primary-foreground' : 'text-[11px] font-semibold text-primary'
        }>
        A/가
      </Text>
    </Box>
  );
}

function MetricTile(props: { label: string; value: string }): React.JSX.Element {
  return (
    <VStack gap={5} className="flex-1 rounded-2xl bg-muted px-4 py-4">
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
