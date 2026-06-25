/**
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import ReactTestRenderer from 'react-test-renderer';
import metadataRichFixture from '../../../packages/contracts/fixtures/metadata-rich-watch-sync-message.json';
import App from '../src/App';
import { Menu } from '../src/components/ui/menu';
import i18n from '../src/i18n';
import { defaultDiveLogRepository } from '../src/repositories/default-dive-log-repository';

const mockDrainPendingWatchConnectivityPayloads = jest.fn();
const mockAcknowledgeWatchConnectivityPayloads = jest.fn();
const mockAcknowledgeImportedWatchConnectivityPayloads = jest.fn();
let mockWatchConnectivityHandler:
  | ((payload: { payloadId?: string; payloadJson: string; localSessionId?: string; receivedAt?: number }) => void)
  | undefined;

jest.mock('../src/native/watch-connectivity', () => ({
  acknowledgeImportedWatchConnectivityPayloads: (payloadIds: readonly string[]) =>
    mockAcknowledgeImportedWatchConnectivityPayloads(payloadIds),
  acknowledgeWatchConnectivityPayloads: (payloadIds: readonly string[]) => mockAcknowledgeWatchConnectivityPayloads(payloadIds),
  drainPendingWatchConnectivityPayloads: () => mockDrainPendingWatchConnectivityPayloads(),
  getLinkedWatchInfo: () =>
    Promise.resolve({
      isSupported: true,
      isPaired: true,
      isWatchAppInstalled: true,
      isReachable: true,
      name: 'Test Apple Watch',
    }),
  isWatchConnectivityAvailable: () => true,
  subscribeToWatchConnectivityPayloads: (
    handler: (payload: { payloadId?: string; payloadJson: string; localSessionId?: string; receivedAt?: number }) => void,
  ) => {
    mockWatchConnectivityHandler = handler;
    return { remove: jest.fn() };
  },
  updatePlannedWatchDives: jest.fn(() => Promise.resolve()),
}));

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

jest.mock('react-native-safe-area-context', () => {
  const ReactModule = require('react') as typeof import('react');
  const actual = jest.requireActual('react-native-safe-area-context');
  const metrics = {
    frame: { width: 320, height: 640, x: 0, y: 0 },
    insets: { left: 0, right: 0, bottom: 0, top: 0 },
  };

  return {
    ...actual,
    initialWindowMetrics: metrics,
    useSafeAreaFrame: jest.fn(() => metrics.frame),
    useSafeAreaInsets: jest.fn(() => metrics.insets),
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      ReactModule.createElement(ReactModule.Fragment, null, children),
  };
});

jest.mock('nativewind', () => {
  const actual = jest.requireActual('nativewind');

  return {
    ...actual,
    useColorScheme: jest.fn(() => ({
      colorScheme: 'light',
      setColorScheme: jest.fn(),
    })),
  };
});

describe('App navigation', () => {
  beforeEach(async () => {
    mockDrainPendingWatchConnectivityPayloads.mockResolvedValue([]);
    mockAcknowledgeWatchConnectivityPayloads.mockResolvedValue(undefined);
    mockAcknowledgeImportedWatchConnectivityPayloads.mockResolvedValue(undefined);
    mockWatchConnectivityHandler = undefined;

    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('ko');
    });
  });

  test('renders correctly', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
  });

  test('keeps four top-level tabs and opens Settings', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });

    const root = renderer!.root;

    expect(root.findByProps({ testID: 'nav-tab-home' })).toBeTruthy();
    expect(root.findByProps({ testID: 'nav-tab-logbook' })).toBeTruthy();
    expect(root.findByProps({ testID: 'nav-tab-planning' })).toBeTruthy();
    expect(root.findByProps({ testID: 'nav-tab-settings' })).toBeTruthy();
    expect(() => root.findByProps({ testID: 'nav-tab-memory' })).toThrow();
    expect(root.findByProps({ testID: 'language-menu-trigger' })).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'nav-tab-settings' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'settings-screen-title' }).props.children).toBe('설정');
  });

  test('uses React Navigation as the top-level navigation container', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });

    expect(renderer!.root.findByType(NavigationContainer)).toBeTruthy();
  });

  test('switches language from the restored Home language menu', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });

    const root = renderer!.root;

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'language-menu-trigger' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'language-menu-option-en' })).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      await root.findByProps({ testID: 'language-menu-option-en' }).props.onPress();
    });

    expect(i18n.language).toBe('en');
    expect(root.findByProps({ testID: 'nav-tab-home' }).props.children[1].props.children).toBe('Home');
  });

  test('renders the Home language selector with the gluestack Menu component', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });

    expect(renderer!.root.findByType(Menu)).toBeTruthy();
  });

  test('shows a tappable toast for automatic watch imports and opens the synced log', async () => {
    const fixture = {
      ...metadataRichFixture,
      session: {
        ...metadataRichFixture.session,
        localSessionId: 'app-toast-session',
        siteName: 'Toast Reef',
        endedAt: 1781357600,
        samples: metadataRichFixture.session.samples.map(sample => ({
          ...sample,
          localSessionId: 'app-toast-session',
        })),
      },
    };
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });

    const root = renderer!.root;

    await ReactTestRenderer.act(async () => {
      mockWatchConnectivityHandler?.({
        payloadId: 'app-toast-payload',
        payloadJson: JSON.stringify(fixture),
        localSessionId: 'app-toast-session',
        receivedAt: 1781357600,
      });
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });

    expect(root.findByProps({ testID: 'watch-auto-import-toast' })).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      await root.findByProps({ testID: 'watch-auto-import-toast' }).props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });

    expect(root.findByProps({ testID: 'log-entry-detail-note' }).props.children).toBe(
      'Easy recreational checkout dive. Not for decompression planning.',
    );
    expect(root.findByProps({ testID: 'log-entry-detail-depth-profile' })).toBeTruthy();
  });

  test('uses the persistent default logbook repository', async () => {
    const entries = await defaultDiveLogRepository.list();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].watchCapture?.importKey).toBeTruthy();
  });
});
