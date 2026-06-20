import React from 'react';
import { StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import HomeScreen from '../src/screens/home/screen';

const resolveStyle = (style: unknown) => {
  const styleValue =
    typeof style === 'function' ? (style as (state: { pressed: boolean }) => unknown)({ pressed: false }) : style;

  return StyleSheet.flatten(styleValue);
};

describe('language menu', () => {
  beforeEach(async () => {
    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('ko');
    });
  });

  test('opens from Home and switches the active language to English', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HomeScreen sessions={[]} onOpenLogbook={jest.fn()} onOpenPlanning={jest.fn()} onOpenMemory={jest.fn()} />,
      );
    });

    const root = renderer!.root;

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'language-menu-trigger' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'language-option-ko' }).props.accessibilityState.selected).toBe(true);
    expect(root.findByProps({ testID: 'language-option-en' }).props.accessibilityState.selected).toBe(false);

    await ReactTestRenderer.act(async () => {
      await root.findByProps({ testID: 'language-option-en' }).props.onPress();
    });

    expect(i18n.language).toBe('en');
    expect(i18n.t('navigation.home')).toBe('Home');
  });

  test('renders the language mark with horizontal padding', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HomeScreen sessions={[]} onOpenLogbook={jest.fn()} onOpenPlanning={jest.fn()} onOpenMemory={jest.fn()} />,
      );
    });

    const root = renderer!.root;

    expect(resolveStyle(root.findByProps({ testID: 'language-mark-trigger' }).props.style)).toEqual(
      expect.objectContaining({ paddingHorizontal: 6 }),
    );
  });

  test('centers the trigger content in its pressable area', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HomeScreen sessions={[]} onOpenLogbook={jest.fn()} onOpenPlanning={jest.fn()} onOpenMemory={jest.fn()} />,
      );
    });

    const root = renderer!.root;
    const triggerStyle = resolveStyle(root.findByProps({ testID: 'language-menu-trigger' }).props.style);

    expect(triggerStyle).toEqual(expect.objectContaining({ alignItems: 'center', justifyContent: 'center' }));
  });

  test('keeps menu option backgrounds clipped to rounded rows', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <HomeScreen sessions={[]} onOpenLogbook={jest.fn()} onOpenPlanning={jest.fn()} onOpenMemory={jest.fn()} />,
      );
    });

    const root = renderer!.root;

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'language-menu-trigger' }).props.onPress();
    });

    const optionStyle = resolveStyle(root.findByProps({ testID: 'language-option-ko' }).props.style);

    expect(optionStyle).toEqual(expect.objectContaining({ borderRadius: 12, overflow: 'hidden' }));
  });
});
