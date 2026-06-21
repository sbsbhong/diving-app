# Mobile Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the mobile Settings tab with theme and language detail screens, while deferring only preference persistence.

**Architecture:** Keep the existing custom bottom-tab navigation and replace the top-level Memory tab with Settings. Add an in-memory `AppPreferencesProvider` that owns theme and language state, feeds `GluestackUIProvider mode`, and exposes a small hook for Settings. Settings uses local route state for push-style `index`, `theme`, and `language` views.

**Tech Stack:** React Native 0.85.3, React 19, TypeScript, react-i18next, Gluestack UI v4 provider, NativeWind semantic token classes, Jest with react-test-renderer.

---

## File Structure

- Create `apps/mobile/src/states/app-preferences.tsx`
  - Owns theme preference, resolved theme, current supported language, and setters.
  - Exposes `AppPreferencesProvider`, `useAppPreferences`, `resolveThemePreference`, and preference types.
  - Contains the explicit deferred-persistence note.

- Modify `apps/mobile/src/providers.tsx`
  - Wraps app children with `AppPreferencesProvider`.
  - Reads `resolvedTheme` through a small inner component.
  - Passes resolved mode to `GluestackUIProvider`.
  - Updates `StatusBar` style from resolved theme.

- Modify `apps/mobile/src/i18n/resources.ts`
  - Adds `navigation.settings`.
  - Adds Settings copy for Korean and English.

- Create `apps/mobile/src/screens/settings/screen.tsx`
  - Renders Settings index, Theme detail, and Language detail.
  - Keeps row components local.
  - Uses `useAppPreferences` and `useTranslation`.

- Modify `apps/mobile/src/components/navigation/index.tsx`
  - Changes top-level sections to `home | logbook | planning | settings`.
  - Removes Memory tab rendering.
  - Imports and renders Settings.
  - Adds stable tab `testID`s.

- Modify `apps/mobile/src/types/dive-session.ts`
  - Updates `DiveLogbookSection`.

- Modify `apps/mobile/src/screens/home/screen.tsx`
  - Removes the Home language menu and its tests.
  - Removes the top-level Memory CTA from Home.

- Keep `apps/mobile/src/screens/memory/screen.tsx`
  - Do not delete it in this pass. The file can be reused when Memory becomes a Logbook-adjacent workflow.

- Modify `apps/mobile/__tests__/apple-design-system.test.tsx`
  - Updates provider/default-theme assertions.
  - Includes Settings in design-rule source scan.

- Modify `apps/mobile/__tests__/i18n.test.ts`
  - Asserts Settings translation keys ship in Korean and English.

- Delete `apps/mobile/__tests__/language-menu.test.tsx`
  - Home no longer owns language selection.

- Create `apps/mobile/__tests__/app-preferences.test.tsx`
  - Covers pure theme resolution and provider language/theme setters.

- Create `apps/mobile/__tests__/settings-screen.test.tsx`
  - Covers Settings navigation, theme selection, and language selection.

---

### Task 1: App Preferences Provider

**Files:**
- Create: `apps/mobile/src/states/app-preferences.tsx`
- Test: `apps/mobile/__tests__/app-preferences.test.tsx`

- [ ] **Step 1: Write the failing provider tests**

Create `apps/mobile/__tests__/app-preferences.test.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import {
  AppPreferencesProvider,
  resolveThemePreference,
  useAppPreferences,
  type AppPreferences,
} from '../src/states/app-preferences';

function Probe(props: { onValue: (value: AppPreferences) => void }): React.JSX.Element {
  const preferences = useAppPreferences();

  React.useEffect(() => {
    props.onValue(preferences);
  }, [preferences, props]);

  return (
    <Text testID="preferences-probe">
      {`${preferences.themePreference}:${preferences.resolvedTheme}:${preferences.language}`}
    </Text>
  );
}

describe('app preferences', () => {
  beforeEach(async () => {
    await ReactTestRenderer.act(async () => {
      await i18n.changeLanguage('ko');
    });
  });

  test('resolves theme preferences with a light fallback for system mode', () => {
    expect(resolveThemePreference('light', 'dark')).toBe('light');
    expect(resolveThemePreference('dark', 'light')).toBe('dark');
    expect(resolveThemePreference('system', 'dark')).toBe('dark');
    expect(resolveThemePreference('system', 'light')).toBe('light');
    expect(resolveThemePreference('system', null)).toBe('light');
    expect(resolveThemePreference('system', undefined)).toBe('light');
  });

  test('exposes default in-memory settings and applies runtime updates', async () => {
    const snapshots: AppPreferences[] = [];
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppPreferencesProvider>
          <Probe onValue={value => snapshots.push(value)} />
        </AppPreferencesProvider>,
      );
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('system:light:ko');

    const current = snapshots[snapshots.length - 1];

    await ReactTestRenderer.act(async () => {
      current.setThemePreference('dark');
    });

    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:ko');

    await ReactTestRenderer.act(async () => {
      await snapshots[snapshots.length - 1].setLanguage('en');
    });

    expect(i18n.language).toBe('en');
    expect(renderer!.root.findByProps({ testID: 'preferences-probe' }).props.children).toBe('dark:dark:en');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
yarn workspace @repo/mobile test app-preferences.test.tsx
```

Expected: FAIL because `../src/states/app-preferences` does not exist.

- [ ] **Step 3: Create the provider**

Create `apps/mobile/src/states/app-preferences.tsx`:

```tsx
import React from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import i18n, { resolveSupportedLanguage, type SupportedLanguage } from '../i18n';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export type AppPreferences = {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  language: SupportedLanguage;
  setThemePreference: (value: ThemePreference) => void;
  setLanguage: (value: SupportedLanguage) => Promise<void>;
};

const AppPreferencesContext = React.createContext<AppPreferences | undefined>(undefined);

export const resolveThemePreference = (
  themePreference: ThemePreference,
  deviceColorScheme: ColorSchemeName | undefined,
): ResolvedTheme => {
  if (themePreference === 'light' || themePreference === 'dark') {
    return themePreference;
  }

  return deviceColorScheme === 'dark' ? 'dark' : 'light';
};

const getInitialLanguage = (): SupportedLanguage => {
  return resolveSupportedLanguage(i18n.resolvedLanguage ?? i18n.language);
};

export function AppPreferencesProvider(props: { children?: React.ReactNode }): React.JSX.Element {
  const deviceColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = React.useState<ThemePreference>('system');
  const [language, setLanguageState] = React.useState<SupportedLanguage>(getInitialLanguage);

  const resolvedTheme = resolveThemePreference(themePreference, deviceColorScheme);

  React.useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      setLanguageState(resolveSupportedLanguage(nextLanguage));
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const setLanguage = React.useCallback(async (value: SupportedLanguage) => {
    const nextLanguage = resolveSupportedLanguage(value);

    await i18n.changeLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  const value = React.useMemo<AppPreferences>(
    () => ({
      themePreference,
      resolvedTheme,
      language,
      setThemePreference,
      setLanguage,
    }),
    [language, resolvedTheme, setLanguage, themePreference],
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

/*
 * Preference persistence is deliberately deferred. The mobile app does not yet
 * have a production persistence boundary for sessions, auth, or user settings.
 * Add storage behind AppPreferencesProvider when that boundary exists.
 */
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
yarn workspace @repo/mobile test app-preferences.test.tsx
```

Expected: PASS for both `app preferences` tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/mobile/src/states/app-preferences.tsx apps/mobile/__tests__/app-preferences.test.tsx
git commit -m "feat(mobile): add app preferences provider"
```

---

### Task 2: Wire Preferences Into Providers

**Files:**
- Modify: `apps/mobile/src/providers.tsx`
- Modify: `apps/mobile/__tests__/apple-design-system.test.tsx`

- [ ] **Step 1: Update the failing provider test**

In `apps/mobile/__tests__/apple-design-system.test.tsx`, replace the default-surface test with renderer assertions:

```tsx
import { Pressable, StatusBar } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { GluestackUIProvider } from '../components/ui/gluestack-ui-provider';
import { useAppPreferences } from '../src/states/app-preferences';
```

Add this helper near `readSource`:

```tsx
function ThemeToggle(): React.JSX.Element {
  const { setThemePreference } = useAppPreferences();

  return <Pressable testID="set-dark-theme" onPress={() => setThemePreference('dark')} />;
}
```

Use this test body:

```tsx
test('uses light mode as the default resolved mobile surface', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<Providers>{null}</Providers>);
  });

  const root = renderer!.root;

  expect(root.findByType(GluestackUIProvider).props.mode).toBe('light');
  expect(root.findByType(StatusBar).props.barStyle).toBe('dark-content');
});

test('updates Gluestack mode and status bar from runtime theme preference', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <Providers>
        <ThemeToggle />
      </Providers>,
    );
  });

  const root = renderer!.root;

  await ReactTestRenderer.act(async () => {
    root.findByProps({ testID: 'set-dark-theme' }).props.onPress();
  });

  expect(root.findByType(GluestackUIProvider).props.mode).toBe('dark');
  expect(root.findByType(StatusBar).props.barStyle).toBe('light-content');
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
yarn workspace @repo/mobile test apple-design-system.test.tsx
```

Expected: FAIL because `Providers` does not yet wrap children in `AppPreferencesProvider`, so `ThemeToggle` cannot read preferences.

- [ ] **Step 3: Update `Providers`**

Replace `apps/mobile/src/providers.tsx` with:

```tsx
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '../components/ui/gluestack-ui-provider';
import { AppPreferencesProvider, useAppPreferences } from './states/app-preferences';

type ProvidersProps = {
  children?: React.ReactNode;
};

export default function Providers(props: ProvidersProps): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AppPreferencesProvider>
        <ThemedProviders>{props.children}</ThemedProviders>
      </AppPreferencesProvider>
    </SafeAreaProvider>
  );
}

function ThemedProviders(props: ProvidersProps): React.JSX.Element {
  const { resolvedTheme } = useAppPreferences();

  return (
    <GluestackUIProvider mode={resolvedTheme}>
      <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} />
      {props.children}
    </GluestackUIProvider>
  );
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
yarn workspace @repo/mobile test apple-design-system.test.tsx
```

Expected: PASS for all Apple design system tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/mobile/src/providers.tsx apps/mobile/__tests__/apple-design-system.test.tsx
git commit -m "feat(mobile): wire theme preference provider"
```

---

### Task 3: Settings I18n Copy

**Files:**
- Modify: `apps/mobile/src/i18n/resources.ts`
- Modify: `apps/mobile/__tests__/i18n.test.ts`

- [ ] **Step 1: Extend i18n tests first**

In `apps/mobile/__tests__/i18n.test.ts`, extend the first test:

```ts
expect(i18n.t('navigation.settings')).toBe('설정');
expect(i18n.getResource('en', 'translation', 'navigation.settings')).toBe('Settings');
expect(i18n.t('settings.theme.system')).toBe('시스템 기본값');
expect(i18n.getResource('en', 'translation', 'settings.theme.system')).toBe('System default');
expect(i18n.t('settings.language.english')).toBe('English');
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
yarn workspace @repo/mobile test i18n.test.ts
```

Expected: FAIL because `navigation.settings` and `settings.*` keys do not exist.

- [ ] **Step 3: Add Korean Settings resources**

In `apps/mobile/src/i18n/resources.ts`, add `settings: '설정'` under `ko.translation.navigation`:

```ts
navigation: {
  home: '홈',
  logbook: '로그북',
  planning: '계획',
  memory: '메모리',
  settings: '설정',
},
```

Add `settings` under `ko.translation`:

```ts
settings: {
  title: '설정',
  subtitle: '앱 표시 방식과 로컬 선호를 관리합니다.',
  appearance: '표시',
  backToSettings: '설정으로 돌아가기',
  theme: {
    title: '테마',
    subtitle: '앱의 표시 모드를 선택합니다.',
    system: '시스템 기본값',
    systemDescription: '기기 설정을 따릅니다.',
    light: '라이트',
    lightDescription: '밝은 화면을 사용합니다.',
    dark: '다크',
    darkDescription: '어두운 화면을 사용합니다.',
  },
  language: {
    title: '언어',
    subtitle: '앱 언어를 선택합니다.',
    korean: '한국어',
    english: 'English',
  },
},
```

- [ ] **Step 4: Add English Settings resources**

In `apps/mobile/src/i18n/resources.ts`, add `settings: 'Settings'` under `en.translation.navigation`:

```ts
navigation: {
  home: 'Home',
  logbook: 'Logbook',
  planning: 'Plan',
  memory: 'Memory',
  settings: 'Settings',
},
```

Add `settings` under `en.translation`:

```ts
settings: {
  title: 'Settings',
  subtitle: 'Manage app appearance and local preferences.',
  appearance: 'Appearance',
  backToSettings: 'Back to Settings',
  theme: {
    title: 'Theme',
    subtitle: 'Choose how the app is displayed.',
    system: 'System default',
    systemDescription: 'Follow the device setting.',
    light: 'Light',
    lightDescription: 'Use the light grouped surface.',
    dark: 'Dark',
    darkDescription: 'Use the dark grouped surface.',
  },
  language: {
    title: 'Language',
    subtitle: 'Choose the app language.',
    korean: '한국어',
    english: 'English',
  },
},
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
yarn workspace @repo/mobile test i18n.test.ts
```

Expected: PASS for all mobile i18n tests.

- [ ] **Step 6: Commit**

Run:

```bash
git add apps/mobile/src/i18n/resources.ts apps/mobile/__tests__/i18n.test.ts
git commit -m "feat(mobile): add settings translations"
```

---

### Task 4: Settings Screen

**Files:**
- Create: `apps/mobile/src/screens/settings/screen.tsx`
- Test: `apps/mobile/__tests__/settings-screen.test.tsx`

- [ ] **Step 1: Write Settings screen tests first**

Create `apps/mobile/__tests__/settings-screen.test.tsx`:

```tsx
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import i18n from '../src/i18n';
import { AppPreferencesProvider } from '../src/states/app-preferences';
import SettingsScreen from '../src/screens/settings/screen';

const renderSettings = async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <AppPreferencesProvider>
        <SettingsScreen />
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
yarn workspace @repo/mobile test settings-screen.test.tsx
```

Expected: FAIL because `../src/screens/settings/screen` does not exist.

- [ ] **Step 3: Create the Settings screen**

Create `apps/mobile/src/screens/settings/screen.tsx`:

```tsx
import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  useAppPreferences,
  type ThemePreference,
} from '../../states/app-preferences';
import { Box, HStack, Text, VStack } from '../../components/ui/primitives';
import type { SupportedLanguage } from '../../i18n';

type SettingsRoute = 'index' | 'theme' | 'language';

const themeOptions = [
  {
    value: 'system',
    labelKey: 'settings.theme.system',
    descriptionKey: 'settings.theme.systemDescription',
  },
  {
    value: 'light',
    labelKey: 'settings.theme.light',
    descriptionKey: 'settings.theme.lightDescription',
  },
  {
    value: 'dark',
    labelKey: 'settings.theme.dark',
    descriptionKey: 'settings.theme.darkDescription',
  },
] as const satisfies ReadonlyArray<{
  value: ThemePreference;
  labelKey: string;
  descriptionKey: string;
}>;

const languageOptions = [
  {
    value: 'ko',
    labelKey: 'settings.language.korean',
  },
  {
    value: 'en',
    labelKey: 'settings.language.english',
  },
] as const satisfies ReadonlyArray<{
  value: SupportedLanguage;
  labelKey: string;
}>;

export default function SettingsScreen(): React.JSX.Element {
  const [route, setRoute] = React.useState<SettingsRoute>('index');

  if (route === 'theme') {
    return <ThemeSettingsScreen onBack={() => setRoute('index')} />;
  }

  if (route === 'language') {
    return <LanguageSettingsScreen onBack={() => setRoute('index')} />;
  }

  return <SettingsIndex onOpenTheme={() => setRoute('theme')} onOpenLanguage={() => setRoute('language')} />;
}

function SettingsIndex(props: { onOpenTheme: () => void; onOpenLanguage: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { themePreference, language } = useAppPreferences();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack gap={18}>
        <VStack gap={7}>
          <Text testID="settings-screen-title" className="text-4xl font-semibold leading-10 text-foreground">
            {t('settings.title')}
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">{t('settings.subtitle')}</Text>
        </VStack>

        <VStack gap={8}>
          <Text className="px-1 text-xs font-semibold uppercase text-muted-foreground">{t('settings.appearance')}</Text>
          <VStack className="overflow-hidden rounded-2xl bg-card">
            <SettingsRow
              icon="Aa"
              label={t('settings.theme.title')}
              value={themePreferenceLabel(themePreference, t)}
              valueTestID="settings-current-theme"
              testID="settings-row-theme"
              onPress={props.onOpenTheme}
            />
            <SettingsRow
              icon="A"
              label={t('settings.language.title')}
              value={languageLabel(language, t)}
              valueTestID="settings-current-language"
              testID="settings-row-language"
              onPress={props.onOpenLanguage}
            />
          </VStack>
        </VStack>
      </VStack>
    </ScrollView>
  );
}

function ThemeSettingsScreen(props: { onBack: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { themePreference, setThemePreference } = useAppPreferences();

  return (
    <DetailScaffold title={t('settings.theme.title')} subtitle={t('settings.theme.subtitle')} onBack={props.onBack}>
      {themeOptions.map(option => (
        <OptionRow
          key={option.value}
          title={t(option.labelKey)}
          description={t(option.descriptionKey)}
          selected={themePreference === option.value}
          testID={`settings-option-theme-${option.value}`}
          onPress={() => setThemePreference(option.value)}
        />
      ))}
    </DetailScaffold>
  );
}

function LanguageSettingsScreen(props: { onBack: () => void }): React.JSX.Element {
  const { t } = useTranslation();
  const { language, setLanguage } = useAppPreferences();

  return (
    <DetailScaffold title={t('settings.language.title')} subtitle={t('settings.language.subtitle')} onBack={props.onBack}>
      {languageOptions.map(option => (
        <OptionRow
          key={option.value}
          title={t(option.labelKey)}
          selected={language === option.value}
          testID={`settings-option-language-${option.value}`}
          onPress={() => setLanguage(option.value)}
        />
      ))}
    </DetailScaffold>
  );
}

function DetailScaffold(props: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pt-4 pb-6" contentInsetAdjustmentBehavior="automatic">
      <VStack gap={16}>
        <Pressable
          accessibilityLabel={t('settings.backToSettings')}
          accessibilityRole="button"
          className="min-h-9 self-start justify-center"
          testID="settings-back"
          onPress={props.onBack}
          style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
          <Text className="text-base font-semibold text-primary">{`‹ ${t('settings.title')}`}</Text>
        </Pressable>

        <VStack gap={7}>
          <Text testID="settings-detail-title" className="text-4xl font-semibold leading-10 text-foreground">
            {props.title}
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">{props.subtitle}</Text>
        </VStack>

        <VStack className="overflow-hidden rounded-2xl bg-card">{props.children}</VStack>
      </VStack>
    </ScrollView>
  );
}

function SettingsRow(props: {
  icon: string;
  label: string;
  value: string;
  testID: string;
  valueTestID: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-14 border-b border-border px-4 py-3"
      testID={props.testID}
      onPress={props.onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <HStack gap={12} className="items-center">
        <Box className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Text className="text-xs font-semibold text-primary">{props.icon}</Text>
        </Box>
        <Text className="flex-1 text-base font-semibold text-card-foreground">{props.label}</Text>
        <Text testID={props.valueTestID} className="text-sm font-semibold text-muted-foreground">
          {props.value}
        </Text>
        <Text className="text-xl font-semibold text-muted-foreground">›</Text>
      </HStack>
    </Pressable>
  );
}

function OptionRow(props: {
  title: string;
  description?: string;
  selected: boolean;
  testID: string;
  onPress: () => void | Promise<void>;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      className="min-h-14 border-b border-border px-4 py-3"
      testID={props.testID}
      onPress={props.onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
      <HStack gap={12} className="items-center">
        <VStack gap={3} className="flex-1">
          <Text className={props.selected ? 'text-base font-semibold text-primary' : 'text-base font-semibold text-card-foreground'}>
            {props.title}
          </Text>
          {props.description ? <Text className="text-sm leading-5 text-muted-foreground">{props.description}</Text> : null}
        </VStack>
        <Text className={props.selected ? 'text-lg font-semibold text-primary' : 'text-lg font-semibold text-transparent'}>
          ✓
        </Text>
      </HStack>
    </Pressable>
  );
}

function themePreferenceLabel(themePreference: ThemePreference, t: (key: string) => string): string {
  if (themePreference === 'light') {
    return t('settings.theme.light');
  }

  if (themePreference === 'dark') {
    return t('settings.theme.dark');
  }

  return t('settings.theme.system');
}

function languageLabel(language: SupportedLanguage, t: (key: string) => string): string {
  return language === 'en' ? t('settings.language.english') : t('settings.language.korean');
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
yarn workspace @repo/mobile test settings-screen.test.tsx
```

Expected: PASS for all Settings screen tests.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/mobile/src/screens/settings/screen.tsx apps/mobile/__tests__/settings-screen.test.tsx
git commit -m "feat(mobile): add settings screen"
```

---

### Task 5: Bottom Navigation And Home Cleanup

**Files:**
- Modify: `apps/mobile/src/types/dive-session.ts`
- Modify: `apps/mobile/src/components/navigation/index.tsx`
- Modify: `apps/mobile/src/screens/home/screen.tsx`
- Delete: `apps/mobile/__tests__/language-menu.test.tsx`
- Modify: `apps/mobile/__tests__/App.test.tsx`

- [ ] **Step 1: Write failing navigation tests**

Replace `apps/mobile/__tests__/App.test.tsx` with:

```tsx
/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../src/App';

describe('App navigation', () => {
  beforeEach(async () => {
    const i18n = (await import('../src/i18n')).default;

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
    expect(() => root.findByProps({ testID: 'language-menu-trigger' })).toThrow();

    await ReactTestRenderer.act(async () => {
      root.findByProps({ testID: 'nav-tab-settings' }).props.onPress();
    });

    expect(root.findByProps({ testID: 'settings-screen-title' }).props.children).toBe('설정');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
yarn workspace @repo/mobile test App.test.tsx
```

Expected: FAIL because `nav-tab-settings` does not exist and Home still renders `language-menu-trigger`.

- [ ] **Step 3: Update the section type**

In `apps/mobile/src/types/dive-session.ts`, change:

```ts
export type DiveLogbookSection = 'home' | 'logbook' | 'planning' | 'memory';
```

to:

```ts
export type DiveLogbookSection = 'home' | 'logbook' | 'planning' | 'settings';
```

- [ ] **Step 4: Update RootNavigation**

In `apps/mobile/src/components/navigation/index.tsx`:

Remove:

```tsx
import MemoryScreen from '../../screens/memory/screen';
```

Add:

```tsx
import SettingsScreen from '../../screens/settings/screen';
```

Change `RootStackParamList` to:

```ts
export type RootStackParamList = {
  home: undefined;
  logbook: undefined;
  planning: undefined;
  settings: undefined;
};
```

Change the Home render to:

```tsx
{section === 'home' ? (
  <HomeScreen
    sessions={logbook.sessions}
    onOpenLogbook={() => setSection('logbook')}
    onOpenPlanning={() => setSection('planning')}
  />
) : null}
```

Remove the Memory render branch.

Add the Settings render branch:

```tsx
{section === 'settings' ? <SettingsScreen /> : null}
```

Replace the nav tabs with:

```tsx
<NavTab id="home" label={t('navigation.home')} selected={section === 'home'} onPress={() => setSection('home')} />
<NavTab id="logbook" label={t('navigation.logbook')} selected={section === 'logbook'} onPress={() => setSection('logbook')} />
<NavTab
  id="planning"
  label={t('navigation.planning')}
  selected={section === 'planning'}
  onPress={() => setSection('planning')}
/>
<NavTab
  id="settings"
  label={t('navigation.settings')}
  selected={section === 'settings'}
  onPress={() => setSection('settings')}
/>
```

Change the `NavTab` signature and add `testID`:

```tsx
function NavTab(props: { id: DiveLogbookSection; label: string; selected: boolean; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      onPress={props.onPress}
      className={navTabStyles({ selected: props.selected })}
      testID={`nav-tab-${props.id}`}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      <Box className={navTabIndicatorStyles({ selected: props.selected })} />
      <Text className={navTabTextStyles({ selected: props.selected })}>{props.label}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 5: Remove Home language and Memory entry points**

In `apps/mobile/src/screens/home/screen.tsx`:

Remove these imports:

```tsx
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { resolveSupportedLanguage, type SupportedLanguage } from '../../i18n';
```

Replace with:

```tsx
import { ScrollView } from 'react-native';
```

Change `HomeScreenProps` to:

```ts
type HomeScreenProps = {
  sessions: MobileDiveSession[];
  onOpenLogbook: () => void;
  onOpenPlanning: () => void;
};
```

Remove `languageOptions`, `languageStyles`, `LanguageMenu`, and `LanguageMark`.

Change the header block from:

```tsx
<HStack className="items-start justify-between">
  <StatusPill label={t('status.watchAssistant')} />
  <LanguageMenu />
</HStack>
```

to:

```tsx
<StatusPill label={t('status.watchAssistant')} />
```

Remove the Memory button:

```tsx
<InstrumentButton label={t('home.previewMemory')} onPress={props.onOpenMemory} />
```

- [ ] **Step 6: Delete stale language menu tests**

Use `apply_patch`:

```diff
*** Begin Patch
*** Delete File: apps/mobile/__tests__/language-menu.test.tsx
*** End Patch
```

- [ ] **Step 7: Run the focused navigation test and verify it passes**

Run:

```bash
yarn workspace @repo/mobile test App.test.tsx
```

Expected: PASS for both App navigation tests.

- [ ] **Step 8: Commit**

Run:

```bash
git add apps/mobile/src/types/dive-session.ts apps/mobile/src/components/navigation/index.tsx apps/mobile/src/screens/home/screen.tsx apps/mobile/__tests__/App.test.tsx
git add apps/mobile/__tests__/language-menu.test.tsx
git commit -m "feat(mobile): replace memory tab with settings"
```

---

### Task 6: Design Test Coverage And Full Verification

**Files:**
- Modify: `apps/mobile/__tests__/apple-design-system.test.tsx`

- [ ] **Step 1: Add Settings to the UI rule scan**

In `apps/mobile/__tests__/apple-design-system.test.tsx`, add Settings to the joined source list:

```tsx
readSource('src', 'screens', 'settings', 'screen.tsx'),
```

- [ ] **Step 2: Run the mobile test suite**

Run:

```bash
yarn workspace @repo/mobile test
```

Expected: PASS for all mobile Jest suites:

- `App.test.tsx`
- `app-preferences.test.tsx`
- `apple-design-system.test.tsx`
- `i18n.test.ts`
- `settings-screen.test.tsx`

- [ ] **Step 3: Run mobile typecheck**

Run:

```bash
yarn mobile:typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Commit verification cleanup**

If Step 1 changed `apple-design-system.test.tsx`, run:

```bash
git add apps/mobile/__tests__/apple-design-system.test.tsx
git commit -m "test(mobile): cover settings design rules"
```

If Step 1 was already included in an earlier task, run:

```bash
git status --short
```

Expected: no uncommitted changes after the previous task commits.

---

## Self-Review Checklist

- Spec coverage:
  - Settings tab is implemented as a top-level tab.
  - Bottom navigation stays at four tabs.
  - Memory is removed from top-level navigation.
  - Theme detail supports System default, Light, and Dark.
  - Language detail supports Korean and English.
  - Runtime theme switching is wired to `GluestackUIProvider mode` and `StatusBar`.
  - Runtime language switching is wired to `i18n.changeLanguage`.
  - Preference persistence is deferred and documented in the provider.

- Type consistency:
  - `ThemePreference` is always `system | light | dark`.
  - `ResolvedTheme` is always `light | dark`.
  - `DiveLogbookSection` matches every `NavTab id`.
  - Settings route state is local to `SettingsScreen`.

- Verification:
  - `yarn workspace @repo/mobile test`
  - `yarn mobile:typecheck`
