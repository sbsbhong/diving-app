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

function Probe(props: { onValue: (value: AppPreferences) => void }): React.JSX.Element {
  const preferences = useAppPreferences();

  React.useEffect(() => {
    props.onValue(preferences);
  }, [preferences, props]);

  return (
    <Text testID="preferences-probe">
      {`${preferences.themePreference}:${preferences.resolvedTheme}:${preferences.language}`}
    </Text>
  );
}

function OutsideProviderProbe(): React.JSX.Element {
  useAppPreferences();

  return <Text testID="outside-provider-probe">outside provider</Text>;
}

describe('app preferences', () => {
  beforeEach(async () => {
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

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko');

    const current = snapshots[snapshots.length - 1];

    await ReactTestRenderer.act(async () => {
      current.setThemePreference('dark');
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:ko');

    await ReactTestRenderer.act(async () => {
      await snapshots[snapshots.length - 1].setLanguage('en');
    });

    expect(i18n.language).toBe('en');
    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:en');
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

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko');

    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('en');
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:en');
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

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko');

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
      expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko');
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
});
