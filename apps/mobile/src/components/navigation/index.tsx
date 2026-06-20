import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DiveLogbookSection } from '../../types/dive-session';
import { useDiveLogbook } from '../../states/use-dive-logbook';
import { HStack, Text, VStack } from '../ui/primitives';
import { diveTheme } from '../ui/theme';
import HomeScreen from '../../screens/home/screen';
import LogbookScreen from '../../screens/logbook/screen';
import MemoryScreen from '../../screens/memory/screen';
import PlanningScreen from '../../screens/planning/screen';

export type RootStackParamList = {
  home: undefined;
  logbook: undefined;
  planning: undefined;
  memory: undefined;
};

export default function RootNavigation(): React.JSX.Element {
  const [section, setSection] = React.useState<DiveLogbookSection>('home');
  const insets = useSafeAreaInsets();
  const logbook = useDiveLogbook();

  return (
    <VStack
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}>
      <VStack style={styles.screen}>
        {section === 'home' ? (
          <HomeScreen
            sessions={logbook.sessions}
            onOpenLogbook={() => setSection('logbook')}
            onOpenPlanning={() => setSection('planning')}
            onOpenMemory={() => setSection('memory')}
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
        {section === 'memory' ? <MemoryScreen sessions={logbook.sessions} onOpenLogbook={() => setSection('logbook')} /> : null}
      </VStack>

      <HStack gap={8} style={[styles.tabs, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <NavTab label="Home" selected={section === 'home'} onPress={() => setSection('home')} />
        <NavTab label="Logbook" selected={section === 'logbook'} onPress={() => setSection('logbook')} />
        <NavTab label="Plan" selected={section === 'planning'} onPress={() => setSection('planning')} />
        <NavTab label="Memory" selected={section === 'memory'} onPress={() => setSection('memory')} />
      </HStack>
    </VStack>
  );
}

function NavTab(props: { label: string; selected: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable onPress={props.onPress} style={[styles.tab, props.selected && styles.tabSelected]}>
      <VStack style={[styles.tabIndicator, props.selected && styles.tabIndicatorSelected]} />
      <Text style={[styles.tabText, props.selected && styles.tabTextSelected]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: diveTheme.colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: diveTheme.colors.background,
  },
  tabs: {
    borderTopWidth: 1,
    borderTopColor: diveTheme.colors.outline,
    backgroundColor: diveTheme.colors.background,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
    minHeight: 42,
    paddingVertical: 7,
  },
  tabSelected: {
    borderColor: diveTheme.colors.primary,
    backgroundColor: `${diveTheme.colors.primary}14`,
  },
  tabIndicator: {
    width: 18,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  tabIndicatorSelected: {
    backgroundColor: diveTheme.colors.primary,
  },
  tabText: {
    color: diveTheme.colors.mutedText,
    fontFamily: diveTheme.fonts.metric,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  tabTextSelected: {
    color: diveTheme.colors.primary,
  },
});
