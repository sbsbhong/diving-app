import type { DivePlan } from '../src/types/dive-plan';

const basePlan = (overrides: Partial<DivePlan>): DivePlan => ({
  localId: 'plan',
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

describe('updatePlannedWatchDives', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('react-native');
  });

  it('sends unexecuted draft and planned dives to the watch companion', async () => {
    const updatePlannedDives = jest.fn().mockResolvedValue(undefined);

    jest.doMock('react-native', () => ({
      NativeEventEmitter: jest.fn(),
      NativeModules: {
        WatchConnectivityModule: {
          updatePlannedDives,
          addListener: jest.fn(),
          removeListeners: jest.fn(),
        },
      },
      Platform: { OS: 'ios' },
    }));

    const { updatePlannedWatchDives } = require('../src/native/watch-connectivity') as typeof import('../src/native/watch-connectivity');

    await updatePlannedWatchDives([
      basePlan({ localId: 'draft-plan', status: 'draft', title: 'Draft plan' }),
      basePlan({ localId: 'planned-plan', status: 'planned', title: 'Planned plan' }),
      basePlan({ localId: 'completed-plan', status: 'completed', title: 'Completed plan' }),
      basePlan({ localId: 'converted-plan', status: 'planned', convertedLogLocalId: 'log-1' }),
    ]);

    expect(updatePlannedDives).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(updatePlannedDives.mock.calls[0][0]) as Array<{ localId: string }>;
    expect(payload.map(plan => plan.localId)).toEqual(['draft-plan', 'planned-plan']);
  });
});
