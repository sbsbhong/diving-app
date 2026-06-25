import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { KeyboardAvoidingView, RefreshControl, ScrollView } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import { LocalDivePlanRepository } from '../src/repositories/local-dive-plan-repository';
import PlanningScreen from '../src/screens/planning/screen';
import { useDivePlans } from '../src/states/use-dive-plans';
import type { DivePlan } from '../src/types/dive-plan';

const plan = (overrides: Partial<DivePlan>): DivePlan => ({
  localId: 'plan-base',
  status: 'draft',
  createdAt: 100,
  updatedAt: 100,
  site: {},
  buddyIds: [],
  gearIds: [],
  tags: [],
  plannedValues: {},
  checklistItems: [],
  ...overrides,
});

type HarnessProps = {
  repository: LocalDivePlanRepository;
  onCreatePlan?: () => void;
  onOpenPlan?: (plan: DivePlan) => void;
  onCreateLogFromPlan?: (plan: DivePlan) => void;
};

const queryClients: QueryClient[] = [];
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

function Harness({ repository, onCreateLogFromPlan = jest.fn(), onCreatePlan, onOpenPlan }: HarnessProps): React.JSX.Element {
  const plans = useDivePlans({ repository, queryScope: 'planning-screen-test' });

  return (
    <PlanningScreen
      sessions={[]}
      plans={plans.plans}
      onRefresh={plans.refresh}
      isRefreshing={plans.isRefreshing}
      onSavePlan={plans.savePlan}
      onDeletePlan={plans.deletePlan}
      saveError={plans.saveError}
      isSaving={plans.isSaving}
      onCreatePlan={onCreatePlan}
      onOpenPlan={onOpenPlan}
      onCreateLogFromPlan={onCreateLogFromPlan}
      onOpenLogbook={jest.fn()}
    />
  );
}

const renderPlanning = async (
  repository: LocalDivePlanRepository,
  options:
    | ((plan: DivePlan) => void)
    | {
        onCreateLogFromPlan?: (plan: DivePlan) => void;
        onCreatePlan?: () => void;
        onOpenPlan?: (plan: DivePlan) => void;
      } = {},
) => {
  const props = typeof options === 'function' ? { onCreateLogFromPlan: options } : options;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
  queryClients.push(queryClient);
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    await i18n.changeLanguage('en');
    renderer = ReactTestRenderer.create(
      <QueryClientProvider client={queryClient}>
        <Harness
          repository={repository}
          onCreateLogFromPlan={props.onCreateLogFromPlan}
          onCreatePlan={props.onCreatePlan}
          onOpenPlan={props.onOpenPlan}
        />
      </QueryClientProvider>,
    );
  });

  renderers.push(renderer!);
  return renderer!;
};

const press = async (root: ReactTestRenderer.ReactTestInstance, testID: string) => {
  await ReactTestRenderer.act(async () => {
    await root.findByProps({ testID }).props.onPress();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
};

const changeText = async (root: ReactTestRenderer.ReactTestInstance, testID: string, value: string) => {
  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID }).props.onChangeText(value);
  });
};

describe('Planning screen planbook flow', () => {
  afterEach(async () => {
    await ReactTestRenderer.act(async () => {
      for (const renderer of renderers.splice(0)) {
        renderer.unmount();
      }
    });

    for (const queryClient of queryClients.splice(0)) {
      queryClient.clear();
    }
  });

  it('creates a planned scuba boat plan with mode-specific fields', async () => {
    const repository = new LocalDivePlanRepository([], { now: () => 1781354000 });
    const renderer = await renderPlanning(repository);
    const root = renderer.root;

    await press(root, 'planning-create-action');
    expect(root.findByProps({ testID: 'planning-editor-title' }).props.children).toBe('New dive plan');
    await changeText(root, 'planning-editor-plan-title', 'Blue Wall morning');
    await changeText(root, 'planning-editor-site-name', 'Blue Wall');
    await press(root, 'planning-editor-mode-scuba');
    await press(root, 'planning-editor-entry-style-boat');
    await changeText(root, 'planning-editor-planned-max-depth', '24');
    await changeText(root, 'planning-editor-planned-duration', '45');
    await changeText(root, 'planning-editor-gas-label', 'EAN32');
    await changeText(root, 'planning-editor-gear', 'bcd-1, computer-1');
    await press(root, 'planning-editor-save-planned');

    const [savedPlan] = await repository.list();
    expect(savedPlan).toMatchObject({
      status: 'planned',
      title: 'Blue Wall morning',
      site: { name: 'Blue Wall' },
      diveMode: 'scuba',
      entryStyle: 'boat',
      gearIds: ['bcd-1', 'computer-1'],
      plannedValues: {
        plannedMaxDepthMeters: 24,
        plannedDurationMinutes: 45,
        gasLabel: 'EAN32',
      },
    });
    expect(root.findByProps({ testID: 'planning-plan-row-Blue Wall' })).toBeTruthy();
  });

  it('plan editor exposes only scuba and freedive modes', async () => {
    const repository = new LocalDivePlanRepository([], { now: () => 1781354000 });
    const renderer = await renderPlanning(repository);
    const root = renderer.root;

    await press(root, 'planning-create-action');

    expect(root.findByProps({ testID: 'planning-editor-mode-scuba' })).toBeTruthy();
    expect(root.findByProps({ testID: 'planning-editor-mode-freedive' })).toBeTruthy();
    expect(root.findAllByProps({ testID: 'planning-editor-mode-snorkel' })).toHaveLength(0);
    expect(root.findAllByProps({ testID: 'planning-editor-mode-pool' })).toHaveLength(0);
    expect(root.findAllByProps({ testID: 'planning-editor-pool-length' })).toHaveLength(0);
    expect(root.findAllByProps({ testID: 'planning-editor-lap-target' })).toHaveLength(0);
  });

  it('keeps planning inputs in a keyboard-aware scroll container', async () => {
    const renderer = await renderPlanning(new LocalDivePlanRepository([]));
    const root = renderer.root;

    expect(root.findByType(KeyboardAvoidingView).props.behavior).toBe('padding');
    expect(root.findByType(ScrollView).props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('uses native pull-to-refresh on the planning scroll view', async () => {
    const renderer = await renderPlanning(new LocalDivePlanRepository([]));
    const refreshControl = renderer.root.findByType(ScrollView).props.refreshControl;

    expect(refreshControl.type).toBe(RefreshControl);
    expect(refreshControl.props.refreshing).toBe(false);
  });

  it('refreshes when the active planning tab is selected again', async () => {
    const onRefresh = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('en');
      renderer = ReactTestRenderer.create(
        <PlanningScreen
          sessions={[]}
          plans={[]}
          onRefresh={onRefresh}
          onSavePlan={jest.fn()}
          onOpenLogbook={jest.fn()}
          reselectToken={0}
        />,
      );
    });

    await ReactTestRenderer.act(async () => {
      renderer!.update(
        <PlanningScreen
          sessions={[]}
          plans={[]}
          onRefresh={onRefresh}
          onSavePlan={jest.fn()}
          onOpenLogbook={jest.fn()}
          reselectToken={1}
        />,
      );
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('edits an existing plan without creating a duplicate', async () => {
    const repository = new LocalDivePlanRepository([
      plan({
        localId: 'plan-1',
        status: 'planned',
        title: 'Original plan',
        site: { name: 'Original Reef' },
        diveMode: 'freedive',
        entryStyle: 'shore',
      }),
    ]);
    const renderer = await renderPlanning(repository);
    const root = renderer.root;

    await press(root, 'planning-plan-row-Original Reef');
    await press(root, 'planning-detail-edit');
    await changeText(root, 'planning-editor-site-name', 'Edited Reef');
    await changeText(root, 'planning-editor-objective', 'Line practice');
    await press(root, 'planning-editor-save-draft');

    const entries = await repository.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      localId: 'plan-1',
      status: 'draft',
      site: { name: 'Edited Reef' },
      objective: 'Line practice',
    });
    expect(root.findByProps({ testID: 'planning-plan-row-Edited Reef' })).toBeTruthy();
  });

  it('delegates plan detail and creation to the app route when provided', async () => {
    const onCreatePlan = jest.fn();
    const onOpenPlan = jest.fn();
    const repository = new LocalDivePlanRepository([
      plan({
        localId: 'plan-1',
        status: 'planned',
        title: 'Route plan',
        site: { name: 'Route Reef' },
      }),
    ]);
    const renderer = await renderPlanning(repository, { onCreatePlan, onOpenPlan });
    const root = renderer.root;

    await press(root, 'planning-create-action');
    expect(onCreatePlan).toHaveBeenCalledTimes(1);
    expect(root.findAllByProps({ testID: 'planning-editor-title' })).toHaveLength(0);

    await press(root, 'planning-plan-row-Route Reef');
    expect(onOpenPlan).toHaveBeenCalledWith(expect.objectContaining({ localId: 'plan-1' }));
    expect(root.findAllByProps({ testID: 'planning-detail-edit' })).toHaveLength(0);
  });

  it('completes a plan and lets the user choose Later', async () => {
    const dateNow = jest.spyOn(Date, 'now').mockReturnValue(1781356000 * 1000);
    const repository = new LocalDivePlanRepository(
      [
        plan({
          localId: 'plan-1',
          status: 'planned',
          plannedAt: 1781355000,
          site: { name: 'Complete Reef' },
        }),
      ],
      { now: () => 1781356000 },
    );
    const renderer = await renderPlanning(repository);
    const root = renderer.root;

    await press(root, 'planning-plan-row-Complete Reef');
    await press(root, 'planning-detail-complete');
    expect(root.findByProps({ testID: 'planning-complete-dialog' })).toBeTruthy();
    await press(root, 'planning-complete-later');

    const [savedPlan] = await repository.list();
    expect(savedPlan.status).toBe('completed');
    expect(savedPlan.completedAt).toBe(1781356000);
    expect(() => root.findByProps({ testID: 'planning-complete-dialog' })).toThrow();

    dateNow.mockRestore();
  });

  it('creates a log draft from a completed plan through the callback', async () => {
    const onCreateLogFromPlan = jest.fn();
    const repository = new LocalDivePlanRepository([
      plan({
        localId: 'plan-1',
        status: 'completed',
        completedAt: 1781356000,
        site: { name: 'Log Reef' },
        diveMode: 'scuba',
        entryStyle: 'boat',
      }),
    ]);
    const renderer = await renderPlanning(repository, onCreateLogFromPlan);
    const root = renderer.root;

    await press(root, 'planning-plan-row-Log Reef');
    await press(root, 'planning-detail-create-log');

    expect(onCreateLogFromPlan).toHaveBeenCalledTimes(1);
    expect(onCreateLogFromPlan.mock.calls[0][0]).toMatchObject({
      localId: 'plan-1',
      status: 'completed',
      site: { name: 'Log Reef' },
    });
  });

});
