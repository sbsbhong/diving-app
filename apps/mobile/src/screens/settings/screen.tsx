import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '../../components/ui/box';
import { Button, ButtonText } from '../../components/ui/button';
import { HStack } from '../../components/ui/hstack';
import { CircleIcon } from '../../components/ui/icon';
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from '../../components/ui/radio';
import { ScrollView } from '../../components/ui/scroll-view';
import { Text } from '../../components/ui/text';
import { VStack } from '../../components/ui/vstack';
import type { SupportedLanguage } from '../../i18n';
import { useAppPreferences, type ThemePreference } from '../../states/app-preferences';

type SettingsRoute = 'index' | 'theme' | 'language';

type SettingRowProps = {
  label: string;
  rowTestID: string;
  valueTestID: string;
  value: string;
  onPress: () => void;
};

type OptionRowProps = {
  description?: string;
  label: string;
  rowTestID: string;
  selected: boolean;
  onPress: () => void | Promise<void>;
  value: string;
};

const themeOptions: ThemePreference[] = ['system', 'light', 'dark'];
const languageOptions: SupportedLanguage[] = ['ko', 'en'];

export default function SettingsScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const { language, setLanguage, setThemePreference, themePreference } = useAppPreferences();
  const [route, setRoute] = React.useState<SettingsRoute>('index');

  const themeLabel = getThemeLabel(themePreference, t);
  const languageLabel = getLanguageLabel(language, t);

  if (route === 'theme') {
    return (
      <SettingsScaffold>
        <DetailHeader title={t('settings.theme.title')} onBack={() => setRoute('index')} />
        <Text size="sm" className="leading-5 text-muted-foreground">
          {t('settings.theme.subtitle')}
        </Text>

        <OptionGroup value={themePreference} onChange={nextValue => setThemePreference(nextValue as ThemePreference)}>
          {themeOptions.map(option => (
            <OptionRow
              key={option}
              rowTestID={`settings-option-theme-${option}`}
              label={getThemeLabel(option, t)}
              description={t(`settings.theme.${option}Description`)}
              selected={themePreference === option}
              onPress={() => setThemePreference(option)}
              value={option}
            />
          ))}
        </OptionGroup>
      </SettingsScaffold>
    );
  }

  if (route === 'language') {
    return (
      <SettingsScaffold>
        <DetailHeader title={t('settings.language.title')} onBack={() => setRoute('index')} />
        <Text size="sm" className="leading-5 text-muted-foreground">
          {t('settings.language.subtitle')}
        </Text>

        <OptionGroup
          value={language}
          onChange={nextValue => {
            setLanguage(nextValue as SupportedLanguage);
          }}>
          {languageOptions.map(option => (
            <OptionRow
              key={option}
              rowTestID={`settings-option-language-${option}`}
              label={getLanguageLabel(option, t)}
              selected={language === option}
              onPress={() => setLanguage(option)}
              value={option}
            />
          ))}
        </OptionGroup>
      </SettingsScaffold>
    );
  }

  return (
    <SettingsScaffold>
      <VStack space="xs">
        <Text testID="settings-screen-title" size="3xl" className="font-semibold text-foreground">
          {t('settings.title')}
        </Text>
        <Text size="sm" className="leading-5 text-muted-foreground">
          {t('settings.subtitle')}
        </Text>
      </VStack>

      <VStack space="sm">
        <Text size="xs" className="font-semibold uppercase text-muted-foreground">
          {t('settings.appearance')}
        </Text>
        <VStack className="overflow-hidden rounded-2xl bg-card">
          <SettingRow
            rowTestID="settings-row-theme"
            label={t('settings.theme.title')}
            value={themeLabel}
            valueTestID="settings-current-theme"
            onPress={() => setRoute('theme')}
          />
          <Box className="h-px bg-border" />
          <SettingRow
            rowTestID="settings-row-language"
            label={t('settings.language.title')}
            value={languageLabel}
            valueTestID="settings-current-language"
            onPress={() => setRoute('language')}
          />
        </VStack>
      </VStack>
    </SettingsScaffold>
  );
}

function SettingsScaffold(props: { children: React.ReactNode }): React.JSX.Element {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pb-8 pt-5"
      contentInsetAdjustmentBehavior="automatic">
      <VStack space="xl">{props.children}</VStack>
    </ScrollView>
  );
}

function DetailHeader(props: { title: string; onBack: () => void }): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <VStack space="md">
      <Button
        variant="ghost"
        size="sm"
        testID="settings-back"
        onPress={props.onBack}
        className="self-start rounded-full bg-primary/10 px-3 py-2"
        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <ButtonText className="text-sm font-semibold text-primary">
          {`‹ ${t('settings.title')}`}
        </ButtonText>
      </Button>
      <Text testID="settings-detail-title" size="3xl" className="font-semibold text-foreground">
        {props.title}
      </Text>
    </VStack>
  );
}

function OptionGroup(props: { children: React.ReactNode; value: string; onChange: (value: string) => void }): React.JSX.Element {
  return (
    <RadioGroup value={props.value} onChange={props.onChange} className="overflow-hidden rounded-2xl bg-card gap-0">
      {props.children}
    </RadioGroup>
  );
}

function SettingRow(props: SettingRowProps): React.JSX.Element {
  return (
    <Button
      variant="ghost"
      testID={props.rowTestID}
      onPress={props.onPress}
      className="h-auto rounded-none bg-card px-4 py-4"
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
      <HStack space="md" className="min-h-10 items-center justify-between">
        <ButtonText className="text-base font-semibold text-card-foreground">
          {props.label}
        </ButtonText>
        <HStack space="sm" className="items-center">
          <ButtonText testID={props.valueTestID} className="text-sm text-muted-foreground">
            {props.value}
          </ButtonText>
          <ButtonText className="text-xl text-muted-foreground">
            ›
          </ButtonText>
        </HStack>
      </HStack>
    </Button>
  );
}

function OptionRow(props: OptionRowProps): React.JSX.Element {
  const labelClassName = props.selected ? 'font-semibold text-primary' : 'font-semibold text-card-foreground';

  return (
    <Radio
      testID={props.rowTestID}
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      value={props.value}
      className={props.selected ? 'bg-primary/10 px-4 py-4' : 'bg-card px-4 py-4'}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.99 : 1 }] }]}>
      <HStack space="md" className="min-h-11 flex-1 items-center justify-between">
        <VStack space="xs" className="flex-1 pr-3">
          <RadioLabel className={labelClassName}>
            {props.label}
          </RadioLabel>
          {props.description ? (
            <Text size="sm" className="leading-5 text-muted-foreground">
              {props.description}
            </Text>
          ) : null}
        </VStack>
        <RadioIndicator>
          <RadioIcon as={CircleIcon} />
        </RadioIndicator>
      </HStack>
    </Radio>
  );
}

function getThemeLabel(themePreference: ThemePreference, t: ReturnType<typeof useTranslation>['t']): string {
  return t(`settings.theme.${themePreference}`);
}

function getLanguageLabel(language: SupportedLanguage, t: ReturnType<typeof useTranslation>['t']): string {
  return language === 'ko' ? t('settings.language.korean') : t('settings.language.english');
}
