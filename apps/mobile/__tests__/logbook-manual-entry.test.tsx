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
      sessions={logbook.filteredSessions}
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

const fillManualDraft = async (root: ReactTestRenderer.ReactTestInstance, overrides: Partial<Record<string, string>> = {}) => {
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
    await changeText(root, testID, value);
  }

  await press(root, 'log-entry-editor-mode-freedive');
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
});
