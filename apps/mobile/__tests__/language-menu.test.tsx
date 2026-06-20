import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import HomeScreen from '../src/screens/home/screen';

describe('language menu', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ko');
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
});
