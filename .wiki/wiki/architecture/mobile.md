# Mobile Architecture

## Summary

`apps/mobile` is a bare React Native app for reviewing watch-captured recreational dive logs. It currently uses local React state and generated watch contract TypeScript types rather than a server, database, or navigation library.

## Current state

The app package is `@repo/mobile`. It pins React Native `0.85.3`, React `19.2.3`, TypeScript, Jest, Metro, and `react-native-safe-area-context`.

Key source boundaries:

- `src/App.tsx`: app UI entry.
- `src/providers.tsx`: top-level `SafeAreaProvider` and status bar.
- `src/components/navigation/index.tsx`: custom bottom-tab navigation state.
- `src/components/ui/`: reusable UI primitives, instrument controls, session cards, profile charts, and theme tokens.
- `src/screens/home`, `src/screens/logbook`, `src/screens/planning`, `src/screens/memory`: route-level screen containers.
- `src/states/use-dive-logbook.ts`: local logbook state, search filter, and fixture import action.
- `src/types/dive-session.ts`: mobile session types built from generated watch contract types.

## Details

The current mobile UI has four sections:

- Home: latest imported watch session, high-level metrics, and safety assistant copy.
- Logbook: imported session list, search, sync-status filter, detail metrics, depth profile, temperature profile, notes, tags, and media placeholders.
- Planning: manual planning reminders using the latest imported session as context.
- Memory: static share-card and safe analytics preview.

`importWatchMessages` deduplicates imported sessions by `localSessionId` plus `endedAt`, adds an `importKey`, preserves an existing `importedAt`, defaults missing sync status to `pending`, and sorts sessions by `startedAt` descending.

Current limitations:

- No authentication.
- No Supabase client.
- No direct SQL.
- No production mobile persistence.
- No live WatchConnectivity integration.
- No certified dive-computer behavior.

The iOS project is present at `apps/mobile/ios/DiveMobile.xcworkspace`; the build wrapper checks CocoaPods artifacts and builds with signing disabled. Android native project files are present under `apps/mobile/android`.

## Related pages

- [[architecture/sync-flow]]
- [[architecture/supabase]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
