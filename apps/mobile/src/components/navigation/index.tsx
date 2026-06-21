import React from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import type { DiveLogbookSection } from '../../types/dive-session';
import { useDiveLogbook } from '../../states/use-dive-logbook';
import { Box, HStack, Text, VStack } from '../ui/primitives';
import HomeScreen from '../../screens/home/screen';
import LogbookScreen from '../../screens/logbook/screen';
import PlanningScreen from '../../screens/planning/screen';
import SettingsScreen from '../../screens/settings/screen';

export type RootStackParamList = {
  home: undefined;
  logbook: undefined;
  planning: undefined;
  settings: undefined;
};

export default function RootNavigation(): React.JSX.Element {
  const [section, setSection] = React.useState<DiveLogbookSection>('home');
  const insets = useSafeAreaInsets();
  const logbook = useDiveLogbook();
  const { t } = useTranslation();

  return (
    <VStack
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <VStack className="flex-1 bg-background">
        {section === 'home' ? (
          <HomeScreen
            sessions={logbook.sessions}
            onOpenLogbook={() => setSection('logbook')}
            onOpenPlanning={() => setSection('planning')}
          />
        ) : null}
        {section === 'logbook' ? (
          <LogbookScreen
            sessions={logbook.filteredSessions}
            filter={logbook.filter}
            onFilterChange={logbook.setFilter}
            onImportFixtures={logbook.importFixtures}
          />
        ) : null}
        {section === 'planning' ? (
          <PlanningScreen sessions={logbook.sessions} onOpenLogbook={() => setSection('logbook')} />
        ) : null}
        {section === 'settings' ? <SettingsScreen /> : null}
      </VStack>

      <HStack
        gap={0}
        className="bg-card px-2 pt-1"
        style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
        <NavTab id="home" label={t('navigation.home')} selected={section === 'home'} onPress={() => setSection('home')} />
        <NavTab id="logbook" label={t('navigation.logbook')} selected={section === 'logbook'} onPress={() => setSection('logbook')} />
        <NavTab id="planning" label={t('navigation.planning')} selected={section === 'planning'} onPress={() => setSection('planning')} />
        <NavTab id="settings" label={t('navigation.settings')} selected={section === 'settings'} onPress={() => setSection('settings')} />
      </HStack>
    </VStack>
  );
}

const navTabStyles = tva({
  base: 'min-h-12 flex-1 items-center justify-center py-1',
  variants: {
    selected: {
      true: 'bg-transparent',
      false: 'bg-transparent',
    },
  },
  defaultVariants: {
    selected: false,
  },
});

const navTabIndicatorStyles = tva({
  base: 'mb-1 h-0.5 w-5 rounded-full',
  variants: {
    selected: {
      true: 'bg-primary',
      false: 'bg-transparent',
    },
  },
  defaultVariants: {
    selected: false,
  },
});

const navTabTextStyles = tva({
  base: 'text-xs font-semibold',
  variants: {
    selected: {
      true: 'text-primary',
      false: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    selected: false,
  },
});

function NavTab(props: { id: DiveLogbookSection; label: string; selected: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      onPress={props.onPress}
      testID={`nav-tab-${props.id}`}
      className={navTabStyles({ selected: props.selected })}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      <Box className={navTabIndicatorStyles({ selected: props.selected })} />
      <Text className={navTabTextStyles({ selected: props.selected })}>{props.label}</Text>
    </Pressable>
  );
}
