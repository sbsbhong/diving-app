import React from 'react';
import {
  NavigationContainer,
  TabActions,
  TabRouter,
  createNavigatorFactory,
  useNavigationBuilder,
  type ParamListBase,
  type TabNavigationState,
} from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import type { DiveLogbookSection } from '../../types/dive-session';
import type { DiveLogEntry } from '../../types/dive-log-entry';
import type { DivePlan } from '../../types/dive-plan';
import { useDiveLogbook } from '../../states/use-dive-logbook';
import { useDivePlans } from '../../states/use-dive-plans';
import { divePlanToDiveLogEntryDraft } from '../../utils/dive-plan-to-log-entry';
import { Box } from '../ui/box';
import { HStack } from '../ui/hstack';
import { Pressable } from '../ui/pressable';
import { Text } from '../ui/text';
import { VStack } from '../ui/vstack';
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

type NavigationRouteName = keyof RootStackParamList;

type AppTabNavigatorProps = {
  children: React.ReactNode;
  initialRouteName?: NavigationRouteName;
};

type AppTabScreenProps = {
  name: NavigationRouteName;
  children: () => React.ReactNode;
};

const AppTabs = createNavigatorFactory(AppTabNavigator)();

export default function RootNavigation(): React.JSX.Element {
  const [pendingLogDraft, setPendingLogDraft] = React.useState<
    | {
        entry: DiveLogEntry;
        sourcePlanLocalId?: string;
      }
    | undefined
  >();
  const insets = useSafeAreaInsets();
  const logbook = useDiveLogbook();
  const planning = useDivePlans();

  const createLogFromPlan = React.useCallback((plan: DivePlan) => {
    setPendingLogDraft({
      entry: divePlanToDiveLogEntryDraft(plan),
      sourcePlanLocalId: plan.localId,
    });
  }, []);

  const markPendingDraftSaved = React.useCallback(
    async (entry: DiveLogEntry, sourcePlanLocalId?: string) => {
      setPendingLogDraft(undefined);

      if (!sourcePlanLocalId) {
        return;
      }

      const sourcePlan = planning.plans.find(plan => plan.localId === sourcePlanLocalId);

      if (!sourcePlan) {
        return;
      }

      await planning.savePlan({
        ...sourcePlan,
        convertedLogLocalId: entry.localId,
        updatedAt: Date.now() / 1000,
      });
    },
    [planning],
  );

  const openLogbook = React.useCallback(() => {
    rootNavigationActions.current?.navigate('logbook');
  }, []);

  const openPlanning = React.useCallback(() => {
    rootNavigationActions.current?.navigate('planning');
  }, []);

  return (
    <VStack
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}>
      <NavigationContainer>
        <AppTabs.Navigator initialRouteName="home">
          <AppTabs.Screen name="home">
            {() => (
              <HomeScreen
                sessions={logbook.sessions}
                onOpenLogbook={openLogbook}
                onOpenPlanning={openPlanning}
              />
            )}
          </AppTabs.Screen>
          <AppTabs.Screen name="logbook">
            {() => (
              <LogbookScreen
                entries={logbook.filteredEntries}
                filter={logbook.filter}
                onFilterChange={logbook.setFilter}
                onImportFixtures={logbook.importFixtures}
                onSaveEntry={logbook.saveEntry}
                onDeleteEntry={logbook.deleteEntry}
                saveError={logbook.saveError}
                isSaving={logbook.isSaving}
                pendingDraft={pendingLogDraft}
                onPendingDraftSave={markPendingDraftSaved}
              />
            )}
          </AppTabs.Screen>
          <AppTabs.Screen name="planning">
            {() => (
              <PlanningScreen
                sessions={logbook.sessions}
                plans={planning.plans}
                onSavePlan={planning.savePlan}
                onDeletePlan={planning.deletePlan}
                saveError={planning.saveError}
                isSaving={planning.isSaving}
                onCreateLogFromPlan={createLogFromPlan}
                onOpenLogbook={openLogbook}
              />
            )}
          </AppTabs.Screen>
          <AppTabs.Screen name="settings">{() => <SettingsScreen />}</AppTabs.Screen>
        </AppTabs.Navigator>
      </NavigationContainer>
    </VStack>
  );
}

function AppTabNavigator({ children, initialRouteName }: AppTabNavigatorProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { state, navigation, descriptors, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    {
      initialRouteName?: string;
      backBehavior?: 'history';
      children: React.ReactNode;
    },
    Record<string, never>,
    Record<string, never>,
    Record<string, never>
  >(TabRouter, {
    children,
    initialRouteName,
    backBehavior: 'history',
  });
  const focusedRoute = state.routes[state.index];

  React.useEffect(() => {
    rootNavigationActions.current = {
      navigate: routeName => {
        navigation.dispatch({
          ...TabActions.jumpTo(routeName),
          target: state.key,
        });
      },
    };

    return () => {
      rootNavigationActions.current = undefined;
    };
  }, [navigation, state.key]);

  return (
    <NavigationContent>
      <VStack className="flex-1 bg-background">
        {descriptors[focusedRoute.key].render()}
      </VStack>

      <HStack className="bg-card px-2 pt-1" style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
        {state.routes.map(route => {
          const selected = route.key === focusedRoute.key;
          const routeName = route.name as DiveLogbookSection;

          return (
            <NavTab
              key={route.key}
              id={routeName}
              label={t(`navigation.${route.name}`)}
              selected={selected}
              onPress={() => {
                if (!selected) {
                  navigation.dispatch({
                    ...TabActions.jumpTo(route.name),
                    target: state.key,
                  });
                }
              }}
            />
          );
        })}
      </HStack>
    </NavigationContent>
  );
}

const rootNavigationActions = {
  current: undefined as
    | {
        navigate: (routeName: NavigationRouteName) => void;
      }
    | undefined,
};

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
