import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from './resources';

export const supportedLanguages = ['ko', 'en'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

const fallbackLanguage: SupportedLanguage = 'ko';

export const resolveSupportedLanguage = (locale?: string): SupportedLanguage => {
  const language = locale?.split(/[-_]/)[0]?.toLowerCase();

  if (supportedLanguages.includes(language as SupportedLanguage)) {
    return language as SupportedLanguage;
  }

  return fallbackLanguage;
};

const getDeviceLocale = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
};

export const i18nReady = i18n.use(initReactI18next).init({
  resources,
  lng: resolveSupportedLanguage(getDeviceLocale()),
  fallbackLng: [fallbackLanguage],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
