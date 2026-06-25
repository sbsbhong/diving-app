import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import {
  AppPreferencesProvider,
  resolveThemePreference,
  useAppPreferences,
  type AppPreferences,
} from '../src/states/app-preferences';
import { createAppPreferencesStorage } from '../src/states/app-preferences-storage';
import { InMemoryKeyValueStore } from '../src/storage/in-memory-key-value-store';

function Probe(props: { onValue: (value: AppPreferences) => void }): React.JSX.Element {
  const preferences = useAppPreferences();

  React.useEffect(() => {
    props.onValue(preferences);
  }, [preferences, props]);

  return (
    <Text testID="preferences-probe">
      {`${preferences.themePreference}:${preferences.resolvedTheme}:${preferences.language}:${preferences.watchSyncNotificationsEnabled}`}
    </Text>
  );
}

function OutsideProviderProbe(): React.JSX.Element {
  useAppPreferences();

  return <Text testID="outside-provider-probe">outside provider</Text>;
}

describe('app preferences', () => {
  beforeEach(async () => {
    const asyncStorageMock = jest.requireMock('@react-native-async-storage/async-storage') as {
      __resetAsyncStorageMock: () => void;
    };

    asyncStorageMock.__resetAsyncStorageMock();

    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('ko');
    });
  });

  test('resolves theme preferences with a light fallback for system mode', () => {
    expect(resolveThemePreference('light', 'light')).toBe('light');
    expect(resolveThemePreference('light', 'dark')).toBe('light');
    expect(resolveThemePreference('light', null)).toBe('light');
    expect(resolveThemePreference('light', undefined)).toBe('light');
    expect(resolveThemePreference('dark', 'dark')).toBe('dark');
    expect(resolveThemePreference('dark', 'light')).toBe('dark');
    expect(resolveThemePreference('dark', null)).toBe('dark');
    expect(resolveThemePreference('dark', undefined)).toBe('dark');
    expect(resolveThemePreference('system', 'dark')).toBe('dark');
    expect(resolveThemePreference('system', 'light')).toBe('light');
    expect(resolveThemePreference('system', null)).toBe('light');
    expect(resolveThemePreference('system', undefined)).toBe('light');
  });

  test('exposes default in-memory settings and applies runtime updates', async () => {
    const snapshots: AppPreferences[] = [];
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider>
          <Probe onValue={value => snapshots.push(value)} />
        </AppPreferencesProvider>,
      );
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko:false');

    const current = snapshots[snapshots.length - 1];

    await ReactTestRenderer.act(async () => {
      current.setThemePreference('dark');
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:ko:false');

    await ReactTestRenderer.act(async () => {
      await snapshots[snapshots.length - 1].setLanguage('en');
    });

    expect(i18n.language).toBe('en');
    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:en:false');
  });

  test('tracks language changes emitted outside the preferences setter', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider>
          <Probe onValue={jest.fn()} />
        </AppPreferencesProvider>,
      );
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko:false');

    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('en');
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:en:false');
  });

  test('keeps the current language when a language change rejects', async () => {
    const snapshots: AppPreferences[] = [];
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider>
          <Probe onValue={value => snapshots.push(value)} />
        </AppPreferencesProvider>,
      );
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko:false');

    const changeLanguageSpy = jest
      .spyOn(i18n, 'changeLanguage')
      .mockRejectedValueOnce(new Error('language change failed'));

    try {
      await expect(
        ReactTestRenderer.act(async () => {
          await snapshots[snapshots.length - 1].setLanguage('en');
        }),
      ).resolves.toBeUndefined();

      expect(i18n.language).toBe('ko');
      expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko:false');
    } finally {
      changeLanguageSpy.mockRestore();
    }
  });

  test('requires the preferences provider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      expect(() => {
        ReactTestRenderer.act(() => {
          ReactTestRenderer.create(<OutsideProviderProbe />);
        });
      }).toThrow('useAppPreferences must be used within AppPreferencesProvider');
    } finally {
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    }
  });

  test('restores saved preferences from persistent storage', async () => {
    const storage = createAppPreferencesStorage({ storage: new InMemoryKeyValueStore(), now: () => 1000 });
    await storage.save({ themePreference: 'dark', language: 'en', watchSyncNotificationsEnabled: true });
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider storage={storage}>
          <Probe onValue={jest.fn()} />
        </AppPreferencesProvider>,
      );
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:en:true');
    expect(i18n.language).toBe('en');
  });

  test('persists runtime preference changes', async () => {
    const storage = createAppPreferencesStorage({ storage: new InMemoryKeyValueStore(), now: () => 1000 });
    const snapshots: AppPreferences[] = [];
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider storage={storage}>
          <Probe onValue={value => snapshots.push(value)} />
        </AppPreferencesProvider>,
      );
    });

    await ReactTestRenderer.act(async () => {
      snapshots[snapshots.length - 1].setThemePreference('dark');
    });
    await ReactTestRenderer.act(async () => {
      await snapshots[snapshots.length - 1].setLanguage('en');
    });
    await ReactTestRenderer.act(async () => {
      await snapshots[snapshots.length - 1].setWatchSyncNotificationsEnabled(true);
    });

    expect(await storage.load()).toEqual({
      themePreference: 'dark',
      language: 'en',
      watchSyncNotificationsEnabled: true,
    });
    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:en:true');
  });

  test('does not persist a language selection when i18next rejects it', async () => {
    const storage = createAppPreferencesStorage({ storage: new InMemoryKeyValueStore(), now: () => 1000 });
    const snapshots: AppPreferences[] = [];
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider storage={storage}>
          <Probe onValue={value => snapshots.push(value)} />
        </AppPreferencesProvider>,
      );
    });

    const changeLanguageSpy = jest
      .spyOn(i18n, 'changeLanguage')
      .mockRejectedValueOnce(new Error('language change failed'));

    try {
      await ReactTestRenderer.act(async () => {
        await snapshots[snapshots.length - 1].setLanguage('en');
      });

      expect(await storage.load()).toEqual({
        themePreference: 'system',
        language: 'ko',
        watchSyncNotificationsEnabled: false,
      });
      expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko:false');
    } finally {
      changeLanguageSpy.mockRestore();
    }
  });
});
