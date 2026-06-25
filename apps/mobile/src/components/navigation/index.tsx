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
import { WatchConnectivitySyncProvider } from '../../states/watch-connectivity-sync';
import { createBlankDivePlan } from '../../utils/create-dive-plan';
import { divePlanToDiveLogEntryDraft } from '../../utils/dive-plan-to-log-entry';
import { Box } from '../ui/box';
import { HStack } from '../ui/hstack';
import { InstrumentButton } from '../ui/instrument';
import { KeyboardAwareScrollView } from '../ui/keyboard-aware-scroll-view';
import { Pressable } from '../ui/pressable';
import { Text } from '../ui/text';
import { VStack } from '../ui/vstack';
import HomeScreen from '../../screens/home/screen';
import { LogEntryDetail } from '../../screens/logbook/log-entry-detail';
import { LogEntryEditor } from '../../screens/logbook/log-entry-editor';
import LogbookScreen from '../../screens/logbook/screen';
import { PlanDetail } from '../../screens/planning/plan-detail';
import { PlanEditor } from '../../screens/planning/plan-editor';
import PlanningScreen from '../../screens/planning/screen';
import SettingsScreen, { type SettingsRoute } from '../../screens/settings/screen';

export type RootStackParamList = {
  home: undefined;
  logbook: undefined;
  planning: undefined;
  settings: undefined;
  logbookDetail: { localId: string };
  logbookEdit: { localId: string };
  planningCreate: undefined;
  planningDetail: { localId: string };
  planningEdit: { localId: string };
  settingsDetail: { route: Exclude<SettingsRoute, 'index'> };
};

type NavigationRouteName = 'home' | 'logbook' | 'planning' | 'settings';

type AppDetailRoute =
  | { name: 'logbookDetail'; localId: string }
  | { name: 'logbookEdit'; localId: string }
  | { name: 'planningCreate'; draft: DivePlan }
  | { name: 'planningDetail'; localId: string }
  | { name: 'planningEdit'; localId: string }
  | { name: 'settingsDetail'; route: Exclude<SettingsRoute, 'index'> };

type AutoImportToast = {
  entryLocalId: string;
  siteName: string;
};

type AppTabNavigatorProps = {
  children: React.ReactNode;
  detailScreen?: React.ReactNode;
  initialRouteName?: NavigationRouteName;
  onRouteReselect?: (routeName: NavigationRouteName) => void;
};

type AppTabScreenProps = {
  name: NavigationRouteName;
  children: () => React.ReactNode;
};

const AppTabs = createNavigatorFactory(AppTabNavigator)();

export default function RootNavigation(): React.JSX.Element {
  const { t } = useTranslation();
  const [detailRoute, setDetailRoute] = React.useState<AppDetailRoute | undefined>();
  const [autoImportToast, setAutoImportToast] = React.useState<AutoImportToast | undefined>();
  const [pendingLogDraft, setPendingLogDraft] = React.useState<
    | {
        entry: DiveLogEntry;
        sourcePlanLocalId?: string;
      }
    | undefined
  >();
  const [completedPromptPlan, setCompletedPromptPlan] = React.useState<DivePlan | undefined>();
  const [reselectTokens, setReselectTokens] = React.useState<Record<NavigationRouteName, number>>({
    home: 0,
    logbook: 0,
    planning: 0,
    settings: 0,
  });
  const insets = useSafeAreaInsets();
  const logbook = useDiveLogbook();
  const planning = useDivePlans();

  React.useEffect(() => {
    if (!autoImportToast) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      setAutoImportToast(undefined);
    }, 6000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [autoImportToast]);

  const openTab = React.useCallback((routeName: NavigationRouteName) => {
    setDetailRoute(undefined);
    rootNavigationActions.current?.navigate(routeName);
  }, []);

  const createLogFromPlan = React.useCallback((plan: DivePlan) => {
    rootNavigationActions.current?.navigate('logbook');
    setDetailRoute(undefined);
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
    openTab('logbook');
  }, [openTab]);

  const openPlanning = React.useCallback(() => {
    openTab('planning');
  }, [openTab]);

  const openLogEntryDetail = React.useCallback((entry: DiveLogEntry) => {
    rootNavigationActions.current?.navigate('logbook');
    setDetailRoute({ name: 'logbookDetail', localId: entry.localId });
  }, []);

  const openImportedLogToast = React.useCallback(() => {
    if (!autoImportToast) {
      return;
    }

    rootNavigationActions.current?.navigate('logbook');
    setDetailRoute({ name: 'logbookDetail', localId: autoImportToast.entryLocalId });
    setAutoImportToast(undefined);
  }, [autoImportToast]);

  const showImportedEntryToast = React.useCallback(
    (entry: DiveLogEntry) => {
      setAutoImportToast({
        entryLocalId: entry.localId,
        siteName: entry.manual.site.name ?? entry.watchCapture?.session.siteName ?? t('logbook.untitledDive'),
      });
    },
    [t],
  );

  const openPlanDetail = React.useCallback((plan: DivePlan) => {
    rootNavigationActions.current?.navigate('planning');
    setDetailRoute({ name: 'planningDetail', localId: plan.localId });
  }, []);

  const openPlanCreate = React.useCallback(() => {
    rootNavigationActions.current?.navigate('planning');
    setDetailRoute({ name: 'planningCreate', draft: createBlankDivePlan() });
  }, []);

  const openSettingsDetail = React.useCallback((route: Exclude<SettingsRoute, 'index'>) => {
    rootNavigationActions.current?.navigate('settings');
    setDetailRoute({ name: 'settingsDetail', route });
  }, []);

  const reselectRoute = React.useCallback((routeName: NavigationRouteName) => {
    setDetailRoute(undefined);
    setReselectTokens(currentTokens => ({
      ...currentTokens,
      [routeName]: currentTokens[routeName] + 1,
    }));
  }, []);

  const detailScreen = detailRoute ? (
    <RoutedDetailScreen
      route={detailRoute}
      logbook={logbook}
      planning={planning}
      onBack={() => setDetailRoute(undefined)}
      onCreateLogFromPlan={createLogFromPlan}
      onPlanCompleted={plan => {
        setCompletedPromptPlan(plan);
        rootNavigationActions.current?.navigate('planning');
        setDetailRoute(undefined);
      }}
      onRouteChange={setDetailRoute}
    />
  ) : undefined;

  return (
    <WatchConnectivitySyncProvider onImportedEntry={showImportedEntryToast}>
      <VStack
        className="flex-1 bg-background"
        style={{
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}>
        <NavigationContainer>
          <AppTabs.Navigator initialRouteName="home" detailScreen={detailScreen} onRouteReselect={reselectRoute}>
            <AppTabs.Screen name="home">
              {() => (
                <HomeScreen
                  sessions={logbook.sessions}
                  onOpenLogbook={openLogbook}
                  onOpenPlanning={openPlanning}
                  onRefresh={logbook.refresh}
                  isRefreshing={logbook.isRefreshing}
                  reselectToken={reselectTokens.home}
                />
              )}
            </AppTabs.Screen>
            <AppTabs.Screen name="logbook">
              {() => (
                <LogbookScreen
                  entries={logbook.filteredEntries}
                  filter={logbook.filter}
                  onFilterChange={logbook.setFilter}
                  onSyncWatch={logbook.syncWatchPayloads}
                  onRefresh={logbook.refresh}
                  isRefreshing={logbook.isRefreshing}
                  reselectToken={reselectTokens.logbook}
                  onSaveEntry={logbook.saveEntry}
                  onDeleteEntry={logbook.deleteEntry}
                  saveError={logbook.saveError}
                  isSaving={logbook.isSaving}
                  pendingDraft={pendingLogDraft}
                  onPendingDraftSave={markPendingDraftSaved}
                  onOpenEntry={openLogEntryDetail}
                />
              )}
            </AppTabs.Screen>
            <AppTabs.Screen name="planning">
              {() => (
                <PlanningScreen
                  sessions={logbook.sessions}
                  plans={planning.plans}
                  onRefresh={planning.refresh}
                  isRefreshing={planning.isRefreshing}
                  reselectToken={reselectTokens.planning}
                  onSavePlan={planning.savePlan}
                  onDeletePlan={planning.deletePlan}
                  saveError={planning.saveError}
                  isSaving={planning.isSaving}
                  onCreatePlan={openPlanCreate}
                  onOpenPlan={openPlanDetail}
                  onCreateLogFromPlan={createLogFromPlan}
                  onOpenLogbook={openLogbook}
                  completedPromptPlan={completedPromptPlan}
                  onCompletedPromptLater={() => setCompletedPromptPlan(undefined)}
                  onCreateLogFromCompletedPlan={plan => {
                    setCompletedPromptPlan(undefined);
                    createLogFromPlan(plan);
                  }}
                />
              )}
            </AppTabs.Screen>
            <AppTabs.Screen name="settings">
              {() => <SettingsScreen route="index" onOpenRoute={openSettingsDetail} />}
            </AppTabs.Screen>
          </AppTabs.Navigator>
        </NavigationContainer>
        {autoImportToast ? (
          <Pressable
            testID="watch-auto-import-toast"
            onPress={openImportedLogToast}
            className="absolute left-4 right-4 z-10 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"
            style={({ pressed }) => [
              {
                bottom: Math.max(insets.bottom, 12) + (detailRoute ? 12 : 64),
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}>
            <VStack space="xs">
              <Text className="text-sm font-semibold text-card-foreground">
                {t('watchSync.autoImportedTitle', { defaultValue: 'Watch log synced' })}
              </Text>
              <Text className="text-sm leading-5 text-muted-foreground">
                {t('watchSync.autoImportedBody', {
                  defaultValue: 'Open {{siteName}}.',
                  siteName: autoImportToast.siteName,
                })}
              </Text>
            </VStack>
          </Pressable>
        ) : null}
      </VStack>
    </WatchConnectivitySyncProvider>
  );
}

function AppTabNavigator({ children, detailScreen, initialRouteName, onRouteReselect }: AppTabNavigatorProps): React.JSX.Element {
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
        {detailScreen ?? descriptors[focusedRoute.key].render()}
      </VStack>

      {detailScreen ? null : (
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
                    return;
                  }

                  onRouteReselect?.(route.name as NavigationRouteName);
                }}
              />
            );
          })}
        </HStack>
      )}
    </NavigationContent>
  );
}

function RoutedDetailScreen(props: {
  route: AppDetailRoute;
  logbook: ReturnType<typeof useDiveLogbook>;
  planning: ReturnType<typeof useDivePlans>;
  onBack: () => void;
  onCreateLogFromPlan: (plan: DivePlan) => void;
  onPlanCompleted: (plan: DivePlan) => void;
  onRouteChange: (route: AppDetailRoute | undefined) => void;
}): React.JSX.Element {
  const route = props.route;
  const entry =
    route.name === 'logbookDetail' || route.name === 'logbookEdit'
      ? props.logbook.entries.find(nextEntry => nextEntry.localId === route.localId)
      : undefined;
  const plan =
    route.name === 'planningDetail' || route.name === 'planningEdit'
      ? props.planning.plans.find(nextPlan => nextPlan.localId === route.localId)
      : undefined;

  if (route.name === 'settingsDetail') {
    return <SettingsScreen route={route.route} onBack={props.onBack} />;
  }

  if (route.name === 'logbookDetail') {
    if (!entry) {
      return <MissingRouteScreen onBack={props.onBack} />;
    }

    return (
      <RoutedScrollScreen>
        <LogEntryDetail
          entry={entry}
          onBack={props.onBack}
          onEdit={nextEntry => props.onRouteChange({ name: 'logbookEdit', localId: nextEntry.localId })}
          onDelete={async localId => {
            await props.logbook.deleteEntry(localId);
            props.onBack();
          }}
        />
      </RoutedScrollScreen>
    );
  }

  if (route.name === 'logbookEdit') {
    if (!entry) {
      return <MissingRouteScreen onBack={props.onBack} />;
    }

    return (
      <RoutedScrollScreen>
        <LogEntryEditor
          entry={entry}
          mode="edit"
          isSaving={props.logbook.isSaving}
          saveError={props.logbook.saveError}
          onCancel={() => props.onRouteChange({ name: 'logbookDetail', localId: entry.localId })}
          onSave={async nextEntry => {
            const savedEntry = await props.logbook.saveEntry(nextEntry);
            props.onRouteChange({ name: 'logbookDetail', localId: savedEntry.localId });
            return savedEntry;
          }}
        />
      </RoutedScrollScreen>
    );
  }

  if (route.name === 'planningCreate') {
    return (
      <RoutedScrollScreen>
        <PlanEditor
          plan={route.draft}
          mode="create"
          isSaving={props.planning.isSaving}
          saveError={props.planning.saveError}
          onCancel={props.onBack}
          onSave={async nextPlan => {
            const savedPlan = await props.planning.savePlan(nextPlan);
            props.onRouteChange({ name: 'planningDetail', localId: savedPlan.localId });
            return savedPlan;
          }}
        />
      </RoutedScrollScreen>
    );
  }

  if (route.name === 'planningDetail') {
    if (!plan) {
      return <MissingRouteScreen onBack={props.onBack} />;
    }

    return (
      <RoutedScrollScreen>
        <PlanDetail
          plan={plan}
          onBack={props.onBack}
          onEdit={nextPlan => props.onRouteChange({ name: 'planningEdit', localId: nextPlan.localId })}
          onComplete={async nextPlan => {
            const timestamp = Date.now() / 1000;
            const savedPlan = await props.planning.savePlan({
              ...nextPlan,
              status: 'completed',
              completedAt: timestamp,
              updatedAt: timestamp,
            });
            props.onPlanCompleted(savedPlan);
          }}
          onDelete={async localId => {
            await props.planning.deletePlan(localId);
            props.onBack();
          }}
          onCreateLogFromPlan={props.onCreateLogFromPlan}
        />
      </RoutedScrollScreen>
    );
  }

  if (!plan) {
    return <MissingRouteScreen onBack={props.onBack} />;
  }

  return (
    <RoutedScrollScreen>
      <PlanEditor
        plan={plan}
        mode="edit"
        isSaving={props.planning.isSaving}
        saveError={props.planning.saveError}
        onCancel={() => props.onRouteChange({ name: 'planningDetail', localId: plan.localId })}
        onSave={async nextPlan => {
          const savedPlan = await props.planning.savePlan(nextPlan);
          props.onRouteChange({ name: 'planningDetail', localId: savedPlan.localId });
          return savedPlan;
        }}
      />
    </RoutedScrollScreen>
  );
}

function RoutedScrollScreen(props: { children: React.ReactNode }): React.JSX.Element {
  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5 pt-4 pb-6"
      contentInsetAdjustmentBehavior="automatic">
      <VStack space="lg">
        {props.children}
      </VStack>
    </KeyboardAwareScrollView>
  );
}

function MissingRouteScreen(props: { onBack: () => void }): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <RoutedScrollScreen>
      <VStack testID="navigation-missing-route" space="md" className="rounded-2xl bg-card px-4 py-4">
        <Text className="text-lg font-semibold text-card-foreground">
          {t('navigation.missingRouteTitle', { defaultValue: 'Screen unavailable' })}
        </Text>
        <Text className="text-sm leading-5 text-muted-foreground">
          {t('navigation.missingRouteBody', { defaultValue: 'The item may have been deleted or is no longer available on this device.' })}
        </Text>
        <InstrumentButton label={t('logbook.backToList', { defaultValue: 'Back to list' })} onPress={props.onBack} />
      </VStack>
    </RoutedScrollScreen>
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
