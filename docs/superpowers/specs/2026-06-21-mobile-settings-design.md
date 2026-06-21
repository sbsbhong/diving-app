# Mobile Settings Design

Date: 2026-06-21

## Summary

Add a dedicated Settings tab to the mobile app while keeping the bottom navigation at four top-level destinations:

- Home
- Logbook
- Plan
- Settings

Memory should not remain a top-level tab for now. It is currently closer to a Logbook-adjacent sharing, recap, and memory preview surface than an independent daily workflow. The near-term app should place Memory entry points inside Logbook instead of spending a bottom-tab slot on it.

Settings should initially manage only local display preferences:

- Theme: System default, Light, Dark
- Language: Korean, English

The Settings tab, its detail screens, runtime theme switching, and runtime language switching are all in scope for the implementation. Only preference persistence is deferred.

This feature must stay within the current mobile app boundaries. It should not introduce authentication, Supabase, production persistence, cloud backup, or new safety-critical behavior.

## Goals

- Give users a durable place for app-wide preferences.
- Keep the bottom navigation stable at four tabs.
- Move language switching out of Home and into Settings.
- Enable runtime light and dark mode using the existing Gluestack semantic token modes.
- Preserve the current custom navigation approach without adding a navigation library.
- Keep the first implementation small enough for the current PoC app state.

## Non-Goals

- Do not add AsyncStorage or another persistence dependency in this change.
- Do not redesign the full Memory workflow.
- Do not introduce a modal sheet or a new UI interaction system.
- Do not add account, sync, backup, Supabase, or auth settings.
- Do not change watch sync contracts or generated contract output.

## Navigation

`RootNavigation` should keep a single custom tab state, but the section type should change from:

```ts
'home' | 'logbook' | 'planning' | 'memory'
```

to:

```ts
'home' | 'logbook' | 'planning' | 'settings'
```

The bottom bar should render four tabs:

- Home
- Logbook
- Plan
- Settings

The top-level Memory tab should be removed. Any current Home or Memory shortcut that depends on top-level Memory should be removed or redirected to Logbook. A small Logbook entry point for future sharing or memory preview is acceptable, but the full Memory workflow should be left for a separate design.

## Settings Screen

Add `src/screens/settings/screen.tsx`.

The Settings screen should follow the existing mobile UI language:

- grouped iOS-style list
- quiet `bg-background` page
- `bg-card` grouped rows
- semantic tokens only
- no nested cards
- no new UI framework or navigation dependency

The screen owns a small local route state:

```ts
type SettingsRoute = 'index' | 'theme' | 'language';
```

### Index Route

The index route shows:

- title: Settings
- short subtitle explaining local app preferences
- `Appearance` group
- `Theme` row with current value and chevron
- `Language` row with current value and chevron

Rows should be pressable and accessible. Each row should have a stable minimum height and enough right-side space for the current value and chevron.

### Theme Detail Route

The Theme detail route shows:

- back affordance: `‹ Settings`
- title: Theme
- optional short subtitle
- rows for System default, Light, Dark
- current selection marked with a check indicator and primary text

Selecting a row updates the app theme immediately.

### Language Detail Route

The Language detail route shows:

- back affordance: `‹ Settings`
- title: Language
- rows for 한국어 and English
- current selection marked with a check indicator and primary text

Selecting a row calls `i18n.changeLanguage` and updates visible UI text immediately. The existing Home language menu should be removed so language has only one app-level owner.

## Preferences Provider

Add a small app preference boundary under `src/`.

Suggested shape:

```ts
type ThemePreference = 'system' | 'light' | 'dark';

type AppPreferences = {
  themePreference: ThemePreference;
  resolvedTheme: 'light' | 'dark';
  language: SupportedLanguage;
  setThemePreference: (value: ThemePreference) => void;
  setLanguage: (value: SupportedLanguage) => Promise<void>;
};
```

`Providers` should wrap the app with this provider, then pass `resolvedTheme` to `GluestackUIProvider mode`.

`resolvedTheme` behavior:

- `light` resolves to `light`
- `dark` resolves to `dark`
- `system` follows React Native `useColorScheme()`
- if the system color scheme is unavailable or unsupported, fallback to `light`

`StatusBar` should follow `resolvedTheme`:

- light theme: `dark-content`
- dark theme: `light-content`

Language should reuse the existing `SupportedLanguage` type and `resolveSupportedLanguage` helper. The provider should initialize language from the current `i18n.resolvedLanguage` or `i18n.language`, then normalize it through `resolveSupportedLanguage`.

## Deferred Persistence Work

Initial implementation intentionally does not persist theme or language preferences.

This deferred work applies only to persistence. Settings UI, in-memory preference state, runtime theme switching, and runtime language switching should be implemented now.

The persistence gap should be recorded in code and handoff notes as an explicit deferred task, not an accidental omission. The reason is that the mobile app currently has no production persistence boundary for logbook data, sessions, auth, or user settings. Adding settings-only persistence now would force an isolated storage decision before the app has decided how local mobile persistence should work.

Future persistence should be added behind the `AppPreferencesProvider` boundary, so screens do not change when storage is introduced. Candidate future work:

- choose the mobile persistence layer together with logbook/session persistence
- load stored theme and language before or during provider initialization
- save preference changes inside the provider
- define migration behavior for unsupported stored values

Until that future work exists, preferences reset on app reload.

## Error Handling

- Unsupported language values should normalize through `resolveSupportedLanguage`, which falls back to Korean.
- If `i18n.changeLanguage` rejects, keep the current language selection and leave the app in its previous language.
- Theme values should be constrained by TypeScript enum-like unions.
- `system` theme fallback should be light when device color scheme is unavailable.

## I18n Copy

Add Korean and English translation keys for:

- navigation.settings
- settings.title
- settings.subtitle
- settings.appearance
- settings.theme.title
- settings.theme.subtitle
- settings.theme.system
- settings.theme.systemDescription
- settings.theme.light
- settings.theme.lightDescription
- settings.theme.dark
- settings.theme.darkDescription
- settings.language.title
- settings.language.subtitle
- settings.language.korean
- settings.language.english
- settings.backToSettings

Existing Home language menu translation keys can remain until no longer referenced, but the Home language menu UI should be removed.

## Testing

Use the smallest mobile gates first.

Unit and renderer tests should cover:

- preferences provider default behavior
- `system` theme resolving to light fallback when no supported device scheme exists
- `GluestackUIProvider mode` receiving the resolved theme
- `StatusBar` receiving the correct bar style
- bottom navigation rendering four tabs and no top-level Memory tab
- Settings index rendering Theme and Language rows with current values
- Theme detail changing selected theme
- Language detail changing i18n language
- Home no longer rendering the language menu trigger

Existing language menu tests should be replaced with Settings language tests rather than kept as stale coverage.

Verification command:

```bash
yarn mobile:typecheck
```

If test files are changed, also run:

```bash
yarn workspace @repo/mobile test
```

## Open Implementation Notes

- Keep Settings-specific row components local to `settings/screen.tsx` until another screen needs them.
- Use existing `Box`, `HStack`, `VStack`, and `Text` primitives.
- Use semantic token classes instead of raw colors.
- Do not add icons unless the app already has an icon dependency at implementation time.
- Use simple text marks such as `Aa`, `A`, or a check indicator if needed.
- Keep safety-related copy out of Settings except for future About or assistant-boundary rows, which are out of scope for the first implementation.
