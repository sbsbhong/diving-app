import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import HomeScreen from '../src/screens/home/screen';
import { AppPreferencesProvider } from '../src/states/app-preferences';
import type { HomeConditionsProvider, HomeConditionsSnapshot } from '../src/conditions/home-conditions';

const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve, 0));

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

const renderHome = async (snapshot: HomeConditionsSnapshot) => {
  const provider: HomeConditionsProvider = {
    getCurrentConditions: jest.fn(async () => snapshot),
  };
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AppPreferencesProvider>
        <HomeScreen
          sessions={[]}
          conditionsProvider={provider}
          onOpenLogbook={jest.fn()}
          onOpenPlanning={jest.fn()}
          onRefresh={jest.fn()}
        />
      </AppPreferencesProvider>,
    );
    await flushPromises();
  });

  return {
    provider,
    renderer: renderer!,
  };
};

describe('Home conditions interface', () => {
  beforeEach(async () => {
    const asyncStorageMock = jest.requireMock('@react-native-async-storage/async-storage') as {
      __resetAsyncStorageMock: () => void;
    };

    asyncStorageMock.__resetAsyncStorageMock();

    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('ko');
    });
  });

  it('renders a ready coastal snapshot with city, local time, air temperature, and water temperature', async () => {
    const { provider, renderer } = await renderHome({
      status: 'ready',
      cityName: 'Jeju City',
      localTime: 1782444600,
      airTemperatureCelsius: 24.2,
      waterTemperatureCelsius: 22.8,
      isCoastal: true,
      source: 'mock',
      updatedAt: 1782444300,
    });
    const root = renderer.root;

    expect(provider.getCurrentConditions).toHaveBeenCalledWith(expect.objectContaining({ locale: 'ko' }));
    expect(root.findByProps({ testID: 'home-conditions-city' }).props.children).toBe('Jeju City');
    expect(root.findByProps({ testID: 'home-conditions-location-icon' }).props.className).toEqual(expect.stringContaining('bg-primary/10'));
    expect(root.findByProps({ testID: 'home-conditions-local-time' }).props.children).toMatch(/\d{1,2}:\d{2}/);
    expect(root.findByProps({ testID: 'home-conditions-air-tile' })).toBeTruthy();
    expect(root.findByProps({ testID: 'home-conditions-air-tile-icon' })).toBeTruthy();
    expect(root.findByProps({ testID: 'home-conditions-air-temperature' }).props.children).toBe('24.20 °C');
    expect(root.findByProps({ testID: 'home-conditions-water-tile' })).toBeTruthy();
    expect(root.findByProps({ testID: 'home-conditions-water-tile-icon' })).toBeTruthy();
    expect(root.findByProps({ testID: 'home-conditions-water-temperature' }).props.children).toBe('22.80 °C');
  });

  it('hides water temperature metrics for non-coastal snapshots', async () => {
    const { renderer } = await renderHome({
      status: 'ready',
      cityName: 'Seoul',
      localTime: 1782444600,
      airTemperatureCelsius: 27,
      isCoastal: false,
      source: 'mock',
      updatedAt: 1782444300,
    });
    const root = renderer.root;

    expect(root.findByProps({ testID: 'home-conditions-city' }).props.children).toBe('Seoul');
    expect(root.findByProps({ testID: 'home-conditions-air-temperature' }).props.children).toBe('27.00 °C');
    expect(root.findAllByProps({ testID: 'home-conditions-water-temperature' })).toHaveLength(0);
    expect(root.findByProps({ testID: 'home-conditions-water-unavailable' })).toBeTruthy();
  });

  it('shows an unavailable state without blocking primary Home actions', async () => {
    const onOpenLogbook = jest.fn();
    const onOpenPlanning = jest.fn();
    const unavailableSnapshot: HomeConditionsSnapshot = {
      status: 'unavailable',
      source: 'mock',
    };
    const provider: HomeConditionsProvider = {
      getCurrentConditions: jest.fn(async () => unavailableSnapshot),
    };
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider>
          <HomeScreen
            sessions={[]}
            conditionsProvider={provider}
            onOpenLogbook={onOpenLogbook}
            onOpenPlanning={onOpenPlanning}
            onRefresh={jest.fn()}
          />
        </AppPreferencesProvider>,
      );
      await flushPromises();
    });

    const root = renderer!.root;

    expect(root.findByProps({ testID: 'home-conditions-unavailable' })).toBeTruthy();
    expect(root.findByProps({ testID: 'home-reminder-alert' })).toBeTruthy();
    const reminderIcon = root.findByProps({ testID: 'home-reminder-alert-icon' });
    expect(reminderIcon.props.className).toEqual(expect.stringContaining('rounded-full'));
    expect(reminderIcon.props.className).toEqual(expect.stringContaining('bg-primary/10'));
    expect(root.findAll(node => node.props.children === '알림')).toHaveLength(0);
    expect(root.findByProps({ testID: 'home-open-logbook-action-icon' })).toBeTruthy();
    expect(root.findByProps({ testID: 'home-open-planning-action-icon' })).toBeTruthy();

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'home-open-logbook-action' }).props.onPress();
      root.findByProps({ testID: 'home-open-planning-action' }).props.onPress();
    });

    expect(onOpenLogbook).toHaveBeenCalledTimes(1);
    expect(onOpenPlanning).toHaveBeenCalledTimes(1);
  });
});
