import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import { HStack } from '../src/components/ui/hstack';
import { AppPreferencesProvider } from '../src/states/app-preferences';
import SettingsScreen from '../src/screens/settings/screen';
import type { LinkedWatchInfo } from '../src/native/watch-connectivity';

const linkedWatchInfo: LinkedWatchInfo = {
  isSupported: true,
  isPaired: true,
  isWatchAppInstalled: true,
  isReachable: true,
  name: 'Seongbin Apple Watch',
};

const renderSettings = async (options?: { loadLinkedWatchInfo?: () => Promise<LinkedWatchInfo> }) => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AppPreferencesProvider>
        <SettingsScreen loadLinkedWatchInfo={options?.loadLinkedWatchInfo ?? (() => Promise.resolve(linkedWatchInfo))} />
      </AppPreferencesProvider>,
    );
  });

  return renderer!;
};

describe('SettingsScreen', () => {
  beforeEach(async () => {
    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('ko');
    });
  });

  test('renders grouped Settings rows with current values', async () => {
    const renderer = await renderSettings();
    const root = renderer.root;

    expect(root.findByProps({ testID: 'settings-screen-title' }).props.children).toBe('설정');
    expect(root.findByProps({ testID: 'settings-current-theme' }).props.children).toBe('시스템 기본값');
    expect(root.findByProps({ testID: 'settings-current-language' }).props.children).toBe('한국어');
  });

  test('shows linked watch in device management with icon and status', async () => {
    const renderer = await renderSettings();
    const root = renderer.root;

    expect(root.findByProps({ testID: 'settings-section-devices' }).props.children).toBe('기기 관리');
    expect(root.findByProps({ testID: 'settings-linked-watch-icon' })).toBeTruthy();
    expect(root.findByProps({ testID: 'settings-linked-watch-name' }).props.children).toBe('Seongbin Apple Watch');
    expect(root.findByProps({ testID: 'settings-linked-watch-status' }).props.children).toBe('연결됨');
  });

  test('explains when no watch is paired', async () => {
    const renderer = await renderSettings({
      loadLinkedWatchInfo: () =>
        Promise.resolve({
          isSupported: true,
          isPaired: false,
          isWatchAppInstalled: false,
          isReachable: false,
        }),
    });
    const root = renderer.root;

    expect(root.findByProps({ testID: 'settings-linked-watch-name' }).props.children).toBe('Apple Watch');
    expect(root.findByProps({ testID: 'settings-linked-watch-status' }).props.children).toBe('연동된 워치 없음');
  });

  test('stretches index row content so labels and values sit at opposite edges', async () => {
    const renderer = await renderSettings();
    const root = renderer.root;

    const indexRows = root
      .findAllByType(HStack)
      .filter(node => typeof node.props.className === 'string' && node.props.className.includes('justify-between'));

    expect(indexRows).toHaveLength(2);
    indexRows.forEach(row => {
      expect(row.props.className).toEqual(expect.stringContaining('flex-1'));
    });
  });

  test('opens theme detail and applies the selected theme in memory', async () => {
    const renderer = await renderSettings();
    const root = renderer.root;

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'settings-row-theme' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'settings-detail-title' }).props.children).toBe('테마');
    expect(root.findByProps({ testID: 'settings-option-theme-system' }).props.accessibilityState.selected).toBe(true);

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'settings-option-theme-dark' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'settings-option-theme-dark' }).props.accessibilityState.selected).toBe(true);

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'settings-back' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'settings-current-theme' }).props.children).toBe('다크');
  });

  test('opens language detail and changes the active language', async () => {
    const renderer = await renderSettings();
    const root = renderer.root;

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'settings-row-language' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'settings-detail-title' }).props.children).toBe('언어');
    expect(root.findByProps({ testID: 'settings-option-language-ko' }).props.accessibilityState.selected).toBe(true);

    await ReactTestRenderer.act(async () => {
      await root.findByProps({ testID: 'settings-option-language-en' }).props.onPress();
    });

    expect(i18n.language).toBe('en');
    expect(root.findByProps({ testID: 'settings-detail-title' }).props.children).toBe('Language');
    expect(root.findByProps({ testID: 'settings-option-language-en' }).props.accessibilityState.selected).toBe(true);
  });
});
