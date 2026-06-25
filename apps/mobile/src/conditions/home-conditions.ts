import type { SupportedLanguage } from '../i18n';

export type HomeConditionsStatus = 'idle' | 'loading' | 'ready' | 'permissionDenied' | 'unavailable' | 'error';

export type HomeConditionsSource = 'mock' | 'openMeteo' | 'stormglass' | 'meteomatics' | 'noaa';

export type HomeConditionsSnapshot = {
  status: HomeConditionsStatus;
  localTime?: number;
  cityName?: string;
  latitude?: number;
  longitude?: number;
  airTemperatureCelsius?: number;
  waterTemperatureCelsius?: number;
  isCoastal?: boolean;
  source?: HomeConditionsSource;
  updatedAt?: number;
  errorMessage?: string;
};

export type HomeConditionsInput = {
  latitude?: number;
  longitude?: number;
  locale?: SupportedLanguage | string;
};

export type HomeConditionsProvider = {
  getCurrentConditions(input: HomeConditionsInput): Promise<HomeConditionsSnapshot>;
};

export const createStaticHomeConditionsProvider = (
  snapshot: HomeConditionsSnapshot = createMockHomeConditionsSnapshot(),
): HomeConditionsProvider => ({
  getCurrentConditions: async () => ({
    ...snapshot,
    localTime: snapshot.localTime ?? Date.now() / 1000,
    updatedAt: snapshot.updatedAt ?? Date.now() / 1000,
  }),
});

export const mockHomeConditionsProvider = createStaticHomeConditionsProvider();

function createMockHomeConditionsSnapshot(): HomeConditionsSnapshot {
  const now = Date.now() / 1000;

  return {
    status: 'ready',
    cityName: 'Jeju City',
    localTime: now,
    airTemperatureCelsius: 24,
    waterTemperatureCelsius: 22,
    isCoastal: true,
    source: 'mock',
    updatedAt: now,
  };
}
