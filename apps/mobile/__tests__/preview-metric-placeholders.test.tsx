import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import HomeScreen from '../src/screens/home/screen';
import MemoryScreen from '../src/screens/memory/screen';
import { AppPreferencesProvider } from '../src/states/app-preferences';
import type { MobileDiveSession } from '../src/types/dive-session';

jest.mock('react-native-reanimated', () => {
  const createAnimation = () => {
    const animation = {} as {
      duration: jest.Mock;
      withInitialValues: jest.Mock;
    };

    animation.duration = jest.fn(() => animation);
    animation.withInitialValues = jest.fn(() => animation);

    return animation;
  };

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (component: React.ComponentType) => component,
    },
    FadeOut: createAnimation(),
    ZoomIn: createAnimation(),
  };
});

const blankManualSession: MobileDiveSession = {
  localSessionId: 'manual-entry-no-metrics',
  startedAt: 1781350200,
  samples: [],
  importKey: 'manual-entry-no-metrics',
  importedAt: 1781351000,
  mediaPlaceholders: [],
  siteName: 'No Metrics Reef',
  tags: [],
};

const collectText = (node: ReactTestRenderer.ReactTestRendererJSON | ReactTestRenderer.ReactTestRendererJSON[] | string | null): string[] => {
  if (!node) {
    return [];
  }

  if (typeof node === 'string') {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  return node.children?.flatMap(collectText) ?? [];
};

describe('preview metric placeholders', () => {
  beforeEach(async () => {
    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  test('Home preview keeps unknown manual duration and depth as placeholders', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider>
          <HomeScreen sessions={[blankManualSession]} onOpenLogbook={jest.fn()} onOpenPlanning={jest.fn()} />
        </AppPreferencesProvider>,
      );
    });

    const text = collectText(renderer!.toJSON());

    expect(text).toContain('--.- m');
    expect(text).toContain('--:--');
    expect(text).not.toContain('0.0 m');
    expect(text).not.toContain('0:00');
  });

  test('Memory preview and aggregate metrics keep unknown manual values as placeholders', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<MemoryScreen sessions={[blankManualSession]} onOpenLogbook={jest.fn()} />);
    });

    const text = collectText(renderer!.toJSON());

    expect(text).toEqual(expect.arrayContaining(['--.- m', '--:--']));
    expect(text).not.toContain('0.0 m');
    expect(text).not.toContain('0:00');
  });
});
