import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import { LocalDiveLogRepository } from '../src/repositories/local-dive-log-repository';
import LogbookScreen from '../src/screens/logbook/screen';
import { useDiveLogbook } from '../src/states/use-dive-logbook';
import type { DiveLogEntry } from '../src/types/dive-log-entry';
import type { WatchSession } from '../src/types/dive-session';
import { createBlankDiveLogEntry } from '../src/utils/create-dive-log-entry';
import { watchSessionToDiveLogEntry } from '../src/utils/watch-session-to-dive-log-entry';

class ToggleFailSaveRepository extends LocalDiveLogRepository {
  shouldFailSave = true;

  async save(entry: DiveLogEntry): Promise<DiveLogEntry> {
    if (this.shouldFailSave) {
      throw new Error('local save unavailable');
    }

    return super.save(entry);
  }
}

const watchEntry = watchSessionToDiveLogEntry({
  now: 1781353000,
  session: {
    localSessionId: 'watch-entry-1',
    schemaVersion: 1,
    siteName: 'Watch Reef',
    syncStatus: 'pending',
    startedAt: 1781352000,
    endedAt: 1781352600,
    maxDepthMeters: 12,
    averageDepthMeters: 7,
    diveMode: 'scuba',
    samples: [],
  } satisfies WatchSession,
});

const manualEntry = createBlankDiveLogEntry({ localId: 'manual-entry-1', now: 1781351000 });
manualEntry.manual = {
  ...manualEntry.manual,
  site: { name: 'Manual Reef' },
  buddyIds: ['Jin'],
  tags: ['shore'],
  observedMarineLife: ['octopus'],
  notes: 'Manual review note.',
  rating: 4,
  measuredValues: {
    startedAt: 1781350200,
    durationSeconds: 2400,
    maxDepthMeters: 18,
    diveMode: 'freedive',
  },
};

const manualEntryWithoutMetrics = createBlankDiveLogEntry({ localId: 'manual-entry-no-metrics', now: 1781351000 });
manualEntryWithoutMetrics.manual = {
  ...manualEntryWithoutMetrics.manual,
  site: { name: 'No Metrics Reef' },
  measuredValues: {
    startedAt: 1781350200,
    diveMode: 'scuba',
  },
};

const scubaEntry = createBlankDiveLogEntry({ localId: 'manual-entry-scuba', now: 1781351000 });
scubaEntry.manual = {
  ...scubaEntry.manual,
  site: { name: 'Scuba Metadata Reef' },
  gearIds: ['bcd-1', 'computer-1'],
  measuredValues: {
    startedAt: 1781350200,
    durationSeconds: 2700,
    maxDepthMeters: 20,
    diveMode: 'scuba',
    gasLabel: 'EAN32',
    waterCondition: 'mild',
    visibilityRating: 4,
    perceivedExertion: 3,
  },
};

const poolEntry = createBlankDiveLogEntry({ localId: 'manual-entry-pool', now: 1781351000 });
poolEntry.manual = {
  ...poolEntry.manual,
  site: { name: 'Pool Metadata Session' },
  measuredValues: {
    startedAt: 1781350200,
    durationSeconds: 1800,
    diveMode: 'pool',
    poolLengthMeters: 25,
    lapCount: 18,
    trainingFocus: 'streamline practice',
  },
};

const hybridWatchEntry: DiveLogEntry = {
  ...watchEntry,
  localId: 'watch-entry-hybrid',
  manual: {
    ...watchEntry.manual,
    site: { name: 'Hybrid Reef' },
    measuredValues: {
      ...watchEntry.manual.measuredValues,
      maxDepthMeters: 19,
    },
  },
  provenance: {
    ...watchEntry.provenance,
    maxDepthMeters: 'manual',
  },
};

type HarnessProps = {
  repository: LocalDiveLogRepository;
};

const queryClients: QueryClient[] = [];
const renderers: ReactTestRenderer.ReactTestRenderer[] = [];

function Harness({ repository }: HarnessProps): React.JSX.Element {
  const logbook = useDiveLogbook({ repository, queryScope: 'manual-entry-test' });

  return (
    <LogbookScreen
      entries={logbook.filteredEntries}
      filter={logbook.filter}
      onFilterChange={logbook.setFilter}
      onImportFixtures={logbook.importFixtures}
      onSaveEntry={logbook.saveEntry}
      onDeleteEntry={logbook.deleteEntry}
      saveError={logbook.saveError}
      isSaving={logbook.isSaving}
    />
  );
}

const renderLogbook = async (repository: LocalDiveLogRepository) => {
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
        <Harness repository={repository} />
      </QueryClientProvider>,
    );
  });

  renderers.push(renderer!);
  return renderer!;
};

const changeText = async (root: ReactTestRenderer.ReactTestInstance, testID: string, value: string) => {
  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID }).props.onChangeText(value);
  });
};

const press = async (root: ReactTestRenderer.ReactTestInstance, testID: string) => {
  await ReactTestRenderer.act(async () => {
    await root.findByProps({ testID }).props.onPress();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
};

const fillManualDraft = async (
  root: ReactTestRenderer.ReactTestInstance,
  overrides: Partial<Record<string, string>> = {},
  mode: NonNullable<WatchSession['diveMode']> = 'freedive',
) => {
  const values = {
    'log-entry-editor-started-at': '2026-06-20 09:30',
    'log-entry-editor-site-name': 'Blue Corner',
    'log-entry-editor-duration': '47',
    'log-entry-editor-max-depth': '18.6',
    'log-entry-editor-buddies': 'Mina, Alex',
    'log-entry-editor-tags': 'reef, training',
    'log-entry-editor-marine-life': 'turtle, nudibranch',
    'log-entry-editor-notes': 'Calm review dive with clear water.',
    'log-entry-editor-rating': '5',
    ...overrides,
  };

  for (const [testID, value] of Object.entries(values)) {
    if (root.findAllByProps({ testID }).length > 0) {
      await changeText(root, testID, value);
    }
  }

  await press(root, `log-entry-editor-mode-${mode}`);
};

describe('Logbook manual entry flow', () => {
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

  test('create action opens the manual editor', async () => {
    const renderer = await renderLogbook(new LocalDiveLogRepository([]));
    const root = renderer.root;

    await press(root, 'logbook-create-action');

    expect(root.findByProps({ testID: 'log-entry-editor-site-name' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-editor-save' })).toBeTruthy();
  });

  test('saves manual local-only entries through the repository flow and lists them with watch entries', async () => {
    const repository = new LocalDiveLogRepository([watchEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-create-action');
    await fillManualDraft(root);
    await press(root, 'log-entry-editor-save');

    const entries = await repository.list();
    const savedEntry = entries.find(entry => entry.source === 'manual');

    expect(savedEntry).toMatchObject({
      source: 'manual',
      syncStatus: 'localOnly',
      manual: {
        site: { name: 'Blue Corner' },
        buddyIds: ['Mina', 'Alex'],
        tags: ['reef', 'training'],
        observedMarineLife: ['turtle', 'nudibranch'],
        notes: 'Calm review dive with clear water.',
        rating: 5,
        measuredValues: {
          durationSeconds: 2820,
          maxDepthMeters: 18.6,
          diveMode: 'freedive',
        },
      },
    });
    expect(root.findByProps({ testID: 'logbook-list-item-Watch Reef' })).toBeTruthy();
    expect(root.findByProps({ testID: 'logbook-list-item-Blue Corner' })).toBeTruthy();
  });

  test('keeps blank manual numeric fields undefined instead of saving zero', async () => {
    const repository = new LocalDiveLogRepository([]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-create-action');
    await fillManualDraft(root, {
      'log-entry-editor-site-name': 'Blank Metrics Reef',
      'log-entry-editor-duration': '   ',
      'log-entry-editor-max-depth': '',
      'log-entry-editor-rating': ' ',
    });
    await press(root, 'log-entry-editor-save');

    const savedEntry = (await repository.list()).find(entry => entry.manual.site.name === 'Blank Metrics Reef');

    expect(savedEntry?.manual.measuredValues.durationSeconds).toBeUndefined();
    expect(savedEntry?.manual.measuredValues.maxDepthMeters).toBeUndefined();
    expect(savedEntry?.manual.rating).toBeUndefined();
  });

  test('keeps invalid manual numeric fields undefined instead of saving corrupted values', async () => {
    const repository = new LocalDiveLogRepository([]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-create-action');
    await fillManualDraft(root, {
      'log-entry-editor-site-name': 'Invalid Metrics Reef',
      'log-entry-editor-duration': '-5',
      'log-entry-editor-max-depth': '-18',
      'log-entry-editor-rating': '3.5',
    });
    await press(root, 'log-entry-editor-save');

    const savedEntry = (await repository.list()).find(entry => entry.manual.site.name === 'Invalid Metrics Reef');

    expect(savedEntry?.manual.measuredValues.durationSeconds).toBeUndefined();
    expect(savedEntry?.manual.measuredValues.maxDepthMeters).toBeUndefined();
    expect(savedEntry?.manual.rating).toBeUndefined();
  });

  test('list rows show unknown placeholders for manual logs with blank metrics', async () => {
    const repository = new LocalDiveLogRepository([manualEntryWithoutMetrics]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    expect(root.findByProps({ testID: 'logbook-list-max-depth-No Metrics Reef---.-m' })).toBeTruthy();
    expect(root.findByProps({ testID: 'logbook-list-duration-No Metrics Reef---:--' })).toBeTruthy();
  });

  test('detail distinguishes manual values from watch-captured values', async () => {
    const repository = new LocalDiveLogRepository([watchEntry, manualEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-Manual Reef');
    expect(root.findByProps({ testID: 'log-entry-detail-provenance-max-depth-manual' })).toBeTruthy();

    await press(root, 'log-entry-detail-back');
    await press(root, 'logbook-list-item-Watch Reef');
    expect(root.findByProps({ testID: 'log-entry-detail-provenance-max-depth-watch' })).toBeTruthy();
  });

  test('detail shows unknown placeholders for missing manual measurements', async () => {
    const repository = new LocalDiveLogRepository([manualEntryWithoutMetrics]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-No Metrics Reef');

    expect(root.findByProps({ testID: 'log-entry-detail-max-depth-value---.-m' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-detail-duration-value---:--' })).toBeTruthy();
  });

  test('detail displays manual measured values when provenance is manual on a watch entry', async () => {
    const repository = new LocalDiveLogRepository([hybridWatchEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-Hybrid Reef');

    expect(root.findByProps({ testID: 'log-entry-detail-provenance-max-depth-manual' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-detail-max-depth-value-19.0m' })).toBeTruthy();
  });

  test('returns to useful list content when filtering removes the selected detail entry', async () => {
    const repository = new LocalDiveLogRepository([watchEntry, manualEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-Manual Reef');
    await changeText(root, 'logbook-search-input', 'no matching reef');

    expect(root.findByProps({ testID: 'logbook-empty-state' })).toBeTruthy();
  });

  test('failed local save shows an error and allows retrying the same draft', async () => {
    const repository = new ToggleFailSaveRepository([]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-create-action');
    await fillManualDraft(root, {
      'log-entry-editor-site-name': 'Retry Reef',
    });
    await press(root, 'log-entry-editor-save');

    expect(await repository.list()).toHaveLength(0);
    expect(root.findByProps({ testID: 'log-entry-editor-error' }).props.children).toBe('Could not save this log locally. Try again.');

    repository.shouldFailSave = false;
    await press(root, 'log-entry-editor-save');

    expect((await repository.list()).find(entry => entry.manual.site.name === 'Retry Reef')).toBeTruthy();
    expect(root.findByProps({ testID: 'logbook-list-item-Retry Reef' })).toBeTruthy();
  });

  test('edits an existing manual entry without creating a duplicate', async () => {
    const repository = new LocalDiveLogRepository([manualEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-Manual Reef');
    await press(root, 'log-entry-detail-edit');
    expect(root.findByProps({ testID: 'log-entry-editor-title' }).props.children).toBe('Edit dive log');
    await changeText(root, 'log-entry-editor-site-name', 'Edited Manual Reef');
    await changeText(root, 'log-entry-editor-notes', 'Updated after reviewing the dive.');
    await press(root, 'log-entry-editor-save');

    const entries = await repository.list();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      localId: 'manual-entry-1',
      manual: {
        site: { name: 'Edited Manual Reef' },
        notes: 'Updated after reviewing the dive.',
      },
    });
    expect(root.findByProps({ testID: 'logbook-list-item-Edited Manual Reef' })).toBeTruthy();
  });

  test('edits a watch-backed entry without losing watch capture provenance', async () => {
    const repository = new LocalDiveLogRepository([watchEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-Watch Reef');
    await press(root, 'log-entry-detail-edit');
    expect(root.findByProps({ testID: 'log-entry-editor-duration' }).props.value).toBe('10');
    expect(root.findByProps({ testID: 'log-entry-editor-max-depth' }).props.value).toBe('12');
    await changeText(root, 'log-entry-editor-site-name', 'Edited Watch Reef');
    await changeText(root, 'log-entry-editor-notes', 'Reviewed on mobile.');
    await press(root, 'log-entry-editor-save');

    const entries = await repository.list();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      localId: 'watch:watch-entry-1:1781352600',
      source: 'watch',
      syncStatus: 'pending',
      manual: {
        site: { name: 'Edited Watch Reef' },
        notes: 'Reviewed on mobile.',
      },
    });
    expect(entries[0].watchCapture?.importKey).toBe('watch-entry-1:1781352600');
    expect(entries[0].manual.measuredValues.startedAt).toBeUndefined();
    expect(entries[0].manual.measuredValues.durationSeconds).toBeUndefined();
    expect(entries[0].manual.measuredValues.maxDepthMeters).toBeUndefined();
    expect(entries[0].provenance.startedAt).toBe('watch');
    expect(entries[0].provenance.durationSeconds).toBe('watch');
    expect(entries[0].provenance.maxDepthMeters).toBe('watch');
  });

  test('edits a watch-backed metric as a manual override without changing untouched watch metrics', async () => {
    const repository = new LocalDiveLogRepository([watchEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-Watch Reef');
    await press(root, 'log-entry-detail-edit');
    await changeText(root, 'log-entry-editor-max-depth', '15.5');
    await press(root, 'log-entry-editor-save');

    const [savedEntry] = await repository.list();

    expect(savedEntry.manual.measuredValues.maxDepthMeters).toBe(15.5);
    expect(savedEntry.manual.measuredValues.durationSeconds).toBeUndefined();
    expect(savedEntry.provenance.maxDepthMeters).toBe('manual');
    expect(savedEntry.provenance.durationSeconds).toBe('watch');
  });

  test('saves scuba-specific fields from the scuba form section', async () => {
    const repository = new LocalDiveLogRepository([]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-create-action');
    await fillManualDraft(root, {
      'log-entry-editor-site-name': 'Scuba Wall',
    }, 'scuba');
    await changeText(root, 'log-entry-editor-gas-label', 'EAN32');
    await changeText(root, 'log-entry-editor-gear', 'bcd-1, computer-1');
    await press(root, 'log-entry-editor-water-condition-mild');
    await changeText(root, 'log-entry-editor-visibility-rating', '4');
    await changeText(root, 'log-entry-editor-perceived-exertion', '3');
    await press(root, 'log-entry-editor-save');

    const savedEntry = (await repository.list()).find(entry => entry.manual.site.name === 'Scuba Wall');

    expect(savedEntry).toMatchObject({
      manual: {
        gearIds: ['bcd-1', 'computer-1'],
        measuredValues: {
          diveMode: 'scuba',
          gasLabel: 'EAN32',
          waterCondition: 'mild',
          visibilityRating: 4,
          perceivedExertion: 3,
        },
      },
    });
  });

  test('switches to a freedive form and does not persist hidden scuba-only fields', async () => {
    const repository = new LocalDiveLogRepository([]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-create-action');
    await press(root, 'log-entry-editor-mode-scuba');
    await changeText(root, 'log-entry-editor-gas-label', 'Air');
    await press(root, 'log-entry-editor-mode-freedive');

    expect(root.findByProps({ testID: 'log-entry-editor-repetition-count' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-editor-training-focus' })).toBeTruthy();
    expect(() => root.findByProps({ testID: 'log-entry-editor-gas-label' })).toThrow();

    await fillManualDraft(root, {
      'log-entry-editor-site-name': 'Line Session',
      'log-entry-editor-max-depth': '21',
    }, 'freedive');
    await changeText(root, 'log-entry-editor-repetition-count', '8');
    await changeText(root, 'log-entry-editor-training-focus', 'constant weight technique');
    await press(root, 'log-entry-editor-save');

    const savedEntry = (await repository.list()).find(entry => entry.manual.site.name === 'Line Session');

    expect(savedEntry?.manual.gearIds).toEqual([]);
    expect(savedEntry?.manual.measuredValues).toMatchObject({
      diveMode: 'freedive',
      maxDepthMeters: 21,
      repetitionCount: 8,
      trainingFocus: 'constant weight technique',
    });
    expect(savedEntry?.manual.measuredValues.gasLabel).toBeUndefined();
  });

  test('shows a pool-specific form without depth fields and saves pool metrics', async () => {
    const repository = new LocalDiveLogRepository([]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-create-action');
    await press(root, 'log-entry-editor-mode-pool');

    expect(root.findByProps({ testID: 'log-entry-editor-pool-length' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-editor-lap-count' })).toBeTruthy();
    expect(() => root.findByProps({ testID: 'log-entry-editor-max-depth' })).toThrow();

    await fillManualDraft(root, {
      'log-entry-editor-site-name': 'Training Pool',
      'log-entry-editor-duration': '35',
    }, 'pool');
    await changeText(root, 'log-entry-editor-pool-length', '25');
    await changeText(root, 'log-entry-editor-lap-count', '20');
    await changeText(root, 'log-entry-editor-training-focus', 'finning drills');
    await press(root, 'log-entry-editor-save');

    const savedEntry = (await repository.list()).find(entry => entry.manual.site.name === 'Training Pool');

    expect(savedEntry?.manual.measuredValues).toMatchObject({
      diveMode: 'pool',
      durationSeconds: 2100,
      poolLengthMeters: 25,
      lapCount: 20,
      trainingFocus: 'finning drills',
    });
    expect(savedEntry?.manual.measuredValues.maxDepthMeters).toBeUndefined();
  });

  test('detail displays scuba-specific metadata', async () => {
    const repository = new LocalDiveLogRepository([scubaEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-Scuba Metadata Reef');

    expect(root.findByProps({ testID: 'log-entry-detail-mode-value-gas-label-EAN32' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-detail-mode-value-gear-bcd-1,computer-1' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-detail-mode-value-water-condition-mild' })).toBeTruthy();
  });

  test('detail displays pool-specific metadata without a max-depth value', async () => {
    const repository = new LocalDiveLogRepository([poolEntry]);
    const renderer = await renderLogbook(repository);
    const root = renderer.root;

    await press(root, 'logbook-list-item-Pool Metadata Session');

    expect(root.findByProps({ testID: 'log-entry-detail-max-depth-value---.-m' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-detail-mode-value-pool-length-25.0m' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-detail-mode-value-lap-count-18' })).toBeTruthy();
    expect(root.findByProps({ testID: 'log-entry-detail-mode-value-training-focus-streamlinepractice' })).toBeTruthy();
  });
});
