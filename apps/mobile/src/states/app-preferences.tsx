import React from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import i18n, { resolveSupportedLanguage, type SupportedLanguage } from '../i18n';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type AppPreferences = {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  language: SupportedLanguage;
  setThemePreference: (themePreference: ThemePreference) => void;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
};

type AppPreferencesProviderProps = {
  children?: React.ReactNode;
};

const AppPreferencesContext = React.createContext<AppPreferences | undefined>(undefined);

export const resolveThemePreference = (
  themePreference: ThemePreference,
  deviceColorScheme: ColorSchemeName | null | undefined,
): ResolvedTheme => {
  if (themePreference === 'system') {
    return deviceColorScheme === 'dark' ? 'dark' : 'light';
  }

  return themePreference;
};

const resolveInitialLanguage = (): SupportedLanguage =>
  resolveSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);

export function AppPreferencesProvider(props: AppPreferencesProviderProps): React.JSX.Element {
  const deviceColorScheme = useColorScheme();
  // Preference persistence is deliberately deferred because the mobile app has no production persistence boundary yet; add storage behind AppPreferencesProvider later.
  const [themePreference, setThemePreferenceState] = React.useState<ThemePreference>('system');
  const [language, setLanguageState] = React.useState<SupportedLanguage>(resolveInitialLanguage);

  React.useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      setLanguageState(resolveSupportedLanguage(nextLanguage));
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const setThemePreference = React.useCallback((nextThemePreference: ThemePreference) => {
    setThemePreferenceState(nextThemePreference);
  }, []);

  const setLanguage = React.useCallback(async (nextLanguage: SupportedLanguage) => {
    const supportedLanguage = resolveSupportedLanguage(nextLanguage);

    try {
      await i18n.changeLanguage(supportedLanguage);
      setLanguageState(supportedLanguage);
    } catch {
      // Keep the previous language selection when i18next rejects the change.
    }
  }, []);

  const resolvedTheme = React.useMemo(
    () => resolveThemePreference(themePreference, deviceColorScheme),
    [deviceColorScheme, themePreference],
  );

  const value = React.useMemo<AppPreferences>(
    () => ({
      themePreference,
      resolvedTheme,
      language,
      setThemePreference,
      setLanguage,
    }),
    [language, resolvedTheme, setLanguage, setThemePreference, themePreference],
  );

  return <AppPreferencesContext.Provider value={value}>{props.children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences(): AppPreferences {
  const preferences = React.useContext(AppPreferencesContext);

  if (!preferences) {
    throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  }

  return preferences;
}
