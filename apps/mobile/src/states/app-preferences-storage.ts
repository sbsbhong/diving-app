import { createAsyncStorageKeyValueStore, type PersistentKeyValueStore } from '../storage/persistent-key-value-store';
import { PersistentJsonStore, migrateVersionedValue } from '../storage/persistent-json-store';
import { mobileStorageKeys } from '../storage/storage-keys';
import { resolveSupportedLanguage, type SupportedLanguage } from '../i18n';
import type { ThemePreference } from './app-preferences';

export type StoredAppPreferences = {
  themePreference: ThemePreference;
  language: SupportedLanguage;
};

export type AppPreferencesStorage = {
  load(): Promise<StoredAppPreferences>;
  save(preferences: StoredAppPreferences): Promise<void>;
};

export type AppPreferencesStorageOptions = {
  storage?: PersistentKeyValueStore;
  now?: () => number;
  onReadError?: (error: Error) => void;
};

const DEFAULT_APP_PREFERENCES: StoredAppPreferences = {
  themePreference: 'system',
  language: 'ko',
};

export const createAppPreferencesStorage = (options: AppPreferencesStorageOptions = {}): AppPreferencesStorage => {
  const store = new PersistentJsonStore<StoredAppPreferences>({
    key: mobileStorageKeys.preferences,
    schemaVersion: 1,
    defaultValue: () => DEFAULT_APP_PREFERENCES,
    migrate: envelope => normalizePreferences(migrateVersionedValue<StoredAppPreferences>(mobileStorageKeys.preferences, 1, envelope)),
    storage: options.storage ?? createAsyncStorageKeyValueStore(),
    now: options.now,
    onReadError: options.onReadError,
  });

  return {
    load: () => store.read(),
    save: preferences => store.write(normalizePreferences(preferences)),
  };
};

export const defaultAppPreferencesStorage = createAppPreferencesStorage();

function normalizePreferences(preferences: StoredAppPreferences): StoredAppPreferences {
  return {
    themePreference: normalizeThemePreference(preferences.themePreference),
    language: resolveSupportedLanguage(preferences.language),
  };
}

function normalizeThemePreference(themePreference: ThemePreference): ThemePreference {
  return themePreference === 'light' || themePreference === 'dark' || themePreference === 'system'
    ? themePreference
    : 'system';
}
