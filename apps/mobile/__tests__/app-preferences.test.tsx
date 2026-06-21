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

describe('app preferences', () => {
  beforeEach(async () => {
    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('ko');
    });
  });

  test('resolves theme preferences with a light fallback for system mode', () => {
    expect(resolveThemePreference('light', 'dark')).toBe('light');
    expect(resolveThemePreference('dark', 'light')).toBe('dark');
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
});
