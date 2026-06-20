import React from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DiveLogbookSection } from '../../types/dive-session';
import { useDiveLogbook } from '../../states/use-dive-logbook';
import { HStack, Text, VStack } from '../ui/primitives';
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

      <HStack
        gap={8}
        className="border-t border-border bg-background px-2.5 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
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
    <Pressable
      onPress={props.onPress}
      className={`min-h-11 flex-1 items-center justify-center rounded-md border py-2 ${
        props.selected ? 'border-primary bg-primary/10' : 'border-border bg-background'
      }`}>
      <VStack className={`mb-1 h-0.5 w-5 rounded-full ${props.selected ? 'bg-primary' : 'bg-muted'}`} />
      <Text className={`font-mono text-xs font-extrabold uppercase ${props.selected ? 'text-primary' : 'text-muted-foreground'}`}>
        {props.label}
      </Text>
    </Pressable>
  );
}
