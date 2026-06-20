# Mobile Architecture

## Summary

`apps/mobile`은 watch-captured recreational dive log를 review하기 위한 bare React Native app이다. 현재는 server, database, navigation library 없이 local React state, generated watch contract TypeScript type, Gluestack UI v4/NativeWind styling stack을 사용한다.

## Current state

App package는 `@repo/mobile`이다. 현재 dependency는 React Native `0.85.3`, React `19.2.3`, TypeScript, Jest, Metro, `react-native-safe-area-context`, Gluestack UI v4 alpha package, NativeWind, Tailwind CSS, Reanimated, Worklets, React Native SVG를 포함한다.

주요 source boundary는 다음과 같다.

- `src/App.tsx`: app UI entry.
- `src/providers.tsx`: top-level `SafeAreaProvider`, `GluestackUIProvider`, `StatusBar`.
- `src/components/navigation/index.tsx`: custom bottom-tab navigation state.
- `src/components/ui/`: reusable UI primitive, instrument control, session card, profile chart, tone type.
- `components/ui/gluestack-ui-provider/`: generated Gluestack provider, color-mode script, token bridge.
- `global.css`, `tailwind.config.js`: NativeWind/Tailwind entrypoint와 semantic token configuration.
- `src/screens/home`, `src/screens/logbook`, `src/screens/planning`, `src/screens/memory`: route-level screen container.
- `src/states/use-dive-logbook.ts`: local logbook state, search filter, fixture import action.
- `src/types/dive-session.ts`: generated watch contract type 기반 mobile session type.
- `src/utils/`: formatter, watch fixture import, session summary 계산.

## Details

현재 mobile UI는 네 section으로 구성된다.

- Home: latest imported watch session, high-level metric, safety assistant copy.
- Logbook: imported session list, search, sync-status filter, detail metric, depth profile, temperature profile, notes, tags, media placeholder.
- Planning: latest imported session을 context로 쓰는 manual planning reminder.
- Memory: static share-card와 review-only analytics preview.

Styling rule은 현재 code 기준으로 다음과 같다.

- `className`과 semantic token을 우선 사용한다. 예: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, `bg-secondary`, `bg-accent`, `bg-destructive`.
- Reusable component state와 tone variant에는 local `tva` variant를 사용한다.
- Inline `style`은 safe-area inset, chart bar height, pressed-state transform처럼 runtime value가 필요한 경우로 제한한다.
- Mobile UI code에 raw hex color, numbered gray/slate/neutral palette, `typography-*` token, opacity utility를 다시 늘리지 않는다.

`importWatchMessages`는 imported session을 `localSessionId`와 `endedAt` 기반 `importKey`로 deduplicate한다. Existing `importedAt`은 보존하고, missing sync status는 `pending`으로 default하며, 결과는 `startedAt` descending으로 정렬한다.

현재 limitation은 다음과 같다.

- Authentication 없음.
- Supabase client 없음.
- Direct SQL 없음.
- Production mobile persistence 없음.
- Live WatchConnectivity integration 없음.
- Certified dive-computer behavior 없음.

iOS project는 `apps/mobile/ios/DiveMobile.xcworkspace`에 있다. Build wrapper는 CocoaPods artifact를 확인하고 signing disabled 상태로 build한다. Android native project file은 `apps/mobile/android` 아래에 있다.

## Related pages

- [[architecture/sync-flow]]
- [[architecture/supabase]]
- [[domains/dive-log]]
- [[domains/safety-rules]]
